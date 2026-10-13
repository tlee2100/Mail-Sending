export type DashboardStats = {
  total_accounts: number;
  active_accounts: number;
  active_contacts: number;
  active_templates: number;
  total_campaigns: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
};

export type DashboardPerformance = {
  openRate: number;
  clickRate: number;
};

export type ActivityLog = {
  id: string | number;
  email?: string;
  status?: string;
  message?: string;
  sent_time?: string;
  created_at?: string;
  type?: string;
  [key: string]: unknown;
};

export type DashboardOverviewResponse = {
  stats: DashboardStats;
  performance: DashboardPerformance;
  recentActivity: ActivityLog[];
};
