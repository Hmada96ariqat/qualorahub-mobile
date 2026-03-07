import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppButton, AppInput, AppSelect } from '../../../../components';
import type { ManagedContact, ManagedUser } from '../../../../api/modules/management';
import { LOGBOOK_HARVEST_UNIT_OPTIONS } from '../../logbook/selectOptions';
import type { HarvestWorkerRow } from '../../logbook/types';
import {
  LogbookPersonSelector,
  type LogbookPersonSelection,
} from './LogbookPersonSelector.component';
import { palette, radius, spacing, typography } from '../../../../theme/tokens';

type LogbookHarvestWorkersEditorProps = {
  value: unknown;
  onChange: (rows: HarvestWorkerRow[]) => void;
  users: ManagedUser[];
  contacts: ManagedContact[];
  currentUserId?: string | null;
  currentUserName: string;
  error?: string | null;
};

function toPositiveNumber(value: unknown): number | '' {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return '';
  }

  return parsed;
}

function toOptionalCost(value: unknown): number | '' {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return '';
  }

  return parsed;
}

function buildDefaultWorkerRow(args: {
  currentUserId?: string | null;
  currentUserName: string;
}): HarvestWorkerRow {
  return {
    workerId: args.currentUserId ? `user:${args.currentUserId}` : '',
    workerName: args.currentUserName,
    quantity: '',
    unit: 'kg',
    cost: '',
  };
}

function coerceRows(
  value: unknown,
  args: {
    currentUserId?: string | null;
    currentUserName: string;
  },
): HarvestWorkerRow[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [buildDefaultWorkerRow(args)];
  }

  const rows = value
    .filter(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry),
    )
    .map((entry) => ({
      workerId: String(entry.workerId ?? '').trim(),
      workerName: String(entry.workerName ?? '').trim(),
      quantity: toPositiveNumber(entry.quantity),
      unit: String(entry.unit ?? 'kg').trim() || 'kg',
      cost: toOptionalCost(entry.cost),
    }));

  return rows.length > 0 ? rows : [buildDefaultWorkerRow(args)];
}

function toSelection(worker: HarvestWorkerRow): LogbookPersonSelection | null {
  const workerId = worker.workerId.trim();
  if (!workerId || !worker.workerName.trim()) {
    return null;
  }

  if (workerId.startsWith('user:')) {
    return {
      type: 'user',
      id: workerId.replace(/^user:/, ''),
      name: worker.workerName,
    };
  }

  if (workerId.startsWith('contact:')) {
    return {
      type: 'contact',
      id: workerId.replace(/^contact:/, ''),
      name: worker.workerName,
    };
  }

  return null;
}

export function LogbookHarvestWorkersEditor({
  value,
  onChange,
  users,
  contacts,
  currentUserId,
  currentUserName,
  error = null,
}: LogbookHarvestWorkersEditorProps) {
  const rows = useMemo(
    () =>
      coerceRows(value, {
        currentUserId,
        currentUserName,
      }),
    [currentUserId, currentUserName, value],
  );

  function patchRows(nextRows: HarvestWorkerRow[]) {
    onChange(
      nextRows.length > 0
        ? nextRows
        : [buildDefaultWorkerRow({ currentUserId, currentUserName })],
    );
  }

  function updateRow(
    index: number,
    updater: (row: HarvestWorkerRow) => HarvestWorkerRow,
  ) {
    patchRows(
      rows.map((row, rowIndex) => (rowIndex === index ? updater(row) : row)),
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Workers</Text>
        <AppButton
          label="Add worker"
          mode="outlined"
          tone="neutral"
          onPress={() =>
            patchRows([
              ...rows,
              buildDefaultWorkerRow({
                currentUserId,
                currentUserName,
              }),
            ])
          }
        />
      </View>

      {rows.map((row, index) => (
        <View key={`${row.workerId || 'worker'}-${index}`} style={styles.rowCard}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>{`Worker #${index + 1}`}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove worker ${index + 1}`}
              disabled={rows.length === 1}
              onPress={() =>
                patchRows(rows.filter((_, rowIndex) => rowIndex !== index))
              }
              style={({ pressed }) => [
                styles.removeChip,
                rows.length === 1 ? styles.removeChipDisabled : null,
                pressed && rows.length > 1 ? styles.removeChipPressed : null,
              ]}
            >
              <Text style={styles.removeChipLabel}>Remove</Text>
            </Pressable>
          </View>

          <View style={styles.fieldStack}>
            <Text style={styles.fieldLabel}>Person</Text>
            <LogbookPersonSelector
              value={toSelection(row)}
              users={users}
              contacts={contacts}
              onChange={(selection) =>
                updateRow(index, (current) => ({
                  ...current,
                  workerId: selection ? `${selection.type}:${selection.id}` : '',
                  workerName: selection?.name ?? '',
                }))
              }
              placeholder="Select person"
              label="Select person"
              allowNone={false}
            />
          </View>

          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <AppInput
                value={row.quantity === '' ? '' : String(row.quantity)}
                onChangeText={(nextValue) =>
                  updateRow(index, (current) => ({
                    ...current,
                    quantity: nextValue.trim().length === 0 ? '' : toPositiveNumber(nextValue),
                  }))
                }
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Unit</Text>
              <AppSelect
                value={row.unit}
                options={LOGBOOK_HARVEST_UNIT_OPTIONS}
                onChange={(unit) =>
                  updateRow(index, (current) => ({
                    ...current,
                    unit,
                  }))
                }
                placeholder="Select unit"
                label="Select unit"
              />
            </View>
          </View>

          <View style={styles.fieldStack}>
            <Text style={styles.fieldLabel}>Cost (Optional)</Text>
            <AppInput
              value={row.cost === '' || row.cost === undefined ? '' : String(row.cost)}
              onChangeText={(nextValue) =>
                updateRow(index, (current) => ({
                  ...current,
                  cost:
                    nextValue.trim().length === 0 ? '' : toOptionalCost(nextValue),
                }))
              }
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
        </View>
      ))}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: palette.foreground,
    fontWeight: '600',
  },
  rowCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitle: {
    ...typography.body,
    color: palette.foreground,
    fontWeight: '600',
  },
  removeChip: {
    backgroundColor: palette.surfaceVariant,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  removeChipDisabled: {
    opacity: 0.45,
  },
  removeChipPressed: {
    opacity: 0.7,
  },
  removeChipLabel: {
    ...typography.caption,
    color: palette.destructive,
    fontWeight: '600',
  },
  fieldStack: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridItem: {
    flex: 1,
    gap: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: palette.destructive,
  },
});
