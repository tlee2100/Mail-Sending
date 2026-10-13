<template>
  <section class="recipient-panel">
    <div class="recipient-header">
      <div>
        <h3>Recipients</h3>
        <p>
          <template v-if="isEdit">
            Add, edit or remove pending/failed recipients. Sent recipients are locked.
          </template>
          <template v-else>
            Import `.xlsx`, `.xls`, or `.csv` with an <strong>email</strong> column. Leave empty to
            use all active contacts.
          </template>
        </p>
      </div>
      <label v-if="!isEdit" class="upload-btn">
        Import Excel
        <input type="file" accept=".xlsx,.xls,.csv" @change="emit('file-change', $event)" />
      </label>
      <button
        v-else
        type="button"
        class="btn btn--secondary"
        :disabled="recipientsLoading"
        @click="emit('refresh')"
      >
        {{ recipientsLoading ? "Loading..." : "Refresh recipients" }}
      </button>
    </div>

    <template v-if="!isEdit">
      <textarea
        :value="recipientsText"
        rows="7"
        placeholder="customer@example.com&#10;friend@example.com"
        @input="emit('update:recipientsText', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>

      <div class="recipient-summary">
        <span>{{ parsedRecipients.length }} valid recipients in form</span>
        <span v-if="importSummary">{{ importSummary }}</span>
      </div>
    </template>

    <div v-else class="recipient-manager">
      <div class="recipient-add-row">
        <input
          v-model.trim="newEmail"
          type="email"
          placeholder="new-recipient@example.com"
          @keyup.enter.prevent="handleAddRecipient"
        />
        <button
          type="button"
          class="btn btn--primary"
          :disabled="recipientSavingId === 'new' || !isValidEmail(newEmail)"
          @click="handleAddRecipient"
        >
          {{ recipientSavingId === "new" ? "Adding..." : "Add recipient" }}
        </button>
      </div>

      <p v-if="recipientManagerSummary" class="recipient-manager-summary">
        {{ recipientManagerSummary }}
      </p>

      <div v-if="recipientRows.length" class="recipient-edit-list">
        <div v-for="row in recipientRows" :key="row.id" class="recipient-edit-row">
          <div class="recipient-edit-main">
            <input
              v-model.trim="row.draftEmail"
              type="email"
              :disabled="!canEditRecipientRow(row) || recipientSavingId === row.id"
            />
            <span class="recipient-status" :class="`recipient-status--${row.status}`">
              {{ row.status }}
            </span>
            <small v-if="row.error_message" class="recipient-error">
              {{ row.error_message }}
            </small>
          </div>
          <div class="recipient-row-actions">
            <button
              type="button"
              class="btn btn--secondary btn--small"
              :disabled="!canSaveRecipientRow(row)"
              @click="emit('save-recipient', row)"
            >
              {{ recipientSavingId === row.id ? "Saving..." : "Save" }}
            </button>
            <button
              type="button"
              class="btn btn--danger btn--small"
              :disabled="!canEditRecipientRow(row) || recipientSavingId === row.id"
              @click="emit('delete-recipient', row)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      <p v-else class="empty-text">
        {{ recipientsLoading ? "Loading recipients..." : "No recipients in this campaign." }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  isEdit: boolean;
  recipientsText: string;
  parsedRecipients: string[];
  importSummary?: string;
  recipientsLoading?: boolean;
  recipientRows: Array<any>;
  recipientSavingId?: string | number | null;
  recipientManagerSummary?: string;
  canEditRecipientRow: (row: any) => boolean;
  canSaveRecipientRow: (row: any) => boolean;
  isValidEmail: (email: string) => boolean;
}>();

const emit = defineEmits<{
  (e: "update:recipientsText", val: string): void;
  (e: "file-change", event: Event): void;
  (e: "refresh"): void;
  (e: "add-recipient", email: string): void;
  (e: "save-recipient", row: any): void;
  (e: "delete-recipient", row: any): void;
}>();

const newEmail = ref("");

function handleAddRecipient() {
  if (props.isValidEmail(newEmail.value)) {
    emit("add-recipient", newEmail.value);
    newEmail.value = "";
  }
}
</script>

<style scoped>
.recipient-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
}

.recipient-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.recipient-header h3 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.recipient-header p {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 10px;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.upload-btn input {
  display: none;
}

textarea {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  font-size: 13px;
  box-sizing: border-box;
}

.recipient-summary {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}

.recipient-manager {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.recipient-add-row {
  display: flex;
  gap: 10px;
}

.recipient-add-row input {
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
}

.recipient-manager-summary {
  margin: 0;
  font-size: 12px;
  color: #38bdf8;
}

.recipient-edit-list {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recipient-edit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}

.recipient-edit-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.recipient-edit-main input {
  flex: 1;
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.8);
  color: #fff;
  font-size: 12px;
}

.recipient-status {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.recipient-status--pending {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.recipient-status--sent {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.recipient-status--failed {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.recipient-row-actions {
  display: flex;
  gap: 6px;
}

.empty-text {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  padding: 16px;
}
</style>
