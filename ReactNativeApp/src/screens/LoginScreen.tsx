import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authApi } from "../api/authApi";
import { DEFAULT_API_BASE_URL, normalizeBaseUrl } from "../api/http";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { colors, radii, shadow } from "../theme";
import type { AuthSession } from "../types";

type LoginScreenProps = {
  onAuthenticated: (session: AuthSession) => void;
};

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [registerMode, setRegisterMode] = useState(false);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("frontend.demo@email.com");
  const [password, setPassword] = useState("Demo@123456");
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const nextBaseUrl = normalizeBaseUrl(baseUrl);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!nextBaseUrl || !trimmedEmail || !trimmedPassword) {
      Alert.alert("Missing info", "API URL, email and password are required.");
      return;
    }
    if (registerMode && otpSent && !/^\d{6}$/.test(otp.trim())) {
      Alert.alert("Missing OTP", "Enter the 6-digit OTP sent to your email.");
      return;
    }

    setSubmitting(true);
    try {
      const data = registerMode
        ? otpSent
          ? await authApi.verifyRegisterOtp(nextBaseUrl, {
              email: otpEmail || trimmedEmail,
              otp: otp.trim(),
            })
          : await authApi.register(nextBaseUrl, {
            name: name.trim() || trimmedEmail.split("@")[0],
            email: trimmedEmail,
            password: trimmedPassword,
            role: "admin",
          })
        : await authApi.login(nextBaseUrl, {
            email: trimmedEmail,
            password: trimmedPassword,
          });

      if (registerMode && !otpSent) {
        const targetEmail = "email" in data ? data.email : trimmedEmail;
        setOtpEmail(targetEmail);
        setOtpSent(true);
        Alert.alert("OTP sent", `Enter the 6-digit OTP sent to ${targetEmail}.`);
        return;
      }

      if (!("token" in data) || !data.token) {
        throw new Error("Login response did not include token.");
      }

      onAuthenticated({
        token: data.token,
        name: data.user?.name || name.trim() || trimmedEmail.split("@")[0],
        email: data.user?.email || trimmedEmail,
        baseUrl: nextBaseUrl,
      });
    } catch (error) {
      Alert.alert("Authentication failed", error instanceof Error ? error.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Card style={styles.card}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>CM</Text>
              <View style={styles.logoSpark} />
            </View>

            <Text style={styles.title}>ChadMailer Login</Text>
            <Text style={styles.subtitle}>
              Sign in to manage dashboard, campaigns, contacts and direct emails.
            </Text>

            <View style={styles.stack}>
              <TextField
                autoCapitalize="none"
                keyboardType="url"
                label="Backend API URL"
                onChangeText={setBaseUrl}
                value={baseUrl}
              />
              <Text style={styles.hint}>Android emulator default: {DEFAULT_API_BASE_URL}</Text>

              {registerMode ? (
                <TextField label="Name" onChangeText={setName} value={name} />
              ) : null}

              <TextField
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email"
                onChangeText={setEmail}
                value={email}
              />

              <TextField
                label="Password"
                onChangeText={setPassword}
                secureTextEntry
                value={password}
              />

              {registerMode && otpSent ? (
                <TextField
                  keyboardType="number-pad"
                  label="Email OTP"
                  maxLength={6}
                  onChangeText={setOtp}
                  value={otp}
                />
              ) : null}

              <AppButton
                loading={submitting}
                onPress={submit}
                title={registerMode ? (otpSent ? "Verify & Create" : "Send OTP") : "Sign in"}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setRegisterMode((value) => !value)}
              style={styles.toggle}
            >
              <Text style={styles.toggleText}>
                {registerMode ? "Already have an account? Sign in" : "No account yet? Create one"}
              </Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#eef0ff",
  },
  keyboard: {
    flex: 1,
  },
  page: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
  },
  card: {
    backgroundColor: colors.dark,
    borderColor: "#1e293b",
    borderRadius: 24,
    padding: 24,
    ...shadow.card,
  },
  logo: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderColor: "#bfdbfe",
    borderRadius: 16,
    borderWidth: 2,
    height: 56,
    justifyContent: "center",
    position: "relative",
    width: 52,
  },
  logoText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: "800",
  },
  logoSpark: {
    backgroundColor: colors.cyan,
    borderColor: colors.surface,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: "absolute",
    right: -5,
    top: -5,
    width: 14,
  },
  title: {
    color: colors.surface,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 22,
  },
  subtitle: {
    color: colors.darkMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
  stack: {
    gap: 14,
    marginTop: 22,
  },
  hint: {
    color: colors.darkMuted,
    fontSize: 12,
    marginTop: -8,
  },
  toggle: {
    alignItems: "center",
    paddingTop: 18,
  },
  toggleText: {
    color: colors.cyan,
    fontSize: 14,
    fontWeight: "700",
  },
});
