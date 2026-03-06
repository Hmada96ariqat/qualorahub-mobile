import { ApiError } from '../../api/client';
import {
  formatApiErrorMessage,
  getLifecycleConflictBlockers,
  isActiveLifecycleStatus,
  isInactiveLifecycleStatus,
  isOperationalCropStatus,
  normalizeLifecycleStatus,
} from '../lifecycle';

describe('lifecycle utils', () => {
  it('normalizes lifecycle status helpers', () => {
    expect(normalizeLifecycleStatus(' Active ')).toBe('active');
    expect(isActiveLifecycleStatus('ACTIVE')).toBe(true);
    expect(isInactiveLifecycleStatus(' inactive ')).toBe(true);
    expect(isOperationalCropStatus('planned')).toBe(true);
    expect(isOperationalCropStatus('Active')).toBe(true);
    expect(isOperationalCropStatus('inactive')).toBe(false);
  });

  it('extracts lifecycle blockers from api error details', () => {
    const error = new ApiError({
      status: 409,
      code: 'CONFLICT',
      message: 'Field cannot be deactivated.',
      details: {
        blockers: [
          {
            kind: 'active_lots',
            count: 2,
            message: 'Deactivate active lots first.',
          },
        ],
      },
    });

    expect(getLifecycleConflictBlockers(error)).toEqual([
      {
        kind: 'active_lots',
        count: 2,
        message: 'Deactivate active lots first.',
      },
    ]);
  });

  it('formats api errors with blocker details and trace id', () => {
    const error = new ApiError({
      status: 409,
      code: 'CONFLICT',
      message: 'Cannot deactivate field "223". Resolve these active dependencies first: 2 active lots, 1 active housing unit.',
      details: {
        blockers: [
          {
            kind: 'active_lots',
            count: 2,
            message: 'Deactivate active lots first.',
          },
          {
            kind: 'active_housing_units',
            count: 1,
            message: 'Deactivate active housing units first.',
          },
        ],
      },
      traceId: 'trace-123',
    });

    expect(formatApiErrorMessage(error, 'fallback')).toBe(
      'Field 223 can\'t be deactivated yet because it still has 2 active lots and 1 active housing unit. Resolve those first, then try again. (trace: trace-123)',
    );
  });

  it('formats active-field requirement conflicts in plain language', () => {
    const error = new ApiError({
      status: 409,
      code: 'CONFLICT',
      message: 'Lot cannot be reactivated because its field is inactive.',
      details: {
        entity: 'field',
        entityId: 'field-1',
        currentStatus: 'inactive',
        requiredStatus: 'active',
      },
    });

    expect(formatApiErrorMessage(error, 'fallback')).toBe(
      "This record can't be reactivated until its field is active. Reactivate the field first, then try again.",
    );
  });
});
