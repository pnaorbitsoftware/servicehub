import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  allHomeServices,
  getServiceVisual,
  promoBanners,
  quickServices,
  serviceCategories,
} from "../data/homeServicesData";
import { buildMarketplace, iconForCategory, imageForService } from "../data/catalog";
import { prefetchServiceImages } from "../lib/images";
import { colors, radius, shadow, useThemeColors } from "../theme";
import ProfileCompletionBanner from "../components/ProfileCompletionBanner";

// LinearGradient fallback (if expo-linear-gradient is not installed)
let LinearGradient;
try {
  // eslint-disable-next-line global-require
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (_) {
  LinearGradient = ({ colors, style, children, ...props }) => (
    <View style={[style, { backgroundColor: colors[0] }]} {...props}>
      {children}
    </View>
  );
}

const PAGE_GAP = 16;
const defaultT = (_key, fallback) => fallback;

// Hero carousel images – using existing assets to avoid import errors
const HERO_ART = require("../assets/images/hero/servicehub-hero-v2.jpg");
const POPULAR_SERVICE_IMAGES = {
  "AC Repair": require("../assets/images/popular/ac-repair-v2.jpg"),
  "Washing Machine": require("../assets/images/popular/washing-machine-v2.jpg"),
  Refrigerator: require("../assets/images/popular/refrigerator-v2.jpg"),
  Electrician: require("../assets/images/popular/electrician-v2.jpg"),
  Plumber: require("../assets/images/popular/plumber-v2.jpg"),
  "Bathroom Cleaning": require("../assets/images/popular/bathroom-cleaning-v2.jpg"),
};

// Build a carousel with 5 distinct images from existing assets
const HERO_IMAGES = [
  HERO_ART,
  POPULAR_SERVICE_IMAGES["AC Repair"],
  POPULAR_SERVICE_IMAGES["Washing Machine"],
  POPULAR_SERVICE_IMAGES["Refrigerator"],
  POPULAR_SERVICE_IMAGES["Electrician"],
];

// Emoji mapping for service categories
const CATEGORY_EMOJIS = {
  "AC & Appliance Repair": "❄️",
  "Electrician, Plumber & Carpenter": "🛠️",
  "Bathroom & Kitchen Cleaning": "🧹",
  "Salon at Home": "💇",
  "Car Wash & Service": "🚗",
  "Pest Control": "🐜",
  "Laundry & Dry Cleaning": "🧺",
  "Home Painting": "🎨",
  "Moving & Packing": "📦",
};

function createServicePayload(item, marketplaceServices = []) {
  const normalizedName = String(item.name || "").toLowerCase();
  const match = marketplaceServices.find((service) => {
    const serviceName = String(service.name || "").toLowerCase();
    const serviceCategory = String(service.category || "").toLowerCase();
    return serviceName.includes(normalizedName) || normalizedName.includes(serviceCategory) || normalizedName.includes(serviceName);
  });

  if (match) {
    return {
      ...match,
      name: item.name || match.name,
      category: item.category || match.category,
      description: item.description || `${item.name || match.name} by verified ServiceHub professionals.`,
      about: item.about || `Book ${item.name || match.name} from ServiceHub with trained local service partners.`,
      features: [item.name || match.category, "Verified professional", "Doorstep service"],
      image: imageForService(item),
      icon: item.icon || match.icon,
    };
  }

  const category = item.category || item.name || "Home services";
  return {
    id: item.id || item.name,
    name: item.name,
    category,
    location: "Nearby",
    rating: item.rating || 4.8,
    reviews: item.reviews || 120,
    responseTime: item.badge || "Fast",
    price: item.price || "Contact for price",
    phone: "",
    description: item.description || `${item.name} by verified ServiceHub professionals.`,
    about: item.about || `Book ${item.name} from ServiceHub with trained local service partners.`,
    features: [item.name, "Verified professional", "Doorstep service"],
    image: imageForService(item),
    icon: item.icon || iconForCategory(category),
  };
}

// ====== AnimatedPressable – reusable for press animation ======
const AnimatedPressable = ({ onPress, style, children, ...props }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: Platform.OS !== "web",
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

function HomeScreen({
  catalogProviders,
  catalogLoading,
  catalogError,
  refreshing,
  onRefresh,
  onBook,
  onViewDetails,
  onOpenProvidersForService,
  searchTerm,
  onSearchChange,
  dataSaver = false,
  selectedLocation,
  onOpenLocation,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  profileIncomplete = false,
  onCompleteProfile,
  t = defaultT,
}) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const pagePadding = Math.round(Math.min(Math.max(width * 0.045, 16), 24));
  const bannerWidth = Math.max(width - pagePadding * 2, 280);
  const [activeBanner, setActiveBanner] = useState(0);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const bannerRef = useRef(null);

  const marketplaceServices = useMemo(() => buildMarketplace(catalogProviders), [catalogProviders]);
  const recommendedProviders = useMemo(() => marketplaceServices.filter((provider) => provider.isBookable !== false).slice(0, 8), [marketplaceServices]);
  const keyExtractorProviderMiniCard = useCallback((item) => String(item.id), []);
  const renderProviderMiniCard = useCallback(
    ({ item }) => <ProviderMiniCard provider={item} onPress={onViewDetails} onBook={onBook} />,
    [onViewDetails, onBook]
  );

  const searchSuggestions = useMemo(() => {
    const requested = ["AC Repair", "Washing Machine", "Electrician", "Bathroom Cleaning", "Sofa Cleaning"];
    const categoryNames = new Set(serviceCategories.map((category) => category.title));
    const serviceNames = allHomeServices.map((service) => service.name).filter((name) => name && !categoryNames.has(name));
    return [...new Set([...requested, ...serviceNames])].slice(0, 16);
  }, []);

  useEffect(() => {
    if (dataSaver) return;
    prefetchServiceImages(marketplaceServices);
  }, [dataSaver, marketplaceServices]);

  // Auto‑rotate search suggestions
  useEffect(() => {
    if (searchTerm.trim() || searchSuggestions.length < 2) return;
    const timer = setInterval(() => setSuggestionIndex((current) => (current + 1) % searchSuggestions.length), 1600);
    return () => clearInterval(timer);
  }, [searchSuggestions.length, searchTerm]);

  // Auto‑rotate promo banners
  useEffect(() => {
    if (!promoBanners.length) return;
    const timer = setInterval(() => {
      setActiveBanner((current) => {
        const next = current >= promoBanners.length - 1 ? 0 : current + 1;
        bannerRef.current?.scrollTo({ x: next * (bannerWidth + PAGE_GAP), animated: true });
        return next;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [bannerWidth]);

  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    const unique = new Map();
    allHomeServices.forEach((service) => {
      const haystack = `${service.name} ${service.category || ""}`.toLowerCase();
      if (haystack.includes(query)) unique.set(service.name, service);
    });
    marketplaceServices.forEach((service) => {
      const haystack = `${service.name} ${service.category || ""} ${service.description || ""} ${service.location || ""}`.toLowerCase();
      if (haystack.includes(query)) unique.set(service.id || service.name, service);
    });

    return [...unique.values()].slice(0, 8);
  }, [marketplaceServices, searchTerm]);

  const openServiceProviders = useCallback(
    (service) => {
      const payload = createServicePayload(service, marketplaceServices);
      onViewDetails(payload);
    },
    [marketplaceServices, onViewDetails]
  );

  const handleBookPress = useCallback(
    (service) => onBook(createServicePayload(service, marketplaceServices)),
    [marketplaceServices, onBook]
  );

  const openSuggestedService = useCallback(
    (name) => {
      const normalizedName = String(name || "").toLowerCase();
      const compactName = normalizedName.replace(/\s+service$/, "").replace(/\s+repair$/, "").trim();
      const matchedService =
        allHomeServices.find((service) => String(service.name || "").toLowerCase() === normalizedName) ||
        allHomeServices.find((service) => String(service.name || "").toLowerCase().includes(compactName)) ||
        { id: `suggestion-${name}`, name, category: "Home services" };
      openServiceProviders(matchedService);
    },
    [openServiceProviders]
  );

  const handleBannerScroll = useCallback(
    (event) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (bannerWidth + PAGE_GAP));
      setActiveBanner(Math.min(Math.max(nextIndex, 0), promoBanners.length - 1));
    },
    [bannerWidth]
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.teal]} tintColor={theme.teal} />}
      contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background, paddingHorizontal: pagePadding }]}
    >
      <LocationHeader
        location={selectedLocation}
        unreadCount={unreadNotificationsCount}
        onOpenLocation={onOpenLocation}
        onOpenNotifications={onOpenNotifications}
      />

      <ProfileCompletionBanner visible={profileIncomplete} onPress={onCompleteProfile} />

      {/* ---- SEARCH BAR ---- */}
      <SearchBar
        value={searchTerm}
        onChangeText={onSearchChange}
        suggestion={searchSuggestions[suggestionIndex] || "AC Repair"}
        onSuggestionPress={openSuggestedService}
        t={t}
      />

      {searchResults.length ? <SearchResults results={searchResults} onPress={openServiceProviders} /> : null}

      {/* ---- TOP CATEGORY GRID (compact) ---- */}
      <CategoryGrid categories={serviceCategories} onPress={openServiceProviders} />

      {/* ---- HERO CAROUSEL ---- */}
      <HeroCarousel onPress={() => openServiceProviders({ name: "Full Home Cleaning", category: "Bathroom & Kitchen Cleaning" })} />

      {/* ---- BOTTOM CATEGORY STICKERS (compact) ---- */}
      <DiscoveryStickers onPress={openServiceProviders} />

      <SectionHeader title="Popular services" actionLabel="View all" onAction={() => openServiceProviders({ name: "Providers", category: "Home services" })} />
      <ServiceGrid services={quickServices} onPress={openServiceProviders} />

      <SectionHeader title="Offers for you" />
      <OfferCarousel
        banners={promoBanners}
        bannerWidth={bannerWidth}
        activeIndex={activeBanner}
        onScroll={handleBannerScroll}
        onAction={handleBookPress}
        scrollRef={bannerRef}
      />

      <SeasonalStory onPress={() => openServiceProviders({ name: "Bathroom Cleaning", category: "Bathroom & Kitchen Cleaning" })} />

      {catalogError && marketplaceServices.length ? (
        <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{catalogError}</Text>
      ) : null}
      {catalogLoading && !marketplaceServices.length ? <SkeletonRow /> : null}

      <SectionHeader title="Recommended providers" actionLabel="See all" onAction={() => openServiceProviders({ name: "Providers", category: "Home services" })} />
      <FlatList
        data={recommendedProviders}
        horizontal
        keyExtractor={keyExtractorProviderMiniCard}
        renderItem={renderProviderMiniCard}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
        ListEmptyComponent={<Text style={[styles.emptyInline, { color: theme.textMuted }]}>Providers will appear here.</Text>}
      />

      <FooterExperienceCard onPress={() => openServiceProviders({ name: "Providers", category: "Home services" })} />
    </ScrollView>
  );
}

