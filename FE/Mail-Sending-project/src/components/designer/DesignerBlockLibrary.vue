<template>
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
        @click="emit('add-block', type)"
        @dragstart="emit('drag-start', type, $event)"
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
          <option v-for="option in sampleOptions" :key="option.key" :value="option.key">
            {{ option.label }}
          </option>
        </select>
      </div>
      <button
        type="button"
        class="btn btn--secondary toolbox-action"
        @click="emit('load-sample', selectedSample)"
      >
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
          @click="emit('insert-variable', variable.token)"
        >
          {{ variable.token }}
        </button>
      </div>
    </div>

    <div class="toolbox-note">
      Click to add blocks quickly or drag them into the canvas. Select any block to edit its
      properties on the right.
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  palette: string[];
  sampleOptions: ReadonlyArray<{ key: string; label: string }>;
  variables: ReadonlyArray<{ key: string; token: string }>;
  initialSample?: string;
  prettyType: (type: any) => string;
  blockShort: (type: any) => string;
}>();

const emit = defineEmits<{
  (e: "add-block", type: string): void;
  (e: "drag-start", type: string, event: DragEvent): void;
  (e: "load-sample", key: string): void;
  (e: "insert-variable", token: string): void;
}>();

const selectedSample = ref(props.initialSample || "contactProfile");
</script>

<style scoped>
.toolbox-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--color-bg-card, #1e293b);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  padding: 20px;
}

.toolbox-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolbox-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.toolbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: grab;
  text-align: left;
  transition: all 0.15s ease;
}

.toolbox-item:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: #38bdf8;
  color: #fff;
  transform: translateX(2px);
}

.toolbox-item__badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.toolbox-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.input-wrap select {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  font-size: 13px;
}

.toolbox-action {
  width: 100%;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  padding: 4px 8px;
  font-size: 11px;
  font-family: monospace;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tag-chip:hover {
  background: #38bdf8;
  color: #0f172a;
}

.toolbox-note {
  font-size: 12px;
  line-height: 1.5;
  color: #94a3b8;
  padding: 10px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.4);
}
</style>
