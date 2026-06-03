import { apiRequest } from "./http";
import type { AuthSession, DashboardOverview } from "../types";

export const dashboardApi = {
  overview(session: AuthSession, query?: { userId?: number }) {
    return apiRequest<DashboardOverview>(session.baseUrl, "/dashboard/overview", {
      token: session.token,
    }, query);
  },
};
