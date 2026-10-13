<template>
  <article class="card studio-card">
    <div class="studio-head">
      <div>
        <h2 class="section-title">Canvas</h2>
        <p class="studio-subtitle">
          Arrange blocks in order, duplicate what works, and remove anything you do not need.
        </p>
      </div>
      <div class="canvas-counter">
        {{ blocks.length }} block{{ blocks.length === 1 ? "" : "s" }}
      </div>
    </div>

    <div class="canvas-surface" @dragover.prevent @drop="emit('drop-to-end')">
      <div
        v-for="(block, index) in blocks"
        :key="block.id"
        class="designer-block-card"
        :class="{ 'designer-block-card--active': selectedBlockIndex === index }"
        draggable="true"
        @click="emit('select-block', index)"
        @dragstart="emit('drag-start', index, $event)"
        @dragover.prevent
        @drop.stop="emit('drop-on-block', index)"
      >
        <div class="designer-block-card__head">
          <div>
            <span class="block-type-pill">{{ prettyType(block.type) }}</span>
            <p class="designer-block-card__summary">{{ blockSummary(block) }}</p>
          </div>
          <div class="block-actions">
            <button type="button" class="block-action" @click.stop="emit('duplicate-block', index)">
              Duplicate
            </button>
            <button
              type="button"
              class="block-action block-action--danger"
              @click.stop="emit('remove-block', index)"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      <div v-if="blocks.length === 0" class="empty-canvas">
        <h3>Start with a block</h3>
        <p>Use the block library on the left or drag blocks here to build the email.</p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
export type CanvasBlock = {
  id: string;
  type: string;
  props: Record<string, any>;
};

defineProps<{
  blocks: CanvasBlock[];
  selectedBlockIndex: number | null;
  prettyType: (type: any) => string;
  blockSummary: (block: any) => string;
}>();

const emit = defineEmits<{
  (e: "select-block", index: number): void;
  (e: "duplicate-block", index: number): void;
  (e: "remove-block", index: number): void;
  (e: "drag-start", index: number, event: DragEvent): void;
  (e: "drop-on-block", index: number): void;
  (e: "drop-to-end"): void;
}>();
</script>

<style scoped>
.studio-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--color-bg-card, #1e293b);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  padding: 24px;
}

.studio-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 4px;
}

.studio-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.canvas-counter {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.15);
  color: #38bdf8;
}

.canvas-surface {
  min-height: 380px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  transition: border-color 0.2s ease;
}

.designer-block-card {
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: grab;
  transition: all 0.15s ease;
}

.designer-block-card:hover {
  border-color: rgba(56, 189, 248, 0.4);
  transform: translateY(-1px);
}

.designer-block-card--active {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
  background: rgba(30, 41, 59, 0.95);
}

.designer-block-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.block-type-pill {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.designer-block-card__summary {
  margin: 4px 0 0;
  font-size: 13px;
  color: #cbd5e1;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-actions {
  display: flex;
  gap: 8px;
}

.block-action {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.15s ease;
}

.block-action:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.block-action--danger {
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}

.block-action--danger:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fff;
}

.empty-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

.empty-canvas h3 {
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 6px;
}

.empty-canvas p {
  font-size: 13px;
  margin: 0;
}
</style>
