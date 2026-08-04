const statusRanks = {
  pending: 0,
  accepted: 1,
  confirmed: 1,
  assigned: 1,
  on_the_way: 2,
  en_route: 2,
  arrived: 3,
  job_started: 4,
  completed: 5,
};

export const activeTrackingStatuses = ["accepted", "en_route", "arrived", "job_started", "completed"];

export const normalizeBookingStatus = (status) => {
  let s = String(status || "").toLowerCase().trim().replace(/[\s_\-]+/g, "_");
  if (s === "confirmed" || s === "assigned" || s === "provider_assigned") return "accepted";
  if (s === "on_the_way" || s === "en_route") return "en_route";
  if (s === "service_started" || s === "job_started" || s === "in_progress") return "job_started";
  return s;
};

export const assertStatusTransition = (currentStatus = "pending", nextStatus) => {
  if (nextStatus === "cancelled" || nextStatus === "rejected") {
    if (currentStatus === "completed") {
      throw new Error("Completed bookings cannot be cancelled.");
    }
    return;
  }

  const normalizedCurrent = normalizeBookingStatus(currentStatus);
  const normalizedNext = normalizeBookingStatus(nextStatus);
  const currentRank = statusRanks[normalizedCurrent];
  const nextRank = statusRanks[normalizedNext];

  if (!Number.isFinite(currentRank) || !Number.isFinite(nextRank)) {
    throw new Error("Invalid booking status.");
  }

  if (normalizedCurrent === "completed" && normalizedNext !== "completed") {
    throw new Error("Completed bookings cannot move backward.");
  }

  if (nextRank < currentRank) {
    throw new Error("Booking status cannot move backward.");
  }
};

export const buildStatusUpdateOperation = ({ booking, status, set = {} }) => {
  const normalizedStatus = normalizeBookingStatus(status);
  assertStatusTransition(booking?.status, normalizedStatus);

  const trackingEventItem = {
    status: normalizedStatus,
    updatedAt: new Date(),
  };

  const updateOperation = {
    $set: {
      ...set,
      status: normalizedStatus,
    },
  };

  if (activeTrackingStatuses.includes(normalizedStatus)) {
    updateOperation.$push = {
      trackingEvents: trackingEventItem,
      trackingHistory: trackingEventItem,
    };
  }

  return updateOperation;
};

