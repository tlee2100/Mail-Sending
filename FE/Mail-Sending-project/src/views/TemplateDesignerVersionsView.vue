<template>
  <section class="content__header">
    <h1 class="page-title">Template Designer Versions</h1>
    <p class="page-subtitle">
      Template ID: {{ route.params.id }} - inspect and restore historic
      snapshots.
    </p>
    <p v-if="ownershipNotice" class="page-subtitle">
      {{ ownershipNotice }}
    </p>
  </section>

  <section class="content__section">
    <div class="card card--table">
      <table class="table">
        <thead>
          <tr>
            <th>Version ID</th>
            <th>Created</th>
            <th>Author</th>
            <th>Summary</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="5">Loading versions...</td>
          </tr>
          <tr v-else-if="versions.length === 0">
            <td colspan="5">No version history found.</td>
          </tr>
          <tr v-for="v in versions" :key="v.id">
            <td>{{ v.id }}</td>
            <td>{{ v.createdAt || "-" }}</td>
            <td>{{ v.author || "-" }}</td>
            <td>{{ v.summary || "-" }}</td>
            <td class="actions">
              <button
                type="button"
                class="btn btn--secondary btn--small"
                @click="getVersion(v.id)"
                :disabled="isRequesting || !authToken"
              >
                GET version
              </button>
              <button
                type="button"
                class="btn btn--primary btn--small"
                @click="restoreVersion(v.id)"
                :disabled="isRequesting || !authToken || !canRestore"
                :title="restoreBlockedTitle"
              >
                Restore
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="requestError" class="error-text">{{ requestError }}</p>
    <p v-else-if="requestInfo" class="info-text">{{ requestInfo }}</p>

    <div v-if="selectedVersion" class="card detail-card">
      <h2 class="section-title">Version Detail: {{ selectedVersion.id }}</h2>
      <p class="detail-meta">
        Created: {{ selectedVersion.createdAt || "-" }} | Author:
        {{ selectedVersion.author || "-" }}
      </p>
      <p class="detail-meta">Summary: {{ selectedVersion.summary || "-" }}</p>
      <h3 class="mini-title">Rendered HTML</h3>
      <pre class="detail-preview">{{
        selectedVersion.renderedHtml || "(empty)"
      }}</pre>
      <h3 class="mini-title">Rendered Text</h3>
      <pre class="detail-preview">{{
        selectedVersion.renderedText || "(empty)"
      }}</pre>
      <h3 class="mini-title">Layout JSON</h3>
      <pre class="detail-preview">{{ selectedLayoutText }}</pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  TemplateDesignerApiError,
  templateDesignerApi,
  type DesignerVersionDetail,
  type DesignerVersionItem,
} from "../api/templateDesignerApi";
import { templatesApi } from "../api/templatesApi";
import { auth } from "../stores/auth";
import {
  canManageTemplate,
  hasTemplateOwner,
  isTemplateOwnedByUser,
  templateOwnerLabel,
} from "../utils/templateOwnership";

const route = useRoute();
const router = useRouter();
const templateId = computed(() => {
  const raw = Number(route.params.id);
  return Number.isFinite(raw) ? String(raw) : "";
});
const authToken = computed(() => auth.state.token);

const versions = ref<DesignerVersionItem[]>([]);
const selectedVersion = ref<DesignerVersionDetail | null>(null);
const isLoading = ref(false);
const isRequesting = ref(false);
const requestError = ref("");
const requestInfo = ref("");
const currentTemplate = ref<Record<string, unknown> | null>(null);
const canRestore = computed(() => canManageTemplate(currentTemplate.value, auth.state.user));
const ownershipNotice = computed(() => {
  if (!currentTemplate.value || !hasTemplateOwner(currentTemplate.value)) return "";
  if (isTemplateOwnedByUser(currentTemplate.value, auth.state.user)) {
    return "You can restore versions because this template belongs to your account.";
  }
  const owner = templateOwnerLabel(currentTemplate.value);
  return owner
    ? `This template is shared by ${owner}. You can inspect versions, but only the owner can restore them.`
    : "This shared template can be inspected, but only the owner can restore versions.";
});
const restoreBlockedTitle = computed(() =>
  canRestore.value ? "" : "Only the template owner can restore versions.",
);

const selectedLayoutText = computed(() => {
  const layout = selectedVersion.value?.layout;
  if (!layout) return "(empty)";
  if (typeof layout === "string") return layout;
  return JSON.stringify(layout, null, 2);
});

