<template>
  <section class="content__header header-row">
    <div>
      <h1 class="page-title">Template Designer</h1>
      <p class="page-subtitle">
        Template ID: {{ route.params.id }} - layout is the source of truth for
        blocks.
      </p>
      <p v-if="requestError" class="error header-error">{{ requestError }}</p>
      <p v-else-if="requestInfo" class="note header-note">{{ requestInfo }}</p>
    </div>
    <div class="actions">
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
      <button
        type="button"
        class="btn btn--secondary"
        @click="saveDraft"
        :disabled="isRequesting || !authToken"
      >
        Save Draft
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
        @click="loadDraft"
        :disabled="isRequesting || !authToken"
      >
        GET /templates/:id/designer
      </button>
      <button
        type="button"
        class="btn btn--primary"
        @click="saveDraft"
        :disabled="isRequesting || !authToken"
      >
        PUT /templates/:id/designer
      </button>
    </div>
  </section>

  <section class="grid grid--designer">
    <article class="card panel">
      <h2 class="section-title">Drag and Drop Designer</h2>
      <div class="builder">
        <aside class="builder__palette">
          <p class="mini-title">Blocks</p>
          <button
            v-for="type in palette"
            :key="type"
            type="button"
            class="btn btn--secondary palette-item"
            draggable="true"
            @click="addBlock(type)"
            @dragstart="onPaletteDragStart(type, $event)"
          >
            + {{ type }}
          </button>
        </aside>

        <div class="builder__canvas-wrap">
          <p class="mini-title">Canvas</p>
          <div class="canvas" @dragover.prevent @drop="onCanvasDropToEnd">
            <div
              v-for="(block, index) in canvasBlocks"
              :key="block.id"
              class="canvas-block"
              :class="{ 'canvas-block--active': selectedBlockIndex === index }"
              draggable="true"
              @click="selectedBlockIndex = index"
              @dragstart="onCanvasDragStart(index, $event)"
              @dragover.prevent
              @drop="onCanvasDrop(index)"
            >
              <div class="canvas-block__head">
                <span class="canvas-block__type">{{ block.type }}</span>
                <div class="block-actions">
                  <button
                    type="button"
                    class="remove-btn"
                    @click.stop="duplicateBlock(index)"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    class="remove-btn"
                    @click.stop="removeBlock(index)"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p class="canvas-block__content">{{ blockSummary(block) }}</p>
            </div>

            <p v-if="canvasBlocks.length === 0" class="empty-canvas">
              Drop blocks here or click a block from the left panel.
            </p>
          </div>
        </div>

        <aside class="builder__inspector">
          <p class="mini-title">Inspector</p>
          <div v-if="selectedBlock" class="inspector-fields">
            <p class="inspector-type">Editing: {{ selectedBlock.type }}</p>

            <div class="input-wrap" v-if="selectedBlock.type === 'text'">
              <label>Text content</label>
              <textarea
                v-model="selectedBlock.props.content"
                rows="4"
              ></textarea>
              <div class="style-grid">
                <div class="input-wrap">
                  <label>Font size (px)</label>
                  <input
                    v-model="selectedBlock.props.fontSize"
                    type="number"
                    min="10"
                    max="72"
                  />
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
                  <input
                    v-model="selectedBlock.props.backgroundColor"
                    type="color"
                  />
                </div>
                <div class="input-wrap">
                  <label>Text color</label>
                  <input v-model="selectedBlock.props.textColor" type="color" />
                </div>
                <div class="input-wrap">
                  <label>Border radius (px)</label>
                  <input
                    v-model="selectedBlock.props.borderRadius"
                    type="number"
                    min="0"
                    max="80"
                  />
                </div>
                <div class="input-wrap">
                  <label>Padding (e.g. 10px 16px)</label>
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
            </template>

            <template v-if="selectedBlock.type === 'columns'">
              <div class="input-wrap">
                <label>Left column text</label>
                <textarea
                  v-model="selectedBlock.props.leftContent"
                  rows="3"
                ></textarea>
              </div>
              <div class="input-wrap">
                <label>Right column text</label>
                <textarea
                  v-model="selectedBlock.props.rightContent"
                  rows="3"
                ></textarea>
              </div>
              <div class="style-grid">
                <div class="input-wrap">
                  <label>Gap (px)</label>
                  <input
                    v-model="selectedBlock.props.gap"
                    type="number"
                    min="0"
                    max="80"
                  />
                </div>
                <div class="input-wrap">
                  <label>Text color</label>
                  <input v-model="selectedBlock.props.color" type="color" />
                </div>
              </div>
            </template>

            <p class="note" v-if="selectedBlock.type === 'divider'">
              Divider block has no editable fields.
            </p>

            <div
              class="var-panel"
              v-if="selectedBlock && selectedBlock.type !== 'divider'"
            >
              <p class="mini-title">Variables</p>
              <div class="var-list">
                <button
                  v-for="variable in variables"
                  :key="variable.key"
                  type="button"
                  class="btn btn--secondary var-chip"
                  @click="insertVariable(variable.token)"
                >
                  {{ variable.token }}
                </button>
              </div>
            </div>
          </div>
          <p v-else class="note">
            Select a block on canvas to edit its settings.
          </p>
        </aside>
      </div>

      <div class="actions actions--top">
        <button
          type="button"
          class="btn btn--secondary"
          @click="applyJsonToCanvas"
        >
          Apply JSON to Canvas
        </button>
        <button
          type="button"
          class="btn btn--secondary"
          @click="syncCanvasToJson"
        >
          Sync Canvas to JSON
        </button>
      </div>

      <h2 class="section-title">Layout JSON</h2>
      <div class="actions actions--top">
        <select v-model="selectedSample" class="sample-select">
          <option
            v-for="option in sampleOptions"
            :key="option.key"
            :value="option.key"
          >
            Sample: {{ option.label }}
          </option>
        </select>
        <button type="button" class="btn btn--secondary" @click="loadSample">
          Apply Sample
        </button>
      </div>
      <textarea v-model="layout" rows="14" class="layout-input"></textarea>
      <p class="note">
        If renderedHtml / renderedText is omitted, backend auto-renders from
        this layout.
      </p>
      <p v-if="layoutError" class="error">{{ layoutError }}</p>
      <ul v-if="schemaErrors.length" class="schema-list">
        <li v-for="(err, idx) in schemaErrors" :key="idx">{{ err }}</li>
      </ul>
      <div class="actions">
        <button type="button" class="btn btn--secondary">
          Override renderedHtml
        </button>
        <button type="button" class="btn btn--secondary">
          Override renderedText
        </button>
        <button
          type="button"
          class="btn btn--primary"
          @click="publishDraft"
          :disabled="isRequesting || !authToken"
        >
          Publish
        </button>
      </div>
    </article>

    <article class="card panel">
      <h2 class="section-title">Preview</h2>
      <div class="actions actions--top">
        <button
          type="button"
          class="btn"
          :class="previewMode === 'email' ? 'btn--primary' : 'btn--secondary'"
          @click="previewMode = 'email'"
        >
          Email View
        </button>
        <button
          type="button"
          class="btn"
          :class="previewMode === 'html' ? 'btn--primary' : 'btn--secondary'"
          @click="previewMode = 'html'"
        >
          HTML View
        </button>
        <button
          type="button"
          class="btn"
          :class="previewMode === 'text' ? 'btn--primary' : 'btn--secondary'"
          @click="previewMode = 'text'"
        >
          Text View
        </button>
        <button
          type="button"
          class="btn"
          :class="
            previewDevice === 'desktop' ? 'btn--primary' : 'btn--secondary'
          "
          @click="previewDevice = 'desktop'"
        >
          Desktop
        </button>
        <button
          type="button"
          class="btn"
          :class="
            previewDevice === 'mobile' ? 'btn--primary' : 'btn--secondary'
          "
          @click="previewDevice = 'mobile'"
        >
          Mobile
        </button>
      </div>

      <div
        class="preview preview--email"
        :class="{ 'preview--mobile': previewDevice === 'mobile' }"
        v-if="previewMode === 'email'"
      >
        <iframe
          class="email-frame"
          :srcdoc="renderedHtml"
          title="Email preview"
        ></iframe>
      </div>
      <pre class="preview preview--code" v-else-if="previewMode === 'html'">{{
        renderedHtml
      }}</pre>
      <pre class="preview preview--code" v-else>{{ renderedText }}</pre>

      <div class="hint-list">
        <p class="hint">
          Create sample quickly: choose sample then click Apply Sample.
        </p>
        <p class="hint">
          Backend can auto-render from layout; use HTML/Text override only when
          needed.
        </p>
      </div>
      <RouterLink
        :to="`/templates/${route.params.id}/designer/versions`"
        class="btn btn--secondary version-link"
      >
        Open Version History
      </RouterLink>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { auth } from "../stores/auth";
