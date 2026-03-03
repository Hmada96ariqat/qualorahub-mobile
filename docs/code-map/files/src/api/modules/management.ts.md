# Code Map: `src/api/modules/management.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { operations } from '../generated/schema';`
- `import {`

## Exports
- `export type ManagedUser = {`
- `export type ManagedRolePermission = {`
- `export type ManagedRole = {`
- `export type ManagedRoleOption = {`
- `export type ManagedInvite = {`
- `export type ManagedContact = {`
- `export type ManagedContactsPage = {`
- `export type ManagedNotificationType =`
- `export type ManagedNotification = {`
- `export type FarmStorefrontContext = {`
- `export type StorefrontSettingsRecord = {`
- `export type CreateManagedRoleRequest = {`
- `export type UpdateManagedRoleRequest = {`
- `export type CreateManagedInviteRequest = {`
- `export type UpdateManagedUserRequest = {`
- `export type CreateManagedContactRequest = {`
- `export type UpdateManagedContactRequest = Partial<CreateManagedContactRequest>;`
- `export type CreateStorefrontSettingsRequest = {`
- `export type UpdateStorefrontSettingsRequest = {`
- `export type CreateManagedNotificationRequest = {`
- `export type UpdateManagedNotificationRequest = {`
- `export async function listManagedUsers(token: string): Promise<ManagedUser[]> {`
- `export async function updateManagedUser(`
- `export async function listManagedRoles(token: string): Promise<ManagedRole[]> {`
- `export async function createManagedRole(`
- `export async function updateManagedRole(`
- `export async function deleteManagedRole(token: string, roleId: string): Promise<boolean> {`
- `export async function listManagedRoleOptions(token: string): Promise<ManagedRoleOption[]> {`
- `export async function listManagedInvites(token: string): Promise<ManagedInvite[]> {`
- `export async function createManagedInvite(`
- `export async function deleteManagedInvite(token: string, inviteId: string): Promise<boolean> {`
- `export async function listManagedContacts(`
- `export async function createManagedContact(`
- `export async function updateManagedContact(`
- `export async function getFarmStorefrontContext(token: string): Promise<FarmStorefrontContext> {`
- `export async function getStorefrontSettingsByFarm(`
- `export async function createStorefrontSettings(`
- `export async function updateStorefrontSettings(`
- `export async function listManagedNotifications(token: string): Promise<ManagedNotification[]> {`
- `export async function createManagedNotification(`
- `export async function updateManagedNotification(`
- `export async function deleteManagedNotification(token: string, notificationId: string): Promise<boolean> {`
