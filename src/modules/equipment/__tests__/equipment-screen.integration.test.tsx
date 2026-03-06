import React from 'react';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import type { EquipmentDetail, EquipmentSummary } from '../../../api/modules/equipment';
import { EquipmentScreen } from '../screens/EquipmentScreen';
import { useEquipmentModule } from '../useEquipmentModule.hook';

jest.mock('../useEquipmentModule.hook', () => ({
  useEquipmentModule: jest.fn(),
}));

function renderScreen() {
  return renderWithProviders(
    <ToastProvider>
      <EquipmentScreen />
    </ToastProvider>,
  );
}

describe('EquipmentScreen integration', () => {
  const useEquipmentModuleMock = jest.mocked(useEquipmentModule);

  const activeEquipment: EquipmentSummary = {
    id: 'eq-1',
    name: 'North Tractor',
    type: 'tractor',
    status: 'operational',
    serialNumber: null,
    notes: null,
    nextMaintenanceDate: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };

  const inactiveEquipment: EquipmentSummary = {
    ...activeEquipment,
    id: 'eq-2',
    name: 'Old Harvester',
    type: 'harvester',
    status: 'inactive',
  };

  const activeEquipmentDetail: EquipmentDetail = {
    ...activeEquipment,
    brand: null,
    model: null,
    modelYear: null,
    trackUsage: 'hours',
    currentUsageReading: null,
    estimatedUsageCost: null,
  };

  beforeEach(() => {
    useEquipmentModuleMock.mockReturnValue({
      equipment: [activeEquipment, inactiveEquipment],
      upcomingMaintenance: [],
      operatorOptions: [],
      contactOptions: [],
      fieldOptions: [],
      lotOptions: [],
      servicePerformerOptions: [],
      equipmentDetail: null,
      usageLogs: [],
      maintenanceRecords: [],
      isLoading: false,
      isRefreshing: false,
      isMutating: false,
      detailsLoading: false,
      detailsRefreshing: false,
      errorMessage: null,
      detailsErrorMessage: null,
      refresh: async () => undefined,
      refreshDetails: async () => undefined,
      createEquipment: async () => activeEquipmentDetail,
      updateEquipment: async () => activeEquipmentDetail,
      deactivateEquipment: async () => activeEquipmentDetail,
      reactivateEquipment: async () => activeEquipmentDetail,
      deleteEquipment: async () => undefined,
      createUsageLog: async () => {
        throw new Error('not used');
      },
      updateUsageLog: async () => {
        throw new Error('not used');
      },
      deleteUsageLog: async () => undefined,
      createMaintenanceRecord: async () => {
        throw new Error('not used');
      },
      updateMaintenanceRecord: async () => {
        throw new Error('not used');
      },
      deleteMaintenanceRecord: async () => undefined,
      replaceMaintenanceParts: async () => {
        throw new Error('not used');
      },
    });
  });

  it('defaults the equipment status filter to active records', () => {
    const { getByText, queryByText } = renderScreen();

    expect(getByText('North Tractor')).toBeTruthy();
    expect(queryByText('Old Harvester')).toBeNull();
  });
});
