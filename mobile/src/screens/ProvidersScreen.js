import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { buildMarketplace } from "../data/catalog";
import { colors, radius, responsiveMetrics, shadow, useThemeColors } from "../theme";

function providerMatchesService(provider, service) {
  if (!service) return true;
  const serviceName = String(service.name || "").toLowerCase();
  const serviceCategory = String(service.category || "").toLowerCase();
  const haystack = `${provider.name} ${provider.category} ${provider.description || ""} ${provider.features?.join(" ") || ""}`.toLowerCase();

  if (!serviceName || serviceName === "providers" || serviceName === "home services") return true;
  return haystack.includes(serviceName) || haystack.includes(serviceCategory) || serviceName.includes(String(provider.category || "").toLowerCase());
}

function ProvidersScreen({
  catalogProviders,
  catalogLoading,
  catalogError,
  refreshing,
  onRefresh,
  onViewDetails,
  onBook,
  selectedServiceFilter,
  onClearServiceFilter,
}) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const metrics = responsiveMetrics(width);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const providers = useMemo(() => buildMarketplace(catalogProviders), [catalogProviders]);

  const filteredProviders = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return providers.filter((provider) => {
      const status = String(provider.availabilityStatus || provider.profileStatus || "available").trim().toLowerCase();
      const cleanFilter = String(statusFilter || "all").trim().toLowerCase();
      if (cleanFilter !== "all") {
        if (status !== cleanFilter) return false;
      }
      if (!providerMatchesService(provider, selectedServiceFilter)) return false;
      if (!normalized) return true;

      return [provider.name, provider.category, provider.location, provider.description, status, provider.price]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [providers, query, selectedServiceFilter, statusFilter]);

  const keyExtractor = useCallback((item) => String(item.id), []);
  const renderItem = useCallback(
    ({ item }) => <ProviderCard provider={item} onPress={onViewDetails} onBook={onBook} />,
    [onBook, onViewDetails]
  );

  return (
    <FlatList
      data={filteredProviders}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <Text style={[styles.title, { color: theme.text }]}>Providers</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                {selectedServiceFilter?.name ? `Best matches for ${selectedServiceFilter.name}` : "Browse verified providers by service and city."}
              </Text>
            </View>
            {selectedServiceFilter ? (
              <Pressable accessibilityRole="button" onPress={onClearServiceFilter} style={({ pressed }) => [styles.clearButton, { backgroundColor: theme.surfaceMuted }, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="close" size={20} color={theme.text} />
              </Pressable>
            ) : null}
          </View>
          <View style={[styles.searchWrap, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={theme.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search providers, service, city..."
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.text }]}
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
          <View style={styles.filterRow}>
            {["all", "active", "available", "absent", "inactive"].map((status) => {
              const active = statusFilter === status;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  style={({ pressed }) => [styles.filterChip, { backgroundColor: active ? theme.tealSoft : theme.surface, borderColor: active ? theme.teal : theme.border }, pressed && styles.pressed]}
                >
                  <Text style={[styles.filterText, { color: active ? theme.teal : theme.textMuted }]}>{status}</Text>
                </Pressable>
              );
            })}
          </View>
          {catalogError && providers.length ? (
            <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{catalogError}</Text>
          ) : null}
          {catalogLoading && !providers.length ? <SkeletonProviders /> : null}
        </View>
      }
      ListEmptyComponent={<Text style={[styles.empty, { color: theme.textMuted }]}>No providers found.</Text>}
      contentContainerStyle={[styles.content, { gap: metrics.gutter, paddingHorizontal: metrics.pagePadding }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.teal]} tintColor={theme.teal} />}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      showsVerticalScrollIndicator={false}
    />
  );
}

