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

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRegister = async () => {
    if (!email.trim() || !username.trim() || !password || !confirmPassword) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), username.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Registration Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#7C3AED", "#2D6BE4"]}
        style={[styles.heroGrad, { paddingTop: topPad + 24 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroIcon}>
          <Ionicons name="person-add" size={40} color="#fff" />
        </View>
        <Text style={[styles.heroTitle, { fontFamily: "Inter_700Bold" }]}>Create Account</Text>
        <Text style={[styles.heroSub, { fontFamily: "Inter_400Regular" }]}>Join LeadLocker for free</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: botPad + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Email</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => usernameRef.current?.focus()}
                  style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Username</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Ionicons name="at-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  ref={usernameRef}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={setPassword}
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
                  borderColor: passwordsMatch ? "#22C55E" : passwordMismatch ? "#EF4444" : colors.border,
                },
              ]}>
                <Ionicons
                  name={passwordsMatch ? "checkmark-circle-outline" : passwordMismatch ? "close-circle-outline" : "lock-closed-outline"}
                  size={18}
                  color={passwordsMatch ? "#22C55E" : passwordMismatch ? "#EF4444" : colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={confirmRef}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular", flex: 1 }]}
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textTertiary} />
                </Pressable>
              </View>
              {passwordMismatch && (
                <Text style={[styles.errorText, { fontFamily: "Inter_400Regular" }]}>Passwords don't match</Text>
              )}
            </View>
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={({ pressed }) => [{ opacity: pressed || loading ? 0.8 : 1 }]}
          >
            <LinearGradient
              colors={["#7C3AED", "#2D6BE4"]}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Text style={[styles.submitText, { fontFamily: "Inter_700Bold" }]}>Creating account...</Text>
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="#fff" />
                  <Text style={[styles.submitText, { fontFamily: "Inter_700Bold" }]}>Create Account</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Already have an account?
            </Text>
            <Pressable onPress={() => router.replace("/(auth)/login")}>
              <Text style={[styles.switchLink, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
                {" "}Sign In
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
  heroTitle: { fontSize: 26, color: "#fff", marginBottom: 6 },
  heroSub: { fontSize: 15, color: "rgba(255,255,255,0.8)", textAlign: "center" },
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
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 2 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  submitText: { fontSize: 17, color: "#fff" },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14 },
});
