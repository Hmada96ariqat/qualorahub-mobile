# Code Map: `src/api/modules/livestock.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { operations } from '../generated/schema';`
- `import {`

## Exports
- `export type CreateAnimalRequest =`
- `export type UpdateAnimalRequest =`
- `export type CreateHousingUnitRequest =`
- `export type UpdateHousingUnitRequest =`
- `export type CreateWeatherAlertRuleRequest =`
- `export type UpdateWeatherAlertRuleRequest =`
- `export type CreateAnimalGroupRequest =`
- `export type UpdateAnimalGroupRequest =`
- `export type CreateAnimalHealthCheckRequest =`
- `export type UpdateAnimalHealthCheckRequest =`
- `export type CreateAnimalYieldRecordRequest =`
- `export type UpdateAnimalYieldRecordRequest =`
- `export type CreateHousingMaintenanceRecordRequest =`
- `export type UpdateHousingMaintenanceRecordRequest =`
- `export type CreateHousingConsumptionLogRequest =`
- `export type UpdateHousingConsumptionLogRequest =`
- `export type AnimalRecord = {`
- `export type AnimalGroup = {`
- `export type AnimalHealthCheck = {`
- `export type AnimalYieldRecord = {`
- `export type HousingUnit = {`
- `export type HousingMaintenanceRecord = {`
- `export type HousingConsumptionLog = {`
- `export type WeatherAlertRule = {`
- `export async function listAnimals(token: string): Promise<AnimalRecord[]> {`
- `export async function createAnimal(token: string, input: CreateAnimalRequest): Promise<AnimalRecord> {`
- `export async function updateAnimal(`
- `export async function deactivateAnimal(token: string, animalId: string): Promise<boolean> {`
- `export async function listAnimalGroups(token: string): Promise<AnimalGroup[]> {`
- `export async function createAnimalGroup(`
- `export async function updateAnimalGroup(`
- `export async function deactivateAnimalGroup(token: string, groupId: string): Promise<boolean> {`
- `export async function listAnimalHealthChecks(token: string, animalId: string): Promise<AnimalHealthCheck[]> {`
- `export async function createAnimalHealthCheck(`
- `export async function updateAnimalHealthCheck(`
- `export async function deleteAnimalHealthCheck(token: string, healthCheckId: string): Promise<boolean> {`
- `export async function listAnimalYieldRecords(token: string, animalId: string): Promise<AnimalYieldRecord[]> {`
- `export async function createAnimalYieldRecord(`
- `export async function updateAnimalYieldRecord(`
- `export async function deleteAnimalYieldRecord(token: string, yieldRecordId: string): Promise<boolean> {`
- `export async function listHousingUnits(token: string): Promise<HousingUnit[]> {`
- `export async function createHousingUnit(`
- `export async function updateHousingUnit(`
- `export async function deactivateHousingUnit(token: string, housingUnitId: string): Promise<boolean> {`
- `export async function reactivateHousingUnit(token: string, housingUnitId: string): Promise<boolean> {`
- `export async function listHousingMaintenanceRecords(`
- `export async function createHousingMaintenanceRecord(`
- `export async function updateHousingMaintenanceRecord(`
- `export async function deleteHousingMaintenanceRecord(`
- `export async function listHousingConsumptionLogs(`
- `export async function createHousingConsumptionLog(`
- `export async function updateHousingConsumptionLog(`
- `export async function deleteHousingConsumptionLog(`
- `export async function listWeatherAlertRules(`
- `export async function listWeatherAlertRulesByLot(`
- `export async function listWeatherAlertRulesByLocation(`
- `export async function createWeatherAlertRule(`
- `export async function updateWeatherAlertRule(`
- `export async function deleteWeatherAlertRule(`
- `export function buildAnimalTypeOptions(housingUnits: HousingUnit[]): Array<{ label: string; value: string }> {`
- `export function inferHousingAnimalTypes(payload: unknown): string[] {`
