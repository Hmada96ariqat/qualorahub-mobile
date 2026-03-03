# Code Map: `src/api/modules/equipment.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { operations } from '../generated/schema';`
- `import {`

## Exports
- `export type EquipmentStatus = string;`
- `export type EquipmentSummary = {`
- `export type EquipmentDetail = EquipmentSummary & {`
- `export type EquipmentOperatorOption = {`
- `export type EquipmentUsageLog = {`
- `export type MaintenanceRecord = {`
- `export type UpcomingMaintenanceItem = {`
- `export type CreateEquipmentRequest = {`
- `export type UpdateEquipmentRequest = Partial<CreateEquipmentRequest>;`
- `export type CreateUsageLogRequest = {`
- `export type UpdateUsageLogRequest = Partial<CreateUsageLogRequest>;`
- `export type CreateMaintenanceRecordRequest = {`
- `export type UpdateMaintenanceRecordRequest = Partial<CreateMaintenanceRecordRequest>;`
- `export async function listEquipment(token: string): Promise<EquipmentSummary[]> {`
- `export async function listUpcomingMaintenance(token: string): Promise<UpcomingMaintenanceItem[]> {`
- `export async function listEquipmentOperators(token: string): Promise<EquipmentOperatorOption[]> {`
- `export async function getEquipmentById(token: string, equipmentId: string): Promise<EquipmentDetail> {`
- `export async function createEquipment(`
- `export async function updateEquipment(`
- `export async function deactivateEquipment(token: string, equipmentId: string): Promise<EquipmentDetail> {`
- `export async function reactivateEquipment(token: string, equipmentId: string): Promise<EquipmentDetail> {`
- `export async function deleteEquipment(token: string, equipmentId: string): Promise<void> {`
- `export async function listUsageLogs(token: string, equipmentId: string): Promise<EquipmentUsageLog[]> {`
- `export async function createUsageLog(`
- `export async function updateUsageLog(`
- `export async function deleteUsageLog(token: string, usageLogId: string): Promise<void> {`
- `export async function listMaintenanceRecords(`
- `export async function createMaintenanceRecord(`
- `export async function updateMaintenanceRecord(`
- `export async function deleteMaintenanceRecord(token: string, recordId: string): Promise<void> {`
