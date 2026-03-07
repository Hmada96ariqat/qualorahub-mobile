import React from 'react';
import { View } from 'react-native';
import type {
  ProductionCycleOperationSummary,
  ProductionCycleSummary,
} from '../../../../api/modules/crops';
import {
  AppButton,
  BottomSheet,
  DetailSectionCard,
  DotBadge,
  EmptyState,
  ErrorState,
  ListRow,
  ProfileCard,
  QuickActionGrid,
  Skeleton,
  type QuickAction,
} from '../../../../components';
import {
  buildCycleOverviewCells,
  buildOperationRowSubtitle,
  formatCropStatusLabel,
  toCropRowIconVariant,
  toCropStatusBadgeVariant,
} from '../../cropsPresentation';
import { CropsFactRow } from './CropsFactRow.component';

type CropsCycleDetailSheetProps = {
  cycle: ProductionCycleSummary | null;
  operations: ProductionCycleOperationSummary[];
  operationsLoading: boolean;
  operationsErrorMessage: string | null;
  quickActions: QuickAction[];
  onDismiss: () => void;
  onRetryOperations: () => void;
  canAddOperation: boolean;
  onAddOperation: () => void;
  onPressOperation: (operation: ProductionCycleOperationSummary) => void;
};

export function CropsCycleDetailSheet({
  cycle,
  operations,
  operationsLoading,
  operationsErrorMessage,
  quickActions,
  onDismiss,
  onRetryOperations,
  canAddOperation,
  onAddOperation,
  onPressOperation,
}: CropsCycleDetailSheetProps) {
  return (
    <BottomSheet
      visible={Boolean(cycle)}
      onDismiss={onDismiss}
      title={cycle?.cropName ?? 'Production cycle detail'}
      testID="crops-cycle-detail"
    >
      {!cycle ? (
        <EmptyState title="No details" message="Cycle details could not be loaded." />
      ) : (
        <>
          <ProfileCard
            icon="chart-timeline-variant"
            name={cycle.cropName || cycle.cropId}
            subtitle={cycle.fieldName || cycle.fieldId}
            cells={buildCycleOverviewCells(cycle)}
            testID="crops-cycle-detail.profile"
          />

          {quickActions.length > 0 ? (
            <QuickActionGrid actions={quickActions} testID="crops-cycle-detail.actions" />
          ) : null}

          <DetailSectionCard title="Cycle Details">
            <CropsFactRow label="Field" value={cycle.fieldName || cycle.fieldId} />
            <CropsFactRow label="Lot" value={cycle.lotName || cycle.lotId} />
            <CropsFactRow label="Status" value={formatCropStatusLabel(cycle.status)} />
            <CropsFactRow label="Start Date" value={cycle.startDate.slice(0, 10)} />
            <CropsFactRow label="End Date" value={cycle.endDate?.slice(0, 10) || 'Open'} />
            <CropsFactRow label="Notes" value={cycle.notes || 'n/a'} />
          </DetailSectionCard>

          <DetailSectionCard
            title="Operations"
            description="Cycle activity recorded against the selected crop cycle."
            trailing={canAddOperation ? (
              <AppButton label="Add" mode="outlined" tone="neutral" onPress={onAddOperation} />
            ) : undefined}
          >
            {operationsLoading ? (
              <>
                <Skeleton height={68} />
                <Skeleton height={68} />
              </>
            ) : operationsErrorMessage ? (
              <ErrorState message={operationsErrorMessage} onRetry={onRetryOperations} />
            ) : operations.length === 0 ? (
              <EmptyState
                title="No operations recorded"
                message={
                  canAddOperation
                    ? 'Add the first operation for this production cycle.'
                    : 'This cycle is no longer active, so new operations cannot be added.'
                }
                actionLabel={canAddOperation ? 'Add operation' : undefined}
                onAction={canAddOperation ? onAddOperation : undefined}
              />
            ) : (
              <View>
                {operations.map((operation) => (
                  <ListRow
                    key={operation.id}
                    icon="hammer-wrench"
                    iconVariant={toCropRowIconVariant(operation.status)}
                    title={formatCropStatusLabel(operation.type)}
                    subtitle={buildOperationRowSubtitle(operation)}
                    badge={
                      <DotBadge
                        label={formatCropStatusLabel(operation.status)}
                        variant={toCropStatusBadgeVariant(operation.status)}
                      />
                    }
                    onPress={() => onPressOperation(operation)}
                  />
                ))}
              </View>
            )}
          </DetailSectionCard>
        </>
      )}
    </BottomSheet>
  );
}
