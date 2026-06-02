import { useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { authApi } from "../api/authApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { colors, radii } from "../theme";
import type { AuthSession, AuthUser } from "../types";

type AccountScreenProps = {
  session: AuthSession;
  onSessionUpdate: (session: AuthSession) => void;
};

function initials(name?: string, email?: string) {
  const source = String(name || email || "CM").trim();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-US");
}

export function AccountScreen({ session, onSessionUpdate }: AccountScreenProps) {
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [name, setName] = useState(session.name);
  const [email, setEmail] = useState(session.email);
  const [profileOtp, setProfileOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [profileOtpSent, setProfileOtpSent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordOtp, setPasswordOtp] = useState("");
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  async function loadProfile() {
    setLoading(true);
    try {
      const nextProfile = await authApi.me(session);
      setProfile(nextProfile);
      setName(nextProfile.name || session.name);
      setEmail(nextProfile.email || session.email);
    } catch (error) {
      Alert.alert("Profile failed", error instanceof Error ? error.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, [session.token]);

  function applyUserToSession(user?: AuthUser) {
    if (!user) {
      return;
    }

    onSessionUpdate({
      ...session,
      name: user.name || session.name,
      email: user.email || session.email,
    });
    setProfile(user);
    setName(user.name || "");
    setEmail(user.email || "");
  }

  async function updateProfile() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      Alert.alert("Missing info", "Full name and email are required.");
      return;
    }

    if (profileOtpSent && !/^\d{6}$/.test(profileOtp.trim())) {
      Alert.alert("Missing OTP", "Enter the 6-digit OTP sent to your new email.");
      return;
    }

    setProfileSubmitting(true);
    try {
      if (profileOtpSent) {
        const data = await authApi.verifyProfileEmailOtp(session, {
          email: pendingEmail || trimmedEmail,
          otp: profileOtp.trim(),
        });
        applyUserToSession(data.user);
        setProfileOtp("");
        setPendingEmail("");
        setProfileOtpSent(false);
        Alert.alert("Profile updated", "Your profile email has been verified.");
        return;
      }

      const data = await authApi.updateProfile(session, {
        name: trimmedName,
        email: trimmedEmail,
      });

      if (data.requiresOtp) {
        const targetEmail = data.email || trimmedEmail;
        setPendingEmail(targetEmail);
        setProfileOtpSent(true);
        Alert.alert("OTP sent", `Enter the 6-digit OTP sent to ${targetEmail}.`);
        return;
      }

      applyUserToSession(data.user);
      Alert.alert("Profile updated", "Your profile details have been saved.");
    } catch (error) {
      Alert.alert("Profile update failed", error instanceof Error ? error.message : "Request failed");
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function changePassword() {
    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedOtp = passwordOtp.trim();

    if (!passwordOtpSent && (!trimmedCurrentPassword || !trimmedNewPassword)) {
      Alert.alert("Missing info", "Current password and new password are required.");
      return;
    }

    if (!passwordOtpSent && trimmedNewPassword.length < 8) {
      Alert.alert("Weak password", "New password must be at least 8 characters.");
      return;
    }

    if (passwordOtpSent && !/^\d{6}$/.test(trimmedOtp)) {
      Alert.alert("Missing OTP", "Enter the 6-digit OTP sent to your email.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      if (!passwordOtpSent) {
        await authApi.requestPasswordChangeOtp(session, {
          currentPassword: trimmedCurrentPassword,
          newPassword: trimmedNewPassword,
        });
        setPasswordOtpSent(true);
        Alert.alert("OTP sent", `Enter the 6-digit OTP sent to ${session.email}.`);
        return;
      }

      await authApi.verifyPasswordChangeOtp(session, { otp: trimmedOtp });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordOtp("");
      setPasswordOtpSent(false);
      Alert.alert("Password updated", "Your password has been changed.");
    } catch (error) {
      Alert.alert("Password change failed", error instanceof Error ? error.message : "Request failed");
    } finally {
      setPasswordSubmitting(false);
    }
  }

  const displayName = profile?.name || session.name;
  const displayEmail = profile?.email || session.email;

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProfile} />}
    >
      <View style={styles.hero}>
        <Text style={styles.breadcrumb}>Dashboard &gt; Profile</Text>
        <Text style={styles.title}>Profile Settings</Text>
        <Text style={styles.subtitle}>Manage your personal information and account details.</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(displayName, displayEmail)}</Text>
          </View>
          <View style={styles.profileTitleWrap}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Text style={styles.sectionHint}>Update your account details and personal information.</Text>
          </View>
        </View>

        <View style={styles.stack}>
          <TextField label="Full Name" onChangeText={setName} value={name} />
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email Address"
            onChangeText={setEmail}
            value={email}
          />
          {profileOtpSent ? (
            <TextField
              keyboardType="number-pad"
              label="New email OTP"
              maxLength={6}
              onChangeText={setProfileOtp}
              value={profileOtp}
            />
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Account Information</Text>
          <Text style={styles.infoLine}>Role: {profile?.role || "user"}</Text>
          <Text style={styles.infoLine}>Account Created: {formatDate(profile?.createdAt)}</Text>
          <Text style={styles.infoLine}>Last Updated: {formatDate(profile?.updatedAt)}</Text>
          <Text style={styles.infoLine}>Last Login: {formatDate(profile?.lastLogin)}</Text>
        </View>

        <AppButton
          loading={profileSubmitting}
          onPress={updateProfile}
          title={profileOtpSent ? "Verify & Update Profile" : "Update Profile"}
        />
        {profileOtpSent ? (
          <AppButton
            onPress={() => {
              setProfileOtp("");
              setPendingEmail("");
              setProfileOtpSent(false);
            }}
            title="Cancel Email Change"
            variant="secondary"
          />
        ) : null}
      </Card>

      <Card style={{ ...styles.card, ...styles.securityCard }}>
        <View style={styles.securityHeader}>
          <View style={styles.lockBox}>
            <Text style={styles.lockText}>Lock</Text>
          </View>
          <View style={styles.profileTitleWrap}>
            <Text style={styles.sectionTitle}>Security Settings</Text>
            <Text style={styles.sectionHint}>Keep your account secure with a strong password.</Text>
          </View>
        </View>

        <View style={styles.stack}>
          {!passwordOtpSent ? (
            <>
              <TextField
                label="Current password"
                onChangeText={setCurrentPassword}
                secureTextEntry
                value={currentPassword}
              />
              <TextField
                label="New password"
                onChangeText={setNewPassword}
                secureTextEntry
                value={newPassword}
              />
            </>
          ) : (
            <TextField
              keyboardType="number-pad"
              label="Password change OTP"
              maxLength={6}
              onChangeText={setPasswordOtp}
              value={passwordOtp}
            />
          )}

          <AppButton
            loading={passwordSubmitting}
            onPress={changePassword}
            title={passwordOtpSent ? "Verify & Change Password" : "Change Password"}
          />
          {passwordOtpSent ? (
            <AppButton
              onPress={() => {
                setPasswordOtp("");
                setPasswordOtpSent(false);
              }}
              title="Back"
              variant="secondary"
            />
          ) : null}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    padding: 16,
    paddingBottom: 28,
  },
  hero: {
    gap: 8,
  },
  breadcrumb: {
    color: colors.muted,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    gap: 16,
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  avatarText: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: "900",
  },
  profileTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  stack: {
    gap: 14,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
  },
  infoBox: {
    gap: 8,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  infoLine: {
    color: colors.muted,
    fontSize: 13,
  },
  securityCard: {
    borderLeftColor: colors.warning,
    borderLeftWidth: 4,
  },
  securityHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  lockBox: {
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderRadius: radii.md,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  lockText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
});
