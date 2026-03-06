import {
  normalizeTaskPriority,
  normalizeTaskStatus,
  serializeTaskDueDate,
  toTaskAssetPayload,
  toTaskFormValues,
} from '../contracts';

describe('tasks contracts', () => {
  it('maps task summary to form values', () => {
    const values = toTaskFormValues({
      id: 'task-1',
      title: 'Inspect Pump',
      description: 'Verify pressure level',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-03-09',
      assetId: 'asset-1',
      assetLabel: 'Main Pump',
      assignedTo: null,
      fieldId: null,
      livestockId: null,
      equipmentId: 'asset-1',
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });

    expect(values).toEqual({
      title: 'Inspect Pump',
      description: 'Verify pressure level',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-03-09',
      assetId: 'asset-1',
    });
  });

  it('normalizes unknown status/priority values safely', () => {
    expect(normalizeTaskStatus('OPEN')).toBe('pending');
    expect(normalizeTaskPriority('urgent')).toBe('medium');
  });

  it('serializes due date values into ISO datetime and date-only pair', () => {
    expect(serializeTaskDueDate('2026-03-05')).toEqual({
      valid: true,
      dueDateTime: '2026-03-05T00:00:00.000Z',
      dueDate: '2026-03-05',
    });

    expect(serializeTaskDueDate('2026-03-05T14:30:00.000Z')).toEqual({
      valid: true,
      dueDateTime: '2026-03-05T14:30:00.000Z',
      dueDate: '2026-03-05',
    });
  });

  it('rejects non-ISO human-readable due date strings', () => {
    expect(serializeTaskDueDate('Thu Mar 05')).toEqual({
      valid: false,
      dueDateTime: null,
      dueDate: null,
    });
  });

  it('maps selected asset option to canonical payload fields', () => {
    const payload = toTaskAssetPayload('user-1', [
      { value: 'field-1', label: 'Field: North Field', binding: 'field_id' },
      { value: 'user-1', label: 'User: Ops Lead', binding: 'assigned_to' },
    ]);

    expect(payload).toEqual({
      assigned_to: 'user-1',
      field_id: null,
      livestock_id: null,
      equipment_id: null,
    });
  });
});
