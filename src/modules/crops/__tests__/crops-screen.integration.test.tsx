import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import type {
  CloseProductionCycleRequest,
  CreateCropRequest,
  CreateProductionCycleOperationRequest,
  CreateProductionCycleRequest,
  CropSummary,
  LogbookSubmitRequest,
  ProductionCycleOperationSummary,
  ProductionCycleSummary,
  UpdateCropRequest,
  UpdateCropStatusRequest,
  UpdateProductionCycleNotesRequest,
  UpdateProductionCycleOperationRequest,
} from '../../../api/modules/crops';
import { CropsScreen } from '../screens/CropsScreen';
import { useCropsModule } from '../useCropsModule.hook';

jest.mock('../useCropsModule.hook', () => ({
  useCropsModule: jest.fn(),
}));

function renderScreen() {
  return renderWithProviders(
    <ToastProvider>
      <CropsScreen />
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

  const createCropMock = jest
    .fn<Promise<CropSummary>, [CreateCropRequest]>()
    .mockResolvedValue(sampleCrop);

  function buildHookResult(): ReturnType<typeof useCropsModule> {
    return {
      fields: [],
      lots: [],
      cycles: [],
      crops: [sampleCrop],
      cycleOperations: [],
      logbookSession: null,
      logbookPracticeCatalog: null,
      isLoading: false,
      isRefreshing: false,
      isMutating: false,
      operationsLoading: false,
      logbookPracticeLoading: false,
      errorMessage: null,
      operationsErrorMessage: null,
      logbookPracticeErrorMessage: null,
      latestLogbookResult: null,
      refresh: async () => undefined,
      refreshOperations: async () => undefined,
      refreshLogbook: async () => undefined,
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
      submitLogbook: async (input: LogbookSubmitRequest) => {
        void input;
        return {
          status: 'saved',
          recordId: 'record-1',
          category: 'CROP_OPERATION',
          family: 'LAND_PREP',
          entityId: 'entity-1',
          requiresFollowup: false,
        };
      },
    };
  }

  beforeEach(() => {
    createCropMock.mockClear();
    useCropsModuleMock.mockReturnValue(buildHookResult());
  });

  it('submits create crop through the module hook with normalized payload fields', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.press(getByText('Create Crop'));

    await waitFor(() => expect(getByPlaceholderText('Crop name')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Crop name'), '  New Basil  ');
    fireEvent.changeText(getByPlaceholderText('Optional variety'), '   ');
    fireEvent.changeText(getByPlaceholderText('Optional notes'), '   ');
    fireEvent.press(getByText('Create'));

    await waitFor(() =>
      expect(createCropMock).toHaveBeenCalledWith({
        payload: {
          crop_name: 'New Basil',
          crop_variety: null,
          notes: null,
        },
      }),
    );

    // React Native Paper TextInput schedules placeholder state updates on a timeout.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
  });
});
