export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3300/api/v1',
  refreshSkewSeconds: Number(process.env.EXPO_PUBLIC_AUTH_REFRESH_SKEW_SECONDS ?? 60),
} as const;
