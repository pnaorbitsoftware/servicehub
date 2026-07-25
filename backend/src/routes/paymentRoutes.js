import crypto from "crypto";
import express from "express";
import mongoose from "mongoose";

import {
  createRazorpayOrder as createRazorpayGatewayOrder,
  createRazorpayXContact,
  createRazorpayXFundAccount,
  createRazorpayXPayout,
} from "../config/razorpay.js";
import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Ledger from "../models/Ledger.js";
import Payment from "../models/Payment.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import {
  applyPaymentSplit,
  buildProviderPaymentSummary,
  DEFAULT_PROVIDER_SHARE_PERCENT,
  getProviderPayoutAmount,
} from "../utils/paymentSummary.js";
import { sendPushNotification } from "../utils/pushNotifications.js";
import { emitStatusChange } from "../socket/trackingSocket.js";

const router = express.Router();

const rejectionPenaltyAmount = 200;
const providerSharePercentage = 80;
const platformFeePercentage = 20;

const sendError = (res, status, message, error = undefined) =>
  res.status(status).json({
    success: false,
    message,
    ...(error ? { error } : {}),
  });

const requireClient = (req, res, next) => {
  if (req.user.role !== "user") {
    return sendError(res, 403, "Client access required.");
  }

  next();
};

const requireProvider = (req, res, next) => {
  if (req.user.role !== "provider") {
    return sendError(res, 403, "Provider access required.");
  }

  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return sendError(res, 403, "Admin access required.");
  }

  next();
};

const idsMatch = (left, right) =>
  Boolean(left && right && left.toString() === right.toString());

const getPaymentProviderId = (booking) =>
  booking.assignedProvider || booking.requestedProvider || booking.estimateSubmittedBy || null;

const parsePriceAmount = (value = "") => {
  const normalized = String(value).replace(/,/g, "");
  const amount = normalized.match(/\d+(\.\d+)?/)?.[0];
  return Number.isFinite(Number(amount)) ? Number(amount) : 0;
};

const getProviderStartingAmount = async (providerId) => {
  if (!providerId) return 0;
  const provider = await Provider.findById(providerId).select("price");
  return parsePriceAmount(provider?.price);
};

const getPayableEstimateAmount = async (booking) => {
  const providerId = getPaymentProviderId(booking);
  const startingAmount = await getProviderStartingAmount(providerId);
  const estimateHistory = Array.isArray(booking.estimateHistory) ? booking.estimateHistory : [];
  const latestAcceptedEntry = estimateHistory.slice().reverse().find((entry) => entry.status === "accepted");
  const providerEstimateAmount = Number(latestAcceptedEntry?.amount || booking.finalEstimateAmount || 0);
  const fallbackAmount = Number(booking.costEstimate || 0);

  if (Number.isFinite(providerEstimateAmount) && providerEstimateAmount > 0) {
    return providerEstimateAmount + startingAmount;
  }

  return Number.isFinite(fallbackAmount) ? fallbackAmount : 0;
};

const ensureRazorpayConfigured = (res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

  if (
    !keyId ||
    !keySecret ||
    keyId === "your_test_key_id" ||
    keySecret === "your_test_key_secret"
  ) {
    sendError(res, 500, "Razorpay test keys are missing. Add real test keys in backend .env and restart the server.");
    return false;
  }

  return true;
};

const ensureRazorpayXConfigured = (res) => {
  const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER || "";

  if (!ensureRazorpayConfigured(res)) return false;

  if (!accountNumber || accountNumber === "your_razorpayx_account_number") {
    sendError(
      res,
      500,
      "RazorpayX account number is missing. Add RAZORPAYX_ACCOUNT_NUMBER in backend .env. Use live RazorpayX credentials for actual bank transfer."
    );
    return false;
  }

  return true;
};

const mapRazorpayPayoutStatus = (status = "") =>
  ["processed", "reversed"].includes(status) ? "completed" : status === "failed" ? "failed" : "pending";

