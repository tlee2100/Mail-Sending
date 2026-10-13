import { ref, computed } from "vue";
import type { PaginationMeta } from "../types/api";

export function usePagination(initialPageSize = 20) {
  const page = ref(1);
  const pageSize = ref(initialPageSize);
  const total = ref(0);
  const totalPages = ref(1);

  const pagination = computed<PaginationMeta>(() => ({
    page: page.value,
    pageSize: pageSize.value,
    total: total.value,
    totalPages: totalPages.value,
  }));

  function setPagination(meta?: Partial<PaginationMeta>) {
    if (!meta) return;
    if (meta.page !== undefined) page.value = meta.page;
    if (meta.pageSize !== undefined) pageSize.value = meta.pageSize;
    if (meta.total !== undefined) total.value = meta.total;
    if (meta.totalPages !== undefined) totalPages.value = meta.totalPages;
  }

  function resetPage() {
    page.value = 1;
  }

  return {
    page,
    pageSize,
    total,
    totalPages,
    pagination,
    setPagination,
    resetPage,
  };
}
