import React from 'react';
import type { WeatherAlertRule } from '../../../../api/modules/livestock';
import {
  BottomSheet,
  DetailSectionCard,
  EmptyState,
  ProfileCard,
  QuickActionGrid,
  type QuickAction,
} from '../../../../components';
import {
  buildWeatherOverviewCells,
  buildWeatherRowSubtitle,
  formatLivestockStatusLabel,
} from '../../livestockPresentation';
import { LivestockFactRow } from './LivestockFactRow.component';

type LivestockWeatherDetailSheetProps = {
  weatherRule: WeatherAlertRule | null;
  lotLabel?: string;
  fieldLabel?: string;
  quickActions: QuickAction[];
  onDismiss: () => void;
};

export function LivestockWeatherDetailSheet({
  weatherRule,
  lotLabel,
  fieldLabel,
  quickActions,
  onDismiss,
}: LivestockWeatherDetailSheetProps) {
  return (
    <BottomSheet
      visible={Boolean(weatherRule)}
      onDismiss={onDismiss}
      title={weatherRule?.name ?? 'Weather rule detail'}
      testID="livestock-weather-detail"
    >
      {!weatherRule ? (
        <EmptyState title="No details" message="Weather rule details could not be loaded." />
      ) : (
        <>
          <ProfileCard
            icon="weather-partly-cloudy"
            name={weatherRule.name}
            subtitle={buildWeatherRowSubtitle({ weatherRule, lotLabel, fieldLabel })}
            cells={buildWeatherOverviewCells({ weatherRule, lotLabel, fieldLabel })}
            testID="livestock-weather-detail.profile"
          />

          {quickActions.length > 0 ? (
            <QuickActionGrid
              actions={quickActions}
              testID="livestock-weather-detail.actions"
            />
          ) : null}

          <DetailSectionCard title="Rule Details">
            <LivestockFactRow
              label="Condition"
              value={formatLivestockStatusLabel(weatherRule.condition)}
            />
            <LivestockFactRow label="Operator" value={weatherRule.operator || 'n/a'} />
            <LivestockFactRow
              label="Value"
              value={
                weatherRule.value === null
                  ? 'n/a'
                  : `${weatherRule.value} ${weatherRule.unit || ''}`.trim()
              }
            />
            <LivestockFactRow
              label="Custom Message"
              value={weatherRule.customMessage || 'n/a'}
            />
          </DetailSectionCard>

          <DetailSectionCard title="Notifications">
            <LivestockFactRow
              label="Enabled"
              value={weatherRule.enabled ? 'Yes' : 'No'}
            />
            <LivestockFactRow
              label="Severity"
              value={formatLivestockStatusLabel(weatherRule.severity)}
            />
          </DetailSectionCard>
        </>
      )}
    </BottomSheet>
  );
}
