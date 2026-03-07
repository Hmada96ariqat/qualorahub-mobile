import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import {
  AppButton,
  AppDatePicker,
  AppSelect,
  AppTextArea,
  BottomSheet,
  DetailSectionCard,
  FormField,
} from '../../../../components';
import type {
  CreateHarvestOperationRequest,
  CropPracticeMapping,
  ProductionCycleSummary,
} from '../../../../api/modules/crops';
import { listTreatmentOperations } from '../../../../api/modules/crops';
import { listProductTypeMetaByIds } from '../../../../api/modules/inventory';
import {
  collectPhiProductIds,
  computePhiRestrictionsForDate,
  getMostRestrictivePhiDate,
  summarizePhiRestrictionsByProduct,
  type PhiRestrictionSummary,
} from '../../logbook/phiRestrictions';
import { localDateToYmd, summarizeHarvestWorkers } from '../../logbook/helpers';
import { validateHarvestWorkerRows } from '../../logbook/validation';
import type { ManagedContact, ManagedUser } from '../../../../api/modules/management';
import type { HarvestWorkerRow } from '../../logbook/types';
import { LogbookHarvestWorkersEditor } from './LogbookHarvestWorkersEditor.component';
import { PhiWarningDialog } from './PhiWarningDialog.component';
import { palette, spacing, typography } from '../../../../theme/tokens';

type HarvestOperationSheetProps = {
  visible: boolean;
  cycle: ProductionCycleSummary | null;
  token: string;
  practices: CropPracticeMapping[];
  users: ManagedUser[];
  contacts: ManagedContact[];
  currentUserId?: string | null;
  currentUserName: string;
  isSubmitting: boolean;
  onDismiss: () => void;
  onSubmit: (input: CreateHarvestOperationRequest) => Promise<void>;
};

function SheetFooter({
  onCancel,
  onSubmit,
  loading,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <View style={styles.footerRow}>
      <AppButton label="Cancel" mode="text" tone="neutral" onPress={onCancel} />
      <AppButton label="Save harvest" onPress={onSubmit} loading={loading} disabled={loading} />
    </View>
  );
}

