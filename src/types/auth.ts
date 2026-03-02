export type AuthUser = {
  id: string;
  email: string;
  role?: string;
  type?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix seconds
  user: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshRequest = {
  refresh_token: string;
};
