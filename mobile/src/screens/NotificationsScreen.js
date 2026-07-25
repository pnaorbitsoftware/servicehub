import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import NotificationCard from "../components/NotificationCard";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { colors, radius, responsiveMetrics, useThemeColors } from "../theme";

function NotificationsScreen({ notifications = [], loading, error, refreshing, onBack, onRefresh, onMarkRead, onMarkAllRead }) {
  const theme = useThemeColors();
  const unreadCount = notifications.filter((item) => !item.read).length;

  const renderItem = useCallback(
    ({ item }) => <NotificationCard notification={item} onPress={onMarkRead} />,
    [onMarkRead]
  );
  const keyExtractor = useCallback((item) => String(item.id || item._id), []);

  return (
    <FlatList
      data={loading ? [] : notifications}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.teal]} tintColor={theme.teal} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.surfaceMuted }, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>Booking, payment, provider, and offer updates.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={!unreadCount}
              onPress={onMarkAllRead}
              style={({ pressed }) => [styles.markAll, { backgroundColor: unreadCount ? theme.tealSoft : theme.surfaceMuted }, pressed && unreadCount && styles.pressed]}
            >
              <MaterialCommunityIcons name="check-all" size={18} color={unreadCount ? theme.teal : theme.textMuted} />
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <LoadingState label="Loading notifications..." />
        ) : error ? (
          <ErrorState title="Could not load notifications" copy={error} onRetry={onRefresh} />
        ) : (
          <EmptyState title="No notifications yet" copy="Your service updates will appear here." icon="bell-outline" />
        )
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 118,
    paddingHorizontal: responsiveMetrics(390).pagePadding,
    paddingTop: 12,
  },
  header: {
    paddingBottom: 8,
  },
  headerText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  markAll: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0,
  },
});

export default React.memo(NotificationsScreen);
