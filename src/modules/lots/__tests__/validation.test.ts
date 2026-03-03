import { createLotPayloadSchema } from '../validation';

describe('lots validation', () => {
  it('accepts required lot create payload with enum values', () => {
    const result = createLotPayloadSchema.safeParse({
      field_id: '11111111-1111-4111-8111-111111111111',
      name: 'Lot A',
      lot_type: 'open_lot',
      crop_rotation_plan: 'monoculture',
      light_profile: 'full_sun',
      status: 'active',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid enum values', () => {
    const result = createLotPayloadSchema.safeParse({
      field_id: '11111111-1111-4111-8111-111111111111',
      name: 'Lot A',
      lot_type: 'invalid_type',
      crop_rotation_plan: 'monoculture',
      light_profile: 'full_sun',
      status: 'active',
    });

    expect(result.success).toBe(false);
  });
});
