import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function PaywallModal() {
  const insets = useSafeAreaInsets();
  const { paywallVisible, dismissPaywall, subscribe, restorePurchases, isTrialActive, trialDaysRemaining } = useSubscription();
  const { user } = useAuth();
  const { t } = useTheme();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);

  const FEATURES = [
    { icon: "people",           label: t("f1Label"), desc: t("f1Desc") },
    { icon: "call",             label: t("f2Label"), desc: t("f2Desc") },
    { icon: "home",             label: t("f3Label"), desc: t("f3Desc") },
    { icon: "copy-outline",     label: t("f4Label"), desc: t("f4Desc") },
    { icon: "card",             label: t("f5Label"), desc: t("f5Desc") },
    { icon: "globe",            label: t("f6Label"), desc: t("f6Desc") },
    { icon: "color-palette",    label: t("f7Label"), desc: t("f7Desc") },
    { icon: "stats-chart",      label: t("f8Label"), desc: t("f8Desc") },
    { icon: "shield-checkmark", label: t("f9Label"), desc: t("f9Desc") },
  ];

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await subscribe(selectedPlan);
    } catch (e: any) {
      Alert.alert(t("error"), e?.message || t("paywallCtaMonthly"));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await restorePurchases();
      Alert.alert("✓", t("paywallRestoreOk"));
    } catch {
      Alert.alert("", t("paywallRestoreNone"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={paywallVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={dismissPaywall}>
            <Ionicons name="chevron-back" size={20} color="#94a3b8" />
            <Text style={styles.backBtnText}>{t("paywallBack")}</Text>
          </TouchableOpacity>

          <View style={styles.crownWrapper}>
            <View style={styles.crownGlow} />
            <View style={styles.crownCircle}>
              <Ionicons name="diamond" size={38} color="#F59E0B" />
            </View>
          </View>

          <Text style={styles.title}>LeadLocker Pro</Text>
          <Text style={styles.subtitle}>{t("paywallSubtitle")}</Text>

          {isTrialActive && trialDaysRemaining > 0 && (
            <View style={styles.trialBadge}>
              <Ionicons name="gift" size={15} color="#22C55E" />
              <Text style={styles.trialBadgeText}>
                {trialDaysRemaining} {t("paywallDaysFreeTrial")}
              </Text>
            </View>
          )}

          <View style={styles.featuresCard}>
            {FEATURES.map((f, i) => (
              <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}>
                <View style={styles.featureIconBox}>
                  <Ionicons name={f.icon as any} size={18} color="#2D6BE4" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              </View>
            ))}
          </View>

          <Text style={styles.planHeader}>{t("paywallSelectPlan")}</Text>

          <View style={styles.planRow}>
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === "monthly" && styles.planCardActive]}
              onPress={() => setSelectedPlan("monthly")}
              activeOpacity={0.8}
            >
              <View style={styles.planCardInner}>
                <Text style={[styles.planName, selectedPlan === "monthly" && styles.planNameActive]}>
                  {t("monthlyPlan")}
                </Text>
                <Text style={[styles.planPrice, selectedPlan === "monthly" && styles.planPriceActive]}>
                  $9.99
                </Text>
                <Text style={[styles.planPer, selectedPlan === "monthly" && styles.planPerActive]}>
                  {t("paywallPerMonth")}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planCard, selectedPlan === "yearly" && styles.planCardActive]}
              onPress={() => setSelectedPlan("yearly")}
              activeOpacity={0.8}
            >
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>{t("paywallSaveBadge")}</Text>
              </View>
              <View style={styles.planCardInner}>
                <Text style={[styles.planName, selectedPlan === "yearly" && styles.planNameActive]}>
                  {t("yearlyPlan")}
                </Text>
                <Text style={[styles.planPrice, selectedPlan === "yearly" && styles.planPriceActive]}>
                  $99.99
                </Text>
                <Text style={[styles.planPer, selectedPlan === "yearly" && styles.planPerActive]}>
                  {t("paywallPerYear")}
                </Text>
                <Text style={[styles.planMonthly, selectedPlan === "yearly" && styles.planMonthlyActive]}>
                  {t("paywallMonthlyEquiv")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, loading && { opacity: 0.7 }]}
            onPress={handleSubscribe}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="diamond" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.ctaText}>
                  {isTrialActive
                    ? `${trialDaysRemaining} ${t("daysLeft").toLowerCase()} — ${t("freeTrial").toLowerCase()}`
                    : selectedPlan === "monthly"
                    ? t("paywallCtaMonthly")
                    : t("paywallCtaYearly")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {isTrialActive && (
            <Text style={styles.trialNote}>{t("paywallTrialNote")}</Text>
          )}

          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
            <Text style={styles.restoreText}>{t("paywallRestore")}</Text>
          </TouchableOpacity>

          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => Linking.openURL("https://magenticlab.com/leadlocker-privacy-policy/")}>
              <Text style={[styles.legalText, styles.legalLink]}>{t("paywallPrivacy")}</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL("https://magenticlab.com/leadlocker-privacy-policy/")}>
              <Text style={[styles.legalText, styles.legalLink]}>{t("paywallTerms")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1628",
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 8,
    gap: 2,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#94a3b8",
  },
  crownWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  crownGlow: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F59E0B",
    opacity: 0.15,
  },
  crownCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#1E2D45",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F59E0B44",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 22,
  },
  trialBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#052e16",
    borderWidth: 1,
    borderColor: "#166534",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 14,
    gap: 6,
  },
  trialBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#22C55E",
  },
  featuresCard: {
    width: "100%",
    backgroundColor: "#111D2E",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#1E3050",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#1E3050",
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1A2E4A",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#e2e8f0",
  },
  featureDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    marginTop: 1,
  },
  planHeader: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#94a3b8",
    alignSelf: "flex-start",
    marginTop: 24,
    marginBottom: 12,
  },
  planRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  planCard: {
    flex: 1,
    backgroundColor: "#111D2E",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#1E3050",
    paddingTop: 28,
    paddingBottom: 16,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  planCardActive: {
    borderColor: "#2D6BE4",
    backgroundColor: "#0F2247",
  },
  planCardInner: {
    alignItems: "center",
  },
  saveBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#2D6BE4",
    paddingVertical: 5,
    alignItems: "center",
  },
  saveBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
    marginBottom: 4,
  },
  planNameActive: {
    color: "#93c5fd",
  },
  planPrice: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#e2e8f0",
    letterSpacing: -0.5,
  },
  planPriceActive: {
    color: "#fff",
  },
  planPer: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  planPerActive: {
    color: "#93c5fd",
  },
  planMonthly: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#475569",
    marginTop: 3,
  },
  planMonthlyActive: {
    color: "#22C55E",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2D6BE4",
    borderRadius: 16,
    paddingVertical: 17,
    width: "100%",
    marginTop: 20,
    shadowColor: "#2D6BE4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  trialNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#475569",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
  restoreBtn: {
    marginTop: 18,
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#2D6BE4",
    textDecorationLine: "underline",
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  legalText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#334155",
  },
  legalLink: {
    color: "#2D6BE4",
    textDecorationLine: "underline",
  },
  legalDot: {
    fontSize: 14,
    color: "#334155",
  },
});
