import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { palette, spacing, typography } from '../../../theme/tokens';
import type { RolePermissionFormValue } from '../contracts';
import { PERMISSION_MODULES } from '../contracts';

type Props = {
  permissions: RolePermissionFormValue[];
  onChange: (permissions: RolePermissionFormValue[]) => void;
  disabled?: boolean;
};

type CrudAction = 'canView' | 'canAdd' | 'canEdit' | 'canDelete';

const CRUD_COLUMNS: { key: CrudAction; label: string; shortLabel: string }[] = [
  { key: 'canView', label: 'View', shortLabel: 'V' },
  { key: 'canAdd', label: 'Add', shortLabel: 'A' },
  { key: 'canEdit', label: 'Edit', shortLabel: 'E' },
  { key: 'canDelete', label: 'Delete', shortLabel: 'D' },
];

function Checkbox({
  checked,
  onPress,
  disabled,
}: {
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.checkbox,
        checked && styles.checkboxChecked,
        disabled && styles.checkboxDisabled,
      ]}
      hitSlop={6}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      {checked ? (
        <Text style={styles.checkmark}>&#10003;</Text>
      ) : null}
    </Pressable>
  );
}

function GroupHeader({ title }: { title: string }) {
  return (
    <View style={styles.groupHeader}>
      <Text style={styles.groupHeaderText}>{title}</Text>
    </View>
  );
}

function PermissionRow({
  permission,
  index,
  onToggle,
  onToggleAll,
  disabled,
}: {
  permission: RolePermissionFormValue;
  index: number;
  onToggle: (index: number, action: CrudAction) => void;
  onToggleAll: (index: number) => void;
  disabled?: boolean;
}) {
  const allChecked =
    permission.canView &&
    permission.canAdd &&
    permission.canEdit &&
    permission.canDelete;

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.moduleCell}
        onPress={() => onToggleAll(index)}
        disabled={disabled}
        hitSlop={4}
      >
        <View style={styles.moduleLabelRow}>
          <Text style={styles.moduleLabel} numberOfLines={1}>
            {permission.label}
          </Text>
          {allChecked ? (
            <View style={styles.fullAccessBadge}>
              <Text style={styles.fullAccessBadgeText}>Full</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.actionsCell}>
        {CRUD_COLUMNS.map((col) => (
          <Checkbox
            key={col.key}
            checked={permission[col.key]}
            onPress={() => onToggle(index, col.key)}
            disabled={disabled}
          />
        ))}
      </View>
    </View>
  );
}