// ====== LocationHeader – unchanged ======
function LocationHeader({ location, unreadCount, onOpenLocation, onOpenNotifications }) {
  const theme = useThemeColors();
  const label = location?.address || location?.label || "Select your location";

  return (
    <View style={styles.locationHeader}>
      <View style={styles.brandWrap}>
        <View style={[styles.brandIcon, { backgroundColor: theme.teal }]}> 
          <MaterialCommunityIcons name="home-heart" size={20} color="#ffffff" />
        </View>
        <View>
          <Text style={[styles.brandName, { color: theme.text }]}>ServiceHub</Text>
          <Text style={[styles.brandTagline, { color: theme.textMuted }]}>Trusted home services</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onOpenLocation} style={({ pressed }) => [styles.locationChip, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="map-marker" size={16} color={theme.teal} />
        <Text style={[styles.locationChipText, { color: theme.text }]} numberOfLines={1}>{label}</Text>
        <MaterialCommunityIcons name="chevron-down" size={16} color={theme.textMuted} />
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onOpenNotifications} style={({ pressed }) => [styles.bellButton, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="bell-outline" size={23} color={theme.text} />
        {unreadCount ? (
          <View style={[styles.notificationBadge, { backgroundColor: theme.rose }]}>
            <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

// ====== CategoryGrid – updated with compact design and animation ======
function CategoryGrid({ categories, onPress }) {
  const theme = useThemeColors();
  const emojiMap = CATEGORY_EMOJIS;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryGrid}
    >
      {categories.map((category) => {
        const emoji = emojiMap[category.title] || "🛠️";
        return (
          <AnimatedPressable
            key={category.id || category.title}
            onPress={() => onPress({ name: category.title, category: category.title })}
            style={[styles.categoryCard, { backgroundColor: theme.surface }]}
          >
            <Text style={styles.categoryEmoji}>{emoji}</Text>
            <Text style={[styles.categoryName, { color: theme.text }]} numberOfLines={2}>
              {category.title}
            </Text>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

// ====== DiscoveryStickers – updated with compact design and animation ======
function DiscoveryStickers({ onPress }) {
  const theme = useThemeColors();
  const stickers = [
    { emoji: "🌧️", label: "Monsoon Ready", service: { name: "AC Repair", category: "AC & Appliance Repair" } },
    { emoji: "🧹", label: "Deep Clean", service: { name: "Bathroom Cleaning", category: "Bathroom & Kitchen Cleaning" } },
    { emoji: "🛠️", label: "Appliance Repair", service: { name: "Electrician", category: "Electrician, Plumber & Carpenter" } },
    { emoji: "🚿", label: "Bathroom Cleaning", service: { name: "Bathroom Cleaning", category: "Bathroom & Kitchen Cleaning" } },
    { emoji: "❄️", label: "AC Service", service: { name: "AC Repair", category: "AC & Appliance Repair" } },
    { emoji: "🚗", label: "Car Wash", service: { name: "Car Wash", category: "Car Wash & Service" } },
    { emoji: "🐜", label: "Pest Control", service: { name: "Pest Control", category: "Pest Control" } },
    { emoji: "🧺", label: "Laundry", service: { name: "Laundry", category: "Laundry & Dry Cleaning" } },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stickerRail}
    >
      {stickers.map((item) => (
        <AnimatedPressable
          key={item.label}
          onPress={() => onPress(item.service)}
          style={[styles.discoverySticker, { backgroundColor: theme.surface }]}
        >
          <Text style={styles.stickerEmoji}>{item.emoji}</Text>
          <Text style={[styles.discoveryStickerText, { color: theme.text }]}>
            {item.label}
          </Text>
        </AnimatedPressable>
      ))}
    </ScrollView>
  );
}

// ====== HeroCarousel – unchanged (kept as is) ======
function HeroCarousel({ onPress }) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Auto‑play interval using ScrollView's scrollTo
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % HERO_IMAGES.length;
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ x: next * width, animated: true });
      }
      setActiveIndex(next);
    }, 3000);
    return () => clearInterval(timer);
  }, [activeIndex, width]);

  // Fade & scale entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  // Floating animation for badges
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    float.start();
    return () => float.stop();
  }, []);

  // Pulse animation for rating badge
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== activeIndex && index >= 0 && index < HERO_IMAGES.length) {
      setActiveIndex(index);
    }
  };

  // Keep this as a plain function: ScrollView expects a callable onScroll prop.
  const onScrollAnimated = (event) => {
    handleScroll(event);
  };

  // Animated pagination dots
  const renderDot = (index) => {
    const isActive = index === activeIndex;
    const dotWidth = isActive ? 28 : 8;
    const dotOpacity = isActive ? 1 : 0.5;
    return (
      <Animated.View
        key={index}
        style={[
          styles.heroDot,
          {
            width: dotWidth,
            opacity: dotOpacity,
            backgroundColor: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
          },
        ]}
      />
    );
  };

  const floatStyle = {
    transform: [
      {
        translateY: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        }),
      },
    ],
  };

  const pulseStyle = {
    transform: [{ scale: pulseAnim }],
  };

  return (
    <Animated.View style={[styles.heroWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.heroCarousel, { backgroundColor: theme.surface }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScrollAnimated}
          scrollEventThrottle={16}
          style={styles.heroFlatList}
        >
          {HERO_IMAGES.map((image, index) => (
            <View key={`hero-${index}`} style={{ width, height: '100%' }}>
              <Image source={image} style={styles.heroImage} resizeMode="cover" />
            </View>
          ))}
        </ScrollView>

        {/* Premium dark gradient overlay - deeper for better contrast */}
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
          style={styles.heroOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Glassmorphism badge – top right */}
        <Animated.View style={[styles.heroBadgeTop, floatStyle]}>
          <MaterialCommunityIcons name="shimmer" size={18} color="#ffffff" />
          <Text style={styles.heroBadgeTopText}>Premium Service</Text>
        </Animated.View>

        {/* Floating rating badge – bottom right */}
        <Animated.View style={[styles.heroBadgeBottom, pulseStyle]}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#246bfd" />
          <Text style={styles.heroBadgeBottomText}>4.9 ★</Text>
        </Animated.View>

        {/* Text content – properly aligned with padding */}
        <View style={styles.heroContent}>
          <View style={styles.heroEyebrow}>
            <MaterialCommunityIcons name="lightning-bolt" size={14} color="#fcd34d" />
            <Text style={styles.heroEyebrowText}>TRUSTED PROFESSIONALS</Text>
          </View>
          <Text style={styles.heroTitle}>
            Your Home{'\n'}
            <Text style={styles.heroTitleAccent}>Handled Professionally</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Trusted experts for cleaning, repairs and installation.
          </Text>
          {/* Premium CTA Button with gradient and scale on press */}
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              styles.heroCta,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <LinearGradient
              colors={['#246bfd', '#4f8cff']}
              style={styles.heroCtaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.heroCtaText}>Book a service</Text>
              <MaterialCommunityIcons name="arrow-top-right" size={20} color="#ffffff" />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Pagination dots */}
        <View style={styles.heroPagination}>
          {HERO_IMAGES.map((_, index) => renderDot(index))}
        </View>
      </View>
    </Animated.View>
  );
}

