import { apiRequest } from "./http";

export const dashboardApi = {
  overview(token: string) {
    return apiRequest<{
      stats: Record<string, number>;
      recentActivity: Array<Record<string, unknown>>;
      performance: {
        openRate: number;
        clickRate: number;
      };
    }>("/dashboard/overview", { token });
  },
};
