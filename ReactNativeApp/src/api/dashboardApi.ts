import { apiRequest } from "./http";
import type { AuthSession, DashboardOverview } from "../types";

export const dashboardApi = {
  overview(session: AuthSession) {
    return apiRequest<DashboardOverview>(session.baseUrl, "/dashboard/overview", {
      token: session.token,
    });
  },
};
