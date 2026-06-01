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

export type AuthRole = "admin" | "user";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLogin?: string | null;
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

type OtpRequestPayload = {
  email: string;
  expiresInMinutes: number;
  requiresOtp: boolean;
  debugOtp?: string;
};

type ProfileUpdatePayload = {
  user?: AuthUser;
  email?: string;
  expiresInMinutes?: number;
  requiresOtp: boolean;
  debugOtp?: string;
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
    method: "GET" | "POST" | "PATCH";
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

function normalizeRole(value: unknown): AuthRole {
  return String(value || "").trim().toLowerCase() === "admin" ? "admin" : "user";
}

type RawAuthUser = Partial<AuthUser> & {
  id: string | number;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  last_login?: string | null;
};

function normalizeAuthUser(user: RawAuthUser): AuthUser {
  return {
    id: Number(user.id),
    name: String(user.name || ""),
    email: String(user.email || ""),
    role: normalizeRole(user.role),
    isActive: user.isActive !== false && user.is_active !== false,
    createdAt: user.createdAt ?? user.created_at ?? null,
    updatedAt: user.updatedAt ?? user.updated_at ?? null,
    lastLogin: user.lastLogin ?? user.last_login ?? null,
  };
}

function normalizeMockUser(
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
    isActive?: boolean;
  },
  role?: AuthRole,
): AuthUser {
  const numericId = Number.parseInt(user.id.replace(/\D/g, "").slice(0, 9), 10);
  return {
    id: Number.isFinite(numericId) ? numericId : Date.now(),
    name: user.name,
    email: user.email,
    role: role || normalizeRole(user.role),
    isActive: user.isActive !== false,
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
const isAdmin = computed(() => state.user?.role === "admin");
const MOCK_OTP = "123456";
let mockPendingRegistration:
  | { name: string; email: string; password: string; role?: string }
  | null = null;
let mockPendingPasswordChange:
  | { currentPassword: string; newPassword: string }
  | null = null;
let mockPendingProfileUpdate: { name: string; email: string } | null = null;

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
      state.user = normalizeAuthUser(res.data);
      writeProfileOverride(null);
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
      state.user = normalizeAuthUser(res.data.user);
      state.mode = "api";
      writeToken(res.data.token);
      writeMode("api");
      writeProfileOverride(null);
      syncProfileShadow(state.user);
      return state.user;
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
          role: normalizeRole(payload.role),
        },
      });
      state.token = res.data.token;
      state.user = normalizeAuthUser(res.data.user);
      state.mode = "api";
      writeToken(res.data.token);
      writeMode("api");
      writeProfileOverride(null);
      syncProfileShadow(state.user);
      return state.user;
    } catch (error) {
      if (!shouldFallbackToMock(error)) {
        throw error;
      }

      const res = await mockApi.register({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: normalizeRole(payload.role),
      });
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

async function requestRegisterOtp(payload: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  state.isLoading = true;
  state.error = null;
  try {
    try {
      const res = await authRequest<OtpRequestPayload>("/auth/register", {
        method: "POST",
        body: {
          ...payload,
          role: normalizeRole(payload.role),
        },
      });
      return res.data;
    } catch (error) {
      if (!shouldFallbackToMock(error)) {
        throw error;
      }

      mockPendingRegistration = {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: normalizeRole(payload.role),
      };
      return {
        email: payload.email,
        expiresInMinutes: 10,
        requiresOtp: true,
        debugOtp: MOCK_OTP,
      };
    }
  } catch (e) {
    state.error = getErrorMessage(e);
    throw e;
  } finally {
    state.isLoading = false;
  }
}

async function verifyRegisterOtp(payload: { email: string; otp: string }) {
  state.isLoading = true;
  state.error = null;
  try {
    try {
      const res = await authRequest<AuthPayload>("/auth/register/verify-otp", {
        method: "POST",
        body: payload,
      });
      state.token = res.data.token;
      state.user = normalizeAuthUser(res.data.user);
      state.mode = "api";
      writeToken(res.data.token);
      writeMode("api");
      writeProfileOverride(null);
      syncProfileShadow(state.user);
      return state.user;
    } catch (error) {
      if (!shouldFallbackToMock(error)) {
        throw error;
      }

      if (!mockPendingRegistration) {
        throw new Error("No pending registration OTP request");
      }
      if (payload.otp.trim() !== MOCK_OTP) {
        throw new Error("OTP is invalid or expired");
      }

      const res = await mockApi.register({
        name: mockPendingRegistration.name,
        email: mockPendingRegistration.email,
        password: mockPendingRegistration.password,
        role: normalizeRole(mockPendingRegistration.role),
      });
      mockPendingRegistration = null;
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

async function requestPasswordChangeOtp(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  if (!state.user || !state.token) {
    throw new Error("Unauthorized");
  }
  if (!payload.currentPassword.trim()) {
    throw new Error("Current password is required");
  }
  if (payload.newPassword.trim().length < 8) {
    throw new Error("New password must be at least 8 characters");
  }

  state.isLoading = true;
  state.error = null;
  try {
    if (state.mode === "mock") {
      mockPendingPasswordChange = {
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
      };
      return {
        email: state.user.email,
        expiresInMinutes: 10,
        requiresOtp: true,
        debugOtp: MOCK_OTP,
      };
    }

    const res = await authRequest<OtpRequestPayload>("/auth/password/request-otp", {
      method: "POST",
      token: state.token,
      body: payload,
    });
    return res.data;
  } catch (e) {
    state.error = getErrorMessage(e);
    throw e;
  } finally {
    state.isLoading = false;
  }
}

async function verifyPasswordChangeOtp(payload: { otp: string }) {
  if (!state.user || !state.token) {
    throw new Error("Unauthorized");
  }

  state.isLoading = true;
  state.error = null;
  try {
    if (state.mode === "mock") {
      if (!mockPendingPasswordChange) {
        throw new Error("No pending password change OTP request");
      }
      if (payload.otp.trim() !== MOCK_OTP) {
        throw new Error("OTP is invalid or expired");
      }
      await mockApi.changePassword({
        token: state.token,
        currentPassword: mockPendingPasswordChange.currentPassword,
        newPassword: mockPendingPasswordChange.newPassword,
      });
      mockWorkspace.changePassword(mockPendingPasswordChange);
      mockPendingPasswordChange = null;
      return { ok: true };
    }

    const res = await authRequest<{ ok: boolean }>("/auth/password/verify-otp", {
      method: "POST",
      token: state.token,
      body: payload,
    });
    return res.data;
  } catch (e) {
    state.error = getErrorMessage(e);
    throw e;
  } finally {
    state.isLoading = false;
  }
}

async function updateProfile(payload: { name: string; email?: string }) {
  if (!state.user || !state.token) {
    throw new Error("Unauthorized");
  }

  const currentUser = state.user;
  const token = state.token;
  const nextName = payload.name.trim();
  const nextEmail = payload.email?.trim().toLowerCase() || currentUser.email;
  if (!nextName) {
    throw new Error("Name is required");
  }
  if (!nextEmail) {
    throw new Error("Email is required");
  }

  state.isLoading = true;
  state.error = null;
  try {
    if (state.mode === "mock") {
      if (nextEmail !== currentUser.email.toLowerCase()) {
        mockPendingProfileUpdate = {
          name: nextName,
          email: nextEmail,
        };
        return {
          email: nextEmail,
          expiresInMinutes: 10,
          requiresOtp: true,
          debugOtp: MOCK_OTP,
        } satisfies ProfileUpdatePayload;
      }

      const user = await mockApi.updateProfile({
        token,
        name: nextName,
        email: nextEmail,
      });
      const updatedUser = normalizeMockUser(user, currentUser.role);
      state.user = updatedUser;
      writeProfileOverride({
        name: updatedUser.name,
        email: updatedUser.email,
      });
      syncProfileShadow(updatedUser);
      return {
        requiresOtp: false,
        user: updatedUser,
      } satisfies ProfileUpdatePayload;
    }

    const res = await authRequest<ProfileUpdatePayload>("/auth/profile", {
      method: "PATCH",
      token,
      body: {
        name: nextName,
        email: nextEmail,
      },
    });

    if (res.data.requiresOtp) {
      return res.data;
    }

    if (res.data.user) {
      state.user = normalizeAuthUser(res.data.user);
      writeProfileOverride(null);
      syncProfileShadow(state.user);
    }
    return res.data;
  } catch (e) {
    state.error = getErrorMessage(e);
    throw e;
  } finally {
    state.isLoading = false;
  }
}

async function verifyProfileEmailOtp(payload: { email: string; otp: string }) {
  if (!state.user || !state.token) {
    throw new Error("Unauthorized");
  }

  const currentUser = state.user;
  const token = state.token;
  state.isLoading = true;
  state.error = null;
  try {
    if (state.mode === "mock") {
      if (!mockPendingProfileUpdate) {
        throw new Error("No pending profile email OTP request");
      }
      if (payload.otp.trim() !== MOCK_OTP) {
        throw new Error("OTP is invalid or expired");
      }
      if (
        payload.email.trim().toLowerCase() !==
        mockPendingProfileUpdate.email.toLowerCase()
      ) {
        throw new Error("OTP is invalid or expired");
      }

      const user = await mockApi.updateProfile({
        token,
        name: mockPendingProfileUpdate.name,
        email: mockPendingProfileUpdate.email,
      });
      mockPendingProfileUpdate = null;
      const updatedUser = normalizeMockUser(user, currentUser.role);
      state.user = updatedUser;
      writeProfileOverride({
        name: updatedUser.name,
        email: updatedUser.email,
      });
      syncProfileShadow(updatedUser);
      return {
        requiresOtp: false,
        user: updatedUser,
      } satisfies ProfileUpdatePayload;
    }

    const res = await authRequest<ProfileUpdatePayload>(
      "/auth/profile/verify-email-otp",
      {
        method: "POST",
        token,
        body: payload,
      },
    );

    if (res.data.user) {
      state.user = normalizeAuthUser(res.data.user);
      writeProfileOverride(null);
      syncProfileShadow(state.user);
    }
    return res.data;
  } catch (e) {
    state.error = getErrorMessage(e);
    throw e;
  } finally {
    state.isLoading = false;
  }
}

export const auth = {
  state,
  isAuthenticated,
  isAdmin,
  restore,
  login,
  register,
  requestRegisterOtp,
  verifyRegisterOtp,
  logout,
  changePassword,
  requestPasswordChangeOtp,
  verifyPasswordChangeOtp,
  updateProfile,
  verifyProfileEmailOtp,
};
