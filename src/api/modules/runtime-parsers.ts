export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function readString(record: UnknownRecord, key: string, fallback = ''): string {
  const value = record[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

export function readNullableString(record: UnknownRecord, key: string): string | null {
  const value = record[key];
  if (typeof value === 'string') return value;
  return null;
}

export function readBoolean(record: UnknownRecord, key: string, fallback = false): boolean {
  const value = record[key];
  if (typeof value === 'boolean') return value;
  return fallback;
}

export function readArray(record: UnknownRecord, key: string): unknown[] {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

export function normalizeRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    if (payload.length === 2 && Array.isArray(payload[0]) && typeof payload[1] === 'number') {
      return payload[0];
    }

    return payload;
  }

  return payload === null || payload === undefined ? [] : [payload];
}
