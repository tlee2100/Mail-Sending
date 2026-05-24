<template>
  <section class="content__header">
    <h1 class="page-title">Tich Hop Thanh Toan</h1>
    <p class="page-subtitle">
      Them cac phuong thuc thanh toan vao email cua ban theo phong cach landing page
      ro rang, de quet va de thao tac.
    </p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <section class="hero-shell">
    <div class="card card--hero">
      <div class="hero-copy">
        <span class="hero-kicker">Payment Playground</span>
        <h2 class="hero-title">Them thanh toan vao email ma van giu luong UI gon, sang va de chuyen doi.</h2>
        <p class="hero-text">
          Bo cuc nay mo phong giao dien tham chieu: mot khoi gioi thieu lon o tren,
          4 phuong thuc thanh toan ro rang o giua, va huong dan tich hop chi tiet o cuoi.
        </p>
      </div>

      <div class="hero-summary">
        <div class="summary-pill">Demo mode</div>
        <div class="summary-amount">{{ formattedAmount }} VND</div>
        <div class="summary-label">So tien dang duoc gan vao cac nut thanh toan demo</div>
        <div class="summary-chips">
          <button type="button" class="chip-btn" @click="amount = 100000">100.000</button>
          <button type="button" class="chip-btn" @click="amount = 250000">250.000</button>
          <button type="button" class="chip-btn" @click="amount = 500000">500.000</button>
        </div>
      </div>
    </div>

    <div class="card card--guide">
      <h3 class="guide-title">Huong dan tich hop thanh toan</h3>
      <ul class="guide-list">
        <li><strong>QR Code:</strong> Tao QR code dong theo thong tin don hang va merge tag.</li>
        <li><strong>Stripe:</strong> Ho tro the quoc te va vi dien tu cho checkout nhanh.</li>
        <li><strong>Digital Wallets:</strong> Dat CTA 1 cham vao email promotion hoac abandoned cart.</li>
        <li><strong>Tra gop:</strong> Hien thi BNPL cho nhung campaign co ticket cao.</li>
      </ul>
    </div>

    <div class="card card--amount-panel">
      <div class="amount-panel__copy">
        <h3 class="amount-title">So tien thanh toan (VND)</h3>
        <p class="amount-subtitle">Gia tri nay se duoc dua vao tat ca nut demo ben duoi.</p>
      </div>
      <div class="input-wrap amount-input-wrap">
        <input v-model.number="amount" type="number" min="1000" step="1000" placeholder="100000" />
      </div>
    </div>
  </section>

  <section class="grid grid--payment-cards">
    <article class="card payment-card">
      <div class="payment-card__head">
        <div class="payment-icon payment-icon--blue">QR</div>
        <div>
          <h3 class="payment-title">QR Code Payment</h3>
          <p class="payment-sub">Thanh toan bang ma QR</p>
        </div>
      </div>
      <p class="payment-desc">
        Tao ma QR dong cho moi khach hang. Ho chi can quet QR bang app ngan hang de thanh toan.
      </p>
      <button type="button" class="demo-btn demo-btn--blue" @click="runPaymentDemo('QR Code')">
        Tao QR Code Demo
      </button>
      <div class="support-note support-note--green">
        Tich hop voi VNPay, MoMo, ZaloPay
      </div>
    </article>

    <article class="card payment-card">
      <div class="payment-card__head">
        <div class="payment-icon payment-icon--violet">Card</div>
        <div>
          <h3 class="payment-title">Stripe Payment</h3>
          <p class="payment-sub">The quoc te va vi dien tu</p>
        </div>
      </div>
      <p class="payment-desc">
        Chap nhan thanh toan bang the Visa, Mastercard, AMEX va cac vi dien tu quoc te.
      </p>
      <button type="button" class="demo-btn demo-btn--violet" @click="runPaymentDemo('Stripe')">
        Demo Thanh Toan Stripe
      </button>
      <div class="feature-list">
        <div class="feature-row">
          <span class="feature-mark">-</span>
          <span>Visa, Mastercard, AMEX</span>
        </div>
        <div class="feature-row">
          <span class="feature-mark">-</span>
          <span>Apple Pay, Google Pay</span>
        </div>
      </div>
    </article>

    <article class="card payment-card">
      <div class="payment-card__head">
        <div class="payment-icon payment-icon--green">Wallet</div>
        <div>
          <h3 class="payment-title">Digital Wallets</h3>
          <p class="payment-sub">Vi dien tu</p>
        </div>
      </div>
      <p class="payment-desc">
        Tich hop cac vi dien tu pho bien de thanh toan nhanh chong ngay trong luong email.
      </p>
      <div class="wallet-stack">
        <button type="button" class="wallet-btn wallet-btn--apple" @click="runPaymentDemo('Apple Pay')">
          Apple Pay
        </button>
        <button type="button" class="wallet-btn wallet-btn--google" @click="runPaymentDemo('Google Pay')">
          Google Pay
        </button>
        <button type="button" class="wallet-btn wallet-btn--samsung" @click="runPaymentDemo('Samsung Pay')">
          Samsung Pay
        </button>
      </div>
      <div class="support-note support-note--blue">
        Thanh toan 1 cham, nhanh chong va bao mat
      </div>
    </article>

    <article class="card payment-card">
      <div class="payment-card__head">
        <div class="payment-icon payment-icon--orange">BNPL</div>
        <div>
          <h3 class="payment-title">Tra Gop</h3>
          <p class="payment-sub">Buy now, pay later</p>
        </div>
      </div>
      <p class="payment-desc">
        Cho phep khach hang mua truoc, tra sau voi nhieu ky han linh hoat.
      </p>
      <div class="installment-list">
        <button type="button" class="installment-card" @click="runPaymentDemo('Tra gop 0%')">
          <span class="installment-name">Tra gop 0%</span>
          <span class="installment-badge installment-badge--green">3-6 thang</span>
          <span class="installment-desc">Khong lai suat, phe duyet nhanh trong 2 phut</span>
        </button>
        <button type="button" class="installment-card" @click="runPaymentDemo('Tra gop 12 thang')">
          <span class="installment-name">Tra gop 12 thang</span>
          <span class="installment-badge installment-badge--blue">Lai suat thap</span>
          <span class="installment-desc">Ky han dai, thanh toan nhe nhang hon</span>
        </button>
        <button type="button" class="installment-card" @click="runPaymentDemo('Kredivo / Atome')">
          <span class="installment-name">Kredivo / Atome</span>
          <span class="installment-badge installment-badge--violet">BNPL</span>
          <span class="installment-desc">Chia nho thanh toan, khong can the tin dung</span>
        </button>
      </div>
    </article>
  </section>

  <section class="content__section">
    <div class="card card--integration-steps">
      <div class="steps-header">
        <div class="steps-check">OK</div>
        <h3 class="steps-title">Cach tich hop thanh toan vao Email</h3>
      </div>

      <div class="steps-list">
        <div class="step-row">
          <span class="step-index">1</span>
          <p>Them khoi <strong>QR Code</strong> hoac <strong>Button</strong> vao email template.</p>
        </div>
        <div class="step-row">
          <span class="step-index">2</span>
          <p>
            Cau hinh URL thanh toan voi merge tags:
            <code>https://pay.example.com/{{ mergeTagExample }}</code>
          </p>
        </div>
        <div class="step-row">
          <span class="step-index">3</span>
          <p>QR Code se tu dong tao voi thong tin dong cho tung khach hang.</p>
        </div>
        <div class="step-row">
          <span class="step-index">4</span>
          <p>Khach hang nhan vao button hoac quet QR de thanh toan truc tiep.</p>
        </div>
      </div>

      <div class="integration-note">
        <strong>Luu y:</strong> De dung thanh toan thuc te, ban can dang ky tai khoan
        voi nha cung cap va cau hinh API keys trong phan cai dat backend.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace } from "../stores/mockWorkspace";

