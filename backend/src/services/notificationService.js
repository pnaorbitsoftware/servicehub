import User from "../models/User.js";

const statusCopy = {
  accepted: "Your provider accepted the booking.",
  en_route: "Your provider is on the way.",
  arrived: "Your provider has arrived.",
  job_started: "Your service job has started.",
  completed: "Your service is complete.",
  cancelled: "Your booking was cancelled.",
  rejected: "The provider could not accept your request.",
};

export const sendStatusChangeNotification = async (booking) => {
  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey || !booking?.user) {
    return { skipped: true };
  }

  const client = await User.findById(booking.user).select("fcmToken").lean();
  if (!client?.fcmToken) {
    return { skipped: true };
  }

  try {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: client.fcmToken,
        notification: {
          title: "Booking status updated",
          body: statusCopy[booking.status] || `Booking status changed to ${booking.status}.`,
        },
        data: {
          bookingId: String(booking.bookingId || booking._id),
          status: booking.status,
        },
      }),
    });

    return { sent: response.ok };
  } catch {
    return { sent: false };
  }
};

const sendFcm = async ({ token, title, body, data }) => {
  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey || !token) {
    return { skipped: true };
  }

  try {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body },
        data,
      }),
    });

    return { sent: response.ok };
  } catch {
    return { sent: false };
  }
};

export const sendProviderBookingNotification = async ({ provider, booking }) => {
  if (!provider || !booking) return { skipped: true };

  let token = provider.fcmToken || "";
  if (!token && provider.owner) {
    const owner = await User.findById(provider.owner).select("fcmToken").lean();
    token = owner?.fcmToken || "";
  }

  return sendFcm({
    token,
    title: "New service booking",
    body: `New ${booking.service} request${booking.address ? ` at ${booking.address}` : ""}. Client name and phone number will be visible after accepting.`,
    data: {
      type: "booking_request",
      bookingId: String(booking.bookingId || booking._id),
      clientName: "Client details hidden",
      address: booking.address || "",
      hasClientLocation: String(Boolean(booking.clientLocation?.coordinates?.length)),
    },
  });
};
