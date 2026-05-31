import { ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../components/AppButton";
import { colors } from "../theme";
import type { AuthSession } from "../types";
import { CampaignsScreen } from "./CampaignsScreen";
import { ContactsScreen } from "./ContactsScreen";
import { DashboardScreen } from "./DashboardScreen";
import { QuickSendScreen } from "./QuickSendScreen";
import { TagsScreen } from "./TagsScreen";

type TabKey = "dashboard" | "send" | "campaigns" | "contacts" | "tags";

const tabs: Array<{ key: TabKey; label: string; title: string }> = [
  { key: "dashboard", label: "Home", title: "Dashboard" },
  { key: "send", label: "Send", title: "Quick Send" },
  { key: "campaigns", label: "Campaigns", title: "Campaigns" },
  { key: "contacts", label: "Contacts", title: "Contacts" },
  { key: "tags", label: "Tags", title: "Tags" },
];

type AppShellProps = {
  session: AuthSession;
  onLogout: () => void;
};

export function AppShell({ session, onLogout }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const title = useMemo(
    () => tabs.find((tab) => tab.key === activeTab)?.title || "ChadMailer",
    [activeTab],
  );

  let content: ReactNode;
  if (activeTab === "dashboard") {
    content = <DashboardScreen session={session} />;
  } else if (activeTab === "send") {
    content = <QuickSendScreen session={session} />;
  } else if (activeTab === "campaigns") {
    content = <CampaignsScreen session={session} />;
  } else if (activeTab === "contacts") {
    content = <ContactsScreen session={session} />;
  } else {
    content = <TagsScreen session={session} />;
  }

  function selectTab(tab: TabKey) {
    setActiveTab(tab);
    setMenuOpen(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.menuWrap}>
            <Pressable
              accessibilityLabel="Open navigation menu"
              accessibilityRole="button"
              onPress={() => setMenuOpen((value) => !value)}
              style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
            >
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </Pressable>

            {menuOpen ? (
              <View style={styles.menu}>
                {tabs.map((tab) => {
                  const active = tab.key === activeTab;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      activeOpacity={0.75}
                      onPress={() => selectTab(tab.key)}
                      style={[styles.menuItem, active && styles.activeMenuItem]}
                    >
                      <Text style={[styles.menuItemText, active && styles.activeMenuItemText]}>{tab.label}</Text>
                      {active ? <View style={styles.activeDot} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>

          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>CM</Text>
              <View style={styles.logoSpark} />
            </View>
            <View style={styles.brandText}>
              <Text numberOfLines={1} style={styles.brandName}>ChadMailer</Text>
              <Text numberOfLines={1} style={styles.brandTag}>Mail studio</Text>
            </View>
          </View>

          <AppButton onPress={onLogout} style={styles.logout} title="Logout" variant="secondary" />
        </View>

        <View style={styles.pageTitle}>
          <Text style={styles.title}>{title}</Text>
          <Text numberOfLines={1} style={styles.subtitle}>{session.email}</Text>
        </View>
      </View>

      <View style={styles.content}>{content}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  menuWrap: {
    position: "relative",
    zIndex: 20,
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  menuLine: {
    backgroundColor: colors.text,
    borderRadius: 2,
    height: 2,
    marginVertical: 2,
    width: 18,
  },
  menu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    left: 0,
    minWidth: 178,
    padding: 8,
    position: "absolute",
    top: 52,
    zIndex: 30,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  menuItem: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 42,
    paddingHorizontal: 12,
  },
  activeMenuItem: {
    backgroundColor: "#eff6ff",
  },
  menuItemText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  activeMenuItemText: {
    color: colors.primary,
  },
  activeDot: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  brand: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 9,
    minWidth: 0,
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderColor: "#bfdbfe",
    borderRadius: 13,
    borderWidth: 2,
    height: 42,
    justifyContent: "center",
    position: "relative",
    width: 42,
  },
  logoText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "800",
  },
  logoSpark: {
    backgroundColor: colors.cyan,
    borderColor: colors.surface,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    position: "absolute",
    right: -4,
    top: -4,
    width: 12,
  },
  brandText: {
    flex: 1,
    minWidth: 0,
  },
  brandName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  brandTag: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: -1,
  },
  pageTitle: {
    alignItems: "flex-start",
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    textAlign: "left",
  },
  logout: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.75,
  },
  content: {
    flex: 1,
  },
});
