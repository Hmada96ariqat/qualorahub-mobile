import type { ManagedContact } from '../../../api/modules/management';
import {
  toContactDateLabel,
  toContactRowSubtitle,
  toContactStatusVariant,
  toContactTypesLabels,
  toContactTypeLabel,
} from '../contactPresentation';

const sampleContact: ManagedContact = {
  id: 'contact-1',
  name: 'Supplier A',
  type: 'supplier',
  contactTypes: ['supplier', 'priority_partner'],
  company: 'Acme Supply',
  phone: '+1-555-0100',
  email: 'supplier@example.test',
  address: '123 Farm Road',
  notes: null,
  country: 'Jordan',
  cityRegion: 'Amman',
  taxId: null,
  status: 'active',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-02T00:00:00.000Z',
};

describe('contactPresentation', () => {
  it('normalizes contact type labels', () => {
    expect(toContactTypeLabel('supplier')).toBe('Supplier');
    expect(toContactTypeLabel('priority_partner')).toBe('Priority Partner');
    expect(toContactTypeLabel(null)).toBe('Other');
  });

  it('builds row subtitles from the most useful contact metadata', () => {
    expect(toContactRowSubtitle(sampleContact)).toBe(
      'Supplier · Acme Supply · supplier@example.test · +1-555-0100',
    );
  });

  it('maps status variants and contact type chips', () => {
    expect(toContactStatusVariant('active')).toBe('success');
    expect(toContactStatusVariant('inactive')).toBe('neutral');
    expect(toContactTypesLabels(sampleContact)).toEqual(['Supplier', 'Priority Partner']);
  });

  it('formats contact timestamps for profile cells', () => {
    expect(toContactDateLabel('2026-03-02T00:00:00.000Z')).toBe('Mar 2, 2026');
  });
});
