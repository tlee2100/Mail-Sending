<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
      <form class="campaign-modal" @submit.prevent="emit('submit')">
        <header class="modal-header">
          <div>
            <p class="eyebrow">{{ editingCampaign ? "Edit campaign" : "New campaign" }}</p>
            <h2>{{ editingCampaign ? "Update campaign details" : "Create campaign" }}</h2>
            <p>Configure campaign info and optionally upload Excel recipients before sending.</p>
          </div>
          <button type="button" class="icon-btn" @click="emit('close')">×</button>
        </header>

        <div class="form-grid">
          <label class="field field--wide">
            <span>Campaign name *</span>
            <input
              v-model.trim="form.campaignName"
              type="text"
              placeholder="Spring Launch"
              required
            />
          </label>

          <label class="field">
            <span>Template *</span>
            <select v-model="form.templateId" required>
              <option disabled value="">Select template</option>
              <option v-for="template in templates" :key="template.id" :value="String(template.id)">
                {{ template.template_name }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Sender account *</span>
            <select v-model="form.emailAccountId" required>
              <option disabled value="">Select sender</option>
              <option v-for="account in accounts" :key="account.id" :value="String(account.id)">
                {{ account.display_name || account.email_address }} - {{ account.email_address }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Campaign type</span>
            <select v-model="form.campaignType">
              <option value="regular">Regular</option>
              <option value="ab_test">A/B Test</option>
              <option value="automated">Automated</option>
            </select>
          </label>

          <label class="field">
            <span>Schedule time</span>
            <input v-model="form.scheduledTime" type="datetime-local" />
          </label>
        </div>

        <CampaignRecipientManager
          :is-edit="Boolean(editingCampaign)"
          v-model:recipients-text="form.recipientsText"
          :parsed-recipients="parsedRecipients"
          :import-summary="importSummary"
          :recipients-loading="recipientsLoading"
          :recipient-rows="recipientRows"
          :recipient-saving-id="recipientSavingId"
          :recipient-manager-summary="recipientManagerSummary"
          :can-edit-recipient-row="canEditRecipientRow"
          :can-save-recipient-row="canSaveRecipientRow"
          :is-valid-email="isValidEmail"
          @file-change="emit('file-change', $event)"
          @refresh="emit('refresh-recipients')"
          @add-recipient="emit('add-recipient', $event)"
          @save-recipient="emit('save-recipient', $event)"
          @delete-recipient="emit('delete-recipient', $event)"
        />

        <footer class="modal-footer">
          <button type="button" class="btn btn--secondary" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
            {{ isSubmitting ? "Saving..." : editingCampaign ? "Save Changes" : "Create Campaign" }}
          </button>
        </footer>
      </form>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import CampaignRecipientManager from "./CampaignRecipientManager.vue";

defineProps<{
  isOpen: boolean;
  editingCampaign: any;
  form: {
    campaignName: string;
    templateId: string;
    emailAccountId: string;
    campaignType: string;
    scheduledTime: string;
    recipientsText: string;
  };
  templates: Array<{ id: number | string; template_name: string }>;
  accounts: Array<{ id: number | string; display_name?: string; email_address: string }>;
  parsedRecipients: string[];
  importSummary?: string;
  recipientsLoading?: boolean;
  recipientRows: Array<any>;
  recipientSavingId?: string | number | null;
  recipientManagerSummary?: string;
  isSubmitting?: boolean;
  canEditRecipientRow: (row: any) => boolean;
  canSaveRecipientRow: (row: any) => boolean;
  isValidEmail: (email: string) => boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit"): void;
  (e: "file-change", event: Event): void;
  (e: "refresh-recipients"): void;
  (e: "add-recipient", email: string): void;
  (e: "save-recipient", row: any): void;
  (e: "delete-recipient", row: any): void;
}>();
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.campaign-modal {
  width: min(840px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: var(--color-bg-card, #1e293b);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.12));
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.eyebrow {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #38bdf8;
  margin: 0 0 4px;
}

.modal-header h2 {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 4px;
}

.modal-header p {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field--wide {
  grid-column: 1 / -1;
}

.field span {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.field input,
.field select {
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
