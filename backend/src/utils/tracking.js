export const TRACKING_STATUS_FLOW = [
  "Confirmed",
  "Provider Assigned",
  "On The Way",
  "Arrived",
  "Service Started",
  "Completed",
];

export const LEGACY_STATUS_ALIASES = {
  pending: "Pending",
  accepted: "Provider Assigned",
  assigned: "Provider Assigned",
  confirmed: "Confirmed",
  on_the_way: "On The Way",
  en_route: "On The Way",
  arrived: "Arrived",
  job_started: "Service Started",
  payment_pending: "Payment Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Cancelled",
  payment_pending: "Payment Pending",
  paid: "Paid",
};

export const trackingStatusDetails = {
  Pending: {
    title: "Booking Pending",
    description: "Your service booking is waiting for confirmation.",
  },
  Confirmed: {
    title: "Booking Confirmed",
    description: "Your service booking has been confirmed.",
  },
  "Provider Assigned": {
    title: "Provider Assigned",
    description: "A provider has been assigned to your service.",
  },
  "On The Way": {
    title: "Provider On The Way",
    description: "Provider is coming to your location.",
  },
  Arrived: {
    title: "Provider Arrived",
    description: "Provider has arrived at your location.",
  },
  "Service Started": {
    title: "Service Started",
    description: "Your service has started.",
  },
  Completed: {
    title: "Service Completed",
    description: "Your service has been completed.",
  },
  Cancelled: {
    title: "Service Cancelled",
    description: "This service booking has been cancelled.",
  },
};

export const allowedTrackingStatuses = Object.keys(trackingStatusDetails);

export function normalizeTrackingStatus(status = "") {
  const normalized = normalizeBookingStatus(status);
  if (!normalized) return "Confirmed";
  return LEGACY_STATUS_ALIASES[normalized] || normalized;
}

export function buildTrackingEvent(status, { description = "", updatedBy = "system", updatedAt = new Date() } = {}) {
  const normalizedStatus = normalizeTrackingStatus(status);
  const details = trackingStatusDetails[normalizedStatus] || trackingStatusDetails.Confirmed;

  return {
    status: normalizedStatus,
    title: details.title,
    description: String(description || details.description).trim(),
    updatedBy,
    updatedAt,
  };
}

export function ensureTrackingHistory(booking) {
  if (!booking) return [];
  if (Array.isArray(booking.trackingHistory) && booking.trackingHistory.length) {
    return booking.trackingHistory;
  }

  const event = buildTrackingEvent(booking.status || "Confirmed", {
    updatedBy: "system",
    updatedAt: booking.createdAt || new Date(),
  });
  booking.trackingHistory = [event];
  return booking.trackingHistory;
}
import { normalizeBookingStatus } from "../services/bookingTrackingService.js";
