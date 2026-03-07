import React from 'react';
import { act, fireEvent, waitFor, within } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import type { FieldSummary } from '../../../api/modules/fields';
import type { LotSummary } from '../../../api/modules/lots';
import type {
  CloseProductionCycleRequest,
  CreateCropRequest,
  CreateHarvestOperationRequest,
  CreateProductionCycleOperationRequest,
  CreateProductionCycleRequest,
  CreateTreatmentOperationRequest,
  CropPracticeMapping,
  CropSummary,
  ProductionCycleOperationSummary,
  ProductionCycleSummary,
  UpdateCropRequest,
  UpdateHarvestOperationRequest,
  UpdateCropStatusRequest,
  UpdateProductionCycleNotesRequest,
  UpdateProductionCycleOperationRequest,
  UpdateTreatmentOperationRequest,
} from '../../../api/modules/crops';
import { CropsScreen } from '../screens/CropsScreen';
import { useCropsModule } from '../useCropsModule.hook';

jest.mock('../useCropsModule.hook', () => ({
  useCropsModule: jest.fn(),
}));

jest.mock('../screens/components/LogbookActivityForm.component', () => ({
  LogbookActivityForm: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'mock-logbook-activity-form' });
  },
}));

function renderScreen() {
  return renderScreenWithProps();
}

function renderScreenWithProps(props: React.ComponentProps<typeof CropsScreen> = {}) {
  return renderWithProviders(
    <ToastProvider>
      <CropsScreen {...props} />
    </ToastProvider>,
  );
}

