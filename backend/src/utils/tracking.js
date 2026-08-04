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
  provider_assigned: "Provider Assigned",
  confirmed: "Confirmed",
  on_the_way: "On The Way",
  en_route: "On The Way",
  "on-the-way": "On The Way",
  "on the way": "On The Way",
  arrived: "Arrived",
  job_started: "Service Started",
  service_started: "Service Started",
  "service-started": "Service Started",
  "service started": "Service Started",
  in_progress: "Service Started",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Cancelled",
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
  const rawStatus = String(status || "").trim();
  if (!rawStatus) return "Confirmed";

  const lowerStatus = rawStatus.toLowerCase().replace(/[\s_\-]+/g, "_");
  if (LEGACY_STATUS_ALIASES[lowerStatus]) return LEGACY_STATUS_ALIASES[lowerStatus];
  if (LEGACY_STATUS_ALIASES[rawStatus.toLowerCase()]) return LEGACY_STATUS_ALIASES[rawStatus.toLowerCase()];

  return allowedTrackingStatuses.find((item) => item.toLowerCase() === lowerStatus) || rawStatus;
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
