import React from 'react';
import { Pressable, Text, I18nManager } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithProviders } from '../../components/__tests__/test-utils';
import { LocalizationProvider, useLocalization } from '../LocalizationProvider';

const reloadAsyncMock = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);

jest.mock('expo-updates', () => ({
  reloadAsync: () => reloadAsyncMock(),
}));

function LocalizationConsumer() {
  const { isRTL, language, setLanguage } = useLocalization();

  return (
    <>
      <Text testID="localization-language">{language}</Text>
      <Text testID="localization-direction">{isRTL ? 'rtl' : 'ltr'}</Text>
      <Pressable testID="localization-set-es" onPress={() => void setLanguage('es')}>
        <Text>Set ES</Text>
      </Pressable>
      <Pressable testID="localization-set-ar" onPress={() => void setLanguage('ar')}>
        <Text>Set AR</Text>
      </Pressable>
    </>
  );
}

describe('LocalizationProvider', () => {
  const allowRTLMock = jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => undefined);
  const forceRTLMock = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => undefined);
  const swapLeftAndRightMock = jest
    .spyOn(I18nManager, 'swapLeftAndRightInRTL')
    .mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(I18nManager, 'isRTL', {
      configurable: true,
      value: false,
    });
  });

  afterAll(() => {
    allowRTLMock.mockRestore();
    forceRTLMock.mockRestore();
    swapLeftAndRightMock.mockRestore();
  });

  it('hydrates the stored language without reloading when direction is unchanged', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce('es');

    const { getByTestId } = renderWithProviders(
      <LocalizationProvider>
        <LocalizationConsumer />
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('localization-language').props.children).toBe('es');
    });

    expect(getByTestId('localization-direction').props.children).toBe('ltr');
    expect(reloadAsyncMock).not.toHaveBeenCalled();
  });

  it('persists and reloads when switching to an rtl language', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

    const { getByTestId } = renderWithProviders(
      <LocalizationProvider>
        <LocalizationConsumer />
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('localization-language').props.children).toBe('en');
    });

    fireEvent.press(getByTestId('localization-set-ar'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app.language.v1', 'ar');
      expect(forceRTLMock).toHaveBeenCalledWith(true);
      expect(reloadAsyncMock).toHaveBeenCalled();
    });
  });
});
