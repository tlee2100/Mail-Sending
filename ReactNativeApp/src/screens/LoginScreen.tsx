import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authApi } from "../api/authApi";
import { DEFAULT_API_BASE_URL, normalizeBaseUrl } from "../api/http";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { colors, radii, shadow } from "../theme";
import type { AuthPayload, AuthSession } from "../types";

type LoginScreenProps = {
  onAuthenticated: (session: AuthSession) => void;
};

type AuthMode = "login" | "register" | "forgot";

function modeTitle(mode: AuthMode) {
  if (mode === "register") {
    return "Create Account";
  }

  if (mode === "forgot") {
    return "Reset Password";
  }

  return "ChadMailer Login";
}

function modeSubtitle(mode: AuthMode, otpSent: boolean) {
  if (mode === "register") {
    return otpSent
      ? "Enter the OTP sent to your email to finish account creation."
      : "Create an account with email OTP verification.";
  }

  if (mode === "forgot") {
    return otpSent
      ? "Enter the OTP and your new password to reset access."
      : "Request an OTP to reset your password.";
  }

  return "Sign in to manage dashboard, campaigns, contacts and direct emails.";
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("frontend.demo@email.com");
  const [password, setPassword] = useState("Demo@123456");
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setOtp("");
    setOtpEmail("");
    setOtpSent(false);
    if (nextMode === "forgot") {
      setPassword("");
    }
  }

  function finishAuth(data: AuthPayload, nextBaseUrl: string, fallbackEmail: string) {
    if (!data.token) {
      throw new Error("Login response did not include token.");
    }

    onAuthenticated({
      token: data.token,
      name: data.user?.name || name.trim() || fallbackEmail.split("@")[0],
      email: data.user?.email || fallbackEmail,
      baseUrl: nextBaseUrl,
    });
  }

  async function submit() {
    const nextBaseUrl = normalizeBaseUrl(DEFAULT_API_BASE_URL);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedOtp = otp.trim();

    if (!trimmedEmail) {
      Alert.alert("Missing info", "Email is required.");
      return;
    }

    if (mode !== "forgot" && !trimmedPassword) {
      Alert.alert("Missing info", "Password is required.");
      return;
    }

    if (otpSent && !/^\d{6}$/.test(trimmedOtp)) {
      Alert.alert("Missing OTP", "Enter the 6-digit OTP sent to your email.");
      return;
    }

    if (mode === "forgot" && otpSent && trimmedPassword.length < 8) {
      Alert.alert("Weak password", "New password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const data = await authApi.login(nextBaseUrl, {
          email: trimmedEmail,
          password: trimmedPassword,
        });
        finishAuth(data, nextBaseUrl, trimmedEmail);
        return;
      }

      if (mode === "register") {
        if (!otpSent) {
          const data = await authApi.register(nextBaseUrl, {
            name: name.trim() || trimmedEmail.split("@")[0],
            email: trimmedEmail,
            password: trimmedPassword,
          });
          const targetEmail = data.email || trimmedEmail;
          setOtpEmail(targetEmail);
          setOtpSent(true);
          Alert.alert("OTP sent", `Enter the 6-digit OTP sent to ${targetEmail}.`);
          return;
        }

        const data = await authApi.verifyRegisterOtp(nextBaseUrl, {
          email: otpEmail || trimmedEmail,
          otp: trimmedOtp,
        });
        finishAuth(data, nextBaseUrl, otpEmail || trimmedEmail);
        return;
      }

      if (!otpSent) {
        const data = await authApi.requestPasswordResetOtp(nextBaseUrl, { email: trimmedEmail });
        const targetEmail = data.email || trimmedEmail;
        setOtpEmail(targetEmail);
        setOtpSent(true);
        Alert.alert("OTP sent", `Enter the 6-digit OTP sent to ${targetEmail}.`);
        return;
      }

      await authApi.verifyPasswordResetOtp(nextBaseUrl, {
        email: otpEmail || trimmedEmail,
        otp: trimmedOtp,
        newPassword: trimmedPassword,
      });
      Alert.alert("Password updated", "You can sign in with your new password.");
      switchMode("login");
      setEmail(otpEmail || trimmedEmail);
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

            <Text style={styles.title}>{modeTitle(mode)}</Text>
            <Text style={styles.subtitle}>{modeSubtitle(mode, otpSent)}</Text>

            <View style={styles.stack}>
              {mode === "register" && !otpSent ? (
                <TextField label="Name" labelStyle={styles.fieldLabel} onChangeText={setName} value={name} />
              ) : null}

              <TextField
                autoCapitalize="none"
                editable={!otpSent || mode === "login"}
                keyboardType="email-address"
                label="Email"
                labelStyle={styles.fieldLabel}
                onChangeText={setEmail}
                value={email}
              />

              {mode !== "forgot" || otpSent ? (
                <TextField
                  label={mode === "forgot" ? "New password" : "Password"}
                  labelStyle={styles.fieldLabel}
                  onChangeText={setPassword}
                  secureTextEntry
                  value={password}
                />
              ) : null}

              {otpSent ? (
                <TextField
                  keyboardType="number-pad"
                  label="Email OTP"
                  labelStyle={styles.fieldLabel}
                  maxLength={6}
                  onChangeText={setOtp}
                  value={otp}
                />
              ) : null}

              <AppButton
                loading={submitting}
                onPress={submit}
                title={
                  mode === "login"
                    ? "Sign in"
                    : otpSent
                      ? mode === "register"
                        ? "Verify & Create"
                        : "Verify & Reset"
                      : "Send OTP"
                }
              />
            </View>

            <View style={styles.links}>
              {mode !== "login" ? (
                <TouchableOpacity activeOpacity={0.75} onPress={() => switchMode("login")}>
                  <Text style={styles.toggleText}>Back to sign in</Text>
                </TouchableOpacity>
              ) : null}
              {mode !== "register" ? (
                <TouchableOpacity activeOpacity={0.75} onPress={() => switchMode("register")}>
                  <Text style={styles.toggleText}>Create account</Text>
                </TouchableOpacity>
              ) : null}
              {mode !== "forgot" ? (
                <TouchableOpacity activeOpacity={0.75} onPress={() => switchMode("forgot")}>
                  <Text style={styles.toggleText}>Forgot password?</Text>
                </TouchableOpacity>
              ) : null}
            </View>
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
  fieldLabel: {
    color: colors.darkMuted,
  },
  links: {
    alignItems: "center",
    gap: 12,
    paddingTop: 18,
  },
  toggleText: {
    color: colors.cyan,
    fontSize: 14,
    fontWeight: "700",
  },
});
