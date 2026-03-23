import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  Pressable, Alert, Platform, Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLeads } from "@/contexts/LeadsContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function formatDate(ts: number, language: string) {
  const localeMap: Record<string, string> = {
    en: "en-US", tr: "tr-TR", es: "es-ES", fr: "fr-FR",
    de: "de-DE", pt: "pt-BR", ru: "ru-RU", ar: "ar-SA",
  };
  return new Date(ts).toLocaleDateString(localeMap[language] || "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function ProfileScreen() {
  const { colors, t, language, setLanguage } = useTheme();
  const { user, logout, deleteAccount } = useAuth();
  const { stats, clearAllLeads } = useLeads();
  const { isSubscribed, isTrialActive, trialDaysRemaining, plan, openPaywall } = useSubscription();
  const insets = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!user) return null;

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t("logoutTitle"), t("logoutMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          setLanguage("en");
          await logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t("deleteAccount"),
      t("deleteAccountMsg"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("deleteAccount"),
          style: "destructive",
          onPress: async () => {
            try {
              setLanguage("en");
              await clearAllLeads();
              await deleteAccount();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e: any) {
              Alert.alert(t("error"), e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 24 }}
      >
        <LinearGradient
          colors={["#2D6BE4", "#7C3AED"]}
          style={[styles.header, { paddingTop: topPad + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
              style={styles.avatar}
            >
              <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>
                {getInitials(user.username)}
              </Text>
            </LinearGradient>
          </View>
          <Text style={[styles.username, { fontFamily: "Inter_700Bold" }]}>@{user.username}</Text>
          <Text style={[styles.email, { fontFamily: "Inter_400Regular" }]}>{user.email}</Text>
          <Text style={[styles.joinDate, { fontFamily: "Inter_400Regular" }]}>
            {t("joinedOn")}: {formatDate(user.createdAt, language)}
          </Text>

          {isSubscribed ? (
            <View style={styles.proBadge}>
              <Ionicons name="diamond" size={13} color="#F59E0B" />
              <Text style={[styles.proBadgeText, { fontFamily: "Inter_700Bold" }]}>
                PRO {plan === "yearly" ? `• ${t("yearlyPlan")}` : plan === "monthly" ? `• ${t("monthlyPlan")}` : ""}
              </Text>
            </View>
          ) : isTrialActive ? (
            <View style={[styles.proBadge, { backgroundColor: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.4)" }]}>
              <Ionicons name="hourglass-outline" size={13} color="#22C55E" />
              <Text style={[styles.proBadgeText, { color: "#22C55E", fontFamily: "Inter_700Bold" }]}>
                {t("freeTrial")} • {trialDaysRemaining} {t("daysLeft")}
              </Text>
            </View>
          ) : (
            <View style={[styles.proBadge, { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.4)" }]}>
              <Ionicons name="lock-closed" size={13} color="#EF4444" />
              <Text style={[styles.proBadgeText, { color: "#EF4444", fontFamily: "Inter_700Bold" }]}>
                {t("trialExpired")}
              </Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.text, fontFamily: "Inter_700Bold" }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{t("totalLeads")}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: "#22C55E", fontFamily: "Inter_700Bold" }]}>{stats.active}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{t("active")}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{stats.closed}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{t("closed")}</Text>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
              {t("accountInfo")}
            </Text>
            <InfoRow icon="person-outline" label={t("usernameLabel")} value={`@${user.username}`} colors={colors} />
            <InfoRow icon="mail-outline" label={t("email")} value={user.email} colors={colors} />
            <InfoRow icon="calendar-outline" label={t("memberSince")} value={formatDate(user.createdAt, language)} colors={colors} />
          </View>

          {!isSubscribed && (
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openPaywall(); }}
              style={({ pressed }) => [styles.upgradeCard, { opacity: pressed ? 0.9 : 1 }]}
            >
              <LinearGradient
                colors={["#1A3A7A", "#2D6BE4"]}
                style={styles.upgradeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.upgradeLeft}>
                  <View style={styles.upgradeIconBox}>
                    <Ionicons name="diamond" size={22} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={[styles.upgradeTitle, { fontFamily: "Inter_700Bold" }]}>
                      {t("upgradeToPro")}
                    </Text>
                    <Text style={[styles.upgradeSub, { fontFamily: "Inter_400Regular" }]}>
                      {isTrialActive
                        ? `${trialDaysRemaining} ${t("daysLeft").toLowerCase()} • $9.99/mo`
                        : t("upgradeSubFull")}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </Pressable>
          )}

          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: "#F59E0B18" }]}>
              <Ionicons name="log-out-outline" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.actionLabel, { color: "#F59E0B", fontFamily: "Inter_600SemiBold" }]}>
              {loggingOut ? t("loggingOut") : t("logout")}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#F59E0B" />
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL("https://magenticlab.com/leadlocker-privacy-policy/");
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: "#2D6BE418" }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#2D6BE4" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text, flex: 1, fontFamily: "Inter_600SemiBold" }]}>
              Privacy Policy
            </Text>
            <Ionicons name="open-outline" size={16} color={colors.textTertiary} />
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: "#EF444414", borderColor: "#EF444430", opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: "#EF444420" }]}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionLabel, { color: "#EF4444", fontFamily: "Inter_600SemiBold" }]}>
                {t("deleteAccount")}
              </Text>
              <Text style={[styles.actionSub, { color: "#EF444480", fontFamily: "Inter_400Regular" }]}>
                {t("irreversible")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon as any} size={16} color={colors.textTertiary} style={infoStyles.icon} />
      <Text style={[infoStyles.label, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: colors.text, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 },
  icon: { width: 20 },
  label: { fontSize: 14, flex: 1 },
  value: { fontSize: 14, maxWidth: "50%" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatarWrap: { marginBottom: 14 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 32, color: "#fff" },
  username: { fontSize: 22, color: "#fff", marginBottom: 4 },
  email: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 6 },
  joinDate: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  body: { padding: 16, gap: 12 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  statValue: { fontSize: 24 },
  statLabel: { fontSize: 11, textAlign: "center" },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    paddingTop: 14,
    paddingBottom: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 16 },
  actionSub: { fontSize: 12, marginTop: 2 },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.4)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 12,
  },
  proBadgeText: {
    fontSize: 11,
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
  upgradeCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  upgradeGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
  },
  upgradeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  upgradeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeTitle: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 2,
  },
  upgradeSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
});
