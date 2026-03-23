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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useLeads } from "@/contexts/LeadsContext";
import { ThemeMode } from "@/constants/colors";
import { LANGUAGES, Language } from "@/constants/i18n";

function ThemeOption({
  label,
  mode,
  icon,
  gradientColors,
}: {
  label: string;
  mode: ThemeMode;
  icon: string;
  gradientColors: [string, string];
}) {
  const { colors, themeMode, setThemeMode } = useTheme();
  const isSelected = themeMode === mode;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        setThemeMode(mode);
      }}
      style={[
        styles.themeOption,
        {
          borderColor: isSelected ? colors.accent : colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.themeIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon as any} size={18} color="#fff" />
      </LinearGradient>
      <Text
        style={[
          styles.themeLabel,
          {
            color: isSelected ? colors.accent : colors.textSecondary,
            fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
          },
        ]}
      >
        {label}
      </Text>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors, t, themeMode, language, setLanguage } = useTheme();
  const { stats } = useLeads();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const themes: { label: string; mode: ThemeMode; icon: string; gradient: [string, string] }[] = [
    { label: t("light"), mode: "light", icon: "sunny", gradient: ["#F59E0B", "#EF4444"] },
    { label: t("darkBlack"), mode: "dark-black", icon: "moon", gradient: ["#374151", "#111827"] },
    { label: t("darkNavy"), mode: "dark-navy", icon: "planet", gradient: ["#1D4ED8", "#0A1628"] },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 24 }}
      >
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            {t("settings")}
          </Text>
        </View>

        <View style={styles.body}>
          <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinearGradient
              colors={["#2D6BE4", "#7C3AED"]}
              style={styles.profileAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="domain" size={28} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={[styles.profileName, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                LeadLocker CRM
              </Text>
              <Text style={[styles.profileSub, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Real Estate · {stats.total} leads
              </Text>
            </View>
          </View>

          <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{stats.total}</Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{t("totalLeads")}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: colors.success, fontFamily: "Inter_700Bold" }]}>{stats.active}</Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{t("activeLeads")}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: colors.warning, fontFamily: "Inter_700Bold" }]}>{stats.closed}</Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{t("closedLeads")}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            {t("appearance")}
          </Text>

          <View style={styles.themeGrid}>
            {themes.map((th) => (
              <ThemeOption
                key={th.mode}
                label={th.label}
                mode={th.mode}
                icon={th.icon}
                gradientColors={th.gradient}
              />
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            {t("language")}
          </Text>

          <View style={[styles.langGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {LANGUAGES.map((lang, idx) => {
              const isSelected = language === lang.code;
              const isLast = idx === LANGUAGES.length - 1;
              return (
                <React.Fragment key={lang.code}>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setLanguage(lang.code as Language);
                    }}
                    style={[styles.langRow, { borderColor: colors.border }]}
                  >
                    <View>
                      <Text style={[styles.langNative, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                        {lang.nativeLabel}
                      </Text>
                      <Text style={[styles.langEnglish, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                        {lang.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                    )}
                  </Pressable>
                  {!isLast && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 17,
  },
  profileSub: {
    fontSize: 13,
    marginTop: 2,
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statVal: {
    fontSize: 24,
  },
  statLbl: {
    fontSize: 11,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  themeGrid: {
    gap: 10,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  themeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  themeLabel: {
    flex: 1,
    fontSize: 15,
  },
  langGrid: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  langNative: {
    fontSize: 15,
  },
  langEnglish: {
    fontSize: 12,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
});