// ====== SearchBar – unchanged ======
function SearchBar({ value, onChangeText, suggestion, onSuggestionPress, t }) {
  const theme = useThemeColors();
  const showSuggestion = !value;

  return (
    <View style={[styles.searchBar, { backgroundColor: '#ffffff', borderColor: theme.border }]}>
      <MaterialCommunityIcons name="magnify" size={24} color={theme.textMuted} />
      <View style={styles.searchInputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder=""
          placeholderTextColor="transparent"
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
          autoCorrect={false}
        />
        {showSuggestion ? (
          <View style={[styles.searchPlaceholderRow, { pointerEvents: "box-none" }]}>
            <Text style={[styles.searchPlaceholderLead, { color: theme.textMuted }]}>{t("search.searchFor", "Search for")}</Text>
            <Pressable accessibilityRole="button" onPress={() => onSuggestionPress(suggestion)} style={({ pressed }) => [styles.searchSuggestionPill, { backgroundColor: theme.tealSoft }, pressed && styles.pressed]}>
              <Text style={[styles.searchSuggestionText, { color: theme.teal }]} numberOfLines={1}>{suggestion}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <MaterialCommunityIcons name="filter-variant" size={24} color={theme.textMuted} />
    </View>
  );
}

// ====== SearchResults – unchanged ======
function SearchResults({ results, onPress }) {
  const theme = useThemeColors();
  return (
    <View style={[styles.searchResults, { backgroundColor: theme.surface }]}> 
      {results.map((item) => (
        <Pressable key={`${item.id || item.name}-result`} style={styles.searchResultRow} onPress={() => onPress(item)}>
          <MaterialCommunityIcons name={item.icon || iconForCategory(item.category)} size={20} color={theme.teal} />
          <View style={styles.searchResultTextWrap}>
            <Text style={[styles.searchResultText, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.searchResultMeta, { color: theme.textMuted }]} numberOfLines={1}>{item.category || item.location || "Service"}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// ====== OfferCarousel – unchanged ======
function OfferCarousel({ banners, bannerWidth, activeIndex, onScroll, onAction, scrollRef }) {
  const theme = useThemeColors();
  return (
    <View style={styles.carouselWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        snapToInterval={bannerWidth + PAGE_GAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bannerTrack}
        onMomentumScrollEnd={onScroll}
      >
        {banners.map((banner) => <OfferBanner key={banner.id} banner={banner} width={bannerWidth} onAction={onAction} />)}
      </ScrollView>
      <View style={styles.dots}>
        {banners.map((banner, index) => (
          <View key={`${banner.id}-dot`} style={[styles.dot, { backgroundColor: theme.border }, activeIndex === index && { backgroundColor: theme.teal, width: 28 }]} />
        ))}
      </View>
    </View>
  );
}

// ====== OfferBanner – unchanged ======
function OfferBanner({ banner, width, onAction }) {
  const theme = useThemeColors();
  const imageKey = banner.serviceName || banner.title;
  const imageSource = POPULAR_SERVICE_IMAGES[imageKey] || HERO_ART;

  return (
    <Pressable style={[styles.banner, { backgroundColor: theme.surface, width }]} onPress={() => onAction({ id: banner.id, name: banner.serviceName || banner.subtitle || banner.title, category: banner.category || banner.title, icon: banner.icon, price: "Contact for price" })}>
      <View style={styles.bannerText}>
        {banner.eyebrow ? <Text style={[styles.bannerEyebrow, { color: banner.accent }]}>{banner.eyebrow}</Text> : null}
        <Text style={[styles.bannerTitle, { color: theme.text }]}>{banner.title}</Text>
        <Text style={[styles.bannerSubtitle, { color: theme.textMuted }]}>{banner.subtitle}</Text>
        <View style={[styles.bannerButton, { backgroundColor: theme.teal }]}>
          <Text style={styles.bannerButtonText}>{banner.action}</Text>
        </View>
      </View>
      <View style={[styles.bannerArt, { overflow: 'hidden' }]}>
        <Image source={imageSource} style={styles.bannerArtImage} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.1)']}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </Pressable>
  );
}

// ====== SectionHeader – unchanged ======
function SectionHeader({ title, actionLabel, onAction }) {
  const theme = useThemeColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={[styles.sectionAction, { color: theme.teal }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ====== ServiceGrid – unchanged ======
function ServiceGrid({ services, onPress }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickGrid}>
      {services.map((service) => <ServiceTile key={service.id || service.name} service={service} onPress={onPress} />)}
    </ScrollView>
  );
}

function ServiceTile({ service, onPress }) {
  const theme = useThemeColors();
  const visual = getServiceVisual(service);
  const image = POPULAR_SERVICE_IMAGES[service.name];
  return (
    <Pressable style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]} onPress={() => onPress(service)}>
      <View style={[styles.quickImageBox, { backgroundColor: service.bg || visual.bg }]}> 
        {image ? <Image source={image} style={styles.quickServiceImage} resizeMode="cover" /> : <MaterialCommunityIcons name={service.icon || visual.icon} size={34} color={service.color || visual.color} />}
        <View style={styles.quickImageShade} />
        {service.badge ? <View style={styles.quickTimeFloating}><MaterialCommunityIcons name="clock-fast" size={11} color="#ffffff" /><Text style={styles.quickTimeFloatingText}>{service.badge}</Text></View> : null}
      </View>
      <Text style={[styles.quickTitle, { color: theme.text }]} numberOfLines={2}>{service.name}</Text>
      <View style={styles.quickRatingRow}><MaterialCommunityIcons name="star" size={12} color={theme.amber} /><Text style={[styles.quickRatingText, { color: theme.textMuted }]}>4.8 · Verified</Text></View>
    </Pressable>
  );
}

// ====== SeasonalStory – unchanged ======
function SeasonalStory({ onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.seasonalCard, pressed && styles.pressed]}>
      <View style={styles.seasonalBubbleOne} />
      <View style={styles.seasonalBubbleTwo} />
      <View style={styles.seasonalCopy}>
        <Text style={styles.seasonalKicker}>FRESH-HOME FEST</Text>
        <Text style={styles.seasonalTitle}>A cleaner home,{"\n"}a lighter week.</Text>
        <View style={styles.seasonalCta}><Text style={styles.seasonalCtaText}>Explore cleaning</Text><MaterialCommunityIcons name="arrow-right" size={15} color="#ffffff" /></View>
      </View>
      <View style={styles.seasonalArt}>
        <MaterialCommunityIcons name="spray-bottle" size={42} color="#ffffff" />
        <MaterialCommunityIcons name="shimmer" size={24} color="#fde68a" style={styles.seasonalSparkle} />
      </View>
      <View style={styles.seasonalSticker}><Text style={styles.seasonalStickerText}>20% OFF</Text></View>
    </Pressable>
  );
}

// ====== FooterExperienceCard – unchanged ======
function FooterExperienceCard({ onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.footerExperience, pressed && styles.pressed]}>
      <View style={styles.footerExperienceTop}>
        <View style={styles.footerExperienceIcon}><MaterialCommunityIcons name="heart-flash" size={24} color="#101a35" /></View>
        <View style={styles.footerStars}><MaterialCommunityIcons name="star" size={14} color="#fbbf24" /><MaterialCommunityIcons name="star" size={18} color="#fbbf24" /><MaterialCommunityIcons name="star" size={14} color="#fbbf24" /></View>
      </View>
      <Text style={styles.footerExperienceTitle}>One app. Every home task.</Text>
      <Text style={styles.footerExperienceCopy}>Background-verified experts, transparent pricing and support whenever you need it.</Text>
      <View style={styles.footerExperienceButton}><Text style={styles.footerExperienceButtonText}>Meet our professionals</Text><MaterialCommunityIcons name="arrow-right" size={17} color="#101a35" /></View>
    </Pressable>
  );
}

// ====== ProviderMiniCard – unchanged ======
const ProviderMiniCard = React.memo(function ProviderMiniCard({ provider, onPress, onBook }) {
  const theme = useThemeColors();
  const profileImage = provider.profileImage || "";
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Pressable style={({ pressed }) => [styles.providerMiniCard, { backgroundColor: theme.surface }, pressed && styles.pressed]} onPress={() => onPress(provider)}>
      <View style={[styles.providerAvatar, { backgroundColor: theme.surfaceMuted }]}>
        {profileImage && !imageFailed ? <Image source={{ uri: profileImage }} style={styles.providerImage} onError={() => setImageFailed(true)} /> : <MaterialCommunityIcons name={provider.icon || "account-hard-hat-outline"} size={28} color={theme.teal} />}
      </View>
      <Text style={[styles.providerName, { color: theme.text }]} numberOfLines={1}>{provider.name}</Text>
      <Text style={[styles.providerCategory, { color: theme.textMuted }]} numberOfLines={1}>{provider.category}</Text>
      <View style={styles.providerMetaRow}>
        <MaterialCommunityIcons name="star" size={13} color={theme.amber} />
        <Text style={[styles.providerMeta, { color: theme.textMuted }]}>{provider.rating || "New"}</Text>
      </View>
      <Pressable disabled={!provider.isBookable} onPress={() => onBook(provider)} style={[styles.providerBookButton, { backgroundColor: provider.isBookable ? theme.teal : theme.surfaceMuted }]}>
        <Text style={[styles.providerBookText, { color: provider.isBookable ? "#ffffff" : theme.textMuted }]}>{provider.isBookable ? "Book" : "Unavailable"}</Text>
      </Pressable>
    </Pressable>
  );
});

// ====== SkeletonRow – unchanged ======
function SkeletonRow() {
  const theme = useThemeColors();
  return (
    <View style={styles.skeletonRow}>
      {[0, 1, 2].map((item) => <View key={item} style={[styles.skeletonCard, { backgroundColor: theme.surfaceMuted }]} />)}
    </View>
  );
}

// ====== Styles ======
const styles = StyleSheet.create({
  // ----- Global -----
  scrollContent: {
    gap: 20,
    paddingBottom: 118,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },

  // ----- Location Header -----
  locationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingTop: 14,
    marginBottom: 4,
  },
  brandIcon: {
    alignItems: "center",
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  brandWrap: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 9,
    minWidth: 0,
  },
  locationChip: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    maxWidth: 114,
    minHeight: 42,
    paddingHorizontal: 9,
  },
  locationChipText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "800",
  },
  bellButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...shadow,
  },
  notificationBadge: {
    borderRadius: 10,
    height: 18,
    minWidth: 18,
    position: "absolute",
    right: -4,
    top: -4,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },

  // ----- Search Bar -----
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    minHeight: 56,
    gap: 10,
    ...shadow,
  },
  searchInputWrap: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  searchInput: {
    fontSize: 15,
    fontWeight: "800",
    minHeight: 50,
    paddingVertical: 0,
  },
  searchPlaceholderLead: {
    flexShrink: 0,
    fontSize: 14,
    fontWeight: "800",
    color: "#999",
  },
  searchPlaceholderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    left: 0,
    position: "absolute",
    right: 0,
  },
  searchSuggestionPill: {
    borderRadius: 999,
    flexShrink: 1,
    minHeight: 28,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  searchSuggestionText: {
    fontSize: 13,
    fontWeight: "900",
  },
  searchResults: {
    borderRadius: 20,
    marginTop: -8,
    paddingHorizontal: 12,
    ...shadow,
  },
  searchResultRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
  },
  searchResultText: {
    fontSize: 14,
    fontWeight: "900",
  },
  searchResultMeta: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  searchResultTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  // ----- Category Grid (updated: compact) -----
  categoryGrid: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  categoryCard: {
    width: 76,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 13,
  },

  // ----- Discovery Stickers (updated: compact) -----
  stickerRail: {
    gap: 8,
    paddingRight: 4,
  },
  discoverySticker: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 72,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  stickerEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  discoveryStickerText: {
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },

  // ----- Hero Carousel -----
  heroWrapper: {
    marginVertical: 0,
    borderRadius: 28,
    overflow: 'hidden',
    ...shadow,
  },
  heroCarousel: {
    height: 300,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  heroFlatList: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    position: 'absolute',
    bottom: 70,
    left: 24,
    right: 24,
    paddingBottom: 8,
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroEyebrowText: {
    color: '#fcd34d',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    letterSpacing: -0.6,
    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  heroTitleAccent: {
    color: '#b6d4ff',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 16,
    textShadow: '0 1px 4px rgba(0,0,0,0.2)',
  },
  heroCta: {
    alignSelf: 'flex-start',
    borderRadius: 30,
    overflow: 'hidden',
    ...shadow,
  },
  heroCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  heroCtaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  heroBadgeTop: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroBadgeTopText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroBadgeBottom: {
    position: 'absolute',
    bottom: 110,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...shadow,
  },
  heroBadgeBottomText: {
    color: '#101a35',
    fontSize: 13,
    fontWeight: '900',
  },
  heroPagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  heroDot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
    transition: 'width 0.2s',
  },

  // ----- Popular Services (ServiceGrid) -----
  quickGrid: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 6,
    paddingRight: 4,
  },
  quickCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 10,
    width: 164,
    ...shadow,
  },
  quickImageBox: {
    alignItems: "center",
    borderRadius: 16,
    height: 120,
    justifyContent: "center",
    overflow: "hidden",
  },
  quickServiceImage: {
    height: "100%",
    width: "100%",
  },
  quickImageShade: {
    backgroundColor: "rgba(16,26,53,0.08)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  quickTimeFloating: {
    alignItems: "center",
    backgroundColor: "rgba(16,26,53,0.8)",
    borderRadius: 99,
    bottom: 8,
    flexDirection: "row",
    gap: 4,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
  },
  quickTimeFloatingText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
    minHeight: 36,
  },
  quickRatingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  quickRatingText: {
    fontSize: 11,
    fontWeight: "800",
  },

  // ----- Offers (OfferCarousel) -----
  carouselWrap: {
    gap: 12,
  },
  banner: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: "row",
    gap: 12,
    marginRight: PAGE_GAP,
    minHeight: 146,
    overflow: "hidden",
    padding: 16,
    ...shadow,
  },
  bannerArt: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 16,
    height: 94,
    justifyContent: "center",
    width: 112,
  },
  bannerArtImage: {
    height: "100%",
    width: "100%",
  },
  bannerButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 12,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bannerButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  bannerEyebrow: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  bannerSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6,
  },
  bannerText: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 25,
    marginTop: 5,
  },
  bannerTrack: {
    paddingRight: 2,
  },
  dot: {
    borderRadius: 999,
    height: 5,
    width: 16,
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
  },

  // ----- Section Header -----
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "900",
  },

  // ----- Providers (Mini Cards) -----
  providerMiniCard: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    width: 170,
    ...shadow,
  },
  providerAvatar: {
    alignItems: "center",
    borderRadius: 16,
    height: 60,
    justifyContent: "center",
    overflow: "hidden",
    width: 60,
  },
  providerImage: {
    height: "100%",
    width: "100%",
  },
  providerName: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 10,
  },
  providerCategory: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  providerMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 7,
  },
  providerMeta: {
    fontSize: 12,
    fontWeight: "800",
  },
  providerBookButton: {
    alignItems: "center",
    borderRadius: 12,
    marginTop: 10,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  providerBookText: {
    fontSize: 12,
    fontWeight: "900",
  },

  // ----- Other -----
  horizontalList: {
    gap: 12,
    paddingRight: 4,
  },
  emptyInline: {
    fontSize: 13,
    fontWeight: "800",
    paddingVertical: 22,
  },
  softError: {
    borderRadius: 16,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: 12,
  },
  skeletonCard: {
    borderRadius: 20,
    height: 92,
    flex: 1,
  },

  // ----- Seasonal Story -----
  seasonalCard: {
    backgroundColor: "#7c3aed",
    borderRadius: 24,
    minHeight: 172,
    overflow: "hidden",
    padding: 18,
    position: "relative",
    ...shadow,
  },
  seasonalBubbleOne: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 90,
    height: 150,
    position: "absolute",
    right: -35,
    top: -44,
    width: 150,
  },
  seasonalBubbleTwo: {
    backgroundColor: "rgba(45,212,191,0.24)",
    borderRadius: 80,
    bottom: -70,
    height: 150,
    position: "absolute",
    right: 38,
    width: 150,
  },
  seasonalCopy: {
    maxWidth: "66%",
    zIndex: 2,
  },
  seasonalKicker: {
    color: "#ddd6fe",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  seasonalTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 26,
    marginTop: 8,
  },
  seasonalCta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 13,
  },
  seasonalCtaText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  seasonalArt: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 32,
    borderWidth: 1,
    height: 96,
    justifyContent: "center",
    position: "absolute",
    right: 17,
    top: 44,
    transform: [{ rotate: "7deg" }],
    width: 96,
  },
  seasonalSparkle: {
    position: "absolute",
    right: 8,
    top: 8,
  },
  seasonalSticker: {
    backgroundColor: "#fbbf24",
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: "absolute",
    right: 12,
    top: 10,
    transform: [{ rotate: "8deg" }],
  },
  seasonalStickerText: {
    color: "#101a35",
    fontSize: 9,
    fontWeight: "900",
  },

  // ----- Footer Experience -----
  footerExperience: {
    backgroundColor: "#101a35",
    borderRadius: 26,
    minHeight: 230,
    overflow: "hidden",
    padding: 20,
    position: "relative",
  },
  footerExperienceTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerExperienceIcon: {
    alignItems: "center",
    backgroundColor: "#67e8f9",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    transform: [{ rotate: "-7deg" }],
    width: 48,
  },
  footerStars: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  footerExperienceTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 20,
  },
  footerExperienceCopy: {
    color: "#aebbd5",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 8,
    maxWidth: "90%",
  },
  footerExperienceButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  footerExperienceButtonText: {
    color: "#101a35",
    fontSize: 11,
    fontWeight: "900",
  },
});

export default React.memo(HomeScreen);
