import React from 'react';
import { View } from 'react-native';
import type {
  HousingConsumptionLog,
  HousingMaintenanceRecord,
  HousingUnit,
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
  buildHousingOverviewCells,
  formatLivestockStatusLabel,
  toLivestockRowIconVariant,
  toLivestockStatusBadgeVariant,
} from '../../livestockPresentation';
import { LivestockFactRow } from './LivestockFactRow.component';

type LivestockHousingDetailSheetProps = {
  housingUnit: HousingUnit | null;
  fieldLabel?: string;
  maintenanceRecords: HousingMaintenanceRecord[];
  consumptionLogs: HousingConsumptionLog[];
  detailsLoading: boolean;
  detailsErrorMessage: string | null;
  quickActions: QuickAction[];
  onDismiss: () => void;
  onRetry: () => void;
  onAddMaintenance: () => void;
  onAddConsumption: () => void;
  onPressMaintenance: (record: HousingMaintenanceRecord) => void;
  onPressConsumption: (record: HousingConsumptionLog) => void;
};

export function LivestockHousingDetailSheet({
  housingUnit,
  fieldLabel,
  maintenanceRecords,
  consumptionLogs,
  detailsLoading,
  detailsErrorMessage,
  quickActions,
  onDismiss,
  onRetry,
  onAddMaintenance,
  onAddConsumption,
  onPressMaintenance,
  onPressConsumption,
}: LivestockHousingDetailSheetProps) {
  return (
    <BottomSheet
      visible={Boolean(housingUnit)}
      onDismiss={onDismiss}
      title={housingUnit?.barnName ?? 'Housing detail'}
      testID="livestock-housing-detail"
    >
      {!housingUnit ? (
        <EmptyState title="No details" message="Housing details could not be loaded." />
      ) : (
        <>
          <ProfileCard
            icon="home-group"
            name={housingUnit.barnName}
            subtitle={fieldLabel || housingUnit.unitCode || 'Housing unit'}
            cells={buildHousingOverviewCells({ housingUnit, fieldLabel })}
            testID="livestock-housing-detail.profile"
          />

          {quickActions.length > 0 ? (
            <QuickActionGrid
              actions={quickActions}
              testID="livestock-housing-detail.actions"
            />
          ) : null}

          <DetailSectionCard title="Housing Details">
            <LivestockFactRow label="Unit Code" value={housingUnit.unitCode || 'n/a'} />
            <LivestockFactRow
              label="Status"
              value={formatLivestockStatusLabel(housingUnit.currentStatus)}
            />
            <LivestockFactRow
              label="Animal Types"
              value={housingUnit.animalTypes.length > 0 ? housingUnit.animalTypes.join(', ') : 'n/a'}
            />
            <LivestockFactRow label="Notes" value={housingUnit.notes || 'n/a'} />
          </DetailSectionCard>

          <DetailSectionCard
            title="Maintenance"
            trailing={
              <AppButton
                label="Add"
                mode="outlined"
                tone="neutral"
                onPress={onAddMaintenance}
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
            ) : maintenanceRecords.length === 0 ? (
              <EmptyState
                title="No maintenance records"
                message="Add the first maintenance record for this unit."
                actionLabel="Add maintenance"
                onAction={onAddMaintenance}
              />
            ) : (
              <View>
                {maintenanceRecords.map((record) => (
                  <ListRow
                    key={record.id}
                    icon="wrench-outline"
                    iconVariant={toLivestockRowIconVariant(record.status)}
                    title={record.maintenanceType || 'Maintenance'}
                    subtitle={record.date?.slice(0, 10) || 'No date'}
                    badge={
                      <DotBadge
                        label={formatLivestockStatusLabel(record.status)}
                        variant={toLivestockStatusBadgeVariant(record.status)}
                      />
                    }
                    onPress={() => onPressMaintenance(record)}
                  />
                ))}
              </View>
            )}
          </DetailSectionCard>

          <DetailSectionCard
            title="Consumption"
            trailing={
              <AppButton
                label="Add"
                mode="outlined"
                tone="neutral"
                onPress={onAddConsumption}
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
            ) : consumptionLogs.length === 0 ? (
              <EmptyState
                title="No consumption logs"
                message="Add the first consumption log for this unit."
                actionLabel="Add consumption"
                onAction={onAddConsumption}
              />
            ) : (
              <View>
                {consumptionLogs.map((record) => (
                  <ListRow
                    key={record.id}
                    icon="water-outline"
                    iconVariant="green"
                    title={record.date?.slice(0, 10) || 'Consumption log'}
                    subtitle={record.notes || 'No notes'}
                    badge={
                      <DotBadge
                        label={
                          record.feedAmount === null && record.waterAmount === null
                            ? 'n/a'
                            : [
                                record.feedAmount === null ? null : `Feed ${record.feedAmount}`,
                                record.waterAmount === null ? null : `Water ${record.waterAmount}`,
                              ]
                                .filter(Boolean)
                                .join(' · ')
                        }
                        variant="neutral"
                      />
                    }
                    onPress={() => onPressConsumption(record)}
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
