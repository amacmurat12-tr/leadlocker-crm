import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLeads, Lead, LeadStatus } from "@/contexts/LeadsContext";
import { formatBudget } from "@/constants/currencies";

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

function ActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animStyle]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94, { damping: 12 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        onPress={onPress}
        style={[styles.actionBtn, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}
      >
        <Ionicons name={icon as any} size={22} color={color} />
        <Text style={[styles.actionLabel, { color, fontFamily: "Inter_600SemiBold" }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number | boolean;
}) {
  const { colors } = useTheme();
  if (!value && value !== 0) return null;

  const displayValue =
    typeof value === "boolean"
      ? value ? "Yes" : "No"
      : String(value);

  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
      <View style={[styles.infoIcon, { backgroundColor: `${colors.accent}18` }]}>
        <Ionicons name={icon as any} size={16} color={colors.accent} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
          {displayValue}
        </Text>
      </View>
    </View>
  );
}

const STATUSES: LeadStatus[] = ["active", "pending", "closed", "lost"];

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, t, isDark } = useTheme();
  const { getLead, updateLead, deleteLead } = useLeads();
  const { isProUser, openPaywall } = useSubscription();
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isProUser) {
      router.back();
      setTimeout(() => openPaywall(), 200);
    }
  }, [isProUser]);

  const lead = getLead(id);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!lead) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 16 }}>Lead not found</Text>
      </View>
    );
  }

  const initials = getInitials(lead.firstName, lead.lastName);
  const statusColor = getStatusColor(lead.status, colors);

  const avatarColors: [string, string] =
    lead.status === "active" ? [colors.accent, colors.accentDark] :
    lead.status === "pending" ? ["#F59E0B", "#D97706"] :
    lead.status === "closed" ? [colors.success, "#16A34A"] :
    [colors.danger, "#DC2626"];

  const handleCall = () => {
    if (!lead.phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${lead.phone}`);
  };

  const handleEmail = () => {
    if (!lead.email) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`mailto:${lead.email}`);
  };

  const handleWhatsApp = () => {
    if (!lead.phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const cleaned = lead.phone.replace(/[^\d+]/g, "");
    Linking.openURL(`https://wa.me/${cleaned}`);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t("deleteConfirm"),
      t("deleteConfirmDesc"),
      [
        { text: t("no"), style: "cancel" },
        {
          text: t("yes"),
          style: "destructive",
          onPress: () => {
            deleteLead(lead.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleStatusChange = (status: LeadStatus) => {
    Haptics.selectionAsync();
    updateLead(lead.id, { status });
  };

  const handleCopy = async () => {
    const sep = "─────────────────────";
    const lines: string[] = [];

    lines.push(t("leadCardHeader"));
    lines.push(sep);
    lines.push(`👤  ${lead.firstName} ${lead.lastName}`);
    lines.push(`📊  ${t("status")}: ${t(lead.status as any)}`);
    lines.push(`💰  ${t("budget")}: ${formatBudget(lead.budget, lead.currency)}`);

    lines.push("");
    lines.push(`📞  ${t("contactInfo").toUpperCase()}`);
    if (lead.phone)    lines.push(`    ${t("phone")}: ${lead.phone}`);
    if (lead.email)    lines.push(`    ${t("email")}: ${lead.email}`);
    if (lead.location) lines.push(`    ${t("location")}: ${lead.location}`);

    lines.push("");
    lines.push(`🏠  ${t("propertyPreferences").toUpperCase()}`);
    lines.push(`    ${t("propertyType")}: ${propertyTypeLabels[lead.propertyType] || lead.propertyType}`);
    lines.push(`    ${t("listingType")}: ${lead.listingType === "rent" ? t("forRent") : t("forSale")}`);
    lines.push(`    ${t("bedrooms")}: ${lead.bedrooms}  |  ${t("bathrooms")}: ${lead.bathrooms}`);
    if (lead.squareFootage) lines.push(`    ${t("squareFootage")}: ${lead.squareFootage.toLocaleString()} sq ft`);
    if (lead.hasGarage) lines.push(`    ${t("garage")}: ✓ ${lead.garageSpots ?? 1} ${t("garageVehicles")}`);
    if (lead.hasPool)   lines.push(`    ${t("pool")}: ✓`);

    if (lead.notes) {
      lines.push("");
      lines.push(`📝  ${t("notes").toUpperCase()}`);
      lines.push(`    ${lead.notes}`);
    }

    lines.push(sep);
    lines.push("📲  Shared via LeadLocker CRM");

    const text = lines.join("\n");
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const propertyTypeLabels: Record<string, string> = {
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 24 }}
      >
        <LinearGradient
          colors={avatarColors}
          style={[styles.heroSection, { paddingTop: topPad + 8 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroNav}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <View style={styles.heroNavRight}>
              <Pressable
                onPress={handleCopy}
                style={({ pressed }) => [
                  styles.navBtn,
                  {
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: copied ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.2)",
                  },
                ]}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={18}
                  color="#fff"
                />
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: "/new-lead", params: { editId: id } })}
                style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
              </Pressable>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroAvatar}>
              <Text style={[styles.heroInitials, { fontFamily: "Inter_700Bold" }]}>{initials}</Text>
            </View>
            <Text style={[styles.heroName, { fontFamily: "Inter_700Bold" }]}>
              {lead.firstName} {lead.lastName}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
              <View style={[styles.statusDot, { backgroundColor: "#fff" }]} />
              <Text style={[styles.statusText, { fontFamily: "Inter_600SemiBold" }]}>
                {t(lead.status as any)}
              </Text>
            </View>
            <Text style={[styles.heroBudget, { fontFamily: "Inter_700Bold" }]}>
              {formatBudget(lead.budget, lead.currency)}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {(lead.phone || lead.email) && (
            <View style={styles.actionsRow}>
              {lead.phone && (
                <ActionButton
                  icon="call"
                  label={t("callLead")}
                  color={colors.success}
                  onPress={handleCall}
                />
              )}
              {lead.phone && (
                <ActionButton
                  icon="logo-whatsapp"
                  label="WhatsApp"
                  color="#25D366"
                  onPress={handleWhatsApp}
                />
              )}
              {lead.email && (
                <ActionButton
                  icon="mail"
                  label={t("sendEmail")}
                  color={colors.accent}
                  onPress={handleEmail}
                />
              )}
            </View>
          )}

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
              {t("contactInfo").toUpperCase()}
            </Text>
            <InfoRow icon="call-outline" label={t("phone")} value={lead.phone} />
            <InfoRow icon="mail-outline" label={t("email")} value={lead.email} />
            <InfoRow icon="location-outline" label={t("location")} value={lead.location} />
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
              {t("propertyPreferences").toUpperCase()}
            </Text>
            <InfoRow icon="cash-outline" label={t("budget")} value={formatBudget(lead.budget, lead.currency)} />
            <InfoRow icon="bed-outline" label={t("bedrooms")} value={lead.bedrooms} />
            <InfoRow icon="water-outline" label={t("bathrooms")} value={lead.bathrooms} />
            <InfoRow icon="resize-outline" label={t("squareFootage")} value={lead.squareFootage ? `${lead.squareFootage.toLocaleString()} sq ft` : ""} />
            <InfoRow icon="home-outline" label={t("propertyType")} value={propertyTypeLabels[lead.propertyType] || lead.propertyType} />
            <InfoRow icon="pricetag-outline" label={t("listingType")} value={lead.listingType === "rent" ? t("forRent") : t("forSale")} />
            <InfoRow icon="car-outline" label={t("garage")} value={lead.hasGarage ? `✓ ${lead.garageSpots ?? 1} ${t("garageVehicles")}` : ""} />
            <InfoRow icon="water" label={t("pool")} value={lead.hasPool ? "Yes" : ""} />
          </View>

          {lead.notes ? (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
                {t("notes").toUpperCase()}
              </Text>
              <Text style={[styles.notesText, { color: colors.text, fontFamily: "Inter_400Regular" }]}>
                {lead.notes}
              </Text>
            </View>
          ) : null}

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
              {t("status").toUpperCase()}
            </Text>
            <View style={styles.statusGrid}>
              {STATUSES.map((s) => {
                const sc = getStatusColor(s, colors);
                const isActive = lead.status === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => handleStatusChange(s)}
                    style={[
                      styles.statusOption,
                      {
                        backgroundColor: isActive ? `${sc}22` : colors.backgroundSecondary,
                        borderColor: isActive ? sc : colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.statusDotSmall, { backgroundColor: sc }]} />
                    <Text
                      style={[
                        styles.statusOptionText,
                        {
                          color: isActive ? sc : colors.textSecondary,
                          fontFamily: isActive ? "Inter_600SemiBold" : "Inter_400Regular",
                        },
                      ]}
                    >
                      {t(s as any)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  heroNavRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBody: {
    alignItems: "center",
    gap: 8,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroInitials: {
    fontSize: 28,
    color: "#fff",
  },
  heroName: {
    fontSize: 24,
    color: "#fff",
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 13,
    color: "#fff",
    textTransform: "capitalize",
  },
  heroBudget: {
    fontSize: 32,
    color: "#fff",
    letterSpacing: -1,
    marginTop: 4,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 15,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
  },
  infoValue: {
    fontSize: 15,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionText: {
    fontSize: 13,
    textTransform: "capitalize",
  },
});
