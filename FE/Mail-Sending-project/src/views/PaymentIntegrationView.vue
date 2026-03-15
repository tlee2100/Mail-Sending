<template>
  <section class="content__header">
    <h1 class="page-title">💳 Tích Hợp Thanh Toán</h1>
    <p class="page-subtitle">Thêm các phương thức thanh toán vào email của bạn</p>
  </section>

  <div class="card card--guide">
    <h3 class="guide-title">Hướng dẫn tích hợp thanh toán</h3>
    <ul class="guide-list">
      <li><strong>QR Code:</strong> Tự động tạo QR code cho từng khách hàng với thông tin đơn hàng</li>
      <li><strong>Stripe:</strong> Tích hợp thanh toán thẻ quốc tế (Visa, Mastercard, AMEX)</li>
      <li><strong>Digital Wallets:</strong> Hỗ trợ Apple Pay, Google Pay, Samsung Pay</li>
      <li><strong>Trả góp:</strong> Tích hợp các đối tác trả góp (BNPL)</li>
    </ul>
  </div>

  <section class="content__section">
    <div class="input-wrap">
      <label>Số tiền thanh toán (VNĐ)</label>
      <input v-model.number="amount" type="number" placeholder="100000" />
    </div>
  </section>

  <section class="grid grid--payment-cards">
    <div class="card card--payment">
      <div class="payment-icon payment-icon--blue">▦▦</div>
      <h3 class="payment-title">QR Code Payment</h3>
      <p class="payment-sub">Thanh toán bằng mã QR</p>
      <p class="payment-desc">Tạo mã QR động cho mỗi khách hàng. Họ chỉ cần quét QR bằng app ngân hàng để thanh toán.</p>
      <button type="button" class="btn btn--primary">Tạo QR Code Demo</button>
      <div class="payment-badge">✓ Tích hợp với VNPay, MoMo, ZaloPay</div>
    </div>

    <div class="card card--payment">
      <div class="payment-icon payment-icon--purple">💳</div>
      <h3 class="payment-title">Stripe Payment</h3>
      <p class="payment-sub">Thẻ quốc tế & ví điện tử</p>
      <p class="payment-desc">Chấp nhận thanh toán bằng thẻ Visa, Mastercard, AMEX và các ví điện tử quốc tế.</p>
      <button type="button" class="btn btn--primary" style="background: #7c3aed;">Demo Thanh Toán Stripe</button>
      <div class="payment-options">
        <label><input type="checkbox" /> Visa, Mastercard, AMEX</label>
        <label><input type="checkbox" /> Apple Pay, Google Pay</label>
      </div>
    </div>

    <div class="card card--payment">
      <div class="payment-icon payment-icon--green">📱</div>
      <h3 class="payment-title">Digital Wallets</h3>
      <p class="payment-sub">Ví điện tử</p>
      <p class="payment-desc">Tích hợp các ví điện tử phổ biến để thanh toán nhanh chóng.</p>
      <div class="wallet-buttons">
        <button type="button" class="btn btn--black">Apple Pay</button>
        <button type="button" class="btn btn--secondary">G Google Pay</button>
        <button type="button" class="btn btn--blue">S Samsung Pay</button>
      </div>
      <p class="payment-footer">⚡ Thanh toán 1 chạm, nhanh chóng & bảo mật</p>
    </div>

    <div class="card card--payment">
      <div class="payment-icon payment-icon--orange">$</div>
      <h3 class="payment-title">Trả Góp</h3>
      <p class="payment-sub">Buy Now, Pay Later</p>
      <p class="payment-desc">Cho phép khách hàng mua trước, trả sau với nhiều kỳ hạn linh hoạt.</p>
      <div class="installment-list">
        <div class="installment-item">
          <span>Trả góp 0%</span>
          <span class="installment-detail">Không lãi suất, phê duyệt nhanh trong 2 phút</span>
          <span class="installment-badge green">3-6 tháng</span>
        </div>
        <div class="installment-item">
          <span>Trả góp 12 tháng</span>
          <span class="installment-detail">Kỳ hạn dài, thanh toán nhẹ nhàng hơn</span>
          <span class="installment-badge blue">Lãi suất thấp</span>
        </div>
        <div class="installment-item">
          <span>Kredivo / Atome</span>
          <span class="installment-detail">Chia nhỏ thanh toán, không cần thẻ tín dụng</span>
          <span class="installment-badge">BNPL</span>
        </div>
      </div>
    </div>
  </section>

  <section class="content__section">
    <div class="card card--steps">
      <h3 class="steps-title">✔ Cách tích hợp thanh toán vào Email</h3>
      <ol class="steps-list">
        <li>Thêm khối QR Code hoặc Button vào email template</li>
        <li>Cấu hình URL thanh toán với merge tags: <code>https://pay.example.com/{{ orderIdTag }}</code></li>
        <li>QR Code sẽ tự động tạo với thông tin động cho từng khách hàng</li>
        <li>Khách hàng nhấn vào button hoặc quét QR để thanh toán trực tiếp</li>
      </ol>
      <div class="steps-note">
        Lưu ý: Để sử dụng thanh toán thực tế, bạn cần đăng ký tài khoản với các nhà cung cấp (Stripe, VNPay, MoMo) và cấu hình API keys trong phần Cài Đặt.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const amount = ref(100000)
const orderIdTag = '{{orderId}}'
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
  font-size: 20px;
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
.card--steps {
  padding: 24px;
}
.steps-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #111827;
}
.steps-list {
  margin: 0 0 20px;
  padding-left: 24px;
  line-height: 2;
  color: #374151;
}
.steps-list code {
  background: #2563eb;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.steps-note {
  padding: 14px 18px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 13px;
  color: #4b5563;
}
@media (max-width: 900px) {
  .grid--payment-cards {
    grid-template-columns: 1fr;
  }
}
</style>
