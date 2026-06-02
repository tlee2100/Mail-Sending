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
          <p class="side-copy">Switch view mode and device size before publishing. Click the preview to enlarge.</p>
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
          role="button"
          tabindex="0"
          title="Open larger preview"
          @click="openPreviewModal"
          @keydown.enter.prevent="openPreviewModal"
          @keydown.space.prevent="openPreviewModal"
        >
          <iframe class="email-frame" :srcdoc="renderedHtml" title="Email preview"></iframe>
          <button type="button" class="preview-zoom-hit" @click.stop="openPreviewModal">
            Click to enlarge
          </button>
        </div>
        <pre
          v-else-if="previewMode === 'html'"
          class="preview-code preview-code--clickable"
          role="button"
          tabindex="0"
          title="Open larger preview"
          @click="openPreviewModal"
          @keydown.enter.prevent="openPreviewModal"
          @keydown.space.prevent="openPreviewModal"
        >{{ renderedHtml }}</pre>
        <pre
          v-else
          class="preview-code preview-code--clickable"
          role="button"
          tabindex="0"
          title="Open larger preview"
          @click="openPreviewModal"
          @keydown.enter.prevent="openPreviewModal"
          @keydown.space.prevent="openPreviewModal"
        >{{ renderedText }}</pre>
      </article>
    </aside>
  </section>

  <Teleport to="body">
    <div
      v-if="isPreviewModalOpen"
      class="preview-modal-backdrop"
      @click.self="closePreviewModal"
    >
      <section class="preview-modal" aria-label="Large email preview">
        <header class="preview-modal__header">
          <div>
            <p class="designer-eyebrow">Preview</p>
            <h2 class="preview-modal__title">{{ previewModalTitle }}</h2>
          </div>
          <button type="button" class="preview-modal__close" @click="closePreviewModal">
            x
          </button>
        </header>

        <div class="preview-modal__toolbar">
          <div class="preview-toggle-grid preview-toggle-grid--modal">
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

          <div class="preview-toggle-grid preview-toggle-grid--device preview-toggle-grid--modal">
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
        </div>

        <div class="preview-modal__body">
          <div
            v-if="previewMode === 'email'"
            class="preview-modal__frame-shell"
            :class="{ 'preview-modal__frame-shell--mobile': previewDevice === 'mobile' }"
          >
            <iframe class="preview-modal__frame" :srcdoc="renderedHtml" title="Large email preview"></iframe>
          </div>
          <pre v-else-if="previewMode === 'html'" class="preview-modal__code">{{ renderedHtml }}</pre>
          <pre v-else class="preview-modal__code">{{ renderedText }}</pre>
        </div>
      </section>
    </div>
  </Teleport>
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

function sampleHtmlBlock(html: string): LayoutNode {
  return {
    type: "html",
    props: { html },
  };
}

function gradientBanner(
  eyebrow: string,
  title: string,
  copy: string,
  from: string,
  to: string,
  accent: string,
): LayoutNode {
  return sampleHtmlBlock(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 26px;border-collapse:collapse;"><tr><td style="padding:30px 28px;border-radius:24px;background:linear-gradient(135deg,${from},${to});color:#ffffff;"><div style="display:inline-block;margin:0 0 14px;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,0.18);color:${accent};font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;">${eyebrow}</div><h2 style="margin:0 0 10px;color:#ffffff;font-size:34px;line-height:1.14;font-weight:800;">${title}</h2><p style="margin:0;color:rgba(255,255,255,0.88);font-size:16px;line-height:1.6;">${copy}</p></td></tr></table>`,
  );
}

function statStrip(
  left: string,
  center: string,
  right: string,
  bg: string,
  border: string,
): LayoutNode {
  return sampleHtmlBlock(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border-collapse:separate;border-spacing:10px 0;"><tr><td width="33.33%" style="padding:16px;border:1px solid ${border};border-radius:18px;background:${bg};color:#111827;font-size:14px;line-height:1.5;"><strong style="display:block;margin-bottom:5px;font-size:18px;">${left.split("|")[0]}</strong>${left.split("|")[1] || ""}</td><td width="33.33%" style="padding:16px;border:1px solid ${border};border-radius:18px;background:${bg};color:#111827;font-size:14px;line-height:1.5;"><strong style="display:block;margin-bottom:5px;font-size:18px;">${center.split("|")[0]}</strong>${center.split("|")[1] || ""}</td><td width="33.33%" style="padding:16px;border:1px solid ${border};border-radius:18px;background:${bg};color:#111827;font-size:14px;line-height:1.5;"><strong style="display:block;margin-bottom:5px;font-size:18px;">${right.split("|")[0]}</strong>${right.split("|")[1] || ""}</td></tr></table>`,
  );
}

function colorCallout(
  title: string,
  copy: string,
  bg: string,
  border: string,
  color = "#111827",
): LayoutNode {
  return sampleHtmlBlock(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;border-collapse:collapse;"><tr><td style="padding:20px 22px;border-radius:20px;border:1px solid ${border};background:${bg};"><h3 style="margin:0 0 8px;color:${color};font-size:20px;line-height:1.25;">${title}</h3><p style="margin:0;color:${color};opacity:.82;font-size:15px;line-height:1.6;">${copy}</p></td></tr></table>`,
  );
}

function glowDivider(label: string, from: string, to: string): LayoutNode {
  return sampleHtmlBlock(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:30px 0;border-collapse:collapse;"><tr><td style="height:1px;background:linear-gradient(90deg,transparent,${from},${to},transparent);"></td></tr><tr><td align="center" style="padding:10px 0 0;"><span style="display:inline-block;padding:7px 12px;border-radius:999px;background:#ffffff;border:1px solid ${from};color:#111827;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;">${label}</span></td></tr></table>`,
  );
}

function timelineBlock(
  title: string,
  one: string,
  two: string,
  three: string,
  accent: string,
  bg: string,
): LayoutNode {
  return sampleHtmlBlock(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border-collapse:collapse;"><tr><td style="padding:22px;border-radius:24px;background:${bg};border:1px solid ${accent};"><h3 style="margin:0 0 16px;color:#111827;font-size:22px;line-height:1.25;">${title}</h3><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tr><td valign="top" width="32" style="padding:0 12px 14px 0;"><span style="display:inline-block;width:28px;height:28px;border-radius:999px;background:${accent};color:#ffffff;text-align:center;line-height:28px;font-weight:800;">1</span></td><td style="padding:1px 0 14px;color:#334155;font-size:15px;line-height:1.55;">${one}</td></tr><tr><td valign="top" width="32" style="padding:0 12px 14px 0;"><span style="display:inline-block;width:28px;height:28px;border-radius:999px;background:${accent};color:#ffffff;text-align:center;line-height:28px;font-weight:800;">2</span></td><td style="padding:1px 0 14px;color:#334155;font-size:15px;line-height:1.55;">${two}</td></tr><tr><td valign="top" width="32" style="padding:0 12px 0 0;"><span style="display:inline-block;width:28px;height:28px;border-radius:999px;background:${accent};color:#ffffff;text-align:center;line-height:28px;font-weight:800;">3</span></td><td style="padding:1px 0 0;color:#334155;font-size:15px;line-height:1.55;">${three}</td></tr></table></td></tr></table>`,
  );
}