const appendEstimateHistory = (booking, amount, providerId, status, note = "") => {
  booking.estimateHistory = booking.estimateHistory || [];
  const entry = {
    amount,
    submittedBy: providerId,
    submittedAt: new Date(),
    status,
    statusAt: status === "submitted" ? null : new Date(),
    note,
  };
  booking.estimateHistory.push(entry);
  return entry;
};

router.post("/bookings/:bookingId/estimate", requireAuth, requireProvider, async (req, res) => {
  try {
    const finalEstimateAmount = Number(req.body.finalEstimateAmount);

    if (!Number.isFinite(finalEstimateAmount) || finalEstimateAmount <= 0) {
      return sendError(res, 400, "Final estimate amount must be greater than 0.");
    }

    const provider = await Provider.findOne({ owner: req.user._id }).select("_id name").lean();

    if (!provider) {
      return sendError(res, 404, "Provider profile not found.");
    }

    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return sendError(res, 404, "Booking not found.");
    }

    const canSubmitEstimate =
      idsMatch(booking.assignedProvider, provider._id) ||
      idsMatch(booking.requestedProvider, provider._id);

    if (!canSubmitEstimate) {
      return sendError(res, 403, "You can submit an estimate only for your assigned booking.");
    }

    if (["completed", "cancelled"].includes(booking.status)) {
      return sendError(res, 400, "Completed or cancelled bookings cannot update the final estimate.");
    }

    if (booking.estimateStatus === "rejected" || booking.paymentStatus === "penalty_applied") {
      return sendError(res, 400, "Cannot submit a new estimate after a rejected estimate has already been processed.");
    }

    if (booking.paymentStatus === "paid") {
      return sendError(res, 400, "Final estimate cannot be updated after client payment.");
    }

    if (!["arrived", "job_started"].includes(booking.status)) {
      return sendError(res, 400, "Mark arrived before sending the final estimate.");
    }

    booking.finalEstimateAmount = finalEstimateAmount;
    booking.estimateSubmittedBy = provider._id;
    booking.estimateSubmittedAt = new Date();
    booking.estimateStatus = "submitted";
    booking.paymentStatus = "unpaid";
    booking.razorpayOrderId = "";
    booking.razorpayPaymentId = "";
    appendEstimateHistory(booking, finalEstimateAmount, provider._id, "submitted");
    await booking.save();

    // Send push notification to client
    try {
      const client = await User.findById(booking.user).lean();
      sendPushNotification({
        tokens: client?.expoPushTokens || [],
        title: "Estimate received",
        body: `${provider?.name || "Provider"} sent ₹${booking.finalEstimateAmount} estimate for ${booking.service}.`,
        data: {
          type: "estimate",
          bookingId: String(booking._id),
          status: "estimate-submitted",
        },
      });
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
    }

    res.json({
      success: true,
      message: "Estimate submitted successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Estimate could not be submitted.",
      error: error.message,
    });
  }
});

router.patch("/bookings/:bookingId/estimate/accept", requireAuth, requireClient, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });

    if (!booking) {
      return sendError(res, 404, "Booking not found.");
    }

    if (booking.estimateStatus !== "submitted") {
      return sendError(res, 400, "Only submitted estimates can be accepted.");
    }

    const latestEntry = Array.isArray(booking.estimateHistory) && booking.estimateHistory.length
      ? booking.estimateHistory[booking.estimateHistory.length - 1]
      : null;

    if (latestEntry) {
      latestEntry.status = "accepted";
      latestEntry.statusAt = new Date();
    }

    booking.estimateStatus = "accepted";
    booking.paymentStatus = "unpaid";
    await booking.save();

    res.json({
      success: true,
      message: "Estimate accepted. Please complete payment.",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Estimate could not be accepted.",
      error: error.message,
    });
  }
});

