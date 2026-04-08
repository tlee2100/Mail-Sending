export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
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

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  token?: string | null;
  body?: BodyInit | object;
  headers?: Record<string, string>;
};

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function buildHeaders(
  token?: string | null,
  body?: RequestOptions["body"],
  extra?: Record<string, string>,
) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extra,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body && !(body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function parseError(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | ApiEnvelope<unknown>
      | null;
    if (payload) {
      throw new ApiClientError(
        payload.message || response.statusText || "Request failed",
        response.status,
        payload.details,
      );
    }
  }

  const text = await response.text().catch(() => "");
  throw new ApiClientError(
    text || response.statusText || "Request failed",
    response.status,
  );
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
  query?: Record<string, string | number | boolean | undefined>,
): Promise<ApiEnvelope<T>> {
  const body =
    options.body &&
    !(options.body instanceof FormData) &&
    typeof options.body === "object"
      ? JSON.stringify(options.body)
      : options.body;

  const response = await fetch(buildUrl(path, query), {
    method: options.method || "GET",
    headers: buildHeaders(options.token, options.body, options.headers),
    body,
  });

  if (!response.ok) {
    await parseError(response);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!payload.success) {
    throw new ApiClientError(payload.message || "Request failed", response.status);
  }

  return payload;
}

export async function apiDownload(
  path: string,
  options: RequestOptions = {},
  query?: Record<string, string | number | boolean | undefined>,
) {
  const response = await fetch(buildUrl(path, query), {
    method: options.method || "GET",
    headers: buildHeaders(options.token, options.body, options.headers),
    body: options.body instanceof FormData ? options.body : undefined,
  });

  if (!response.ok) {
    await parseError(response);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const fileNameMatch = disposition.match(/filename="(.+?)"/i);

  return {
    blob,
    fileName: fileNameMatch?.[1] || "download.bin",
  };
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