const notice = useNotice();
const amount = ref(100000);
const mergeTagExample = "{{orderId}}";

const formattedAmount = computed(() => Number(amount.value || 0).toLocaleString("vi-VN"));

function runPaymentDemo(method: string) {
  mockWorkspace.trackPayment(method, amount.value);
  notice.show(
    `${method} demo prepared for ${formattedAmount.value} VND.`,
    "success",
  );
}
</script>

<style scoped>
.hero-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card--hero {
  display: grid;
  grid-template-columns: 1.7fr 0.9fr;
  gap: 20px;
  padding: 28px;
  background:
    radial-gradient(circle at top right, var(--color-primary-bg-subtle), var(--color-transparent) 34%),
    linear-gradient(180deg, var(--color-white) 0%, var(--color-bg-surface-subtle) 100%);
}

.hero-kicker {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-primary-bg-subtle);
  color: var(--color-primary-text);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-title {
  margin: 16px 0 10px;
  font-size: 32px;
  line-height: 1.15;
  max-width: 18ch;
}

.hero-text {
  margin: 0;
  max-width: 62ch;
  color: var(--color-text-muted);
  line-height: 1.7;
}

.hero-summary {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 20px;
  padding: 20px;
  background: linear-gradient(135deg, var(--color-primary-bg-soft) 0%, var(--color-bg-surface-tinted) 100%);
  border: 1px solid var(--color-primary-border-soft);
}

.summary-pill {
  align-self: flex-start;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-white);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.summary-amount {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-text-strong);
}