import {
  TemplateDesignerApiError,
  templateDesignerApi,
  type TemplateLayout,
} from "../api/templateDesignerApi";

const route = useRoute();

type LayoutNode = {
  type: "section" | "text" | "button" | "divider" | "image" | "columns";
  props?: Record<string, string>;
  children?: LayoutNode[];
};

type BlockType = "text" | "button" | "divider" | "image" | "columns";

type DesignerBlock = {
  id: string;
  type: BlockType;
  props: Record<string, string>;
};

type DragPayload =
  | { kind: "palette"; blockType: BlockType }
  | { kind: "canvas"; index: number }
  | null;

const sampleOptions = [
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
  { key: "amount", token: "{{amount}}" },
  { key: "company", token: "{{company}}" },
  { key: "unsubscribe_url", token: "{{unsubscribe_url}}" },
] as const;

type SampleKey = (typeof sampleOptions)[number]["key"];

function isSampleKey(value: string): value is SampleKey {
  return sampleOptions.some((option) => option.key === value);
}

const samples: Record<SampleKey, { root: LayoutNode }> = {
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

const sampleFromQuery = String(route.query.sample || "welcome");
const initialSample: SampleKey = isSampleKey(sampleFromQuery)
  ? sampleFromQuery
  : "welcome";

const selectedSample = ref<SampleKey>(initialSample);
const previewMode = ref<"email" | "html" | "text">("email");
const previewDevice = ref<"desktop" | "mobile">("desktop");
const layout = ref(JSON.stringify(samples[initialSample], null, 2));
const palette: BlockType[] = ["text", "button", "image", "columns", "divider"];
const canvasBlocks = ref<DesignerBlock[]>([]);
const selectedBlockIndex = ref<number | null>(null);
const dragPayload = ref<DragPayload>(null);
const isApplyingHistory = ref(false);
const history = ref<DesignerBlock[][]>([]);
const historyIndex = ref(-1);
const isRequesting = ref(false);
const requestError = ref("");
const requestInfo = ref("");

const templateId = computed(() => {
  const raw = Number(route.params.id);
  return Number.isFinite(raw) ? String(raw) : "";
});
const authToken = computed(() => auth.state.token);

const selectedBlock = computed(() => {
  if (selectedBlockIndex.value === null) return null;
  return canvasBlocks.value[selectedBlockIndex.value] || null;
});

function uid() {
  return `blk_${Math.random().toString(16).slice(2, 8)}_${Date.now().toString(16)}`;
}

function defaultProps(type: BlockType): Record<string, string> {
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
  if (type === "image")
    return {
      src: "https://dummyimage.com/640x220/e2e8f0/334155&text=Banner",
      alt: "Banner image",
    };
  if (type === "columns") {
    return {
      leftContent: "Left column text",
      rightContent: "Right column text",
      gap: "16",
      color: "#334155",
    };
  }
  return {};
}

function blockSummary(block: DesignerBlock): string {
  if (block.type === "text") return block.props.content || "(empty text)";
  if (block.type === "button")
    return `${block.props.label || "Button"} -> ${block.props.href || "#"}`;
  if (block.type === "image")
    return `${block.props.alt || "Image"} -> ${block.props.src || ""}`;
  if (block.type === "columns")
    return `${block.props.leftContent || ""} | ${block.props.rightContent || ""}`;
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
  if (selectedBlockIndex.value === null) {
    selectedBlockIndex.value = 0;
  }
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
    node.type === "columns"
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

function normalizeLayout(raw: TemplateLayout | string | undefined): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
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
    await templateDesignerApi.saveDraft(templateId.value, token, {
      layout: parsedLayout.value as TemplateLayout,
    });
    requestInfo.value = "Draft saved.";
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
    const res = await templateDesignerApi.getDesigner(templateId.value, token);
    const source = res.draft || res.published;
    const nextLayout = normalizeLayout(source?.layout);
    if (!nextLayout) {
      requestInfo.value = "No draft/published designer data found.";
      return;
    }
    layout.value = nextLayout;
    applyJsonToCanvas();
    pushHistory();
    requestInfo.value = "Designer data loaded.";
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

  isRequesting.value = true;
  try {
    const res = await templateDesignerApi.publishDraft(templateId.value, token);
    requestInfo.value = `Published draft as version ${res.id}.`;
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
    block.props.content = `${block.props.content || ""} ${token}`.trim();
    return;
  }
  if (block.type === "button") {
    block.props.label = `${block.props.label || ""} ${token}`.trim();
    return;
  }
  if (block.type === "columns") {
    block.props.leftContent =
      `${block.props.leftContent || ""} ${token}`.trim();
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
    "columns",
  ];
  if (!allowedTypes.includes(node.type)) {
    errors.push(`${path}: unknown type ${String(node.type)}`);
    return;
  }

  if (node.type === "text") {
    if (!node.props?.content) errors.push(`${path}: text.content is required`);
    if (hasUnknownVariable(node.props?.content || "")) {
      errors.push(`${path}: text contains unknown variable token`);
    }
  }
  if (node.type === "button") {
    if (!node.props?.label) errors.push(`${path}: button.label is required`);
    if (!node.props?.href) errors.push(`${path}: button.href is required`);
    if (hasUnknownVariable(node.props?.label || "")) {
      errors.push(`${path}: button label contains unknown variable token`);
    }
  }
  if (node.type === "image" && !node.props?.src) {
    errors.push(`${path}: image.src is required`);
  }
  if (node.type === "columns") {
    if (!node.props?.leftContent)
      errors.push(`${path}: columns.leftContent is required`);
    if (!node.props?.rightContent)
      errors.push(`${path}: columns.rightContent is required`);
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

function sanitizeCssValue(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const cleaned = value.replace(/[;"<>]/g, "").trim();
  return cleaned || fallback;
}

function px(value: string | undefined, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${fallback}px`;
  return `${Math.max(0, n)}px`;
}

function textAlign(value: string | undefined) {
  if (value === "center" || value === "right") return value;
  return "left";
}

function renderNode(node: LayoutNode): string {
  if (node.type === "text") {
    const color = sanitizeCssValue(node.props?.color, "#334155");
    const fontSize = px(node.props?.fontSize, 16);
    const align = textAlign(node.props?.align);
    return `<p style="margin:0 0 12px;color:${color};line-height:1.5;font-size:${fontSize};text-align:${align};">${escapeHtml(node.props?.content || "")}</p>`;
  }
  if (node.type === "button") {
    const label = escapeHtml(node.props?.label || "Open");
    const href = escapeHtml(node.props?.href || "#");
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
      node.props?.src ||
        "https://dummyimage.com/640x220/e2e8f0/334155&text=Email+Banner",
    );
    const alt = escapeHtml(node.props?.alt || "Banner");
    return `<img src="${src}" alt="${alt}" style="max-width:100%;height:auto;border-radius:8px;margin:0 0 12px;" />`;
  }
  if (node.type === "columns") {
    const gap = px(node.props?.gap, 16);
    const color = sanitizeCssValue(node.props?.color, "#334155");
    const left = escapeHtml(node.props?.leftContent || "");
    const right = escapeHtml(node.props?.rightContent || "");
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;border-collapse:separate;border-spacing:${gap} 0;"><tr><td valign="top" width="50%" style="color:${color};line-height:1.5;">${left}</td><td valign="top" width="50%" style="color:${color};line-height:1.5;">${right}</td></tr></table>`;
  }
  const children = (node.children || [])
    .map((child) => renderNode(child))
    .join("");
  return `<section style="padding:12px 0;">${children}</section>`;
}

const renderedHtml = computed(() => {
  if (!parsedLayout.value?.root)
    return "<html><body><p>Invalid layout JSON</p></body></html>";
  const body = renderNode(parsedLayout.value.root);
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;"><div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:22px;">${body}</div></body></html>`;
});

function renderTextNode(node: LayoutNode): string {
  if (node.type === "text") return node.props?.content || "";
  if (node.type === "button")
    return `[${node.props?.label || "Open"}] ${node.props?.href || ""}`;
  if (node.type === "divider") return "------------------------------";
  if (node.type === "image") return `[Image] ${node.props?.alt || ""}`;
  if (node.type === "columns")
    return `${node.props?.leftContent || ""}\n${node.props?.rightContent || ""}`;
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
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.header-error,
.header-note {
  margin-top: 6px;
}

.grid--designer {
  grid-template-columns: 1.6fr 1fr;
}

.builder {
  display: grid;
  grid-template-columns: 160px 1fr 220px;
  gap: 12px;
  margin-bottom: 12px;
}

.mini-title {
  margin: 0 0 8px;
  color: var(--color-text-muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.builder__palette,
.builder__canvas-wrap,
.builder__inspector {
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  padding: 10px;
  background: var(--color-control-bg-muted);
}

.palette-item {
  width: 100%;
  justify-content: center;
  margin-bottom: 8px;
}

.canvas {
  min-height: 220px;
  border: 1px dashed var(--color-border-subtle);
  border-radius: 8px;
  padding: 8px;
  background: var(--color-control-bg);
}

.canvas-block {
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  background: var(--color-bg-surface-elevated);
  cursor: move;
}

.canvas-block--active {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-primary);
}

.canvas-block__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.block-actions {
  display: flex;
  gap: 6px;
}

.canvas-block__type {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-main);
  text-transform: uppercase;
}

.canvas-block__content {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.remove-btn {
  border: 1px solid var(--color-border-subtle);
  background: var(--color-control-bg);
  color: var(--color-text-main);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
}

.empty-canvas {
  margin: 6px 0;
  font-size: 12px;
  color: var(--color-text-soft);
}

.inspector-type {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--color-text-main);
}

.style-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.var-panel {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-subtle);
}

.var-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.var-chip {
  padding: 6px 8px;
  font-size: 11px;
}

.panel {
  border: 1px solid var(--color-border-subtle);
}

.layout-input {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-control-bg);
  color: var(--color-text-main);
  padding: 12px;
  font-size: 13px;
  font-family: Consolas, "Courier New", monospace;
}

.sample-select {
  min-width: 200px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-control-bg);
  color: var(--color-text-main);
}

.note {
  margin: 10px 0 14px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.error {
  margin: 0 0 14px;
  color: var(--color-danger);
  font-size: 13px;
}

.schema-list {
  margin: 0 0 12px;
  padding-left: 18px;
  color: var(--color-danger);
  font-size: 12px;
}

.preview {
  border: 1px dashed var(--color-border-subtle);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 14px;
}

.preview--email {
  padding: 0;
  overflow: hidden;
}

.preview--mobile {
  max-width: 390px;
  margin-left: auto;
  margin-right: auto;
}

.email-frame {
  width: 100%;
  min-height: 380px;
  border: none;
  background: #ffffff;
}

.preview--code {
  white-space: pre-wrap;
  font-size: 12px;
  color: var(--color-text-main);
  background: var(--color-control-bg-muted);
  overflow-x: auto;
}

.preview h3 {
  margin: 0 0 8px;
}

.preview p {
  margin: 0 0 12px;
  color: var(--color-text-muted);
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.actions--top {
  margin-bottom: 12px;
}

.hint-list {
  margin: 0 0 12px;
}

.hint {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.version-link {
  text-decoration: none;
}

@media (max-width: 900px) {
  .grid--designer {
    grid-template-columns: 1fr;
  }

  .builder {
    grid-template-columns: 1fr;
  }
}
</style>
