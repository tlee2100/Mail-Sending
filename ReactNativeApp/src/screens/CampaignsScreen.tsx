import { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { campaignsApi } from "../api/campaignsApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { Notice } from "../components/Notice";
import { colors, radii } from "../theme";
import type { AuthSession, Campaign } from "../types";
import { formatNumber, titleCase } from "../utils/format";

type CampaignsScreenProps = {
  session: AuthSession;
};

export function CampaignsScreen({ session }: CampaignsScreenProps) {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await campaignsApi.list(session, 50);
      setItems(page.items || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Campaigns failed");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  async function action(campaign: Campaign) {
    const id = campaign.id;
    const status = campaign.status || "draft";
    setBusyId(id);
    try {
      if (status === "running" || status === "sending") {
        await campaignsApi.pause(session, id);
      } else {
        await campaignsApi.start(session, id);
      }
      await load();
    } catch (nextError) {
      Alert.alert("Campaign failed", nextError instanceof Error ? nextError.message : "Request failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      {error ? <Notice message={error} tone="error" /> : null}
      {items.length ? (
        items.map((campaign) => (
          <CampaignCard
            campaign={campaign}
            key={campaign.id}
            loading={busyId === campaign.id}
            onAction={() => action(campaign)}
          />
        ))
      ) : (
        <Card>
          <Text style={styles.empty}>No campaigns yet</Text>
        </Card>
      )}
    </ScrollView>
  );
}

function CampaignCard({
  campaign,
  loading,
  onAction,
}: {
  campaign: Campaign;
  loading: boolean;
  onAction: () => void;
}) {
  const status = campaign.status || "draft";
  const completed = status === "completed" || status === "failed";
  const shouldPause = status === "running" || status === "sending";

  return (
    <Card>
      <View style={styles.cardHead}>
        <View style={styles.cardText}>
          <Text style={styles.name}>{campaign.campaign_name || "Campaign"}</Text>
          <Text style={styles.meta}>
            {titleCase(status)} - {formatNumber(campaign.total_recipients)} recipients
          </Text>
        </View>
        <Text style={[styles.badge, shouldPause && styles.liveBadge]}>{titleCase(status)}</Text>
      </View>

      <View style={styles.stats}>
        <SmallStat label="Sent" value={campaign.sent_count} />
        <SmallStat label="Open" value={campaign.open_count} />
        <SmallStat label="Click" value={campaign.click_count} />
      </View>

      <AppButton
        disabled={completed}
        loading={loading}
        onPress={onAction}
        title={shouldPause ? "Pause" : "Start"}
        variant={shouldPause ? "secondary" : "primary"}
      />
    </Card>
  );
}

function SmallStat({ label, value }: { label: string; value?: number }) {
  return (
    <View style={styles.smallStat}>
      <Text style={styles.smallStatValue}>{formatNumber(value)}</Text>
      <Text style={styles.smallStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 12,
    padding: 16,
  },
  cardHead: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  cardText: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  badge: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.pill,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveBadge: {
    backgroundColor: "#dcfce7",
    color: colors.success,
  },
  stats: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 14,
  },
  smallStat: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.md,
    flex: 1,
    padding: 10,
  },
  smallStatValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  smallStatLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
});
