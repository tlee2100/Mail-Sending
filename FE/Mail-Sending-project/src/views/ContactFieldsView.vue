<template>
  <section class="content__header header-row">
    <div>
      <h1 class="page-title">Contact Custom Fields</h1>
      <p class="page-subtitle">
        Create, edit and remove extra attributes for contacts.
      </p>
    </div>
    <button type="button" class="btn btn--primary">+ Add Field</button>
  </section>

  <section class="content__section">
    <div class="card card--table">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Required</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="field in fields" :key="field.id">
            <td>{{ field.name }}</td>
            <td>{{ field.type }}</td>
            <td>{{ field.required ? "Yes" : "No" }}</td>
            <td>{{ field.updatedAt }}</td>
            <td class="actions">
              <button type="button" class="btn btn--secondary btn--small">
                PATCH
              </button>
              <button type="button" class="btn btn--danger btn--small">
                DELETE
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
const fields = [
  {
    id: "f_1",
    name: "Company",
    type: "text",
    required: false,
    updatedAt: "2h ago",
  },
  {
    id: "f_2",
    name: "Plan",
    type: "select",
    required: true,
    updatedAt: "1d ago",
  },
  {
    id: "f_3",
    name: "Renewal Date",
    type: "date",
    required: false,
    updatedAt: "3d ago",
  },
];
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

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
</style>
