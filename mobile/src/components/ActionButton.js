import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, useThemeColors } from "../theme";

function ActionButton({
  title,
  icon,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const theme = useThemeColors();
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isDangerSoft = variant === "dangerSoft";

  const isDisabled = disabled || loading;
  const contentColor = isPrimary || isDanger ? "#ffffff" : isDangerSoft ? theme.rose : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary && { backgroundColor: theme.teal },
        variant === "secondary" && { backgroundColor: theme.surfaceMuted },
        isDanger && { backgroundColor: theme.rose },
        isDangerSoft && { backgroundColor: theme.roseSoft },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} size="small" />
      ) : icon ? (
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={contentColor}
          />
        </View>
      ) : null}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={[
          styles.label,
          { color: isDangerSoft ? theme.rose : theme.text },
          (isPrimary || isDanger) && styles.lightLabel,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export default React.memo(ActionButton);

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    minWidth: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.55,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0,
  },
  lightLabel: {
    color: "#ffffff",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
