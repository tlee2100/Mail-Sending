import type { TemplateLayout, TemplateLayoutNode } from "../types";

export type DesignerBlockType =
  | "text"
  | "button"
  | "image"
  | "imageCard"
  | "columns"
  | "qrcode"
  | "html"
  | "divider";

export const designerPalette: Array<{ type: DesignerBlockType; label: string; short: string }> = [
  { type: "text", label: "Text", short: "Tx" },
  { type: "button", label: "Button", short: "Bt" },
  { type: "image", label: "Image", short: "Im" },
  { type: "imageCard", label: "Image Card", short: "IC" },
  { type: "columns", label: "Columns", short: "Co" },
  { type: "qrcode", label: "QR Code", short: "QR" },
  { type: "html", label: "HTML", short: "HT" },
  { type: "divider", label: "Divider", short: "Dv" },
];

export const mergeTags = ["{{name}}", "{{email}}", "{{phone}}", "{{company}}", "{{unsubscribe_url}}"];

export type SampleKey =
  | "aiShowcase"
  | "welcome"
  | "newsletter"
  | "productLaunch"
  | "eventInvite"
  | "promoSale"
  | "reengagement"
  | "feedback"
  | "invoice";

export const sampleOptions: Array<{ key: SampleKey; label: string }> = [
  { key: "aiShowcase", label: "AI Product Showcase" },
  { key: "welcome", label: "Welcome Email" },
  { key: "newsletter", label: "Monthly Newsletter" },
  { key: "productLaunch", label: "Product Launch" },
  { key: "eventInvite", label: "Event Invitation" },
  { key: "promoSale", label: "Promotion Sale" },
  { key: "reengagement", label: "Re-engagement" },
  { key: "feedback", label: "Feedback Request" },
  { key: "invoice", label: "Invoice Follow-up" },
];

function sampleBlock(type: DesignerBlockType, props: Record<string, string | number>): TemplateLayoutNode {
  return {
    ...createBlock(type),
    props,
  };
}

