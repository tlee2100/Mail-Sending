<template>
  <section class="content__header designer-header">
    <div class="designer-header__copy">
      <span class="designer-eyebrow">Email Editor</span>
      <h1 class="page-title">Template Designer</h1>
      <p class="page-subtitle">
        Build your email visually with reusable blocks, then preview desktop and
        mobile output before saving the draft.
      </p>
      <div class="designer-meta">
        <span class="meta-pill">{{ templateDisplayName }}</span>
        <span class="meta-pill meta-pill--soft">Layout-driven rendering</span>
        <span v-if="ownershipNotice" class="meta-pill meta-pill--soft">
          {{ ownershipNotice }}
        </span>
      </div>
      <p v-if="requestError" class="notice notice--error header-notice">
        {{ requestError }}
      </p>
      <p v-else-if="requestInfo" class="notice notice--info header-notice">
        {{ requestInfo }}
      </p>
    </div>

    <div class="designer-header__actions">
      <button type="button" class="btn btn--secondary" @click="goBack">
        {{ backLabel }}
      </button>
      <button
        type="button"
        class="btn btn--secondary"
        @click="loadDraft"
        :disabled="isRequesting || !authToken"
      >
        Load Draft
      </button>
      <button
        type="button"
        class="btn btn--secondary"
        @click="saveDraft"
        :disabled="isRequesting || !authToken"
      >
        {{ saveDraftLabel }}
      </button>
      <button
        type="button"
        class="btn btn--primary"
        @click="publishDraft"
        :disabled="isRequesting || !authToken"
      >
        {{ publishDraftLabel }}
      </button>
      <RouterLink
        :to="`/templates/${route.params.id}/designer/versions`"
        class="btn btn--secondary"
      >
        Version History
      </RouterLink>
    </div>
  </section>

  <section class="designer-shell">
    <aside class="card toolbox-card">
      <div class="toolbox-section">
        <p class="toolbox-title">Block Library</p>
        <button
          v-for="type in palette"
          :key="type"
          type="button"
          class="toolbox-item"
          :class="`toolbox-item--${type}`"
          draggable="true"
          @click="addBlock(type)"
          @dragstart="onPaletteDragStart(type, $event)"
        >
          <span class="toolbox-item__badge">{{ blockShort(type) }}</span>
          <span>{{ prettyType(type) }}</span>
        </button>
      </div>

      <div class="toolbox-divider"></div>

      <div class="toolbox-section">
        <p class="toolbox-title">Quick Samples</p>
        <div class="input-wrap">
          <select v-model="selectedSample">
            <option
              v-for="option in sampleOptions"
              :key="option.key"
              :value="option.key"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
        <button type="button" class="btn btn--secondary toolbox-action" @click="loadSample">
          Apply Sample
        </button>
      </div>

      <div class="toolbox-divider"></div>

      <div class="toolbox-section">
        <p class="toolbox-title">Merge Tags</p>
        <div class="tag-list">
          <button
            v-for="variable in variables"
            :key="variable.key"
            type="button"
            class="tag-chip"
            @click="insertVariable(variable.token)"
          >
            {{ variable.token }}
          </button>
        </div>
      </div>

      <div class="toolbox-note">
        Click to add blocks quickly or drag them into the canvas. Select any block to
        edit its properties on the right.
      </div>
    </aside>

    <div class="workspace-column">
      <div class="card workspace-toolbar">
        <div class="toolbar-group">
          <button
            type="button"
            class="btn btn--secondary"
            @click="undo"
            :disabled="!canUndo"
          >
            Undo
          </button>
          <button
            type="button"
            class="btn btn--secondary"
            @click="redo"
            :disabled="!canRedo"
          >
            Redo
          </button>
        </div>
        <div class="toolbar-group">
          <button type="button" class="btn btn--secondary" @click="syncCanvasToJson">
            Sync Canvas to JSON
          </button>
          <button type="button" class="btn btn--secondary" @click="applyJsonToCanvas">
            Apply JSON to Canvas
          </button>
        </div>
      </div>

      <AIMediaGenerator
        :token="authToken"
        @insert-image="insertAiImageBlock"
        @insert-html="insertAiHtmlBlock"
      />

      <article class="card studio-card">
        <div class="studio-head">
          <div>
            <h2 class="section-title">Canvas</h2>
            <p class="studio-subtitle">
              Arrange blocks in order, duplicate what works, and remove anything you do
              not need.
            </p>
          </div>
          <div class="canvas-counter">{{ canvasBlocks.length }} block{{ canvasBlocks.length === 1 ? "" : "s" }}</div>
        </div>

        <div class="canvas-surface" @dragover.prevent @drop="onCanvasDropToEnd">
          <div
            v-for="(block, index) in canvasBlocks"
            :key="block.id"
            class="designer-block-card"
            :class="{ 'designer-block-card--active': selectedBlockIndex === index }"
            draggable="true"
            @click="selectedBlockIndex = index"
            @dragstart="onCanvasDragStart(index, $event)"
            @dragover.prevent
            @drop="onCanvasDrop(index)"
          >
            <div class="designer-block-card__head">
              <div>
                <span class="block-type-pill">{{ prettyType(block.type) }}</span>
                <p class="designer-block-card__summary">{{ blockSummary(block) }}</p>
              </div>
              <div class="block-actions">
                <button
                  type="button"
                  class="block-action"
                  @click.stop="duplicateBlock(index)"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  class="block-action block-action--danger"
                  @click.stop="removeBlock(index)"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <div v-if="canvasBlocks.length === 0" class="empty-canvas">
            <h3>Start with a block</h3>
            <p>Use the block library on the left or drag blocks here to build the email.</p>
          </div>
        </div>
      </article>

      <details class="card source-card">
        <summary>Layout JSON and diagnostics</summary>

        <textarea v-model="layout" rows="14" class="layout-input"></textarea>

        <p class="source-note">
          Backend can auto-render HTML/Text from this layout. Use the JSON source when
          you need precise control over the structure.
        </p>
        <p v-if="layoutError" class="notice notice--error source-notice">
          {{ layoutError }}
        </p>
        <ul v-if="schemaErrors.length" class="schema-list">
          <li v-for="(err, idx) in schemaErrors" :key="idx">{{ err }}</li>
        </ul>
      </details>
    </div>

    <aside class="right-column">
      <article class="card inspector-card">
        <div class="side-head">
          <h2 class="section-title">Properties</h2>
          <p class="side-copy">Select a block on the canvas to edit its settings.</p>
        </div>

        <div v-if="selectedBlock" class="inspector-fields">
          <p class="inspector-type">Editing {{ prettyType(selectedBlock.type) }}</p>

          <div class="input-wrap" v-if="selectedBlock.type === 'text'">
            <label>Text content</label>
            <textarea v-model="selectedBlock.props.content" rows="5"></textarea>
            <div class="style-grid">
              <div class="input-wrap">
                <label>Font size (px)</label>
                <input v-model="selectedBlock.props.fontSize" type="number" min="10" max="72" />
              </div>
              <div class="input-wrap">
                <label>Color</label>
                <input v-model="selectedBlock.props.color" type="color" />
              </div>
              <div class="input-wrap">
                <label>Align</label>
                <select v-model="selectedBlock.props.align">
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          </div>

          <template v-if="selectedBlock.type === 'button'">
            <div class="input-wrap">
              <label>Button label</label>
              <input v-model="selectedBlock.props.label" type="text" />
            </div>
            <div class="input-wrap">
              <label>Button href</label>
              <input v-model="selectedBlock.props.href" type="text" />
            </div>
            <div class="style-grid">
              <div class="input-wrap">
                <label>Background color</label>
                <input v-model="selectedBlock.props.backgroundColor" type="color" />
              </div>
              <div class="input-wrap">
                <label>Text color</label>
                <input v-model="selectedBlock.props.textColor" type="color" />
              </div>
              <div class="input-wrap">
                <label>Border radius (px)</label>
                <input v-model="selectedBlock.props.borderRadius" type="number" min="0" max="80" />
              </div>
              <div class="input-wrap">
                <label>Padding</label>
                <input v-model="selectedBlock.props.padding" type="text" />
              </div>
            </div>
          </template>

          <template v-if="selectedBlock.type === 'image'">
            <div class="input-wrap">
              <label>Image src</label>
              <input v-model="selectedBlock.props.src" type="text" />
            </div>
            <div class="input-wrap">
              <label>Image alt</label>
              <input v-model="selectedBlock.props.alt" type="text" />
            </div>
            <div class="input-wrap">
              <label>Image width (px)</label>
              <input v-model="selectedBlock.props.width" type="number" min="120" max="1200" />
            </div>
          </template>

          <template v-if="selectedBlock.type === 'imageCard'">
            <div class="input-wrap">
              <label>Image src</label>
              <input v-model="selectedBlock.props.imageSrc" type="text" />
            </div>
            <div class="input-wrap">
              <label>Image alt</label>
              <input v-model="selectedBlock.props.imageAlt" type="text" />
            </div>
            <div class="input-wrap">
              <label>Title</label>
              <input v-model="selectedBlock.props.title" type="text" />
            </div>
            <div class="input-wrap">
              <label>Description</label>
              <textarea v-model="selectedBlock.props.description" rows="4"></textarea>
            </div>
            <div class="style-grid">
              <div class="input-wrap">
                <label>CTA label</label>
                <input v-model="selectedBlock.props.ctaLabel" type="text" />
              </div>
              <div class="input-wrap">
                <label>CTA href</label>
                <input v-model="selectedBlock.props.ctaHref" type="text" />
              </div>
            </div>
          </template>

          <template v-if="selectedBlock.type === 'html'">
            <div class="input-wrap">
              <label>HTML</label>
              <textarea v-model="selectedBlock.props.html" rows="6"></textarea>
            </div>
          </template>

          <template v-if="selectedBlock.type === 'qrcode'">
            <div class="input-wrap">
              <label>QR content</label>
              <textarea
                v-model="selectedBlock.props.value"
                rows="4"
                placeholder="https://pay.example.com/{{email}}"
              ></textarea>
            </div>
            <div class="input-wrap">
              <label>Title</label>
              <input v-model="selectedBlock.props.title" type="text" />
            </div>
            <div class="input-wrap">
              <label>Caption</label>
              <input v-model="selectedBlock.props.caption" type="text" />
            </div>
            <div class="style-grid">
              <div class="input-wrap">
                <label>QR size (px)</label>
                <input v-model="selectedBlock.props.size" type="number" min="96" max="480" />
              </div>
            </div>
          </template>

          <template v-if="selectedBlock.type === 'columns'">
            <div class="input-wrap">
              <label>Left column text</label>
              <textarea v-model="selectedBlock.props.leftContent" rows="3"></textarea>
            </div>
            <div class="input-wrap">
              <label>Right column text</label>
              <textarea v-model="selectedBlock.props.rightContent" rows="3"></textarea>
            </div>
            <div class="style-grid">
              <div class="input-wrap">
                <label>Gap (px)</label>
                <input v-model="selectedBlock.props.gap" type="number" min="0" max="80" />
              </div>
              <div class="input-wrap">
                <label>Text color</label>
                <input v-model="selectedBlock.props.color" type="color" />
              </div>
            </div>
          </template>

          <template v-if="selectedBlock.type === 'twoColumnGrid'">
            <p class="inspector-type">Left card</p>
            <div class="input-wrap">
              <label>Left image src</label>
              <input v-model="selectedBlock.props.leftImageSrc" type="text" />
            </div>
            <div class="input-wrap">
              <label>Left title</label>
              <input v-model="selectedBlock.props.leftTitle" type="text" />
            </div>
            <div class="input-wrap">
              <label>Left description</label>
              <textarea v-model="selectedBlock.props.leftDescription" rows="3"></textarea>
            </div>
            <div class="style-grid">
              <div class="input-wrap">
                <label>Left CTA label</label>
                <input v-model="selectedBlock.props.leftCtaLabel" type="text" />
              </div>
              <div class="input-wrap">
                <label>Left CTA href</label>
                <input v-model="selectedBlock.props.leftCtaHref" type="text" />
              </div>
            </div>

            <p class="inspector-type inspector-type--spaced">Right card</p>
            <div class="input-wrap">
              <label>Right image src</label>
              <input v-model="selectedBlock.props.rightImageSrc" type="text" />
            </div>
            <div class="input-wrap">
              <label>Right title</label>
              <input v-model="selectedBlock.props.rightTitle" type="text" />
            </div>
            <div class="input-wrap">
              <label>Right description</label>
              <textarea v-model="selectedBlock.props.rightDescription" rows="3"></textarea>
            </div>
            <div class="style-grid">
              <div class="input-wrap">
                <label>Right CTA label</label>
                <input v-model="selectedBlock.props.rightCtaLabel" type="text" />
              </div>
              <div class="input-wrap">
                <label>Right CTA href</label>
                <input v-model="selectedBlock.props.rightCtaHref" type="text" />
              </div>
            </div>

            <div class="style-grid">
              <div class="input-wrap">
                <label>Gap (px)</label>
                <input v-model="selectedBlock.props.gap" type="number" min="0" max="80" />
              </div>
              <div class="input-wrap">
                <label>Image height (px)</label>
                <input v-model="selectedBlock.props.imageHeight" type="number" min="120" max="420" />
              </div>
            </div>
          </template>

          <div v-if="selectedBlock.type === 'divider'" class="empty-inspector-state">
            Divider block does not need extra properties.
          </div>
        </div>

        <div v-else class="empty-inspector-state">
          Choose a block from the center canvas and its editable fields will appear here.
        </div>
      </article>

      <article class="card preview-card">
        <div class="side-head">
          <h2 class="section-title">Preview</h2>
          <p class="side-copy">Switch view mode and device size before publishing.</p>
        </div>

        <div class="preview-toggle-grid">
          <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn--active': previewMode === 'email' }"
            @click="previewMode = 'email'"
          >
            Email
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn--active': previewMode === 'html' }"
            @click="previewMode = 'html'"
          >
            HTML
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn--active': previewMode === 'text' }"
            @click="previewMode = 'text'"
          >
            Text
          </button>
        </div>

        <div class="preview-toggle-grid preview-toggle-grid--device">
          <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn--active': previewDevice === 'desktop' }"
            @click="previewDevice = 'desktop'"
          >
            Desktop
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn--active': previewDevice === 'mobile' }"
            @click="previewDevice = 'mobile'"
          >
            Mobile
          </button>
        </div>

        <div
          v-if="previewMode === 'email'"
          class="preview-frame-shell"
          :class="{ 'preview-frame-shell--mobile': previewDevice === 'mobile' }"
        >
          <iframe class="email-frame" :srcdoc="renderedHtml" title="Email preview"></iframe>
        </div>
        <pre v-else-if="previewMode === 'html'" class="preview-code">{{ renderedHtml }}</pre>
        <pre v-else class="preview-code">{{ renderedText }}</pre>
      </article>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { auth } from "../stores/auth";
