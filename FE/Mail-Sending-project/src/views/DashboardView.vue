<template>
  <section class="content__header">
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Welcome to your email marketing dashboard</p>
  </section>

  <section class="grid grid--stats">
    <div class="card card--stat card--blue">
      <div class="card__icon">✉️</div>
      <div class="card__label">Total Accounts</div>
      <div class="card__value">1</div>
    </div>
    <div class="card card--stat card--green">
      <div class="card__icon">✅</div>
      <div class="card__label">Active Accounts</div>
      <div class="card__value">1</div>
    </div>
    <div class="card card--stat card--indigo">
      <div class="card__icon">⭐</div>
      <div class="card__label">Default Account</div>
      <div class="card__value">1</div>
    </div>
    <div class="card card--stat card--yellow">
      <div class="card__icon">📤</div>
      <div class="card__label">Emails Sent</div>
      <div class="card__value">0</div>
    </div>
  </section>

  <section class="content__section">
    <h2 class="section-title">Quick Actions</h2>
    <div class="grid grid--actions">
      <RouterLink to="/instant-campaign" class="card card--action">
        <div class="card__icon card__icon--purple">⚡</div>
        <div class="card__title">Create Campaign</div>
        <div class="card__text">Send bulk emails instantly</div>
      </RouterLink>
      <RouterLink to="/email-templates" class="card card--action">
        <div class="card__icon card__icon--blue">📄</div>
        <div class="card__title">Manage Templates</div>
        <div class="card__text">Create and edit email templates</div>
      </RouterLink>
      <RouterLink to="/email-contacts" class="card card--action">
        <div class="card__icon card__icon--teal">👥</div>
        <div class="card__title">Email Contacts</div>
        <div class="card__text">Manage your contact list</div>
      </RouterLink>
      <RouterLink to="/email-accounts" class="card card--action">
        <div class="card__icon card__icon--green">📨</div>
        <div class="card__title">Email Accounts</div>
        <div class="card__text">Configure SMTP settings</div>
      </RouterLink>
    </div>
  </section>

  <section class="content__section content__section--bottom">
    <div class="grid grid--bottom">
      <div class="card card--panel">
        <div class="card__header">
          <div class="card__title">Recent Activity</div>
          <button class="link-button">View All</button>
        </div>
        <ul class="activity-list">
          <li class="activity-item">
            <div class="activity__icon activity__icon--blue">📧</div>
            <div class="activity__body">
              <div class="activity__title">Campaign Created</div>
              <div class="activity__desc">New email campaign "Summer Sale" created</div>
            </div>
            <div class="activity__time">2 hours ago</div>
          </li>
          <li class="activity-item">
            <div class="activity__icon activity__icon--green">👥</div>
            <div class="activity__body">
              <div class="activity__title">Contacts Imported</div>
              <div class="activity__desc">150 new contacts added via CSV import</div>
            </div>
            <div class="activity__time">5 hours ago</div>
          </li>
          <li class="activity-item">
            <div class="activity__icon activity__icon--purple">📄</div>
            <div class="activity__body">
              <div class="activity__title">Template Saved</div>
              <div class="activity__desc">Email template "Welcome Email" saved</div>
            </div>
            <div class="activity__time">1 day ago</div>
          </li>
        </ul>
      </div>
      <div class="card card--panel">
        <div class="card__header">
          <div class="card__title">Email Performance</div>
        </div>
        <div class="performance-list">
          <div class="performance-item">
            <div class="performance__label">Open Rate</div>
            <div class="performance__value">0%</div>
            <div class="performance__bar performance__bar--blue"></div>
          </div>
          <div class="performance-item">
            <div class="performance__label">Click Rate</div>
            <div class="performance__value">0%</div>
            <div class="performance__bar performance__bar--green"></div>
          </div>
          <div class="performance-item">
            <div class="performance__label">Bounce Rate</div>
            <div class="performance__value">0%</div>
            <div class="performance__bar performance__bar--orange"></div>
          </div>
          <div class="performance-item">
            <div class="performance__label">Unsubscribe Rate</div>
            <div class="performance__value">0%</div>
            <div class="performance__bar performance__bar--red"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.grid--stats {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.grid--actions {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.grid--bottom {
  grid-template-columns: 2fr 1.6fr;
}
.content__section--bottom {
  margin-top: 24px;
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
.card--indigo {
  border-top: 3px solid #6366f1;
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
.card--indigo .card__icon {
  background: rgba(79, 70, 229, 0.14);
  color: #4338ca;
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
.card--action {
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  text-decoration: none;
  color: inherit;
}
.card--action:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 45px rgba(15, 23, 42, 0.12);
}
.card__icon--purple {
  background: rgba(168, 85, 247, 0.14);
  color: #7c3aed;
}
.card__icon--blue {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}
.card__icon--teal {
  background: rgba(45, 212, 191, 0.14);
  color: #0f766e;
}
.card__icon--green {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}
.card__title {
  font-weight: 600;
  font-size: 14px;
}
.card__text {
  font-size: 12px;
  color: #6b7280;
}
.card--panel {
  padding: 18px 18px 20px;
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.link-button {
  border: none;
  background: none;
  color: #4f46e5;
  font-size: 12px;
  cursor: pointer;
}
.activity-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 10px;
}
.activity__icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.activity__icon--blue {
  background: rgba(59, 130, 246, 0.14);
  color: #2563eb;
}
.activity__icon--green {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}
.activity__icon--purple {
  background: rgba(168, 85, 247, 0.16);
  color: #7c3aed;
}
.activity__body {
  flex: 1;
}
.activity__title {
  font-size: 13px;
  font-weight: 500;
}
.activity__desc {
  font-size: 12px;
  color: #6b7280;
}
.activity__time {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
}
.performance-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.performance-item {
  display: grid;
  grid-template-columns: 1.2fr auto;
  gap: 10px;
  align-items: center;
  font-size: 12px;
}
.performance__label {
  color: #4b5563;
}
.performance__value {
  font-weight: 500;
  color: #111827;
}
.performance__bar {
  grid-column: 1 / -1;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  position: relative;
  overflow: hidden;
}
.performance__bar::after {
  content: '';
  position: absolute;
  inset: 0;
  width: 0%;
  border-radius: inherit;
}
.performance__bar--blue::after {
  background: linear-gradient(90deg, #38bdf8, #6366f1);
}
.performance__bar--green::after {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}
.performance__bar--orange::after {
  background: linear-gradient(90deg, #fb923c, #f97316);
}
.performance__bar--red::after {
  background: linear-gradient(90deg, #f97373, #ef4444);
}
@media (max-width: 1024px) {
  .grid--stats,
  .grid--actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .grid--bottom {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 768px) {
  .grid--stats,
  .grid--actions {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
