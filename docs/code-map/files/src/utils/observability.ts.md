# Code Map: `src/utils/observability.ts`

## Purpose
Pure utility or guard helper.

## Imports
- none

## Exports
- `export type ObservabilityLevel = 'info' | 'warning' | 'error';`
- `export type ObservabilityEventType =`
- `export type ObservabilityEvent = {`
- `export function trackObservabilityEvent(input: {`
- `export function registerObservabilitySink(sink: ObservabilitySink): () => void {`
- `export function getRecentObservabilityEvents(): ObservabilityEvent[] {`
- `export function clearObservabilityStateForTests(): void {`
- `export function markAppStartupComplete(context: Record<string, unknown> = {}): void {`
- `export function reportAppError(`
- `export function trackApiRequest(input: {`
- `export function trackApiError(input: {`
