import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import type {
  AnimalRecord,
  HousingConsumptionLog,
  HousingMaintenanceRecord,
  WeatherAlertRule,
  CreateAnimalRequest,
  CreateAnimalGroupRequest,
  CreateAnimalHealthCheckRequest,
  CreateAnimalYieldRecordRequest,
  CreateHousingConsumptionLogRequest,
  CreateHousingMaintenanceRecordRequest,
  CreateHousingUnitRequest,
  CreateWeatherAlertRuleRequest,
  UpdateAnimalRequest,
  UpdateAnimalGroupRequest,
  UpdateAnimalHealthCheckRequest,
  UpdateAnimalYieldRecordRequest,
  UpdateHousingConsumptionLogRequest,
  UpdateHousingMaintenanceRecordRequest,
  UpdateHousingUnitRequest,
  UpdateWeatherAlertRuleRequest,
} from '../../../api/modules/livestock';
import { LivestockScreen } from '../screens/LivestockScreen';
import { useLivestockModule } from '../useLivestockModule.hook';

jest.mock('../useLivestockModule.hook', () => ({
  useLivestockModule: jest.fn(),
}));

function renderScreen() {
  return renderWithProviders(
    <ToastProvider>
      <LivestockScreen />
    </ToastProvider>,
  );
}

