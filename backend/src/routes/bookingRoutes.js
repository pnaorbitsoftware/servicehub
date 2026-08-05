import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import { sendPushNotification } from "../utils/pushNotifications.js";
import {
  sendBookingEmail,
  sendCustomerCancellationEmail,
  sendProviderRequestEmail,
} from "../services/mailService.js";
import { sendProviderBookingNotification } from "../services/notificationService.js";
import {
  sendBookingConfirmationWhatsApp,
  sendProviderRequestWhatsApp,
} from "../services/whatsappNotificationService.js";
import { buildStatusUpdateOperation, isWorkflowBookingStatus, normalizeBookingStatus } from "../services/bookingTrackingService.js";
import { emitStatusChange, getProviderRoomId } from "../socket/trackingSocket.js";
import { bookingLookup, buildPointLocation, publicLocation } from "../utils/location.js";
import { applyPaymentSplit } from "../utils/paymentSummary.js";
import { normalizeServiceName } from "../utils/serviceMatching.js";
import { ensureTrackingHistory } from "../utils/tracking.js";

const router = express.Router();

const durationCostMap = {
  "30 min": 199,
  "30 minutes": 199,
  "1 hour": 299,
  "2 hours": 549,
  "3 hours": 799,
  "Half day": 1499,
  "Full day": 2499,
};

// Once the provider is actively en route or working, cancelling becomes disruptive
// (they may already be travelling), so it's blocked at that point. Before that —
// while the booking is only pending/accepted/confirmed/assigned — the client can
// always cancel, regardless of how long ago it was accepted. This replaces an
// earlier arbitrary "within 10 minutes of acceptance" rule that incorrectly
// blocked cancelling bookings scheduled for a future date/time.
const IN_PROGRESS_STATUSES = ["on_the_way", "en_route", "arrived", "job_started"];

const canClientCancelBooking = (booking) => {
  if (["completed", "cancelled", "rejected", ...IN_PROGRESS_STATUSES].includes(booking.status)) return false;
  return true;
};