function progressBars(
  title: string,
  first: string,
  second: string,
  third: string,
  accent: string,
): LayoutNode {
  const rows = [first, second, third]
    .map((item) => {
      const [label, value, width] = item.split("|");
      return `<tr><td style="padding:10px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tr><td style="padding:0 0 7px;color:#111827;font-size:14px;font-weight:700;">${label}</td><td align="right" style="padding:0 0 7px;color:${accent};font-size:13px;font-weight:800;">${value}</td></tr><tr><td colspan="2" style="height:10px;border-radius:999px;background:#e5e7eb;overflow:hidden;"><div style="width:${width};height:10px;border-radius:999px;background:linear-gradient(90deg,${accent},#22d3ee);"></div></td></tr></table></td></tr>`;
    })
    .join("");
  return sampleHtmlBlock(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border-collapse:collapse;"><tr><td style="padding:22px;border-radius:22px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 18px 40px rgba(15,23,42,.08);"><h3 style="margin:0 0 8px;color:#111827;font-size:21px;">${title}</h3><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${rows}</table></td></tr></table>`,
  );
}

function quoteBlock(
  quote: string,
  author: string,
  bg: string,
  accent: string,
): LayoutNode {
  return sampleHtmlBlock(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border-collapse:collapse;"><tr><td style="padding:24px;border-radius:24px;background:${bg};border-left:6px solid ${accent};"><div style="font-size:34px;line-height:1;color:${accent};font-weight:900;">"</div><p style="margin:0 0 14px;color:#111827;font-size:18px;line-height:1.55;font-weight:650;">${quote}</p><p style="margin:0;color:#64748b;font-size:14px;line-height:1.5;">${author}</p></td></tr></table>`,
  );
}

function featureMatrix(
  title: string,
  left: string,
  center: string,
  right: string,
  accent: string,
): LayoutNode {
  return sampleHtmlBlock(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 30px;border-collapse:collapse;"><tr><td style="padding:24px;border-radius:24px;background:linear-gradient(180deg,#ffffff,#f8fafc);border:1px solid #e5e7eb;"><h3 style="margin:0 0 16px;color:#111827;font-size:22px;">${title}</h3><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:10px;"><tr><td valign="top" width="33.33%" style="padding:16px;border-radius:18px;background:${accent};color:#ffffff;font-size:14px;line-height:1.5;">${left}</td><td valign="top" width="33.33%" style="padding:16px;border-radius:18px;background:#111827;color:#ffffff;font-size:14px;line-height:1.5;">${center}</td><td valign="top" width="33.33%" style="padding:16px;border-radius:18px;background:#0f766e;color:#ffffff;font-size:14px;line-height:1.5;">${right}</td></tr></table></td></tr></table>`,
  );
}

function checklistPanel(
  title: string,
  intro: string,
  one: string,
  two: string,
  three: string,
  four: string,
  accent: string,
  bg: string,
): LayoutNode {
  const items = [one, two, three, four]
    .map(
      (item) =>
        `<tr><td valign="top" width="30" style="padding:0 10px 12px 0;"><span style="display:inline-block;width:24px;height:24px;border-radius:8px;background:${accent};color:#ffffff;text-align:center;line-height:24px;font-size:12px;font-weight:900;">OK</span></td><td style="padding:1px 0 12px;color:#334155;font-size:15px;line-height:1.55;">${item}</td></tr>`,
    )
    .join("");
  return sampleHtmlBlock(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 30px;border-collapse:collapse;"><tr><td style="padding:24px;border-radius:24px;background:${bg};border:1px solid ${accent};"><h3 style="margin:0 0 8px;color:#111827;font-size:22px;">${title}</h3><p style="margin:0 0 18px;color:#475569;font-size:15px;line-height:1.6;">${intro}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${items}</table></td></tr></table>`,
  );
}

function faqPanel(
  title: string,
  q1: string,
  a1: string,
  q2: string,
  a2: string,
  q3: string,
  a3: string,
  accent: string,
): LayoutNode {
  return sampleHtmlBlock(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 30px;border-collapse:collapse;"><tr><td style="padding:24px;border-radius:24px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 18px 40px rgba(15,23,42,.07);"><h3 style="margin:0 0 16px;color:#111827;font-size:22px;">${title}</h3><div style="padding:15px 0;border-top:3px solid ${accent};"><strong style="display:block;color:#111827;font-size:15px;margin-bottom:6px;">${q1}</strong><span style="display:block;color:#475569;font-size:14px;line-height:1.6;">${a1}</span></div><div style="padding:15px 0;border-top:1px solid #e5e7eb;"><strong style="display:block;color:#111827;font-size:15px;margin-bottom:6px;">${q2}</strong><span style="display:block;color:#475569;font-size:14px;line-height:1.6;">${a2}</span></div><div style="padding:15px 0 0;border-top:1px solid #e5e7eb;"><strong style="display:block;color:#111827;font-size:15px;margin-bottom:6px;">${q3}</strong><span style="display:block;color:#475569;font-size:14px;line-height:1.6;">${a3}</span></div></td></tr></table>`,
  );
}

function ctaBand(
  title: string,
  copy: string,
  label: string,
  href: string,
  from: string,
  to: string,
): LayoutNode {
  return sampleHtmlBlock(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 30px;border-collapse:collapse;"><tr><td style="padding:26px;border-radius:26px;background:linear-gradient(135deg,${from},${to});color:#ffffff;text-align:center;"><h3 style="margin:0 0 10px;color:#ffffff;font-size:26px;line-height:1.2;">${title}</h3><p style="margin:0 auto 18px;max-width:560px;color:rgba(255,255,255,.86);font-size:15px;line-height:1.65;">${copy}</p><a href="${href}" style="display:inline-block;padding:13px 22px;border-radius:999px;background:#ffffff;color:${from};font-weight:900;text-decoration:none;font-size:14px;">${label}</a></td></tr></table>`,
  );
}