.summary-label {
  color: var(--color-text-muted);
  line-height: 1.6;
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip-btn {
  border: 1px solid var(--color-primary-border-muted);
  background: var(--color-white);
  color: var(--color-primary-text);
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}

.card--guide {
  padding: 24px 28px;
  border: 1px solid var(--color-border-info);
  background: linear-gradient(180deg, var(--color-info-bg-muted) 0%, var(--color-primary-bg-soft) 100%);
}

.guide-title {
  margin: 0 0 14px;
  font-size: 18px;
  color: var(--color-info-text);
}

.guide-list {
  margin: 0;
  padding-left: 22px;
  color: var(--color-info-text-strong);
  line-height: 1.9;
}

.card--amount-panel {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  padding: 22px 28px;
}

.amount-title {
  margin: 0;
  font-size: 18px;
}

.amount-subtitle {
  margin: 6px 0 0;
  color: var(--color-text-muted);
}

.amount-input-wrap {
  width: min(360px, 100%);
  margin-bottom: 0;
}

.grid--payment-cards {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.payment-card {
  padding: 28px;
  min-height: 100%;
}

.payment-card__head {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
}

.payment-icon {
  width: 70px;
  height: 70px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
}

.payment-icon--blue {
  background: var(--color-info-bg-soft);
  color: var(--color-info);
}

.payment-icon--violet {
  background: var(--color-purple-bg);
  color: var(--color-purple-text);
}

.payment-icon--green {
  background: var(--color-success-bg);
  color: var(--color-success-strong);
}

.payment-icon--orange {
  background: var(--color-warning-bg-orange);
  color: var(--color-orange-text);
}

.payment-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.payment-sub {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.payment-desc {
  margin: 0 0 20px;
  color: var(--color-text-subtle);
  line-height: 1.7;
  min-height: 78px;
}

.demo-btn {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-white);
  cursor: pointer;
}

.demo-btn--blue {
  background: linear-gradient(135deg, var(--color-info), var(--color-info));
}

.demo-btn--violet {
  background: linear-gradient(135deg, var(--color-purple-strong), var(--color-purple-accent));
}

.support-note {
  margin-top: 16px;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 14px;
}

.support-note--green {
  background: var(--color-success-bg-subtle);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.support-note--blue {
  background: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-border-info);
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}

.feature-row {
  display: flex;
  gap: 10px;
  align-items: center;
  color: var(--color-text-secondary);
}

.feature-mark {
  font-weight: 700;
  color: var(--color-primary-soft);
}

.wallet-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.wallet-btn {
  width: 100%;
  border-radius: 14px;
  padding: 16px 18px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--color-border-muted);
}

.wallet-btn--apple {
  background: var(--color-black);
  color: var(--color-white);
  border-color: var(--color-black);
}

.wallet-btn--google {
  background: var(--color-white);
  color: var(--color-text-strong);
}

.wallet-btn--samsung {
  background: var(--color-info);
  color: var(--color-white);
  border-color: var(--color-info);
}

.installment-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.installment-card {
  width: 100%;
  text-align: left;
  border: 1px solid var(--color-slate-border);
  background: var(--color-white);
  border-radius: 16px;
  padding: 18px 20px;
  cursor: pointer;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 16px;
}

.installment-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-main);
}

.installment-desc {
  grid-column: 1;
  color: var(--color-text-subtle);
  line-height: 1.6;
}

.installment-badge {
  font-size: 13px;
  font-weight: 700;
}

.installment-badge--green {
  color: var(--color-success-strong);
}

.installment-badge--blue {
  color: var(--color-info);
}

.installment-badge--violet {
  color: var(--color-purple-text);
}

.card--integration-steps {
  padding: 26px 28px;
  border: 1px solid var(--color-border-primary-muted);
  background: linear-gradient(180deg, var(--color-primary-panel-start) 0%, var(--color-primary-panel-end) 100%);
}

.steps-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.steps-check {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-white);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
  border: 2px solid var(--color-primary-soft);
}

.steps-title {
  margin: 0;
  font-size: 18px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-row {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 14px;
  align-items: start;
}

.step-row p {
  margin: 0;
  line-height: 1.7;
}

.step-index {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: var(--color-white);
  font-weight: 700;
}

.step-row code {
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--color-white);
  border: 1px solid var(--color-slate-border);
  color: var(--color-text-secondary);
}

.integration-note {
  margin-top: 22px;
  padding: 16px 18px;
  border-radius: 14px;
  background: var(--color-white);
  border: 1px solid var(--color-border-primary-soft);
  line-height: 1.7;
}

@media (max-width: 1100px) {
  .card--hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .grid--payment-cards {
    grid-template-columns: 1fr;
  }

  .card--amount-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .amount-input-wrap {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .card--hero,
  .card--guide,
  .card--amount-panel,
  .payment-card,
  .card--integration-steps {
    padding: 20px;
  }

  .hero-title {
    font-size: 26px;
  }

  .summary-amount {
    font-size: 28px;
  }
}
</style>
