import type { ManagedInvite, ManagedRole, ManagedUser } from '../../api/modules/management';
import type { DotBadgeVariant, ListRowIconVariant } from '../../components';

function toStartCase(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function toManagementStatusLabel(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return 'Unknown';
  if (normalized === 'active') return 'Active';
  if (normalized === 'inactive') return 'Inactive';
  if (normalized === 'pending') return 'Pending';
  if (normalized === 'accepted') return 'Accepted';
  if (normalized === 'expired') return 'Expired';
  return toStartCase(normalized);
}

export function toManagementStatusVariant(value: string | null | undefined): DotBadgeVariant {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'active' || normalized === 'accepted') return 'success';
  if (normalized === 'pending') return 'warning';
  if (normalized === 'inactive') return 'neutral';
  if (normalized === 'expired') return 'destructive';
  return 'neutral';
}

export function toManagementIconVariant(value: string | null | undefined): ListRowIconVariant {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'active' || normalized === 'accepted') return 'green';
  if (normalized === 'pending') return 'amber';
  return 'neutral';
}

export function toManagementDateLabel(value: string | null | undefined): string {
  if (!value) return 'n/a';
  const dateText = value.includes('T') ? value.slice(0, 10) : value;
  const parsed = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function toUserDisplayName(user: ManagedUser): string {
  return user.fullName?.trim() || user.email;
}

export function toUserRowSubtitle(user: ManagedUser): string {
  const segments = [user.roleName?.trim() || 'No role', user.email].filter(
    (value): value is string => Boolean(value && value.length > 0),
  );
  return segments.join(' · ');
}

export function toRoleRowSubtitle(role: ManagedRole): string {
  const permissionCount = `${role.permissions.length} permissions`;
  const linkedFieldsCount =
    role.linkedFields.length > 0 ? `${role.linkedFields.length} linked fields` : 'No linked fields';
  return `${permissionCount} · ${linkedFieldsCount}`;
}

export function toInviteDisplayName(invite: ManagedInvite): string {
  return invite.fullName?.trim() || invite.email;
}

export function toInviteRowSubtitle(invite: ManagedInvite): string {
  const expiresLabel = invite.expiresAt ? toManagementDateLabel(invite.expiresAt) : 'n/a';
  return `${invite.email} · Expires ${expiresLabel}`;
}
