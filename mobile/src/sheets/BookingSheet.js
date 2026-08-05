import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { showConfirm } from "../lib/confirm";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import TextField from "../components/TextField";
import { finalServiceNames } from "../data/servicesData";
import { durationOptions } from "../lib/formatters";
import { colors, radius, useThemeColors } from "../theme";

const emptyForm = {
  name: "",
  phone: "",
  service: "",
  address: "",
  problemDescription: "",
  date: "",
  time: "10:00",
  duration: "1 hour",
  providerId: "",
  addressLocation: null,
  houseNo: "",
  street: "",
  area: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  landmark: "",
  locationType: "Custom Address",
};

const defaultT = (_key, fallback) => fallback;
const SLOT_GROUPS = [
  { label: "Morning", icon: "weather-sunset-up", slots: ["08:00", "10:00", "11:30"] },
  { label: "Afternoon", icon: "white-balance-sunny", slots: ["13:00", "15:00", "16:30"] },
  { label: "Evening", icon: "weather-sunset-down", slots: ["18:00", "19:30"] },
];

function SectionTitle({ step, icon, title, copy }) {
  const theme = useThemeColors();
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.stepIcon, { backgroundColor: theme.tealSoft }]}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.teal} />
      </View>
      <View style={styles.sectionTitleCopy}>
        <Text style={[styles.sectionEyebrow, { color: theme.teal }]}>STEP {step}</Text>
        <Text style={[styles.sectionHeading, { color: theme.text }]}>{title}</Text>
        {copy ? <Text style={[styles.sectionCopy, { color: theme.textMuted }]}>{copy}</Text> : null}
      </View>
    </View>
  );
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatDisplayDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function toApiDate(displayDate) {
  const [day, month, year] = displayDate.split("-");
  return `${year}-${month}-${day}`;
}

function formatTimeLabel(value) {
  const [hourValue, minuteValue] = value.split(":").map(Number);
  const hour = hourValue % 12 || 12;
  const minute = String(minuteValue || 0).padStart(2, "0");
  return `${hour}:${minute} ${hourValue >= 12 ? "PM" : "AM"}`;
}