router.patch("/bookings/:bookingId/estimate/reject", requireAuth, requireClient, async (req, res) => {
  try {
    const rejectionReason = String(req.body.rejectionReason || "").trim();
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });

    if (!booking) {
      return sendError(res, 404, "Booking not found.");
    }

    if (booking.estimateStatus !== "submitted") {
      return sendError(res, 400, "Only submitted estimates can be rejected.");
    }

    const providerId = getPaymentProviderId(booking);
    const latestEntry = Array.isArray(booking.estimateHistory) && booking.estimateHistory.length
      ? booking.estimateHistory[booking.estimateHistory.length - 1]
      : null;

    if (latestEntry) {
      latestEntry.status = "rejected";
      latestEntry.statusAt = new Date();
      latestEntry.note = rejectionReason;
    }

    booking.estimateStatus = "rejected";
    booking.paymentStatus = "penalty_applied";
    booking.clientRejectionPenalty = rejectionPenaltyAmount;
    booking.cancellationReason = rejectionReason;
    await booking.save();

    const payment = await Payment.create({
      booking: booking._id,
      user: req.user._id,
      provider: providerId,
      amount: rejectionPenaltyAmount,
      currency: "INR",
      status: "penalty_applied",
      paymentMethod: "penalty",
      penaltyAmount: rejectionPenaltyAmount,
      rejectionReason,
      rejectedAt: new Date(),
    });

    await Ledger.create({
      booking: booking._id,
      payment: payment._id,
      user: req.user._id,
      provider: providerId,
      type: "client_penalty",
      amount: rejectionPenaltyAmount,
      direction: "credit",
      description: "Client rejected provider estimate. Penalty applied.",
      status: "completed",
      metadata: { rejectionReason },
    });

    res.json({
      success: true,
      message: "Estimate rejected. Rs. 200 penalty applied.",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Estimate could not be rejected.",
      error: error.message,
    });
  }
});

router.post("/create-order", requireAuth, requireClient, async (req, res) => {
  try {
    if (!ensureRazorpayConfigured(res)) return;

    const { bookingId } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });

    if (!booking) {
      return sendError(res, 404, "Booking not found.");
    }

    if (booking.estimateStatus !== "accepted") {
      return sendError(res, 400, "Please accept the provider estimate before payment.");
    }

    if (booking.paymentStatus === "paid") {
      return sendError(res, 409, "This booking is already paid.");
    }

    const amount = await getPayableEstimateAmount(booking);

    if (!Number.isFinite(amount) || amount <= 0) {
      return sendError(res, 400, "Valid payment amount is required.");
    }

    const providerId = getPaymentProviderId(booking);
    const order = await createRazorpayGatewayOrder({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        providerId: providerId?.toString() || "",
      },
    });

    await Payment.findOneAndUpdate(
      {
        booking: booking._id,
        user: req.user._id,
        paymentMethod: "razorpay",
      },
      {
        booking: booking._id,
        user: req.user._id,
        provider: providerId,
        amount,
        currency: "INR",
        razorpayOrderId: order.id,
        status: "order_created",
        paymentMethod: "razorpay",
        providerShare: 0,
        platformFee: 0,
        platformFeePercentage,
        providerSharePercentage,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    booking.paymentStatus = "order_created";
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      success: true,
      message: "Razorpay order created successfully",
      gateway: "razorpay",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount,
      amountPaise: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Razorpay order could not be created.",
      error: error.message,
    });
  }
});

