# Code Map: `src/modules/management/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type {`

## Exports
- `export type ManagementTab = 'users' | 'contacts' | 'notifications' | 'access';`
- `export const MANAGEMENT_TABS = [`
- `export const CONTACT_TYPE_OPTIONS = [`
- `export const CONTACT_STATUS_OPTIONS = [`
- `export const NOTIFICATION_TYPE_OPTIONS = [`
- `export type ManagementModuleKey = 'users' | 'contacts' | 'notifications';`
- `export type RoleCapability = 'full' | 'read-only' | 'none';`
- `export type AccessState = 'full' | 'read-only' | 'locked-role' | 'locked-subscription';`
- `export type RoleFormValues = {`
- `export type InviteFormValues = {`
- `export type UserFormValues = {`
- `export type ContactFormValues = {`
- `export type NotificationFormValues = {`
- `export function parseCsvValues(value: string): string[] {`
- `export function toRoleFormValues(role?: ManagedRole | null): RoleFormValues {`
- `export function toInviteFormValues(roleId = ''): InviteFormValues {`
- `export function toUserFormValues(user?: ManagedUser | null): UserFormValues {`
- `export function toContactFormValues(contact?: ManagedContact | null): ContactFormValues {`
- `export function toNotificationFormValues(): NotificationFormValues {`
- `export function normalizeRoleCapability(`
- `export function resolveAccessState(params: {`
- `export function createInviteTokenHash(email: string): string {`
- `export function toReadAtNow(): string {`
- `export function toDateInputValue(value: string | null | undefined): string {`