function setRequestError(err: unknown) {
  if (err instanceof TemplateDesignerApiError) {
    requestError.value = err.message;
    return;
  }
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    requestError.value = typeof msg === "string" ? msg : "Request failed";
    return;
  }
  requestError.value = "Request failed";
}

function extractTemplateId(template: Record<string, unknown>) {
  const id = template.id ?? template.template_id ?? template.templateId;
  return id === undefined || id === null ? "" : String(id);
}

async function validateRouteTemplateId(token: string) {
  const [privateResponse, sharedResponse] = await Promise.all([
    templatesApi.listTemplates(token, { pageSize: 100 }),
    templatesApi.listSharedTemplates(token, { pageSize: 100 }),
  ]);
  const ids = [...privateResponse.data.items, ...sharedResponse.data.items]
    .map((item) => extractTemplateId(item))
    .filter(Boolean);

  if (ids.includes(templateId.value)) {
    return true;
  }

  const fallbackId = ids[0];
  if (!fallbackId) {
    requestError.value = "No templates found for your account. Create a template first.";
    return false;
  }

  await router.replace({
    name: "template-designer-versions",
    params: { id: fallbackId },
  });
  return false;
}

async function loadVersions() {
  const token = authToken.value;
  requestError.value = "";
  requestInfo.value = "";
  if (!templateId.value) {
    requestError.value = "Template ID must be a number.";
    return;
  }
  if (!token) {
    requestError.value = "Unauthorized. Please login again.";
    return;
  }

  isLoading.value = true;
  try {
    const isValidRouteTemplate = await validateRouteTemplateId(token);
    if (!isValidRouteTemplate) return;

    const templateRes = await templatesApi.getTemplate(token, templateId.value);
    currentTemplate.value = templateRes.data;
    versions.value = await templateDesignerApi.getVersions(
      templateId.value,
      token,
    );
  } catch (err) {
    setRequestError(err);
  } finally {
    isLoading.value = false;
  }
}

async function getVersion(versionId: string) {
  const token = authToken.value;
  requestError.value = "";
  requestInfo.value = "";
  if (!templateId.value) {
    requestError.value = "Template ID must be a number.";
    return;
  }
  if (!token) {
    requestError.value = "Unauthorized. Please login again.";
    return;
  }

  isRequesting.value = true;
  try {
    selectedVersion.value = await templateDesignerApi.getVersionDetail(
      templateId.value,
      versionId,
      token,
    );
    requestInfo.value = `Loaded version ${versionId}.`;
  } catch (err) {
    setRequestError(err);
  } finally {
    isRequesting.value = false;
  }
}

async function restoreVersion(versionId: string) {
  const token = authToken.value;
  requestError.value = "";
  requestInfo.value = "";
  if (!templateId.value) {
    requestError.value = "Template ID must be a number.";
    return;
  }
  if (!token) {
    requestError.value = "Unauthorized. Please login again.";
    return;
  }
  if (!canRestore.value) {
    requestError.value = "Only the template owner can restore versions.";
    return;
  }

  isRequesting.value = true;
  try {
    await templateDesignerApi.restoreVersion(
      templateId.value,
      versionId,
      token,
    );
    requestInfo.value = `Restored version ${versionId} to current draft.`;
    await loadVersions();
  } catch (err) {
    setRequestError(err);
  } finally {
    isRequesting.value = false;
  }
}

onMounted(() => {
  void loadVersions();
});

watch(templateId, (nextId, previousId) => {
  if (!previousId || nextId === previousId) return;
  currentTemplate.value = null;
  selectedVersion.value = null;
  void loadVersions();
});
</script>

<style scoped>
.card--table {
  border: 1px solid var(--color-border-subtle);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: 13px;
  color: var(--color-text-main);
}

.table th {
  color: var(--color-text-muted);
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn--small {
  padding: 6px 10px;
  font-size: 12px;
}

.btn--small:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.error-text {
  color: var(--color-danger);
  font-size: 13px;
}

.info-text {
  color: var(--color-text-muted);
  font-size: 13px;
}

.detail-card {
  margin-top: 12px;
  border: 1px solid var(--color-border-subtle);
}

.detail-meta {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.mini-title {
  margin: 10px 0 6px;
  color: var(--color-text-main);
  font-size: 12px;
  text-transform: uppercase;
}

.detail-preview {
  margin: 0;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-control-bg);
  color: var(--color-text-main);
  white-space: pre-wrap;
  font-size: 12px;
  overflow-x: auto;
}
</style>
