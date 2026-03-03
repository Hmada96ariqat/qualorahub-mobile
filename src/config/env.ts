import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3300/api/v1';

type ResolveApiBaseUrlOptions = {
  platform?: string;
  debugHost?: string | null;
};

type ConstantsLike = {
  expoConfig?: { hostUri?: string } | null;
  expoGoConfig?: { debuggerHost?: string } | null;
  manifest2?: {
    extra?: {
      expoGo?: { debuggerHost?: string } | null;
      expoClient?: { hostUri?: string } | null;
    } | null;
  } | null;
  manifest?: { debuggerHost?: string } | null;
};

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function parseHostCandidate(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.includes('://') ? value : `http://${value}`;

  try {
    const parsed = new URL(normalized);
    return parsed.hostname || null;
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function resolveExpoDebugHost(): string | null {
  const constants = Constants as ConstantsLike;
  const hostCandidates = [
    constants.expoConfig?.hostUri,
    constants.expoGoConfig?.debuggerHost,
    constants.manifest2?.extra?.expoGo?.debuggerHost,
    constants.manifest2?.extra?.expoClient?.hostUri,
    constants.manifest?.debuggerHost,
  ];

  for (const candidate of hostCandidates) {
    const parsed = parseHostCandidate(candidate);
    if (parsed && !isLoopbackHost(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function resolveApiBaseUrl(
  configuredValue: string | undefined = process.env.EXPO_PUBLIC_API_BASE_URL,
  options: ResolveApiBaseUrlOptions = {},
): string {
  const platform = options.platform ?? Platform.OS;
  const baseInput = stripTrailingSlash(configuredValue?.trim() || DEFAULT_API_BASE_URL);

  try {
    const parsed = new URL(baseInput);
    if (platform === 'web' || !isLoopbackHost(parsed.hostname)) {
      return stripTrailingSlash(parsed.toString());
    }

    const preferredDebugHost = options.debugHost ?? resolveExpoDebugHost();
    if (preferredDebugHost) {
      parsed.hostname = preferredDebugHost;
      return stripTrailingSlash(parsed.toString());
    }

    if (platform === 'android') {
      parsed.hostname = '10.0.2.2';
      return stripTrailingSlash(parsed.toString());
    }

    return stripTrailingSlash(parsed.toString());
  } catch {
    return baseInput;
  }
}

export function getNativeLoopbackWarning(
  apiBaseUrl: string,
  platform: string = Platform.OS,
): string | null {
  if (platform === 'web') return null;

  try {
    const parsed = new URL(apiBaseUrl);
    if (!isLoopbackHost(parsed.hostname)) {
      return null;
    }

    return (
      `API base URL is using loopback (${apiBaseUrl}). ` +
      'This works only on host/simulator contexts. On physical devices, use your LAN IP ' +
      '(example: http://192.168.x.x:3300/api/v1) via EXPO_PUBLIC_API_BASE_URL.'
    );
  } catch {
    return null;
  }
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
  refreshSkewSeconds: Number(process.env.EXPO_PUBLIC_AUTH_REFRESH_SKEW_SECONDS ?? 60),
} as const;
