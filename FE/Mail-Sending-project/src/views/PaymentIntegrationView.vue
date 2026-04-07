<template>
  <section class="content__header">
    <h1 class="page-title">Payment Integration</h1>
    <p class="page-subtitle">Add payment methods and mock checkout actions to your email flow</p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <div class="card card--guide">
    <h3 class="guide-title">Integration guide</h3>
    <ul class="guide-list">
      <li><strong>QR Code:</strong> Generate a dynamic QR experience per recipient.</li>
      <li><strong>Stripe:</strong> Mock card and wallet checkout flow for testing.</li>
      <li><strong>Digital Wallets:</strong> Demo quick-pay entry points.</li>
      <li><strong>Installments:</strong> Present BNPL style options inside campaigns.</li>
    </ul>
  </div>

  <section class="content__section">
    <div class="input-wrap">
      <label>Payment amount (VND)</label>
      <input v-model.number="amount" type="number" placeholder="100000" />
    </div>
  </section>

  <section class="grid grid--payment-cards">
    <div class="card card--payment">
      <div class="payment-icon payment-icon--blue">QR</div>
      <h3 class="payment-title">QR Code Payment</h3>
      <p class="payment-sub">Scan to pay</p>
      <p class="payment-desc">
        Generate a mock QR checkout entry for each customer.
      </p>
      <button type="button" class="btn btn--primary" @click="runPaymentDemo('QR Code')">
        Create QR Code Demo
      </button>
      <div class="payment-badge">VNPay / MoMo / ZaloPay style flow</div>
    </div>

    <div class="card card--payment">
      <div class="payment-icon payment-icon--purple">Card</div>
      <h3 class="payment-title">Stripe Payment</h3>
      <p class="payment-sub">Cards and wallets</p>
      <p class="payment-desc">
        Simulate an international card payment button flow.
      </p>
      <button type="button" class="btn btn--primary stripe-btn" @click="runPaymentDemo('Stripe')">
        Demo Stripe Payment
      </button>
      <div class="payment-options">
        <label><input type="checkbox" checked /> Visa, Mastercard, AMEX</label>
        <label><input type="checkbox" checked /> Apple Pay, Google Pay</label>
      </div>
    </div>

    <div class="card card--payment">
      <div class="payment-icon payment-icon--green">Wallet</div>
      <h3 class="payment-title">Digital Wallets</h3>
      <p class="payment-sub">Fast checkout</p>
      <p class="payment-desc">
        Trigger demo wallet actions to verify CTA placement in email.
      </p>
      <div class="wallet-buttons">
        <button type="button" class="btn btn--black" @click="runPaymentDemo('Apple Pay')">
          Apple Pay
        </button>
        <button type="button" class="btn btn--secondary" @click="runPaymentDemo('Google Pay')">
          Google Pay
        </button>
        <button type="button" class="btn btn--blue" @click="runPaymentDemo('Samsung Pay')">
          Samsung Pay
        </button>
      </div>
      <p class="payment-footer">One-tap mock checkout with saved amount.</p>
    </div>

    <div class="card card--payment">
      <div class="payment-icon payment-icon--orange">BNPL</div>
      <h3 class="payment-title">Installments</h3>
      <p class="payment-sub">Buy now, pay later</p>
      <p class="payment-desc">
        Present financing choices for higher ticket campaigns.
      </p>
      <div class="installment-list">
        <div class="installment-item">
          <span>0% interest</span>
          <span class="installment-detail">Quick approval in 2 minutes</span>
          <span class="installment-badge green">3-6 months</span>
        </div>
        <div class="installment-item">
          <span>12 month plan</span>
          <span class="installment-detail">Lower monthly payment</span>
          <span class="installment-badge blue">Low APR</span>
        </div>
        <div class="installment-item">
          <span>Kredivo / Atome</span>
          <span class="installment-detail">Split payment without a credit card</span>
          <span class="installment-badge">BNPL</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace } from "../stores/mockWorkspace";

const notice = useNotice();
const amount = ref(100000);

function runPaymentDemo(method: string) {
  mockWorkspace.trackPayment(method, amount.value);
  notice.show(
    `${method} demo prepared for ${amount.value.toLocaleString()} VND.`,
    "success",
  );
}
</script>

<style scoped>
.card--guide {
  padding: 20px 24px;
  border: 1px solid #93c5fd;
  background: #eff6ff;
  margin-bottom: 24px;
}

.guide-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d4ed8;
  margin: 0 0 12px;
}

.guide-list {
  margin: 0;
  padding-left: 20px;
  color: #1e40af;
  line-height: 1.8;
}

.grid--payment-cards {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.card--payment {
  padding: 22px;
}

.payment-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}

.payment-icon--blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.payment-icon--purple {
  background: #f3e8ff;
  color: #7c3aed;
}

.payment-icon--green {
  background: #dcfce7;
  color: #15803d;
}

.payment-icon--orange {
  background: #ffedd5;
  color: #c2410c;
}

.payment-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
}

.payment-sub {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 10px;
}

.payment-desc {
  font-size: 13px;
  color: #4b5563;
  margin: 0 0 14px;
  line-height: 1.5;
}

.payment-badge {
  font-size: 12px;
  color: #15803d;
  margin-top: 12px;
  padding: 6px 10px;
  background: #dcfce7;
  border-radius: 8px;
  display: inline-block;
}

.stripe-btn {
  background: #7c3aed;
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  font-size: 13px;
}

.wallet-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.btn--black {
  background: #111827;
  color: white;
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.btn--blue {
  background: #2563eb;
  color: white;
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.payment-footer {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.installment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.installment-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.installment-detail {
  grid-column: 1;
  color: #6b7280;
  font-size: 12px;
}

.installment-badge {
  grid-row: 1 / 3;
  grid-column: 2;
  font-size: 12px;
  color: #1d4ed8;
}

.installment-badge.green {
  color: #15803d;
}

@media (max-width: 900px) {
  .grid--payment-cards {
    grid-template-columns: 1fr;
  }
}
</style>