function dateFromDisplay(displayDate) {
  if (!displayDate) return startOfToday();
  const [day, month, year] = displayDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateWithTime(time) {
  const value = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  value.setHours(hours || 0, minutes || 0, 0, 0);
  return value;
}

function PickerField({ label, value, placeholder, icon, onPress }) {
  const theme = useThemeColors();
  return (
    <View style={styles.pickerWrap}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.pickerField,
          { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.pickerValue, { color: value ? theme.text : theme.textMuted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <MaterialCommunityIcons name={icon} size={21} color={theme.teal} />
      </Pressable>
    </View>
  );
}

export default function BookingSheet({ visible, service, user, initialForm = null, submitting, locatingAddress = false, t = defaultT, onClose, onSubmit, onUseCurrentLocation }) {
  const theme = useThemeColors();
  const { width } = useWindowDimensions();
  const [form, setForm] = useState(emptyForm);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const stackDateTimeFields = width < 380;
  const providerUnavailable = service?.isBookable === false || ["inactive", "absent"].includes(service?.availabilityStatus);

  useEffect(() => {
    if (!visible) return;
    setForm({
      ...emptyForm,
      name: user?.name || "",
      phone: user?.phone || "",
      service: finalServiceNames.includes(service?.name)
        ? service.name
        : finalServiceNames.includes(service?.category)
          ? service.category
          : service?.name || service?.category || "",
      providerId: service?.providerId || "",
      date: formatDisplayDate(startOfToday()),
      ...(initialForm || {}),
    });
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, [initialForm, service, user, visible]);

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const minDate = startOfToday();
  const servicePrice = service?.price || service?.startingPrice || "Price after inspection";

  const handleDateChange = (_event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (!selectedDate) return;

    const nextDate = selectedDate < minDate ? minDate : selectedDate;
    update("date")(formatDisplayDate(nextDate));
  };

  const handleTimeChange = (_event, selectedTime) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (!selectedTime) return;

    const hours = String(selectedTime.getHours()).padStart(2, "0");
    const minutes = String(selectedTime.getMinutes()).padStart(2, "0");
    update("time")(`${hours}:${minutes}`);
  };


  const useCurrentLocation = async () => {
    if (!onUseCurrentLocation) return;
    const location = await onUseCurrentLocation();
    if (!location) return;
    setForm((current) => ({
      ...current,
      address: location.address || current.address,
      addressLocation: location,
      locationType: "Current Location",
    }));
  };
  const submit = () => {
    const lat = Number(form.addressLocation?.latitude || 0);
    const lng = Number(form.addressLocation?.longitude || 0);
    if (!lat || !lng || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      showConfirm("Location Required", "Please click 'Use Current Location' to detect your location coordinates before booking.");
      return;
    }
    const finalFormattedAddress = [
      form.houseNo,
      form.street,
      form.area || form.landmark,
      form.city,
      form.state,
      form.postalCode
    ].filter(Boolean).join(", ") || form.address;

    onSubmit({
      ...form,
      address: finalFormattedAddress,
      date: toApiDate(form.date),
      bookingLocation: {
        latitude: lat,
        longitude: lng,
        formattedAddress: finalFormattedAddress,
        houseNo: form.houseNo || "",
        street: form.street || "",
        area: form.area || "",
        city: form.city || "",
        state: form.state || "",
        country: form.country || "India",
        postalCode: form.postalCode || "",
        landmark: form.landmark || "",
        locationType: form.locationType || "Custom Address",
      }
    });
  };

  return (
    <ModalSheet
      visible={visible}
      title={t("booking.title", "Book service")}
      subtitle={service ? `${service.name} | ${service.category}` : t("booking.subtitle", "Create a service request")}
      onClose={onClose}
      footer={
        <View style={styles.checkoutBar}>
          <View style={styles.checkoutCopy}>
            <Text style={[styles.checkoutLabel, { color: theme.textMuted }]}>ESTIMATED PRICE</Text>
            <Text style={[styles.checkoutPrice, { color: theme.text }]} numberOfLines={1}>{servicePrice}</Text>
          </View>
          <ActionButton
            title={submitting ? t("common.saving", "Saving...") : "Review booking"}
            icon="arrow-right"
            disabled={submitting || providerUnavailable}
            onPress={submit}
            style={styles.checkoutButton}
          />
        </View>
      }
    >
      <View style={[styles.serviceSummary, { backgroundColor: theme.tealSoft }]}> 
        <View style={[styles.serviceSummaryIcon, { backgroundColor: theme.surface }]}><MaterialCommunityIcons name="shield-check" size={24} color={theme.teal} /></View>
        <View style={styles.serviceSummaryCopy}>
          <Text style={[styles.serviceSummaryTitle, { color: theme.text }]}>{service?.name || form.service}</Text>
          <Text style={[styles.serviceSummaryMeta, { color: theme.textMuted }]}>Verified professional · Transparent pricing</Text>
        </View>
        <MaterialCommunityIcons name="check-decagram" size={22} color={theme.success} />
      </View>
      {providerUnavailable ? <Text style={[styles.unavailable, { backgroundColor: theme.roseSoft, color: theme.rose }]}>Provider is currently unavailable.</Text> : null}
      <View style={[styles.bookingSection, { borderColor: theme.border }]}> 
        <SectionTitle step="1" icon="map-marker-radius-outline" title="Where should we come?" copy="Choose the address for this service." />
        <TextField label={t("booking.address", "Service address")} value={form.address} onChangeText={update("address")} placeholder={t("booking.addressPlaceholder", "House, street, city")} multiline />
        <TextField label="Flat / House / Floor No." value={form.houseNo} onChangeText={update("houseNo")} placeholder="e.g. Flat 302, Floor 3" />
        <TextField label="Street / Road / Lane" value={form.street} onChangeText={update("street")} placeholder="e.g. Mahatma Gandhi Road" />
        <View style={[styles.row, stackDateTimeFields && styles.stackedRow]}>
          <View style={styles.rowItem}>
            <TextField label="Area / Landmark" value={form.area} onChangeText={update("area")} placeholder="e.g. Near HDFC Bank" />
          </View>
          <View style={styles.rowItem}>
            <TextField label="City" value={form.city} onChangeText={update("city")} placeholder="e.g. Pune" />
          </View>
        </View>
        <View style={[styles.row, stackDateTimeFields && styles.stackedRow]}>
          <View style={styles.rowItem}>
            <TextField label="State" value={form.state} onChangeText={update("state")} placeholder="e.g. Maharashtra" />
          </View>
          <View style={styles.rowItem}>
            <TextField label="Pin Code" value={form.postalCode} onChangeText={update("postalCode")} placeholder="e.g. 411001" keyboardType="number-pad" />
          </View>
        </View>
        <Text style={[styles.label, { color: theme.text, marginTop: 4 }]}>Address Category</Text>
        <View style={styles.durationList}>
          {["Current Location", "Saved Address", "Custom Address"].map((type) => {
            const active = form.locationType === type;
            return (
              <Pressable
                accessibilityRole="button"
                key={type}
                onPress={() => update("locationType")(type)}
                style={[
                  styles.durationChip,
                  { borderColor: active ? theme.teal : theme.border },
                  active && { backgroundColor: theme.teal },
                ]}
              >
                <Text style={[styles.durationText, { color: active ? "#ffffff" : theme.text }]}>
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <ActionButton title={locatingAddress ? "Detecting location..." : "Use current location"} icon="crosshairs-gps" variant="secondary" loading={locatingAddress} disabled={locatingAddress} onPress={useCurrentLocation} />
      </View>

      <View style={[styles.bookingSection, { borderColor: theme.border }]}> 
        <SectionTitle step="2" icon="calendar-clock" title="Pick a convenient slot" copy="Popular slots fill quickly—choose what works for you." />
        <PickerField label={t("booking.date", "Service date")} value={form.date} placeholder="dd-mm-yyyy" icon="calendar-month-outline" onPress={() => setShowDatePicker(true)} />
        {SLOT_GROUPS.map((group) => (
          <View key={group.label} style={styles.slotGroup}>
            <View style={styles.slotGroupLabel}><MaterialCommunityIcons name={group.icon} size={16} color={theme.textMuted} /><Text style={[styles.slotGroupText, { color: theme.textMuted }]}>{group.label}</Text></View>
            <View style={styles.slotList}>
              {group.slots.map((slot) => {
                const active = form.time === slot;
                return (
                  <Pressable key={slot} onPress={() => update("time")(slot)} style={({ pressed }) => [styles.slotChip, { borderColor: active ? theme.teal : theme.border, backgroundColor: active ? theme.tealSoft : theme.surface }, pressed && styles.pressed]}>
                    <Text style={[styles.slotText, { color: active ? theme.teal : theme.text }]}>{formatTimeLabel(slot)}</Text>
                    {active ? <MaterialCommunityIcons name="check-circle" size={16} color={theme.teal} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <Pressable onPress={() => setShowTimePicker(true)} style={styles.customTime}><MaterialCommunityIcons name="clock-edit-outline" size={18} color={theme.teal} /><Text style={[styles.customTimeText, { color: theme.teal }]}>Choose a custom time</Text></Pressable>
      </View>
      {showDatePicker ? (
        <DateTimePicker
          value={dateFromDisplay(form.date)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={minDate}
          onValueChange={handleDateChange}
        />
      ) : null}
      {showTimePicker ? (
        <DateTimePicker
          value={dateWithTime(form.time)}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          is24Hour={false}
          onValueChange={handleTimeChange}
        />
      ) : null}
      <View style={[styles.bookingSection, { borderColor: theme.border }]}> 
        <SectionTitle step="3" icon="clipboard-text-outline" title="Tell us a little more" copy="This helps the professional arrive prepared." />
        <TextField label={t("booking.name", "Contact name")} value={form.name} onChangeText={update("name")} placeholder={t("booking.customerName", "Customer name")} />
        <TextField label={t("booking.phone", "Mobile number")} value={form.phone} onChangeText={update("phone")} placeholder="+91..." keyboardType="phone-pad" />
        <TextField label={t("booking.service", "Service")} value={form.service} onChangeText={update("service")} placeholder={t("booking.serviceCategory", "Service category")} />
        <TextField label={t("booking.problemDetails", "What needs attention?")} value={form.problemDescription} onChangeText={update("problemDescription")} placeholder={t("booking.problemPlaceholder", "Describe the work needed")} multiline />
        <Text style={[styles.label, { color: theme.text }]}>{t("booking.duration", "Duration")}</Text>
        <View style={styles.durationList}>
          {durationOptions.map((duration) => {
            const active = form.duration === duration;
            return (
              <Pressable
                accessibilityRole="button"
                key={duration}
                onPress={() => update("duration")(duration)}
                style={[
                  styles.durationChip,
                  { borderColor: active ? theme.teal : theme.border },
                  active && { backgroundColor: theme.teal },
                ]}
              >
                <Text style={[styles.durationText, { color: active ? "#ffffff" : theme.text }]}>
                  {duration}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={[styles.promiseCard, { backgroundColor: theme.surfaceMuted }]}> 
        <MaterialCommunityIcons name="shield-lock-outline" size={22} color={theme.secondary || theme.success} />
        <Text style={[styles.promiseText, { color: theme.textMuted }]}>Background-checked professional · Secure booking · Support when you need it</Text>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  activeDuration: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  activeDurationText: {
    color: "#ffffff",
  },
  unavailable: {
    borderRadius: radius.md,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  durationChip: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  durationList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
  },
  durationWrap: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
  },
  pickerField: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pickerValue: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    minWidth: 0,
  },
  pickerWrap: {
    gap: 7,
  },
  placeholder: {
    color: "#94a3b8",
  },
  pressed: {
    opacity: 0.78,
  },
  promiseCard: { alignItems: "center", borderRadius: radius.md, flexDirection: "row", gap: 10, padding: 14 },
  promiseText: { flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowItem: {
    flex: 1,
    minWidth: 0,
  },
  rowField: {
    flex: 1,
    minWidth: 0,
  },
  sectionCopy: { fontSize: 12, fontWeight: "600", lineHeight: 18, marginTop: 2 },
  sectionEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  sectionHeading: { fontSize: 18, fontWeight: "900", lineHeight: 24 },
  sectionTitleCopy: { flex: 1 },
  sectionTitleRow: { alignItems: "flex-start", flexDirection: "row", gap: 11 },
  serviceSummary: { alignItems: "center", borderRadius: radius.lg, flexDirection: "row", gap: 12, padding: 14 },
  serviceSummaryCopy: { flex: 1, minWidth: 0 },
  serviceSummaryIcon: { alignItems: "center", borderRadius: radius.md, height: 44, justifyContent: "center", width: 44 },
  serviceSummaryMeta: { fontSize: 12, fontWeight: "600", lineHeight: 17, marginTop: 2 },
  serviceSummaryTitle: { fontSize: 16, fontWeight: "900" },
  slotChip: { alignItems: "center", borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 42, paddingHorizontal: 11 },
  slotGroup: { gap: 8 },
  slotGroupLabel: { alignItems: "center", flexDirection: "row", gap: 6 },
  slotGroupText: { fontSize: 12, fontWeight: "800" },
  slotList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotText: { fontSize: 12, fontWeight: "800" },
  stepIcon: { alignItems: "center", borderRadius: 14, height: 42, justifyContent: "center", width: 42 },
  bookingSection: { borderRadius: radius.lg, borderWidth: 1, gap: 14, padding: 16 },
  checkoutBar: { alignItems: "center", flexDirection: "row", gap: 14 },
  checkoutButton: { flex: 1.35 },
  checkoutCopy: { flex: 0.8, minWidth: 0 },
  checkoutLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  checkoutPrice: { fontSize: 16, fontWeight: "900", marginTop: 3 },
  customTime: { alignItems: "center", flexDirection: "row", gap: 7, minHeight: 44 },
  customTimeText: { fontSize: 13, fontWeight: "800" },
  stackedRow: {
    flexDirection: "column",
  },
});
