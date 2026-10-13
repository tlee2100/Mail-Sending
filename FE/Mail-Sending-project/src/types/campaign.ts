export type CampaignStatus =
  "draft" | "scheduled" | "queued" | "sending" | "paused" | "completed" | "failed" | "sent";

export type CampaignType = "regular" | "ab_test" | "automated";

export type Campaign = {
  id: number;
  userId?: number;
  user_id?: number;
  campaignName: string;
  campaign_name?: string;
  templateId?: number;
  template_id?: number;
  templateName?: string;
  template_name?: string;
  emailAccountId?: number;
  email_account_id?: number;
  senderEmail?: string;
  sender_email?: string;
  campaignType?: CampaignType;
  campaign_type?: CampaignType;
  status: CampaignStatus;
  scheduledTime?: string | null;
  scheduled_time?: string | null;
  totalRecipients?: number;
  total_recipients?: number;
  sentCount?: number;
  sent_count?: number;
  openedCount?: number;
  opened_count?: number;
  clickedCount?: number;
  clicked_count?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type CampaignRecipient = {
  id?: number;
  campaignId?: number;
  campaign_id?: number;
  contactId?: number;
  contact_id?: number;
  email: string;
  name?: string;
  status:
    "queued" | "sending" | "delivered" | "opened" | "clicked" | "bounced" | "failed" | "paused";
  lastEventAt?: string;
  last_event_at?: string;
  sentAt?: string;
  sent_at?: string;
  openedAt?: string;
  opened_at?: string;
  clickedAt?: string;
  clicked_at?: string;
  errorMessage?: string;
  error_message?: string;
  [key: string]: unknown;
};

export type CampaignFilterParams = {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  userId?: number;
};
