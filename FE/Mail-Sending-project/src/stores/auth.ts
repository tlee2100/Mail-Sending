import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { authApi } from "../api/authApi";
import { ApiClientError, setTokenProvider, setUnauthorizedHandler } from "../api/http";
import type {
  AuthRole,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  OtpVerifyPayload,
  ProfileUpdatePayload,
} from "../types/auth";

export type { AuthRole, AuthUser };

const LS_TOKEN = "auth.token.v1";
const LS_PROFILE_OVERRIDE = "auth.profile.override.v1";

function readToken(): string | null {
  try {
    return localStorage.getItem(LS_TOKEN);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (!token) {
      localStorage.removeItem(LS_TOKEN);
    } else {
      localStorage.setItem(LS_TOKEN, token);
    }
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
    } else {
      localStorage.setItem(LS_PROFILE_OVERRIDE, JSON.stringify(payload));
    }
  } catch {
    // ignore
  }
}

function normalizeRole(value: unknown): AuthRole {
  return String(value || "")
    .trim()
    .toLowerCase() === "admin"
    ? "admin"
    : "user";
}

function normalizeAuthUser(user: Partial<AuthUser> & Record<string, unknown>): AuthUser {
  return {
    id: Number(user.id || 0),
    name: String(user.name || ""),
    email: String(user.email || "").toLowerCase(),
    role: normalizeRole(user.role),
    isActive: user.isActive !== false && user.is_active !== false,
    avatarUrl: (user.avatarUrl as string) || (user.avatar_url as string) || null,
    createdAt: (user.createdAt as string) || (user.created_at as string) || null,
    updatedAt: (user.updatedAt as string) || (user.updated_at as string) || null,
    lastLogin: (user.lastLogin as string) || (user.last_login as string) || null,
  };
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

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(readToken());
  const user = ref<AuthUser | null>(null);
  const isReady = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(token.value && user.value));
  const isAdmin = computed(() => user.value?.role === "admin");

  // Wire token provider and 401 handler into http.ts
  setTokenProvider(() => token.value);
  setUnauthorizedHandler(() => {
    logout();
  });

  function setSession(newToken: string, rawUser: Partial<AuthUser> & Record<string, unknown>) {
    token.value = newToken;
    writeToken(newToken);
    const normalized = normalizeAuthUser(rawUser);
    user.value = applyProfileOverride(normalized);
  }

  async function restore(): Promise<AuthUser | null> {
    if (isReady.value && user.value) {
      return user.value;
    }

    const savedToken = token.value || readToken();
    if (!savedToken) {
      isReady.value = true;
      user.value = null;
      return null;
    }

    token.value = savedToken;
    isLoading.value = true;
    error.value = null;

    try {
      const res = await authApi.me(savedToken);
      const normalized = normalizeAuthUser(res.data as Record<string, unknown>);
      user.value = applyProfileOverride(normalized);
      isReady.value = true;
      return user.value;
    } catch {
      token.value = null;
      user.value = null;
      writeToken(null);
      isReady.value = true;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(payload: LoginPayload): Promise<AuthUser> {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await authApi.login(payload);
      setSession(res.data.token, res.data.user as Record<string, unknown>);
      isReady.value = true;
      return user.value!;
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Login failed";
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(payload: RegisterPayload) {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await authApi.register(payload);
      return res.data;
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Registration failed";
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function verifyRegisterOtp(payload: OtpVerifyPayload): Promise<AuthUser> {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await authApi.verifyRegisterOtp(payload);
      setSession(res.data.token, res.data.user as Record<string, unknown>);
      isReady.value = true;
      return user.value!;
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "OTP verification failed";
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    writeToken(null);
    writeProfileOverride(null);
    isReady.value = true;
  }

  async function requestPasswordChangeOtp(payload: {
    oldPassword?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    const res = await authApi.requestPasswordChangeOtp(payload);
    return res.data;
  }

  async function verifyPasswordChangeOtp(payload: { email?: string; otp: string }) {
    const res = await authApi.verifyPasswordChangeOtp(payload);
    return res.data;
  }

  async function requestPasswordResetOtp(payload: string | { email: string }) {
    const res = await authApi.requestPasswordResetOtp(payload);
    return res.data;
  }

  async function verifyPasswordResetOtp(payload: {
    email: string;
    otp: string;
    newPassword?: string;
  }) {
    const res = await authApi.verifyPasswordResetOtp(payload);
    return res.data;
  }

  async function updateProfile(payload: ProfileUpdatePayload) {
    const res = await authApi.updateProfile(payload);
    const data = res.data;
    if (data && "id" in data) {
      const normalized = normalizeAuthUser(data as Record<string, unknown>);
      user.value = applyProfileOverride(normalized);
    }
    return data;
  }

  async function verifyProfileEmailOtp(payload: string | { email?: string; otp: string }) {
    const res = await authApi.verifyProfileEmailOtp(payload);
    const normalized = normalizeAuthUser(res.data as Record<string, unknown>);
    user.value = applyProfileOverride(normalized);
    return user.value;
  }

  return {
    token,
    user,
    isReady,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    restore,
    login,
    register,
    verifyRegisterOtp,
    logout,
    requestPasswordChangeOtp,
    verifyPasswordChangeOtp,
    requestPasswordResetOtp,
    verifyPasswordResetOtp,
    updateProfile,
    verifyProfileEmailOtp,
  };
});

// Backward-compatibility bridge for existing views accessing `auth.state` or `auth.login()` directly
export const auth = {
  get state() {
    const store = useAuthStore();
    return {
      get token() {
        return store.token;
      },
      set token(val: string | null) {
        store.token = val;
      },
      get user() {
        return store.user;
      },
      set user(val: AuthUser | null) {
        store.user = val;
      },
      get isReady() {
        return store.isReady;
      },
      set isReady(val: boolean) {
        store.isReady = val;
      },
      get isLoading() {
        return store.isLoading;
      },
      set isLoading(val: boolean) {
        store.isLoading = val;
      },
      get error() {
        return store.error;
      },
      set error(val: string | null) {
        store.error = val;
      },
      mode: "api" as const,
    };
  },
  get isAuthenticated() {
    return computed(() => useAuthStore().isAuthenticated);
  },
  restore: () => useAuthStore().restore(),
  login: (payload: LoginPayload) => useAuthStore().login(payload),
  register: (payload: RegisterPayload) => useAuthStore().register(payload),
  requestRegisterOtp: (payload: RegisterPayload) => useAuthStore().register(payload),
  verifyRegisterOtp: (payload: OtpVerifyPayload) => useAuthStore().verifyRegisterOtp(payload),
  logout: () => useAuthStore().logout(),
  requestPasswordChangeOtp: (payload: {
    oldPassword?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => useAuthStore().requestPasswordChangeOtp(payload),
  verifyPasswordChangeOtp: (payload: { email?: string; otp: string }) =>
    useAuthStore().verifyPasswordChangeOtp(payload),
  requestPasswordResetOtp: (payload: string | { email: string }) =>
    useAuthStore().requestPasswordResetOtp(payload),
  verifyPasswordResetOtp: (payload: { email: string; otp: string; newPassword?: string }) =>
    useAuthStore().verifyPasswordResetOtp(payload),
  updateProfile: (payload: ProfileUpdatePayload) => useAuthStore().updateProfile(payload),
  verifyProfileEmailOtp: (payload: string | { email?: string; otp: string }) =>
    useAuthStore().verifyProfileEmailOtp(payload),
};