import type { AiImageResult } from "../api/aiMediaApi";
import {
  TemplateDesignerApiError,
  templateDesignerApi,
  type TemplateLayout,
} from "../api/templateDesignerApi";
import { templatesApi } from "../api/templatesApi";
import AIMediaGenerator from "../components/AIMediaGenerator.vue";
import {
  canManageTemplate,
  hasTemplateOwner,
  isTemplateOwnedByUser,
  templateOwnerLabel,
} from "../utils/templateOwnership";

const route = useRoute();
const router = useRouter();

type BlockPropValue = string | number;

type LayoutNode = {
  type:
    | "section"
    | "text"
    | "button"
    | "divider"
    | "image"
    | "imageCard"
    | "columns"
    | "twoColumnGrid"
    | "qrcode"
    | "html";
  props?: Record<string, BlockPropValue>;
  children?: LayoutNode[];
};

type BlockType =
  | "text"
  | "button"
  | "divider"
  | "image"
  | "imageCard"
  | "columns"
  | "twoColumnGrid"
  | "qrcode"
  | "html";

type DesignerBlock = {
  id: string;
  type: BlockType;
  props: Record<string, BlockPropValue>;
};

type TemplateContent = {
  id?: unknown;
  template_name?: unknown;
  subject?: unknown;
  preview_text?: unknown;
  content_html?: unknown;
  content_text?: unknown;
  is_active?: unknown;
  [key: string]: unknown;
};

type AiImageInsertPayload = AiImageResult & {
  emailWidth: number;
};

type AiHtmlInsertPayload = {
  type: "video";
  html: string;
  url?: string;
};

