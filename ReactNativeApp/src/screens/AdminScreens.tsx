import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { adminApi, type AdminUserRow } from "../api/adminApi";
import { campaignsApi } from "../api/campaignsApi";
import { contactsApi } from "../api/contactsApi";
import { dashboardApi } from "../api/dashboardApi";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { templatesApi } from "../api/templatesApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { ChoiceList } from "../components/ChoiceList";
import { TextField } from "../components/TextField";
import { colors, radii } from "../theme";
import type { AuthSession, Campaign, Contact, EmailAccount, EmailTemplate } from "../types";
import { formatNumber, titleCase } from "../utils/format";

type AdminScreenProps = {
  session: AuthSession;
};

type DataRow = Record<string, any>;

const SETTINGS_KEY = "admin.settings.v1";
const defaultSettings = {
  defaultRole: "user",
  adminDefaultScope: "all",
  requireConfirmDangerActions: true,
  showOwnersToAdmins: true,
};

function formatDate(value?: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function ownerLabel(item: DataRow) {
  const owner = item.owner && typeof item.owner === "object" ? item.owner : null;
  const name = owner?.name || item.owner_name || item.user_name;
  const email = owner?.email || item.owner_email || item.user_email;
  const id = owner?.id || item.owner_id || item.user_id || item.userId;
  if (name && email) return `${name} (${email})`;
  if (name || email) return String(name || email);
  if (id) return `User #${id}`;
  return "No owner";
}

function roleOf(user: AdminUserRow) {
  return String(user.role || "").toLowerCase() === "admin" ? "admin" : "user";
}

function isActiveUser(user: AdminUserRow) {
  if (typeof user.isActive === "boolean") return user.isActive;
  if (typeof user.is_active === "boolean") return user.is_active;
  return true;
}

function AdminHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>Administration</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{formatNumber(value as number)}</Text>
    </Card>
  );
}

