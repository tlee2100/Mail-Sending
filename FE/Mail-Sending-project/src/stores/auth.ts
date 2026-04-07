import { computed, reactive } from "vue";
import { mockApi } from "../api/mockApi";
import { mockWorkspace } from "./mockWorkspace";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  mode: "api" | "mock" | null;
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
const LS_MODE = "auth.mode.v1";
const LS_PROFILE_OVERRIDE = "auth.profile.override.v1";
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

function readMode(): AuthState["mode"] {
  try {
    const mode = localStorage.getItem(LS_MODE);
    return mode === "api" || mode === "mock" ? mode : null;
  } catch {
    return null;
  }
}

function writeMode(mode: AuthState["mode"]) {
  try {
    if (!mode) localStorage.removeItem(LS_MODE);
    else localStorage.setItem(LS_MODE, mode);
  } catch {
    // ignore
  }
}

function readProfileOverride(): Partial<AuthUser> | null {
  try {
    const raw = localStorage.getItem(LS_PROFILE_OVERRIDE);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AuthUser>;
  } catch {
    return null;
  }
}

function writeProfileOverride(payload: Partial<AuthUser> | null) {
  try {
    if (!payload) {
      localStorage.removeItem(LS_PROFILE_OVERRIDE);
      return;
    }
    localStorage.setItem(LS_PROFILE_OVERRIDE, JSON.stringify(payload));
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

function applyProfileOverride(user: AuthUser | null): AuthUser | null {
  if (!user) return null;
  const override = readProfileOverride();
  if (!override) return user;
  return {
    ...user,
    ...override,
  };
}

function syncProfileShadow(user: AuthUser | null) {
  if (!user) return;
  mockWorkspace.syncProfile(user.name, user.email);
}

function normalizeMockUser(
  user: { id: string; name: string; email: string },
  role = "admin",
): AuthUser {
  const numericId = Number.parseInt(user.id.replace(/\D/g, "").slice(0, 9), 10);
  return {
    id: Number.isFinite(numericId) ? numericId : Date.now(),
    name: user.name,
    email: user.email,
    role,
    isActive: true,
  };
}

function shouldFallbackToMock(err: unknown) {
  return (
    err instanceof TypeError ||
    (err &&
      typeof err === "object" &&
      "message" in err &&
      typeof (err as { message?: unknown }).message === "string" &&
      /fetch|network|failed/i.test(String((err as { message?: unknown }).message)))
  );
}

const state = reactive<AuthState>({
  token: readToken(),
  user: null,
  isReady: false,
  isLoading: false,
  error: null,
  mode: readMode(),
});

const isAuthenticated = computed(() => !!state.token && !!state.user);

async function restore() {
  state.isLoading = true;
  state.error = null;
  try {
    const token = readToken();
    state.token = token;
    state.mode = readMode();
    if (!token) {
      state.user = null;
      return;
    }
    if (state.mode === "mock" || token.startsWith("mock.")) {
      const user = await mockApi.me(token);
      state.user = applyProfileOverride(normalizeMockUser(user));
    } else {
      const res = await authRequest<AuthUser>("/auth/me", {
        method: "GET",
        token,
      });
      state.user = applyProfileOverride(res.data);
    }
    syncProfileShadow(state.user);
  } catch (e) {
    state.user = null;
    state.token = null;
    state.mode = null;
    writeToken(null);
    writeMode(null);
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
    try {
      const res = await authRequest<AuthPayload>("/auth/login", {
        method: "POST",
        body: payload,
      });
      state.token = res.data.token;
      state.user = applyProfileOverride(res.data.user);
      state.mode = "api";
      writeToken(res.data.token);
      writeMode("api");
      syncProfileShadow(state.user);
      return res.data.user;
    } catch (error) {
      if (!shouldFallbackToMock(error)) {
        throw error;
      }

      const res = await mockApi.login(payload);
      state.token = res.token;
      state.user = applyProfileOverride(normalizeMockUser(res.user));
      state.mode = "mock";
      writeToken(res.token);
      writeMode("mock");
      syncProfileShadow(state.user);
      return state.user;
    }
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
    try {
      const res = await authRequest<AuthPayload>("/auth/register", {
        method: "POST",
        body: {
          ...payload,
          role: payload.role || "admin",
        },
      });
      state.token = res.data.token;
      state.user = applyProfileOverride(res.data.user);
      state.mode = "api";
      writeToken(res.data.token);
      writeMode("api");
      syncProfileShadow(state.user);
      return res.data.user;
    } catch (error) {
      if (!shouldFallbackToMock(error)) {
        throw error;
      }

      const res = await mockApi.register({
        name: payload.name,
        email: payload.email,
        password: payload.password,
      });
      state.token = res.token;
      state.user = applyProfileOverride(
        normalizeMockUser(res.user, payload.role || "admin"),
      );
      state.mode = "mock";
      writeToken(res.token);
      writeMode("mock");
      syncProfileShadow(state.user);
      return state.user;
    }
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
    if (state.mode === "mock" && state.token) {
      await mockApi.logout(state.token);
    }
  } finally {
    state.token = null;
    state.user = null;
    state.mode = null;
    writeToken(null);
    writeMode(null);
    state.isLoading = false;
    state.isReady = true;
  }
}

async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  if (!state.user) {
    throw new Error("Unauthorized");
  }
  if (!payload.currentPassword.trim()) {
    throw new Error("Current password is required");
  }
  if (payload.newPassword.trim().length < 6) {
    throw new Error("New password must be at least 6 characters");
  }

  if (state.mode === "mock" && state.token) {
    await mockApi.changePassword({
      token: state.token,
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    });
  }

  mockWorkspace.changePassword({
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
  });
}

async function updateProfile(payload: { name: string; email?: string }) {
  if (!state.user) {
    throw new Error("Unauthorized");
  }

  const nextUser: AuthUser = {
    ...state.user,
    name: payload.name.trim(),
    email: payload.email?.trim() || state.user.email,
  };

  if (state.mode === "mock" && state.token) {
    await mockApi.updateProfile({
      token: state.token,
      name: nextUser.name,
    });
  }

  state.user = nextUser;
  writeProfileOverride({
    name: nextUser.name,
    email: nextUser.email,
  });
  syncProfileShadow(nextUser);
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
