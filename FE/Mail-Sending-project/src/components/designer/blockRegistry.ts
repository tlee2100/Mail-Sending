import type { DesignerBlockType } from "../../types/template";

export type BlockCategory = "structure" | "content" | "ecommerce" | "interactive";

export type BlockDefinition = {
  type: DesignerBlockType | string;
  label: string;
  shortBadge: string;
  category: BlockCategory;
  defaultProps: () => Record<string, unknown>;
  icon?: string;
  description?: string;
};

export const BLOCK_DEFINITIONS: Record<string, BlockDefinition> = {
  heading: {
    type: "heading",
    label: "Heading",
    shortBadge: "H",
    category: "content",
    defaultProps: () => ({
      text: "Headline Title",
      level: 2,
      align: "center",
      color: "#0f172a",
    }),
  },
  text: {
    type: "text",
    label: "Paragraph",
    shortBadge: "T",
    category: "content",
    defaultProps: () => ({
      content: "Write your email message here.",
      align: "left",
      color: "#334155",
    }),
  },
  button: {
    type: "button",
    label: "Action Button",
    shortBadge: "BTN",
    category: "content",
    defaultProps: () => ({
      label: "Click Here",
      url: "https://example.com",
      align: "center",
      bgColor: "#2563eb",
      textColor: "#ffffff",
      borderRadius: 8,
    }),
  },
  image: {
    type: "image",
    label: "Image",
    shortBadge: "IMG",
    category: "content",
    defaultProps: () => ({
      url: "",
      alt: "Image banner",
      align: "center",
      width: 600,
    }),
  },
  divider: {
    type: "divider",
    label: "Divider Line",
    shortBadge: "HR",
    category: "structure",
    defaultProps: () => ({
      color: "#e2e8f0",
      thickness: 1,
      margin: 24,
    }),
  },
  spacer: {
    type: "spacer",
    label: "Spacer",
    shortBadge: "SP",
    category: "structure",
    defaultProps: () => ({
      height: 24,
    }),
  },
  columns: {
    type: "columns",
    label: "Columns",
    shortBadge: "COL",
    category: "structure",
    defaultProps: () => ({
      columns: 2,
      gap: 24,
    }),
  },
  featureCard: {
    type: "featureCard",
    label: "Feature Card",
    shortBadge: "CARD",
    category: "content",
    defaultProps: () => ({
      title: "Feature Title",
      description: "Feature description goes here.",
      imageUrl: "",
      linkLabel: "Learn more >",
      linkUrl: "https://example.com",
    }),
  },
  // Future extensible blocks:
  productGrid: {
    type: "productGrid",
    label: "Product Grid",
    shortBadge: "GRID",
    category: "ecommerce",
    defaultProps: () => ({
      itemsPerRow: 2,
      products: [],
    }),
  },
  countdownTimer: {
    type: "countdownTimer",
    label: "Countdown Timer",
    shortBadge: "TIME",
    category: "interactive",
    defaultProps: () => ({
      targetDate: "",
      theme: "dark",
    }),
  },
  carousel: {
    type: "carousel",
    label: "Carousel Slider",
    shortBadge: "CAR",
    category: "interactive",
    defaultProps: () => ({
      slides: [],
    }),
  },
};

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS[type];
}

export function registerCustomBlock(def: BlockDefinition) {
  BLOCK_DEFINITIONS[def.type] = def;
}