export function AdminDashboardScreen({ session }: AdminScreenProps) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const allUsers = await adminApi.listUsers(session);
      const query = selectedUserId ? { userId: selectedUserId } : undefined;
      const [overview, contactPage, templatePage, campaignPage, accountRows] = await Promise.all([
        dashboardApi.overview(session, query),
        contactsApi.list(session, { pageSize: 5, userId: selectedUserId || undefined }),
        templatesApi.list(session, { pageSize: 5, userId: selectedUserId || undefined }),
        campaignsApi.list(session, { pageSize: 5, userId: selectedUserId || undefined }),
        emailAccountsApi.list(session, query),
      ]);
      setUsers(allUsers);
      setStats((overview.stats || {}) as Record<string, number>);
      setContacts(contactPage.items || []);
      setTemplates(templatePage.items || []);
      setCampaigns(campaignPage.items || []);
      setAccounts(accountRows || []);
    } catch (error) {
      Alert.alert("Admin failed", error instanceof Error ? error.message : "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, session]);

  useEffect(() => {
    void load();
  }, [load]);

  async function pauseCampaign(campaign: Campaign) {
    try {
      if (campaign.status === "paused") await adminApi.resumeCampaign(session, campaign.id);
      else await adminApi.pauseCampaign(session, campaign.id);
      setNotice(campaign.status === "paused" ? "Campaign continued." : "Campaign paused.");
      await load();
    } catch (error) {
      Alert.alert("Campaign failed", error instanceof Error ? error.message : "Request failed");
    }
  }

  async function deleteCampaign(campaign: Campaign) {
    Alert.alert("Delete campaign", `Delete ${campaign.campaign_name || campaign.id}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await adminApi.deleteCampaign(session, campaign.id);
          await load();
        },
      },
    ]);
  }

  async function deleteTemplate(template: EmailTemplate) {
    Alert.alert("Delete template", `Delete ${template.template_name || template.id}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await adminApi.deleteTemplate(session, template.id);
          await load();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <AdminHeader title="Admin Dashboard" subtitle="Uses the normal list APIs. Admin tokens receive system-wide data, optionally filtered by user." />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Card style={styles.filterCard}>
        <Text style={styles.fieldLabel}>Scope</Text>
        <ChoiceList
          emptyText="No users"
          getId={(item) => item.id}
          getLabel={(item) => item.name || item.email || `User #${item.id}`}
          items={[{ id: 0, name: "All users" }, ...users]}
          onSelect={(item) => setSelectedUserId(item.id ? item.id : null)}
          selectedId={selectedUserId || 0}
        />
      </Card>
      <View style={styles.stats}>
        <StatCard label="Contacts" value={stats.active_contacts ?? contacts.length} />
        <StatCard label="Templates" value={stats.active_templates ?? templates.length} />
        <StatCard label="Campaigns" value={stats.total_campaigns ?? campaigns.length} />
        <StatCard label="Email Accounts" value={stats.total_accounts ?? accounts.length} />
      </View>
      <AdminPanel title="Campaigns">
        {campaigns.length ? campaigns.map((item) => (
          <AdminRow key={item.id} title={item.campaign_name || `Campaign #${item.id}`} subtitle={`${ownerLabel(item as DataRow)} - ${item.status || "draft"}`}>
            <AppButton onPress={() => void pauseCampaign(item)} style={styles.rowButton} title={item.status === "paused" ? "Continue" : "Pause"} variant="secondary" />
            <AppButton onPress={() => void deleteCampaign(item)} style={styles.rowButton} title="Delete" variant="danger" />
          </AdminRow>
        )) : <Text style={styles.empty}>No campaigns in this scope.</Text>}
      </AdminPanel>
      <AdminPanel title="Templates">
        {templates.length ? templates.map((item) => (
          <AdminRow key={item.id} title={item.template_name || `Template #${item.id}`} subtitle={`${ownerLabel(item as DataRow)} - ${item.is_active === false ? "Inactive" : "Active"}`}>
            <AppButton onPress={() => void deleteTemplate(item)} style={styles.rowButton} title="Delete" variant="danger" />
          </AdminRow>
        )) : <Text style={styles.empty}>No templates in this scope.</Text>}
      </AdminPanel>
      <AdminPanel title="Contacts">
        {contacts.length ? contacts.map((item, index) => (
          <AdminRow key={item.id || index} title={item.email || `Contact #${item.id}`} subtitle={ownerLabel(item as DataRow)} />
        )) : <Text style={styles.empty}>No contacts in this scope.</Text>}
      </AdminPanel>
      <AdminPanel title="Email Accounts">
        {accounts.length ? accounts.map((item) => (
          <AdminRow key={item.id} title={item.display_name || item.email_address || `Account #${item.id}`} subtitle={ownerLabel(item as DataRow)} />
        )) : <Text style={styles.empty}>No email accounts in this scope.</Text>}
      </AdminPanel>
    </ScrollView>
  );
}

export function AdminUsersScreen({ session }: AdminScreenProps) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [savingId, setSavingId] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await adminApi.listUsers(session));
    } catch (error) {
      Alert.alert("Users failed", error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const active = isActiveUser(user);
      return (
        (!query || String(user.name || "").toLowerCase().includes(query) || String(user.email || "").toLowerCase().includes(query)) &&
        (!roleFilter || roleOf(user) === roleFilter) &&
        (!statusFilter || (statusFilter === "active" ? active : !active))
      );
    });
  }, [roleFilter, search, statusFilter, users]);

  async function changeRole(user: AdminUserRow, role: "admin" | "user") {
    setSavingId(`role:${user.id}`);
    try {
      await adminApi.updateUserRole(session, user.id, role);
      await load();
    } catch (error) {
      Alert.alert("Role failed", error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setSavingId("");
    }
  }

  async function toggleStatus(user: AdminUserRow) {
    setSavingId(`status:${user.id}`);
    try {
      await adminApi.updateUserStatus(session, user.id, !isActiveUser(user));
      await load();
    } catch (error) {
      Alert.alert("Status failed", error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setSavingId("");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <View style={styles.headerRow}>
        <AdminHeader title="User Management" subtitle="Change roles and lock or unlock user accounts." />
        <AppButton onPress={load} style={styles.refreshButton} title="Refresh" variant="secondary" />
      </View>
      <View style={styles.stats}>
        <StatCard label="Total users" value={users.length} />
        <StatCard label="Admins" value={users.filter((user) => roleOf(user) === "admin").length} />
        <StatCard label="Active" value={users.filter(isActiveUser).length} />
      </View>
      <TextField label="Search users" onChangeText={setSearch} placeholder="Search users..." value={search} />
      <ChoiceList emptyText="No roles" getId={(item) => item.id} getLabel={(item) => item.label} items={[{ id: "", label: "All roles" }, { id: "admin", label: "Admin" }, { id: "user", label: "User" }]} onSelect={(item) => setRoleFilter(item.id)} selectedId={roleFilter} />
      <ChoiceList emptyText="No statuses" getId={(item) => item.id} getLabel={(item) => item.label} items={[{ id: "", label: "All statuses" }, { id: "active", label: "Active" }, { id: "disabled", label: "Disabled" }]} onSelect={(item) => setStatusFilter(item.id)} selectedId={statusFilter} />
      <Card style={styles.tableCard}>
        {filteredUsers.length ? filteredUsers.map((user) => (
          <View key={user.id} style={styles.userRow}>
            <View style={styles.userMain}>
              <Text style={styles.rowTitle}>{user.name || "Unnamed user"}</Text>
              <Text style={styles.rowSubtitle}>{user.email || "-"}</Text>
            </View>
            <ChoiceList emptyText="No roles" getId={(item) => item.id} getLabel={(item) => item.label} items={[{ id: "user", label: "User" }, { id: "admin", label: "Admin" }]} onSelect={(item) => void changeRole(user, item.id as "admin" | "user")} selectedId={roleOf(user)} />
            <Text style={[styles.pill, !isActiveUser(user) && styles.pillOff]}>{isActiveUser(user) ? "Active" : "Disabled"}</Text>
            <AppButton loading={savingId === `status:${user.id}`} onPress={() => void toggleStatus(user)} style={styles.rowButton} title={isActiveUser(user) ? "Lock" : "Unlock"} variant="secondary" />
          </View>
        )) : <Text style={styles.empty}>No users found.</Text>}
      </Card>
    </ScrollView>
  );
}

export function AdminAuditLogsScreen({ session }: AdminScreenProps) {
  const [logs, setLogs] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const overview = await dashboardApi.overview(session);
      setLogs((overview.recentActivity || []) as DataRow[]);
    } catch (error) {
      Alert.alert("Audit logs failed", error instanceof Error ? error.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView contentContainerStyle={styles.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <View style={styles.headerRow}>
        <AdminHeader title="Audit Logs" subtitle="Displays backend recent activity from the role-aware dashboard endpoint." />
        <AppButton onPress={load} style={styles.refreshButton} title="Refresh" variant="secondary" />
      </View>
      <Card style={styles.logCard}>
        {logs.length ? logs.map((log, index) => (
          <View key={String(log.id || log.sent_time || log.created_at || index)} style={styles.logRow}>
            <View style={styles.logMarker} />
            <View style={styles.logBody}>
              <Text style={styles.rowTitle}>{log.email || log.campaign_name || log.template_name || log.action || log.type || "Activity"}</Text>
              <Text style={styles.rowSubtitle}>{ownerLabel(log)} - {formatDate(log.sent_time || log.created_at || log.updated_at)}</Text>
              <Text style={styles.logMessage}>{log.message || log.status || log.event || "No message"}</Text>
            </View>
          </View>
        )) : <Text style={styles.empty}>No activity found.</Text>}
      </Card>
    </ScrollView>
  );
}

export function AdminSettingsScreen() {
  const [settings, setSettings] = useState(defaultSettings);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) });
      })
      .catch(() => setSettings(defaultSettings));
  }, []);

  async function saveSettings() {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setNotice("Settings saved on this device.");
  }

  async function resetSettings() {
    await AsyncStorage.removeItem(SETTINGS_KEY);
    setSettings(defaultSettings);
    setNotice("Settings reset.");
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <AdminHeader title="System Settings" subtitle="Frontend settings for role-aware screens. Wire these to a backend settings API when available." />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Workspace Rules</Text>
        <Text style={styles.fieldLabel}>Default new account role</Text>
        <ChoiceList emptyText="No roles" getId={(item) => item.id} getLabel={(item) => item.label} items={[{ id: "user", label: "User" }, { id: "admin", label: "Admin" }]} onSelect={(item) => setSettings({ ...settings, defaultRole: item.id })} selectedId={settings.defaultRole} />
        <Text style={styles.fieldLabel}>Admin list default scope</Text>
        <ChoiceList emptyText="No scopes" getId={(item) => item.id} getLabel={(item) => item.label} items={[{ id: "all", label: "All users" }, { id: "self", label: "Current admin only" }]} onSelect={(item) => setSettings({ ...settings, adminDefaultScope: item.id })} selectedId={settings.adminDefaultScope} />
        <ToggleRow label="Require confirmation for admin delete/pause actions" value={settings.requireConfirmDangerActions} onValueChange={(value) => setSettings({ ...settings, requireConfirmDangerActions: value })} />
        <ToggleRow label="Show owner columns on admin lists" value={settings.showOwnersToAdmins} onValueChange={(value) => setSettings({ ...settings, showOwnersToAdmins: value })} />
        <View style={styles.actions}>
          <AppButton onPress={() => void resetSettings()} style={styles.rowButton} title="Reset" variant="secondary" />
          <AppButton onPress={() => void saveSettings()} style={styles.rowButton} title="Save Settings" />
        </View>
      </Card>
      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Role Policy</Text>
        <Policy title="User" text="Uses normal routes and receives only owned data from the backend." />
        <Policy title="Admin" text="Uses normal list APIs for system data and /admin APIs only for admin actions." />
        <Policy title="Dangerous actions" text="Role changes, user lock/unlock, cross-owner template delete, and campaign pause/delete." />
      </Card>
    </ScrollView>
  );
}

function AdminPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card style={styles.panel}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </Card>
  );
}

function AdminRow({ children, subtitle, title }: { children?: ReactNode; subtitle: string; title: string }) {
  return (
    <View style={styles.adminRow}>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

function ToggleRow({ label, onValueChange, value }: { label: string; onValueChange: (value: boolean) => void; value: boolean }) {
  return (
    <View style={styles.toggleRow}>
      <Switch onValueChange={onValueChange} value={value} />
      <Text style={styles.toggleText}>{label}</Text>
    </View>
  );
}

function Policy({ text, title }: { text: string; title: string }) {
  return (
    <View style={styles.policy}>
      <Text style={styles.policyTitle}>{title}</Text>
      <Text style={styles.subtitle}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    padding: 16,
    paddingBottom: 28,
  },
  hero: {
    gap: 6,
  },
  headerRow: {
    gap: 10,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  notice: {
    backgroundColor: colors.primarySoft,
    borderColor: "#c7d2fe",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    padding: 12,
  },
  filterCard: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  stats: {
    gap: 12,
  },
  statCard: {
    gap: 10,
    minHeight: 86,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  statValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  panel: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  adminRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 12,
  },
  rowMain: {
    gap: 4,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  rowSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rowButton: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  refreshButton: {
    alignSelf: "flex-start",
    minHeight: 42,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  tableCard: {
    gap: 10,
  },
  userRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 10,
    paddingVertical: 12,
  },
  userMain: {
    gap: 3,
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    borderRadius: radii.pill,
    color: "#166534",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillOff: {
    backgroundColor: "#e2e8f0",
    color: colors.muted,
  },
  logCard: {
    gap: 12,
  },
  logRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
  },
  logMarker: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    width: 10,
  },
  logBody: {
    flex: 1,
    gap: 4,
  },
  logMessage: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  settingsCard: {
    gap: 14,
  },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  toggleText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  policy: {
    gap: 4,
  },
  policyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
});