const updateProviderReviewStats = async (providerId) => {
  if (!providerId) return;

  const [stats] = await Booking.aggregate([
    {
      $match: {
        status: "completed",
        clientRating: { $gte: 1, $lte: 5 },
        $or: [
          { assignedProvider: providerId },
          { requestedProvider: providerId },
        ],
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$clientRating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  await Provider.findByIdAndUpdate(providerId, {
    rating: stats ? Number(stats.averageRating.toFixed(1)) : 0,
    reviews: stats?.reviewCount || 0,
  });
};

const geocodeAddress = async (address) => {
  if (!address?.trim()) return undefined;

  const params = new URLSearchParams({
    q: address.trim(),
    format: "json",
    limit: "1",
  });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        "User-Agent": "ServiceHubTracking/1.0",
      },
    });
    if (!response.ok) return undefined;

    const data = await response.json();
    const match = Array.isArray(data) ? data[0] : null;

    return buildPointLocation(
      { latitude: match?.lat, longitude: match?.lon, accuracy: null, address },
      "capturedAt"
    );
  } catch {
    return undefined;
  }
};
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, phone, service, address, problemDescription, date, time, duration, providerId = "", clientLatitude, clientLongitude, clientLocationAccuracy, addressLocation, bookingLocation: reqBookingLocation } = req.body;

    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot book services. Please use a client account." });
    }

    if (!name || !phone || !service || !address || !problemDescription || !date || !time || !duration) {
      return res.status(400).json({ message: "All booking fields are required." });
    }

    const activeAddressLocation = addressLocation || {
      latitude: clientLatitude,
      longitude: clientLongitude,
      address,
      timestamp: new Date()
    };

    if (!activeAddressLocation.latitude || !activeAddressLocation.longitude ||
        !Number.isFinite(Number(activeAddressLocation.latitude)) || !Number.isFinite(Number(activeAddressLocation.longitude)) ||
        Number(activeAddressLocation.latitude) === 0 || Number(activeAddressLocation.longitude) === 0) {
      return res.status(400).json({ message: "Client location coordinates are required to create a booking." });
    }

    const parsedBookingLoc = reqBookingLocation || {};
    const bookingLocation = {
      latitude: Number(parsedBookingLoc.latitude || activeAddressLocation.latitude),
      longitude: Number(parsedBookingLoc.longitude || activeAddressLocation.longitude),
      formattedAddress: String(parsedBookingLoc.formattedAddress || parsedBookingLoc.address || activeAddressLocation.address || address || "").trim(),
      houseNo: String(parsedBookingLoc.houseNo || "").trim(),
      street: String(parsedBookingLoc.street || "").trim(),
      area: String(parsedBookingLoc.area || "").trim(),
      city: String(parsedBookingLoc.city || "").trim(),
      state: String(parsedBookingLoc.state || "").trim(),
      country: String(parsedBookingLoc.country || "").trim(),
      postalCode: String(parsedBookingLoc.postalCode || "").trim(),
      landmark: String(parsedBookingLoc.landmark || "").trim(),
      locationType: String(parsedBookingLoc.locationType || "Custom Address").trim(),
    };

    const preferredDate = new Date(date);
    if (Number.isNaN(preferredDate.getTime())) {
      return res.status(400).json({ message: "Please select a valid booking date." });
    }

    const requestedProvider = providerId
      ? await Provider.findOne({
          _id: providerId,
          isActive: true,
          approvalStatus: "approved",
        })
      : null;

    if (providerId && !requestedProvider) {
      return res.status(400).json({ message: "Selected provider is not available." });
    }

    const ownProviderProfile = req.user.role === "provider"
      ? await Provider.findOne({ owner: req.user._id }).select("_id")
      : null;

    if (requestedProvider && ownProviderProfile && String(requestedProvider._id) === String(ownProviderProfile._id)) {
      return res.status(403).json({ message: "You cannot book your own provider service. Please choose another provider." });
    }

    let clientLocation = buildPointLocation(
      { latitude: clientLatitude, longitude: clientLongitude, accuracy: clientLocationAccuracy, address },
      "capturedAt"
    );

    if (!clientLocation) {
      clientLocation = await geocodeAddress(address);
    }

    const booking = await Booking.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      name,
      phone,
      service: requestedProvider?.category || normalizeServiceName(service) || service,
      address,
      addressLocation: {
        latitude: Number(activeAddressLocation.latitude),
        longitude: Number(activeAddressLocation.longitude),
        address: String(activeAddressLocation.address || address || "").trim(),
        timestamp: activeAddressLocation.timestamp ? new Date(activeAddressLocation.timestamp) : new Date(),
      },
      bookingLocation,
      problemDescription,
      preferredDate: date,
      preferredTime: time,
      serviceDuration: duration,
      costEstimate: durationCostMap[duration] || 299,
      requestedProvider: requestedProvider?._id || null,
      requestedProviderName: requestedProvider?.name || "",
      ...(clientLocation ? { clientLocation } : {}),
    });

    setImmediate(() => {
      sendBookingEmail({
        to: req.user.email,
        name: req.user.name,
        booking,
        provider: requestedProvider,
      }).catch((error) => console.warn(`Booking email failed: ${error.message}`));

      sendBookingConfirmationWhatsApp({
        to: phone || req.user.phone,
        name: req.user.name,
        booking,
        provider: requestedProvider,
      }).catch(() => {});

      if (requestedProvider?.email) {
        sendProviderRequestEmail({
          to: requestedProvider.email,
          providerName: requestedProvider.name,
          booking,
        }).catch((error) => console.warn(`Provider request email failed: ${error.message}`));
      }
    });

    const targetProviders = requestedProvider
      ? [requestedProvider]
      : await Provider.find({
          category: new RegExp(`^${service.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
          isActive: true,
          approvalStatus: "approved",
          ...(ownProviderProfile ? { _id: { $ne: ownProviderProfile._id } } : {}),
        }).limit(20);

    let approxAddress = "";
    if (booking.bookingLocation) {
      const area = booking.bookingLocation.area || "";
      const city = booking.bookingLocation.city || "";
      approxAddress = [area, city].filter(Boolean).join(", ");
    }
    if (!approxAddress && booking.address) {
      const parts = booking.address.split(",").map(p => p.trim());
      approxAddress = parts.slice(-2).join(", ");
    }
    if (!approxAddress) {
      approxAddress = "Approximate Location";
    }

    const providerAlert = {
      type: "booking_request",
      bookingId: booking.bookingId || String(booking._id),
      databaseId: String(booking._id),
      clientName: booking.name || req.user.name || "Client",
      service: booking.service,
      address: approxAddress,
      clientLocation: null,
      bookingLocation: {
        latitude: null,
        longitude: null,
        formattedAddress: approxAddress,
        houseNo: "",
        street: "",
        area: booking.bookingLocation?.area || "",
        city: booking.bookingLocation?.city || "",
        state: "",
        country: "",
        postalCode: "",
        landmark: "",
        locationType: booking.bookingLocation?.locationType || "Custom Address",
      },
      problemDescription: booking.problemDescription || "",
      status: booking.status,
      createdAt: booking.createdAt,
    };

    const io = req.app.get("io");
    targetProviders.forEach((provider) => {
      io?.to(getProviderRoomId(provider._id)).emit("provider:booking-alert", providerAlert);
    });
    Promise.all(targetProviders.map((provider) => sendProviderBookingNotification({ provider, booking }))).catch(() => {});
    Promise.all(targetProviders.map((provider) =>
      sendProviderRequestWhatsApp({
        to: provider.phone,
        providerName: provider.name,
        booking,
      })
    )).catch(() => {});

    res.status(201).json({
      message: "Booking saved successfully.",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Booking failed. Please try again." });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .select("-workImage")
      .populate("assignedProvider", "name category location phone price responseTime rating reviews")
      .populate("requestedProvider", "name category location phone price responseTime rating reviews")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Could not load bookings." });
  }
});

router.get("/:bookingId", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      ...bookingLookup(req.params.bookingId),
      user: req.user._id,
    })
      .select("-workImage")
      .populate("assignedProvider", "name category location phone price responseTime rating reviews")
      .populate("requestedProvider", "name category location phone price responseTime rating reviews")
      .lean();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.json({ booking });
  } catch {
    res.status(500).json({ message: "Booking could not be loaded." });
  }
});

router.get("/:bookingId/tracking", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      ...bookingLookup(req.params.bookingId),
      user: req.user._id,
    })
      .select("-workImage")
      .populate("assignedProvider", "name category location phone price responseTime rating reviews")
      .populate("requestedProvider", "name category location phone price responseTime rating reviews")
      .lean();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.json({
      bookingId: booking.bookingId || booking._id,
      databaseId: booking._id,
      status: booking.status,
      currentStatus: booking.status,
      eta: booking.eta ?? null,
      provider: booking.assignedProvider || booking.requestedProvider || null,
      providerName: booking.assignedProviderName || booking.requestedProviderName || "",
      providerLocation: publicLocation(booking.providerLocation),
      clientLocation: publicLocation(booking.clientLocation) || (booking.addressLocation?.latitude ? {
        latitude: booking.addressLocation.latitude,
        longitude: booking.addressLocation.longitude,
        address: booking.addressLocation.address || booking.address || "",
      } : null),
      clientAddress: booking.clientLocation?.address || booking.addressLocation?.address || booking.address || "",
      providerAddress: booking.providerLocation?.address || "",
      address: booking.address,
      addressLocation: booking.addressLocation || null,
      bookingLocation: booking.bookingLocation || null,
      problemDescription: booking.problemDescription || "",
      serviceName: booking.service || "",
      bookingDate: booking.preferredDate || null,
      bookingTime: booking.preferredTime || null,
      trackingEvents: booking.trackingEvents || [],
      trackingHistory: ensureTrackingHistory(booking),
      cancellationReason: booking.cancellationReason || booking.cancelReason || "",
      cancelReason: booking.cancelReason || booking.cancellationReason || "",
      cancelledBy: booking.cancelledBy || "",
      cancelledAt: booking.cancelledAt || null,
      cancelType: booking.cancelType || "",
      rejectionReason: booking.rejectionReason || "",
      updatedAt: booking.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Tracking details could not be loaded." });
  }
});


router.patch("/:bookingId/client-location", requireAuth, async (req, res) => {
  try {
    const { clientLatitude, clientLongitude, clientLocationAccuracy, address = "" } = req.body || {};
    const clientLocation = buildPointLocation(
      { latitude: clientLatitude, longitude: clientLongitude, accuracy: clientLocationAccuracy, address },
      "capturedAt"
    );

    if (!clientLocation && !address.trim()) {
      return res.status(400).json({ message: "Share GPS or provide an address for provider navigation." });
    }

    const location = req.body && typeof req.body === "object" ? req.body : {};
    const update = {
      clientLocationUpdatedAt: new Date(),
      locationRequested: false,
    };
    if (clientLocation) update.clientLocation = clientLocation;
    if (address.trim()) update.address = address.trim();

    update.addressLocation = {
      latitude: Number.isFinite(Number(location.latitude)) ? Number(location.latitude) : (clientLatitude ? Number(clientLatitude) : null),
      longitude: Number.isFinite(Number(location.longitude)) ? Number(location.longitude) : (clientLongitude ? Number(clientLongitude) : null),
      address: String(location.address || address || "").trim(),
      timestamp: location.timestamp ? new Date(location.timestamp) : new Date(),
    };

    const booking = await Booking.findOneAndUpdate(
      {
        ...bookingLookup(req.params.bookingId),
        user: req.user._id,
        status: { $nin: ["completed", "cancelled"] },
      },
      update,
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Active booking not found." });
    }

    req.app.get("io")?.to(booking.bookingId || String(booking._id)).emit("client:location", {
      bookingId: booking.bookingId || String(booking._id),
      clientLocation: publicLocation(booking.clientLocation),
      address: booking.address,
    });

    res.json({ message: "Client location updated for provider navigation.", booking });
  } catch (error) {
    res.status(500).json({ message: "Client location could not be updated." });
  }
});

router.patch("/:bookingId/review", requireAuth, async (req, res) => {
  try {
    const rating = Number(req.body?.rating);
    const review = String(req.body?.review || req.body?.comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5 stars." });
    }

    if (review.length > 600) {
      return res.status(400).json({ message: "Review must be 600 characters or less." });
    }

    const booking = await Booking.findOne({
      ...bookingLookup(req.params.bookingId),
      user: req.user._id,
      status: "completed",
    });

    if (!booking) {
      return res.status(404).json({ message: "Completed booking not found." });
    }

    const providerId = booking.assignedProvider || booking.requestedProvider;
    if (!providerId) {
      return res.status(400).json({ message: "Provider is not available for this review." });
    }

    booking.clientRating = rating;
    booking.clientReview = review;
    booking.reviewedAt = new Date();
    await booking.save();
    await updateProviderReviewStats(providerId);
    await booking.populate([
      { path: "assignedProvider", select: "name category location phone price responseTime rating reviews" },
      { path: "requestedProvider", select: "name category location phone price responseTime rating reviews" },
    ]);

    res.json({ message: "Review submitted successfully.", booking });
  } catch (error) {
    res.status(500).json({ message: "Review could not be submitted." });
  }
});

router.patch("/:bookingId/status", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ message: "Provider access required." });
    }

    const { status } = req.body || {};
    const normalizedStatus = normalizeBookingStatus(status);

    if (!isWorkflowBookingStatus(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid booking status." });
    }

    const provider = await Provider.findOne({ owner: req.user._id });
    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const existingBooking = await Booking.findOne({
      ...bookingLookup(req.params.bookingId),
      assignedProvider: provider._id,
    });

    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found for this provider." });
    }

    const updateOperation = buildStatusUpdateOperation({
      booking: existingBooking,
      status: normalizedStatus,
    });

    const booking = await Booking.findOneAndUpdate(
      {
        ...bookingLookup(req.params.bookingId),
        assignedProvider: provider._id,
      },
      updateOperation,
      { new: true }
    );

    emitStatusChange(req.app.get("io"), booking);
    res.json({ booking });
  } catch (error) {
    if (/booking status|completed bookings|cannot move/i.test(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Booking status could not be updated." });
  }
});


router.patch("/:bookingId/cancel", requireAuth, async (req, res) => {
  try {
    const { reason = "", cancelReason = "", cancelType = "Custom" } = req.body || {};
    const finalReason = String(cancelReason || reason || "").trim();
    const booking = await Booking.findOne({
      ...bookingLookup(req.params.bookingId),
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (!canClientCancelBooking(booking)) {
      return res.status(403).json({ message: "This booking can no longer be cancelled — the provider is already on the way or working on it." });
    }

    booking.status = "cancelled";
    booking.cancelledBy = "client";
    booking.cancelledAt = new Date();
    booking.cancellationReason = finalReason;
    booking.cancelReason = finalReason;
    booking.cancelType = cancelType;
    await booking.save();
    await booking.populate([
      { path: "assignedProvider", select: "name category location phone price responseTime rating reviews owner" },
      { path: "requestedProvider", select: "name category location phone price responseTime rating reviews owner" },
    ]);
    emitStatusChange(req.app.get("io"), booking);

    const activeProvider = booking.assignedProvider || booking.requestedProvider;
    if (activeProvider && activeProvider.owner) {
      User.findById(activeProvider.owner)
        .select("expoPushTokens")
        .lean()
        .then((providerUser) => {
          if (providerUser && providerUser.expoPushTokens?.length) {
            sendPushNotification({
              tokens: providerUser.expoPushTokens,
              title: "Booking Cancelled by Client",
              body: `The client cancelled the booking for ${booking.service}. Reason: ${booking.cancellationReason || "No reason provided"}`,
              data: {
                type: "booking",
                bookingId: String(booking._id),
                status: "Cancelled",
              },
            }).catch((err) => console.warn(`Provider push notification failed: ${err.message}`));
          }
        })
        .catch((err) => console.warn(`Could not fetch provider user for push notification: ${err.message}`));
    }

    if (activeProvider?.email) {
      setImmediate(() => {
        sendCustomerCancellationEmail({
          to: activeProvider.email,
          booking,
          reason: booking.cancellationReason || "Cancelled by customer",
        }).catch((err) => console.warn(`Customer cancellation email failed: ${err.message}`));
      });
    }

    res.json({ message: "Booking cancelled successfully.", booking });
  } catch (error) {
    res.status(500).json({ message: "Booking could not be cancelled." });
  }
});




router.patch("/:bookingId/payment-confirmation", requireAuth, async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production" || process.env.ALLOW_MANUAL_PAYMENT_CONFIRMATION !== "true") {
      return res.status(403).json({ message: "Manual payment confirmation is disabled. Use the verified payment endpoint." });
    }

    const { paymentReference = "", receiptUrl = "" } = req.body;
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.estimateStatus !== "accepted") {
      return res.status(400).json({ message: "Accept the provider final estimate before payment." });
    }

    if (!paymentReference) {
      return res.status(400).json({ message: "Payment reference is required after gateway confirmation." });
    }

    booking.paymentStatus = "paid";
    booking.clientPaymentStatus = "paid";
    booking.clientPaidAt = new Date();
    booking.paymentReference = paymentReference;
    booking.receiptUrl = receiptUrl;
    booking.paymentGateway = booking.paymentGateway || "external";
    booking.adminPayoutStatus = "pending";
    applyPaymentSplit(booking);
    await booking.save();

    res.json({ message: "Payment confirmed. Amount received by admin and provider payout is pending admin release.", booking });
  } catch (error) {
    res.status(500).json({ message: "Payment confirmation could not be saved." });
  }
});

router.post("/:bookingId/request-location", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    let allowed = false;
    if (req.user.role === "admin") {
      allowed = true;
    } else if (req.user.role === "provider") {
      const provider = await Provider.findOne({ owner: req.user._id });
      if (provider && String(booking.assignedProvider) === String(provider._id)) {
        allowed = true;
      }
    }

    if (!allowed) {
      return res.status(403).json({ message: "Only the assigned provider can request client location." });
    }

    booking.locationRequested = true;
    await booking.save();

    const client = await User.findById(booking.user).lean();
    if (client && Array.isArray(client.expoPushTokens) && client.expoPushTokens.length > 0) {
      await sendPushNotification({
        tokens: client.expoPushTokens,
        title: "Location Request",
        body: "The service provider has requested your current GPS location for navigation.",
        data: {
          type: "location_request",
          bookingId: String(booking._id),
        },
      });
    }

    res.json({ message: "Location request sent successfully.", booking });
  } catch (error) {
    res.status(500).json({ message: "Could not request client location." });
  }
});

export default router;