router.post("/verify", requireAuth, requireClient, async (req, res) => {
  try {
    if (!ensureRazorpayConfigured(res)) return;

    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, 400, "Payment verification details are required.");
    }

    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });

    if (!booking) {
      return sendError(res, 404, "Booking not found.");
    }

    if (booking.paymentStatus === "paid") {
      return sendError(res, 409, "This booking is already paid.");
    }

    const payment = await Payment.findOne({
      booking: booking._id,
      user: req.user._id,
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return sendError(res, 404, "Payment order not found.");
    }

    if (payment.status === "paid") {
      return sendError(res, 409, "This payment is already verified.");
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      payment.status = "failed";
      payment.failedAt = new Date();
      await payment.save();

      booking.paymentStatus = "failed";
      await booking.save();

      return sendError(res, 400, "Invalid Razorpay payment signature.");
    }

    const amount = Number(payment.amount);
    const providerShare = Math.round(amount * (providerSharePercentage / 100));
    const platformFee = amount - providerShare;
    const paidAt = new Date();

    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.providerShare = providerShare;
    payment.platformFee = platformFee;
    payment.paidAt = paidAt;
    const updatedPayment = await payment.save();

    booking.paymentStatus = "paid";
    booking.clientPaymentStatus = "paid";
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.providerShare = providerShare;
    booking.platformFee = platformFee;
    booking.paymentCompletedAt = paidAt;
    if (["pending", "accepted", "assigned"].includes(booking.status)) {
      booking.status = "accepted";
    }
    const updatedBooking = await booking.save();
    emitStatusChange(req.app.get("io"), updatedBooking);

    await Ledger.insertMany([
      {
        booking: booking._id,
        payment: payment._id,
        user: req.user._id,
        provider: payment.provider,
        type: "payment_received",
        amount,
        direction: "credit",
        description: "Payment received from client",
        status: "completed",
      },
      {
        booking: booking._id,
        payment: payment._id,
        user: req.user._id,
        provider: payment.provider,
        type: "provider_credit",
        amount: providerShare,
        direction: "credit",
        description: "80% provider earning credited",
        status: "completed",
      },
      {
        booking: booking._id,
        payment: payment._id,
        user: req.user._id,
        provider: payment.provider,
        type: "platform_fee",
        amount: platformFee,
        direction: "credit",
        description: "20% platform commission credited",
        status: "completed",
      },
    ]);

    if (payment.provider) {
      await Provider.findByIdAndUpdate(payment.provider, {
        $inc: {
          paidEarnings: providerShare,
          totalEarnings: providerShare,
        },
      });
    }

    // Send push notifications
    try {
      const providerDoc = booking.assignedProvider ? await Provider.findById(booking.assignedProvider).populate("owner") : null;
      sendPushNotification({
        tokens: req.user.expoPushTokens || [],
        title: "Payment completed",
        body: `Payment completed for ${booking.service}. Your provider can start the work now.`,
        data: {
          type: "payment",
          bookingId: String(booking._id),
          status: "paid",
        },
      });

      sendPushNotification({
        tokens: providerDoc?.owner?.expoPushTokens || [],
        title: "Client payment received",
        body: `${booking.name} completed payment for ${booking.service}. You can start the service.`,
        data: {
          type: "payment",
          bookingId: String(booking._id),
          status: "paid",
        },
      });
    } catch (pushError) {
      console.error("Failed to send push notifications:", pushError);
    }

    await updatedBooking.populate([
      { path: "assignedProvider", select: "name category location phone price responseTime rating reviews" },
      { path: "requestedProvider", select: "name category location phone price responseTime rating reviews" },
    ]);

    res.json({
      success: true,
      message: "Payment verified successfully",
      payment: updatedPayment,
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment verification failed.",
      error: error.message,
    });
  }
});

router.get("/my", requireAuth, requireClient, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate({ path: "booking", select: "-workImage" })
      .populate("provider", "name category location phone price rating reviews")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      message: "Payment history loaded successfully",
      payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment history could not be loaded.",
      error: error.message,
    });
  }
});

