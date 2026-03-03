import React from 'react';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { appTheme } from '../../theme/paperTheme';

export function renderWithProviders(ui: ReactElement) {
  return render(<PaperProvider theme={appTheme}>{ui}</PaperProvider>);
}
