<template>
  <section class="content__header header-with-action">
    <div>
      <h1 class="page-title">Email Account <span class="title-accent">Management</span></h1>
      <p class="page-subtitle">Configure and manage your SMTP email accounts for bulk sending.</p>
    </div>
    <button type="button" class="btn btn--primary">+ Add New Account</button>
  </section>

  <section class="grid grid--stats-four">
    <div class="card card--stat card--blue">
      <div class="card__icon">✉️</div>
      <div class="card__value">0</div>
      <div class="card__label">Total Accounts</div>
    </div>
    <div class="card card--stat card--green">
      <div class="card__icon">✅</div>
      <div class="card__value">0</div>
      <div class="card__label">Active Accounts</div>
    </div>
    <div class="card card--stat card--cyan">
      <div class="card__icon">⭐</div>
      <div class="card__value">0</div>
      <div class="card__label">Default Account</div>
    </div>
    <div class="card card--stat card--yellow">
      <div class="card__icon">📤</div>
      <div class="card__value">0</div>
      <div class="card__label">Emails Sent</div>
    </div>
  </section>

  <section class="content__section">
    <div class="card card--empty-state">
      <div class="empty-icon">✉️</div>
      <h3 class="empty-title">No Email Accounts</h3>
      <p class="empty-desc">Add your first SMTP account to start sending emails.</p>
      <button type="button" class="btn btn--primary">+ Add Email Account</button>
    </div>
  </section>
</template>

<style scoped>
.header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}
.title-accent {
  color: #6366f1;
}
.grid--stats-four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 24px;
}
.card--stat {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #0f172a;
}
.card--blue {
  border-top: 3px solid #3b82f6;
}
.card--green {
  border-top: 3px solid #22c55e;
}
.card--cyan {
  border-top: 3px solid #06b6d4;
}
.card--yellow {
  border-top: 3px solid #facc15;
}
.card__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.card--blue .card__icon {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}
.card--green .card__icon {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}
.card--cyan .card__icon {
  background: rgba(6, 182, 212, 0.14);
  color: #0e7490;
}
.card--yellow .card__icon {
  background: rgba(250, 204, 21, 0.16);
  color: #a16207;
}
.card__label {
  font-size: 13px;
  color: #6b7280;
}
.card__value {
  font-size: 24px;
  font-weight: 600;
}
.card--empty-state {
  padding: 48px 24px;
  text-align: center;
  border: 1px dashed #d1d5db;
  background: #fafafa;
}
.empty-icon {
  font-size: 64px;
  opacity: 0.4;
  margin-bottom: 16px;
}
.empty-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #111827;
}
.empty-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px;
}
@media (max-width: 1024px) {
  .grid--stats-four {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 768px) {
  .grid--stats-four {
    grid-template-columns: 1fr;
  }
}
</style>
