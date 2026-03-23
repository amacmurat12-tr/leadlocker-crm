import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Platform,
  Modal,
  ScrollView,
  Switch,
  Animated as RNAnimated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { useLeads, Lead, LeadStatus } from "@/contexts/LeadsContext";
import { formatBudget } from "@/constants/currencies";
import { useSubscription } from "@/contexts/SubscriptionContext";

function getInitials(first: string, last: string) {
  return `${first[0] || ""}${last[0] || ""}`.toUpperCase();
}

function getStatusColor(status: Lead["status"], colors: any) {
  switch (status) {
    case "active": return colors.success;
    case "pending": return colors.warning;
    case "closed": return colors.accent;
    case "lost": return colors.danger;
    default: return colors.textTertiary;
  }
}

function getAvatarColors(status: Lead["status"], colors: any): [string, string] {
  switch (status) {
    case "active": return [colors.accent, colors.accentDark];
    case "pending": return ["#F59E0B", "#D97706"];
    case "closed": return [colors.success, "#16A34A"];
    default: return [colors.danger, "#DC2626"];
  }
}

function LeadCard({ lead, matchScore }: { lead: Lead; matchScore?: number }) {
  const { colors, t } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const statusColor = getStatusColor(lead.status, colors);
  const initials = getInitials(lead.firstName, lead.lastName);
  const avatarColors = getAvatarColors(lead.status, colors);

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/lead/[id]", params: { id: lead.id } });
        }}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {matchScore !== undefined && (
          <View style={[
            styles.matchBadgeAbsolute,
            { backgroundColor: matchScore >= 80 ? colors.success : matchScore >= 50 ? colors.warning : colors.danger }
          ]}>
            <Text style={[styles.matchBadgeText, { fontFamily: "Inter_700Bold" }]}>{matchScore}%</Text>
          </View>
        )}

        <LinearGradient
          colors={avatarColors}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>{initials}</Text>
        </LinearGradient>

        <View style={styles.cardInfo}>
          <Text style={[styles.name, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            {lead.firstName} {lead.lastName}
          </Text>
          <View style={styles.cardMeta}>
            {lead.phone ? (
              <View style={styles.metaItem}>
                <Ionicons name="call-outline" size={12} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                  {lead.phone}
                </Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                {formatBudget(lead.budget, lead.currency)}
              </Text>
            </View>
          </View>
          <View style={styles.cardTags}>
            {lead.bedrooms > 0 && (
              <View style={[styles.tag, { backgroundColor: colors.backgroundTertiary }]}>
                <Ionicons name="bed-outline" size={11} color={colors.textSecondary} />
                <Text style={[styles.tagText, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                  {lead.bedrooms}
                </Text>
              </View>
            )}
            {lead.bathrooms > 0 && (
              <View style={[styles.tag, { backgroundColor: colors.backgroundTertiary }]}>
                <Ionicons name="water-outline" size={11} color={colors.textSecondary} />
                <Text style={[styles.tagText, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                  {lead.bathrooms}
                </Text>
              </View>
            )}
            {lead.hasGarage && (
              <View style={[styles.tag, { backgroundColor: colors.backgroundTertiary }]}>
                <Ionicons name="car-outline" size={11} color={colors.textSecondary} />
              </View>
            )}
            {lead.hasPool && (
              <View style={[styles.tag, { backgroundColor: colors.backgroundTertiary }]}>
                <Ionicons name="water" size={11} color={colors.textSecondary} />
              </View>
            )}
            {lead.squareFootage > 0 && (
              <View style={[styles.tag, { backgroundColor: colors.backgroundTertiary }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                  {lead.squareFootage} Sq Ft
                </Text>
              </View>
            )}
            {lead.location ? (
              <View style={[styles.tag, { backgroundColor: colors.backgroundTertiary }]}>
                <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
                <Text style={[styles.tagText, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                  {lead.location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={[
            styles.listingBadge,
            { backgroundColor: lead.listingType === "sale" ? "#16A34A22" : "#D9770622" },
          ]}>
            <Text style={[
              styles.listingBadgeText,
              { color: lead.listingType === "sale" ? "#22C55E" : "#F59E0B", fontFamily: "Inter_700Bold" },
            ]}>
              {lead.listingType === "sale" ? t("forSale") : t("forRent")}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.statusText, { color: statusColor, fontFamily: "Inter_600SemiBold" }]}>
              {t(lead.status as any)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

type SortMode = "newest" | "oldest" | "budget" | "match";
type StatusFilter = "all" | LeadStatus;

interface PropertyFilters {
  budgetMin: string;
  budgetMax: string;
  bedroomsMin: number;
  bathroomsMin: number;
  sqftMin: string;
  sqftMax: string;
  requireGarage: boolean;
  requirePool: boolean;
  location: string;
}

const defaultFilters: PropertyFilters = {
  budgetMin: "",
  budgetMax: "",
  bedroomsMin: 0,
  bathroomsMin: 0,
  sqftMin: "",
  sqftMax: "",
  requireGarage: false,
  requirePool: false,
  location: "",
};

function countActiveFilters(f: PropertyFilters): number {
  let count = 0;
  if (f.budgetMin) count++;
  if (f.budgetMax) count++;
  if (f.bedroomsMin > 0) count++;
  if (f.bathroomsMin > 0) count++;
  if (f.sqftMin) count++;
  if (f.sqftMax) count++;
  if (f.requireGarage) count++;
  if (f.requirePool) count++;
  if (f.location.trim()) count++;
  return count;
}

function computeMatchScore(lead: Lead, f: PropertyFilters): number {
  let total = 0;
  let matched = 0;

  const budgetMin = f.budgetMin ? parseInt(f.budgetMin) : null;
  const budgetMax = f.budgetMax ? parseInt(f.budgetMax) : null;
  const sqftMin = f.sqftMin ? parseInt(f.sqftMin) : null;
  const sqftMax = f.sqftMax ? parseInt(f.sqftMax) : null;

  if (budgetMin !== null || budgetMax !== null) {
    total += 30;
    const inRange =
      (budgetMin === null || lead.budget >= budgetMin) &&
      (budgetMax === null || lead.budget <= budgetMax);
    if (inRange) matched += 30;
    else if (budgetMin !== null && lead.budget >= budgetMin * 0.85) matched += 15;
    else if (budgetMax !== null && lead.budget <= budgetMax * 1.15) matched += 15;
  }
  if (f.bedroomsMin > 0) {
    total += 20;
    if (lead.bedrooms >= f.bedroomsMin) matched += 20;
    else if (lead.bedrooms >= f.bedroomsMin - 1) matched += 10;
  }
  if (f.bathroomsMin > 0) {
    total += 15;
    if (lead.bathrooms >= f.bathroomsMin) matched += 15;
    else if (lead.bathrooms >= f.bathroomsMin - 1) matched += 7;
  }
  if (sqftMin !== null || sqftMax !== null) {
    total += 20;
    const inRange =
      (sqftMin === null || lead.squareFootage >= sqftMin) &&
      (sqftMax === null || lead.squareFootage <= sqftMax);
    if (inRange) matched += 20;
    else if (sqftMin !== null && lead.squareFootage >= sqftMin * 0.85) matched += 10;
    else if (sqftMax !== null && lead.squareFootage <= sqftMax * 1.15) matched += 10;
  }
  if (f.requireGarage) {
    total += 10;
    if (lead.hasGarage) matched += 10;
  }
  if (f.requirePool) {
    total += 10;
    if (lead.hasPool) matched += 10;
  }
  if (f.location.trim()) {
    total += 15;
    if (lead.location.toLowerCase().includes(f.location.toLowerCase())) matched += 15;
    else if (f.location.toLowerCase().includes(lead.location.toLowerCase()) && lead.location.length > 2) matched += 8;
  }

  if (total === 0) return 100;
  return Math.min(100, Math.round((matched / total) * 100));
}

function StepperRow({ label, value, onDec, onInc }: { label: string; value: number; onDec: () => void; onInc: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[shStyles.stepperRow, { borderBottomColor: colors.borderLight }]}>
      <Text style={[shStyles.stepperLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>{label}</Text>
      <View style={shStyles.stepperControls}>
        <Pressable onPress={onDec} style={[shStyles.stepBtn, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
          <Ionicons name="remove" size={16} color={colors.text} />
        </Pressable>
        <Text style={[shStyles.stepValue, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          {value === 0 ? "Any" : `${value}+`}
        </Text>
        <Pressable onPress={onInc} style={[shStyles.stepBtn, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
          <Ionicons name="add" size={16} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

function FieldInput({ label, value, onChange, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon: string;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={shStyles.fieldGroup}>
      <Text style={[shStyles.fieldLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
        {label}
      </Text>
      <View style={[shStyles.fieldInput, { borderColor: focused ? colors.accent : colors.border, backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name={icon as any} size={15} color={colors.textTertiary} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[shStyles.fieldInputText, { color: colors.text, fontFamily: "Inter_400Regular" }]}
        />
      </View>
    </View>
  );
}

function FilterSheet({
  visible,
  filters,
  onChange,
  onClose,
  onReset,
}: {
  visible: boolean;
  filters: PropertyFilters;
  onChange: (f: PropertyFilters) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const { colors, t } = useTheme();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const update = <K extends keyof PropertyFilters>(key: K, val: PropertyFilters[K]) => {
    onChange({ ...filters, [key]: val });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={shStyles.overlay} onPress={onClose} />
      <View style={[shStyles.sheet, { backgroundColor: colors.surface, paddingBottom: botPad + 12 }]}>
        <View style={[shStyles.handle, { backgroundColor: colors.border }]} />

        <View style={[shStyles.sheetHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.matchIconRow}>
            <LinearGradient colors={["#2D6BE4", "#7C3AED"]} style={shStyles.headerIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="options" size={16} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={[shStyles.sheetTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                Property Match
              </Text>
              <Text style={[shStyles.sheetSubtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Enter listing details to find matching clients
              </Text>
            </View>
          </View>
          <Pressable onPress={onReset} style={({ pressed }) => [shStyles.resetBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Text style={[shStyles.resetText, { color: colors.danger, fontFamily: "Inter_600SemiBold" }]}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={shStyles.body} keyboardShouldPersistTaps="handled">
          <Text style={[shStyles.groupLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            BUDGET RANGE
          </Text>
          <View style={[shStyles.rangeRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <FieldInput
                label="Min Budget ($)"
                value={filters.budgetMin}
                onChange={(v) => update("budgetMin", v.replace(/\D/g, ""))}
                placeholder="e.g. 200000"
                icon="arrow-down-circle-outline"
              />
            </View>
            <View style={[shStyles.rangeDivider, { backgroundColor: colors.border }]} />
            <View style={{ flex: 1 }}>
              <FieldInput
                label="Max Budget ($)"
                value={filters.budgetMax}
                onChange={(v) => update("budgetMax", v.replace(/\D/g, ""))}
                placeholder="e.g. 800000"
                icon="arrow-up-circle-outline"
              />
            </View>
          </View>

          <Text style={[shStyles.groupLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            ROOMS
          </Text>
          <View style={[shStyles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <StepperRow
              label={t("bedrooms")}
              value={filters.bedroomsMin}
              onDec={() => update("bedroomsMin", Math.max(0, filters.bedroomsMin - 1))}
              onInc={() => update("bedroomsMin", Math.min(10, filters.bedroomsMin + 1))}
            />
            <StepperRow
              label={t("bathrooms")}
              value={filters.bathroomsMin}
              onDec={() => update("bathroomsMin", Math.max(0, filters.bathroomsMin - 1))}
              onInc={() => update("bathroomsMin", Math.min(10, filters.bathroomsMin + 1))}
            />
          </View>

          <Text style={[shStyles.groupLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            SQUARE FOOTAGE (Sq Ft)
          </Text>
          <View style={[shStyles.rangeRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <FieldInput
                label="Min Sq Ft"
                value={filters.sqftMin}
                onChange={(v) => update("sqftMin", v.replace(/\D/g, ""))}
                placeholder="e.g. 800"
                icon="expand-outline"
              />
            </View>
            <View style={[shStyles.rangeDivider, { backgroundColor: colors.border }]} />
            <View style={{ flex: 1 }}>
              <FieldInput
                label="Max Sq Ft"
                value={filters.sqftMax}
                onChange={(v) => update("sqftMax", v.replace(/\D/g, ""))}
                placeholder="e.g. 3000"
                icon="contract-outline"
              />
            </View>
          </View>

          <Text style={[shStyles.groupLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            FEATURES
          </Text>
          <View style={[shStyles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <View style={[shStyles.toggleRow, { borderBottomColor: colors.borderLight }]}>
              <View style={shStyles.toggleLeft}>
                <View style={[shStyles.toggleIcon, { backgroundColor: `${colors.accent}22` }]}>
                  <Ionicons name="car-outline" size={16} color={colors.accent} />
                </View>
                <Text style={[shStyles.toggleLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                  {t("garage")}
                </Text>
              </View>
              <Switch
                value={filters.requireGarage}
                onValueChange={(v) => { Haptics.selectionAsync(); update("requireGarage", v); }}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View style={shStyles.toggleRow}>
              <View style={shStyles.toggleLeft}>
                <View style={[shStyles.toggleIcon, { backgroundColor: `${colors.accent}22` }]}>
                  <Ionicons name="water" size={16} color={colors.accent} />
                </View>
                <Text style={[shStyles.toggleLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                  {t("pool")}
                </Text>
              </View>
              <Switch
                value={filters.requirePool}
                onValueChange={(v) => { Haptics.selectionAsync(); update("requirePool", v); }}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Text style={[shStyles.groupLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            LOCATION / REGION
          </Text>
          <View style={[shStyles.locationInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={18} color={colors.textTertiary} />
            <TextInput
              value={filters.location}
              onChangeText={(v) => update("location", v)}
              placeholder="e.g. New York, Manhattan, Brooklyn..."
              placeholderTextColor={colors.textTertiary}
              style={[shStyles.locationInputText, { color: colors.text, fontFamily: "Inter_400Regular" }]}
            />
            {filters.location.length > 0 && (
              <Pressable onPress={() => update("location", "")}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </ScrollView>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); }}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, marginHorizontal: 16, marginTop: 8 }]}
        >
          <LinearGradient
            colors={["#2D6BE4", "#1A4DB3"]}
            style={shStyles.applyBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={[shStyles.applyBtnText, { fontFamily: "Inter_600SemiBold" }]}>Apply Filters</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Modal>
  );
}

export default function LeadsScreen() {
  const { colors, t } = useTheme();
  const { leads } = useLeads();
  const { isProUser, openPaywall } = useSubscription();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [listingTypeFilter, setListingTypeFilter] = useState<"all" | "sale" | "rent">("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>(defaultFilters);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!isProUser) {
    return (
      <View style={[lockedStyles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={["#0B1628", "#0F2247", "#0B1628"]}
          style={lockedStyles.bg}
        />
        <View style={[lockedStyles.inner, { paddingTop: topPad + 40, paddingBottom: botPad + 40 }]}>
          <View style={lockedStyles.iconWrap}>
            <View style={lockedStyles.iconGlow} />
            <View style={lockedStyles.iconCircle}>
              <Ionicons name="lock-closed" size={36} color="#F59E0B" />
            </View>
          </View>
          <Text style={[lockedStyles.title, { fontFamily: "Inter_700Bold" }]}>
            {t("leads")} Locked
          </Text>
          <Text style={[lockedStyles.sub, { fontFamily: "Inter_400Regular" }]}>
            {t("paywallSubtitle")}
          </Text>
          <Text style={[lockedStyles.dataNote, { fontFamily: "Inter_500Medium" }]}>
            🔒 Your data is safe — subscribe to access all your records.
          </Text>
          <Pressable
            style={({ pressed }) => [lockedStyles.btn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); openPaywall(); }}
          >
            <Ionicons name="diamond" size={18} color="#fff" />
            <Text style={[lockedStyles.btnText, { fontFamily: "Inter_700Bold" }]}>{t("paywallCtaYearly")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const activeFilterCount = countActiveFilters(propertyFilters);
  const hasPropertyFilters = activeFilterCount > 0;

  const filteredWithScores = useMemo(() => {
    let result = [...leads];

    if (statusFilter !== "all") result = result.filter((l) => l.status === statusFilter);
    if (listingTypeFilter !== "all") result = result.filter((l) => l.listingType === listingTypeFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.firstName.toLowerCase().includes(q) ||
          l.lastName.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.location.toLowerCase().includes(q)
      );
    }

    const withScores = result.map((lead) => ({
      lead,
      score: hasPropertyFilters ? computeMatchScore(lead, propertyFilters) : undefined,
    }));

    if (hasPropertyFilters) {
      const budgetMin = propertyFilters.budgetMin ? parseInt(propertyFilters.budgetMin) : null;
      const budgetMax = propertyFilters.budgetMax ? parseInt(propertyFilters.budgetMax) : null;
      const sqftMin = propertyFilters.sqftMin ? parseInt(propertyFilters.sqftMin) : null;
      const sqftMax = propertyFilters.sqftMax ? parseInt(propertyFilters.sqftMax) : null;

      return withScores
        .filter(({ lead }) => {
          if (budgetMin !== null && lead.budget < budgetMin * 0.75) return false;
          if (budgetMax !== null && lead.budget > budgetMax * 1.25) return false;
          if (propertyFilters.bedroomsMin > 0 && lead.bedrooms < propertyFilters.bedroomsMin - 1) return false;
          if (propertyFilters.bathroomsMin > 0 && lead.bathrooms < propertyFilters.bathroomsMin - 1) return false;
          if (sqftMin !== null && lead.squareFootage > 0 && lead.squareFootage < sqftMin * 0.75) return false;
          if (sqftMax !== null && lead.squareFootage > sqftMax * 1.25) return false;
          if (propertyFilters.requireGarage && !lead.hasGarage) return false;
          if (propertyFilters.requirePool && !lead.hasPool) return false;
          return true;
        })
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }

    if (sort === "newest") withScores.sort((a, b) => b.lead.createdAt - a.lead.createdAt);
    else if (sort === "oldest") withScores.sort((a, b) => a.lead.createdAt - b.lead.createdAt);
    else withScores.sort((a, b) => b.lead.budget - a.lead.budget);

    return withScores;
  }, [leads, search, statusFilter, listingTypeFilter, sort, propertyFilters, hasPropertyFilters]);

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("allLeads") },
    { key: "active", label: t("active") },
    { key: "pending", label: t("pending") },
    { key: "closed", label: t("closed") },
    { key: "lost", label: t("lost") },
  ];

  const sorts: { key: SortMode; label: string }[] = [
    { key: "newest", label: t("newest") },
    { key: "oldest", label: t("oldest") },
    { key: "budget", label: t("highestBudget") },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              {t("leads")}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
              {filteredWithScores.length} {filteredWithScores.length === 1 ? "client" : "clients"}
              {hasPropertyFilters ? " matched" : ""}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFilterSheet(true);
              }}
              style={[styles.filterBtn, { backgroundColor: hasPropertyFilters ? colors.accent : colors.surface, borderColor: hasPropertyFilters ? colors.accent : colors.border }]}
            >
              <Ionicons name="options-outline" size={18} color={hasPropertyFilters ? "#fff" : colors.text} />
              {activeFilterCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: "#fff" }]}>
                  <Text style={[styles.filterBadgeText, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/new-lead");
              }}
              style={({ pressed }) => [
                styles.addBtn,
                { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {hasPropertyFilters && (
          <View style={[styles.matchBanner, { backgroundColor: `${colors.accent}18`, borderColor: `${colors.accent}40` }]}>
            <LinearGradient colors={["#2D6BE4", "#7C3AED"]} style={styles.matchBannerIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="search" size={12} color="#fff" />
            </LinearGradient>
            <Text style={[styles.matchBannerText, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
              Showing best matches · sorted by compatibility score
            </Text>
            <Pressable onPress={() => { setPropertyFilters(defaultFilters); Haptics.selectionAsync(); }}>
              <Ionicons name="close-circle" size={18} color={colors.accent} />
            </Pressable>
          </View>
        )}

        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("searchLeads")}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text, fontFamily: "Inter_400Regular" }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        <View style={styles.filterRow}>
          <FlatList
            data={statusFilters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i.key}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setStatusFilter(item.key); }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: statusFilter === item.key ? colors.accent : colors.surface,
                    borderColor: statusFilter === item.key ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: statusFilter === item.key ? "#fff" : colors.textSecondary,
                      fontFamily: "Inter_500Medium",
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        </View>

        <View style={styles.listingFilterRow}>
          {(["all", "sale", "rent"] as const).map((key) => {
            const isSelected = listingTypeFilter === key;
            const color = key === "sale" ? "#22C55E" : key === "rent" ? "#F59E0B" : colors.accent;
            const label = key === "all" ? t("allLeads") : key === "sale" ? t("forSale") : t("forRent");
            return (
              <Pressable
                key={key}
                onPress={() => { Haptics.selectionAsync(); setListingTypeFilter(key); }}
                style={[
                  styles.listingChip,
                  {
                    backgroundColor: isSelected ? `${color}22` : colors.surface,
                    borderColor: isSelected ? color : colors.border,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
              >
                {key !== "all" && (
                  <View style={[styles.listingDot, { backgroundColor: color }]} />
                )}
                <Text style={[
                  styles.listingChipText,
                  {
                    color: isSelected ? color : colors.textSecondary,
                    fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!hasPropertyFilters && (
          <View style={styles.sortRow}>
            {sorts.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => setSort(s.key)}
                style={[
                  styles.sortChip,
                  { backgroundColor: sort === s.key ? `${colors.accent}22` : "transparent" },
                ]}
              >
                <Text
                  style={[
                    styles.sortText,
                    {
                      color: sort === s.key ? colors.accent : colors.textSecondary,
                      fontFamily: sort === s.key ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={filteredWithScores}
        keyExtractor={(item) => item.lead.id}
        contentContainerStyle={[styles.list, { paddingBottom: botPad + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons
              name={hasPropertyFilters ? "home-outline" : "search-outline"}
              size={40}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
              {hasPropertyFilters ? "No Matching Clients" : t("noLeads")}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              {hasPropertyFilters
                ? "Try adjusting your property filters to find more clients"
                : search
                ? t("searchNoResults")
                : t("noLeadsDesc")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <LeadCard lead={item.lead} matchScore={item.score} />
        )}
      />

      <FilterSheet
        visible={showFilterSheet}
        filters={propertyFilters}
        onChange={setPropertyFilters}
        onClose={() => setShowFilterSheet(false)}
        onReset={() => { setPropertyFilters(defaultFilters); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  matchBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  matchBannerIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  matchBannerText: {
    flex: 1,
    fontSize: 12,
  },
  matchIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 44,
  },
  filterRow: { flexDirection: "row" },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13 },
  sortRow: { flexDirection: "row", gap: 4 },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sortText: { fontSize: 12 },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
    position: "relative",
    overflow: "hidden",
  },
  matchBadgeAbsolute: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 15,
  },
  matchBadgeText: {
    fontSize: 11,
    color: "#fff",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 17, color: "#fff" },
  cardInfo: { flex: 1, gap: 4 },
  name: { fontSize: 15 },
  cardMeta: { flexDirection: "row", gap: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12 },
  cardTags: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 2 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { fontSize: 11 },
  cardRight: { alignItems: "flex-end", gap: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, textTransform: "capitalize" },
  listingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 4 },
  listingBadgeText: { fontSize: 10, letterSpacing: 0.2 },
  listingFilterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  listingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  listingDot: { width: 6, height: 6, borderRadius: 3 },
  listingChipText: { fontSize: 13 },
  empty: {
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 17 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});

const shStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 17,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetText: {
    fontSize: 14,
  },
  body: {
    padding: 16,
    gap: 10,
  },
  groupLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  rangeRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 0,
  },
  rangeDivider: {
    width: 1,
    marginHorizontal: 12,
    marginVertical: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  stepperLabel: {
    fontSize: 15,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    fontSize: 16,
    minWidth: 36,
    textAlign: "center",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabel: {
    fontSize: 15,
  },
  fieldGroup: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
  },
  fieldInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fieldInputText: {
    flex: 1,
    fontSize: 14,
    height: 30,
  },
  locationInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationInputText: {
    flex: 1,
    fontSize: 15,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  applyBtnText: {
    fontSize: 16,
    color: "#fff",
  },
});

const lockedStyles = StyleSheet.create({
  container: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  iconGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F59E0B",
    opacity: 0.12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1E2D45",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F59E0B44",
  },
  title: {
    fontSize: 26,
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  sub: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  dataNote: {
    fontSize: 13,
    color: "#22C55E",
    textAlign: "center",
    lineHeight: 20,
    backgroundColor: "#052e1688",
    borderWidth: 1,
    borderColor: "#16653466",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 32,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#2D6BE4",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#2D6BE4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: {
    fontSize: 17,
    color: "#fff",
  },
});
