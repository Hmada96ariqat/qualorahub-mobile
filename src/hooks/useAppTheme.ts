import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export function useAppTheme(): MD3Theme {
  return useTheme<MD3Theme>();
}
