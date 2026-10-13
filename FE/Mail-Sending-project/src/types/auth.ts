export type AuthRole = "admin" | "user";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLogin?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role?: AuthRole;
};

export type OtpRequestPayload = {
  email: string;
  expiresInMinutes: number;
  requiresOtp: boolean;
  debugOtp?: string;
};

export type OtpVerifyPayload = {
  email: string;
  otp: string;
};

export type PasswordChangePayload = {
  oldPassword?: string;
  newPassword?: string;
  otp?: string;
};

export type ProfileUpdatePayload = {
  name?: string;
  email?: string;
};
