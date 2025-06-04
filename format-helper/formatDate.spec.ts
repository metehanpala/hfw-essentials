import { FormatDate } from './formatDate';

// !!! NOTE !!!
// these tests may fail if the user has customized the date/time
// format for the en/de locales.

describe('Formatting Date/Time', () => {
  it('FormatDateTime: Simple happy path Locale: EN', () => {
    const fd: FormatDate = new FormatDate('en');
    const dt: Date = new Date(2018, 10, 1, 9, 8, 7, 413);
    const res: string = fd.format(dt);
    expect(res).toBe('11/1/2018 9:08:07.413 AM');
  });
  it('FormatDateTime: Simple happy path Locale: DE', () => {
    const fd: FormatDate = new FormatDate('de');
    const dt: Date = new Date(2018, 10, 1, 9, 8, 7, 413);
    const res: string = fd.format(dt);
    expect(res).toBe('1.11.2018 09:08:07,413');
  });

  it('FormatDateTime: undefined Locale: EN', () => {
    const fd: FormatDate = new FormatDate('en');
    expect(() => fd.format(undefined!)).toThrow();
  });

  // check 24 hour format
  it('FormatDateTime: Locale: EN (expecting false for 24 hr format)', () => {
    const fd: FormatDate = new FormatDate('en');
    expect(fd.is24HourFormat).toBe(false);
  });
  it('FormatDateTime: Locale: DE (expecting true for 24 hr format)', () => {
    const fd: FormatDate = new FormatDate('de');
    expect(fd.is24HourFormat).toBe(true);
  });

  // unknown locale
  it('FormatDateTime: Simple happy path Locale: null', () => {
    const fd: FormatDate = new FormatDate(null!);
    const dt: Date = new Date(2018, 10, 1, 9, 8, 7, 413);
    const res: string = fd.format(dt);
    expect(res).toContain('413');
  });
  it('FormatDateTime: Simple happy path Locale: undefined', () => {
    const fd: FormatDate = new FormatDate(undefined!);
    const dt: Date = new Date(2018, 10, 1, 9, 8, 7, 413);
    const res: string = fd.format(dt);
    expect(res).toContain('413');
  });
  it('FormatDateTime: Simple happy path Locale: XYZ', () => {
    const fd: FormatDate = new FormatDate('XYZ');
    const dt: Date = new Date(2018, 10, 1, 9, 8, 7, 413);
    const res: string = fd.format(dt);
    expect(res).toContain('413');
  });
});
