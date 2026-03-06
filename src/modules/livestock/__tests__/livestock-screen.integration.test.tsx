import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import type {
  AnimalRecord,
  HousingConsumptionLog,
  HousingMaintenanceRecord,
  HousingUnit,
  WeatherAlertRule,
  CreateAnimalRequest,
  CreateAnimalHealthCheckRequest,
  CreateAnimalYieldRecordRequest,
  CreateHousingConsumptionLogRequest,
  CreateHousingMaintenanceRecordRequest,
  CreateHousingUnitRequest,
  CreateWeatherAlertRuleRequest,
  UpdateAnimalRequest,
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

  const inactiveAnimal: AnimalRecord = {
    ...sampleAnimal,
    id: 'animal-2',
    name: 'Dry Cow 2',
    activeStatus: 'inactive',
  };

  const createAnimalMock = jest
    .fn<Promise<AnimalRecord>, [CreateAnimalRequest]>()
    .mockResolvedValue(sampleAnimal);
  const createHousingUnitMock = jest
    .fn<Promise<HousingUnit>, [CreateHousingUnitRequest]>()
    .mockResolvedValue({
      id: 'housing-1',
      barnName: 'Barn A',
      unitCode: 'A-1',
      fieldId: 'field-1',
      capacity: 20,
      currentStatus: 'active',
      animalTypes: ['cattle'],
      shapePolygon: null,
      notes: null,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    });
  const reactivateHousingUnitMock = jest.fn<Promise<boolean>, [string]>().mockResolvedValue(true);

  function buildHookResult(): ReturnType<typeof useLivestockModule> {
    return {
      fields: [
        {
          id: 'field-1',
          name: 'North Field',
          areaHectares: '10',
          areaUnit: 'hectares',
          status: 'active',
          shapePolygon: null,
          location: null,
          soilType: null,
          notes: null,
          soilTypeCategory: null,
          soilTypeOther: null,
          irrigationType: null,
          irrigationTypeOther: null,
          soilConditions: null,
          activeCycleSummary: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
        {
          id: 'field-2',
          name: 'South Field',
          areaHectares: '8',
          areaUnit: 'hectares',
          status: 'inactive',
          shapePolygon: null,
          location: null,
          soilType: null,
          notes: null,
          soilTypeCategory: null,
          soilTypeOther: null,
          irrigationType: null,
          irrigationTypeOther: null,
          soilConditions: null,
          activeCycleSummary: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
      ],
      lots: [
        {
          id: 'lot-1',
          fieldId: 'field-1',
          name: 'Tomato Lot',
          description: null,
          lotType: 'open_lot',
          lotTypeOther: null,
          cropRotationPlan: 'monoculture',
          cropRotationPlanOther: null,
          lightProfile: 'full_sun',
          shapePolygon: null,
          pastSeasonsCrops: [],
          status: 'active',
          fieldName: 'North Field',
          fieldStatus: 'active',
          notes: null,
          weatherAlertsEnabled: true,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
      ],
      animals: [sampleAnimal, inactiveAnimal],
      housingUnits: [
        {
          id: 'housing-1',
          barnName: 'Barn A',
          unitCode: 'A-1',
          fieldId: 'field-1',
          capacity: 20,
          currentStatus: 'active',
          animalTypes: ['cattle'],
          shapePolygon: null,
          notes: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
        {
          id: 'housing-2',
          barnName: 'Barn B',
          unitCode: 'B-1',
          fieldId: 'field-2',
          capacity: 15,
          currentStatus: 'inactive',
          animalTypes: ['cattle'],
          shapePolygon: null,
          notes: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
      ],
      weatherRules: [
        {
          id: 'rule-1',
          lotId: 'lot-1',
          fieldId: 'field-1',
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
        },
      ],
      weatherLocationRules: [
        {
          id: 'rule-location-1',
          lotId: 'lot-1',
          fieldId: 'field-1',
          name: 'Location Heat Alert',
          condition: 'temperature',
          operator: '>=',
          value: 34,
          unit: 'C',
          enabled: true,
          severity: 'medium',
          customMessage: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        },
      ],
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
      createHousingUnit: createHousingUnitMock,
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
      reactivateHousingUnit: reactivateHousingUnitMock,
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
    createHousingUnitMock.mockClear();
    reactivateHousingUnitMock.mockClear();
    useLivestockModuleMock.mockReturnValue(buildHookResult());
  });

  it('renders the dense animals shell and opens the animal detail sheet', async () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    expect(getByTestId('livestock-tabs')).toBeTruthy();
    expect(getByTestId('livestock-animals-status-filter')).toBeTruthy();
    expect(getByTestId('livestock-animal-row-animal-1')).toBeTruthy();
    expect(queryByText('Dry Cow 2')).toBeNull();

    fireEvent.press(getByText('Dairy Cow 1'));

    await waitFor(() => {
      expect(getByTestId('livestock-animal-detail')).toBeTruthy();
      expect(getByTestId('livestock-animal-detail.actions')).toBeTruthy();
    });
  });

  it('submits create animal through hook with normalized payload fields', async () => {
    const { getByPlaceholderText, getByText, getByTestId } = renderScreen();

    fireEvent.press(getByTestId('livestock-animals-create'));

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

  it('renders the dense housing shell and opens the housing detail sheet', async () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    fireEvent.press(getByTestId('livestock-tabs.housing'));

    await waitFor(() => {
      expect(getByTestId('livestock-housing-status-filter')).toBeTruthy();
      expect(getByTestId('livestock-housing-row-housing-1')).toBeTruthy();
    });

    expect(queryByText('Barn B')).toBeNull();
    fireEvent.press(getByText('Inactive (1)'));
    fireEvent.press(getByText('Barn B'));

    await waitFor(() => {
      expect(getByTestId('livestock-housing-detail')).toBeTruthy();
      expect(getByTestId('livestock-housing-detail.actions')).toBeTruthy();
    });
  });

  it('renders the dense weather shell and opens the weather detail sheet', async () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('livestock-tabs.weather'));

    await waitFor(() => {
      expect(getByTestId('livestock-weather-status-filter')).toBeTruthy();
      expect(getByTestId('livestock-weather-lot-filter')).toBeTruthy();
      expect(getByText('Location Heat Alert')).toBeTruthy();
    });

    fireEvent.press(getByText('Location Heat Alert'));

    await waitFor(() => {
      expect(getByTestId('livestock-weather-detail')).toBeTruthy();
      expect(getByTestId('livestock-weather-detail.actions')).toBeTruthy();
    });
  });
});