export function HarvestOperationSheet({
  visible,
  cycle,
  token,
  practices,
  users,
  contacts,
  currentUserId,
  currentUserName,
  isSubmitting,
  onDismiss,
  onSubmit,
}: HarvestOperationSheetProps) {
  const [harvestDate, setHarvestDate] = useState(localDateToYmd(new Date()));
  const [practiceId, setPracticeId] = useState('');
  const [workers, setWorkers] = useState<HarvestWorkerRow[]>([]);
  const [notes, setNotes] = useState('');
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [workersError, setWorkersError] = useState<string | null>(null);
  const [phiOverrideAcknowledged, setPhiOverrideAcknowledged] = useState(false);
  const [phiRestrictions, setPhiRestrictions] = useState<PhiRestrictionSummary[]>([]);
  const [phiMostRestrictiveDate, setPhiMostRestrictiveDate] = useState<Date | null>(null);
  const [phiModalVisible, setPhiModalVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setHarvestDate(localDateToYmd(new Date()));
    setPracticeId('');
    setWorkers([]);
    setNotes('');
    setPracticeError(null);
    setWorkersError(null);
    setPhiOverrideAcknowledged(false);
    setPhiRestrictions([]);
    setPhiMostRestrictiveDate(null);
    setPhiModalVisible(false);
  }, [visible, cycle?.id]);

  const practiceOptions = useMemo(
    () =>
      practices
        .filter(
          (practice) =>
            practice.enabled &&
            String(practice.code || '').toLowerCase() !== 'main_harvest_pick',
        )
        .map((practice) => ({
          label: practice.label,
          value: practice.id,
        })),
    [practices],
  );

  async function submitHarvest(options?: { skipPhiPrecheck?: boolean }) {
    if (!cycle) {
      return;
    }

    const normalizedWorkers = summarizeHarvestWorkers(workers);
    const workerValidation = validateHarvestWorkerRows(workers);
    setWorkersError(workerValidation.workers ?? null);

    if (practiceOptions.length > 0 && !practiceId) {
      setPracticeError('Practice is required.');
      return;
    }

    if (!harvestDate) {
      setWorkersError('Harvest date is required.');
      return;
    }

    if (workerValidation.workers) {
      return;
    }

    if (!options?.skipPhiPrecheck) {
      try {
        const treatments = await listTreatmentOperations(token, cycle.id);
        const phiProductIds = collectPhiProductIds(
          treatments as Array<Record<string, unknown>>,
        );
        const productMeta =
          phiProductIds.length > 0
            ? await listProductTypeMetaByIds(token, phiProductIds)
            : [];
        const restrictions = summarizePhiRestrictionsByProduct(
          computePhiRestrictionsForDate({
            treatments: treatments as Array<Record<string, unknown>>,
            harvestDate: new Date(`${harvestDate}T00:00:00`),
            productMeta,
            unknownProductLabel: 'Unknown product',
            restrictToPesticideProducts: true,
          }),
        );
        const activeRestrictions = restrictions.filter((entry) => entry.isActive);

        setPhiRestrictions(restrictions);
        setPhiMostRestrictiveDate(getMostRestrictivePhiDate(restrictions));

        if (activeRestrictions.length > 0 && !phiOverrideAcknowledged) {
          setPhiModalVisible(true);
          return;
        }
      } catch (error) {
        setWorkersError(
          error instanceof Error ? error.message : 'Unable to validate PHI restrictions.',
        );
        return;
      }
    }

    await onSubmit({
      harvestDate,
      workers: normalizedWorkers.rows.map((worker) => ({
        workerId:
          worker.workerId.replace(/^(user:|contact:)/, '') ||
          `worker-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        workerName: worker.workerName || 'Unknown worker',
        quantity: worker.quantity,
        unit: worker.unit || 'kg',
        cost: typeof worker.cost === 'number' ? worker.cost : 0,
      })),
      totalHarvestedQuantity: normalizedWorkers.totalQuantity,
      totalHarvestedUnit: normalizedWorkers.unit,
      notes: notes.trim() || null,
      attachments: [],
      practiceId: practiceId || undefined,
    });

    onDismiss();
  }

  return (
    <>
      <BottomSheet
        visible={visible}
        onDismiss={onDismiss}
        title={cycle ? `Harvest: ${cycle.cropName ?? cycle.id}` : 'Harvest'}
        footer={
          <SheetFooter
            onCancel={onDismiss}
            onSubmit={() => void submitHarvest()}
            loading={isSubmitting}
          />
        }
      >
        {!cycle ? (
          <DetailSectionCard title="No cycle selected">
            <Text style={styles.helperText}>Choose a production cycle to log harvest.</Text>
          </DetailSectionCard>
        ) : (
          <>
            <DetailSectionCard
              title="Harvest operation"
              description="Record harvest workers and derived totals."
            >
              <FormField label="Harvest date" required errorText={!harvestDate ? 'Harvest date is required.' : undefined}>
                <AppDatePicker
                  value={harvestDate}
                  onChange={(nextValue) => {
                    setHarvestDate(nextValue ?? '');
                    setWorkersError(null);
                    setPhiOverrideAcknowledged(false);
                    setPhiRestrictions([]);
                    setPhiMostRestrictiveDate(null);
                    setPhiModalVisible(false);
                  }}
                  label="Harvest date"
                />
              </FormField>

              {practiceOptions.length > 0 ? (
                <FormField label="Practice" required errorText={practiceError ?? undefined}>
                  <AppSelect
                    value={practiceId || null}
                    options={practiceOptions}
                    onChange={(nextValue) => {
                      setPracticeId(nextValue);
                      setPracticeError(null);
                    }}
                    placeholder="Select practice"
                    label="Select practice"
                    searchable={practiceOptions.length > 6}
                    searchPlaceholder="Search practices"
                  />
                </FormField>
              ) : null}
            </DetailSectionCard>

            <DetailSectionCard title="Workers">
              <LogbookHarvestWorkersEditor
                value={workers}
                onChange={(nextRows) => {
                  setWorkers(nextRows);
                  setWorkersError(null);
                }}
                users={users}
                contacts={contacts}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                error={workersError}
              />
            </DetailSectionCard>

            <DetailSectionCard title="Notes">
              <AppTextArea
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes"
              />
            </DetailSectionCard>
          </>
        )}
      </BottomSheet>

      <PhiWarningDialog
        visible={phiModalVisible}
        restrictions={phiRestrictions}
        mostRestrictiveDate={phiMostRestrictiveDate}
        onCancel={() => setPhiModalVisible(false)}
        onProceed={() => {
          setPhiOverrideAcknowledged(true);
          setPhiModalVisible(false);
          void submitHarvest({ skipPhiPrecheck: true });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  helperText: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
});