type DragPayload =
  | { kind: "palette"; blockType: BlockType }
  | { kind: "canvas"; index: number }
  | null;

const sampleOptions = [
  { key: "aiShowcase", label: "AI Product Showcase" },
  { key: "welcome", label: "Welcome Email" },
  { key: "promo", label: "Promo Campaign" },
  { key: "invoice", label: "Billing Reminder" },
  { key: "newsletter", label: "Weekly Newsletter" },
  { key: "launch", label: "Product Launch" },
  { key: "event", label: "Event Invitation" },
  { key: "reengagement", label: "Re-engagement" },
  { key: "feedback", label: "Feedback Request" },
] as const;

const variables = [
  { key: "name", token: "{{name}}" },
  { key: "email", token: "{{email}}" },
  { key: "phone", token: "{{phone}}" },
  { key: "amount", token: "{{amount}}" },
  { key: "company", token: "{{company}}" },
  { key: "orderId", token: "{{orderId}}" },
  { key: "unsubscribe_url", token: "{{unsubscribe_url}}" },
] as const;

type SampleKey = (typeof sampleOptions)[number]["key"];

function isSampleKey(value: string): value is SampleKey {
  return sampleOptions.some((option) => option.key === value);
}

const samples: Record<SampleKey, { root: LayoutNode }> = {
  aiShowcase: {
    root: {
      type: "section",
      children: [
        {
          type: "text",
          props: {
            content: "Welcome to your AI Pro workspace",
            fontSize: "28",
            color: "#202124",
            align: "left",
          },
        },
        {
          type: "text",
          props: {
            content:
              "Explore the tools included in your plan, from writing assistance to research, video, and coding workflows.",
            fontSize: "16",
            color: "#5f6368",
            align: "left",
          },
        },
        {
          type: "twoColumnGrid",
          props: {
            leftImageSrc:
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
            leftImageAlt: "AI assistant on a phone",
            leftTitle: "Gemini app",
            leftDescription:
              "Chat with a personal AI assistant to understand complex topics, supercharge ideas, and simplify everyday tasks.",
            leftCtaLabel: "Try the Gemini app in Pro",
            leftCtaHref: "https://example.com/gemini",
            rightImageSrc:
              "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=900&q=80",
            rightImageAlt: "Creative video editing workspace",
            rightTitle: "Flow",
            rightDescription:
              "Create cinematic clips, scenes, and stories with consistent visual style for your campaign assets.",
            rightCtaLabel: "Try Flow in Pro",
            rightCtaHref: "https://example.com/flow",
            gap: "28",
            imageHeight: "178",
          },
        },
        {
          type: "twoColumnGrid",
          props: {
            leftImageSrc:
              "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80",
            leftImageAlt: "Research notes and audio",
            leftTitle: "NotebookLM",
            leftDescription:
              "Upload your sources to get instant summaries, study guides, and grounded answers from your own material.",
            leftCtaLabel: "Open NotebookLM",
            leftCtaHref: "https://example.com/notebooklm",
            rightImageSrc:
              "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
            rightImageAlt: "Workspace apps",
            rightTitle: "Gemini in Gmail, Docs, Vids, and more",
            rightDescription:
              "Use AI across workspace apps to summarize emails, find files, draft content, and polish meetings.",
            rightCtaLabel: "Try it in Gmail",
            rightCtaHref: "https://example.com/gmail",
            gap: "28",
            imageHeight: "178",
          },
        },
        {
          type: "imageCard",
          props: {
            imageSrc:
              "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
            imageAlt: "Coding workspace",
            title: "Jules",
            description:
              "Ask an asynchronous coding agent to read your code, understand your intent, and work on tasks while you stay focused.",
            ctaLabel: "Try Jules",
            ctaHref: "https://example.com/jules",
            imageHeight: "220",
          },
        },
      ],
    },
  },
  welcome: {
    root: {
      type: "section",
      children: [
        {
          type: "text",
          props: { content: "Hello {{name}}, welcome to ChadMailer." },
        },
        {
          type: "text",
          props: {
            content: "Your workspace is ready. Start your first campaign now.",
          },
        },
        {
          type: "button",
          props: {
            label: "Open Dashboard",
            href: "https://example.com/dashboard",
          },
        },
      ],
    },
  },
  promo: {
    root: {
      type: "section",
      children: [
        {
          type: "text",
          props: { content: "Spring Promo: save 30% this week only." },
        },
        { type: "divider" },
        { type: "text", props: { content: "Use code SPRING30 at checkout." } },
        {
          type: "button",
          props: { label: "Claim Discount", href: "https://example.com/promo" },
        },
      ],
    },
  },
  invoice: {
    root: {
      type: "section",
      children: [
        {
          type: "text",
          props: {
            content: "Hi {{name}}, your invoice INV-2026-042 is due in 2 days.",
          },
        },
        {
          type: "text",
          props: {
            content:
              "Amount: {{amount}}. Please complete payment to avoid interruption.",
          },
        },
        {
          type: "button",
          props: { label: "Pay Invoice", href: "https://example.com/billing" },
        },
      ],
    },
  },
  newsletter: {
    root: {
      type: "section",
      children: [
        {
          type: "image",
          props: {
            src: "https://dummyimage.com/640x220/c7d2fe/1e1b4b&text=Weekly+News",
            alt: "Weekly newsletter cover",
          },
        },
        {
          type: "text",
          props: {
            content:
              "Top stories this week: product updates, growth tips, and customer spotlight.",
          },
        },
        {
          type: "button",
          props: {
            label: "Read Full Newsletter",
            href: "https://example.com/news",
          },
        },
      ],
    },
  },
  launch: {
    root: {
      type: "section",
      children: [
        {
          type: "image",
          props: {
            src: "https://dummyimage.com/640x220/bae6fd/082f49&text=New+Product+Launch",
            alt: "Product launch hero",
          },
        },
        {
          type: "text",
          props: {
            content:
              "Introducing NovaSend 2.0 with smarter automation and better analytics.",
          },
        },
        { type: "divider" },
        {
          type: "button",
          props: {
            label: "See New Features",
            href: "https://example.com/launch",
          },
        },
      ],
    },
  },
  event: {
    root: {
      type: "section",
      children: [
        {
          type: "text",
          props: {
            content:
              "You are invited: Growth Marketing Webinar - April 12, 10:00 AM.",
          },
        },
        {
          type: "text",
          props: {
            content:
              "Join experts sharing practical email strategies for 2026.",
          },
        },
        {
          type: "button",
          props: {
            label: "Reserve Your Seat",
            href: "https://example.com/events",
          },
        },
      ],
    },
  },
  reengagement: {
    root: {
      type: "section",
      children: [
        {
          type: "text",
          props: {
            content:
              "We miss you, {{name}}. Here is a special offer to come back.",
          },
        },
        { type: "divider" },
        {
          type: "text",
          props: {
            content: "Use code COMEBACK20 and save 20% on your next plan.",
          },
        },
        {
          type: "button",
          props: {
            label: "Reactivate Now",
            href: "https://example.com/reactivate",
          },
        },
      ],
    },
  },
  feedback: {
    root: {
      type: "section",
      children: [
        {
          type: "text",
          props: {
            content: "Hi {{name}}, thank you for using ChadMailer this month.",
          },
        },
        {
          type: "text",
          props: {
            content: "Can you share a 2-minute feedback to help us improve?",
          },
        },
        {
          type: "button",
          props: {
            label: "Give Feedback",
            href: "https://example.com/feedback",
          },
        },
      ],
    },
  },
};

const sampleFromQuery = String(route.query.sample || "aiShowcase");
const initialSample: SampleKey = isSampleKey(sampleFromQuery)
  ? sampleFromQuery
  : "aiShowcase";

const selectedSample = ref<SampleKey>(initialSample);
const previewMode = ref<"email" | "html" | "text">("email");
const previewDevice = ref<"desktop" | "mobile">("desktop");
const layout = ref(JSON.stringify(samples[initialSample], null, 2));
const palette: BlockType[] = [
  "text",
  "button",
  "image",
  "imageCard",
  "html",
  "qrcode",
  "columns",
  "twoColumnGrid",
  "divider",
];
const canvasBlocks = ref<DesignerBlock[]>([]);
const selectedBlockIndex = ref<number | null>(null);
const dragPayload = ref<DragPayload>(null);
const isApplyingHistory = ref(false);
const history = ref<DesignerBlock[][]>([]);
const historyIndex = ref(-1);
const isRequesting = ref(false);
const requestError = ref("");
const requestInfo = ref("");
const currentTemplate = ref<TemplateContent | null>(null);

