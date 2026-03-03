import { z } from 'zod';

export const lotTypeEnum = z.enum([
  'open_lot',
  'greenhouse',
  'shade_house',
  'tunnel_polytunnel',
  'nursery',
  'grow_area_planting_area',
  'orchard',
  'vineyard',
  'livestock_barn',
  'livestock_pasture_grazing',
  'storage_pad_warehouse',
  'other',
]);

export const cropRotationEnum = z.enum([
  'monoculture',
  'two_field_rotation',
  'three_field_rotation',
  'four_field_rotation',
  'cover_cropping',
  'fallow_periods',
  'intercropping',
  'other',
]);

export const lightProfileEnum = z.enum([
  'full_sun',
  'partial_sun',
  'partial_shade',
  'dappled_shade',
  'full_shade',
  'indoor_controlled_light',
]);

export const lotStatusEnum = z.enum(['active', 'inactive']);

export const createLotPayloadSchema = z.object({
  field_id: z.string().uuid(),
  name: z.string().trim().min(1),
  lot_type: lotTypeEnum,
  crop_rotation_plan: cropRotationEnum,
  light_profile: lightProfileEnum,
  status: lotStatusEnum.default('active'),
});