router.get("/provider/earnings", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id }).lean();

    if (!provider) {
      return sendError(res, 404, "Provider profile not found.");
    }

    const providerObjectId = new mongoose.Types.ObjectId(provider._id);

    const [[paymentSummary = {}], [ledgerSummary = {}]] = await Promise.all([
      Payment.aggregate([
        { $match: { provider: providerObjectId } },
        {
          $group: {
            _id: null,
            totalPaidEarnings: {
              $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$providerShare", 0] },
            },
            totalPlatformFee: {
              $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$platformFee", 0] },
            },
            pendingPaymentAmount: {
              $sum: { $cond: [{ $in: ["$status", ["pending", "order_created"]] }, "$amount", 0] },
            },
            totalBookingsPaid: {
              $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
            },
          },
        },
      ]),
      Ledger.aggregate([
        { $match: { provider: providerObjectId } },
        {
          $group: {
            _id: null,
            adminReleasedAmount: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ["$type", "payout"] }, { $eq: ["$status", "completed"] }] },
                  "$amount",
                  0,
                ],
              },
            },
            withdrawnAmount: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ["$type", "provider_withdrawal"] }, { $in: ["$status", ["pending", "completed"]] }] },
                  "$amount",
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const totalPaidEarnings = Number(paymentSummary.totalPaidEarnings || 0);
    const totalPlatformFee = Number(paymentSummary.totalPlatformFee || 0);
    const pendingEarnings = Math.round(Number(paymentSummary.pendingPaymentAmount || 0) * 0.8);
    const adminReleasedAmount = Number(ledgerSummary.adminReleasedAmount || 0);
    const withdrawnAmount = Number(ledgerSummary.withdrawnAmount || 0);
    const availableToWithdraw = Math.max(adminReleasedAmount - withdrawnAmount, 0);

    res.json({
      success: true,
      message: "Provider earnings loaded successfully",
      summary: {
        totalPaidEarnings,
        adminReleasedAmount,
        withdrawnAmount,
        availableToWithdraw,
        pendingEarnings,
        totalBookingsPaid: Number(paymentSummary.totalBookingsPaid || 0),
        totalPlatformFee,
      },
      earnings: [],
      payouts: [],
      withdrawals: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Provider earnings could not be loaded.",
      error: error.message,
    });
  }
});

router.post("/provider/withdraw", requireAuth, requireProvider, async (req, res) => {
  try {
    if (!ensureRazorpayXConfigured(res)) return;

    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return sendError(res, 404, "Provider profile not found.");
    }

    const { accountHolder, bankName, accountNumber, ifscCode } = req.body || {};
    if (!accountHolder || !bankName || !accountNumber || !ifscCode) {
      return sendError(res, 400, "Account holder, bank name, account number, and IFSC code are required.");
    }

    const cleanAccountNumber = String(accountNumber).replace(/\s+/g, "");
    const cleanIfscCode = String(ifscCode).trim().toUpperCase();

    const [payoutEntries, withdrawalEntries] = await Promise.all([
      Ledger.find({ provider: provider._id, type: "payout", status: "completed" }),
      Ledger.find({ provider: provider._id, type: "provider_withdrawal", status: { $in: ["pending", "completed"] } }),
    ]);

    const adminReleasedAmount = payoutEntries.reduce((total, entry) => total + (entry.amount || 0), 0);
    const withdrawnAmount = withdrawalEntries.reduce((total, entry) => total + (entry.amount || 0), 0);
    const availableToWithdraw = Math.max(adminReleasedAmount - withdrawnAmount, 0);

    if (availableToWithdraw <= 0) {
      return sendError(res, 400, "No released money is available to withdraw.");
    }

    const contact = await createRazorpayXContact({
      name: accountHolder,
      email: req.user.email,
      contact: provider.phone || req.user.phone || "",
      type: "vendor",
      reference_id: provider._id.toString(),
      notes: {
        providerId: provider._id.toString(),
        providerName: provider.name,
      },
    });

    const fundAccount = await createRazorpayXFundAccount({
      contact_id: contact.id,
      account_type: "bank_account",
      bank_account: {
        name: accountHolder,
        ifsc: cleanIfscCode,
        account_number: cleanAccountNumber,
      },
    });

    const idempotencyKey = `provider_${provider._id}_${Date.now()}`;
    const razorpayPayout = await createRazorpayXPayout(
      {
        account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
        fund_account_id: fundAccount.id,
        amount: Math.round(availableToWithdraw * 100),
        currency: "INR",
        mode: "IMPS",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: `withdraw_${provider._id}_${Date.now()}`,
        narration: "ServiceHub payout",
        notes: {
          providerId: provider._id.toString(),
          providerName: provider.name,
        },
      },
      idempotencyKey
    );

    const withdrawal = await Ledger.create({
      provider: provider._id,
      type: "provider_withdrawal",
      amount: availableToWithdraw,
      direction: "debit",
      description: `RazorpayX payout sent to ${provider.name}`,
      status: mapRazorpayPayoutStatus(razorpayPayout.status),
      metadata: {
        accountHolder,
        bankName,
        accountNumberLast4: cleanAccountNumber.slice(-4),
        ifscCode: cleanIfscCode,
        razorpayContactId: contact.id,
        razorpayFundAccountId: fundAccount.id,
        razorpayPayoutId: razorpayPayout.id,
        razorpayPayoutStatus: razorpayPayout.status,
        razorpayPayoutMode: razorpayPayout.mode,
        requestedBy: req.user._id,
        withdrawnAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `RazorpayX payout of Rs. ${availableToWithdraw} created. Status: ${razorpayPayout.status}.`,
      withdrawal,
      razorpayPayout,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Withdrawal could not be completed.",
      error: error.message,
    });
  }
});

