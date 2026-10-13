export type ContactStatus = "active" | "unsubscribed" | "bounced" | "blocked";

export type ContactTag = {
  id: number;
  userId?: number;
  tagName: string;
  tag_name?: string;
  color: string;
  contactCount?: number;
  contact_count?: number;
  createdAt?: string;
  created_at?: string;
};

export type ContactField = {
  id: number;
  fieldName: string;
  field_name?: string;
  fieldKey: string;
  field_key?: string;
  fieldType: "text" | "number" | "date" | "select";
  field_type?: "text" | "number" | "date" | "select";
  isRequired: boolean;
  is_required?: boolean;
  options?: string[];
  defaultValue?: string;
  default_value?: string;
};

export type Contact = {
  id: number;
  userId?: number;
  user_id?: number;
  email: string;
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  phone?: string | null;
  company?: string | null;
  city?: string | null;
  country?: string | null;
  emailStatus?: ContactStatus | string;
  email_status?: ContactStatus | string;
  source?: string | null;
  tags?: ContactTag[];
  customFields?: Record<string, unknown>;
  fields?: Record<string, unknown>;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type ContactFilterParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  tagId?: number;
  city?: string;
  userId?: number;
};
