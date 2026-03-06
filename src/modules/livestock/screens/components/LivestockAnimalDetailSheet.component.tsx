import React from 'react';
import { View } from 'react-native';
import type {
  AnimalHealthCheck,
  AnimalRecord,
  AnimalYieldRecord,
} from '../../../../api/modules/livestock';
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
  buildAnimalOverviewCells,
  formatLivestockStatusLabel,
  toLivestockRowIconVariant,
  toLivestockStatusBadgeVariant,
} from '../../livestockPresentation';
import { LivestockFactRow } from './LivestockFactRow.component';

type LivestockAnimalDetailSheetProps = {
  animal: AnimalRecord | null;
  housingLabel?: string;
  healthChecks: AnimalHealthCheck[];
  yieldRecords: AnimalYieldRecord[];
  detailsLoading: boolean;
  detailsErrorMessage: string | null;
  quickActions: QuickAction[];
  onDismiss: () => void;
  onRetry: () => void;
  onAddHealthCheck: () => void;
  onAddYieldRecord: () => void;
  onPressHealthCheck: (record: AnimalHealthCheck) => void;
  onPressYieldRecord: (record: AnimalYieldRecord) => void;
};

export function LivestockAnimalDetailSheet({
  animal,
  housingLabel,
  healthChecks,
  yieldRecords,
  detailsLoading,
  detailsErrorMessage,
  quickActions,
  onDismiss,
  onRetry,
  onAddHealthCheck,
  onAddYieldRecord,
  onPressHealthCheck,
  onPressYieldRecord,
}: LivestockAnimalDetailSheetProps) {
  return (
    <BottomSheet
      visible={Boolean(animal)}
      onDismiss={onDismiss}
      title={animal?.name ?? 'Animal detail'}
      testID="livestock-animal-detail"
    >
      {!animal ? (
        <EmptyState title="No details" message="Animal details could not be loaded." />
      ) : (
        <>
          <ProfileCard
            icon="cow"
            name={animal.name}
            subtitle={housingLabel || animal.species || 'Animal record'}
            cells={buildAnimalOverviewCells({ animal, housingLabel })}
            testID="livestock-animal-detail.profile"
          />

          {quickActions.length > 0 ? (
            <QuickActionGrid
              actions={quickActions}
              testID="livestock-animal-detail.actions"
            />
          ) : null}

          <DetailSectionCard title="Animal Details">
            <LivestockFactRow label="Breed" value={animal.breed || 'n/a'} />
            <LivestockFactRow
              label="Tag Number"
              value={animal.tagNumber || 'n/a'}
            />
            <LivestockFactRow
              label="Status"
              value={formatLivestockStatusLabel(animal.activeStatus)}
            />
            <LivestockFactRow
              label="Health"
              value={formatLivestockStatusLabel(animal.healthStatus)}
            />
            <LivestockFactRow
              label="Last Vet Visit"
              value={animal.lastVetVisit?.slice(0, 10) || 'n/a'}
            />
          </DetailSectionCard>

          <DetailSectionCard
            title="Health Checks"
            trailing={
              <AppButton
                label="Add"
                mode="outlined"
                tone="neutral"
                onPress={onAddHealthCheck}
              />
            }
          >
            {detailsLoading ? (
              <>
                <Skeleton height={68} />
                <Skeleton height={68} />
              </>
            ) : detailsErrorMessage ? (
              <ErrorState message={detailsErrorMessage} onRetry={onRetry} />
            ) : healthChecks.length === 0 ? (
              <EmptyState
                title="No health checks"
                message="Add the first health check for this animal."
                actionLabel="Add health check"
                onAction={onAddHealthCheck}
              />
            ) : (
              <View>
                {healthChecks.map((record) => (
                  <ListRow
                    key={record.id}
                    icon="stethoscope"
                    iconVariant={toLivestockRowIconVariant(record.status)}
                    title={record.status || 'Health check'}
                    subtitle={record.date?.slice(0, 10) || 'No date'}
                    badge={
                      <DotBadge
                        label={record.performedBy || 'n/a'}
                        variant={toLivestockStatusBadgeVariant(record.status)}
                      />
                    }
                    onPress={() => onPressHealthCheck(record)}
                  />
                ))}
              </View>
            )}
          </DetailSectionCard>

          <DetailSectionCard
            title="Yield Records"
            trailing={
              <AppButton
                label="Add"
                mode="outlined"
                tone="neutral"
                onPress={onAddYieldRecord}
              />
            }
          >
            {detailsLoading ? (
              <>
                <Skeleton height={68} />
                <Skeleton height={68} />
              </>
            ) : detailsErrorMessage ? (
              <ErrorState message={detailsErrorMessage} onRetry={onRetry} />
            ) : yieldRecords.length === 0 ? (
              <EmptyState
                title="No yield records"
                message="Add the first yield record for this animal."
                actionLabel="Add yield record"
                onAction={onAddYieldRecord}
              />
            ) : (
              <View>
                {yieldRecords.map((record) => (
                  <ListRow
                    key={record.id}
                    icon="chart-line"
                    iconVariant="green"
                    title={record.yieldType || 'Yield record'}
                    subtitle={record.date?.slice(0, 10) || 'No date'}
                    badge={
                      <DotBadge
                        label={
                          record.amount === null
                            ? 'n/a'
                            : `${record.amount} ${record.unit || ''}`.trim()
                        }
                        variant="neutral"
                      />
                    }
                    onPress={() => onPressYieldRecord(record)}
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
