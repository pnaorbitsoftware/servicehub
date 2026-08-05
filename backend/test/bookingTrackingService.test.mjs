import assert from "node:assert/strict";
import test from "node:test";

import {
  assertStatusTransition,
  buildStatusUpdateOperation,
  normalizeBookingStatus,
} from "../src/services/bookingTrackingService.js";
import { normalizeTrackingStatus } from "../src/utils/tracking.js";

test("normalizes legacy booking statuses to canonical values", () => {
  assert.equal(normalizeBookingStatus("Provider Assigned"), "accepted");
  assert.equal(normalizeBookingStatus("on-the-way"), "on_the_way");
  assert.equal(normalizeBookingStatus("EN ROUTE"), "on_the_way");
  assert.equal(normalizeBookingStatus("in progress"), "job_started");
  assert.equal(normalizeBookingStatus("payment pending"), "payment_pending");
});

test("keeps arrived as the current tracking status", () => {
  const operation = buildStatusUpdateOperation({ booking: { status: "on_the_way" }, status: "Arrived" });

  assert.equal(operation.$set.status, "arrived");
  assert.equal(operation.$push.trackingEvents.status, "arrived");
  assert.equal(normalizeTrackingStatus("arrived"), "Arrived");
});

test("rejects invalid backward tracking transitions", () => {
  assert.throws(() => assertStatusTransition("arrived", "on the way"), /cannot move backward/i);
  assert.throws(() => assertStatusTransition("completed", "arrived"), /cannot move backward/i);
});
