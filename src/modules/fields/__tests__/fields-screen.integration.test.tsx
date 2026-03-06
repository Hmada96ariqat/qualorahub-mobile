import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import { FieldsScreen } from '../screens/FieldsScreen';
import { useFieldsModule } from '../useFieldsModule.hook';

const mockReplace = jest.fn();

jest.mock('../useFieldsModule.hook', () => ({
  useFieldsModule: jest.fn(),
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
    replace: mockReplace,
  }),
}));

function renderScreen() {
  return renderWithProviders(
    <ToastProvider>
      <FieldsScreen />
    </ToastProvider>,
  );
}

describe('FieldsScreen integration', () => {
  const useFieldsModuleMock = jest.mocked(useFieldsModule);

  const fieldRecord = {
    id: 'field-1',
    name: 'Inactive Field',
    areaHectares: '1.0',
    areaUnit: 'hectares',
    status: 'inactive',
    shapePolygon: null,
    location: null,
    soilType: 'loam',
    notes: null,
    soilTypeCategory: null,
    soilTypeOther: null,
    irrigationType: null,
    irrigationTypeOther: null,
    soilConditions: null,
    activeCycleSummary: null,
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
  } as const;

  const createFieldMock = jest.fn().mockResolvedValue({
    ...fieldRecord,
    id: 'field-2',
  });
  const reactivateMainMock = jest.fn().mockResolvedValue(fieldRecord);
  const reactivateDeactivatedMock = jest.fn().mockResolvedValue(fieldRecord);
  const loadFieldDetailMock = jest.fn().mockResolvedValue({
    ...fieldRecord,
    lots: [
      {
        id: 'lot-1',
        name: 'Lot A',
        status: 'active',
        shapePolygon: null,
      },
    ],
    housingUnitBoundaries: [],
  });

  beforeEach(() => {
    mockReplace.mockClear();
    createFieldMock.mockClear();
    reactivateMainMock.mockClear();
    reactivateDeactivatedMock.mockClear();
    loadFieldDetailMock.mockClear();

    useFieldsModuleMock.mockReturnValue({
      fields: [fieldRecord],
      inactiveFieldsWithLots: [
        {
          ...fieldRecord,
          lots: [],
        },
      ],
      isLoading: false,
      isRefreshing: false,
      isMutating: false,
      errorMessage: null,
      refresh: async () => undefined,
      loadFieldDetail: loadFieldDetailMock,
      createField: createFieldMock,
      updateField: async () => fieldRecord,
      deactivateField: async () => fieldRecord,
      reactivateFieldMain: reactivateMainMock,
      reactivateFieldFromDeactivated: reactivateDeactivatedMock,
    });
  });

  it('submits create field with manual fallback payload when selected', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = renderScreen();

    fireEvent.press(getByTestId('fields-header-create'));

    fireEvent.changeText(getByPlaceholderText('Field name'), '  South Field  ');
    fireEvent.press(getByText('Use manual area fallback'));
    fireEvent.changeText(getByPlaceholderText('1.00'), '2.5');
    fireEvent.press(getByTestId('fields-form-submit'));

    await waitFor(() => {
      expect(createFieldMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'South Field',
          shape_polygon: expect.objectContaining({ manual: true, area: 2.5 }),
          area_hectares: expect.any(Number),
        }),
      );
    });
  });

  it('defaults the field status filter to active records', () => {
    const { queryByText } = renderScreen();

    expect(queryByText('Inactive Field')).toBeNull();
  });

  it('uses deactivated reactivation endpoint when inactive filter is selected', async () => {
    const { getByText, getByTestId } = renderScreen();

    fireEvent.press(getByText('Inactive (1)'));

    fireEvent.press(getByText('Inactive Field'));
    await waitFor(() => expect(loadFieldDetailMock).toHaveBeenCalledWith('field-1'));
    fireEvent.press(getByText('Reactivate'));
    fireEvent.press(getByTestId('confirm-dialog.confirm'));

    await waitFor(() => expect(reactivateDeactivatedMock).toHaveBeenCalledWith('field-1'));
    expect(reactivateMainMock).not.toHaveBeenCalled();
  });

  it('switches to lots from the shared section tabs', () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByText('Lots'));

    expect(getByTestId('fields-module-switch')).toBeTruthy();
    expect(mockReplace).toHaveBeenCalledWith('/(protected)/lots');
  });
});
