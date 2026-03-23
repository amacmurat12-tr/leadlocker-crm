import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { useLeads, Lead, LeadStatus, PropertyType, ListingType } from "@/contexts/LeadsContext";
import { CURRENCIES, getCurrency, formatBudget } from "@/constants/currencies";
import { useSubscription } from "@/contexts/SubscriptionContext";

type FormData = Omit<Lead, "id" | "createdAt" | "updatedAt">;

const PROPERTY_TYPES: PropertyType[] = [
  "house", "apartment", "condo", "townhouse", "land", "commercial", "luxury", "villa", "tiny-house",
];

const STATUS_OPTIONS: LeadStatus[] = ["active", "pending", "closed", "lost"];

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
        {label}{required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad" | "email-address";
  multiline?: boolean;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      keyboardType={keyboardType || "default"}
      multiline={multiline}
      numberOfLines={numberOfLines}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.input,
        multiline && { height: 88, textAlignVertical: "top" },
        {
          color: colors.text,
          backgroundColor: colors.surface,
          borderColor: focused ? colors.accent : colors.border,
          fontFamily: "Inter_400Regular",
        },
      ]}
    />
  );
}

function ToggleChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: selected ? "#fff" : colors.textSecondary, fontFamily: "Inter_500Medium" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const { colors } = useTheme();
  const displayValue = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => {
          const next = Math.round((value - step) * 10) / 10;
          if (next >= (min ?? 0)) onChange(next);
        }}
        style={[styles.stepperBtn, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}
      >
        <Ionicons name="remove" size={18} color={colors.text} />
      </Pressable>
      <Text style={[styles.stepperValue, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
        {displayValue}
      </Text>
      <Pressable
        onPress={() => {
          const next = Math.round((value + step) * 10) / 10;
          if (next <= (max ?? 20)) onChange(next);
        }}
        style={[styles.stepperBtn, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}
      >
        <Ionicons name="add" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

export default function NewLeadScreen() {
  const { colors, t } = useTheme();
  const { addLead, updateLead, getLead } = useLeads();
  const { isProUser, openPaywall } = useSubscription();
  const insets = useSafeAreaInsets();
  const { editId } = useLocalSearchParams<{ editId?: string }>();

  const existingLead = editId ? getLead(editId) : undefined;
  const isEditing = !!existingLead;

  useEffect(() => {
    if (!isProUser) {
      router.back();
      setTimeout(() => openPaywall(), 200);
    }
  }, [isProUser]);

  const [form, setForm] = useState<FormData>({
    firstName: existingLead?.firstName || "",
    lastName: existingLead?.lastName || "",
    phone: existingLead?.phone || "",
    email: existingLead?.email || "",
    budget: existingLead?.budget || 0,
    currency: existingLead?.currency || "USD",
    bedrooms: existingLead?.bedrooms || 2,
    bathrooms: existingLead?.bathrooms || 1,
    hasGarage: existingLead?.hasGarage || false,
    garageSpots: existingLead?.garageSpots ?? 1,
    hasPool: existingLead?.hasPool || false,
    squareFootage: existingLead?.squareFootage || 0,
    propertyType: existingLead?.propertyType || "house",
    listingType: existingLead?.listingType || "sale",
    location: existingLead?.location || "",
    notes: existingLead?.notes || "",
    status: existingLead?.status || "active",
  });

  const [currencyModal, setCurrencyModal] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert("Required Fields", "Please enter first and last name.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isEditing && editId) {
      updateLead(editId, form);
    } else {
      addLead(form);
    }
    router.back();
  };

  const propertyTypeLabels: Record<PropertyType, string> = {
    house: t("house"),
    apartment: t("apartment"),
    condo: t("condo"),
    townhouse: t("townhouse"),
    land: t("land"),
    commercial: t("commercial"),
    luxury: t("luxury"),
    villa: t("villa"),
    "tiny-house": t("tinyHouse"),
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
          {isEditing ? t("editLead") : t("newLead")}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={80}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 120 }]}
      >
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <FormField label={t("firstName")} required>
              <StyledInput
                value={form.firstName}
                onChangeText={(v) => updateField("firstName", v)}
                placeholder="John"
              />
            </FormField>
          </View>
          <View style={{ flex: 1 }}>
            <FormField label={t("lastName")} required>
              <StyledInput
                value={form.lastName}
                onChangeText={(v) => updateField("lastName", v)}
                placeholder="Smith"
              />
            </FormField>
          </View>
        </View>

        <FormField label={t("phone")}>
          <StyledInput
            value={form.phone}
            onChangeText={(v) => updateField("phone", v)}
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
          />
        </FormField>

        <FormField label={t("email")}>
          <StyledInput
            value={form.email}
            onChangeText={(v) => updateField("email", v)}
            placeholder="john@example.com"
            keyboardType="email-address"
          />
        </FormField>

        <FormField label={t("budget")}>
          <View style={styles.budgetRow}>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setCurrencyModal(true); }}
              style={[styles.currencyBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.accent, borderWidth: 1.5 }]}
            >
              <Text style={[styles.currencyFlag]}>{getCurrency(form.currency).flag}</Text>
              <Text style={[styles.currencyCode, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{form.currency}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.accent} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <StyledInput
                value={form.budget > 0 ? String(form.budget) : ""}
                onChangeText={(v) => updateField("budget", parseInt(v.replace(/\D/g, "")) || 0)}
                placeholder={`${getCurrency(form.currency).symbol}500,000`}
                keyboardType="numeric"
              />
            </View>
          </View>
          {form.budget > 0 && (
            <Text style={[styles.budgetPreview, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
              {formatBudget(form.budget, form.currency)}
            </Text>
          )}
        </FormField>

        <View style={[styles.dividerSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.dividerLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            {t("propertyPreferences").toUpperCase()}
          </Text>
        </View>

        <FormField label={t("propertyType")}>
          <View style={styles.chipsWrap}>
            {PROPERTY_TYPES.map((pt) => (
              <ToggleChip
                key={pt}
                label={propertyTypeLabels[pt]}
                selected={form.propertyType === pt}
                onPress={() => {
                  Haptics.selectionAsync();
                  updateField("propertyType", pt);
                }}
              />
            ))}
          </View>
        </FormField>

        <View style={styles.stepperRow}>
          <View style={{ flex: 1 }}>
            <FormField label={t("bedrooms")}>
              <Stepper
                value={form.bedrooms}
                onChange={(v) => updateField("bedrooms", v)}
                min={0}
                max={20}
              />
            </FormField>
          </View>
          <View style={{ flex: 1 }}>
            <FormField label={t("bathrooms")}>
              <Stepper
                value={form.bathrooms}
                onChange={(v) => updateField("bathrooms", v)}
                min={0}
                max={20}
                step={0.5}
              />
            </FormField>
          </View>
        </View>

        <FormField label={t("squareFootage")}>
          <StyledInput
            value={form.squareFootage > 0 ? form.squareFootage.toLocaleString() : ""}
            onChangeText={(v) => updateField("squareFootage", parseInt(v.replace(/[^\d]/g, "")) || 0)}
            placeholder="1,200"
            keyboardType="numeric"
          />
        </FormField>

        <FormField label={t("listingType")}>
          <View style={styles.listingToggleRow}>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); updateField("listingType", "sale"); }}
              style={[
                styles.listingToggleBtn,
                {
                  backgroundColor: form.listingType === "sale" ? colors.accent : colors.surface,
                  borderColor: form.listingType === "sale" ? colors.accent : colors.border,
                  marginRight: 8,
                },
              ]}
            >
              <Ionicons name="pricetag-outline" size={16} color={form.listingType === "sale" ? "#fff" : colors.textSecondary} />
              <Text style={[styles.listingToggleText, { color: form.listingType === "sale" ? "#fff" : colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
                {t("forSale")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); updateField("listingType", "rent"); }}
              style={[
                styles.listingToggleBtn,
                {
                  backgroundColor: form.listingType === "rent" ? colors.accent : colors.surface,
                  borderColor: form.listingType === "rent" ? colors.accent : colors.border,
                },
              ]}
            >
              <Ionicons name="key-outline" size={16} color={form.listingType === "rent" ? "#fff" : colors.textSecondary} />
              <Text style={[styles.listingToggleText, { color: form.listingType === "rent" ? "#fff" : colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
                {t("forRent")}
              </Text>
            </Pressable>
          </View>
        </FormField>

        <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.toggleLeft}>
            <Ionicons name="car-outline" size={20} color={colors.accent} />
            <Text style={[styles.toggleLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
              {t("garage")}
            </Text>
          </View>
          <Switch
            value={form.hasGarage}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              updateField("hasGarage", v);
            }}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#fff"
          />
        </View>

        {form.hasGarage && (
          <FormField label={t("garageVehicles")}>
            <Stepper
              value={form.garageSpots ?? 1}
              onChange={(v) => updateField("garageSpots", v)}
              min={1}
              max={5}
            />
          </FormField>
        )}

        <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.toggleLeft}>
            <Ionicons name="water" size={20} color={colors.accent} />
            <Text style={[styles.toggleLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
              {t("pool")}
            </Text>
          </View>
          <Switch
            value={form.hasPool}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              updateField("hasPool", v);
            }}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.dividerSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.dividerLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            {t("status").toUpperCase()}
          </Text>
        </View>

        <View style={styles.chipsWrap}>
          {STATUS_OPTIONS.map((s) => (
            <ToggleChip
              key={s}
              label={t(s as any)}
              selected={form.status === s}
              onPress={() => {
                Haptics.selectionAsync();
                updateField("status", s);
              }}
            />
          ))}
        </View>

        <FormField label={t("location")}>
          <StyledInput
            value={form.location}
            onChangeText={(v) => updateField("location", v)}
            placeholder="New York, NY"
          />
        </FormField>

        <FormField label={t("notes")}>
          <StyledInput
            value={form.notes}
            onChangeText={(v) => updateField("notes", v)}
            placeholder="Add any additional notes..."
            multiline
            numberOfLines={4}
          />
        </FormField>
      </KeyboardAwareScrollView>

      <Modal
        visible={currencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCurrencyModal(false)}>
          <View style={[styles.currencySheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.currencySheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.currencySheetTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Select Currency
            </Text>
            {CURRENCIES.map((cur) => (
              <Pressable
                key={cur.code}
                onPress={() => {
                  Haptics.selectionAsync();
                  updateField("currency", cur.code);
                  setCurrencyModal(false);
                }}
                style={[
                  styles.currencyOption,
                  {
                    backgroundColor: form.currency === cur.code ? `${colors.accent}18` : "transparent",
                    borderColor: form.currency === cur.code ? `${colors.accent}60` : colors.border,
                  },
                ]}
              >
                <Text style={styles.currencyOptionFlag}>{cur.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.currencyOptionCode, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                    {cur.code} — {cur.symbol}
                  </Text>
                  <Text style={[styles.currencyOptionName, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                    {cur.name}
                  </Text>
                </View>
                {form.currency === cur.code && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <View style={[styles.footer, { bottom: botPad, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={["#2D6BE4", "#1A4DB3"]}
            style={styles.saveBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name={isEditing ? "checkmark-circle" : "person-add"} size={22} color="#fff" />
            <Text style={[styles.saveBtnText, { fontFamily: "Inter_700Bold" }]}>
              {isEditing ? t("save") : t("addNewLead")}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  nameRow: {
    flexDirection: "row",
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  dividerSection: {
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 4,
  },
  dividerLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
  },
  stepperRow: {
    flexDirection: "row",
    gap: 12,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 18,
    minWidth: 30,
    textAlign: "center",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleLabel: {
    fontSize: 15,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 17,
    color: "#fff",
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  currencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 90,
    justifyContent: "center",
  },
  currencyFlag: {
    fontSize: 18,
  },
  currencyCode: {
    fontSize: 13,
  },
  budgetPreview: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  currencySheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  currencySheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  currencySheetTitle: {
    fontSize: 18,
    marginBottom: 6,
  },
  currencyOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  currencyOptionFlag: {
    fontSize: 24,
  },
  currencyOptionCode: {
    fontSize: 15,
  },
  currencyOptionName: {
    fontSize: 13,
    marginTop: 2,
  },
  listingToggleRow: {
    flexDirection: "row",
  },
  listingToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  listingToggleText: {
    fontSize: 14,
  },
});
