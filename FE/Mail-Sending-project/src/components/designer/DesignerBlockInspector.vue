<template>
  <article class="card inspector-card">
    <div class="side-head">
      <h2 class="section-title">Properties</h2>
      <p class="side-copy">Select a block on the canvas to edit its settings.</p>
    </div>

    <div v-if="block" class="inspector-fields">
      <p class="inspector-type">Editing {{ prettyType(block.type) }}</p>

      <!-- Text Block -->
      <div class="input-wrap" v-if="block.type === 'text'">
        <label>Text content</label>
        <textarea v-model="block.props.content" rows="5"></textarea>
        <div class="style-grid">
          <div class="input-wrap">
            <label>Font size (px)</label>
            <input v-model="block.props.fontSize" type="number" min="10" max="72" />
          </div>
          <div class="input-wrap">
            <label>Color</label>
            <input v-model="block.props.color" type="color" />
          </div>
          <div class="input-wrap">
            <label>Align</label>
            <select v-model="block.props.align">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Button Block -->
      <template v-if="block.type === 'button'">
        <div class="input-wrap">
          <label>Button label</label>
          <input v-model="block.props.label" type="text" />
        </div>
        <div class="input-wrap">
          <label>Button href</label>
          <input v-model="block.props.href" type="text" />
        </div>
        <div class="style-grid">
          <div class="input-wrap">
            <label>Background color</label>
            <input v-model="block.props.backgroundColor" type="color" />
          </div>
          <div class="input-wrap">
            <label>Text color</label>
            <input v-model="block.props.textColor" type="color" />
          </div>
          <div class="input-wrap">
            <label>Border radius (px)</label>
            <input v-model="block.props.borderRadius" type="number" min="0" max="80" />
          </div>
          <div class="input-wrap">
            <label>Padding</label>
            <input v-model="block.props.padding" type="text" />
          </div>
        </div>
      </template>

      <!-- Image Block -->
      <template v-if="block.type === 'image'">
        <div class="input-wrap">
          <label>Image src</label>
          <input v-model="block.props.src" type="text" />
        </div>
        <div class="input-wrap">
          <label>Image alt</label>
          <input v-model="block.props.alt" type="text" />
        </div>
        <div class="input-wrap">
          <label>Image width (px)</label>
          <input v-model="block.props.width" type="number" min="120" max="1200" />
        </div>
      </template>

      <!-- ImageCard Block -->
      <template v-if="block.type === 'imageCard'">
        <div class="input-wrap">
          <label>Image src</label>
          <input v-model="block.props.imageSrc" type="text" />
        </div>
        <div class="input-wrap">
          <label>Image alt</label>
          <input v-model="block.props.imageAlt" type="text" />
        </div>
        <div class="input-wrap">
          <label>Title</label>
          <input v-model="block.props.title" type="text" />
        </div>
        <div class="input-wrap">
          <label>Description</label>
          <textarea v-model="block.props.description" rows="4"></textarea>
        </div>
        <div class="style-grid">
          <div class="input-wrap">
            <label>CTA label</label>
            <input v-model="block.props.ctaLabel" type="text" />
          </div>
          <div class="input-wrap">
            <label>CTA href</label>
            <input v-model="block.props.ctaHref" type="text" />
          </div>
        </div>
      </template>

      <!-- HTML Block -->
      <template v-if="block.type === 'html'">
        <div class="input-wrap">
          <label>HTML</label>
          <textarea v-model="block.props.html" rows="6"></textarea>
        </div>
      </template>

      <!-- QR Code Block -->
      <template v-if="block.type === 'qrcode'">
        <div class="input-wrap">
          <label>QR content</label>
          <textarea
            v-model="block.props.value"
            rows="4"
            placeholder="https://pay.example.com/{{email}}"
          ></textarea>
        </div>
        <div class="input-wrap">
          <label>Title</label>
          <input v-model="block.props.title" type="text" />
        </div>
        <div class="input-wrap">
          <label>Caption</label>
          <input v-model="block.props.caption" type="text" />
        </div>
        <div class="style-grid">
          <div class="input-wrap">
            <label>QR size (px)</label>
            <input v-model="block.props.size" type="number" min="96" max="480" />
          </div>
        </div>
      </template>

      <!-- Columns Block -->
      <template v-if="block.type === 'columns'">
        <div class="input-wrap">
          <label>Left column text</label>
          <textarea v-model="block.props.leftContent" rows="3"></textarea>
        </div>
        <div class="input-wrap">
          <label>Right column text</label>
          <textarea v-model="block.props.rightContent" rows="3"></textarea>
        </div>
        <div class="style-grid">
          <div class="input-wrap">
            <label>Gap (px)</label>
            <input v-model="block.props.gap" type="number" min="0" max="80" />
          </div>
          <div class="input-wrap">
            <label>Text color</label>
            <input v-model="block.props.color" type="color" />
          </div>
        </div>
      </template>

      <!-- Two Column Grid Block -->
      <template v-if="block.type === 'twoColumnGrid'">
        <p class="inspector-type">Left card</p>
        <div class="input-wrap">
          <label>Left image src</label>
          <input v-model="block.props.leftImageSrc" type="text" />
        </div>
        <div class="input-wrap">
          <label>Left title</label>
          <input v-model="block.props.leftTitle" type="text" />
        </div>
        <div class="input-wrap">
          <label>Left description</label>
          <textarea v-model="block.props.leftDescription" rows="3"></textarea>
        </div>
        <div class="style-grid">
          <div class="input-wrap">
            <label>Left CTA label</label>
            <input v-model="block.props.leftCtaLabel" type="text" />
          </div>
          <div class="input-wrap">
            <label>Left CTA href</label>
            <input v-model="block.props.leftCtaHref" type="text" />
          </div>
        </div>

        <p class="inspector-type inspector-type--spaced">Right card</p>
        <div class="input-wrap">
          <label>Right image src</label>
          <input v-model="block.props.rightImageSrc" type="text" />
        </div>
        <div class="input-wrap">
          <label>Right title</label>
          <input v-model="block.props.rightTitle" type="text" />
        </div>
        <div class="input-wrap">
          <label>Right description</label>
          <textarea v-model="block.props.rightDescription" rows="3"></textarea>
        </div>
        <div class="style-grid">
          <div class="input-wrap">
            <label>Right CTA label</label>
            <input v-model="block.props.rightCtaLabel" type="text" />
          </div>
          <div class="input-wrap">
            <label>Right CTA href</label>
            <input v-model="block.props.rightCtaHref" type="text" />
          </div>
        </div>

        <div class="style-grid">
          <div class="input-wrap">
            <label>Gap (px)</label>
            <input v-model="block.props.gap" type="number" min="0" max="80" />
          </div>
          <div class="input-wrap">
            <label>Image height (px)</label>
            <input v-model="block.props.imageHeight" type="number" min="120" max="420" />
          </div>
        </div>
      </template>

      <!-- Divider Block -->
      <div v-if="block.type === 'divider'" class="empty-inspector-state">
        Divider block does not need extra properties.
      </div>
    </div>

    <div v-else class="empty-inspector-state">
      Choose a block from the center canvas and its editable fields will appear here.
    </div>
  </article>
</template>

<script setup lang="ts">
import type { CanvasBlock } from "./DesignerCanvas.vue";

defineProps<{
  block: CanvasBlock | null;
  prettyType: (type: any) => string;
}>();
</script>

<style scoped>
.inspector-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--color-bg-card, #1e293b);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  padding: 24px;
}

.side-head {
  margin-bottom: 4px;
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 4px;
}

.side-copy {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.inspector-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.inspector-type {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #38bdf8;
  margin: 0;
}

.inspector-type--spaced {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.input-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-wrap label {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.input-wrap input,
.input-wrap select,
.input-wrap textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  font-size: 13px;
  box-sizing: border-box;
}

.style-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 6px;
}

.empty-inspector-state {
  padding: 24px 12px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  background: rgba(15, 23, 42, 0.3);
  border-radius: 10px;
}
</style>
