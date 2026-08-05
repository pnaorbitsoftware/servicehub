const statusRanks = {
  pending: 0,
  accepted: 1,
  on_the_way: 2,
  arrived: 3,
  job_started: 4,
  completed: 5,
};

const statusAliases = {
  requested: "pending",
  pending: "pending",
  accepted: "accepted",
  confirmed: "accepted",
  assigned: "accepted",
  provider_assigned: "accepted",
  on_the_way: "on_the_way",
  en_route: "on_the_way",
  arrived: "arrived",
  service_started: "job_started",
  in_progress: "job_started",
  job_started: "job_started",
  completed: "completed",
  payment_pending: "payment_pending",
  pending_payment: "payment_pending",
  paid: "paid",
  cancelled: "cancelled",
  rejected: "rejected",
};

export const activeTrackingStatuses = ["accepted", "on_the_way", "arrived", "job_started", "completed"];
export const workflowBookingStatuses = new Set([
  "pending",
  "accepted",
  "on_the_way",
  "arrived",
  "job_started",
  "completed",
  "cancelled",
  "rejected",
]);

export const normalizeBookingStatus = (status) => {
  const normalized = String(status || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
  return statusAliases[normalized] || normalized;
};

export const isWorkflowBookingStatus = (status) => workflowBookingStatuses.has(normalizeBookingStatus(status));

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
  if (!workflowBookingStatuses.has(normalizedStatus)) {
    throw new Error("Invalid booking status.");
  }
  assertStatusTransition(booking?.status, normalizedStatus);

  const updateOperation = {
    $set: {
      ...set,
      status: normalizedStatus,
    },
  };

  if (activeTrackingStatuses.includes(normalizedStatus)) {
    updateOperation.$push = {
      trackingEvents: {
        status: normalizedStatus,
        updatedAt: new Date(),
      },
    };
  }

  return updateOperation;
};
