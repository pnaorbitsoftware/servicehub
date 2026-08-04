import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, useThemeColors } from "../theme";

export const TRACKING_STEPS = [
  "Confirmed",
  "Provider Assigned",
  "On The Way",
  "Arrived",
  "Service Started",
  "Completed",
];

const defaultStepDetails = {
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
};

function formatTimelineDate(value) {
  if (!value) return "Waiting for update";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function normalizeStatus(status = "") {
  const raw = String(status || "").trim();
  const lower = raw.toLowerCase().replace(/[\s_\-]+/g, " ");
  if (lower === "confirmed") return "Confirmed";
  if (["assigned", "accepted", "provider assigned", "provider_assigned"].includes(lower)) return "Provider Assigned";
  if (["on the way", "en route", "on_the_way", "en_route"].includes(lower)) return "On The Way";
  if (lower === "arrived") return "Arrived";
  if (["service started", "job started", "service_started", "job_started", "in progress", "in_progress"].includes(lower)) return "Service Started";
  if (lower === "completed") return "Completed";
  return status || "Confirmed";
}

export function buildTimelineSteps(history = [], currentStatus = "Confirmed") {
  const normalizedHistory = Array.isArray(history) ? history : [];
  const historyByStatus = new Map();

  normalizedHistory.forEach((event) => {
    historyByStatus.set(normalizeStatus(event.status), event);
  });

  const lastHistoryItem = normalizedHistory.length ? normalizedHistory[normalizedHistory.length - 1] : null;
  const activeStatus = normalizeStatus(currentStatus || lastHistoryItem?.status || "Confirmed");
  const activeIndex = Math.max(TRACKING_STEPS.indexOf(activeStatus), 0);

  return TRACKING_STEPS.map((status, index) => {
    const event = historyByStatus.get(status);
    const fallback = defaultStepDetails[status];
    return {
      status,
      title: event?.title || fallback.title,
      description: event?.description || fallback.description,
      updatedAt: event?.updatedAt || null,
      completed: Boolean(event) || index <= activeIndex,
      active: status === activeStatus,
    };
  });
}

export default function TrackingTimeline({ history, currentStatus }) {
  const steps = buildTimelineSteps(history, currentStatus);

  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => (
        <TrackingStep key={step.status} step={step} isLast={index === steps.length - 1} />
      ))}
    </View>
  );
}

function TrackingStep({ step, isLast }) {
  const theme = useThemeColors();
  const dotColor = step.completed ? theme.teal : theme.border;
  const lineColor = step.completed ? theme.teal : theme.border;

  return (
    <View style={styles.stepRow}>
      <View style={styles.axis}>
        <View style={[styles.dot, { backgroundColor: dotColor }]}>
          {step.completed ? <MaterialCommunityIcons name="check" size={13} color="#ffffff" /> : null}
        </View>
        {!isLast ? <View style={[styles.line, { backgroundColor: lineColor }]} /> : null}
      </View>
      <View style={styles.stepBody}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
        <Text style={[styles.stepTime, { color: step.updatedAt ? theme.teal : theme.textMuted }]}>
          {formatTimelineDate(step.updatedAt)}
        </Text>
        <Text style={[styles.stepDescription, { color: theme.textMuted }]}>{step.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: {
    alignItems: "center",
    width: 28,
  },
  dot: {
    alignItems: "center",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  line: {
    flex: 1,
    marginVertical: 5,
    width: 3,
  },
  stepBody: {
    flex: 1,
    minHeight: 92,
    paddingBottom: 18,
  },
  stepDescription: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 5,
  },
  stepRow: {
    flexDirection: "row",
    gap: 14,
  },
  stepTime: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0,
  },
  timeline: {
    paddingTop: 8,
  },
});