const templateId = computed(() => {
  const raw = Number(route.params.id);
  return Number.isFinite(raw) ? String(raw) : "";
});
const authToken = computed(() => auth.state.token);
const templateDisplayName = computed(() =>
  templateId.value ? `Template #${templateId.value}` : "Template",
);
const backLabel = computed(() =>
  route.query.from === "compose" ? "Back to Compose" : "Back to Templates",
);
const canManageCurrentTemplate = computed(() =>
  canManageTemplate(currentTemplate.value, auth.state.user),
);
const ownershipNotice = computed(() => {
  if (!currentTemplate.value || !hasTemplateOwner(currentTemplate.value)) return "";
  if (isTemplateOwnedByUser(currentTemplate.value, auth.state.user)) {
    return "Owned by you";
  }
  const owner = templateOwnerLabel(currentTemplate.value);
  return owner ? `Shared by ${owner}` : "Shared template";
});
const saveDraftLabel = computed(() =>
  canManageCurrentTemplate.value ? "Save Draft" : "Save As New",
);
const publishDraftLabel = computed(() =>
  canManageCurrentTemplate.value ? "Publish" : "Publish As New",
);

const selectedBlock = computed(() => {
  if (selectedBlockIndex.value === null) return null;
  return canvasBlocks.value[selectedBlockIndex.value] || null;
});

function prettyType(type: BlockType) {
  const labels: Record<BlockType, string> = {
    text: "Text",
    button: "Button",
    image: "Image",
    imageCard: "Image Card",
    qrcode: "QR Code",
    columns: "Columns",
    twoColumnGrid: "2 Column Grid",
    divider: "Divider",
    html: "HTML",
  };
  return labels[type];
}

function blockShort(type: BlockType) {
  const labels: Record<BlockType, string> = {
    text: "Tx",
    button: "Bt",
    image: "Im",
    imageCard: "IC",
    qrcode: "QR",
    columns: "Co",
    twoColumnGrid: "2C",
    divider: "Dv",
    html: "HT",
  };
  return labels[type];
}

function goBack() {
  if (route.query.from === "compose") {
    void router.push({ name: "individual-emails-compose" });
    return;
  }
  void router.push({ name: "email-templates" });
}

function uid() {
  return `blk_${Math.random().toString(16).slice(2, 8)}_${Date.now().toString(16)}`;
}

function defaultProps(type: BlockType): Record<string, BlockPropValue> {
  if (type === "text") {
    return {
      content: "New text block",
      fontSize: "16",
      color: "#334155",
      align: "left",
    };
  }
  if (type === "button") {
    return {
      label: "Button",
      href: "https://example.com",
      backgroundColor: "#4f46e5",
      textColor: "#ffffff",
      borderRadius: "8",
      padding: "10px 16px",
    };
  }
  if (type === "image") {
    return {
      src: "https://dummyimage.com/640x220/e2e8f0/334155&text=Banner",
      alt: "Banner image",
      width: 600,
    };
  }
  if (type === "imageCard") {
    return {
      imageSrc: "https://dummyimage.com/640x260/e8f0fe/1967d2&text=Image+Card",
      imageAlt: "Card image",
      title: "Feature title",
      description:
        "Use this card for product highlights, event sections, content recommendations, or rich email modules.",
      ctaLabel: "Learn more",
      ctaHref: "https://example.com",
      imageHeight: "220",
    };
  }
  if (type === "html") {
    return {
      html: '<a href="https://example.com" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;">Open link</a>',
    };
  }
  if (type === "qrcode") {
    return {
      value: "https://pay.example.com/invoice/{{email}}",
      title: "Scan to continue",
      caption: "Dynamic QR code rendered per recipient",
      size: "220",
    };
  }
  if (type === "columns") {
    return {
      leftContent: "Left column text",
      rightContent: "Right column text",
      gap: "16",
      color: "#334155",
    };
  }
  if (type === "twoColumnGrid") {
    return {
      leftImageSrc: "https://dummyimage.com/600x340/e8f0fe/1967d2&text=Left+Card",
      leftImageAlt: "Left card image",
      leftTitle: "Left feature",
      leftDescription: "Describe the first product, article, or offer.",
      leftCtaLabel: "Open left",
      leftCtaHref: "https://example.com/left",
      rightImageSrc: "https://dummyimage.com/600x340/f1f3f4/3c4043&text=Right+Card",
      rightImageAlt: "Right card image",
      rightTitle: "Right feature",
      rightDescription: "Describe the second product, article, or offer.",
      rightCtaLabel: "Open right",
      rightCtaHref: "https://example.com/right",
      gap: "24",
      imageHeight: "180",
    };
  }
  return {};
}

function blockSummary(block: DesignerBlock): string {
  if (block.type === "text") return String(block.props.content || "(empty text)");
  if (block.type === "button") {
    return `${block.props.label || "Button"} -> ${block.props.href || "#"}`;
  }
  if (block.type === "image") {
    return `${block.props.alt || "Image"} -> ${block.props.src || ""}`;
  }
  if (block.type === "imageCard") {
    return `${block.props.title || "Image card"} -> ${block.props.ctaHref || ""}`;
  }
  if (block.type === "html") {
    return String(block.props.html || "Raw HTML block").replace(/\s+/g, " ");
  }
  if (block.type === "qrcode") {
    return `${block.props.title || "QR Code"} -> ${block.props.value || ""}`;
  }
  if (block.type === "columns") {
    return `${block.props.leftContent || ""} | ${block.props.rightContent || ""}`;
  }
  if (block.type === "twoColumnGrid") {
    return `${block.props.leftTitle || "Left"} | ${block.props.rightTitle || "Right"}`;
  }
  return "Horizontal divider";
}

function cloneBlock(block: DesignerBlock): DesignerBlock {
  return {
    id: uid(),
    type: block.type,
    props: { ...block.props },
  };
}

function snapshotBlocks(source: DesignerBlock[]) {
  return source.map((block) => ({
    id: block.id,
    type: block.type,
    props: { ...block.props },
  }));
}

function pushHistory() {
  const snap = snapshotBlocks(canvasBlocks.value);
  const last = history.value[historyIndex.value];
  if (last && JSON.stringify(last) === JSON.stringify(snap)) return;

  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }
  history.value.push(snap);
  historyIndex.value = history.value.length - 1;
}

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(
  () =>
    historyIndex.value >= 0 && historyIndex.value < history.value.length - 1,
);

function applyHistoryAt(index: number) {
  const snap = history.value[index];
  if (!snap) return;
  isApplyingHistory.value = true;
  canvasBlocks.value = snapshotBlocks(snap);
  selectedBlockIndex.value = canvasBlocks.value.length
    ? Math.min(selectedBlockIndex.value ?? 0, canvasBlocks.value.length - 1)
    : null;
  isApplyingHistory.value = false;
}

function undo() {
  if (!canUndo.value) return;
  historyIndex.value -= 1;
  applyHistoryAt(historyIndex.value);
}

function redo() {
  if (!canRedo.value) return;
  historyIndex.value += 1;
  applyHistoryAt(historyIndex.value);
}

function addBlock(type: BlockType) {
  canvasBlocks.value.push({ id: uid(), type, props: defaultProps(type) });
  selectedBlockIndex.value = canvasBlocks.value.length - 1;
}

function blockId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return uid();
}

function insertAiImageBlock(result: AiImageInsertPayload) {
  const width = Math.max(120, Math.min(1200, Math.round(result.emailWidth || 600)));
  canvasBlocks.value.push({
    id: blockId(),
    type: "image",
    props: {
      src: result.url,
      alt: result.altText || "",
      width,
    },
  });
  selectedBlockIndex.value = canvasBlocks.value.length - 1;
  requestError.value = "";
  requestInfo.value = "Đã chèn ảnh AI vào canvas.";
}

function insertAiHtmlBlock(payload: AiHtmlInsertPayload) {
  canvasBlocks.value.push({
    id: blockId(),
    type: "html",
    props: {
      html: payload.html,
      source: payload.url || "",
    },
  });
  selectedBlockIndex.value = canvasBlocks.value.length - 1;
  requestError.value = "";
  requestInfo.value = "Đã chèn video AI vào canvas.";
}