const ProviderCard = React.memo(function ProviderCard({ provider, onPress, onBook }) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const profileImage = provider.profileImage || "";
  const [imageFailed, setImageFailed] = useState(false);
  const disabled = !provider.isBookable;

  return (
    <Pressable style={({ pressed }) => [styles.card, { backgroundColor: theme.surface }, pressed && styles.pressed]} onPress={() => onPress(provider)}>
      <View style={styles.cardTop}>
        <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
          {profileImage && !imageFailed ? (
            <Image source={{ uri: profileImage }} style={styles.providerImage} resizeMode="cover" onError={() => setImageFailed(true)} />
          ) : (
            <MaterialCommunityIcons name="account-hard-hat-outline" size={32} color={theme.teal} />
          )}
        </View>
        <View style={styles.cardText}>
          <View style={width < 360 ? [styles.nameRow, { flexDirection: "column", alignItems: "flex-start", gap: 4 }] : styles.nameRow}>
            <Text style={[styles.providerName, { color: theme.text, fontSize: width < 360 ? 13 : 15 }]} numberOfLines={2}>{provider.name}</Text>
            <StatusBadge status={provider.availabilityStatus || provider.profileStatus} bookable={provider.isBookable} />
          </View>
          <Text style={[styles.serviceName, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={2}>{provider.category}</Text>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={15} color={theme.textMuted} />
            <Text style={[styles.location, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={2}>{provider.location || "Nearby"}</Text>
          </View>
        </View>
      </View>

      <View style={width < 360 ? [styles.footerRow, { flexDirection: "column", gap: 10, alignItems: "stretch" }] : styles.footerRow}>
        <View style={styles.priceRating}>
          <Text style={[styles.price, { color: theme.text, fontSize: width < 360 ? 13 : 15 }]} numberOfLines={2}>{provider.price || "Contact for price"}</Text>
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={14} color={theme.amber} />
            <Text style={[styles.rating, { color: theme.textMuted }]}>{provider.rating || "New"}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onBook?.(provider)}
          style={({ pressed }) => [
            styles.bookButton,
            { backgroundColor: disabled ? theme.surfaceMuted : theme.teal },
            width < 360 && { width: "100%", alignSelf: "stretch", height: 42, paddingVertical: 8 },
            pressed && !disabled && styles.pressed
          ]}
        >
          <Text style={[styles.bookButtonText, { color: disabled ? theme.textMuted : "#ffffff", fontSize: width < 360 ? 13 : 14 }]}>{disabled ? "Unavailable" : "Book Now"}</Text>
        </Pressable>
      </View>
      {disabled ? <Text style={[styles.unavailable, { color: theme.rose }]}>Provider is currently unavailable.</Text> : null}
    </Pressable>
  );
});

const StatusBadge = React.memo(function StatusBadge({ status = "available", bookable }) {
  const theme = useThemeColors();
  const bad = !bookable || ["inactive", "absent"].includes(status);
  return (
    <Text style={[styles.badge, { backgroundColor: bad ? theme.roseSoft : theme.tealSoft, color: bad ? theme.rose : theme.teal }]} numberOfLines={1}>
      {status}
    </Text>
  );
});

function SkeletonProviders() {
  const theme = useThemeColors();
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((item) => <View key={item} style={[styles.skeleton, { backgroundColor: theme.surfaceMuted }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "capitalize",
  },
  bookButton: {
    alignItems: "center",
    borderRadius: radius.lg,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 20,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: "900",
  },
  card: {
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...shadow,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  clearButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  content: {
    paddingBottom: 118,
    paddingTop: 10,
  },
  empty: {
    fontSize: 14,
    fontWeight: "800",
    paddingVertical: 40,
    textAlign: "center",
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  header: {
    gap: 12,
    paddingTop: 8,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexShrink: 0,
    height: 68,
    justifyContent: "center",
    overflow: "hidden",
    width: 68,
  },
  location: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 7,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  price: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  priceRating: {
    flex: 1,
    minWidth: 0,
  },
  providerImage: {
    height: "100%",
    width: "100%",
  },
  providerName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
  },
  rating: {
    fontSize: 12,
    fontWeight: "800",
  },
  ratingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    minHeight: 48,
    minWidth: 0,
  },
  searchWrap: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 58,
    paddingHorizontal: 14,
    ...shadow,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  skeleton: {
    borderRadius: radius.lg,
    height: 104,
  },
  skeletonWrap: {
    gap: 10,
  },
  softError: {
    borderRadius: radius.md,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  titleText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  unavailable: {
    fontSize: 12,
    fontWeight: "800",
  },
});

export default React.memo(ProvidersScreen);
