import React from 'react';
import { fireEvent, waitFor, within } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import type { LotSummary } from '../../../api/modules/lots';
import { LotsScreen } from '../screens/LotsScreen';
import { useLotsModule } from '../useLotsModule.hook';

jest.mock('../useLotsModule.hook', () => ({
  useLotsModule: jest.fn(),
}));

jest.mock('../../../hooks/useModuleActionPermissions', () => ({
  useModuleActionPermissions: () => ({
    loading: false,
    permissions: {
      view: true,
      add: true,
      edit: true,
      delete: true,
    },
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

function renderScreen() {
  return renderWithProviders(
    <ToastProvider>
      <LotsScreen />
    </ToastProvider>,
  );
}

describe('LotsScreen integration', () => {
  const useLotsModuleMock = jest.mocked(useLotsModule);

  const fieldAId = 'f0a7d5d1-8b27-4a9a-9eb4-bf3c0f9b1111';
  const fieldBId = '1ea89d9f-3d69-4e59-b17e-ef5d35bda222';
  const fieldPolygon = {
    type: 'Polygon',
    coordinates: [
      [
        [35.91, 31.95],
        [35.92, 31.95],
        [35.92, 31.96],
        [35.91, 31.96],
        [35.91, 31.95],
      ],
    ],
  };
  const fieldBPolygon = {
    type: 'Polygon',
    coordinates: [
      [
        [35.93, 31.95],
        [35.94, 31.95],
        [35.94, 31.96],
        [35.93, 31.96],
        [35.93, 31.95],
      ],
    ],
  };
  const lotRecord: LotSummary = {
    id: 'a1d2c3e4-f111-4a22-9f88-6a3d9a6d1111',
    fieldId: fieldAId,
    name: 'Lot A',
    description: null,
    lotType: 'open_lot',
    lotTypeOther: null,
    cropRotationPlan: 'monoculture',
    cropRotationPlanOther: null,
    lightProfile: 'full_sun',
    shapePolygon: fieldPolygon,
    pastSeasonsCrops: [],
    weatherAlertsEnabled: false,
    notes: null,
    status: 'inactive',
    fieldName: 'Field A',
    fieldStatus: 'inactive',
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
  };
  const activeLotRecord: LotSummary = {
    ...lotRecord,
    status: 'active',
  };

  const createLotMock = jest.fn().mockResolvedValue({
    ...activeLotRecord,
    id: 'b2d3c4e5-f222-4b33-9f99-7b4e0b7e2222',
    name: 'New Lot',
  });
  const reactivateMainMock = jest.fn().mockResolvedValue(activeLotRecord);
  const reactivateDeactivatedMock = jest.fn().mockResolvedValue(activeLotRecord);
  const listLotsByFieldMock = jest.fn().mockResolvedValue([]);

  beforeEach(() => {
    createLotMock.mockClear();
    reactivateMainMock.mockClear();
    reactivateDeactivatedMock.mockClear();
    listLotsByFieldMock.mockReset();
    listLotsByFieldMock.mockResolvedValue([]);

    useLotsModuleMock.mockReturnValue({
      lots: [lotRecord],
      inactiveLots: [lotRecord],
      fieldContextFields: [
        {
          id: fieldAId,
          name: 'Field A',
          areaHectares: '1.0',
          areaUnit: 'hectares',
          status: 'active',
          shapePolygon: fieldPolygon,
          location: null,
          soilType: null,
          notes: null,
          soilTypeCategory: null,
          soilTypeOther: null,
          irrigationType: null,
          irrigationTypeOther: null,
          soilConditions: null,
          activeCycleSummary: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        },
        {
          id: fieldBId,
          name: 'Field B',
          areaHectares: '2.0',
          areaUnit: 'hectares',
          status: 'active',
          shapePolygon: fieldBPolygon,
          location: null,
          soilType: null,
          notes: null,
          soilTypeCategory: null,
          soilTypeOther: null,
          irrigationType: null,
          irrigationTypeOther: null,
          soilConditions: null,
          activeCycleSummary: null,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        },
      ],
      fieldOptions: [
        { label: 'Field A', value: fieldAId },
        { label: 'Field B', value: fieldBId },
      ],
      isLoading: false,
      isRefreshing: false,
      isMutating: false,
      errorMessage: null,
      refresh: async () => undefined,
      listLotsByField: listLotsByFieldMock,
      createLot: createLotMock,
      updateLot: async () => lotRecord,
      deactivateLot: async () => lotRecord,
      reactivateLotMain: reactivateMainMock,
      reactivateLotFromDeactivated: reactivateDeactivatedMock,
    });
  });

  it('submits create lot payload with hidden defaults', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = renderScreen();

    fireEvent.press(getByText('Create Lot'));

    const fieldSelect = getByTestId('lots-form-field-select');
    fireEvent.press(within(fieldSelect).getByText('Select field'));
    fireEvent.press(getByTestId(`app-select-option-${fieldAId}`));

    fireEvent.changeText(getByPlaceholderText('Lot name'), '  New Lot  ');
    fireEvent.press(getByTestId('lots-form-submit-next'));
    fireEvent.press(getByTestId('lots-form-submit-next'));
    fireEvent.changeText(getByPlaceholderText('Optional notes'), '  Notes  ');
    fireEvent.press(getByTestId('lots-form-submit-next'));

    await waitFor(() => {
      expect(createLotMock).toHaveBeenCalledWith(
        expect.objectContaining({
          field_id: fieldAId,
          name: 'New Lot',
          crop_rotation_plan: 'monoculture',
          light_profile: 'full_sun',
          weather_alerts_enabled: false,
          status: 'active',
        }),
      );
    });
  });

  it('disables deactivated-reactivate action when parent field is inactive', async () => {
    const { getByTestId, getByText } = renderScreen();

    const statusFilter = getByTestId('lots-status-filter');
    fireEvent.press(within(statusFilter).getByText('Active'));
    fireEvent.press(getByTestId('app-select-option-inactive'));

    fireEvent.press(getByText('Deactivated flow'));
    fireEvent.press(getByText('Lot A'));

    const reactivateButton = getByTestId('action-sheet.reactivate');
    expect(reactivateButton.props.accessibilityState.disabled).toBe(true);

    expect(reactivateMainMock).not.toHaveBeenCalled();
    expect(reactivateDeactivatedMock).not.toHaveBeenCalled();
  });

  it('keeps boundary tab gated until field is selected', async () => {
    const { getByText, getByTestId, getByPlaceholderText, queryByText } = renderScreen();

    fireEvent.press(getByText('Create Lot'));
    fireEvent.press(getByText('Boundary'));

    expect(getByPlaceholderText('Lot name')).toBeTruthy();
    expect(queryByText('Field polygon is highlighted in blue. Occupied lots are highlighted in red.')).toBeNull();

    const fieldSelect = getByTestId('lots-form-field-select');
    fireEvent.press(within(fieldSelect).getByText('Select field'));
    fireEvent.press(getByTestId(`app-select-option-${fieldAId}`));
    fireEvent.press(getByText('Boundary'));

    await waitFor(() => {
      expect(getByText('Field polygon is highlighted in blue. Occupied lots are highlighted in red.')).toBeTruthy();
    });
  });

  it('clears boundary points when field changes in form', async () => {
    const { getByText, getByTestId, getByPlaceholderText } = renderScreen();

    fireEvent.press(getByText('Create Lot'));
    const fieldSelect = getByTestId('lots-form-field-select');
    fireEvent.press(within(fieldSelect).getByText('Select field'));
    fireEvent.press(getByTestId(`app-select-option-${fieldAId}`));
    fireEvent.changeText(getByPlaceholderText('Lot name'), 'Lot to clear');
    fireEvent.press(getByText('Boundary'));

    await waitFor(() => {
      expect(listLotsByFieldMock).toHaveBeenCalledWith(fieldAId);
    });

    const canvas = getByTestId('lots-boundary-map-canvas');
    fireEvent(canvas, 'press', { nativeEvent: { coordinate: { latitude: 31.952, longitude: 35.912 } } });
    fireEvent(canvas, 'press', { nativeEvent: { coordinate: { latitude: 31.953, longitude: 35.916 } } });
    fireEvent(canvas, 'press', { nativeEvent: { coordinate: { latitude: 31.957, longitude: 35.915 } } });

    await waitFor(() => {
      expect(getByTestId('lots-boundary-map.clear').props.accessibilityState.disabled).toBe(false);
    });

    fireEvent.press(getByText('Back'));
    const fieldSelectAfterBack = getByTestId('lots-form-field-select');
    fireEvent.press(within(fieldSelectAfterBack).getByText('Field A'));
    fireEvent.press(getByTestId(`app-select-option-${fieldBId}`));
    fireEvent.press(getByText('Boundary'));

    await waitFor(() => {
      expect(listLotsByFieldMock).toHaveBeenCalledWith(fieldBId);
    });
    expect(getByTestId('lots-boundary-map.clear').props.accessibilityState.disabled).toBe(true);
  });

  it('rejects point additions outside selected field boundary', async () => {
    const { getByText, getByTestId } = renderScreen();

    fireEvent.press(getByText('Create Lot'));
    const fieldSelect = getByTestId('lots-form-field-select');
    fireEvent.press(within(fieldSelect).getByText('Select field'));
    fireEvent.press(getByTestId(`app-select-option-${fieldAId}`));
    fireEvent.press(getByText('Boundary'));

    await waitFor(() => {
      expect(listLotsByFieldMock).toHaveBeenCalledWith(fieldAId);
    });

    const canvas = getByTestId('lots-boundary-map-canvas');
    fireEvent(canvas, 'press', { nativeEvent: { coordinate: { latitude: 31.952, longitude: 35.912 } } });
    fireEvent(canvas, 'press', { nativeEvent: { coordinate: { latitude: 31.971, longitude: 35.931 } } });
    fireEvent(canvas, 'press', { nativeEvent: { coordinate: { latitude: 31.954, longitude: 35.916 } } });
    fireEvent(canvas, 'press', { nativeEvent: { coordinate: { latitude: 31.958, longitude: 35.915 } } });

    const undo = getByTestId('lots-boundary-map.undo');
    fireEvent.press(undo);
    fireEvent.press(undo);
    fireEvent.press(undo);

    await waitFor(() => {
      expect(getByTestId('lots-boundary-map.undo').props.accessibilityState.disabled).toBe(true);
    });
  });

  it('rejects overlapping boundary candidate while drawing', async () => {
    listLotsByFieldMock.mockResolvedValueOnce([
      {
        ...lotRecord,
        id: 'occupied-lot-id',
        status: 'active',
        shapePolygon: {
          type: 'Polygon',
          coordinates: [
            [
              [35.911, 31.951],
              [35.914, 31.951],
              [35.914, 31.954],
              [35.911, 31.954],
              [35.911, 31.951],
            ],
          ],
        },
      },
    ]);

    const { getByText, getByTestId } = renderScreen();

    fireEvent.press(getByText('Create Lot'));
    const fieldSelect = getByTestId('lots-form-field-select');
    fireEvent.press(within(fieldSelect).getByText('Select field'));
    fireEvent.press(getByTestId(`app-select-option-${fieldAId}`));
    fireEvent.press(getByText('Boundary'));

    await waitFor(() => {
      expect(listLotsByFieldMock).toHaveBeenCalledWith(fieldAId);
    });

    const canvas = getByTestId('lots-boundary-map-canvas');
    fireEvent(canvas, 'press', { nativeEvent: { coordinate: { latitude: 31.952, longitude: 35.912 } } });
    fireEvent(canvas, 'press', { nativeEvent: { coordinate: { latitude: 31.9535, longitude: 35.9135 } } });
    fireEvent(canvas, 'press', { nativeEvent: { coordinate: { latitude: 31.954, longitude: 35.9125 } } });

    await waitFor(() => {
      expect(getByTestId('lots-boundary-map.complete').props.accessibilityState.disabled).toBe(true);
    });
  });

  it('keeps boundary editor blocked when lot context load fails', async () => {
    listLotsByFieldMock.mockRejectedValueOnce(new Error('network fail'));
    const { getByText, getByTestId } = renderScreen();

    fireEvent.press(getByText('Create Lot'));
    const fieldSelect = getByTestId('lots-form-field-select');
    fireEvent.press(within(fieldSelect).getByText('Select field'));
    fireEvent.press(getByTestId(`app-select-option-${fieldAId}`));
    fireEvent.press(getByText('Boundary'));

    await waitFor(() => {
      expect(getByText('Unable to validate lot overlap right now. Re-select the field to retry.')).toBeTruthy();
    });
  });
});
