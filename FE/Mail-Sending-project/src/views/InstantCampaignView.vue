<template>
  <section class="content__header">
    <h1 class="page-title">⚡ Instant Campaign</h1>
    <p class="page-subtitle">
      Create and send bulk email campaigns to your contacts.
    </p>
  </section>
  <section class="content__section">
    <div class="card card--panel">
      <p class="muted">
        Chọn template, danh sách liên hệ và lên lịch gửi chiến dịch. Trang này
        sẽ được mở rộng với form tạo campaign.
      </p>
      <div class="actions">
        <RouterLink to="/individual-emails/compose" class="btn btn--primary">
          ✉️ Soạn email
        </RouterLink>
        <RouterLink to="/campaigns" class="btn btn--secondary"
          >🚀 Mở Campaigns</RouterLink
        >
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<style scoped>
.muted {
  color: #6b7280;
  font-size: 14px;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
