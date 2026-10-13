export type DesignerBlockType =
  | "columns"
  | "featureCard"
  | "button"
  | "heading"
  | "text"
  | "divider"
  | "spacer"
  | "image"
  | "card"
  | "productGrid"
  | "countdownTimer"
  | "carousel";

export type DesignerBlock = {
  id?: string;
  type: DesignerBlockType | string;
  props?: Record<string, unknown>;
  children?: DesignerBlock[];
  [key: string]: unknown;
};

export type DesignerLayout = {
  schemaVersion: number;
  blocks: DesignerBlock[];
  [key: string]: unknown;
};

export type Template = {
  id: number;
  userId?: number;
  user_id?: number;
  templateName: string;
  template_name?: string;
  subject?: string;
  category?: string;
  description?: string;
  layout?: DesignerLayout;
  layout_json?: DesignerLayout;
  renderedHtml?: string;
  rendered_html?: string;
  renderedText?: string;
  rendered_text?: string;
  isShared?: boolean;
  is_shared?: boolean;
  useCount?: number;
  use_count?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  [key: string]: unknown;
};
