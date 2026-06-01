<template>
  <section class="content__header designer-picker-header">
    <div>
      <p class="eyebrow">Template Designer</p>
      <h1 class="page-title">Choose a Template</h1>
      <p class="page-subtitle">
        Choose a shared template or one of your own templates to continue
        designing.
      </p>
    </div>
    <RouterLink to="/email-templates" class="btn btn--secondary">
      Manage Templates
    </RouterLink>
  </section>

  <section class="content__section">
    <p v-if="requestError" class="notice notice--error">{{ requestError }}</p>

    <div v-if="isLoading" class="card picker-state">
      Loading templates...
    </div>

    <template v-else>
      <div class="template-choice-grid">
        <article class="card template-choice-panel">
          <div class="panel-head">
            <div>
              <h2 class="section-title">Shared Templates</h2>
              <p class="panel-copy">
                Start from approved shared templates. Changes are saved to your
                own copy when needed.
              </p>
            </div>
            <span class="count-pill">{{ commonTemplates.length }}</span>
          </div>

          <div v-if="commonTemplates.length" class="template-list">
            <button
              v-for="template in commonTemplates"
              :key="templateKey(template)"
              type="button"
              class="template-option"
              @click="openDesigner(template)"
            >
              <span class="template-option__main">
                <strong>{{ templateName(template) }}</strong>
                <small>{{ templateMeta(template) }}</small>
              </span>
              <span class="template-option__badge">Design</span>
            </button>
          </div>
          <div v-else class="empty-panel">
            No shared templates are available.
          </div>
        </article>

        <article class="card template-choice-panel">
          <div class="panel-head">
            <div>
              <h2 class="section-title">Your Templates</h2>
              <p class="panel-copy">
                Continue designing templates that belong to your account.
              </p>
            </div>
            <span class="count-pill">{{ privateTemplates.length }}</span>
          </div>

          <div v-if="privateTemplates.length" class="template-list">
            <button
              v-for="template in privateTemplates"
              :key="templateKey(template)"
              type="button"
              class="template-option"
              @click="openDesigner(template)"
            >
              <span class="template-option__main">
                <strong>{{ templateName(template) }}</strong>
                <small>{{ templateMeta(template) }}</small>
              </span>
              <span class="template-option__badge">Design</span>
            </button>
          </div>
          <div v-else class="empty-panel">
            You do not have any templates yet.
            <RouterLink to="/email-templates" class="inline-link">
              Create a new template
            </RouterLink>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { ApiClientError } from "../api/http";
import { templatesApi } from "../api/templatesApi";
import { auth } from "../stores/auth";
import { isTemplateOwnedByUser, templateOwnerLabel } from "../utils/templateOwnership";

type TemplateRow = Record<string, unknown>;

const router = useRouter();
const privateTemplates = ref<TemplateRow[]>([]);
const commonTemplates = ref<TemplateRow[]>([]);
const isLoading = ref(true);
const requestError = ref("");

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function nestedRecord(value: unknown) {
  return value && typeof value === "object" ? (value as TemplateRow) : null;
}

function ownerRole(template: TemplateRow) {
  const owner =
    nestedRecord(template.owner) ||
    nestedRecord(template.user) ||
    nestedRecord(template.created_by) ||
    nestedRecord(template.createdBy) ||
    nestedRecord(template.author);

  return normalize(
    template.owner_role ||
      template.ownerRole ||
      template.user_role ||
      template.userRole ||
      template.created_by_role ||
      template.createdByRole ||
      owner?.role,
  );
}

function isApprovedTemplate(template: TemplateRow) {
  const status = normalize(
    template.approval_status ||
      template.approvalStatus ||
      template.status ||
      template.review_status ||
      template.reviewStatus,
  );

  return (
    template.is_approved === true ||
    template.isApproved === true ||
    template.approved === true ||
    template.approved_by_admin === true ||
    template.approvedByAdmin === true ||
    status === "approved"
  );
}

function extractTemplateId(template: TemplateRow) {
  const id = template.id ?? template.template_id ?? template.templateId;
  return id === undefined || id === null ? "" : String(id);
}

function uniqueTemplates(items: TemplateRow[]) {
  const seen = new Set<string>();
  return items.filter((template) => {
    const id = extractTemplateId(template);
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function templateKey(template: TemplateRow) {
  return extractTemplateId(template) || templateName(template);
}

function templateName(template: TemplateRow) {
  return String(
    template.template_name ||
      template.templateName ||
      template.name ||
      `Template #${extractTemplateId(template)}`,
  );
}

function templateMeta(template: TemplateRow) {
  const pieces = [];
  const owner = templateOwnerLabel(template);
  if (isTemplateOwnedByUser(template, auth.state.user)) {
    pieces.push("Owned by you");
  } else if (ownerRole(template) === "admin") {
    pieces.push(owner ? `Admin: ${owner}` : "Created by admin");
  } else if (owner) {
    pieces.push(`Shared by ${owner}`);
  } else {
    pieces.push("Shared template");
  }

  if (isApprovedTemplate(template)) pieces.push("Approved");
  pieces.push(template.is_active === false ? "Inactive" : "Active");
  return pieces.join(" - ");
}

async function openDesigner(template: TemplateRow) {
  const templateId = extractTemplateId(template);
  if (!templateId) {
    requestError.value = "Template ID is missing.";
    return;
  }

  await router.push({ name: "template-designer", params: { id: templateId } });
}

async function loadTemplates() {
  requestError.value = "";
  const token = auth.state.token;
  if (!token) {
    requestError.value = "Unauthorized. Please login again.";
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  try {
    const [privateResponse, sharedResponse] = await Promise.all([
      templatesApi.listTemplates(token, { pageSize: 100 }),
      templatesApi.listSharedTemplates(token, { pageSize: 100 }),
    ]);

    commonTemplates.value = uniqueTemplates(sharedResponse.data.items || []);
    privateTemplates.value = uniqueTemplates(
      (privateResponse.data.items || []).filter((template) =>
        isTemplateOwnedByUser(template, auth.state.user),
      ),
    );

    if (!privateTemplates.value.length && !commonTemplates.value.length) {
      requestError.value = "No templates found. Create a template first.";
    }
  } catch (error) {
    requestError.value =
      error instanceof ApiClientError ? error.message : "Failed to load templates";
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadTemplates();
});
</script>

<style scoped>
.designer-picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.template-choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.template-choice-panel {
  border: 1px solid var(--color-border-subtle);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.panel-copy {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.count-pill {
  min-width: 34px;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--color-primary-bg-soft);
  color: var(--color-primary-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-option {
  width: 100%;
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  cursor: pointer;
}

.template-option:hover {
  border-color: var(--color-primary-soft);
  background: var(--color-primary-bg-muted);
}

.template-option__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.template-option__main strong,
.template-option__main small {
  overflow-wrap: anywhere;
}

.template-option__main small {
  color: var(--color-text-muted);
  line-height: 1.4;
}

.template-option__badge {
  flex-shrink: 0;
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  font-size: 12px;
  font-weight: 700;
}

.picker-state,
.empty-panel {
  border: 1px dashed var(--color-border-subtle);
  color: var(--color-text-muted);
}

.empty-panel {
  padding: 18px;
  border-radius: 12px;
  line-height: 1.6;
}

.inline-link {
  color: var(--color-primary);
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 900px) {
  .template-choice-grid {
    grid-template-columns: 1fr;
  }
}
</style>
