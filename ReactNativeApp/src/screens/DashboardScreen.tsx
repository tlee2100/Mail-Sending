import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { campaignsApi } from "../api/campaignsApi";
import { dashboardApi } from "../api/dashboardApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { Notice } from "../components/Notice";
import { colors, radii } from "../theme";
import type { AuthSession, Campaign, DashboardOverview } from "../types";
import { formatNumber, titleCase } from "../utils/format";

type DashboardScreenProps = {
  session: AuthSession;
};

export function DashboardScreen({ session }: DashboardScreenProps) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextOverview, campaignPage] = await Promise.all([
        dashboardApi.overview(session),
        campaignsApi.list(session, 3),
      ]);
      setOverview(nextOverview);
      setCampaigns(campaignPage.items || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Dashboard failed");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = overview?.stats || {};

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      {error ? (
        <Card>
          <Notice message={error} tone="error" />
          <AppButton onPress={load} style={styles.retry} title="Retry" variant="secondary" />
        </Card>
      ) : null}

      <View style={styles.metrics}>
        <MetricCard label="Sent" value={formatNumber(stats.total_sent)} />
        <MetricCard label="Campaigns" value={formatNumber(stats.total_campaigns)} />
        <MetricCard label="Contacts" value={formatNumber(stats.active_contacts)} />
        <MetricCard label="SMTP live" value={formatNumber(stats.active_accounts)} />
      </View>

      <Card>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Active campaigns</Text>
          <Text style={styles.healthy}>Healthy</Text>
        </View>
        {campaigns.length ? (
          campaigns.map((campaign) => <CampaignRow key={campaign.id} campaign={campaign} />)
        ) : (
          <Text style={styles.empty}>No campaigns yet</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Recent alerts</Text>
        {overview?.recentActivity?.length ? (
          overview.recentActivity.slice(0, 4).map((item, index) => (
            <Text key={`${item.email}-${index}`} style={styles.alertLine}>
              {titleCase(item.status || "log")} - {item.email || "unknown"}
            </Text>
          ))
        ) : (
          <Text style={styles.empty}>No recent email logs yet</Text>
        )}
      </Card>
    </ScrollView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metric}>
      <View style={styles.metricAccent} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </Card>
  );
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const status = campaign.status || "draft";
  const dotColor = status === "scheduled" ? colors.warning : colors.success;

  return (
    <View style={styles.campaignRow}>
      <View style={styles.campaignText}>
        <Text style={styles.campaignName}>{campaign.campaign_name || "Campaign"}</Text>
        <Text style={styles.campaignMeta}>{formatNumber(campaign.total_recipients)} recipients</Text>
      </View>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 14,
    padding: 16,
  },
  retry: {
    marginTop: 12,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metric: {
    backgroundColor: "#ffffff",
    borderColor: "#c7d2fe",
    minHeight: 110,
    position: "relative",
    width: "47.5%",
  },
  metricAccent: {
    backgroundColor: colors.cyan,
    borderRadius: radii.pill,
    height: 8,
    position: "absolute",
    right: 14,
    top: 14,
    width: 34,
  },
  metricLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 18,
  },
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  healthy: {
    backgroundColor: "#dcfce7",
    borderRadius: radii.pill,
    color: colors.success,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  campaignRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    paddingVertical: 12,
  },
  campaignText: {
    flex: 1,
  },
  campaignName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  campaignMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  dot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  alertLine: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    color: colors.muted,
    fontSize: 13,
    paddingVertical: 10,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    paddingTop: 10,
  },
});
