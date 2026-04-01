export class TemplateDesignerApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TemplateDesignerApiError";
    this.status = status;
  }
}

export type TemplateLayout = {
  root: {
    type: string;
    props?: Record<string, string>;
    children?: TemplateLayout["root"][];
  };
};

export type DesignerDraft = {
  layout?: TemplateLayout | string;
  renderedHtml?: string;
  renderedText?: string;
  updatedAt?: string;
};

export type DesignerPublished = {
  versionId?: string;
  layout?: TemplateLayout | string;
  renderedHtml?: string;
  renderedText?: string;
  publishedAt?: string;
  summary?: string;
};

export type DesignerLoadResponse = {
  draft?: DesignerDraft | null;
  published?: DesignerPublished | null;
};

export type DesignerVersionItem = {
  id: string;
  createdAt?: string;
  author?: string;
  summary?: string;
};

export type DesignerVersionDetail = {
  id: string;
  createdAt?: string;
  author?: string;
  summary?: string;
  layout?: TemplateLayout | string;
  renderedHtml?: string;
  renderedText?: string;
};

export type SaveDesignerDraftPayload = {
  layout: TemplateLayout;
  renderedHtml?: string;
  renderedText?: string;
};

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);

function buildHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function requestJson<T>(
  path: string,
  options: {
    method: "GET" | "PUT" | "POST";
    token: string;
    body?: unknown;
  },
): Promise<T> {
  if (!options.token) {
    throw new TemplateDesignerApiError("Unauthorized", 401);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method,
    headers: buildHeaders(options.token),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const details =
      typeof payload === "object" && payload !== null && "details" in payload
        ? (payload as { details?: unknown }).details
        : undefined;
    const detailsText =
      typeof details === "string"
        ? details
        : details
          ? JSON.stringify(details)
          : "";
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : response.statusText || "Request failed";
    throw new TemplateDesignerApiError(
      detailsText ? `${message}: ${detailsText}` : message,
      response.status,
    );
  }

  return payload as T;
}

export const templateDesignerApi = {
  getDesigner(templateId: string, token: string) {
    return requestJson<DesignerLoadResponse>(
      `/templates/${encodeURIComponent(templateId)}/designer`,
      {
        method: "GET",
        token,
      },
    );
  },

  saveDraft(
    templateId: string,
    token: string,
    payload: SaveDesignerDraftPayload,
  ) {
    return requestJson<DesignerLoadResponse>(
      `/templates/${encodeURIComponent(templateId)}/designer`,
      {
        method: "PUT",
        token,
        body: payload,
      },
    );
  },

  publishDraft(templateId: string, token: string) {
    return requestJson<DesignerVersionDetail>(
      `/templates/${encodeURIComponent(templateId)}/designer/publish`,
      {
        method: "POST",
        token,
      },
    );
  },

  getVersions(templateId: string, token: string) {
    return requestJson<DesignerVersionItem[]>(
      `/templates/${encodeURIComponent(templateId)}/designer/versions`,
      {
        method: "GET",
        token,
      },
    );
  },

  getVersionDetail(templateId: string, versionId: string, token: string) {
    return requestJson<DesignerVersionDetail>(
      `/templates/${encodeURIComponent(templateId)}/designer/versions/${encodeURIComponent(versionId)}`,
      {
        method: "GET",
        token,
      },
    );
  },

  restoreVersion(templateId: string, versionId: string, token: string) {
    return requestJson<DesignerLoadResponse>(
      `/templates/${encodeURIComponent(templateId)}/designer/versions/${encodeURIComponent(versionId)}/restore`,
      {
        method: "POST",
        token,
      },
    );
  },
};
