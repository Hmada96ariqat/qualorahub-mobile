import {
  getLanguageDirection,
  getLanguageOption,
  normalizeLanguage,
  setCurrentLanguage,
  t,
} from '../mobile';

describe('mobile i18n runtime', () => {
  afterEach(() => {
    setCurrentLanguage('en');
  });

  it('normalizes supported language codes and falls back to english', () => {
    expect(normalizeLanguage('es-MX')).toBe('es');
    expect(normalizeLanguage('ar-SA')).toBe('ar');
    expect(normalizeLanguage('de')).toBe('en');
  });

  it('reads translations from synced web locale resources', () => {
    setCurrentLanguage('es');
    expect(t('fields', 'title')).toBe('Campos y Lotes');

    setCurrentLanguage('ar');
    expect(t('dashboard', 'title')).toBe('لوحة التحكم');
  });

  it('supports local system resources and interpolation', () => {
    setCurrentLanguage('ar');

    expect(
      t('system', 'headers.dashboard.signedInAs', 'Signed in as {{email}}', {
        email: 'ops@example.test',
      }),
    ).toBe('تم تسجيل الدخول باسم ops@example.test');
  });

  it('exposes the correct direction metadata per language', () => {
    expect(getLanguageDirection('en')).toBe('ltr');
    expect(getLanguageDirection('ar')).toBe('rtl');
    expect(getLanguageOption('es')).toEqual({
      code: 'es',
      flag: '🇸🇻',
      label: 'Español',
    });
  });
});