const samples: Record<SampleKey, { root: LayoutNode }> = {
  aiShowcase: {
    root: {
      type: "section",
      children: [
        gradientBanner(
          "AI launch kit",
          "Create smarter campaigns in minutes",
          "A colorful starter email for teams using AI to plan, write, design, and review campaign performance.",
          "#2563eb",
          "#9333ea",
          "#dbeafe",
        ),
        {
          type: "image",
          props: {
            src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80",
            alt: "AI workspace dashboard with automation insights",
            width: "720",
          },
        },
        {
          type: "text",
          props: {
            content: "Your AI-powered workspace is ready, {{name}}",
            fontSize: "32",
            color: "#202124",
            align: "center",
          },
        },
        {
          type: "text",
          props: {
            content:
              "Bring campaign planning, content drafting, visual generation, and performance review into one faster workflow built for {{company}}.",
            fontSize: "17",
            color: "#5f6368",
            align: "center",
          },
        },
        {
          type: "button",
          props: {
            label: "Open AI Workspace",
            href: "https://example.com/ai-workspace",
            backgroundColor: "#1a73e8",
            textColor: "#ffffff",
            borderRadius: "999",
            padding: "13px 24px",
          },
        },
        statStrip(
          "4x|Faster campaign planning",
          "12+|Reusable AI prompts",
          "1 place|Brief, assets, and review",
          "#eef2ff",
          "#c7d2fe",
        ),
        glowDivider("AI workflow", "#6366f1", "#22d3ee"),
        timelineBlock(
          "A deeper campaign workflow",
          "Start with a single product brief and let AI turn it into audience angles, subject lines, and a first-pass email structure.",
          "Generate hero visuals, benefit cards, and customer-specific talking points that still match your brand voice.",
          "Review the final campaign with performance predictions, QA notes, and a reusable checklist for the next send.",
          "#6366f1",
          "#f5f3ff",
        ),
        { type: "divider" },
        {
          type: "text",
          props: {
            content: "What you can build this week",
            fontSize: "22",
            color: "#202124",
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
        featureMatrix(
          "What makes this template stronger",
          "<strong>Creative</strong><br/>Hero image, benefit cards, and modular copy blocks are already staged.",
          "<strong>Operational</strong><br/>The campaign can become a launch, nurture, or renewal email by changing only a few sections.",
          "<strong>Measurable</strong><br/>CTA, supporting links, and next-step prompts are separated for cleaner reporting.",
          "#4f46e5",
        ),
        quoteBlock(
          "The best AI email does not feel automated. It feels prepared, relevant, and easy to act on.",
          "Campaign strategy note",
          "#eef2ff",
          "#6366f1",
        ),
        checklistPanel(
          "Pre-send AI quality checklist",
          "Use this section as a final QA pass before the campaign goes to customers.",
          "Confirm the hero promise matches one real customer pain point for {{company}}.",
          "Replace generic AI claims with specific workflow outcomes and time savings.",
          "Check every CTA destination and make sure each link has a clear analytics label.",
          "Keep one human review step for brand voice, compliance, and customer context.",
          "#6366f1",
          "#f8fafc",
        ),
        faqPanel(
          "Questions readers may have",
          "Will this replace my team?",
          "No. Position the AI workspace as a multiplier for planning, drafting, and review, not a replacement for judgment.",
          "Can I keep our brand voice?",
          "Yes. Add a brand brief, approved examples, and reusable prompt patterns before generating campaign assets.",
          "What should I try first?",
          "Start with one announcement email and compare the draft against your usual production workflow.",
          "#6366f1",
        ),
        {
          type: "columns",
          props: {
            leftContent: "Included in your workspace: brand-safe prompts, reusable email blocks, campaign summaries, and AI image assets.",
            rightContent: "Recommended next step: create one product announcement, one nurture email, and one social teaser from the same brief.",
            gap: "24",
            color: "#3c4043",
          },
        },
        colorCallout(
          "Designer tip",
          "Swap the images, update the benefit cards, and keep the final footer for compliance.",
          "#f5f3ff",
          "#ddd6fe",
          "#4c1d95",
        ),
        ctaBand(
          "Turn this into your next AI campaign",
          "Keep the structure, personalize the examples, and publish a polished announcement without rebuilding the layout.",
          "Customize AI Campaign",
          "https://example.com/ai-workspace",
          "#4f46e5",
          "#06b6d4",
        ),
        {
          type: "text",
          props: {
            content: "You are receiving this because {{email}} is connected to {{company}}. Unsubscribe: {{unsubscribe_url}}",
            fontSize: "12",
            color: "#80868b",
            align: "center",
          },
        },
      ],
    },
  },
  welcome: {
    root: {
      type: "section",
      children: [
        gradientBanner(
          "Welcome sequence",
          "A polished first impression",
          "Use a warm hero, a clear setup checklist, and one primary action to guide new users.",
          "#0891b2",
          "#2563eb",
          "#cffafe",
        ),
        {
          type: "image",
          props: {
            src: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80",
            alt: "Team planning a customer onboarding workflow",
            width: "720",
          },
        },
        {
          type: "text",
          props: {
            content: "Welcome to ChadMailer, {{name}}",
            fontSize: "32",
            color: "#111827",
            align: "center",
          },
        },
        {
          type: "text",
          props: {
            content:
              "Your workspace is ready. Use this short checklist to send your first polished campaign with confidence.",
            fontSize: "16",
            color: "#4b5563",
            align: "center",
          },
        },
        {
          type: "twoColumnGrid",
          props: {
            leftImageSrc:
              "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80",
            leftImageAlt: "People organizing contacts",
            leftTitle: "1. Import contacts",
            leftDescription:
              "Upload your list, map custom fields, and organize recipients with tags for more relevant targeting.",
            leftCtaLabel: "Import contacts",
            leftCtaHref: "https://example.com/contacts",
            rightImageSrc:
              "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
            rightImageAlt: "Email template design on a laptop",
            rightTitle: "2. Design your email",
            rightDescription:
              "Start from a shared template, personalize copy, and preview desktop and mobile output before sending.",
            rightCtaLabel: "Open designer",
            rightCtaHref: "https://example.com/templates",
            gap: "26",
            imageHeight: "170",
          },
        },
        statStrip(
          "Step 1|Import contacts",
          "Step 2|Choose a design",
          "Step 3|Send and learn",
          "#ecfeff",
          "#a5f3fc",
        ),
        glowDivider("Onboarding path", "#06b6d4", "#2563eb"),
        timelineBlock(
          "The first 24 hours",
          "Set up your sender identity, import the highest-quality contact list first, and keep segmentation simple.",
          "Design one welcome email with a clear promise, one useful resource, and one primary call to action.",
          "Send to a small test segment, review clicks and replies, then expand to your full audience.",
          "#0891b2",
          "#ecfeff",
        ),
        {
          type: "imageCard",
          props: {
            imageSrc:
              "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
            imageAlt: "Campaign analytics dashboard",
            title: "3. Track every result",
            description:
              "Review delivery, opens, clicks, replies, and unsubscribes from a single campaign dashboard after launch.",
            ctaLabel: "View dashboard",
            ctaHref: "https://example.com/dashboard",
            imageHeight: "210",
          },
        },
        progressBars(
          "Setup confidence",
          "Contacts imported|Ready|88%",
          "Template customized|In progress|64%",
          "First campaign launched|Next step|38%",
          "#0891b2",
        ),
        quoteBlock(
          "A welcome email should not explain everything. It should make the next step feel obvious.",
          "Onboarding best practice",
          "#f0fdfa",
          "#0891b2",
        ),
        checklistPanel(
          "What to personalize before sending",
          "A welcome message feels stronger when it reflects the user's first job to be done.",
          "Mention the workspace, plan, or company name so the email feels connected to signup intent.",
          "Swap the dashboard screenshot with a product area that matches the user's first action.",
          "Keep the first CTA focused on setup, not a broad product tour.",
          "Add one support path so new users know where to ask for help.",
          "#0891b2",
          "#ecfeff",
        ),
        faqPanel(
          "Onboarding objections to answer",
          "What if I do not have contacts ready?",
          "Invite users to start with a small CSV or create a test contact so they can preview the workflow.",
          "What if I am not ready to send?",
          "Encourage saving a draft and previewing across devices before launching.",
          "What should I measure first?",
          "Recommend delivery, clicks, replies, and unsubscribes instead of only open rate.",
          "#0891b2",
        ),
        {
          type: "button",
          props: {
            label: "Start My First Campaign",
            href: "https://example.com/dashboard",
            backgroundColor: "#2563eb",
            textColor: "#ffffff",
            borderRadius: "10",
            padding: "13px 22px",
          },
        },
        {
          type: "text",
          props: {
            content: "Need help? Reply to this email and our onboarding team will guide you through setup.",
            fontSize: "13",
            color: "#6b7280",
            align: "center",
          },
        },
        ctaBand(
          "Build your first complete email",
          "Use the checklist, keep the layout simple, and send a small test campaign before scaling.",
          "Open Setup Checklist",
          "https://example.com/dashboard",
          "#0891b2",
          "#2563eb",
        ),
      ],
    },
  },
  promo: {
    root: {
      type: "section",
      children: [
        gradientBanner(
          "Limited-time deal",
          "A bolder promotion layout",
          "High contrast colors, a clear discount, and scannable benefits make the offer easier to act on.",
          "#dc2626",
          "#f97316",
          "#fee2e2",
        ),
        {
          type: "text",
          props: {
            content: "Private offer for {{name}}",
            fontSize: "16",
            color: "#dc2626",
            align: "center",
          },
        },
        {
          type: "text",
          props: {
            content: "Save 30% on your next upgrade this week only",
            fontSize: "34",
            color: "#111827",
            align: "center",
          },
        },
        {
          type: "image",
          props: {
            src: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1400&q=80",
            alt: "Limited time online promotion",
            width: "720",
          },
        },
        {
          type: "columns",
          props: {
            leftContent: "Use code SPRING30 at checkout. Valid until Sunday at 11:59 PM.",
            rightContent: "Your current plan keeps working as usual. Upgrade only when you are ready.",
            gap: "24",
            color: "#374151",
          },
        },
        statStrip(
          "30%|This week only",
          "SPRING30|Use at checkout",
          "Sunday|Offer deadline",
          "#fff7ed",
          "#fed7aa",
        ),
        progressBars(
          "Why customers upgrade now",
          "Need stronger reporting|High|82%",
          "Need team approvals|Medium|61%",
          "Need reusable templates|High|77%",
          "#dc2626",
        ),
        {
          type: "twoColumnGrid",
          props: {
            leftImageSrc:
              "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
            leftImageAlt: "Analytics charts",
            leftTitle: "More campaign analytics",
            leftDescription:
              "Understand opens, clicks, engagement trends, and delivery quality across every send.",
            leftCtaLabel: "Compare plans",
            leftCtaHref: "https://example.com/plans",
            rightImageSrc:
              "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
            rightImageAlt: "Marketing team collaboration",
            rightTitle: "Better team workflows",
            rightDescription:
              "Share templates, approve content, and reuse high-performing blocks across campaigns.",
            rightCtaLabel: "See team features",
            rightCtaHref: "https://example.com/team",
            gap: "26",
            imageHeight: "170",
          },
        },
        glowDivider("Offer stack", "#dc2626", "#f97316"),
        featureMatrix(
          "What the upgrade unlocks",
          "<strong>Advanced insights</strong><br/>See campaign quality beyond opens with click depth and reply signals.",
          "<strong>Team control</strong><br/>Keep approvals, ownership, and template reuse in one workflow.",
          "<strong>Faster launches</strong><br/>Ship campaign variants without rebuilding the same layout every time.",
          "#dc2626",
        ),
        colorCallout(
          "Recommended subject line",
          "Your private 30% upgrade offer ends Sunday",
          "#fff1f2",
          "#fecdd3",
          "#991b1b",
        ),
        checklistPanel(
          "Promotion readiness checklist",
          "Use this before launching to make the offer clearer and easier to trust.",
          "State who the offer is for and why they are receiving it.",
          "Repeat the promo code near the CTA and in the checkout destination.",
          "Add one trust-building line that says existing service will not be interrupted.",
          "Keep the deadline visible in the hero, the offer strip, and the closing CTA.",
          "#dc2626",
          "#fff7ed",
        ),
        faqPanel(
          "Offer questions to handle",
          "Does the discount apply automatically?",
          "No. Customers should use SPRING30 at checkout unless the upgrade page applies it for them.",
          "Can customers keep their current plan?",
          "Yes. Make it clear the offer is optional and current service continues as normal.",
          "Why upgrade now?",
          "Tie the discount to concrete improvements: analytics, approvals, shared templates, and faster launches.",
          "#dc2626",
        ),
        ctaBand(
          "Make the deadline impossible to miss",
          "Close the email with one clean CTA, one code reminder, and one reason to act today.",
          "Apply SPRING30",
          "https://example.com/promo",
          "#dc2626",
          "#f97316",
        ),
        {
          type: "button",
          props: {
            label: "Claim 30% Discount",
            href: "https://example.com/promo",
            backgroundColor: "#dc2626",
            textColor: "#ffffff",
            borderRadius: "999",
            padding: "14px 26px",
          },
        },
      ],
    },
  },
  invoice: {
    root: {
      type: "section",
      children: [
        gradientBanner(
          "Billing reminder",
          "Keep service active",
          "A calm payment email with clear invoice details, secure payment options, and a QR shortcut.",
          "#0f766e",
          "#14b8a6",
          "#ccfbf1",
        ),
        {
          type: "text",
          props: {
            content: "Payment reminder for invoice {{orderId}}",
            fontSize: "28",
            color: "#111827",
            align: "left",
          },
        },
        {
          type: "text",
          props: {
            content:
              "Hi {{name}}, this is a friendly reminder that your invoice for {{amount}} is due soon. Paying on time keeps your account active without interruption.",
            fontSize: "16",
            color: "#4b5563",
            align: "left",
          },
        },
        {
          type: "columns",
          props: {
            leftContent: "Invoice: {{orderId}}\nAmount due: {{amount}}\nBilling email: {{email}}",
            rightContent: "Due date: In 2 days\nStatus: Awaiting payment\nSupport: billing@example.com",
            gap: "30",
            color: "#374151",
          },
        },
        colorCallout(
          "Payment summary",
          "Invoice {{orderId}} is linked to {{email}}. Complete payment before the due date to avoid service interruption.",
          "#ecfdf5",
          "#99f6e4",
          "#064e3b",
        ),
        timelineBlock(
          "What happens next",
          "Payment is processed through a secure checkout connected to your billing email.",
          "Your receipt is sent automatically, and the invoice status updates in your workspace.",
          "If payment fails, your team gets a final reminder before any account changes happen.",
          "#0f766e",
          "#ecfdf5",
        ),
        progressBars(
          "Billing status",
          "Invoice generated|Complete|100%",
          "Payment received|Pending|45%",
          "Service continuity|Protected|90%",
          "#0f766e",
        ),
        {
          type: "qrcode",
          props: {
            value: "https://example.com/billing/pay?invoice={{orderId}}&email={{email}}",
            title: "Scan to pay securely",
            caption: "You can also use the payment button below.",
            size: "190",
          },
        },
        quoteBlock(
          "Clear billing emails reduce support tickets because customers can see the amount, deadline, and next step immediately.",
          "Finance operations note",
          "#f0fdfa",
          "#0f766e",
        ),
        checklistPanel(
          "Billing clarity checklist",
          "A payment email should reduce anxiety while still making the deadline clear.",
          "Show invoice ID, amount, due date, and billing email in a scannable area.",
          "Provide both a button and QR code for customers who switch devices.",
          "Explain what happens after payment so customers know the status will update.",
          "Add a calm fallback note for customers who already paid.",
          "#0f766e",
          "#ecfdf5",
        ),
        faqPanel(
          "Payment support details",
          "What if the payment already happened?",
          "Tell customers that processing may take a short time and the reminder can be ignored if paid.",
          "What if the QR code does not work?",
          "Provide the payment button as the primary fallback and include a support contact.",
          "What if the invoice amount is wrong?",
          "Direct customers to billing support before asking them to complete the payment.",
          "#0f766e",
        ),
        ctaBand(
          "Keep your account uninterrupted",
          "Complete payment now or contact billing support if anything looks incorrect.",
          "Review Billing Details",
          "https://example.com/billing",
          "#0f766e",
          "#14b8a6",
        ),
        {
          type: "button",
          props: {
            label: "Pay Invoice",
            href: "https://example.com/billing",
            backgroundColor: "#0f766e",
            textColor: "#ffffff",
            borderRadius: "10",
            padding: "13px 22px",
          },
        },
        {
          type: "text",
          props: {
            content:
              "If you already paid, thank you. This message may have been sent before the payment finished processing.",
            fontSize: "13",
            color: "#6b7280",
            align: "left",
          },
        },
      ],
    },
  },
  newsletter: {
    root: {
      type: "section",
      children: [
        gradientBanner(
          "Weekly digest",
          "Ideas worth saving",
          "A magazine-style newsletter with a featured story, quick reads, and a bright editorial rhythm.",
          "#4f46e5",
          "#06b6d4",
          "#e0e7ff",
        ),
        {
          type: "image",
          props: {
            src: "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=80",
            alt: "Curated weekly newsletter reading desk",
            width: "720",
          },
        },
        {
          type: "text",
          props: {
            content: "This week in growth marketing",
            fontSize: "32",
            color: "#111827",
            align: "left",
          },
        },
        {
          type: "text",
          props: {
            content:
              "A short, useful roundup for {{company}}: deliverability shifts, campaign ideas, and customer lifecycle examples worth saving.",
            fontSize: "16",
            color: "#4b5563",
            align: "left",
          },
        },
        {
          type: "imageCard",
          props: {
            imageSrc:
              "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
            imageAlt: "Marketing analytics dashboard",
            title: "Feature story: the 3 metrics worth checking before every send",
            description:
              "Open rate alone is not enough. This guide shows how delivery rate, click distribution, and reply quality help you improve the next campaign.",
            ctaLabel: "Read the guide",
            ctaHref: "https://example.com/newsletter/metrics",
            imageHeight: "220",
          },
        },
        statStrip(
          "1 guide|Better metrics",
          "2 ideas|Lifecycle plays",
          "1 story|Customer spotlight",
          "#eef2ff",
          "#c7d2fe",
        ),
        glowDivider("Editor's picks", "#4f46e5", "#06b6d4"),
        timelineBlock(
          "How to use this issue",
          "Read the featured metric guide first and choose one reporting habit to test this week.",
          "Save the lifecycle idea and adapt it to a segment that already shows buying intent.",
          "Forward the customer story to your team if you need a practical example for template governance.",
          "#4f46e5",
          "#eef2ff",
        ),
        {
          type: "twoColumnGrid",
          props: {
            leftImageSrc:
              "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80",
            leftImageAlt: "Team discussing customer lifecycle",
            leftTitle: "Lifecycle idea",
            leftDescription:
              "Send a 3-part onboarding sequence that teaches one product outcome per email instead of listing features.",
            leftCtaLabel: "See sequence",
            leftCtaHref: "https://example.com/newsletter/lifecycle",
            rightImageSrc:
              "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
            rightImageAlt: "Customer story workspace",
            rightTitle: "Customer spotlight",
            rightDescription:
              "How a small SaaS team reduced manual follow-up by pairing tags with reusable email templates.",
            rightCtaLabel: "Read story",
            rightCtaHref: "https://example.com/newsletter/customer",
            gap: "26",
            imageHeight: "170",
          },
        },
        featureMatrix(
          "Newsletter content map",
          "<strong>Learn</strong><br/>A practical guide with one measurable takeaway.",
          "<strong>Apply</strong><br/>A lifecycle play your team can build in the next campaign.",
          "<strong>Share</strong><br/>A customer example that makes the strategy easier to explain.",
          "#4f46e5",
        ),
        quoteBlock(
          "A useful newsletter earns attention by helping readers make one better decision before the week ends.",
          "Editorial principle",
          "#eef2ff",
          "#4f46e5",
        ),
        checklistPanel(
          "Editorial polish checklist",
          "Use this checklist to keep a long newsletter easy to scan instead of overwhelming.",
          "Put the most actionable article first and make its value clear in the first sentence.",
          "Balance one educational story, one practical example, and one customer proof point.",
          "Use short section titles so readers can skim on mobile.",
          "End with preference management to keep the list healthy.",
          "#4f46e5",
          "#eef2ff",
        ),
        faqPanel(
          "Reader questions this issue answers",
          "What should I improve before my next send?",
          "The metrics guide explains which signals to review before changing subject lines or copy.",
          "What can I try this week?",
          "The lifecycle play gives a simple onboarding sequence that can be adapted quickly.",
          "Why should my team care?",
          "The customer story shows the operational impact of tags, templates, and shared approvals.",
          "#4f46e5",
        ),
        ctaBand(
          "Save this issue for your next planning session",
          "Forward it to your campaign team and use the content map as a lightweight meeting agenda.",
          "Read the Full Digest",
          "https://example.com/news",
          "#4f46e5",
          "#06b6d4",
        ),
        {
          type: "button",
          props: {
            label: "Read Full Newsletter",
            href: "https://example.com/news",
            backgroundColor: "#4f46e5",
            textColor: "#ffffff",
            borderRadius: "10",
            padding: "13px 22px",
          },
        },
        {
          type: "text",
          props: {
            content: "You are subscribed as {{email}}. Manage preferences or unsubscribe: {{unsubscribe_url}}",
            fontSize: "12",
            color: "#6b7280",
            align: "center",
          },
        },
      ],
    },
  },
  launch: {
    root: {
      type: "section",
      children: [
        gradientBanner(
          "Product launch",
          "Make the announcement feel premium",
          "A colorful launch email with hero media, feature cards, social proof, and one focused CTA.",
          "#0f172a",
          "#7c3aed",
          "#ede9fe",
        ),
        {
          type: "image",
          props: {
            src: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80",
            alt: "Modern product launch scene",
            width: "720",
          },
        },
        {
          type: "text",
          props: {
            content: "Introducing NovaSend 2.0",
            fontSize: "34",
            color: "#0f172a",
            align: "center",
          },
        },
        {
          type: "text",
          props: {
            content:
              "A faster way for {{company}} to design, approve, send, and learn from every customer email.",
            fontSize: "17",
            color: "#475569",
            align: "center",
          },
        },
        { type: "divider" },
        {
          type: "twoColumnGrid",
          props: {
            leftImageSrc:
              "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
            leftImageAlt: "Automation dashboard",
            leftTitle: "Visual automations",
            leftDescription:
              "Build welcome, win-back, billing, and announcement flows with fewer manual steps.",
            leftCtaLabel: "Explore automations",
            leftCtaHref: "https://example.com/launch/automations",
            rightImageSrc:
              "https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=900&q=80",
            rightImageAlt: "Content approval board",
            rightTitle: "Approval workflows",
            rightDescription:
              "Keep brand, legal, and marketing teams aligned before the email reaches customers.",
            rightCtaLabel: "See approvals",
            rightCtaHref: "https://example.com/launch/approvals",
            gap: "26",
            imageHeight: "170",
          },
        },
        statStrip(
          "New|Visual automations",
          "Faster|Approval flows",
          "Live|Campaign insights",
          "#f8fafc",
          "#cbd5e1",
        ),
        glowDivider("Launch narrative", "#0f172a", "#7c3aed"),
        timelineBlock(
          "Launch story arc",
          "Lead with the customer problem: teams lose speed when campaign design, approval, and reporting are disconnected.",
          "Show the transformation: reusable blocks, visual approvals, and live analytics turn each campaign into a repeatable system.",
          "Close with proof: invite readers to watch a demo, compare workflows, or open the new product experience.",
          "#7c3aed",
          "#f5f3ff",
        ),
        {
          type: "imageCard",
          props: {
            imageSrc:
              "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
            imageAlt: "Product launch team presentation",
            title: "Built for faster campaign teams",
            description:
              "Reusable blocks, shared templates, version history, and live previews help your team move from idea to published campaign faster.",
            ctaLabel: "Watch launch demo",
            ctaHref: "https://example.com/launch/demo",
            imageHeight: "220",
          },
        },
        featureMatrix(
          "Launch assets included",
          "<strong>Hero story</strong><br/>A premium announcement section that frames the product clearly.",
          "<strong>Feature proof</strong><br/>Visual cards that connect features to outcomes.",
          "<strong>Conversion path</strong><br/>Demo, feature page, and campaign follow-up CTAs are separated.",
          "#7c3aed",
        ),
        quoteBlock(
          "Great launch emails do not list features. They make the new future feel close enough to try.",
          "Product marketing note",
          "#f5f3ff",
          "#7c3aed",
        ),
        checklistPanel(
          "Launch email depth checklist",
          "A longer launch email should build momentum without turning into a changelog.",
          "Open with the problem and the new outcome, not a generic feature list.",
          "Group features by customer benefit so each section has a clear reason to exist.",
          "Use proof points, demo links, and visual cards to support the launch claim.",
          "Close with a demo CTA and a lower-friction feature page CTA for cautious readers.",
          "#7c3aed",
          "#f5f3ff",
        ),
        faqPanel(
          "Launch objections to answer",
          "Is this available now?",
          "State availability clearly and point readers to the right demo or feature page.",
          "Will existing workflows break?",
          "Explain that current templates and campaigns remain available while new workflows are added.",
          "Why should teams switch?",
          "Tie the launch to speed, approval clarity, and better reporting rather than novelty.",
          "#7c3aed",
        ),
        ctaBand(
          "See the new workflow in action",
          "A short demo helps readers understand the upgrade faster than another paragraph of feature copy.",
          "Watch Launch Demo",
          "https://example.com/launch/demo",
          "#0f172a",
          "#7c3aed",
        ),
        {
          type: "button",
          props: {
            label: "See New Features",
            href: "https://example.com/launch",
            backgroundColor: "#0f172a",
            textColor: "#ffffff",
            borderRadius: "999",
            padding: "14px 26px",
          },
        },
      ],
    },
  },
  event: {
    root: {
      type: "section",
      children: [
        gradientBanner(
          "Live event",
          "Reserve your seat",
          "A vivid invitation layout with a strong agenda, QR registration, and clear attendance details.",
          "#7c3aed",
          "#ec4899",
          "#fce7f3",
        ),
        {
          type: "image",
          props: {
            src: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1400&q=80",
            alt: "Live marketing webinar audience",
            width: "720",
          },
        },
        {
          type: "text",
          props: {
            content:
              "You are invited: Growth Marketing Webinar",
            fontSize: "32",
            color: "#111827",
            align: "center",
          },
        },
        {
          type: "text",
          props: {
            content:
              "Join us on April 12 at 10:00 AM for practical email strategies your team can apply the same day.",
            fontSize: "16",
            color: "#4b5563",
            align: "center",
          },
        },
        {
          type: "columns",
          props: {
            leftContent: "Session 1: Improve inbox placement\nSession 2: Design better lifecycle emails",
            rightContent: "Session 3: Measure campaign quality\nLive Q&A: Ask the panel your questions",
            gap: "28",
            color: "#374151",
          },
        },
        statStrip(
          "60 min|Practical sessions",
          "Live Q&A|Ask experts",
          "Replay|Sent after event",
          "#fdf2f8",
          "#fbcfe8",
        ),
        timelineBlock(
          "Event experience",
          "Before the event, registrants receive a calendar invite, agenda summary, and suggested questions to prepare.",
          "During the event, each speaker shares one framework and one campaign example that can be copied later.",
          "After the event, attendees receive the replay, slides, and a template checklist for their next send.",
          "#ec4899",
          "#fdf2f8",
        ),
        progressBars(
          "Seat availability",
          "Live seats reserved|72% full|72%",
          "Q&A slots submitted|Growing|54%",
          "Replay access|Included|100%",
          "#ec4899",
        ),
        {
          type: "qrcode",
          props: {
            value: "https://example.com/events/register?email={{email}}",
            title: "Scan to reserve your seat",
            caption: "Registration is free for ChadMailer users.",
            size: "180",
          },
        },
        quoteBlock(
          "The strongest event invite makes the value concrete before the registration button appears.",
          "Event marketing note",
          "#fdf2f8",
          "#ec4899",
        ),
        checklistPanel(
          "Event invitation checklist",
          "Use this to make the email feel useful before the reader registers.",
          "Lead with the outcome attendees will take back to their team.",
          "Show the agenda in short, practical modules rather than speaker bios only.",
          "Offer replay access to reduce hesitation from busy readers.",
          "Repeat the registration CTA after the agenda and near the closing note.",
          "#ec4899",
          "#fdf2f8",
        ),
        faqPanel(
          "Common event questions",
          "Will there be a recording?",
          "Yes. Tell readers that registering is still useful even if they cannot attend live.",
          "Who should attend?",
          "Name the role or team: campaign managers, lifecycle marketers, founders, or operators.",
          "What will I leave with?",
          "Promise a checklist, replay, or practical framework instead of only inspiration.",
          "#ec4899",
        ),
        ctaBand(
          "Bring one question to the live Q&A",
          "Register now, submit a question, and use the replay link after the session.",
          "Register for the Webinar",
          "https://example.com/events",
          "#7c3aed",
          "#ec4899",
        ),
        {
          type: "button",
          props: {
            label: "Reserve Your Seat",
            href: "https://example.com/events",
            backgroundColor: "#7c3aed",
            textColor: "#ffffff",
            borderRadius: "10",
            padding: "13px 22px",
          },
        },
        {
          type: "text",
          props: {
            content: "Can not attend live? Register anyway and we will send the recording to {{email}}.",
            fontSize: "13",
            color: "#6b7280",
            align: "center",
          },
        },
      ],
    },
  },
  reengagement: {
    root: {
      type: "section",
      children: [
        gradientBanner(
          "Win-back campaign",
          "Bring customers back with color",
          "A warm re-engagement email with saved-workspace reassurance and a time-limited comeback offer.",
          "#ea580c",
          "#facc15",
          "#ffedd5",
        ),
        {
          type: "image",
          props: {
            src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
            alt: "Warm customer return offer",
            width: "720",
          },
        },
        {
          type: "text",
          props: {
            content:
              "We saved your workspace, {{name}}",
            fontSize: "32",
            color: "#111827",
            align: "center",
          },
        },
        {
          type: "text",
          props: {
            content:
              "Your previous templates, tags, and campaign history are still here. Come back this week and save 20% on your next plan.",
            fontSize: "16",
            color: "#4b5563",
            align: "center",
          },
        },
        {
          type: "twoColumnGrid",
          props: {
            leftImageSrc:
              "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
            leftImageAlt: "Saved marketing workspace",
            leftTitle: "Pick up where you left off",
            leftDescription:
              "Continue editing saved templates and reuse the recipient tags you already created.",
            leftCtaLabel: "Open workspace",
            leftCtaHref: "https://example.com/workspace",
            rightImageSrc:
              "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
            rightImageAlt: "Discount checkout",
            rightTitle: "Comeback offer",
            rightDescription:
              "Use code COMEBACK20 before Sunday to save 20% on your next billing cycle.",
            rightCtaLabel: "Apply discount",
            rightCtaHref: "https://example.com/reactivate",
            gap: "26",
            imageHeight: "170",
          },
        },
        colorCallout(
          "Comeback code",
          "Use COMEBACK20 before Sunday and save 20% on your next billing cycle.",
          "#fff7ed",
          "#fdba74",
          "#7c2d12",
        ),
        progressBars(
          "What is waiting for you",
          "Saved templates|Still available|100%",
          "Contact tags|Ready to reuse|100%",
          "Comeback discount|Ends soon|42%",
          "#ea580c",
        ),
        timelineBlock(
          "Return in three steps",
          "Reactivate the account and keep your existing templates, contacts, and campaign history.",
          "Choose the campaign you wanted to finish and refresh the message with current offers.",
          "Send to a small reactivation segment before rolling out to the full audience.",
          "#ea580c",
          "#fff7ed",
        ),
        quoteBlock(
          "Win-back emails work best when they remind customers what they already built, not only what they can buy.",
          "Retention strategy note",
          "#fff7ed",
          "#ea580c",
        ),
        checklistPanel(
          "Win-back personalization checklist",
          "Use concrete reminders so the email feels specific instead of desperate.",
          "Reference saved templates, tags, or previous campaign history when those details are available.",
          "Show the comeback offer once near the middle and once near the CTA.",
          "Make the next step low-friction: open workspace, reactivate, or review saved assets.",
          "Give readers a preference link if they are not ready to return.",
          "#ea580c",
          "#fff7ed",
        ),
        faqPanel(
          "Reasons to return",
          "Will my previous work still be there?",
          "Yes. Position saved templates and tags as the fastest path back to value.",
          "Do I have to start with a paid plan?",
          "If your product supports it, offer a softer path like reviewing saved assets before checkout.",
          "Why now?",
          "Use the limited discount and saved work together so urgency does not feel arbitrary.",
          "#ea580c",
        ),
        ctaBand(
          "Your saved workspace is one click away",
          "Reactivate now, apply the comeback code, and finish the campaign you already started.",
          "Return to Workspace",
          "https://example.com/reactivate",
          "#ea580c",
          "#facc15",
        ),
        {
          type: "button",
          props: {
            label: "Reactivate Now",
            href: "https://example.com/reactivate",
            backgroundColor: "#ea580c",
            textColor: "#ffffff",
            borderRadius: "999",
            padding: "14px 26px",
          },
        },
        {
          type: "text",
          props: {
            content: "Not ready yet? Update your email preferences here: {{unsubscribe_url}}",
            fontSize: "12",
            color: "#6b7280",
            align: "center",
          },
        },
      ],
    },
  },
  feedback: {
    root: {
      type: "section",
      children: [
        gradientBanner(
          "Customer research",
          "Make feedback feel valuable",
          "A friendly survey email with a clear reason, colorful context, and a low-friction CTA.",
          "#2563eb",
          "#14b8a6",
          "#dbeafe",
        ),
        {
          type: "text",
          props: {
            content: "How was your experience, {{name}}?",
            fontSize: "30",
            color: "#111827",
            align: "center",
          },
        },
        {
          type: "text",
          props: {
            content:
              "Your feedback helps us improve the features your team uses most. The survey takes about two minutes.",
            fontSize: "16",
            color: "#4b5563",
            align: "center",
          },
        },
        {
          type: "image",
          props: {
            src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
            alt: "Customer feedback notes and survey planning",
            width: "720",
          },
        },
        {
          type: "columns",
          props: {
            leftContent: "Tell us what worked: template design, sending workflows, analytics, or contact management.",
            rightContent: "Tell us what felt slow: setup, approval, importing, previewing, or reporting.",
            gap: "28",
            color: "#374151",
          },
        },
        statStrip(
          "2 min|Short survey",
          "5 questions|Focused feedback",
          "Next month|Improvement summary",
          "#eff6ff",
          "#bfdbfe",
        ),
        glowDivider("Feedback loop", "#2563eb", "#14b8a6"),
        timelineBlock(
          "How your feedback is used",
          "We group responses by workflow area so product, support, and engineering can see the same customer themes.",
          "The highest-impact requests are reviewed against current roadmap work and support volume.",
          "We share a short improvement summary so customers know what changed because of their input.",
          "#2563eb",
          "#eff6ff",
        ),
        featureMatrix(
          "What we want to learn",
          "<strong>Clarity</strong><br/>Where the product feels easy, confusing, or too hidden.",
          "<strong>Speed</strong><br/>Which workflows take too many clicks or too much waiting.",
          "<strong>Trust</strong><br/>What would make your team more confident before sending.",
          "#2563eb",
        ),
        quoteBlock(
          "Specific feedback helps us fix the workflow behind the complaint, not just the screen where it appeared.",
          "Product research note",
          "#eff6ff",
          "#2563eb",
        ),
        checklistPanel(
          "Survey design checklist",
          "A feedback request gets more useful responses when readers know what kind of detail helps.",
          "Tell users how long the survey takes and what topics it covers.",
          "Ask about recent workflows instead of general satisfaction only.",
          "Promise a follow-up summary so the request feels reciprocal.",
          "Keep the CTA singular and avoid multiple competing survey links.",
          "#2563eb",
          "#eff6ff",
        ),
        faqPanel(
          "Feedback concerns to address",
          "Will my response be read?",
          "Explain that responses are grouped by workflow and reviewed by product, support, and engineering.",
          "Do I need to write a lot?",
          "Set expectations: short answers are useful when they mention the exact workflow.",
          "Will anything change?",
          "Commit to sharing a summary of themes and improvements when possible.",
          "#2563eb",
        ),
        ctaBand(
          "Help shape the next product improvements",
          "Your feedback gives the team sharper context than analytics alone can provide.",
          "Start the Survey",
          "https://example.com/feedback",
          "#2563eb",
          "#14b8a6",
        ),
        {
          type: "button",
          props: {
            label: "Give Feedback",
            href: "https://example.com/feedback",
            backgroundColor: "#2563eb",
            textColor: "#ffffff",
            borderRadius: "10",
            padding: "13px 22px",
          },
        },
        {
          type: "text",
          props: {
            content:
              "As a thank you, we will send a summary of the most requested improvements to {{email}} next month.",
            fontSize: "13",
            color: "#6b7280",
            align: "center",
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
const isPreviewModalOpen = ref(false);
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
const previewModalTitle = computed(
  () => `${previewMode.value.toUpperCase()} preview - ${previewDevice.value}`,
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

function openPreviewModal() {
  isPreviewModalOpen.value = true;
}

function closePreviewModal() {
  isPreviewModalOpen.value = false;
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

async function validateRouteTemplateId(token: string) {
  const [privateResponse, sharedResponse] = await Promise.all([
    templatesApi.listTemplates(token, { pageSize: 100 }),
    templatesApi.listSharedTemplates(token, { pageSize: 100 }),
  ]);
  const ids = [...privateResponse.data.items, ...sharedResponse.data.items]
    .map((item) => extractTemplateId(item))
    .filter(Boolean);

  if (ids.includes(templateId.value)) {
    return true;
  }

  const fallbackId = ids[0];
  if (!fallbackId) {
    requestError.value = "No templates found for your account. Create a template first.";
    return false;
  }

  await router.replace({ name: "template-designer", params: { id: fallbackId } });
  return false;
}

async function ensureCurrentTemplate(token: string) {
  if (currentTemplate.value) return currentTemplate.value;
  if (!templateId.value) return null;

  const isValidRouteTemplate = await validateRouteTemplateId(token);
  if (!isValidRouteTemplate) return null;

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
    const isValidRouteTemplate = await validateRouteTemplateId(token);
    if (!isValidRouteTemplate) return;

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

watch(templateId, (nextId, previousId) => {
  if (!previousId || nextId === previousId) return;
  currentTemplate.value = null;
  void loadDraft();
});

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
  position: relative;
  border: 1px solid var(--color-border-subtle);
  border-radius: 18px;
  padding: 14px;
  background: var(--color-slate-bg-muted);
  cursor: zoom-in;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.preview-zoom-hit {
  position: absolute;
  inset: 14px;
  z-index: 2;
  border: none;
  border-radius: 14px;
  background: var(--color-transparent);
  color: var(--color-transparent);
  cursor: zoom-in;
}

.preview-zoom-hit::after {
  content: "Click to enlarge";
  position: absolute;
  right: 12px;
  top: 12px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.preview-frame-shell:hover .preview-zoom-hit::after,
.preview-zoom-hit:focus::after {
  opacity: 1;
}

.preview-frame-shell--mobile {
  max-width: 320px;
  margin: 0 auto;
}

.preview-frame-shell:hover,
.preview-frame-shell:focus {
  border-color: var(--color-primary-soft);
  box-shadow: 0 14px 30px var(--color-primary-border-soft);
  outline: none;
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

.preview-code--clickable {
  cursor: zoom-in;
}

.preview-code--clickable:hover,
.preview-code--clickable:focus {
  border-color: var(--color-primary-soft);
  box-shadow: 0 14px 30px var(--color-primary-border-soft);
  outline: none;
}

.preview-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  padding: 24px;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-modal {
  width: min(1180px, 100%);
  max-height: calc(100vh - 48px);
  border-radius: 18px;
  background: var(--color-bg-surface-elevated);
  color: var(--color-text-main);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 28px 80px var(--shadow-modal-color);
}

.preview-modal__header,
.preview-modal__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.preview-modal__toolbar {
  align-items: center;
  flex-wrap: wrap;
  background: var(--color-bg-surface-soft);
}

.preview-modal__title {
  margin: 8px 0 0;
  color: var(--color-text-main);
  font-size: 20px;
}

.preview-modal__close {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  cursor: pointer;
  font-weight: 800;
}

.preview-toggle-grid--modal {
  width: min(360px, 100%);
  margin-bottom: 0;
}

.preview-modal__body {
  min-height: 0;
  flex: 1;
  padding: 20px;
  overflow: auto;
  background: var(--color-bg-surface);
}

.preview-modal__frame-shell {
  width: 100%;
  min-height: 72vh;
  padding: 18px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 18px;
  background: var(--color-slate-bg-muted);
  box-sizing: border-box;
}

.preview-modal__frame-shell--mobile {
  max-width: 390px;
  margin: 0 auto;
}

.preview-modal__frame {
  width: 100%;
  min-height: 72vh;
  border: none;
  border-radius: 14px;
  background: var(--color-white);
}

.preview-modal__code {
  margin: 0;
  min-height: 72vh;
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  background: var(--color-text-main);
  color: var(--color-slate-bg);
  padding: 18px;
  overflow: auto;
  font-size: 13px;
  line-height: 1.7;
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
