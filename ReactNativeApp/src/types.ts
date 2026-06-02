export type AuthUser = {
  id?: number | string;
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLogin?: string | null;
};

export type AuthSession = {
  token: string;
  name: string;
  email: string;
  baseUrl: string;
};

export type AuthPayload = {
  token: string;
  user?: AuthUser;
};

export type DashboardOverview = {
  stats?: {
    total_sent?: number;
    total_campaigns?: number;
    active_contacts?: number;
    active_accounts?: number;
  };
  recentActivity?: Array<{
    status?: string;
    email?: string;
  }>;
};

export type EmailAccount = {
  id: number;
  email_address?: string;
  provider?: string;
  is_default?: boolean;
};

export type EmailTemplate = {
  id: number;
  template_name?: string;
  subject?: string;
  content_html?: string;
  content_text?: string;
  preview_text?: string;
  is_active?: boolean;
  user_id?: number;
  owner_name?: string;
  owner_email?: string;
  created_at?: string;
  updated_at?: string;
};

export type TemplateLayoutNode = {
  id?: string;
  type: string;
  props?: Record<string, string | number>;
  children?: TemplateLayoutNode[];
};

export type TemplateLayout = {
  schemaVersion?: number;
  root?: TemplateLayoutNode;
  blocks?: TemplateLayoutNode[];
};

export type TemplateDesignerDraft = {
  template?: EmailTemplate;
  layout?: TemplateLayout | null;
  editorState?: Record<string, unknown> | null;
  renderedHtml?: string | null;
  renderedText?: string | null;
  updatedAt?: string | null;
};

export type ContactTag = {
  id: number;
  tag_name?: string;
  color?: string;
  contact_count?: number;
};

export type Campaign = {
  id: number;
  campaign_name?: string;
  status?: string;
  total_recipients?: number;
  sent_count?: number;
  open_count?: number;
  click_count?: number;
};

export type Contact = {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  tags?: ContactTag[];
};

export type Paginated<T> = {
  items?: T[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type SendEmailResult = {
  mode?: string;
  requestedCount?: number;
  sentCount?: number;
  failedCount?: number;
  results?: Array<Record<string, unknown>>;
};
