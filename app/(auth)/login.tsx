import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLogin = async () => {
    if (!emailOrUsername.trim() || !password) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(emailOrUsername.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Sign In Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#2D6BE4", "#1A4DB3"]}
        style={[styles.heroGrad, { paddingTop: topPad + 24 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroIcon}>
          <Ionicons name="lock-closed" size={40} color="#fff" />
        </View>
        <Text style={[styles.heroTitle, { fontFamily: "Inter_700Bold" }]}>Welcome Back</Text>
        <Text style={[styles.heroSub, { fontFamily: "Inter_400Regular" }]}>Sign in to your LeadLocker account</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: botPad + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                Email or Username
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  value={emailOrUsername}
                  onChangeText={setEmailOrUsername}
                  placeholder="email@example.com or username"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                Password
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular", flex: 1 }]}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textTertiary} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => router.push("/(auth)/forgot-password")}
              style={styles.forgotRow}
            >
              <Text style={[styles.forgotText, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
                Forgot Password
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [{ opacity: pressed || loading ? 0.8 : 1 }]}
          >
            <LinearGradient
              colors={["#2D6BE4", "#1A4DB3"]}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Text style={[styles.submitText, { fontFamily: "Inter_700Bold" }]}>Signing in...</Text>
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={[styles.submitText, { fontFamily: "Inter_700Bold" }]}>Sign In</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Don't have an account?
            </Text>
            <Pressable onPress={() => router.replace("/(auth)/register")}>
              <Text style={[styles.switchLink, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
                {" "}Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroGrad: {
    alignItems: "center",
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    color: "#fff",
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  body: {
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  inputGroup: { gap: 8 },
  label: { fontSize: 13 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 4 },
  forgotRow: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  submitText: { fontSize: 17, color: "#fff" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14 },
});
