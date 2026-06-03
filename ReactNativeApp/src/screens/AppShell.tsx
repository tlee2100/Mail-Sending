import { ReactNode, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../components/AppButton";
import { colors } from "../theme";
import type { AuthSession } from "../types";
import { AdminAuditLogsScreen, AdminDashboardScreen, AdminSettingsScreen, AdminUsersScreen } from "./AdminScreens";
import { AccountScreen } from "./AccountScreen";
import { CampaignsScreen } from "./CampaignsScreen";
import { ContactsScreen } from "./ContactsScreen";
import { DashboardScreen } from "./DashboardScreen";
import { EmailTemplatesScreen } from "./EmailTemplatesScreen";
import { QuickSendScreen } from "./QuickSendScreen";
import { TagsScreen } from "./TagsScreen";
import { TemplateDesignerScreen } from "./TemplateDesignerScreen";

type TabKey =
  | "dashboard"
  | "send"
  | "templates"
  | "designer"
  | "campaigns"
  | "contacts"
  | "tags"
  | "adminDashboard"
  | "adminUsers"
  | "adminAudit"
  | "adminSettings"
  | "account";

const tabs: Array<{ key: TabKey; label: string; title: string }> = [
  { key: "dashboard", label: "Home", title: "Dashboard" },
  { key: "send", label: "Send", title: "Quick Send" },
  { key: "templates", label: "Templates", title: "Email Templates" },
  { key: "designer", label: "Designer", title: "Template Designer" },
  { key: "campaigns", label: "Campaigns", title: "Campaigns" },
  { key: "contacts", label: "Contacts", title: "Contacts" },
  { key: "tags", label: "Tags", title: "Tags" },
  { key: "account", label: "Account", title: "Account Security" },
];

const adminTabs: Array<{ key: TabKey; label: string; title: string }> = [
  { key: "adminDashboard", label: "Admin Dashboard", title: "Admin > Dashboard" },
  { key: "adminUsers", label: "User Management", title: "Admin > Users" },
  { key: "adminAudit", label: "Audit Logs", title: "Admin > Audit Logs" },
  { key: "adminSettings", label: "System Settings", title: "Admin > Settings" },
];

type AppShellProps = {
  session: AuthSession;
  onLogout: () => void;
  onSessionUpdate: (session: AuthSession) => void;
};

export function AppShell({ session, onLogout, onSessionUpdate }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [designerTemplateId, setDesignerTemplateId] = useState<number | null>(null);
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const availableTabs = useMemo(
    () => (String(session.role || "").toLowerCase() === "admin" ? [...tabs.slice(0, -1), ...adminTabs, tabs[tabs.length - 1]] : tabs),
    [session.role],
  );

  const title = useMemo(
    () => availableTabs.find((tab) => tab.key === activeTab)?.title || "ChadMailer",
    [activeTab, availableTabs],
  );

  let content: ReactNode;
  if (activeTab === "dashboard") {
    content = <DashboardScreen session={session} />;
  } else if (activeTab === "send") {
    content = <QuickSendScreen session={session} />;
  } else if (activeTab === "templates") {
    content = (
      <EmailTemplatesScreen
        session={session}
        onOpenDesigner={(templateId) => {
          setDesignerTemplateId(templateId || null);
          setActiveTab("designer");
        }}
      />
    );
  } else if (activeTab === "designer") {
    content = <TemplateDesignerScreen session={session} initialTemplateId={designerTemplateId} />;
  } else if (activeTab === "campaigns") {
    content = <CampaignsScreen session={session} />;
  } else if (activeTab === "contacts") {
    content = <ContactsScreen session={session} />;
  } else if (activeTab === "tags") {
    content = <TagsScreen session={session} />;
  } else if (activeTab === "adminDashboard") {
    content = <AdminDashboardScreen session={session} />;
  } else if (activeTab === "adminUsers") {
    content = <AdminUsersScreen session={session} />;
  } else if (activeTab === "adminAudit") {
    content = <AdminAuditLogsScreen session={session} />;
  } else if (activeTab === "adminSettings") {
    content = <AdminSettingsScreen />;
  } else {
    content = <AccountScreen session={session} onSessionUpdate={onSessionUpdate} />;
  }

  function selectTab(tab: TabKey) {
    setActiveTab(tab);
    setMenuOpen(false);
  }

  function renderNavItems(mode: "menu" | "sidebar") {
    return availableTabs.map((tab) => {
      const active = tab.key === activeTab;
      return (
        <TouchableOpacity
          key={tab.key}
          activeOpacity={0.75}
          onPress={() => selectTab(tab.key)}
          style={[
            mode === "sidebar" ? styles.sideNavItem : styles.menuItem,
            active && (mode === "sidebar" ? styles.activeSideNavItem : styles.activeMenuItem),
          ]}
        >
          <Text
            style={[
              mode === "sidebar" ? styles.sideNavText : styles.menuItemText,
              active && (mode === "sidebar" ? styles.activeSideNavText : styles.activeMenuItemText),
            ]}
          >
            {tab.label}
          </Text>
          {active ? <View style={mode === "sidebar" ? styles.sideActiveDot : styles.activeDot} /> : null}
        </TouchableOpacity>
      );
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <View pointerEvents="none" style={styles.colorBandTop} />
        <View pointerEvents="none" style={styles.colorBandBottom} />
        <View style={[styles.sidebar, !landscape && styles.hiddenSidebar]}>
          <View style={styles.sideBrand}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>CM</Text>
              <View style={styles.logoSpark} />
            </View>
            <View style={styles.brandText}>
              <Text numberOfLines={1} style={styles.sideBrandName}>ChadMailer</Text>
              <Text numberOfLines={1} style={styles.sideBrandTag}>Mail studio</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.sideNavContent}
            showsVerticalScrollIndicator={false}
            style={styles.sideNav}
          >
            {renderNavItems("sidebar")}
          </ScrollView>

          <View style={styles.sideFooter}>
            <Text numberOfLines={1} style={styles.sideEmail}>{session.email}</Text>
            <AppButton onPress={onLogout} style={styles.sideLogout} title="Logout" variant="secondary" />
          </View>
        </View>

        <View style={styles.main}>
          {landscape ? (
            <View style={styles.landscapeTopbar}>
              <View>
                <Text style={styles.title}>{title}</Text>
                <Text numberOfLines={1} style={styles.subtitle}>{session.email}</Text>
              </View>
              <Text style={styles.orientationBadge}>Landscape</Text>
            </View>
          ) : (
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
                      {renderNavItems("menu")}
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
          )}

          <View style={styles.content}>{content}</View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  shell: {
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
    position: "relative",
  },
  colorBandTop: {
    backgroundColor: "#dbeafe",
    height: 96,
    left: 0,
    opacity: 0.8,
    position: "absolute",
    right: 0,
    top: 0,
  },
  colorBandBottom: {
    backgroundColor: "#f5d0fe",
    bottom: -36,
    height: 94,
    left: 0,
    opacity: 0.55,
    position: "absolute",
    right: 0,
  },
  sidebar: {
    backgroundColor: "#050816",
    borderRightColor: "rgba(34,211,238,0.18)",
    borderRightWidth: 1,
    flexShrink: 0,
    padding: 14,
    width: 230,
    zIndex: 2,
  },
  hiddenSidebar: {
    borderRightWidth: 0,
    display: "none",
    padding: 0,
    width: 0,
  },
  sideBrand: {
    alignItems: "center",
    borderBottomColor: "rgba(129,140,248,0.28)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingBottom: 16,
  },
  sideBrandName: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: "900",
  },
  sideBrandTag: {
    color: colors.darkMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    marginTop: 2,
    textTransform: "uppercase",
  },
  sideNav: {
    flex: 1,
  },
  sideNavContent: {
    gap: 6,
    paddingTop: 16,
    paddingBottom: 16,
  },
  sideNavItem: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  activeSideNavItem: {
    backgroundColor: "#5b4ff2",
    borderColor: "rgba(34,211,238,0.5)",
    borderWidth: 1,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 4,
  },
  sideNavText: {
    color: colors.darkMuted,
    fontSize: 14,
    fontWeight: "800",
  },
  activeSideNavText: {
    color: colors.surface,
  },
  sideActiveDot: {
    backgroundColor: colors.cyan,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  sideFooter: {
    borderTopColor: "rgba(129,140,248,0.28)",
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 14,
  },
  sideEmail: {
    color: colors.darkMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  sideLogout: {
    backgroundColor: "#111827",
    borderColor: "rgba(34,211,238,0.32)",
    minHeight: 40,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  landscapeTopbar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  orientationBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  header: {
    backgroundColor: "rgba(255,255,255,0.96)",
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
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
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
    borderColor: "#c7d2fe",
    borderRadius: 16,
    borderWidth: 1,
    left: 0,
    minWidth: 178,
    padding: 8,
    position: "absolute",
    top: 52,
    zIndex: 30,
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
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
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
    borderWidth: 1,
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
    backgroundColor: colors.magenta,
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
    backgroundColor: "#111827",
    borderColor: colors.cyan,
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
    backgroundColor: colors.magenta,
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
    zIndex: 1,
  },
});
