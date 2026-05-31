export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  details?: unknown;
  error?: {
    message?: string;
    details?: unknown;
  };
};

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  token?: string | null;
  body?: object;
  headers?: Record<string, string>;
};

export const DEFAULT_API_BASE_URL = "http://10.0.2.2:5000/api/v1";

export function normalizeBaseUrl(value?: string | null) {
  let next = String(value || DEFAULT_API_BASE_URL).trim();
  while (next.endsWith("/")) {
    next = next.slice(0, -1);
  }
  return next || DEFAULT_API_BASE_URL;
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
) {
  const queryString = query
    ? Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join("&")
    : "";

  if (!queryString) {
    return `${normalizeBaseUrl(baseUrl)}${path}`;
  }

  return `${normalizeBaseUrl(baseUrl)}${path}${path.includes("?") ? "&" : "?"}${queryString}`;
}

function buildHeaders(options: RequestOptions) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
  query?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  const response = await fetch(buildUrl(baseUrl, path, query), {
    method: options.method || "GET",
    headers: buildHeaders(options),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await parseJson(response)) as ApiEnvelope<T>;

  if (!response.ok || payload.success === false) {
    throw new ApiClientError(
      payload.error?.message || payload.message || response.statusText || "Request failed",
      response.status,
      payload.error?.details || payload.details,
    );
  }

  return (payload.data ?? (payload as T)) as T;
}
