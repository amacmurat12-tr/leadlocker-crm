import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { useLeads } from "@/contexts/LeadsContext";
import { Lead } from "@/contexts/LeadsContext";
import { formatBudget } from "@/constants/currencies";

function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

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

function StatCard({
  label,
  value,
  icon,
  color,
  gradientColors,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  gradientColors: [string, string];
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.statCard, animStyle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.statIconBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon as any} size={20} color="#fff" />
      </LinearGradient>
      <Text style={[styles.statValue, { color: colors.text, fontFamily: "Inter_700Bold" }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{label}</Text>
    </Animated.View>
  );
}

function RecentLeadItem({ lead }: { lead: Lead }) {
  const { colors, t } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const statusColor = getStatusColor(lead.status, colors);
  const initials = getInitials(lead.firstName, lead.lastName);

  const avatarColors: [string, string] = lead.status === "active"
    ? [colors.accent, colors.accentDark]
    : lead.status === "pending"
    ? ["#F59E0B", "#D97706"]
    : lead.status === "closed"
    ? [colors.success, "#16A34A"]
    : [colors.danger, "#DC2626"];

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/lead/[id]", params: { id: lead.id } });
        }}
        style={[styles.recentItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <LinearGradient
          colors={avatarColors}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>{initials}</Text>
        </LinearGradient>
        <View style={styles.recentInfo}>
          <Text style={[styles.recentName, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            {lead.firstName} {lead.lastName}
          </Text>
          <Text style={[styles.recentSub, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
            {formatBudget(lead.budget, lead.currency)} · {lead.bedrooms}bd · {lead.location || "—"}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.statusText, { color: statusColor, fontFamily: "Inter_600SemiBold" }]}>
            {t(lead.status as any)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const { colors, t, themeMode } = useTheme();
  const { leads, stats } = useLeads();
  const insets = useSafeAreaInsets();

  const recentLeads = leads.slice(0, 5);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const headerGradient: [string, string] =
    themeMode === "dark-navy"
      ? ["#0F2347", "#0A1628"]
      : themeMode === "dark-black"
      ? ["#1A1A1A", "#000000"]
      : ["#2D6BE4", "#1A4DB3"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 32 }}
      >
        <LinearGradient
          colors={headerGradient}
          style={[styles.header, { paddingTop: topPad + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.appName, { fontFamily: "Inter_700Bold" }]}>LeadLocker</Text>
              <Text style={[styles.appSubtitle, { fontFamily: "Inter_400Regular" }]}>Real Estate CRM</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/new-lead");
              }}
              style={({ pressed }) => [
                styles.headerAddBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              label={t("totalLeads")}
              value={String(stats.total)}
              icon="people"
              color={colors.accent}
              gradientColors={["#2D6BE4", "#1A4DB3"]}
            />
            <StatCard
              label={t("activeLeads")}
              value={String(stats.active)}
              icon="pulse"
              color={colors.success}
              gradientColors={["#22C55E", "#16A34A"]}
            />
            <StatCard
              label={t("avgBudget")}
              value={formatStat(stats.avgBudget)}
              icon="cash"
              color={colors.warning}
              gradientColors={["#F59E0B", "#D97706"]}
            />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.totalBudgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinearGradient
              colors={["#2D6BE4", "#7C3AED"]}
              style={styles.totalBudgetGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.totalBudgetContent}>
                <View>
                  <Text style={[styles.totalBudgetLabel, { fontFamily: "Inter_500Medium" }]}>{t("totalBudget")}</Text>
                  <Text style={[styles.totalBudgetValue, { fontFamily: "Inter_700Bold" }]}>
                    {formatStat(stats.totalBudget)}
                  </Text>
                </View>
                <View style={styles.totalBudgetIcon}>
                  <MaterialCommunityIcons name="cash-multiple" size={36} color="rgba(255,255,255,0.9)" />
                </View>
              </View>
              <View style={styles.totalBudgetStats}>
                <View style={styles.totalBudgetStat}>
                  <Text style={styles.totalBudgetStatVal}>{stats.closed}</Text>
                  <Text style={styles.totalBudgetStatLabel}>{t("closedLeads")}</Text>
                </View>
                <View style={[styles.totalBudgetDivider]} />
                <View style={styles.totalBudgetStat}>
                  <Text style={styles.totalBudgetStatVal}>{stats.total - stats.active - stats.closed}</Text>
                  <Text style={styles.totalBudgetStatLabel}>{t("pending")}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <Pressable
            onPressIn={() => {}}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/new-lead");
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={["#2D6BE4", "#1A4DB3"]}
              style={styles.addLeadBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={[styles.addLeadBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                {t("addNewLead")}
              </Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
              {t("recentLeads")}
            </Text>
            {leads.length > 0 && (
              <Pressable
                onPress={() => router.push("/leads")}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.seeAll, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
                  See all
                </Text>
              </Pressable>
            )}
          </View>

          {recentLeads.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <LinearGradient
                colors={["#2D6BE4", "#7C3AED"]}
                style={styles.emptyIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="people-outline" size={32} color="#fff" />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                {t("noLeads")}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                {t("noLeadsDesc")}
              </Text>
            </View>
          ) : (
            recentLeads.map((lead) => (
              <RecentLeadItem key={lead.id} lead={lead} />
            ))
          )}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  appName: {
    fontSize: 28,
    color: "#fff",
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  body: {
    padding: 16,
    paddingTop: 20,
    gap: 16,
  },
  totalBudgetCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  totalBudgetGradient: {
    padding: 20,
  },
  totalBudgetContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalBudgetLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  totalBudgetValue: {
    fontSize: 36,
    color: "#fff",
    letterSpacing: -1,
    marginTop: 4,
  },
  totalBudgetIcon: {
    opacity: 0.8,
  },
  totalBudgetStats: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  totalBudgetStat: {
    flex: 1,
  },
  totalBudgetStatVal: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  totalBudgetStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
  },
  totalBudgetDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    color: "#fff",
  },
  recentInfo: {
    flex: 1,
    gap: 4,
  },
  recentName: {
    fontSize: 15,
  },
  recentSub: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    textTransform: "capitalize",
  },
  emptyState: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  addLeadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: "#2D6BE4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  addLeadBtnText: {
    fontSize: 15,
    color: "#fff",
  },
});
