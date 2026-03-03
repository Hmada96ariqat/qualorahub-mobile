import React from 'react';
import { fireEvent, waitFor, within } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import { FieldsScreen } from '../screens/FieldsScreen';
import { useFieldsModule } from '../useFieldsModule.hook';

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

  beforeEach(() => {
    createFieldMock.mockClear();
    reactivateMainMock.mockClear();
    reactivateDeactivatedMock.mockClear();

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
      loadFieldDetail: async () => {
        throw new Error('not used');
      },
      createField: createFieldMock,
      updateField: async () => fieldRecord,
      deactivateField: async () => fieldRecord,
      reactivateFieldMain: reactivateMainMock,
      reactivateFieldFromDeactivated: reactivateDeactivatedMock,
    });
  });

  it('submits create field with manual fallback payload when selected', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = renderScreen();

    fireEvent.press(getByText('Create Field'));

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

  it('uses deactivated reactivation endpoint when inactive filter is selected', async () => {
    const { getByText, getByTestId } = renderScreen();

    const statusFilter = getByTestId('fields-status-filter');
    fireEvent.press(within(statusFilter).getByText('Active'));
    fireEvent.press(getByTestId('app-select-option-inactive'));

    fireEvent.press(getByText('Inactive Field'));
    fireEvent.press(getByText('Reactivate field'));
    fireEvent.press(getByTestId('confirm-dialog.confirm'));

    await waitFor(() => expect(reactivateDeactivatedMock).toHaveBeenCalledWith('field-1'));
    expect(reactivateMainMock).not.toHaveBeenCalled();
  });
});
