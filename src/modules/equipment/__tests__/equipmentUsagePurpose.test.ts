import {
  finalizeEquipmentUsagePurpose,
  getEquipmentUsagePurposeLabel,
  OTHER_EQUIPMENT_USAGE_PURPOSE_KEY,
  resolveEquipmentUsagePurposeFormValues,
  resolveEquipmentUsagePurposeKey,
} from '../equipmentUsagePurpose';

describe('equipmentUsagePurpose helpers', () => {
  it('normalizes localized labels into canonical purpose keys', () => {
    expect(resolveEquipmentUsagePurposeKey('Tilling')).toBe('tilling');
    expect(resolveEquipmentUsagePurposeKey('Labranza')).toBe('tilling');
    expect(resolveEquipmentUsagePurposeKey('الحراثة')).toBe('tilling');
  });

  it('normalizes legacy mobile values into canonical keys', () => {
    expect(resolveEquipmentUsagePurposeKey('field_work')).toBe('other');
    expect(resolveEquipmentUsagePurposeKey('harvest')).toBe('harvesting');
    expect(resolveEquipmentUsagePurposeKey('general')).toBe('other');
  });

  it('maps custom legacy labels into the other-purpose form state', () => {
    expect(resolveEquipmentUsagePurposeFormValues('Custom hauling')).toEqual({
      usagePurpose: OTHER_EQUIPMENT_USAGE_PURPOSE_KEY,
      otherPurpose: 'Custom hauling',
    });
  });

  it('finalizes canonical keys and trimmed custom values safely', () => {
    expect(finalizeEquipmentUsagePurpose('spraying', '')).toBe('spraying');
    expect(finalizeEquipmentUsagePurpose('other', '  Emergency tow  ')).toBe('Emergency tow');
    expect(finalizeEquipmentUsagePurpose('other', '   ')).toBe('');
  });

  it('renders display labels for canonical keys and preserves custom labels', () => {
    expect(getEquipmentUsagePurposeLabel('cleaning')).toBe('Cleaning');
    expect(getEquipmentUsagePurposeLabel('Custom hauling')).toBe('Custom hauling');
  });
});
