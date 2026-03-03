# Code Map: `src/api/modules/runtime-parsers.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- none

## Exports
- `export type UnknownRecord = Record<string, unknown>;`
- `export function isRecord(value: unknown): value is UnknownRecord {`
- `export function readString(record: UnknownRecord, key: string, fallback = ''): string {`
- `export function readNullableString(record: UnknownRecord, key: string): string | null {`
- `export function readBoolean(record: UnknownRecord, key: string, fallback = false): boolean {`
- `export function readArray(record: UnknownRecord, key: string): unknown[] {`
- `export function normalizeRows(payload: unknown): unknown[] {`