function duplicateBlock(index: number) {
  const block = canvasBlocks.value[index];
  if (!block) return;
  canvasBlocks.value.splice(index + 1, 0, cloneBlock(block));
  selectedBlockIndex.value = index + 1;
}

function removeBlock(index: number) {
  canvasBlocks.value.splice(index, 1);
  if (selectedBlockIndex.value === null) return;
  if (canvasBlocks.value.length === 0) {
    selectedBlockIndex.value = null;
    return;
  }
  if (selectedBlockIndex.value >= canvasBlocks.value.length) {
    selectedBlockIndex.value = canvasBlocks.value.length - 1;
  }
}

function onPaletteDragStart(type: BlockType, event: DragEvent) {
  dragPayload.value = { kind: "palette", blockType: type };
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "copy";
  }
}

function onCanvasDragStart(index: number, event: DragEvent) {
  dragPayload.value = { kind: "canvas", index };
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function onCanvasDrop(targetIndex: number) {
  const payload = dragPayload.value;
  if (!payload) return;

  if (payload.kind === "palette") {
    canvasBlocks.value.splice(targetIndex, 0, {
      id: uid(),
      type: payload.blockType,
      props: defaultProps(payload.blockType),
    });
    selectedBlockIndex.value = targetIndex;
  }

  if (payload.kind === "canvas") {
    const blocks = [...canvasBlocks.value];
    const fromIndex = payload.index;
    if (fromIndex < 0 || fromIndex >= blocks.length) return;
    const moving = blocks[fromIndex];
    if (!moving) return;
    blocks.splice(fromIndex, 1);
    let insertAt = targetIndex;
    if (fromIndex < insertAt) insertAt -= 1;
    blocks.splice(insertAt, 0, moving);
    canvasBlocks.value = blocks;
    selectedBlockIndex.value = insertAt;
  }

  dragPayload.value = null;
}

function onCanvasDropToEnd() {
  const payload = dragPayload.value;
  if (!payload) return;

  if (payload.kind === "palette") {
    canvasBlocks.value.push({
      id: uid(),
      type: payload.blockType,
      props: defaultProps(payload.blockType),
    });
    selectedBlockIndex.value = canvasBlocks.value.length - 1;
  }

  if (payload.kind === "canvas") {
    const blocks = [...canvasBlocks.value];
    const moving = blocks[payload.index];
    if (!moving) return;
    blocks.splice(payload.index, 1);
    blocks.push(moving);
    canvasBlocks.value = blocks;
    selectedBlockIndex.value = blocks.length - 1;
  }

  dragPayload.value = null;
}

function blockToNode(block: DesignerBlock): LayoutNode {
  return {
    type: block.type,
    props: block.props,
  };
}

function nodeToBlock(node: LayoutNode): DesignerBlock | null {
  if (
    node.type === "text" ||
    node.type === "button" ||
    node.type === "divider" ||
    node.type === "image" ||
    node.type === "imageCard" ||
    node.type === "html" ||
    node.type === "qrcode" ||
    node.type === "columns" ||
    node.type === "twoColumnGrid"
  ) {
    return {
      id: uid(),
      type: node.type,
      props: { ...defaultProps(node.type), ...(node.props || {}) },
    };
  }
  return null;
}

function syncCanvasToJson() {
  const children = canvasBlocks.value.map((block) => blockToNode(block));
  layout.value = JSON.stringify(
    { root: { type: "section", children } },
    null,
    2,
  );
}

function applyJsonToCanvas() {
  if (!parsedLayout.value?.root) return;
  const root = parsedLayout.value.root;
  const sourceNodes = root.type === "section" ? root.children || [] : [root];
  const next = sourceNodes
    .map((node) => nodeToBlock(node))
    .filter((v): v is DesignerBlock => !!v);
  canvasBlocks.value = next;
  selectedBlockIndex.value = next.length ? 0 : null;
}

function loadSample() {
  layout.value = JSON.stringify(samples[selectedSample.value], null, 2);
  applyJsonToCanvas();
}

function stringifyLayoutFromNodes(children: LayoutNode[]) {
  return JSON.stringify({ root: { type: "section", children } }, null, 2);
}

function isValidLayoutString(value: string) {
  try {
    const parsed = JSON.parse(value) as { root?: LayoutNode };
    return !!parsed.root;
  } catch {
    return false;
  }
}

function buildLayoutFromPlainText(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const children = paragraphs.map((content, index) => ({
    type: "text" as const,
    props: {
      content,
      fontSize: index === 0 ? "18" : "16",
      color: "#334155",
      align: "left",
    },
  }));

  return stringifyLayoutFromNodes(children);
}

function buildLayoutFromHtml(value: string) {
  return stringifyLayoutFromNodes([
    {
      type: "html",
      props: {
        html: value,
      },
    },
  ]);
}

function buildLayoutFromTemplateContent(template: TemplateContent) {
  const text = String(template.content_text || "").trim();
  if (text) return buildLayoutFromPlainText(text);

  const html = String(template.content_html || "").trim();
  if (html) return buildLayoutFromHtml(html);

  return "";
}

function normalizeLayout(raw: TemplateLayout | string | null | undefined): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if ("root" in raw && raw.root) {
    return JSON.stringify(raw, null, 2);
  }
  if (
    "blocks" in raw &&
    Array.isArray((raw as unknown as { blocks?: unknown[] }).blocks)
  ) {
    const legacy = raw as unknown as { blocks: LayoutNode[] };
    if (legacy.blocks.length === 0) {
      return "";
    }
    return JSON.stringify(
      { root: { type: "section", children: legacy.blocks } },
      null,
      2,
    );
  }
  return JSON.stringify(raw, null, 2);
}

function setRequestError(err: unknown) {
  if (err instanceof TemplateDesignerApiError) {
    requestError.value = err.message;
    return;
  }
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    requestError.value = typeof msg === "string" ? msg : "Request failed";
    return;
  }
  requestError.value = "Request failed";
}

function stringOrUndefined(value: unknown) {
  const text = String(value || "").trim();
  return text || undefined;
}

function buildCopyName(value: unknown) {
  const name = String(value || `Template ${templateId.value}`).trim() || "Template";
  return name.toLowerCase().endsWith("(copy)") ? name : `${name} (Copy)`;
}

function extractTemplateId(template: Record<string, unknown>) {
  const id = template.id ?? template.template_id ?? template.templateId;
  return id === undefined || id === null ? "" : String(id);
}

async function ensureCurrentTemplate(token: string) {
  if (currentTemplate.value) return currentTemplate.value;
  if (!templateId.value) return null;

  const response = await templatesApi.getTemplate(token, templateId.value);
  currentTemplate.value = response.data as TemplateContent;
  return currentTemplate.value;
}

async function saveAsNewTemplate(token: string, shouldPublish: boolean) {
  const sourceTemplate = await ensureCurrentTemplate(token);
  const createResponse = await templatesApi.createTemplate(token, {
    templateName: buildCopyName(sourceTemplate?.template_name),
    subject: stringOrUndefined(sourceTemplate?.subject),
    previewText: stringOrUndefined(sourceTemplate?.preview_text),
    contentHtml: renderedHtml.value,
    contentText: renderedText.value,
    isActive: sourceTemplate?.is_active === false ? false : true,
  });
  const createdTemplate = createResponse.data as TemplateContent;
  const newTemplateId = extractTemplateId(createdTemplate);

  if (!newTemplateId) {
    requestInfo.value =
      "Template copy was created, but the API did not return its ID.";
    return;
  }

  await templateDesignerApi.saveDraft(newTemplateId, token, {
    layout: parsedLayout.value as TemplateLayout,
    renderedHtml: renderedHtml.value,
    renderedText: renderedText.value,
  });

  if (shouldPublish) {
    await templateDesignerApi.publishDraft(newTemplateId, token, {
      layout: parsedLayout.value as TemplateLayout,
      renderedHtml: renderedHtml.value,
      renderedText: renderedText.value,
    });
  }

  currentTemplate.value = createdTemplate;
  await router.replace({ name: "template-designer", params: { id: newTemplateId } });
  requestInfo.value = shouldPublish
    ? "This shared template was published as your new template copy."
    : "This shared template was saved as your new template copy.";
}

