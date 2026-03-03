import { fieldPayloadSchema, validateFieldBoundaryInput } from '../validation';

describe('fields validation', () => {
  it('validates required field payload enums and required values', () => {
    const result = fieldPayloadSchema.safeParse({
      name: 'North Field',
      area_hectares: 1.2,
      area_unit: 'acres',
      status: 'active',
    });

    expect(result.success).toBe(true);
  });

  it('requires boundary when manual fallback is disabled', () => {
    const result = validateFieldBoundaryInput({
      points: [],
      manualEnabled: false,
      manualArea: '',
    });

    expect(result).toEqual({ valid: false, reason: 'missing_boundary' });
  });

  it('accepts manual fallback with valid positive area', () => {
    const result = validateFieldBoundaryInput({
      points: [],
      manualEnabled: true,
      manualArea: '2.4',
    });

    expect(result).toEqual({ valid: true, reason: 'ok' });
  });
});
