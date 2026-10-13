import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { campaignsApi } from "../api/campaignsApi";
import type { Campaign, CampaignFilterParams } from "../types/campaign";
import type { PaginationMeta } from "../types/api";

export const useCampaignsStore = defineStore("campaigns", () => {
  const campaigns = ref<Campaign[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const pagination = ref<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  const totalRecipients = computed(() =>
    campaigns.value.reduce(
      (sum, item) => sum + Number(item.total_recipients || item.totalRecipients || 0),
      0,
    ),
  );

  const sentCampaignsCount = computed(
    () =>
      campaigns.value.filter((item) => item.status === "sent" || item.status === "completed")
        .length,
  );

  async function fetchCampaigns(query?: CampaignFilterParams) {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await campaignsApi.list("", query);
      campaigns.value = (res.data.items || []) as Campaign[];
      if (res.data.pagination) {
        pagination.value = res.data.pagination;
      }
      return campaigns.value;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load campaigns";
      error.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function startCampaign(id: string | number) {
    const res = await campaignsApi.start("", id);
    const found = campaigns.value.find((c) => String(c.id) === String(id));
    if (found) {
      found.status = "sending";
    }
    return res.data;
  }

  async function pauseCampaign(id: string | number) {
    const res = await campaignsApi.pause("", id);
    const found = campaigns.value.find((c) => String(c.id) === String(id));
    if (found) {
      found.status = "paused";
    }
    return res.data;
  }

  async function resumeCampaign(id: string | number) {
    return startCampaign(id);
  }

  async function deleteCampaign(id: string | number) {
    await campaignsApi.delete("", id);
    campaigns.value = campaigns.value.filter((c) => String(c.id) !== String(id));
    pagination.value.total = Math.max(0, pagination.value.total - 1);
  }

  return {
    campaigns,
    isLoading,
    error,
    pagination,
    totalRecipients,
    sentCampaignsCount,
    fetchCampaigns,
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    deleteCampaign,
  };
});