router.get("/admin/ledger", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [payments, ledgers] = await Promise.all([
      Payment.find()
        .populate("booking")
        .populate("user", "name email phone role")
        .populate("provider", "name category location phone")
        .sort({ createdAt: -1 }),
      Ledger.find()
        .populate("booking")
        .populate("payment")
        .populate("user", "name email phone role")
        .populate("provider", "name category location phone")
        .sort({ createdAt: -1 })
        .limit(100),
    ]);

    const paidPayments = payments.filter((payment) => payment.status === "paid");
    const pendingPayments = payments.filter((payment) =>
      ["pending", "order_created"].includes(payment.status)
    );
    const failedPayments = payments.filter((payment) => payment.status === "failed");
    const rejectedPayments = payments.filter((payment) =>
      ["rejected", "penalty_applied"].includes(payment.status)
    );

    const grossRevenue = paidPayments.reduce(
      (total, payment) => total + (payment.amount || 0),
      0
    );
    const platformRevenue = payments.reduce(
      (total, payment) => total + (payment.platformFee || 0),
      0
    );
    const providerPayable = paidPayments.reduce(
      (total, payment) => total + (payment.providerShare || 0),
      0
    );
    const paidOutByProvider = ledgers
      .filter((entry) => entry.type === "payout" && ["pending", "completed"].includes(entry.status))
      .reduce((map, entry) => {
        const providerId = entry.provider?._id?.toString() || entry.provider?.toString() || "unassigned";
        map.set(providerId, (map.get(providerId) || 0) + (entry.amount || 0));
        return map;
      }, new Map());
    const providerPaidOut = [...paidOutByProvider.values()].reduce((total, amount) => total + amount, 0);
    const providerPayableRemaining = Math.max(providerPayable - providerPaidOut, 0);
    const providerPayoutMap = new Map();
    paidPayments.forEach((payment) => {
      const provider = payment.provider;
      const providerId = provider?._id?.toString() || payment.provider?.toString() || "unassigned";
      const paidAt = payment.paidAt || payment.updatedAt || payment.createdAt;
      const availableAt = paidAt ? new Date(paidAt) : null;
      const isReady = true;
      const providerShare = payment.providerShare || 0;

      if (!providerPayoutMap.has(providerId)) {
        providerPayoutMap.set(providerId, {
        providerId,
        name: provider?.name || "Provider not assigned",
        category: provider?.category || "",
        phone: provider?.phone || "",
        totalPayable: 0,
        paidOut: paidOutByProvider.get(providerId) || 0,
        readyToWithdraw: 0,
        pendingRelease: 0,
        paidBookings: 0,
        nextAvailableAt: null,
        payments: [],
      });
    }

      const payout = providerPayoutMap.get(providerId);
      payout.totalPayable += providerShare;
      payout.paidBookings += 1;
      payout.payments.push({
        paymentId: payment._id,
        bookingId: payment.booking?._id || payment.booking,
        booking: payment.booking?.service || "Booking",
        client: payment.user?.name || payment.booking?.userName || "Client",
        amount: payment.amount || 0,
          providerShare,
          paidOutShare: 0,
          paidAt,
          availableAt,
          isReady,
          razorpayPaymentId: payment.razorpayPaymentId || "",
      });

      payout.readyToWithdraw += providerShare;
    });

    const providerPayouts = [...providerPayoutMap.values()]
      .map((payout) => {
        const paidOut = payout.paidOut || 0;
        const remainingPayable = Math.max(payout.totalPayable - paidOut, 0);
        let paidOutBalance = paidOut;
        const payments = payout.payments
          .sort((a, b) => new Date(a.paidAt || 0) - new Date(b.paidAt || 0))
          .map((payment) => {
            const paidOutShare = Math.min(payment.providerShare || 0, paidOutBalance);
            paidOutBalance -= paidOutShare;
            return {
              ...payment,
              paidOutShare,
              remainingShare: Math.max((payment.providerShare || 0) - paidOutShare, 0),
              payoutStatus: paidOutShare >= (payment.providerShare || 0) ? "money_sent" : "ready_to_send",
            };
          })
          .sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0));
        return {
          ...payout,
          totalPayable: remainingPayable,
          readyToWithdraw: remainingPayable,
          pendingRelease: 0,
          nextAvailableAt: null,
          payments,
        };
      })
      .filter((payout) => payout.totalPayable > 0)
      .sort((a, b) => b.totalPayable - a.totalPayable);
    const penaltyCollected = payments.reduce(
      (total, payment) => total + (payment.penaltyAmount || 0),
      0
    );

    res.json({
      success: true,
      message: "Admin payment ledger loaded successfully",
      overview: {
        grossRevenue,
        platformRevenue,
        providerPayable: providerPayableRemaining,
        providerPaidOut,
        penaltyCollected,
        paidPayments: paidPayments.length,
        pendingPayments: pendingPayments.length,
        failedPayments: failedPayments.length,
        rejectedPayments: rejectedPayments.length,
      },
      providerPayouts,
      providerPayoutHistory: ledgers
        .filter((entry) => entry.type === "payout")
        .map((entry) => ({
          id: entry._id,
          providerId: entry.provider?._id || entry.provider || "",
          providerName: entry.provider?.name || "Provider not assigned",
          providerCategory: entry.provider?.category || "",
          amount: entry.amount || 0,
          status: entry.status,
          createdAt: entry.createdAt,
          description: entry.description,
          metadata: entry.metadata || {},
        })),
      recentPayments: payments.slice(0, 50),
      ledgerEntries: ledgers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin payment ledger could not be loaded.",
      error: error.message,
    });
  }
});