describe('CropsScreen integration', () => {
  const useCropsModuleMock = jest.mocked(useCropsModule);

  const sampleCrop: CropSummary = {
    id: 'crop-1',
    name: 'Tomato',
    variety: 'Roma',
    status: 'active',
    notes: null,
    fieldId: null,
    cropGroupId: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };

  const sampleCycle: ProductionCycleSummary = {
    id: 'cycle-1',
    fieldId: 'field-1',
    fieldName: 'North Field',
    lotId: 'lot-1',
    lotName: 'Lot A',
    cropId: 'crop-1',
    cropName: 'Tomato',
    status: 'active',
    startDate: '2026-03-01',
    endDate: null,
    notes: null,
    estimatedCost: null,
    actualCost: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };

  const inactiveCycle: ProductionCycleSummary = {
    ...sampleCycle,
    id: 'cycle-2',
    cropId: 'crop-2',
    cropName: 'Pepper',
    status: 'inactive',
  };

  const sampleOperation: ProductionCycleOperationSummary = {
    id: 'operation-1',
    cycleId: 'cycle-1',
    type: 'LAND_PREP',
    status: 'draft',
    date: '2026-03-01',
    performedById: null,
    quantity: null,
    unit: null,
    cost: 0,
    notes: null,
    practiceId: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };

  const sampleCropPractice: CropPracticeMapping = {
    id: 'practice-1',
    code: 'LAND_PREP',
    label: 'Land Preparation',
    operationFamily: 'LAND_PREP',
    domainArea: 'crops',
    description: null,
    isActive: true,
    enabled: true,
    relevance: null,
  };

  const createCropMock = jest
    .fn<Promise<CropSummary>, [CreateCropRequest]>()
    .mockResolvedValue(sampleCrop);

  const sampleFields: FieldSummary[] = [
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
  ];

  const sampleLots: LotSummary[] = [
    {
      id: 'lot-1',
      fieldId: 'field-1',
      name: 'Lot A',
      description: null,
      lotType: 'open_lot',
      lotTypeOther: null,
      cropRotationPlan: 'monoculture',
      cropRotationPlanOther: null,
      lightProfile: 'full_sun',
      shapePolygon: null,
      pastSeasonsCrops: [],
      weatherAlertsEnabled: false,
      notes: null,
      status: 'active',
      fieldName: 'North Field',
      fieldStatus: 'active',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'lot-2',
      fieldId: 'field-1',
      name: 'Lot B',
      description: null,
      lotType: 'open_lot',
      lotTypeOther: null,
      cropRotationPlan: 'monoculture',
      cropRotationPlanOther: null,
      lightProfile: 'full_sun',
      shapePolygon: null,
      pastSeasonsCrops: [],
      weatherAlertsEnabled: false,
      notes: null,
      status: 'inactive',
      fieldName: 'North Field',
      fieldStatus: 'active',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'lot-3',
      fieldId: 'field-2',
      name: 'Lot C',
      description: null,
      lotType: 'open_lot',
      lotTypeOther: null,
      cropRotationPlan: 'monoculture',
      cropRotationPlanOther: null,
      lightProfile: 'full_sun',
      shapePolygon: null,
      pastSeasonsCrops: [],
      weatherAlertsEnabled: false,
      notes: null,
      status: 'active',
      fieldName: 'South Field',
      fieldStatus: 'inactive',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
  ];

  function buildHookResult(overrides: Partial<ReturnType<typeof useCropsModule>> = {}): ReturnType<typeof useCropsModule> {
    return {
      fields: sampleFields,
      lots: sampleLots,
      cycles: [],
      crops: [sampleCrop],
      cropGroups: [],
      products: [],
      warehouses: [],
      managedUsers: [],
      managedContacts: [],
      cycleOperations: [],
      harvestOperations: [],
      treatmentOperations: [],
      selectedCropPractices: [],
      isLoading: false,
      isRefreshing: false,
      isMutating: false,
      cropGroupsLoading: false,
      operationsLoading: false,
      cropPracticesLoading: false,
      errorMessage: null,
      cropGroupsErrorMessage: null,
      operationsErrorMessage: null,
      cropPracticesErrorMessage: null,
      refresh: async () => undefined,
      refreshOperations: async () => undefined,
      refreshCropPractices: async () => undefined,
      createCrop: createCropMock,
      updateCrop: async (cropId: string, input: UpdateCropRequest) => {
        void cropId;
        void input;
        return sampleCrop;
      },
      updateCropStatus: async (cropId: string, input: UpdateCropStatusRequest) => {
        void cropId;
        void input;
        return sampleCrop;
      },
      createProductionCycle: async (input: CreateProductionCycleRequest) => {
        void input;
        return sampleCycle;
      },
      closeProductionCycle: async (cycleId: string, input: CloseProductionCycleRequest) => {
        void cycleId;
        void input;
        return sampleCycle;
      },
      updateProductionCycleNotes: async (cycleId: string, input: UpdateProductionCycleNotesRequest) => {
        void cycleId;
        void input;
        return sampleCycle;
      },
      createProductionCycleOperation: async (
        cycleId: string,
        input: CreateProductionCycleOperationRequest,
      ) => {
        void cycleId;
        void input;
        return sampleOperation;
      },
      updateProductionCycleOperation: async (
        operationId: string,
        input: UpdateProductionCycleOperationRequest,
      ) => {
        void operationId;
        void input;
        return sampleOperation;
      },
      deleteProductionCycleOperation: async (operationId: string) => {
        void operationId;
        return true;
      },
      createTreatmentOperation: async (cycleId: string, input: CreateTreatmentOperationRequest) => {
        void cycleId;
        void input;
        return {
          id: 'treatment-1',
          cycleId: sampleCycle.id,
          status: 'draft',
          treatmentDate: '2026-03-01',
          treatmentType: 'Pesticide',
          applicationMethod: null,
          treatmentLocation: null,
          retreatDate: null,
          keywords: [],
          description: null,
          notes: null,
          products: [],
          attachments: [],
          practiceId: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      updateTreatmentOperation: async (
        operationId: string,
        input: UpdateTreatmentOperationRequest,
      ) => {
        void operationId;
        void input;
        return {
          id: 'treatment-1',
          cycleId: sampleCycle.id,
          status: 'draft',
          treatmentDate: '2026-03-01',
          treatmentType: 'Pesticide',
          applicationMethod: null,
          treatmentLocation: null,
          retreatDate: null,
          keywords: [],
          description: null,
          notes: null,
          products: [],
          attachments: [],
          practiceId: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      createHarvestOperation: async (cycleId: string, input: CreateHarvestOperationRequest) => {
        void cycleId;
        void input;
        return {
          id: 'harvest-1',
          cycleId: sampleCycle.id,
          status: 'draft',
          harvestDate: '2026-03-01',
          workers: [],
          totalHarvestedQuantity: 0,
          totalHarvestedUnit: 'kg',
          notes: null,
          attachments: [],
          practiceId: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      updateHarvestOperation: async (
        operationId: string,
        input: UpdateHarvestOperationRequest,
      ) => {
        void operationId;
        void input;
        return {
          id: 'harvest-1',
          cycleId: sampleCycle.id,
          status: 'draft',
          harvestDate: '2026-03-01',
          workers: [],
          totalHarvestedQuantity: 0,
          totalHarvestedUnit: 'kg',
          notes: null,
          attachments: [],
          practiceId: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      replaceCropPracticeMappings: async () => 0,
      ...overrides,
    };
  }

  beforeEach(() => {
    createCropMock.mockClear();
    useCropsModuleMock.mockReturnValue(buildHookResult());
  });

  it('opens on the requested initial tab when provided', async () => {
    const { getByTestId, queryByTestId } = renderScreenWithProps({ initialTab: 'logbook' });

    await waitFor(() => {
      expect(getByTestId('mock-logbook-activity-form')).toBeTruthy();
      expect(queryByTestId('crops-stats')).toBeNull();
    });
  });

  it('submits create crop through the module hook with normalized payload fields', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = renderScreen();

    await act(async () => {
      fireEvent.press(getByTestId('crops-primary-action'));
    });

    await waitFor(() => expect(getByPlaceholderText('Crop name')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Crop name'), '  New Basil  ');
    fireEvent.changeText(getByPlaceholderText('Optional variety'), '   ');
    fireEvent.changeText(getByPlaceholderText('Optional notes'), '   ');
    await act(async () => {
      fireEvent.press(getByText('Create'));
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(createCropMock).toHaveBeenCalledWith({
        payload: {
          crop_name: 'New Basil',
          crop_variety: null,
          crop_group_id: null,
          notes: null,
        },
      }),
    );

    // React Native Paper TextInput schedules placeholder state updates on a timeout.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
  });

  it('filters cycle selectors to active records within the selected field', async () => {
    useCropsModuleMock.mockReturnValue(
      buildHookResult({
        crops: [
          sampleCrop,
          {
            ...sampleCrop,
            id: 'crop-2',
            name: 'Pepper',
            status: 'inactive',
            fieldId: 'field-1',
          },
          {
            ...sampleCrop,
            id: 'crop-3',
            name: 'Cucumber',
            fieldId: 'field-2',
          },
        ],
      }),
    );

    const { getByTestId, getByText, queryByTestId } = renderScreen();

    fireEvent.press(getByText('Cycles'));
    fireEvent.press(getByTestId('crops-primary-action'));

    fireEvent.press(within(getByTestId('cycle-form-field-select')).getByTestId('button'));
    expect(getByTestId('app-select-option-field-1')).toBeTruthy();
    expect(queryByTestId('app-select-option-field-2')).toBeNull();
    fireEvent.press(getByTestId('app-select-option-field-1'));

    fireEvent.press(within(getByTestId('cycle-form-lot-select')).getByTestId('button'));
    expect(getByTestId('app-select-option-lot-1')).toBeTruthy();
    expect(queryByTestId('app-select-option-lot-2')).toBeNull();
    expect(queryByTestId('app-select-option-lot-3')).toBeNull();
    fireEvent.press(getByTestId('app-select-option-lot-1'));

    fireEvent.press(within(getByTestId('cycle-form-crop-select')).getByTestId('button'));
    expect(getByTestId('app-select-option-crop-1')).toBeTruthy();
    expect(queryByTestId('app-select-option-crop-2')).toBeNull();
    expect(queryByTestId('app-select-option-crop-3')).toBeNull();
  });

  it('defaults the cycle status filter to active records', async () => {
    useCropsModuleMock.mockReturnValue(
      buildHookResult({
        cycles: [sampleCycle, inactiveCycle],
      }),
    );

    const { getByText, queryByText } = renderScreen();

    fireEvent.press(getByText('Cycles'));

    await waitFor(() => {
      expect(getByText('Tomato')).toBeTruthy();
    });

    expect(queryByText('Pepper')).toBeNull();
  });

  it('opens crop detail and operations sheets without entering a render loop', async () => {
    useCropsModuleMock.mockReturnValue(
      buildHookResult({
        selectedCropPractices: [sampleCropPractice],
      }),
    );

    const { getAllByText, getByText, getByTestId, queryByText } = renderScreen();

    await act(async () => {
      fireEvent.press(getByText('Tomato'));
    });

    await waitFor(() => {
      expect(getByTestId('crops-crop-detail')).toBeTruthy();
      expect(getByText('Crop Details')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Configure'));
    });

    await waitFor(() => {
      expect(getByText('Save operations')).toBeTruthy();
      expect(getAllByText('Land Preparation').length).toBeGreaterThan(0);
    });

    await act(async () => {
      fireEvent.press(getByText('Cancel'));
    });

    await waitFor(() => {
      expect(queryByText('Save operations')).toBeNull();
      expect(getByTestId('crops-crop-detail')).toBeTruthy();
    });
  });
});
