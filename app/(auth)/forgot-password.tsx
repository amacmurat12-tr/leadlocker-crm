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

type Step = "email" | "otp" | "done";

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { forgotPassword, resetPassword } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | undefined>();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const newPasswordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleSendOtp = async () => {
    if (!email.trim()) { Alert.alert("Error", "Please enter your email address."); return; }
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setDevOtp(res.devOtp);
      setStep("otp");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword || !confirmPassword) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim(), otp.trim(), newPassword);
      setStep("done");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#F59E0B", "#D97706"]}
        style={[styles.heroGrad, { paddingTop: topPad + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.heroIcon}>
          <Ionicons
            name={step === "done" ? "checkmark-circle" : "key"}
            size={40}
            color="#fff"
          />
        </View>
        <Text style={[styles.heroTitle, { fontFamily: "Inter_700Bold" }]}>
          {step === "email" ? "Forgot Password" : step === "otp" ? "Enter Code" : "Success!"}
        </Text>
        <Text style={[styles.heroSub, { fontFamily: "Inter_400Regular" }]}>
          {step === "email"
            ? "We'll send a verification code to your email"
            : step === "otp"
            ? "Enter the 6-digit code and your new password"
            : "Your password has been reset successfully"}
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: botPad + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === "done" ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: "center", gap: 16 }]}>
              <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
              <Text style={[styles.doneTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                Password Updated
              </Text>
              <Text style={[styles.doneSub, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                You can now sign in with your new password.
              </Text>
              <Pressable
                onPress={() => router.replace("/(auth)/login")}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, width: "100%" }]}
              >
                <LinearGradient
                  colors={["#22C55E", "#16A34A"]}
                  style={styles.submitBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={[styles.submitText, { fontFamily: "Inter_700Bold" }]}>Sign In</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : step === "email" ? (
            <>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Your Email</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="email@example.com"
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      returnKeyType="send"
                      onSubmitEditing={handleSendOtp}
                      style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                    />
                  </View>
                </View>
              </View>
              <Pressable
                onPress={handleSendOtp}
                disabled={loading}
                style={({ pressed }) => [{ opacity: pressed || loading ? 0.8 : 1 }]}
              >
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  style={styles.submitBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="send-outline" size={20} color="#fff" />
                  <Text style={[styles.submitText, { fontFamily: "Inter_700Bold" }]}>
                    {loading ? "Sending..." : "Send Code"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.otpInfoBox, { backgroundColor: `${colors.warning}18`, borderColor: `${colors.warning}40` }]}>
                  <Ionicons name="mail" size={16} color={colors.warning} />
                  <Text style={[styles.otpInfoText, { color: colors.warning, fontFamily: "Inter_400Regular" }]}>
                    A 6-digit code was sent to {email}
                  </Text>
                </View>

                {devOtp && (
                  <View style={[styles.devBox, { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }]}>
                    <Text style={[styles.devLabel, { fontFamily: "Inter_600SemiBold" }]}>Dev Mode — Your Code:</Text>
                    <Text style={[styles.devOtp, { fontFamily: "Inter_700Bold" }]}>{devOtp}</Text>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>6-Digit Code</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <Ionicons name="keypad-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="000000"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      maxLength={6}
                      returnKeyType="next"
                      onSubmitEditing={() => newPasswordRef.current?.focus()}
                      style={[styles.input, { color: colors.text, fontFamily: "Inter_700Bold", letterSpacing: 6, fontSize: 20 }]}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>New Password</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      ref={newPasswordRef}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="At least 6 characters"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry={!showPassword}
                      returnKeyType="next"
                      onSubmitEditing={() => confirmRef.current?.focus()}
                      style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular", flex: 1 }]}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Confirm Password</Text>
                  <View style={[
                    styles.inputWrap,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: confirmPassword.length > 0
                        ? newPassword === confirmPassword ? "#22C55E" : "#EF4444"
                        : colors.border,
                    },
                  ]}>
                    <Ionicons
                      name={confirmPassword.length > 0 && newPassword === confirmPassword ? "checkmark-circle-outline" : "lock-closed-outline"}
                      size={18}
                      color={confirmPassword.length > 0 && newPassword === confirmPassword ? "#22C55E" : colors.textTertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={confirmRef}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter your password"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleResetPassword}
                      style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                    />
                  </View>
                </View>
              </View>

              <Pressable
                onPress={handleResetPassword}
                disabled={loading}
                style={({ pressed }) => [{ opacity: pressed || loading ? 0.8 : 1 }]}
              >
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  style={styles.submitBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="refresh-outline" size={20} color="#fff" />
                  <Text style={[styles.submitText, { fontFamily: "Inter_700Bold" }]}>
                    {loading ? "Resetting..." : "Reset Password"}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => setStep("email")} style={styles.resendRow}>
                <Text style={[styles.resendText, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
                  Resend Code
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroGrad: {
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    alignSelf: "center",
  },
  heroTitle: { fontSize: 24, color: "#fff", marginBottom: 6, textAlign: "center" },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.85)", textAlign: "center" },
  body: { padding: 20, gap: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
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
  otpInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  otpInfoText: { fontSize: 13, flex: 1 },
  devBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  devLabel: { fontSize: 12, color: "#92400E" },
  devOtp: { fontSize: 28, color: "#78350F", letterSpacing: 8 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  submitText: { fontSize: 17, color: "#fff" },
  resendRow: { alignItems: "center", paddingVertical: 8 },
  resendText: { fontSize: 14 },
  doneTitle: { fontSize: 22 },
  doneSub: { fontSize: 15, textAlign: "center" },
});
