import { normalizeTaskPriority, normalizeTaskStatus, toTaskFormValues } from '../contracts';

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
});