export function PermissionMatrixEditor({ permissions, onChange, disabled }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const groups = new Set<string>();
    for (const mod of PERMISSION_MODULES) {
      groups.add(mod.group);
    }
    return groups;
  });

  const groupedPermissions = useMemo(() => {
    const groups: { group: string; items: { permission: RolePermissionFormValue; index: number }[] }[] =
      [];
    const groupMap = new Map<string, { permission: RolePermissionFormValue; index: number }[]>();

    permissions.forEach((perm, index) => {
      const moduleDef = PERMISSION_MODULES.find((m) => m.key === perm.module);
      const groupName = moduleDef?.group ?? 'Other';
      let items = groupMap.get(groupName);
      if (!items) {
        items = [];
        groupMap.set(groupName, items);
        groups.push({ group: groupName, items });
      }
      items.push({ permission: perm, index });
    });

    return groups;
  }, [permissions]);

  const toggleGroup = useCallback(
    (group: string) => {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        if (next.has(group)) {
          next.delete(group);
        } else {
          next.add(group);
        }
        return next;
      });
    },
    [],
  );

  const handleToggle = useCallback(
    (index: number, action: CrudAction) => {
      const next = [...permissions];
      next[index] = { ...next[index], [action]: !next[index][action] };
      onChange(next);
    },
    [permissions, onChange],
  );

  const handleToggleAll = useCallback(
    (index: number) => {
      const next = [...permissions];
      const perm = next[index];
      const allChecked =
        perm.canView && perm.canAdd && perm.canEdit && perm.canDelete;
      const newValue = !allChecked;
      next[index] = {
        ...perm,
        canView: newValue,
        canAdd: newValue,
        canEdit: newValue,
        canDelete: newValue,
      };
      onChange(next);
    },
    [permissions, onChange],
  );

  const handleGrantAll = useCallback(() => {
    const next = permissions.map((perm) => ({
      ...perm,
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
    }));
    onChange(next);
  }, [permissions, onChange]);

  const handleRevokeAll = useCallback(() => {
    const next = permissions.map((perm) => ({
      ...perm,
      canView: false,
      canAdd: false,
      canEdit: false,
      canDelete: false,
    }));
    onChange(next);
  }, [permissions, onChange]);

  const totalGranted = useMemo(() => {
    let count = 0;
    for (const perm of permissions) {
      if (perm.canView) count++;
      if (perm.canAdd) count++;
      if (perm.canEdit) count++;
      if (perm.canDelete) count++;
    }
    return count;
  }, [permissions]);

  const totalPossible = permissions.length * 4;

  return (
    <View style={styles.container}>
      {/* Summary and Bulk Actions */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          {totalGranted} of {totalPossible} permissions granted
        </Text>
        <View style={styles.bulkActions}>
          <Pressable
            onPress={handleGrantAll}
            disabled={disabled}
            hitSlop={8}
            style={styles.bulkButton}
          >
            <Text style={[styles.bulkButtonText, disabled && styles.bulkButtonDisabled]}>
              Grant All
            </Text>
          </Pressable>
          <Text style={styles.bulkSeparator}>|</Text>
          <Pressable
            onPress={handleRevokeAll}
            disabled={disabled}
            hitSlop={8}
            style={styles.bulkButton}
          >
            <Text style={[styles.bulkButtonText, disabled && styles.bulkButtonDisabled]}>
              Revoke All
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Column Headers */}
      <View style={styles.headerRow}>
        <View style={styles.moduleCell}>
          <Text style={styles.headerLabel}>Module</Text>
        </View>
        <View style={styles.actionsCell}>
          {CRUD_COLUMNS.map((col) => (
            <Text key={col.key} style={styles.headerColLabel}>
              {col.shortLabel}
            </Text>
          ))}
        </View>
      </View>

      {/* Grouped Rows */}
      {groupedPermissions.map(({ group, items }) => {
        const isExpanded = expandedGroups.has(group);
        const groupGranted = items.reduce((acc, { permission: p }) => {
          return acc + (p.canView ? 1 : 0) + (p.canAdd ? 1 : 0) + (p.canEdit ? 1 : 0) + (p.canDelete ? 1 : 0);
        }, 0);
        const groupTotal = items.length * 4;

        return (
          <View key={group}>
            <Pressable
              style={styles.groupHeaderPressable}
              onPress={() => toggleGroup(group)}
            >
              <Text style={styles.groupHeaderText}>{group}</Text>
              <View style={styles.groupHeaderRight}>
                <Text style={styles.groupCount}>
                  {groupGranted}/{groupTotal}
                </Text>
                <Text style={styles.groupChevron}>{isExpanded ? '▾' : '▸'}</Text>
              </View>
            </Pressable>
            {isExpanded
              ? items.map(({ permission, index }) => (
                  <PermissionRow
                    key={permission.module}
                    permission={permission}
                    index={index}
                    onToggle={handleToggle}
                    onToggleAll={handleToggleAll}
                    disabled={disabled}
                  />
                ))
              : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  summaryText: {
    fontSize: 12,
    color: palette.mutedForeground,
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkButton: {
    paddingHorizontal: spacing.xs,
  },
  bulkButtonText: {
    fontSize: 12,
    color: palette.primary,
    fontWeight: '500',
  },
  bulkButtonDisabled: {
    color: palette.mutedForeground,
  },
  bulkSeparator: {
    fontSize: 12,
    color: palette.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.surfaceVariant,
    borderRadius: 6,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerColLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.mutedForeground,
    textTransform: 'uppercase',
    width: 36,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  groupHeaderPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: palette.muted,
    marginTop: spacing.sm,
    borderRadius: 6,
  },
  groupHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: palette.muted,
    marginTop: spacing.sm,
    borderRadius: 6,
  },
  groupHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.foreground,
  },
  groupHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupCount: {
    fontSize: 11,
    color: palette.mutedForeground,
  },
  groupChevron: {
    fontSize: 12,
    color: palette.mutedForeground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  moduleCell: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  moduleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  moduleLabel: {
    fontSize: 14,
    color: palette.foreground,
    flexShrink: 1,
  },
  fullAccessBadge: {
    backgroundColor: palette.primaryLight + '20',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  fullAccessBadgeText: {
    fontSize: 10,
    color: palette.primary,
    fontWeight: '600',
  },
  actionsCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: palette.surface,
  },
  checkboxChecked: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  checkboxDisabled: {
    opacity: 0.4,
  },
  checkmark: {
    color: palette.onPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
});