async function saveDraft() {
  const token = authToken.value;
  requestError.value = "";
  requestInfo.value = "";
  if (!templateId.value) {
    requestError.value = "Template ID must be a number.";
    return;
  }
  if (!token) {
    requestError.value = "Unauthorized. Please login again.";
    return;
  }
  if (!parsedLayout.value?.root) {
    requestError.value = "Cannot save draft because layout JSON is invalid.";
    return;
  }

  isRequesting.value = true;
  try {
    await ensureCurrentTemplate(token);
    if (!canManageCurrentTemplate.value) {
      await saveAsNewTemplate(token, false);
      return;
    }

    const saved = await templateDesignerApi.saveDraft(templateId.value, token, {
      layout: parsedLayout.value as TemplateLayout,
      renderedHtml: renderedHtml.value,
      renderedText: renderedText.value,
    });
    requestInfo.value = saved.updatedAt
      ? `Draft saved at ${new Date(saved.updatedAt).toLocaleString()}.`
      : "Draft saved.";
  } catch (err) {
    setRequestError(err);
  } finally {
    isRequesting.value = false;
  }
}

async function loadDraft() {
  const token = authToken.value;
  requestError.value = "";
  requestInfo.value = "";
  if (!templateId.value) {
    requestError.value = "Template ID must be a number.";
    return;
  }
  if (!token) {
    requestError.value = "Unauthorized. Please login again.";
    return;
  }

  isRequesting.value = true;
  try {
    const templateRes = await templatesApi.getTemplate(token, templateId.value);
    currentTemplate.value = templateRes.data as TemplateContent;

    let res = null;
    let designerError: unknown = null;
    try {
      res = await templateDesignerApi.getDesigner(templateId.value, token);
    } catch (err) {
      designerError = err;
    }

    const source = res?.draft || res?.published || res;
    let nextLayout = normalizeLayout(source?.layout);
    if (nextLayout && !isValidLayoutString(nextLayout)) {
      nextLayout = source?.renderedHtml
        ? buildLayoutFromHtml(source.renderedHtml)
        : source?.renderedText
          ? buildLayoutFromPlainText(source.renderedText)
          : "";
    }
    if (!nextLayout) {
      nextLayout = buildLayoutFromTemplateContent(currentTemplate.value);
      if (!nextLayout) {
        if (designerError) {
          throw designerError;
        }
        requestInfo.value = "No draft/published designer data or template content found.";
        return;
      }
    }
    layout.value = nextLayout;
    applyJsonToCanvas();
    pushHistory();
    const accessNote = canManageCurrentTemplate.value
      ? ""
      : " You can use it, but saving will create a new template under your account.";
    requestInfo.value = source
      ? `Designer data loaded.${accessNote}`
      : `Template content loaded into designer.${accessNote}`;
  } catch (err) {
    setRequestError(err);
  } finally {
    isRequesting.value = false;
  }
}

async function publishDraft() {
  const token = authToken.value;
  requestError.value = "";
  requestInfo.value = "";
  if (!templateId.value) {
    requestError.value = "Template ID must be a number.";
    return;
  }
  if (!token) {
    requestError.value = "Unauthorized. Please login again.";
    return;
  }
  if (!parsedLayout.value?.root) {
    requestError.value = "Cannot publish because layout JSON is invalid.";
    return;
  }

  isRequesting.value = true;
  try {
    await ensureCurrentTemplate(token);
    if (!canManageCurrentTemplate.value) {
      await saveAsNewTemplate(token, true);
      return;
    }

    const res = await templateDesignerApi.publishDraft(templateId.value, token, {
      layout: parsedLayout.value as TemplateLayout,
      renderedHtml: renderedHtml.value,
      renderedText: renderedText.value,
    });
    requestInfo.value = res.versionNumber
      ? `Published draft as version ${res.versionNumber}.`
      : "Draft published.";
  } catch (err) {
    setRequestError(err);
  } finally {
    isRequesting.value = false;
  }
}

function insertVariable(token: string) {
  const block = selectedBlock.value;
  if (!block) return;
  if (block.type === "text") {
    block.props.content = `${String(block.props.content || "")} ${token}`.trim();
    return;
  }
  if (block.type === "button") {
    block.props.label = `${String(block.props.label || "")} ${token}`.trim();
    return;
  }
  if (block.type === "columns") {
    block.props.leftContent = `${String(block.props.leftContent || "")} ${token}`.trim();
    return;
  }
  if (block.type === "imageCard") {
    block.props.description = `${String(block.props.description || "")} ${token}`.trim();
    return;
  }
  if (block.type === "twoColumnGrid") {
    block.props.leftDescription = `${String(block.props.leftDescription || "")} ${token}`.trim();
    return;
  }
  if (block.type === "qrcode") {
    block.props.value = `${String(block.props.value || "")}${token}`;
  }
}

const parsedLayout = computed(() => {
  try {
    const parsed = JSON.parse(layout.value) as { root?: LayoutNode };
    if (!parsed.root) throw new Error("Missing root node");
    return parsed;
  } catch {
    return null;
  }
});

const layoutError = computed(() => {
  if (parsedLayout.value) return "";
  return "Invalid JSON layout. Please fix syntax (commas, quotes, braces).";
});

function hasUnknownVariable(value: string) {
  const matches = value.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || [];
  const allowed = new Set<string>(variables.map((v) => v.key));
  for (const raw of matches) {
    const key = raw.replace(/\{|\}|\s/g, "");
    if (!allowed.has(key)) return true;
  }
  return false;
}

function validateNodeSchema(node: LayoutNode, path: string, errors: string[]) {
  const allowedTypes: Array<LayoutNode["type"]> = [
    "section",
    "text",
    "button",
    "divider",
    "image",
    "imageCard",
    "html",
    "qrcode",
    "columns",
    "twoColumnGrid",
  ];
  if (!allowedTypes.includes(node.type)) {
    errors.push(`${path}: unknown type ${String(node.type)}`);
    return;
  }

  if (node.type === "text") {
    if (!node.props?.content) errors.push(`${path}: text.content is required`);
    if (hasUnknownVariable(String(node.props?.content || ""))) {
      errors.push(`${path}: text contains unknown variable token`);
    }
  }
  if (node.type === "button") {
    if (!node.props?.label) errors.push(`${path}: button.label is required`);
    if (!node.props?.href) errors.push(`${path}: button.href is required`);
    if (hasUnknownVariable(String(node.props?.label || ""))) {
      errors.push(`${path}: button label contains unknown variable token`);
    }
  }
  if (node.type === "image" && !node.props?.src) {
    errors.push(`${path}: image.src is required`);
  }
  if (node.type === "imageCard") {
    if (!node.props?.imageSrc) errors.push(`${path}: imageCard.imageSrc is required`);
    if (!node.props?.title) errors.push(`${path}: imageCard.title is required`);
    if (!node.props?.description) {
      errors.push(`${path}: imageCard.description is required`);
    }
    if (hasUnknownVariable(String(node.props?.description || ""))) {
      errors.push(`${path}: image card description contains unknown variable token`);
    }
  }
  if (node.type === "html" && !node.props?.html) {
    errors.push(`${path}: html.html is required`);
  }
  if (node.type === "qrcode") {
    if (!node.props?.value) {
      errors.push(`${path}: qrcode.value is required`);
    }
    if (hasUnknownVariable(String(node.props?.value || ""))) {
      errors.push(`${path}: QR content contains unknown variable token`);
    }
  }
  if (node.type === "columns") {
    if (!node.props?.leftContent) {
      errors.push(`${path}: columns.leftContent is required`);
    }
    if (!node.props?.rightContent) {
      errors.push(`${path}: columns.rightContent is required`);
    }
  }
  if (node.type === "twoColumnGrid") {
    if (!node.props?.leftImageSrc) {
      errors.push(`${path}: twoColumnGrid.leftImageSrc is required`);
    }
    if (!node.props?.rightImageSrc) {
      errors.push(`${path}: twoColumnGrid.rightImageSrc is required`);
    }
    if (!node.props?.leftTitle) {
      errors.push(`${path}: twoColumnGrid.leftTitle is required`);
    }
    if (!node.props?.rightTitle) {
      errors.push(`${path}: twoColumnGrid.rightTitle is required`);
    }
  }

  if (node.children?.length) {
    node.children.forEach((child, idx) =>
      validateNodeSchema(child, `${path}.children[${idx}]`, errors),
    );
  }
}

