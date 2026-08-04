import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow, useThemeColors } from "../theme";

export default function ModalSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
  centeredTitle = false,
  headerAction = null,
}) {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { height } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const screenHeight = Dimensions.get("screen").height;

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return undefined;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [visible]);

  const keyboardOverlaysWindow =
    keyboardHeight > 0 && height > screenHeight - keyboardHeight * 0.35;
  const keyboardOffset = Platform.OS === "android" && keyboardOverlaysWindow ? keyboardHeight : 0;
  const sheetMaxHeight = useMemo(() => {
    if (!keyboardOffset) return Math.round(height * 0.92);

    const availableHeight = height - keyboardOffset - Math.max(insets.top, 8) - 8;
    return Math.max(280, Math.min(Math.round(height * 0.92), availableHeight));
  }, [height, insets.top, keyboardOffset]);

  const scrollBottomPadding = useMemo(() => {
    const basePadding = keyboardOffset ? 28 : 16;
    return basePadding + (footer ? Math.max(footerHeight, 16) : 0);
  }, [keyboardOffset, footer, footerHeight]);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
          <Pressable
            accessible={false}
            onPress={Keyboard.dismiss}
            style={[
              styles.sheet,
              {
                backgroundColor: theme.surface,
                marginBottom: keyboardOffset,
                maxHeight: sheetMaxHeight,
                paddingBottom: Math.max(insets.bottom, 14),
              },
            ]}
          >
            <View style={[styles.header, centeredTitle && styles.centeredHeader]}>
              {centeredTitle ? <View style={styles.headerSpacer} /> : null}
              <View style={[styles.titleWrap, centeredTitle && styles.centeredTitleWrap]}>
                <Text style={[styles.title, { color: theme.text }, centeredTitle && styles.centeredTitle]} numberOfLines={2}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: theme.textMuted }, centeredTitle && styles.centeredTitle]} numberOfLines={2}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              {headerAction ? <View style={styles.headerAction}>{headerAction}</View> : null}
              <Pressable accessibilityRole="button" onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]}>
                <MaterialCommunityIcons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
            >
              {children}
            </ScrollView>
            {footer ? (
              <View
                onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
                style={[styles.footer, { borderTopColor: theme.border }]}
              >
                {footer}
              </View>
            ) : null}
          </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  content: {
    gap: 14,
    paddingBottom: 8,
  },
  keyboardContent: {
    paddingBottom: 28,
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 12,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  headerAction: {
    alignItems: "center",
    justifyContent: "center",
  },
  centeredHeader: {
    alignItems: "center",
  },
  centeredTitle: {
    textAlign: "center",
  },
  centeredTitleWrap: {
    alignItems: "center",
  },
  headerSpacer: {
    minHeight: 44,
    minWidth: 44,
  },
  overlay: {
    backgroundColor: "rgba(16, 26, 53, 0.48)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 20,
    ...shadow,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 3,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
});
