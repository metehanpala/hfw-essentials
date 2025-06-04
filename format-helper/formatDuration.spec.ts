import { FormatDuration } from './formatDuration';

const date = 'H:mm:ss.FFF';
describe('Formatting Duration', () => {
  // 69 minutes is 69 x 60 x 1000 = 4140000 4140000
  // 42 seconds is 42 x 1000      =   42000 4182000
  // 139 ms                       =     139 4182139
  it('Duration: ms w/zero fraction, Format: m/s w/fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'M:ss.fff');
    const res: string = fd.format(4182000);
    expect(res).toBe('69:42.000');
  });
  it('Duration: ms w/zero fraction, Format: m/s w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'M:ss.FFF');
    const res: string = fd.format(4182000);
    expect(res).toBe('69:42');
  });

  it('Duration: ms w/fractional part, Format: m/s w/fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'M:ss.fff');
    const res: string = fd.format(4182139);
    expect(res).toBe('69:42.139');
  });
  it('Duration: ms w/fractional part, Format: m/s w/fraction, Locale: DE', () => {
    const fd: FormatDuration = new FormatDuration('de', 'ms', 'M:ss.fff');
    const res: string = fd.format(4182139);
    expect(res).toBe('69:42,139');
  });

  it('Duration: hs (1), Format: h/m/s w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'hs', date);
    const res: string = fd.format(1);
    expect(res).toBe('0:00:00.010');
  });
  it('Duration: hs (100), Format: h/m/s w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'hs', date);
    const res: string = fd.format(100);
    expect(res).toBe('0:00:01');
  });
  it('Duration: hs (1010), Format: s w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'hs', 'S.FFF');
    const res: string = fd.format(1010);
    expect(res).toBe('10.100');
  });
  it('Duration: ts (1), Format: h/m/s w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ts', date);
    const res: string = fd.format(1);
    expect(res).toBe('0:00:00.100');
  });
  it('Duration: ts (10), Format: h/m/s w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ts', date);
    const res: string = fd.format(10);
    expect(res).toBe('0:00:01');
  });
  it('Duration: ts (100), Format: h/m/s w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ts', date);
    const res: string = fd.format(100);
    expect(res).toBe('0:00:10');
  });
  it('Duration: s (1), Format: h/m/s w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', date);
    const res: string = fd.format(1);
    expect(res).toBe('0:00:01');
  });
  it('Duration: s (9), Format: h/m/s w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', date);
    const res: string = fd.format(9);
    expect(res).toBe('0:00:09');
  });
  it('Duration: s (90), Format: h/m w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'H:mm.FFF');
    const res: string = fd.format(90);
    expect(res).toBe('0:01.500');
  });
  it('Duration: s (100), Format: h/m/s w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', date);
    const res: string = fd.format(100);
    expect(res).toBe('0:01:40');
  });
  it('Duration: s (100), Format: h/m w/2 wide optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'H:mm.FF');
    const res: string = fd.format(100);
    expect(res).toBe('0:01.67');
  });
  // 2 hr + 34 min + 30 sec = ( 2 * 60 + 34 ) * 60 + 30 = 9270
  it('Duration: s (9270), Format: h/m w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'H:mm.FFF');
    const res: string = fd.format(9270);
    expect(res).toBe('2:34.500');
  });
  it('Duration: s (9270), Format: M w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'M.FFF');
    const res: string = fd.format(9270);
    expect(res).toBe('154.500');
  });
  it('Duration: m (9), Format: h/m/s w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'm', date);
    const res: string = fd.format(9);
    expect(res).toBe('0:09:00');
  });
  it('Duration: m (90), Format: h/m w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'm', 'H:mm.FFF');
    const res: string = fd.format(90);
    expect(res).toBe('1:30');
  });
  it('Duration: m (90), Format: h/m w/fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'm', 'H:mm.fff');
    const res: string = fd.format(90);
    expect(res).toBe('1:30.000');
  });
  it('Duration: m (90), Format: h w/fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'm', 'H.fff');
    const res: string = fd.format(90);
    expect(res).toBe('1.500');
  });
  it('Duration: m (90), Format: d/h/m, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'm', 'd:hh:mm');
    const res: string = fd.format(90);
    expect(res).toBe('0:01:30');
  });
  // 2 dy, 13 hr, 15 min = ( 2 * 24 + 13 ) * 60 + 15 = 3675
  it('Duration: m (3675), Format: dy/h w/fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'm', 'd:h.fff');
    const res: string = fd.format(3675);
    expect(res).toBe('2:13.250');
  });
  // strange test to see about zero-filling
  it('Duration: m (3675), Format: dy/3h w/fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'm', 'd:hhh.fff');
    const res: string = fd.format(3675);
    expect(res).toBe('2:013.250');
  });
  it('Duration: m (3675), Format: H w/fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'm', 'H.fff');
    const res: string = fd.format(3675);
    expect(res).toBe('61.250');
  });
  it('Duration: hr w/fractional day, Format: day w/fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'h', 'D.fff');
    const res: string = fd.format(36);
    expect(res).toBe('1.500');
  });
  it('Duration: hr w/zero fraction, Format: day w/fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'h', 'D.fff');
    const res: string = fd.format(24);
    expect(res).toBe('1.000');
  });
  it('Duration: hr w/zero fraction, Format: day w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'h', 'D.FFF');
    const res: string = fd.format(24);
    expect(res).toBe('1');
  });
  it('Duration: day, Format: day w/fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'd', 'D.fff');
    const res: string = fd.format(42);
    expect(res).toBe('42.000');
  });
  it('Duration: day, Format: day w/optional fraction, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'd', 'D.FFF');
    const res: string = fd.format(42);
    expect(res).toBe('42');
  });
  it('Duration: day, Format: d/h/m/s, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'd', 'D:hh:mm:ss');
    const res: string = fd.format(42);
    expect(res).toBe('42:00:00:00');
  });
  // here we test for passing through text (some reserved and escaped)
  it('Duration: m (90), Format: Qwerty h/m, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'm', 'Qwer\\ty H:mm');
    const res: string = fd.format(90);
    expect(res).toBe('Qwerty 1:30');
  });
  it('Duration: m (90), Format:  M Qwerty, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 'm', 'M Qwer\\ty');
    const res: string = fd.format(90);
    expect(res).toBe('90 Qwerty');
  });

  it('Duration: undefined (90), Format: h/m, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', undefined!, 'H:mm');
    const res: string = fd.format(90);
    expect(res).toBe('90');
  });

  it('Duration: empty (90), Format: h/m, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', '', 'H:mm');
    const res: string = fd.format(90);
    expect(res).toBe('90');
  });

  it('Duration: s (90), Format: undefined, Locale: EN', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', undefined!);
    const res: string = fd.format(90);
    expect(res).toBe('90');
  });

  // unknown locale: note that we assume a time separator

  it('Duration: s (90), Format: h/m, Locale: null', () => {
    const fd: FormatDuration = new FormatDuration(null!, 's', 'H:mm');
    const res: string = fd.format(90);
    expect(res).toBe('0:01');
  });
  it('Duration: s (90), Format: h/m, Locale: undefined', () => {
    const fd: FormatDuration = new FormatDuration(undefined!, 's', 'H:mm');
    const res: string = fd.format(90);
    expect(res).toBe('0:01');
  });
  it('Duration: s (90), Format: h/m, Locale: XYZ', () => {
    const fd: FormatDuration = new FormatDuration('XYZ', 's', 'H:mm');
    const res: string = fd.format(90);
    expect(res).toBe('0:01');
  });

  // tenths of a second

  it('Duration: ms (9), Format: t, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 't');
    const res: string = fd.format(90);
    expect(res).toBe('0');
  });
  it('Duration: ms (900), Format: t, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 't');
    const res: string = fd.format(900);
    expect(res).toBe('9');
  });
  it('Duration: ms (900), Format: tt, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'tt');
    const res: string = fd.format(900);
    expect(res).toBe('09');
  });
  it('Duration: ms (1900), Format: t, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 't');
    const res: string = fd.format(1900);
    expect(res).toBe('9');
  });
  it('Duration: ms (1900), Format: T, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'T');
    const res: string = fd.format(1900);
    expect(res).toBe('19');
  });
  it('Duration: ms (1900), Format: TTT, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'TTT');
    const res: string = fd.format(1900);
    expect(res).toBe('019');
  });

  // hundredths of a second

  it('Duration: ms (90), Format: c, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'c');
    const res: string = fd.format(90);
    expect(res).toBe('9');
  });
  it('Duration: ms (900), Format: c, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'c');
    const res: string = fd.format(900);
    expect(res).toBe('90');
  });
  it('Duration: ms (900), Format: ccc, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'ccc');
    const res: string = fd.format(900);
    expect(res).toBe('090');
  });
  it('Duration: ms (1900), Format: c, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'c');
    const res: string = fd.format(1900);
    expect(res).toBe('90');
  });
  it('Duration: ms (1900), Format: C, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'C');
    const res: string = fd.format(1900);
    expect(res).toBe('190');
  });
  it('Duration: ms (1900), Format: CCCC, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'CCCC');
    const res: string = fd.format(1900);
    expect(res).toBe('0190');
  });

  // milliseconds

  it('Duration: ms (90), Format: i, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'i');
    const res: string = fd.format(90);
    expect(res).toBe('90');
  });
  it('Duration: ms (900), Format: i, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'i');
    const res: string = fd.format(900);
    expect(res).toBe('900');
  });
  it('Duration: ms (90), Format: iii, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'iii');
    const res: string = fd.format(90);
    expect(res).toBe('090');
  });
  it('Duration: ms (1900), Format: i, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'i');
    const res: string = fd.format(1900);
    expect(res).toBe('900');
  });
  it('Duration: ms (1900), Format: I, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'I');
    const res: string = fd.format(1900);
    expect(res).toBe('1900');
  });
  it('Duration: ms (1900), Format: IIIII, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'IIIII');
    const res: string = fd.format(1900);
    expect(res).toBe('01900');
  });

  // milliseconds with trailing period (the 'trailing' part is a
  // special case in the formatter)

  it('Duration: ms (1900), Format: I, Locale: en', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'I.');
    const res: string = fd.format(1900);
    expect(res).toBe('1900.');
  });

  // invalid fractional parts

  it('Duration: fractional part (f), nothing to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'f');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (f), t to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 't.fff');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (f), T to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'T.fff');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (f), c to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'c.fff');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (f), C to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'C.fff');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (f), i to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'i.fff');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (f), I to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'I.fff');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (f), f to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 's.f.fff');
    expect(() => fd.format(12345)).toThrow();
  });
  it('Duration: fractional part (f), F to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 's.F.fff');
    expect(() => fd.format(12345)).toThrow();
  });
  it('Duration: fractional part (f), field too big (9): expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'S.fffffffff');
    expect(() => fd.format(100)).toThrow();
  });

  it('Duration: fractional part (F), nothing to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'F');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (F), t to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 't.FFF');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (F), T to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'T.FFF');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (F), c to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'c.FFF');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (F), C to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'C.FFF');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (F), i to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 'i.FFF');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (F), I to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'I.FFF');
    expect(() => fd.format(100)).toThrow();
  });
  it('Duration: fractional part (F), f to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 's.f.FFF');
    expect(() => fd.format(123456)).toThrow();
  });
  it('Duration: fractional part (F), F to the right: expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 'ms', 's.F.FFF');
    expect(() => fd.format(123456)).toThrow();
  });
  it('Duration: fractional part (F), field too big (9): expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'S.FFFFFFFFF');
    expect(() => fd.format(100)).toThrow();
  });

  // invalid argument to format function

  it('Duration: null value, expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'H:mm');
    expect(() => fd.format(null!)).toThrow();
  });
  it('Duration: undefined value, expect exception', () => {
    const fd: FormatDuration = new FormatDuration('en', 's', 'H:mm');
    expect(() => fd.format(undefined!)).toThrow();
  });
});