describe('LivestockScreen integration', () => {
  const useLivestockModuleMock = jest.mocked(useLivestockModule);

  const sampleAnimal: AnimalRecord = {
    id: 'animal-1',
    name: 'Dairy Cow 1',
    species: 'cattle',
    breed: 'Holstein',
    tagNumber: 'C-101',
    healthStatus: 'healthy',
    activeStatus: 'active',
    quantity: 1,
    currentHousingUnitId: null,
    groupId: null,
    lastVetVisit: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };

  const createAnimalMock = jest
    .fn<Promise<AnimalRecord>, [CreateAnimalRequest]>()
    .mockResolvedValue(sampleAnimal);

  function buildHookResult(): ReturnType<typeof useLivestockModule> {
    return {
      fields: [],
      lots: [],
      animals: [sampleAnimal],
      animalGroups: [],
      housingUnits: [],
      weatherRules: [],
      weatherLocationRules: [],
      healthChecks: [],
      yieldRecords: [],
      housingMaintenanceRecords: [],
      housingConsumptionLogs: [],
      isLoading: false,
      isRefreshing: false,
      detailsLoading: false,
      detailsRefreshing: false,
      isMutating: false,
      errorMessage: null,
      detailsErrorMessage: null,
      refresh: async () => undefined,
      refreshDetails: async () => undefined,
      createAnimal: createAnimalMock,
      updateAnimal: async (animalId: string, input: UpdateAnimalRequest) => {
        void animalId;
        void input;
        return sampleAnimal;
      },
      deactivateAnimal: async (animalId: string) => {
        void animalId;
        return true;
      },
      createAnimalGroup: async (input: CreateAnimalGroupRequest) => {
        void input;
        return {
          id: 'group-1',
          name: 'Group A',
          species: 'cattle',
          status: 'active',
          notes: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      updateAnimalGroup: async (groupId: string, input: UpdateAnimalGroupRequest) => {
        void groupId;
        void input;
        return {
          id: 'group-1',
          name: 'Group A',
          species: 'cattle',
          status: 'active',
          notes: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      deactivateAnimalGroup: async (groupId: string) => {
        void groupId;
        return true;
      },
      createAnimalHealthCheck: async (animalId: string, input: CreateAnimalHealthCheckRequest) => {
        void animalId;
        void input;
        return {
          id: 'health-1',
          animalId: 'animal-1',
          date: '2026-03-02',
          status: 'healthy',
          notes: null,
          performedBy: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        };
      },
      updateAnimalHealthCheck: async (healthCheckId: string, input: UpdateAnimalHealthCheckRequest) => {
        void healthCheckId;
        void input;
        return {
          id: 'health-1',
          animalId: 'animal-1',
          date: '2026-03-02',
          status: 'healthy',
          notes: null,
          performedBy: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        };
      },
      deleteAnimalHealthCheck: async (healthCheckId: string) => {
        void healthCheckId;
        return true;
      },
      createAnimalYieldRecord: async (animalId: string, input: CreateAnimalYieldRecordRequest) => {
        void animalId;
        void input;
        return {
          id: 'yield-1',
          animalId: 'animal-1',
          date: '2026-03-02',
          yieldType: 'milk',
          amount: 15,
          unit: 'L',
          notes: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        };
      },
      updateAnimalYieldRecord: async (yieldRecordId: string, input: UpdateAnimalYieldRecordRequest) => {
        void yieldRecordId;
        void input;
        return {
          id: 'yield-1',
          animalId: 'animal-1',
          date: '2026-03-02',
          yieldType: 'milk',
          amount: 15,
          unit: 'L',
          notes: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        };
      },
      deleteAnimalYieldRecord: async (yieldRecordId: string) => {
        void yieldRecordId;
        return true;
      },
      createHousingUnit: async (input: CreateHousingUnitRequest) => {
        void input;
        return {
          id: 'housing-1',
          barnName: 'Barn A',
          unitCode: 'A-1',
          fieldId: null,
          capacity: 20,
          currentStatus: 'active',
          animalTypes: ['cattle'],
          shapePolygon: null,
          notes: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      updateHousingUnit: async (housingUnitId: string, input: UpdateHousingUnitRequest) => {
        void housingUnitId;
        void input;
        return {
          id: 'housing-1',
          barnName: 'Barn A',
          unitCode: 'A-1',
          fieldId: null,
          capacity: 20,
          currentStatus: 'active',
          animalTypes: ['cattle'],
          shapePolygon: null,
          notes: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      deactivateHousingUnit: async (housingUnitId: string) => {
        void housingUnitId;
        return true;
      },
      reactivateHousingUnit: async (housingUnitId: string) => {
        void housingUnitId;
        return true;
      },
      createHousingMaintenanceRecord: async (
        housingUnitId: string,
        input: CreateHousingMaintenanceRecordRequest,
      ) => {
        void housingUnitId;
        void input;
        const record: HousingMaintenanceRecord = {
          id: 'maintenance-1',
          housingUnitId: 'housing-1',
          date: '2026-03-02',
          maintenanceType: 'cleaning',
          status: 'done',
          cost: 10,
          notes: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        };
        return record;
      },
      updateHousingMaintenanceRecord: async (
        maintenanceRecordId: string,
        input: UpdateHousingMaintenanceRecordRequest,
      ) => {
        void maintenanceRecordId;
        void input;
        const record: HousingMaintenanceRecord = {
          id: 'maintenance-1',
          housingUnitId: 'housing-1',
          date: '2026-03-02',
          maintenanceType: 'cleaning',
          status: 'done',
          cost: 10,
          notes: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        };
        return record;
      },
      deleteHousingMaintenanceRecord: async (maintenanceRecordId: string) => {
        void maintenanceRecordId;
        return true;
      },
      createHousingConsumptionLog: async (
        housingUnitId: string,
        input: CreateHousingConsumptionLogRequest,
      ) => {
        void housingUnitId;
        void input;
        const record: HousingConsumptionLog = {
          id: 'consumption-1',
          housingUnitId: 'housing-1',
          date: '2026-03-02',
          feedAmount: 12,
          waterAmount: 30,
          unit: 'kg',
          notes: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        };
        return record;
      },
      updateHousingConsumptionLog: async (
        consumptionLogId: string,
        input: UpdateHousingConsumptionLogRequest,
      ) => {
        void consumptionLogId;
        void input;
        const record: HousingConsumptionLog = {
          id: 'consumption-1',
          housingUnitId: 'housing-1',
          date: '2026-03-02',
          feedAmount: 12,
          waterAmount: 30,
          unit: 'kg',
          notes: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        };
        return record;
      },
      deleteHousingConsumptionLog: async (consumptionLogId: string) => {
        void consumptionLogId;
        return true;
      },
      createWeatherAlertRule: async (input: CreateWeatherAlertRuleRequest) => {
        void input;
        const record: WeatherAlertRule = {
          id: 'rule-1',
          lotId: null,
          fieldId: null,
          name: 'Heat Alert',
          condition: 'temperature',
          operator: '>=',
          value: 35,
          unit: 'C',
          enabled: true,
          severity: 'high',
          customMessage: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        };
        return record;
      },
      updateWeatherAlertRule: async (weatherAlertRuleId: string, input: UpdateWeatherAlertRuleRequest) => {
        void weatherAlertRuleId;
        void input;
        const record: WeatherAlertRule = {
          id: 'rule-1',
          lotId: null,
          fieldId: null,
          name: 'Heat Alert',
          condition: 'temperature',
          operator: '>=',
          value: 35,
          unit: 'C',
          enabled: true,
          severity: 'high',
          customMessage: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        };
        return record;
      },
      deleteWeatherAlertRule: async (weatherAlertRuleId: string) => {
        void weatherAlertRuleId;
        return true;
      },
    };
  }

  beforeEach(() => {
    createAnimalMock.mockClear();
    useLivestockModuleMock.mockReturnValue(buildHookResult());
  });

  it('submits create animal through hook with normalized payload fields', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = renderScreen();

    fireEvent.press(getAllByText('Create Animal')[0]);

    await waitFor(() => expect(getByPlaceholderText('Animal name')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Animal name'), '  New Heifer  ');
    fireEvent.changeText(getByPlaceholderText('Species'), '  cattle  ');
    fireEvent.changeText(getByPlaceholderText('Breed'), '  ');
    fireEvent.changeText(getByPlaceholderText('Tag number'), '  ');
    fireEvent.changeText(getByPlaceholderText('1'), ' 2 ');
    fireEvent.changeText(getByPlaceholderText('Optional notes'), '  ');
    fireEvent.press(getByText('Create'));

    await waitFor(() =>
      expect(createAnimalMock).toHaveBeenCalledWith({
        name: 'New Heifer',
        species: 'cattle',
        breed: null,
        tag_number: null,
        health_status: null,
        active_status: 'active',
        quantity: 2,
        group_id: null,
        current_housing_unit_id: null,
        last_vet_visit: null,
        health_notes: null,
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
  });
});
