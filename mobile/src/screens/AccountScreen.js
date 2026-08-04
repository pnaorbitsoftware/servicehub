import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { colors, responsiveMetrics, shadow, useThemeColors } from "../theme";
import ActionButton from "../components/ActionButton";

const defaultT = (_key, fallback) => fallback;

function getRoleLabel(role, t) {
  if (role === "provider") return t("common.serviceProvider", "Service Provider");
  if (role === "user") return t("common.client", "Client");
  return role || t("common.client", "Client");
}

function AccountInfoButton({ icon, title, copy, onPress }) {
  const theme = useThemeColors();
  const accent = icon.includes("bell") ? theme.mint || theme.success : icon.includes("credit") ? theme.amber : icon.includes("heart") ? theme.violet || theme.teal : theme.teal;
  const content = (
    <>
      <View style={[styles.infoIcon, { backgroundColor: `${accent}14` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={accent} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={[styles.infoTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.infoCopy, { color: theme.textMuted }]} numberOfLines={2}>{copy}</Text>
      </View>
      {onPress ? <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textMuted} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.infoButton, { backgroundColor: theme.surface }, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.infoButton, { backgroundColor: theme.surface }]}>{content}</View>;
}

function AccountScreen({
  user,
  settings,
  onOpenAuth,
  onLogout,
  onEditAccount,
  onEditProviderProfile,
  onOpenSettings,
  onOpenNotifications,
  onOpenContact,
  onOpenMyBookings,
  onOpenAddresses,
  onOpenPayments,
  onReferFriend,
  t = defaultT,
}) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const metrics = responsiveMetrics(width);
  const appearanceLabels = {
    light: t("settings.lightMode", "Light mode"),
    dark: t("settings.darkMode", "Dark mode"),
    system: t("settings.systemTheme", "System theme"),
  };
  const appearanceLabel = appearanceLabels[settings?.appearance || "light"];
  const roleLabel = getRoleLabel(user?.role, t);
  const isProvider = user?.role === "provider";
  const isClient = user?.role === "user";
  const profileIncomplete = isClient && user?.profileComplete !== true;
  const notificationsCopy = settings?.notificationsEnabled
    ? t("account.notificationsAllowed", "Allowed for booking updates, provider requests, and emails")
    : t("account.notificationsMuted", "Muted for app notification alerts");

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: Math.min(metrics.pagePadding, 20),
          gap: metrics.gutter,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>{t("account.title", "Account")}</Text>

      {user ? (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.profileTop}>
            <View style={[styles.avatar, { backgroundColor: theme.tealSoft }]}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <MaterialCommunityIcons name="account-circle-outline" size={34} color={theme.teal} />
              )}
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{profileIncomplete ? "Complete your profile" : user.name}</Text>
              <Text style={[styles.meta, { color: theme.textMuted }]} numberOfLines={1}>{profileIncomplete ? `Verified mobile: +91 ${user.phone}` : user.email}</Text>
              <Text
                style={[
                  styles.role,
                  {
                    backgroundColor: isProvider || isClient ? theme.successSoft : theme.amberSoft,
                    color: isProvider || isClient ? theme.success : theme.amber,
                  },
                ]}
              >
                {roleLabel}
              </Text>
            </View>
          </View>
          <View style={styles.actionStack}>
            <ActionButton title={profileIncomplete ? "Complete Profile" : t("account.editProfile", "Edit Profile")} icon="account-edit-outline" onPress={onEditAccount} />
            {user.role === "provider" ? (
              <>
                <ActionButton
                  title={t("account.editServiceDetails", "Edit Service Details")}
                  icon="briefcase-edit-outline"
                  variant="secondary"
                  onPress={onEditProviderProfile}
                />
              </>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <View style={styles.guestHero}>
            <View style={[styles.avatar, { backgroundColor: theme.tealSoft }]}> 
              <MaterialCommunityIcons name="account-lock-outline" size={34} color={theme.teal} />
            </View>
            <View style={[styles.securityVisual, { backgroundColor: theme.tealSoft }]}> 
              <MaterialCommunityIcons name="shield-check" size={52} color={theme.teal} />
            </View>
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{t("account.welcome", "Welcome to ServiceHub")}</Text>
          <Text style={[styles.meta, { color: theme.textMuted }]}>
            {t("account.welcomeCopy", "Login to book services, track bookings, and manage provider requests.")}
          </Text>
          <View style={styles.authRow}>
            <ActionButton
              title={t("common.login", "Login")}
              icon="login"
              onPress={() => onOpenAuth("login", "user")}
              style={[
                styles.authButton,
                width < 360 ? styles.authButtonFull : width < 412 ? styles.authButtonHalf : null,
              ]}
            />
            <ActionButton
              title={t("common.register", "Register")}
              icon="account-plus-outline"
              variant="secondary"
              onPress={() => onOpenAuth("register", "user")}
              style={[
                styles.authButton,
                width < 360 ? styles.authButtonFull : width < 412 ? styles.authButtonHalf : null,
              ]}
            />
            <ActionButton
              title={t("common.provider", "Provider")}
              icon="account-hard-hat-outline"
              variant="secondary"
              onPress={() => onOpenAuth("register", "provider")}
              style={[
                styles.authButton,
                width < 360 ? styles.authButtonFull : width < 412 ? styles.authButtonFull : null,
              ]}
            />
          </View>
        </View>
      )}

      <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        {isClient ? (
          <AccountInfoButton
            icon="account-hard-hat-outline"
            title="Register as Provider"
            copy="Create a separate provider account and submit it for approval"
            onPress={() => onOpenAuth("register", "provider")}
          />
        ) : null}
        {isClient ? (
          <AccountInfoButton
            icon="calendar-check-outline"
            title={t("account.myBookings", "My Bookings")}
            copy={t("account.myBookingsCopy", "Accepted provider requests and booking history")}
            onPress={onOpenMyBookings}
          />
        ) : null}
        <AccountInfoButton
          icon="cog-outline"
          title={t("account.settings", "Settings")}
          copy={`${appearanceLabel} ${t("account.selected", "selected")}`}
          onPress={onOpenSettings}
        />
        <AccountInfoButton
          icon="bell-ring-outline"
          title={t("account.notifications", "Notifications")}
          copy={notificationsCopy}
          onPress={onOpenNotifications}
        />
        <AccountInfoButton
          icon="map-marker-plus-outline"
          title={t("account.manageAddresses", "Manage Addresses")}
          copy={t("account.manageAddressesCopy", "Save home, office, and service addresses")}
          onPress={onOpenAddresses}
        />
        <AccountInfoButton
          icon="credit-card-outline"
          title={t("account.managePayments", "Manage Payments")}
          copy={t("account.managePaymentsCopy", "Add UPI, card, or cash payment preferences")}
          onPress={onOpenPayments}
        />
        <AccountInfoButton
          icon="account-heart-outline"
          title={t("account.referFriend", "Refer a friend")}
          copy={t("account.referFriendCopy", "Share ServiceHub with friends on WhatsApp")}
          onPress={onReferFriend}
        />
        <AccountInfoButton
          icon="map-marker-outline"
          title={t("account.serviceArea", "Service area")}
          copy={t("account.serviceAreaCopy", "Pune, Maharashtra and nearby cities")}
        />
        <AccountInfoButton
          icon="email-outline"
          title={t("account.contactUs", "Contact Us")}
          copy={t("account.contactUsCopy", "Email, phone, and service help information")}
          onPress={onOpenContact}
        />
      </View>

      {user ? (
        <ActionButton title={t("account.logout", "Logout")} icon="logout" variant="dangerSoft" onPress={onLogout} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionStack: {
    gap: 10,
  },
  authButton: {
    flex: 1,
    minWidth: 90,
    paddingHorizontal: 8,
  },
  authButtonHalf: {
    flexGrow: 1,
    minWidth: "46%",
  },
  authButtonFull: {
    flexGrow: 1,
    width: "100%",
  },
  authRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: 20,
    height: 64,
    justifyContent: "center",
    overflow: "hidden",
    width: 64,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 20,
    ...shadow,
  },
  content: {
    alignSelf: "center",
    paddingBottom: 110,
    paddingTop: 12,
    width: "100%",
    maxWidth: 560,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 0,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  infoCopy: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  infoButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderRadius: 0,
    flexDirection: "row",
    gap: 11,
    minHeight: 74,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  infoIcon: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    height: 44,
    width: 44,
  },
  infoTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  profileTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 13,
  },
  role: {
    alignSelf: "flex-start",
    backgroundColor: colors.amberSoft,
    borderRadius: 8,
    color: colors.amber,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.78,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "left",
  },
  guestHero: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  securityVisual: {
    alignItems: "center",
    borderRadius: 28,
    height: 92,
    justifyContent: "center",
    opacity: 0.9,
    width: 112,
  },
});

export default React.memo(AccountScreen);