router.post("/admin/providers/:providerId/payout", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { providerId } = req.params;
    const provider = await Provider.findById(providerId);

    if (!provider) {
      return sendError(res, 404, "Provider not found.");
    }

    const paidPaymentQuery = {
      status: "paid",
      $or: [
        { provider: providerId },
        { provider: provider._id },
      ],
    };

    const [paidPayments, payoutEntries] = await Promise.all([
      Payment.find(paidPaymentQuery).populate("booking"),
      Ledger.find({ provider: providerId, type: "payout", status: { $in: ["pending", "completed"] } }),
    ]);

    const readyAmount = paidPayments.reduce((total, payment) => total + (payment.providerShare || 0), 0);
    const alreadyPaidOut = payoutEntries.reduce((total, entry) => total + (entry.amount || 0), 0);
    const payoutAmount = Math.max(readyAmount - alreadyPaidOut, 0);

    if (payoutAmount <= 0) {
      return sendError(
        res,
        400,
        `No remaining payout is available for ${provider.name}. Paid share: ${readyAmount}, already sent: ${alreadyPaidOut}.`
      );
    }

    const payout = await Ledger.create({
      provider: providerId,
      type: "payout",
      amount: payoutAmount,
      direction: "debit",
      description: `Admin released provider balance to ${provider.name}`,
      status: "completed",
      metadata: {
        releasedImmediately: true,
        sentBy: req.user._id,
        sentAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `Rs. ${payoutAmount} released to ${provider.name}. Provider can withdraw it from the provider dashboard.`,
      payout,
      provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Provider payout could not be sent.",
      error: error.message,
    });
  }
});

export default router;
