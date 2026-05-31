import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_API_BASE_URL, normalizeBaseUrl } from "../api/http";
import type { AuthSession } from "../types";

const SESSION_KEY = "chadmailer.session";

export async function loadSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) {
    return {
      token: "",
      name: "",
      email: "",
      baseUrl: DEFAULT_API_BASE_URL,
    };
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    return {
      token: parsed.token || "",
      name: parsed.name || "",
      email: parsed.email || "",
      baseUrl: normalizeBaseUrl(parsed.baseUrl),
    };
  } catch {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function saveSession(session: AuthSession) {
  await AsyncStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      ...session,
      baseUrl: normalizeBaseUrl(session.baseUrl),
    }),
  );
}

export async function clearSession() {
  const existing = await loadSession();
  await AsyncStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      token: "",
      name: "",
      email: "",
      baseUrl: normalizeBaseUrl(existing?.baseUrl || DEFAULT_API_BASE_URL),
    }),
  );
}
