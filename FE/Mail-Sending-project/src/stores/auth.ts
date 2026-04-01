import { computed, reactive } from "vue";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
};

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
};

type AuthPayload = {
  user: AuthUser;
  token: string;
};

const LS_TOKEN = "auth.token.v1";
const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);

function readToken(): string | null {
  try {
    return localStorage.getItem(LS_TOKEN);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(LS_TOKEN);
    else localStorage.setItem(LS_TOKEN, token);
  } catch {
    // ignore
  }
}

function getErrorMessage(err: unknown) {
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as any).message === "string"
  ) {
    return (err as any).message as string;
  }
  return "Something went wrong";
}

async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!json) {
    throw new Error(res.statusText || "Request failed");
  }
  if (!res.ok || !json.success) {
    const detailsText =
      typeof json.details === "string"
        ? json.details
        : json.details
          ? JSON.stringify(json.details)
          : "";
    const message = json.message || res.statusText || "Request failed";
    throw new Error(detailsText ? `${message}: ${detailsText}` : message);
  }
  return json;
}

async function authRequest<T>(
  path: string,
  options: {
    method: "GET" | "POST";
    token?: string;
    body?: unknown;
  },
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  return parseEnvelope<T>(res);
}

const state = reactive<AuthState>({
  token: readToken(),
  user: null,
  isReady: false,
  isLoading: false,
  error: null,
});

const isAuthenticated = computed(() => !!state.token && !!state.user);

async function restore() {
  state.isLoading = true;
  state.error = null;
  try {
    const token = readToken();
    state.token = token;
    if (!token) {
      state.user = null;
      return;
    }
    const res = await authRequest<AuthUser>("/auth/me", {
      method: "GET",
      token,
    });
    state.user = res.data;
  } catch (e) {
    state.user = null;
    state.token = null;
    writeToken(null);
    state.error = getErrorMessage(e);
  } finally {
    state.isLoading = false;
    state.isReady = true;
  }
}

async function login(payload: { email: string; password: string }) {
  state.isLoading = true;
  state.error = null;
  try {
    const res = await authRequest<AuthPayload>("/auth/login", {
      method: "POST",
      body: payload,
    });
    state.token = res.data.token;
    state.user = res.data.user;
    writeToken(res.data.token);
    return res.data.user;
  } catch (e) {
    state.error = getErrorMessage(e);
    throw e;
  } finally {
    state.isLoading = false;
    state.isReady = true;
  }
}

async function register(payload: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  state.isLoading = true;
  state.error = null;
  try {
    const res = await authRequest<AuthPayload>("/auth/register", {
      method: "POST",
      body: {
        ...payload,
        role: payload.role || "admin",
      },
    });
    state.token = res.data.token;
    state.user = res.data.user;
    writeToken(res.data.token);
    return res.data.user;
  } catch (e) {
    state.error = getErrorMessage(e);
    throw e;
  } finally {
    state.isLoading = false;
    state.isReady = true;
  }
}

async function logout() {
  state.isLoading = true;
  state.error = null;
  try {
    // Backend does not expose logout endpoint in current contract.
  } finally {
    state.token = null;
    state.user = null;
    writeToken(null);
    state.isLoading = false;
    state.isReady = true;
  }
}

async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  void payload;
  throw new Error("changePassword is not implemented by backend yet");
}

async function updateProfile(payload: { name: string }) {
  void payload;
  throw new Error("updateProfile is not implemented by backend yet");
}

export const auth = {
  state,
  isAuthenticated,
  restore,
  login,
  register,
  logout,
  changePassword,
  updateProfile,
};
