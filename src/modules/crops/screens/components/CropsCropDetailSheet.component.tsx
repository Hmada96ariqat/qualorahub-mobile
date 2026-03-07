import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import type { CropPracticeMapping, CropSummary } from '../../../../api/modules/crops';
import {
  AlertStrip,
  AppButton,
  BottomSheet,
  DetailSectionCard,
  EmptyState,
  ErrorState,
  LogRow,
  ProfileCard,
  QuickActionGrid,
  Skeleton,
  type QuickAction,
} from '../../../../components';
import {
  buildCropOverviewCells,
  formatCropStatusLabel,
  formatDomainAreaLabel,
  formatOperationFamilyLabel,
} from '../../cropsPresentation';
import { CropsFactRow } from './CropsFactRow.component';

type CropsCropDetailSheetProps = {
  crop: CropSummary | null;
  fieldLabel?: string;
  cropGroupLabel?: string;
  practices: CropPracticeMapping[];
  practicesLoading: boolean;
  practicesErrorMessage: string | null;
  quickActions: QuickAction[];
  onDismiss: () => void;
  onRetryPractices: () => void;
  onOpenOperations: () => void;
};

export function CropsCropDetailSheet({
  crop,
  fieldLabel,
  cropGroupLabel,
  practices,
  practicesLoading,
  practicesErrorMessage,
  quickActions,
  onDismiss,
  onRetryPractices,
  onOpenOperations,
}: CropsCropDetailSheetProps) {
  const enabledPractices = practices.filter((practice) => practice.enabled);

  return (
    <BottomSheet
      visible={Boolean(crop)}
      onDismiss={onDismiss}
      title={crop?.name ?? 'Crop detail'}
      testID="crops-crop-detail"
    >
      {!crop ? (
        <EmptyState title="No details" message="Crop details could not be loaded." />
      ) : (
        <>
          <ProfileCard
            icon="sprout"
            name={crop.name}
            subtitle={fieldLabel || crop.variety || 'Crop record'}
            cells={buildCropOverviewCells({
              crop,
              fieldLabel,
              cropGroupLabel,
              enabledPracticeCount: enabledPractices.length,
            })}
            testID="crops-crop-detail.profile"
          />

          {quickActions.length > 0 ? (
            <QuickActionGrid actions={quickActions} testID="crops-crop-detail.actions" />
          ) : null}

          <DetailSectionCard title="Crop Details">
            <CropsFactRow label="Variety" value={crop.variety || 'n/a'} />
            <CropsFactRow label="Status" value={formatCropStatusLabel(crop.status)} />
            <CropsFactRow label="Field" value={fieldLabel || 'No field assigned'} />
            <CropsFactRow label="Operations Group" value={cropGroupLabel || 'Standalone'} />
            <CropsFactRow label="Notes" value={crop.notes || 'n/a'} />
          </DetailSectionCard>

          {crop.cropGroupId ? (
            <AlertStrip
              title={cropGroupLabel ? `Operations inherited from ${cropGroupLabel}` : 'Operations inherited from a crop group'}
              subtitle="This crop is linked to a crop group, so operations are read-only here."
              icon="source-branch"
              borderColor="#136C22"
              iconColor="#136C22"
            />
          ) : null}

          <DetailSectionCard
            title="Operations"
            description={
              crop.cropGroupId
                ? 'Enabled operations are inherited from the linked crop group.'
                : 'Choose which operations should be available when cycles start for this crop.'
            }
            trailing={
              <AppButton
                label={crop.cropGroupId ? 'View' : 'Configure'}
                mode="outlined"
                tone="neutral"
                onPress={onOpenOperations}
              />
            }
          >
            {practicesLoading ? (
              <>
                <Skeleton height={60} />
                <Skeleton height={60} />
              </>
            ) : practicesErrorMessage ? (
              <ErrorState message={practicesErrorMessage} onRetry={onRetryPractices} />
            ) : enabledPractices.length === 0 ? (
              <EmptyState
                title={crop.cropGroupId ? 'No inherited operations' : 'No operations configured'}
                message={
                  crop.cropGroupId
                    ? 'The linked crop group does not currently enable any operations.'
                    : 'Configure crop operations to mirror the web workflow.'
                }
                actionLabel={crop.cropGroupId ? 'View operations' : 'Configure operations'}
                onAction={onOpenOperations}
              />
            ) : (
              <View>
                {enabledPractices.map((practice) => (
                  <LogRow
                    key={practice.id}
                    title={practice.label}
                    date={formatOperationFamilyLabel(practice.operationFamily)}
                    chips={[
                      { label: 'Domain', value: formatDomainAreaLabel(practice.domainArea) },
                      {
                        label: 'Mode',
                        value: crop.cropGroupId ? 'Group' : 'Crop',
                      },
                    ]}
                    onPress={onOpenOperations}
                  />
                ))}
              </View>
            )}

            {!practicesLoading && !practicesErrorMessage && enabledPractices.length > 0 ? (
              <Text variant="bodySmall">
                {enabledPractices.length} enabled {enabledPractices.length === 1 ? 'operation' : 'operations'}.
              </Text>
            ) : null}
          </DetailSectionCard>
        </>
      )}
    </BottomSheet>
  );
}
