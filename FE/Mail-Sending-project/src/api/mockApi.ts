export type MockUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: MockUser;
};

type StoredUser = MockUser & { password: string };

const LS_USERS = "mock.users.v1";
const LS_SESSIONS = "mock.sessions.v1";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeed() {
  const users = readJson<StoredUser[]>(LS_USERS, []);
  if (users.length > 0) return;

  const admin: StoredUser = {
    id: uid(),
    name: "Frontend Demo",
    email: "frontend.demo@email.com",
    password: "Demo@123456",
  };
  writeJson(LS_USERS, [admin]);
  writeJson(LS_SESSIONS, {} as Record<string, string>);
}

function safeUser(u: StoredUser): MockUser {
  // do not expose password to UI
  const { password: _pw, ...rest } = u;
  return rest;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export class MockApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MockApiError";
    this.status = status;
  }
}

export const mockApi = {
  async register(payload: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    ensureSeed();
    await sleep(450);

    const name = payload.name.trim();
    const email = normalizeEmail(payload.email);
    const password = payload.password;

    if (!name) throw new MockApiError("Name is required");
    if (!email) throw new MockApiError("Email is required");
    if (password.length < 6)
      throw new MockApiError("Password must be at least 6 characters");

    const users = readJson<StoredUser[]>(LS_USERS, []);
    if (users.some((u) => normalizeEmail(u.email) === email)) {
      throw new MockApiError("Email already exists", 409);
    }

    const user: StoredUser = { id: uid(), name, email, password };
    users.push(user);
    writeJson(LS_USERS, users);

    const token = `mock.${user.id}.${Date.now()}`;
    const sessions = readJson<Record<string, string>>(LS_SESSIONS, {});
    sessions[token] = user.id;
    writeJson(LS_SESSIONS, sessions);

    return { token, user: safeUser(user) };
  },

  async login(payload: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    ensureSeed();
    await sleep(350);

    const email = normalizeEmail(payload.email);
    const password = payload.password;

    if (!email) throw new MockApiError("Email is required");
    if (!password) throw new MockApiError("Password is required");

    const users = readJson<StoredUser[]>(LS_USERS, []);
    const user = users.find((u) => normalizeEmail(u.email) === email);
    if (!user || user.password !== password)
      throw new MockApiError("Invalid email or password", 401);

    const token = `mock.${user.id}.${Date.now()}`;
    const sessions = readJson<Record<string, string>>(LS_SESSIONS, {});
    sessions[token] = user.id;
    writeJson(LS_SESSIONS, sessions);

    return { token, user: safeUser(user) };
  },

  async me(token: string): Promise<MockUser> {
    ensureSeed();
    await sleep(200);
    if (!token) throw new MockApiError("Unauthorized", 401);

    const sessions = readJson<Record<string, string>>(LS_SESSIONS, {});
    const userId = sessions[token];
    if (!userId) throw new MockApiError("Unauthorized", 401);

    const users = readJson<StoredUser[]>(LS_USERS, []);
    const user = users.find((u) => u.id === userId);
    if (!user) throw new MockApiError("Unauthorized", 401);
    return safeUser(user);
  },

  async logout(token: string): Promise<void> {
    ensureSeed();
    await sleep(150);
    const sessions = readJson<Record<string, string>>(LS_SESSIONS, {});
    if (token in sessions) {
      delete sessions[token];
      writeJson(LS_SESSIONS, sessions);
    }
  },

  async changePassword(payload: {
    token: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    ensureSeed();
    await sleep(400);

    const { token, currentPassword, newPassword } = payload;
    if (!token) throw new MockApiError("Unauthorized", 401);

    if (newPassword.length < 6)
      throw new MockApiError("New password must be at least 6 characters");

    const sessions = readJson<Record<string, string>>(LS_SESSIONS, {});
    const userId = sessions[token];
    if (!userId) throw new MockApiError("Unauthorized", 401);

    const users = readJson<StoredUser[]>(LS_USERS, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) throw new MockApiError("Unauthorized", 401);
    const currentUser = users[idx];
    if (!currentUser) throw new MockApiError("Unauthorized", 401);
    if (currentUser.password !== currentPassword) {
      throw new MockApiError("Current password is incorrect", 400);
    }

    users[idx] = { ...currentUser, password: newPassword };
    writeJson(LS_USERS, users);
  },

  async updateProfile(payload: {
    token: string;
    name: string;
  }): Promise<MockUser> {
    ensureSeed();
    await sleep(350);

    const { token, name } = payload;
    if (!token) throw new MockApiError("Unauthorized", 401);
    const displayName = name.trim();
    if (!displayName) throw new MockApiError("Name is required");

    const sessions = readJson<Record<string, string>>(LS_SESSIONS, {});
    const userId = sessions[token];
    if (!userId) throw new MockApiError("Unauthorized", 401);

    const users = readJson<StoredUser[]>(LS_USERS, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) throw new MockApiError("Unauthorized", 401);
    const currentUser = users[idx];
    if (!currentUser) throw new MockApiError("Unauthorized", 401);

    users[idx] = { ...currentUser, name: displayName };
    writeJson(LS_USERS, users);
    return safeUser(users[idx]);
  },
};
