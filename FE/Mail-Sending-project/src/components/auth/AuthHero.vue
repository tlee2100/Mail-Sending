<template>
  <section class="auth__visual">
    <div class="auth__brand">
      <div class="auth__logo auth__logo--visual">CM</div>
      <span>ChadMailer</span>
    </div>

    <h2>{{ title }}</h2>

    <p>{{ description }}</p>

    <div class="auth__chips">
      <span v-for="chip in chips" :key="chip">{{ chip }}</span>
    </div>

    <div class="auth-preview" aria-hidden="true">
      <div class="auth-preview__header">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div class="auth-preview__card auth-preview__card--wide">
        <div class="preview-mail__top">
          <span>{{ cardTitle }}</span>
          <strong>{{ cardBadge }}</strong>
        </div>
        <div class="preview-mail__subject"></div>
        <div class="preview-mail__line preview-mail__line--long"></div>
        <div class="preview-mail__line"></div>
      </div>

      <div class="auth-preview__row">
        <div class="auth-preview__card">
          <div class="preview-stat__value">{{ stat1Value }}</div>
          <div class="preview-stat__label">{{ stat1Label }}</div>
          <div class="preview-stat__mini">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div class="auth-preview__card auth-preview__card--hot">
          <div class="preview-stat__value">{{ stat2Value }}</div>
          <div class="preview-stat__label">{{ stat2Label }}</div>
          <div class="preview-stat__mini preview-stat__mini--hot">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div class="auth-preview__progress">
        <span></span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    chips?: string[];
    cardTitle?: string;
    cardBadge?: string;
    stat1Value?: string;
    stat1Label?: string;
    stat2Value?: string;
    stat2Label?: string;
  }>(),
  {
    title: "Send smarter campaigns with a polished command center.",
    description:
      "Manage SMTP accounts, templates, contacts and campaigns with a fast, colorful dashboard built for email teams.",
    chips: () => ["Live delivery", "Template flow", "Contact lists"],
    cardTitle: "Campaign launch",
    cardBadge: "Ready",
    stat1Value: "12K",
    stat1Label: "Recipients",
    stat2Value: "98%",
    stat2Label: "Delivery",
  },
);
</script>

<style scoped>
.auth__visual {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 36px 36px;
  border-radius: 26px;
  background:
    radial-gradient(circle at 18% 18%, rgba(14, 165, 233, 0.28), transparent 32%),
    radial-gradient(circle at 74% 82%, rgba(236, 72, 153, 0.2), transparent 36%),
    linear-gradient(155deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.72));
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 30px 60px rgba(2, 6, 23, 0.45);
  backdrop-filter: blur(14px);
  color: #ffffff;
  overflow: hidden;
}

.auth__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.auth__logo--visual {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  color: #fff;
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.4);
}

.auth__visual h2 {
  font-size: 32px;
  line-height: 1.25;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 32px 0 16px;
  color: #ffffff;
}

.auth__visual p {
  font-size: 15px;
  line-height: 1.6;
  color: rgba(226, 232, 240, 0.85);
  margin: 0 0 28px;
}

.auth__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 32px;
}

.auth__chips span {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #cbd5e1;
}

.auth-preview {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  backdrop-filter: blur(10px);
}

.auth-preview__header {
  display: flex;
  gap: 6px;
}

.auth-preview__header span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.auth-preview__card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px 16px;
}

.auth-preview__card--wide {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-mail__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.preview-mail__top strong {
  color: #38bdf8;
}

.preview-mail__subject {
  height: 10px;
  width: 60%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.25);
}

.preview-mail__line {
  height: 6px;
  width: 40%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.12);
}

.preview-mail__line--long {
  width: 80%;
}

.auth-preview__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.preview-stat__value {
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
}

.preview-stat__label {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.preview-stat__mini {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.preview-stat__mini span {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: rgba(56, 189, 248, 0.5);
}

.preview-stat__mini--hot span {
  background: rgba(34, 197, 94, 0.5);
}

.auth-preview__progress {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.auth-preview__progress span {
  display: block;
  height: 100%;
  width: 78%;
  border-radius: 999px;
  background: linear-gradient(90deg, #0ea5e9, #22c55e);
}
</style>
