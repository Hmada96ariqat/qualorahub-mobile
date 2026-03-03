import AsyncStorage from '@react-native-async-storage/async-storage';

const FIELD_AREA_UNIT_KEY = 'field_area_unit';

export type PersistedFieldAreaUnit = 'hectares' | 'acres' | 'manzana';

function isAreaUnit(value: string | null): value is PersistedFieldAreaUnit {
  return value === 'hectares' || value === 'acres' || value === 'manzana';
}

export async function readFieldAreaUnitPreference(): Promise<PersistedFieldAreaUnit> {
  try {
    const raw = await AsyncStorage.getItem(FIELD_AREA_UNIT_KEY);
    if (isAreaUnit(raw)) {
      return raw;
    }
  } catch {
    // Ignore storage failures and fall back to default.
  }

  return 'hectares';
}

export async function writeFieldAreaUnitPreference(unit: PersistedFieldAreaUnit): Promise<void> {
  try {
    await AsyncStorage.setItem(FIELD_AREA_UNIT_KEY, unit);
  } catch {
    // Ignore storage failures to avoid blocking form submissions.
  }
}

export const FIELD_AREA_UNIT_STORAGE_KEY = FIELD_AREA_UNIT_KEY;