const schemaErrors = computed(() => {
  if (!parsedLayout.value?.root) return [] as string[];
  const errors: string[] = [];
  validateNodeSchema(parsedLayout.value.root, "root", errors);
  return errors;
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeCssValue(value: BlockPropValue | undefined, fallback: string) {
  if (value === undefined || value === null || value === "") return fallback;
  const cleaned = String(value).replace(/[;"<>]/g, "").trim();
  return cleaned || fallback;
}

function px(value: BlockPropValue | undefined, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${fallback}px`;
  return `${Math.max(0, n)}px`;
}

function clampNumber(value: BlockPropValue | undefined, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function clampQrSize(value: BlockPropValue | undefined, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(96, Math.min(480, n));
}

function buildQrUrl(value: BlockPropValue, size: number) {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: String(value),
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

function textAlign(value: BlockPropValue | undefined) {
  if (value === "center" || value === "right") return value;
  return "left";
}

function stripHtmlText(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderCardImage(srcValue: BlockPropValue | undefined, altValue: BlockPropValue | undefined, heightValue: BlockPropValue | undefined) {
  const src = escapeHtml(
    String(srcValue || "https://dummyimage.com/600x340/e8f0fe/1967d2&text=Email+Image"),
  );
  const alt = escapeHtml(String(altValue || "Email image"));
  const height = clampNumber(heightValue, 180, 120, 420);
  return `<img src="${src}" alt="${alt}" width="280" height="${height}" style="display:block;width:100%;max-width:100%;height:${height}px;object-fit:cover;border:0;border-radius:18px;" />`;
}

function renderCardBody(props: {
  title?: BlockPropValue;
  description?: BlockPropValue;
  ctaLabel?: BlockPropValue;
  ctaHref?: BlockPropValue;
}) {
  const title = escapeHtml(String(props.title || "Feature title"));
  const description = escapeHtml(String(props.description || ""));
  const ctaLabel = escapeHtml(String(props.ctaLabel || ""));
  const ctaHref = escapeHtml(String(props.ctaHref || "#"));
  return `<h3 style="margin:22px 0 8px;color:#202124;font-size:22px;line-height:1.3;font-weight:500;">${title}</h3><p style="margin:0;color:#5f6368;font-size:16px;line-height:1.55;">${description}</p>${ctaLabel ? `<p style="margin:18px 0 0;"><a href="${ctaHref}" style="color:#0b57d0;font-size:16px;line-height:1.4;text-decoration:none;font-weight:500;">${ctaLabel} &rsaquo;</a></p>` : ""}`;
}

function renderImageCardHtml(node: LayoutNode) {
  const image = renderCardImage(
    node.props?.imageSrc,
    node.props?.imageAlt,
    node.props?.imageHeight,
  );
  const body = renderCardBody({
    title: node.props?.title,
    description: node.props?.description,
    ctaLabel: node.props?.ctaLabel,
    ctaHref: node.props?.ctaHref,
  });
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 30px;border-collapse:collapse;"><tr><td style="padding:0;">${image}${body}</td></tr></table>`;
}

function renderGridCardHtml(node: LayoutNode, side: "left" | "right") {
  const prefix = side === "left" ? "left" : "right";
  const image = renderCardImage(
    node.props?.[`${prefix}ImageSrc`],
    node.props?.[`${prefix}ImageAlt`],
    node.props?.imageHeight,
  );
  const body = renderCardBody({
    title: node.props?.[`${prefix}Title`],
    description: node.props?.[`${prefix}Description`],
    ctaLabel: node.props?.[`${prefix}CtaLabel`],
    ctaHref: node.props?.[`${prefix}CtaHref`],
  });
  return `${image}${body}`;
}

function renderNode(node: LayoutNode): string {
  if (node.type === "text") {
    const color = sanitizeCssValue(node.props?.color, "#334155");
    const fontSize = px(node.props?.fontSize, 16);
    const align = textAlign(node.props?.align);
    return `<p style="margin:0 0 12px;color:${color};line-height:1.5;font-size:${fontSize};text-align:${align};">${escapeHtml(String(node.props?.content || ""))}</p>`;
  }
  if (node.type === "button") {
    const label = escapeHtml(String(node.props?.label || "Open"));
    const href = escapeHtml(String(node.props?.href || "#"));
    const backgroundColor = sanitizeCssValue(
      node.props?.backgroundColor,
      "#4f46e5",
    );
    const textColor = sanitizeCssValue(node.props?.textColor, "#ffffff");
    const borderRadius = px(node.props?.borderRadius, 8);
    const padding = sanitizeCssValue(node.props?.padding, "10px 16px");
    return `<a href="${href}" style="display:inline-block;padding:${padding};background:${backgroundColor};color:${textColor};border-radius:${borderRadius};text-decoration:none;font-weight:600;">${label}</a>`;
  }
  if (node.type === "divider") {
    return '<hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;" />';
  }
  if (node.type === "image") {
    const src = escapeHtml(
      String(
        node.props?.src ||
        "https://dummyimage.com/640x220/e2e8f0/334155&text=Email+Banner",
      ),
    );
    const alt = escapeHtml(String(node.props?.alt || "Banner"));
    const rawWidth = Number(node.props?.width ?? 600);
    const width = Number.isFinite(rawWidth)
      ? Math.max(120, Math.min(1200, Math.round(rawWidth)))
      : 600;
    return `<img src="${src}" alt="${alt}" width="${width}" style="display:block;width:${width}px;max-width:100%;height:auto;border-radius:8px;margin:0 0 12px;" />`;
  }
  if (node.type === "imageCard") {
    return renderImageCardHtml(node);
  }
  if (node.type === "html") {
    return String(node.props?.html || "");
  }
  if (node.type === "qrcode") {
    const value = node.props?.value || "";
    const title = escapeHtml(String(node.props?.title || "QR Code"));
    const caption = escapeHtml(String(node.props?.caption || ""));
    const size = clampQrSize(node.props?.size, 220);
    const src = buildQrUrl(value, size);
    return `<div style="margin:0 0 14px;border:1px solid #dbeafe;background:#f8fbff;border-radius:16px;padding:18px;text-align:center;"><div style="margin-bottom:10px;color:#334155;font-weight:700;font-size:18px;">${title}</div><img src="${src}" alt="QR code" width="${size}" height="${size}" style="display:block;margin:0 auto;width:${size}px;height:${size}px;max-width:100%;" />${caption ? `<div style="margin-top:10px;color:#64748b;font-size:13px;">${caption}</div>` : ""}</div>`;
  }
  if (node.type === "columns") {
    const gap = px(node.props?.gap, 16);
    const color = sanitizeCssValue(node.props?.color, "#334155");
    const left = escapeHtml(String(node.props?.leftContent || ""));
    const right = escapeHtml(String(node.props?.rightContent || ""));
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;border-collapse:separate;border-spacing:${gap} 0;"><tr><td valign="top" width="50%" style="color:${color};line-height:1.5;">${left}</td><td valign="top" width="50%" style="color:${color};line-height:1.5;">${right}</td></tr></table>`;
  }
  if (node.type === "twoColumnGrid") {
    const gap = clampNumber(node.props?.gap, 24, 0, 80);
    const left = renderGridCardHtml(node, "left");
    const right = renderGridCardHtml(node, "right");
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 34px;border-collapse:collapse;"><tr><td class="stack-column" valign="top" width="50%" style="width:50%;padding:0 ${Math.ceil(gap / 2)}px 0 0;">${left}</td><td class="stack-column stack-column--last" valign="top" width="50%" style="width:50%;padding:0 0 0 ${Math.floor(gap / 2)}px;">${right}</td></tr></table>`;
  }
  const children = (node.children || []).map((child) => renderNode(child)).join("");
  return `<section style="padding:12px 0;">${children}</section>`;
}

const renderedHtml = computed(() => {
  if (!parsedLayout.value?.root) {
    return "<html><body><p>Invalid layout JSON</p></body></html>";
  }
  const body = renderNode(parsedLayout.value.root);
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media only screen and (max-width:640px){.email-container{width:100% !important;}.email-inner{padding:28px 20px !important;}.stack-column{display:block !important;width:100% !important;padding:0 0 30px 0 !important;}.stack-column--last{padding-bottom:0 !important;}}</style></head><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;"><center style="width:100%;background:#f8fafc;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tr><td align="center" style="padding:36px 16px;"><table role="presentation" class="email-container" width="720" cellspacing="0" cellpadding="0" style="width:720px;max-width:720px;background:#ffffff;border-left:1px solid #e0e3eb;border-right:1px solid #e0e3eb;border-collapse:collapse;"><tr><td class="email-inner" style="padding:32px 34px 54px;">${body}</td></tr></table></td></tr></table></center></body></html>`;
});

function renderTextNode(node: LayoutNode): string {
  if (node.type === "text") return String(node.props?.content || "");
  if (node.type === "button") {
    return `[${node.props?.label || "Open"}] ${node.props?.href || ""}`;
  }
  if (node.type === "divider") return "------------------------------";
  if (node.type === "image") return `[Image] ${node.props?.alt || ""}`;
  if (node.type === "imageCard") {
    return `${node.props?.title || ""}\n${node.props?.description || ""}\n${node.props?.ctaHref || ""}`.trim();
  }
  if (node.type === "html") return stripHtmlText(String(node.props?.html || ""));
  if (node.type === "qrcode") {
    return `[QR Code] ${node.props?.title || ""} ${node.props?.value || ""}`.trim();
  }
  if (node.type === "columns") {
    return `${node.props?.leftContent || ""}\n${node.props?.rightContent || ""}`;
  }
  if (node.type === "twoColumnGrid") {
    return [
      node.props?.leftTitle || "",
      node.props?.leftDescription || "",
      node.props?.leftCtaHref || "",
      node.props?.rightTitle || "",
      node.props?.rightDescription || "",
      node.props?.rightCtaHref || "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return (node.children || []).map((child) => renderTextNode(child)).join("\n");
}

const renderedText = computed(() => {
  if (!parsedLayout.value?.root) return "Invalid layout JSON";
  return renderTextNode(parsedLayout.value.root);
});

watch(
  canvasBlocks,
  () => {
    if (isApplyingHistory.value) return;
    syncCanvasToJson();
    pushHistory();
  },
  { deep: true },
);

applyJsonToCanvas();
pushHistory();

onMounted(() => {
  void loadDraft();
});
</script>

<style scoped>
.designer-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.designer-eyebrow {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-primary-bg-subtle);
  color: var(--color-primary-text);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.designer-header__copy {
  max-width: 720px;
}

.designer-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.meta-pill {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--color-primary-bg-soft);
  color: var(--color-primary-text);
  font-size: 13px;
  font-weight: 600;
}

.meta-pill--soft {
  background: var(--color-bg-surface-soft);
  color: var(--color-text-subtle);
  border: 1px solid var(--color-border-subtle);
}

.header-notice {
  margin-top: 12px;
}

.designer-header__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.designer-shell {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 360px;
  gap: 18px;
}

.toolbox-card,
.right-column {
  position: sticky;
  top: 18px;
  align-self: start;
}

.toolbox-section + .toolbox-section {
  margin-top: 18px;
}

.toolbox-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.toolbox-item {
  width: 100%;
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  background: var(--color-white);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 10px;
}

.toolbox-item__badge {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: var(--color-focus-ring-strong);
  color: var(--color-text-main);
}

.toolbox-item--text {
  background: var(--color-bg-surface-soft);
}

.toolbox-item--button {
  background: var(--color-primary-bg-muted);
}

.toolbox-item--image {
  background: var(--color-success-bg-soft);
}

.toolbox-item--imageCard {
  background: var(--color-primary-bg-muted);
}

.toolbox-item--html {
  background: var(--color-bg-surface-soft);
}

.toolbox-item--qrcode {
  background: var(--color-info-bg);
}

.toolbox-item--columns {
  background: var(--color-primary-bg-muted);
}

.toolbox-item--twoColumnGrid {
  background: var(--color-info-bg);
}

.toolbox-item--divider {
  background: var(--color-warning-bg-soft);
}

.toolbox-action {
  width: 100%;
  justify-content: center;
}

.toolbox-divider {
  height: 1px;
  margin: 18px 0;
  background: var(--color-border-subtle);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  border: 1px solid var(--color-border-primary-soft);
  background: var(--color-white);
  color: var(--color-primary-text);
  padding: 8px 10px;
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
}

.toolbox-note {
  margin-top: 18px;
  padding: 14px;
  border-radius: 14px;
  background: var(--color-bg-surface-soft);
  color: var(--color-text-subtle);
  font-size: 13px;
  line-height: 1.6;
}

.workspace-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workspace-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.studio-card {
  padding: 20px;
}

.studio-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.studio-subtitle {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.canvas-counter {
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--color-primary-bg-soft);
  color: var(--color-primary-text);
  font-weight: 700;
  font-size: 13px;
}

.canvas-surface {
  min-height: 520px;
  border: 1px dashed var(--color-border-primary-soft);
  border-radius: 18px;
  padding: 18px;
  background:
    linear-gradient(180deg, var(--color-surface-glass-soft), var(--color-surface-glass-subtle));
}

.designer-block-card {
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  background: var(--color-white);
  cursor: move;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.designer-block-card:hover {
  transform: translateY(-1px);
}

.designer-block-card--active {
  border-color: var(--color-primary-soft);
  box-shadow: 0 14px 30px var(--color-primary-border-soft);
}

.designer-block-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.block-type-pill {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-bg-surface-soft);
  color: var(--color-text-subtle);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.designer-block-card__summary {
  margin: 10px 0 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.block-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.block-action {
  border: 1px solid var(--color-border-subtle);
  background: var(--color-white);
  color: var(--color-text-secondary);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  cursor: pointer;
}

.block-action--danger {
  color: var(--color-danger-text);
  border-color: var(--color-border-danger-soft);
}

.empty-canvas {
  min-height: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--color-text-muted);
}

.empty-canvas h3 {
  margin: 0 0 8px;
  color: var(--color-text-main);
}

.source-card {
  padding: 18px;
}

.source-card summary {
  cursor: pointer;
  font-weight: 700;
  color: var(--color-text-main);
  margin-bottom: 14px;
}

.layout-input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  border: 1px solid var(--color-border-subtle);
  padding: 14px;
  font-size: 13px;
  background: var(--color-bg-surface-soft);
  color: var(--color-text-main);
  font-family: Consolas, "Courier New", monospace;
}

.source-note {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.source-notice {
  margin-top: 12px;
}

.schema-list {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--color-danger-text);
  line-height: 1.7;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.inspector-card,
.preview-card {
  padding: 20px;
}

.side-head {
  margin-bottom: 14px;
}

.side-copy {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.inspector-type {
  margin: 0 0 14px;
  font-weight: 700;
  color: var(--color-primary-text);
}

.inspector-type--spaced {
  margin-top: 20px;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.empty-inspector-state {
  border: 1px dashed var(--color-border-subtle);
  border-radius: 14px;
  padding: 18px;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.preview-toggle-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.preview-toggle-grid--device {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 14px;
}

.toggle-btn {
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface-soft);
  color: var(--color-text-secondary);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 600;
  cursor: pointer;
}

.toggle-btn--active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-soft));
  color: var(--color-text-on-primary);
  border-color: var(--color-transparent);
}

.preview-frame-shell {
  border: 1px solid var(--color-border-subtle);
  border-radius: 18px;
  padding: 14px;
  background: var(--color-slate-bg-muted);
}

.preview-frame-shell--mobile {
  max-width: 320px;
  margin: 0 auto;
}

.email-frame {
  width: 100%;
  min-height: 560px;
  border: none;
  border-radius: 14px;
  background: var(--color-white);
}

.preview-code {
  margin: 0;
  min-height: 420px;
  border-radius: 14px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-text-main);
  color: var(--color-slate-bg);
  padding: 14px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}

@media (max-width: 1320px) {
  .designer-shell {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .right-column {
    grid-column: 1 / -1;
    position: static;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .designer-shell {
    grid-template-columns: 1fr;
  }

  .toolbox-card,
  .right-column {
    position: static;
  }

  .right-column {
    grid-template-columns: 1fr;
  }

  .style-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .designer-header__actions,
  .workspace-toolbar,
  .toolbar-group,
  .preview-toggle-grid {
    width: 100%;
  }

  .designer-header__actions .btn,
  .toolbar-group .btn {
    flex: 1 1 100%;
    justify-content: center;
  }

  .studio-head,
  .designer-block-card__head {
    flex-direction: column;
  }

  .canvas-surface,
  .preview-code {
    min-height: 320px;
  }
}
</style>
