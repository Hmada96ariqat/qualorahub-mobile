import {
  resolveBoundaryAfterValidation,
  validateLotBoundaryCandidate,
} from '../geometry-rules';

describe('lots geometry rules', () => {
  const fieldBoundary = [
    { latitude: 31.95, longitude: 35.91 },
    { latitude: 31.95, longitude: 35.92 },
    { latitude: 31.96, longitude: 35.92 },
    { latitude: 31.96, longitude: 35.91 },
  ];

  const occupied = [
    [
      { latitude: 31.951, longitude: 35.911 },
      { latitude: 31.951, longitude: 35.914 },
      { latitude: 31.954, longitude: 35.914 },
      { latitude: 31.954, longitude: 35.911 },
    ],
  ];

  it('rejects lot polygon that is outside the field', () => {
    const result = validateLotBoundaryCandidate({
      candidate: [
        { latitude: 31.961, longitude: 35.921 },
        { latitude: 31.961, longitude: 35.922 },
        { latitude: 31.962, longitude: 35.922 },
      ],
      fieldBoundary,
      occupiedLots: occupied,
    });

    expect(result).toEqual({ valid: false, reason: 'outside_field' });
  });

  it('rejects overlapping lot polygon', () => {
    const result = validateLotBoundaryCandidate({
      candidate: [
        { latitude: 31.952, longitude: 35.913 },
        { latitude: 31.952, longitude: 35.916 },
        { latitude: 31.955, longitude: 35.916 },
      ],
      fieldBoundary,
      occupiedLots: occupied,
    });

    expect(result).toEqual({ valid: false, reason: 'overlap' });
  });

  it('reverts invalid edit to last valid polygon', () => {
    const lastValid = [
      { latitude: 31.955, longitude: 35.915 },
      { latitude: 31.955, longitude: 35.918 },
      { latitude: 31.958, longitude: 35.918 },
    ];

    const resolved = resolveBoundaryAfterValidation({
      candidate: [
        { latitude: 31.961, longitude: 35.921 },
        { latitude: 31.961, longitude: 35.922 },
        { latitude: 31.962, longitude: 35.922 },
      ],
      lastValid,
      validation: { valid: false, reason: 'outside_field' },
    });

    expect(resolved).toEqual(lastValid);
  });
});
