export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};
