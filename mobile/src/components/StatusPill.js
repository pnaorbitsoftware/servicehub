import React from "react";
import { StyleSheet, Text } from "react-native";

import { colors, radius, useThemeColors } from "../theme";
import { normalizeTrackingStatus } from "../lib/formatters";

function StatusPill({ status = "pending" }) {
  const theme = useThemeColors();
  const label = normalizeTrackingStatus(status);
  const normalized = label.toLowerCase();
  const isDone = normalized === "completed" || normalized === "paid";
  const isBad = ["cancelled", "rejected", "provider rejected", "provider_rejected"].includes(normalized);

  return (
    <Text
      numberOfLines={1}
      style={[
        styles.pill,
        {
          backgroundColor: isDone ? theme.successSoft : isBad ? theme.roseSoft : theme.amberSoft,
          color: isDone ? theme.success : isBad ? theme.rose : theme.amber,
        },
      ]}
    >
      {label}
    </Text>
  );
}

export default React.memo(StatusPill);

const styles = StyleSheet.create({
  bad: {
    backgroundColor: colors.roseSoft,
    color: colors.rose,
  },
  done: {
    backgroundColor: colors.successSoft,
    color: colors.success,
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: colors.amberSoft,
    borderRadius: radius.sm,
    color: colors.amber,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    textTransform: "capitalize",
  },
});
