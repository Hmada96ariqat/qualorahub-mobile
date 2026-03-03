import { resolveCreatedContactOption, type CreateContactOptionInput } from '../useInventoryModule.hook';

type ContactOption = {
  id: string;
  name: string;
  contactTypes: string[];
};

function buildDraft(name: string): CreateContactOptionInput {
  return {
    name,
    company: null,
    phone: null,
    email: null,
    address: null,
    country: null,
    cityRegion: null,
    taxId: null,
    notes: null,
  };
}

describe('resolveCreatedContactOption', () => {
  it('prefers the newly added option id when duplicate names exist', () => {
    const previous: ContactOption[] = [
      { id: 'existing-1', name: 'Acme', contactTypes: ['supplier'] },
      { id: 'existing-2', name: 'Bravo', contactTypes: ['supplier'] },
    ];
    const refreshed: ContactOption[] = [
      ...previous,
      { id: 'new-1', name: 'Acme', contactTypes: ['supplier'] },
    ];

    const resolved = resolveCreatedContactOption({
      previousOptions: previous,
      refreshedOptions: refreshed,
      draft: buildDraft('Acme'),
    });

    expect(resolved?.id).toBe('new-1');
  });

  it('falls back to the latest name match when ids are unchanged', () => {
    const previous: ContactOption[] = [
      { id: 'existing-1', name: 'Acme', contactTypes: ['supplier'] },
    ];
    const refreshed: ContactOption[] = [
      { id: 'existing-1', name: 'Acme', contactTypes: ['supplier'] },
      { id: 'existing-2', name: 'Acme', contactTypes: ['supplier'] },
    ];

    const resolved = resolveCreatedContactOption({
      previousOptions: previous,
      refreshedOptions: refreshed,
      draft: buildDraft('Acme'),
    });

    expect(resolved?.id).toBe('existing-2');
  });

  it('uses single new option fallback when backend normalizes the created name', () => {
    const previous: ContactOption[] = [
      { id: 'existing-1', name: 'Supplier A', contactTypes: ['supplier'] },
    ];
    const refreshed: ContactOption[] = [
      ...previous,
      { id: 'new-1', name: 'Supplier-A', contactTypes: ['supplier'] },
    ];

    const resolved = resolveCreatedContactOption({
      previousOptions: previous,
      refreshedOptions: refreshed,
      draft: buildDraft('Supplier A'),
    });

    expect(resolved?.id).toBe('new-1');
  });

  it('returns null when no deterministic match is available', () => {
    const previous: ContactOption[] = [
      { id: 'existing-1', name: 'Alpha', contactTypes: ['supplier'] },
    ];
    const refreshed: ContactOption[] = [
      ...previous,
      { id: 'new-1', name: 'Beta', contactTypes: ['supplier'] },
      { id: 'new-2', name: 'Gamma', contactTypes: ['supplier'] },
    ];

    const resolved = resolveCreatedContactOption({
      previousOptions: previous,
      refreshedOptions: refreshed,
      draft: buildDraft('Acme'),
    });

    expect(resolved).toBeNull();
  });
});