export function createBlock(type: DesignerBlockType): TemplateLayoutNode {
  const id = `blk_${type}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;

  if (type === "text") {
    return {
      id,
      type,
      props: { content: "New text block", fontSize: "16", color: "#334155", align: "left" },
    };
  }

  if (type === "button") {
    return {
      id,
      type,
      props: {
        label: "Button",
        href: "https://example.com",
        backgroundColor: "#4f46e5",
        textColor: "#ffffff",
        borderRadius: "8",
        padding: "10px 16px",
      },
    };
  }

  if (type === "image") {
    return {
      id,
      type,
      props: {
        src: "https://dummyimage.com/640x220/e2e8f0/334155&text=Banner",
        alt: "Banner image",
        width: "600",
      },
    };
  }

  if (type === "imageCard") {
    return {
      id,
      type,
      props: {
        imageSrc: "https://dummyimage.com/640x260/e8f0fe/1967d2&text=Image+Card",
        imageAlt: "Card image",
        title: "Feature title",
        description: "Describe a product, article, event, or offer.",
        ctaLabel: "Learn more",
        ctaHref: "https://example.com",
        imageHeight: "220",
      },
    };
  }

  if (type === "columns") {
    return {
      id,
      type,
      props: { leftContent: "Left column text", rightContent: "Right column text", gap: "16", color: "#334155" },
    };
  }

  if (type === "qrcode") {
    return {
      id,
      type,
      props: {
        value: "https://example.com/{{email}}",
        title: "Scan to continue",
        caption: "Dynamic QR code rendered per recipient",
        size: "220",
      },
    };
  }

  if (type === "html") {
    return {
      id,
      type,
      props: {
        html: '<p style="margin:0 0 12px;color:#334155;line-height:1.5;">Custom HTML block</p>',
      },
    };
  }

  return { id, type: "divider", props: {} };
}

export function defaultLayout(): TemplateLayout {
  return {
    schemaVersion: 1,
    root: {
      type: "section",
      children: [
        {
          ...createBlock("text"),
          props: {
            content: "Hi {{name}},\n\nWrite your message here.",
            fontSize: "18",
            color: "#0f172a",
            align: "left",
          },
        },
        createBlock("button"),
      ],
    },
  };
}

export function layoutToBlocks(layout?: TemplateLayout | null) {
  if (layout?.root?.children?.length) {
    return layout.root.children;
  }
  if (layout?.blocks?.length) {
    return layout.blocks;
  }
  return defaultLayout().root?.children || [];
}

export function blocksToLayout(blocks: TemplateLayoutNode[]): TemplateLayout {
  return {
    schemaVersion: 1,
    root: {
      type: "section",
      children: blocks,
    },
  };
}

export function sampleLayout(key: SampleKey): TemplateLayout {
  const layouts: Record<SampleKey, TemplateLayoutNode[]> = {
    aiShowcase: [
      sampleBlock("html", {
        html: '<div style="padding:22px;border-radius:18px;background:#111827;color:#fff;margin-bottom:18px;"><h1 style="margin:0 0 8px;">Meet the smarter workflow</h1><p style="margin:0;color:#dbeafe;">AI-assisted updates built for {{company}}.</p></div>',
      }),
      sampleBlock("imageCard", {
        imageSrc: "https://dummyimage.com/640x280/dbeafe/1d4ed8&text=AI+Showcase",
        imageAlt: "AI product showcase",
        title: "Work faster with intelligent email tools",
        description: "Turn customer context into useful campaigns, quick drafts, and cleaner follow-ups.",
        ctaLabel: "Explore features",
        ctaHref: "https://example.com/features",
        imageHeight: "230",
      }),
      sampleBlock("columns", {
        leftContent: "Personalized subject lines\nReusable template blocks",
        rightContent: "Mobile-ready previews\nCampaign-ready copy",
        gap: "14",
        color: "#334155",
      }),
      sampleBlock("button", {
        label: "Start building",
        href: "https://example.com/start",
        backgroundColor: "#4f46e5",
        textColor: "#ffffff",
        borderRadius: "10",
        padding: "12px 18px",
      }),
    ],
    welcome: [
      sampleBlock("text", {
        content: "Xin chao {{name}},\n\nWelcome to ChadMailer. Your account is ready and you can start managing contacts, templates, and campaigns.",
        fontSize: "18",
        color: "#0f172a",
        align: "left",
      }),
      sampleBlock("image", {
        src: "https://dummyimage.com/640x220/ecfeff/0e7490&text=Welcome",
        alt: "Welcome banner",
        width: "600",
      }),
      sampleBlock("button", {
        label: "Open dashboard",
        href: "https://example.com/dashboard",
        backgroundColor: "#2563eb",
        textColor: "#ffffff",
        borderRadius: "10",
        padding: "12px 18px",
      }),
    ],
    newsletter: [
      sampleBlock("text", {
        content: "Ban tin thang {{month}}\n\nXin chao {{name}}, duoi day la nhung cap nhat noi bat trong thang nay.",
        fontSize: "18",
        color: "#0f172a",
        align: "left",
      }),
      sampleBlock("divider", {}),
      sampleBlock("imageCard", {
        imageSrc: "https://dummyimage.com/640x260/e0f2fe/0369a1&text=Monthly+Update",
        imageAlt: "Monthly update",
        title: "Feature highlight",
        description: "Tom tat cac thay doi moi giup cong viec cua ban nhanh va gon hon.",
        ctaLabel: "Read more",
        ctaHref: "https://example.com/news",
        imageHeight: "220",
      }),
      sampleBlock("button", {
        label: "View all updates",
        href: "https://example.com/updates",
        backgroundColor: "#0891b2",
        textColor: "#ffffff",
        borderRadius: "10",
        padding: "12px 18px",
      }),
    ],
    productLaunch: [
      sampleBlock("text", {
        content: "Ra mat san pham moi\n\n{{first_name}}, trai nghiem moi da san sang cho ban dung thu hom nay.",
        fontSize: "20",
        color: "#111827",
        align: "left",
      }),
      sampleBlock("image", {
        src: "https://dummyimage.com/640x260/fef3c7/92400e&text=Product+Launch",
        alt: "Product launch",
        width: "600",
      }),
      sampleBlock("columns", {
        leftContent: "Thiet ke moi\nHieu nang tot hon",
        rightContent: "Thiet lap nhanh\nHo tro chien dich",
        gap: "14",
        color: "#334155",
      }),
      sampleBlock("button", {
        label: "See what is new",
        href: "https://example.com/launch",
        backgroundColor: "#f59e0b",
        textColor: "#111827",
        borderRadius: "10",
        padding: "12px 18px",
      }),
    ],
    eventInvite: [
      sampleBlock("text", {
        content: "Moi {{name}} tham gia su kien sap toi\n\nDang ky tham gia va nhan tai lieu doc quyen.",
        fontSize: "19",
        color: "#0f172a",
        align: "left",
      }),
      sampleBlock("qrcode", {
        value: "https://example.com/events/register?email={{email}}",
        title: "Scan de dang ky",
        caption: "Ma QR ca nhan hoa theo email nguoi nhan",
        size: "210",
      }),
      sampleBlock("button", {
        label: "Register now",
        href: "https://example.com/events/register",
        backgroundColor: "#7c3aed",
        textColor: "#ffffff",
        borderRadius: "10",
        padding: "12px 18px",
      }),
    ],
    promoSale: [
      sampleBlock("html", {
        html: '<div style="padding:20px;border-radius:16px;background:#fee2e2;color:#991b1b;margin-bottom:16px;text-align:center;"><strong>Limited offer</strong><h2 style="margin:8px 0 0;">Save 25% this week</h2></div>',
      }),
      sampleBlock("text", {
        content: "{{name}}, uu dai rieng cho ban dang cho trong gio hang.",
        fontSize: "17",
        color: "#334155",
        align: "center",
      }),
      sampleBlock("button", {
        label: "Claim offer",
        href: "https://example.com/promo",
        backgroundColor: "#dc2626",
        textColor: "#ffffff",
        borderRadius: "10",
        padding: "12px 18px",
      }),
    ],
    reengagement: [
      sampleBlock("text", {
        content: "{{first_name}}, chung toi co qua danh cho ban\n\nQuay lai va tiep tuc noi ban da dung lai.",
        fontSize: "18",
        color: "#0f172a",
        align: "left",
      }),
      sampleBlock("imageCard", {
        imageSrc: "https://dummyimage.com/640x240/f1f5f9/475569&text=Come+Back",
        imageAlt: "Come back",
        title: "Your workspace is waiting",
        description: "Nhung cong cu moi giup ban gui email nhanh va chinh xac hon.",
        ctaLabel: "Return now",
        ctaHref: "https://example.com/return",
        imageHeight: "210",
      }),
    ],
    feedback: [
      sampleBlock("text", {
        content: "Ban nghi sao ve trai nghiem vua roi?\n\n{{name}}, phan hoi cua ban giup chung toi cai thien san pham.",
        fontSize: "18",
        color: "#0f172a",
        align: "left",
      }),
      sampleBlock("columns", {
        leftContent: "Mat 2 phut de danh gia",
        rightContent: "Giup chung toi uu tien dung van de",
        gap: "14",
        color: "#334155",
      }),
      sampleBlock("button", {
        label: "Send feedback",
        href: "https://example.com/feedback?email={{email}}",
        backgroundColor: "#059669",
        textColor: "#ffffff",
        borderRadius: "10",
        padding: "12px 18px",
      }),
    ],
    invoice: [
      sampleBlock("text", {
        content: "Hoa don cua {{company}}\n\nXin chao {{name}}, hoa don moi cua ban da san sang.",
        fontSize: "18",
        color: "#0f172a",
        align: "left",
      }),
      sampleBlock("qrcode", {
        value: "https://example.com/billing/pay?email={{email}}",
        title: "Thanh toan nhanh",
        caption: "Quet ma de mo trang thanh toan",
        size: "210",
      }),
      sampleBlock("button", {
        label: "View invoice",
        href: "https://example.com/billing",
        backgroundColor: "#2563eb",
        textColor: "#ffffff",
        borderRadius: "10",
        padding: "12px 18px",
      }),
    ],
  };

  return blocksToLayout(layouts[key] || layouts.aiShowcase);
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function prop(node: TemplateLayoutNode, key: string, fallback = "") {
  return String(node.props?.[key] ?? fallback);
}

function blockHtml(node: TemplateLayoutNode): string {
  if (node.type === "text") {
    const content = escapeHtml(prop(node, "content")).replace(/\n/g, "<br />");
    return `<p style="margin:0 0 14px;color:${escapeHtml(prop(node, "color", "#334155"))};font-size:${escapeHtml(prop(node, "fontSize", "16"))}px;line-height:1.55;text-align:${escapeHtml(prop(node, "align", "left"))};">${content}</p>`;
  }

  if (node.type === "button") {
    return `<p style="margin:0 0 18px;text-align:center;"><a href="${escapeHtml(prop(node, "href", "#"))}" style="display:inline-block;padding:${escapeHtml(prop(node, "padding", "10px 16px"))};background:${escapeHtml(prop(node, "backgroundColor", "#4f46e5"))};color:${escapeHtml(prop(node, "textColor", "#ffffff"))};border-radius:${escapeHtml(prop(node, "borderRadius", "8"))}px;text-decoration:none;font-weight:700;">${escapeHtml(prop(node, "label", "Button"))}</a></p>`;
  }

  if (node.type === "image") {
    return `<img src="${escapeHtml(prop(node, "src"))}" alt="${escapeHtml(prop(node, "alt", "Image"))}" width="${escapeHtml(prop(node, "width", "600"))}" style="display:block;width:${escapeHtml(prop(node, "width", "600"))}px;max-width:100%;height:auto;border-radius:10px;margin:0 0 16px;" />`;
  }

  if (node.type === "imageCard") {
    return `<div style="margin:0 0 18px;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;"><img src="${escapeHtml(prop(node, "imageSrc"))}" alt="${escapeHtml(prop(node, "imageAlt", "Image card"))}" style="display:block;width:100%;height:${escapeHtml(prop(node, "imageHeight", "220"))}px;object-fit:cover;" /><div style="padding:18px;"><h3 style="margin:0 0 8px;color:#0f172a;">${escapeHtml(prop(node, "title", "Feature title"))}</h3><p style="margin:0 0 14px;color:#64748b;line-height:1.5;">${escapeHtml(prop(node, "description"))}</p><a href="${escapeHtml(prop(node, "ctaHref", "#"))}" style="color:#4f46e5;font-weight:700;">${escapeHtml(prop(node, "ctaLabel", "Learn more"))}</a></div></div>`;
  }

  if (node.type === "columns") {
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px;border-collapse:separate;border-spacing:${escapeHtml(prop(node, "gap", "16"))}px 0;"><tr><td width="50%" valign="top" style="color:${escapeHtml(prop(node, "color", "#334155"))};line-height:1.5;">${escapeHtml(prop(node, "leftContent"))}</td><td width="50%" valign="top" style="color:${escapeHtml(prop(node, "color", "#334155"))};line-height:1.5;">${escapeHtml(prop(node, "rightContent"))}</td></tr></table>`;
  }

  if (node.type === "qrcode") {
    const size = prop(node, "size", "220");
    const src = `https://quickchart.io/qr?text=${encodeURIComponent(prop(node, "value"))}&size=${encodeURIComponent(size)}`;
    return `<div style="margin:0 0 18px;border:1px solid #dbeafe;background:#f8fbff;border-radius:16px;padding:18px;text-align:center;"><strong style="display:block;margin-bottom:10px;color:#334155;">${escapeHtml(prop(node, "title", "QR Code"))}</strong><img src="${src}" alt="QR code" width="${escapeHtml(size)}" height="${escapeHtml(size)}" style="display:block;margin:0 auto;max-width:100%;" /><div style="margin-top:10px;color:#64748b;font-size:13px;">${escapeHtml(prop(node, "caption"))}</div></div>`;
  }

  if (node.type === "html") {
    return prop(node, "html");
  }

  if (node.type === "divider") {
    return '<hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0;" />';
  }

  return (node.children || []).map(blockHtml).join("");
}

