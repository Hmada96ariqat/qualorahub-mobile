# Code Map: `src/modules/livestock/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type {`
- `import type { MapCoordinate } from '../../utils/geojson';`
- `import { fromGeoJsonPolygon } from '../../utils/geojson';`

## Exports
- `export type LivestockTab = 'animals' | 'housing' | 'weather';`
- `export const LIVESTOCK_TAB_OPTIONS = [`
- `export const ANIMAL_STATUS_OPTIONS = [`
- `export const WEATHER_OPERATOR_OPTIONS = [`
- `export const WEATHER_CONDITION_OPTIONS = [`
- `export const WEATHER_SEVERITY_OPTIONS = [`
- `export type AnimalFormValues = {`
- `export type AnimalGroupFormValues = {`
- `export type HealthCheckFormValues = {`
- `export type YieldRecordFormValues = {`
- `export type HousingUnitFormValues = {`
- `export type HousingMaintenanceFormValues = {`
- `export type HousingConsumptionFormValues = {`
- `export type WeatherRuleFormValues = {`
- `export function toAnimalFormValues(animal?: AnimalRecord | null): AnimalFormValues {`
- `export function toAnimalGroupFormValues(group?: AnimalGroup | null): AnimalGroupFormValues {`
- `export function toHealthCheckFormValues(record?: AnimalHealthCheck | null): HealthCheckFormValues {`
- `export function toYieldRecordFormValues(record?: AnimalYieldRecord | null): YieldRecordFormValues {`
- `export function toHousingUnitFormValues(unit?: HousingUnit | null): HousingUnitFormValues {`
- `export function toHousingMaintenanceFormValues(`
- `export function toHousingConsumptionFormValues(`
- `export function toWeatherRuleFormValues(rule?: WeatherAlertRule | null): WeatherRuleFormValues {`
- `export function parseCsvValues(value: string): string[] {`
