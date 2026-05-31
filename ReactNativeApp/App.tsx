import { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppShell } from "./src/screens/AppShell";
import { LoginScreen } from "./src/screens/LoginScreen";
import { clearSession, loadSession, saveSession } from "./src/storage/sessionStore";
import { colors } from "./src/theme";
import type { AuthSession } from "./src/types";

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;

    loadSession()
      .then((storedSession) => {
        if (mounted) {
          setSession(storedSession?.token ? storedSession : null);
        }
      })
      .finally(() => {
        if (mounted) {
          setBooting(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleAuthenticated(nextSession: AuthSession) {
    await saveSession(nextSession);
    setSession(nextSession);
  }

  async function handleLogout() {
    await clearSession();
    setSession(null);
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.boot}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.bootText}>Loading ChadMailer...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      {session ? (
        <AppShell session={session} onLogout={handleLogout} />
      ) : (
        <LoginScreen onAuthenticated={handleAuthenticated} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  bootText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
  },
});
