import { ApiClientError } from "./http";

const API_BASE = String(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "/api/v1",
).replace(/\/$/, "");

const TOKEN_KEYS = ["auth.token.v1", "token", "access_token"] as const;

export type AiImageSize = "1024x1024" | "1024x1536" | "1536x1024" | "auto";

export type AiVideoSize =
  | "720x1280"
  | "1280x720"
  | "1024x1792"
  | "1792x1024";

export type AiImagePayload = {
  prompt: string;
  altText?: string;
  size: AiImageSize;
  emailWidth: number;
};

export type AiImageResult = {
  type: "image";
  url: string;
  filename: string;
  altText?: string;
  emailHtml: string;
};

export type AiVideoPayload = {
  prompt: string;
  size: AiVideoSize;
  seconds: number;
};

export type AiVideoJob = {
  id: string;
  status: string;
  progress?: number;
  prompt?: string;
};

export type AiVideoStatus = {
  id?: string;
  status: string;
  progress?: number;
  prompt?: string;
  url?: string;
  error?: string;
};

export type AiVideoDownload = {
  ready: boolean;
  url?: string;
  emailHtml?: string;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  details?: unknown;
};

function readStorageToken(storage: Storage | undefined) {
  if (!storage) return null;
  for (const key of TOKEN_KEYS) {
    const token = storage.getItem(key);
    if (token) return token;
  }
  return null;
}

function resolveToken(token?: string | null) {
  if (token) return token;

  try {
    return (
      readStorageToken(window.localStorage) ||
      readStorageToken(window.sessionStorage)
    );
  } catch {
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
) {
  const authToken = resolveToken(token);
  if (!authToken) {
    throw new ApiClientError("Unauthorized. Please login again.", 401);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null;

  if (!response.ok || !json?.success) {
    throw new ApiClientError(
      json?.message || response.statusText || "API error",
      response.status,
      json?.details,
    );
  }

  return json.data as T;
}

export function generateImage(payload: AiImagePayload, token?: string | null) {
  return apiFetch<AiImageResult>(
    "/ai-media/images",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function createVideo(payload: AiVideoPayload, token?: string | null) {
  return apiFetch<AiVideoJob>(
    "/ai-media/videos",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function getVideoStatus(videoId: string, token?: string | null) {
  return apiFetch<AiVideoStatus>(
    `/ai-media/videos/${encodeURIComponent(videoId)}`,
    undefined,
    token,
  );
}

export function downloadVideo(videoId: string, token?: string | null) {
  return apiFetch<AiVideoDownload>(
    `/ai-media/videos/${encodeURIComponent(videoId)}/download`,
    {
      method: "POST",
    },
    token,
  );
}