export function renderTemplateHtml(layout: TemplateLayout) {
  const blocks = layoutToBlocks(layout);
  const body = blocks.map(blockHtml).join("\n");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;"><center style="width:100%;background:#f8fafc;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:30px 16px;"><table role="presentation" width="680" cellspacing="0" cellpadding="0" style="width:680px;max-width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;"><tr><td style="padding:30px;">${body}</td></tr></table></td></tr></table></center></body></html>`;
}

export function renderTemplateText(layout: TemplateLayout) {
  return layoutToBlocks(layout)
    .map((node) => {
      if (node.type === "button") return `${prop(node, "label")} ${prop(node, "href")}`.trim();
      if (node.type === "image") return `[Image] ${prop(node, "alt")}`;
      if (node.type === "imageCard") return `${prop(node, "title")}\n${prop(node, "description")}\n${prop(node, "ctaHref")}`.trim();
      if (node.type === "columns") return `${prop(node, "leftContent")}\n${prop(node, "rightContent")}`;
      if (node.type === "qrcode") return `[QR] ${prop(node, "title")} ${prop(node, "value")}`.trim();
      if (node.type === "html") return prop(node, "html").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (node.type === "divider") return "------------------------------";
      return prop(node, "content");
    })
    .filter(Boolean)
    .join("\n\n");
}

export function blockSummary(node: TemplateLayoutNode) {
  if (node.type === "button") return `${prop(node, "label", "Button")} -> ${prop(node, "href", "#")}`;
  if (node.type === "image") return `${prop(node, "alt", "Image")} -> ${prop(node, "src")}`;
  if (node.type === "imageCard") return `${prop(node, "title", "Image card")} -> ${prop(node, "ctaHref")}`;
  if (node.type === "columns") return `${prop(node, "leftContent")} | ${prop(node, "rightContent")}`;
  if (node.type === "qrcode") return `${prop(node, "title", "QR Code")} -> ${prop(node, "value")}`;
  if (node.type === "html") return prop(node, "html", "Raw HTML").replace(/\s+/g, " ");
  if (node.type === "divider") return "Horizontal divider";
  return prop(node, "content", "Text block");
}
