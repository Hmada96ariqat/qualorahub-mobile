import {
  getServicePerformerLabel,
  matchesServicePerformerId,
  parseServicePerformerReference,
  resolveServicePerformerValue,
} from '../servicePerformer';

describe('servicePerformer helpers', () => {
  it('parses valid performer references and rejects invalid ones', () => {
    expect(parseServicePerformerReference('user:11111111-1111-4111-8111-111111111111')).toEqual({
      kind: 'user',
      id: '11111111-1111-4111-8111-111111111111',
      raw: 'user:11111111-1111-4111-8111-111111111111',
    });

    expect(parseServicePerformerReference('user:not-a-uuid')).toBeNull();
  });

  it('matches performer ids from either user or contact references', () => {
    expect(
      matchesServicePerformerId(
        'contact:22222222-2222-4222-8222-222222222222',
        '22222222-2222-4222-8222-222222222222',
      ),
    ).toBe(true);
  });

  it('prefers the API performer projection when available', () => {
    expect(
      getServicePerformerLabel({
        reference: 'user:11111111-1111-4111-8111-111111111111',
        performer: {
          kind: 'user',
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Farm Manager',
        },
        fallback: 'Unknown',
      }),
    ).toBe('Farm Manager');
  });

  it('resolves canonical values from legacy names and ids', () => {
    expect(
      resolveServicePerformerValue({
        reference: 'Vendor Crew',
        contacts: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            name: 'Vendor Crew',
          },
        ],
      }),
    ).toBe('contact:22222222-2222-4222-8222-222222222222');

    expect(
      resolveServicePerformerValue({
        reference: 'Internal Tech',
        users: [
          {
            user_id: '11111111-1111-4111-8111-111111111111',
            display_name: 'Internal Tech',
          },
        ],
      }),
    ).toBe('user:11111111-1111-4111-8111-111111111111');
  });

  it('never exposes raw canonical values when only fallback display is available', () => {
    expect(
      getServicePerformerLabel({
        reference: 'user:11111111-1111-4111-8111-111111111111',
        fallback: 'Unknown',
      }),
    ).toBe('Unknown');
  });

  it('falls back safely when the reference is not parseable', () => {
    expect(
      getServicePerformerLabel({
        reference: 'legacy-text-value',
        fallback: 'Unknown',
      }),
    ).toBe('legacy-text-value');
  });
});
