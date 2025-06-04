import {
  BACnetDateTimeDetail,
  BACnetDateTimeResolution,
  BACnetDateTimeSupportDayOfWeek,
  FormatBACnetDateTime
} from './formatBACnetDateTime';

describe('Formatting BACnetDateTime', () => {
  // this block is set up for display of date and time, source is not UTC
  // morning date/time
  it('BACnetDateTime: morning time Format: d/t (Aug 13) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11808135100908FF');
    expect(res).toBe('8/13/2018 10:09:08 AM');
  });
  it('BACnetDateTime: morning time Format: d/t (Feb 4) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11802045100908FF');
    expect(res).toBe('2/4/2018 10:09:08 AM');
  });
  it('BACnetDateTime: morning time Format: d/t (Aug 13) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11808135100908FF');
    expect(res).toBe('13.8.2018 10:09:08');
  });
  it('BACnetDateTime: morning time Format: d/t (Feb 4) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11802045100908FF');
    expect(res).toBe('4.2.2018 10:09:08');
  });
  // afternoon date/time
  it('BACnetDateTime: afternoon time Format: d/t (Aug 13) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11808135150908FF');
    expect(res).toBe('8/13/2018 3:09:08 PM');
  });
  it('BACnetDateTime: afternoon time Format: d/t (Feb 4) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11802045150908FF');
    expect(res).toBe('2/4/2018 3:09:08 PM');
  });
  it('BACnetDateTime: afternoon time Format: d/t (Aug 13) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11808135150908FF');
    expect(res).toBe('13.8.2018 15:09:08');
  });
  it('BACnetDateTime: afternoon time Format: d/t (Feb 4) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11802045150908FF');
    expect(res).toBe('4.2.2018 15:09:08');
  });
  // evening date/time
  it('BACnetDateTime: evening time Format: d/t (Aug 13) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11808135220908FF');
    expect(res).toBe('8/13/2018 10:09:08 PM');
  });
  it('BACnetDateTime: evening time Format: d/t (Aug 13) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11808135220908FF');
    expect(res).toBe('13.8.2018 22:09:08');
  });
  it('BACnetDateTime: evening time Format: d/t (Feb 4) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11802045220908FF');
    expect(res).toBe('2/4/2018 10:09:08 PM');
  });
  it('BACnetDateTime: evening time Format: d/t (Feb 4) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11802045220908FF');
    expect(res).toBe('4.2.2018 22:09:08');
  });

  // this block is set up for display of date and time, source *IS* UTC
  // testing note: the resulting date and time will be in the timezone
  // where the tests are running, so the only thing we are going to
  // check is that the date is in the expected format (and possibly
  // adjusted for UTC)
  // morning date/time
  it('BACnetDateTime: morning time Format: d/t (Feb 4) UTC Locale: EN', () => {
    const dt: any = new Date(Date.UTC(2018, 1, 4, 11, 9, 8));
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en',
      BACnetDateTimeDetail.DateAndTime,
      BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.NeverDisplay,
      true);
    const res: string = fbdt.format('11802045110908FF');
    expect(res).toContain(dt.toLocaleDateString('en'));
  });
  it('BACnetDateTime: morning time Format: d/t (Feb 4) UTC Locale: DE', () => {
    const dt: any = new Date(Date.UTC(2018, 1, 4, 11, 9, 8));
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de',
      BACnetDateTimeDetail.DateAndTime,
      BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.NeverDisplay,
      true);
    const res: string = fbdt.format('11802045110908FF');
    expect(res).toContain(dt.toLocaleDateString('de'));
  });
  // afternoon date/time
  it('BACnetDateTime: afternoon time Format: d/t (Feb 4) UTC Locale: EN', () => {
    const dt: any = new Date(Date.UTC(2018, 1, 4, 15, 9, 8));
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en',
      BACnetDateTimeDetail.DateAndTime,
      BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.NeverDisplay,
      true);
    const res: string = fbdt.format('11802045150908FF');
    expect(res).toContain(dt.toLocaleDateString('en'));
  });
  it('BACnetDateTime: afternoon time Format: d/t (Feb 4) UTC Locale: DE', () => {
    const dt: any = new Date(Date.UTC(2018, 1, 4, 15, 9, 8));
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de',
      BACnetDateTimeDetail.DateAndTime,
      BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.NeverDisplay,
      true);
    const res: string = fbdt.format('11802045150908FF');
    expect(res).toContain(dt.toLocaleDateString('de'));
  });
  // evening date/time
  it('BACnetDateTime: evening time Format: d/t (Feb 4) UTC Locale: EN', () => {
    const dt: any = new Date(Date.UTC(2018, 1, 4, 22, 9, 8));
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en',
      BACnetDateTimeDetail.DateAndTime,
      BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.NeverDisplay,
      true);
    const res: string = fbdt.format('11802045220908FF');
    expect(res).toContain(dt.toLocaleDateString('en'));
  });
  it('BACnetDateTime: evening time Format: d/t (Feb 4) UTC Locale: DE', () => {
    const dt: any = new Date(Date.UTC(2018, 1, 4, 22, 9, 8));
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de',
      BACnetDateTimeDetail.DateAndTime,
      BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.NeverDisplay,
      true);
    const res: string = fbdt.format('11802045220908FF');
    expect(res).toContain(dt.toLocaleDateString('de'));
  });

  // month is 13 (odd: should be minus sign)
  it('BACnetDateTime: morning time Format: d/t (Mth: 13) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11813045100908FF');
    expect(res).toBe('-/4/2018 10:09:08 AM');
  });
  it('BACnetDateTime: morning time Format: d/t (Mth: 13) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11813045100908FF');
    expect(res).toBe('4.-.2018 10:09:08');
  });

  // month is 14 (odd: should be plus sign)
  it('BACnetDateTime: morning time Format: d/t (Mth: 14) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11814045100908FF');
    expect(res).toBe('+/4/2018 10:09:08 AM');
  });
  it('BACnetDateTime: morning time Format: d/t (Mth: 14) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11814045100908FF');
    expect(res).toBe('4.+.2018 10:09:08');
  });

  // day of month is 32 (should be up carat)
  it('BACnetDateTime: morning time Format: d/t (DOM: 32) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11805325100908FF');
    expect(res).toBe('5/^/2018 10:09:08 AM');
  });
  it('BACnetDateTime: morning time Format: d/t (DOM: 32) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11805325100908FF');
    expect(res).toBe('^.5.2018 10:09:08');
  });

  // day of month is 33 (odd: should be minus sign)
  it('BACnetDateTime: morning time Format: d/t (DOM: 33) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11805335100908FF');
    expect(res).toBe('5/-/2018 10:09:08 AM');
  });
  it('BACnetDateTime: morning time Format: d/t (DOM: 33) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11805335100908FF');
    expect(res).toBe('-.5.2018 10:09:08');
  });

  // day of month is 34 (even: should be plus sign)
  it('BACnetDateTime: morning time Format: d/t (DOM: 34) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11805345100908FF');
    expect(res).toBe('5/+/2018 10:09:08 AM');
  });
  it('BACnetDateTime: morning time Format: d/t (DOM: 34) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11805345100908FF');
    expect(res).toBe('+.5.2018 10:09:08');
  });

  // here we have time fields all wildcarded
  // month is 13 (odd: should be minus sign)
  it('BACnetDateTime: Format: d (Mth: 13) time wc !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('11813FFFFFFFFFFF');
    expect(res).toBe('-/*/2018');
  });
  it('BACnetDateTime: Format: d (Mth: 13) time wc !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('11813FFFFFFFFFFF');
    expect(res).toBe('*.-.2018');
  });
  // month is 14 (odd: should be plus sign)
  it('BACnetDateTime: Format: d (Mth: 14) time wc !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('1181404FFFFFFFFF');
    expect(res).toBe('+/4/2018');
  });
  it('BACnetDateTime: Format: d (Mth: 14) time wc !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('1181404FFFFFFFFF');
    expect(res).toBe('4.+.2018');
  });

  // second is wildcarded, !UTC
  it('BACnetDateTime: evening time Format: d/t (Aug 13) sec wc !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('118081352209FFFF');
    expect(res).toBe('8/13/2018 10:09:* PM');
  });
  it('BACnetDateTime: evening time Format: d/t (Aug 13) sec wc !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('118081352209FFFF');
    expect(res).toBe('13.8.2018 22:09:*');
  });

  // minute is wildcarded, !UTC
  it('BACnetDateTime: evening time Format: d/t (Aug 13) min wc !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('1180813522FF08FF');
    expect(res).toBe('13.8.2018 22:*:08');
  });
  it('BACnetDateTime: evening time Format: d/t (Feb 4) min wc !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('1180204522FF08FF');
    expect(res).toBe('4.2.2018 22:*:08');
  });

  // hour is wildcarded, !UTC
  it('BACnetDateTime: evening time Format: d/t (Feb 4) hr wc !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11802045FF0908FF');
    expect(res).toBe('2/4/2018 *:09:08 *');
  });
  it('BACnetDateTime: evening time Format: d/t (Aug 13) hr wc !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11808135FF0908FF');
    expect(res).toBe('13.8.2018 *:09:08');
  });

  // day is wildcarded, !UTC
  it('BACnetDateTime: evening time Format: d/t (Aug 13) dy wc !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('11808FF5220908FF');
    expect(res).toBe('8/*/2018 10:09:08 PM');
  });
  it('BACnetDateTime: evening time Format: d/t (Aug 13) dy wc !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('11808FF5220908FF');
    expect(res).toBe('*.8.2018 22:09:08');
  });

  // month is wildcarded, !UTC
  it('BACnetDateTime: evening time Format: d/t (Aug 13) mth wc !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('118FF135220908FF');
    expect(res).toBe('*/13/2018 10:09:08 PM');
  });
  it('BACnetDateTime: evening time Format: d/t (Aug 13) mth wc !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('118FF135220908FF');
    expect(res).toBe('13.*.2018 22:09:08');
  });

  // year is wildcarded, !UTC
  it('BACnetDateTime: evening time Format: d/t (Aug 13) yr wc !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('FFF08135220908FF');
    expect(res).toBe('8/13/* 10:09:08 PM');
  });
  it('BACnetDateTime: evening time Format: d/t (Aug 13) yr wc !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('FFF08135220908FF');
    expect(res).toBe('13.8.* 22:09:08');
  });

  // date only, no wildcards, !UTC
  it('BACnetDateTime: date+time no wildcards Format: date only (Aug 13) Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('11808135100908FF');
    expect(res).toBe('8/13/2018');
  });
  it('BACnetDateTime: date+time no wildcards Format: date only (Aug 13) Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('11808135100908FF');
    expect(res).toBe('13.8.2018');
  });
  it('BACnetDateTime: date+time no wildcards Format: date only (May 4) Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('11805045100908FF');
    expect(res).toBe('5/4/2018');
  });
  it('BACnetDateTime: date+time no wildcards Format: date only (May 4) Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('11805045100908FF');
    expect(res).toBe('4.5.2018');
  });
  // with day of week
  it('BACnetDateTime: date+time no wildcards Format: date with dow when not wc Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en',
      BACnetDateTimeDetail.DateOnly, BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.DisplayWhenNotWildcarded);
    const res: string = fbdt.format('11808135100908FF');
    expect(res).toBe('Friday 8/13/2018');
  });
  it('BACnetDateTime: happy path Format: date with dow when not wc Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de',
      BACnetDateTimeDetail.DateOnly, BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.DisplayWhenNotWildcarded);
    const res: string = fbdt.format('11808135100908FF');
    expect(res).toBe('Freitag 13.8.2018');
  });

  // date only, with wildcards
  it('BACnetDateTime: date+time wildcards Format: date only (Aug 13) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('1180813FFFFFFFFF');
    expect(res).toBe('8/13/2018');
  });
  it('BACnetDateTime: date+time wildcards Format: date only (May 4) !UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('1180504FFFFFFFFF');
    expect(res).toBe('5/4/2018');
  });
  it('BACnetDateTime: date+time wildcards Format: date only (Aug 13) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('1180813FFFFFFFFF');
    expect(res).toBe('13.8.2018');
  });
  it('BACnetDateTime: date+time wildcards Format: date only (may 4) !UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de', BACnetDateTimeDetail.DateOnly);
    const res: string = fbdt.format('1180504FFFFFFFFF');
    expect(res).toBe('4.5.2018');
  });

  // dow only when wc: but in this case *
  it('BACnetDateTime: happy path no dow Format: date with dow when not wc Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en',
      BACnetDateTimeDetail.DateOnly, BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.DisplayWhenNotWildcarded);
    const res: string = fbdt.format('1180813F100908FF');
    expect(res).toBe('8/13/2018');
  });
  it('BACnetDateTime: happy path no dow Format: date with dow when not wc Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de',
      BACnetDateTimeDetail.DateOnly, BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.DisplayWhenNotWildcarded);
    const res: string = fbdt.format('1180813F100908FF');
    expect(res).toBe('13.8.2018');
  });

  // always display dow, wildcarded
  it('BACnetDateTime: happy path no dow Format: date with dow Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en',
      BACnetDateTimeDetail.DateOnly, BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.AlwaysDisplay);
    const res: string = fbdt.format('1180813F100908FF');
    expect(res).toBe('(*) 8/13/2018');
  });
  it('BACnetDateTime: happy path no dow Format: date with dow Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de',
      BACnetDateTimeDetail.DateOnly, BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.AlwaysDisplay);
    const res: string = fbdt.format('1180813F100908FF');
    expect(res).toBe('(*) 13.8.2018');
  });

  // time only, no wc - seconds
  it('BACnetDateTime: happy path Format: time only Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en', BACnetDateTimeDetail.TimeOnly);
    const res: string = fbdt.format('11808135100908FF');
    expect(res).toBe('10:09:08 AM');
  });
  it('BACnetDateTime: happy path Format: time only Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de', BACnetDateTimeDetail.TimeOnly);
    const res: string = fbdt.format('11808135100908FF');
    expect(res).toBe('10:09:08');
  });

  // time only, no wc - tenths
  it('BACnetDateTime: happy path Format: time only with tenths Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en',
      BACnetDateTimeDetail.TimeOnly, BACnetDateTimeResolution.Tenths);
    const res: string = fbdt.format('1180813510090842');
    expect(res).toBe('10:09:08.4 AM');
  });
  it('BACnetDateTime: happy path Format: time only with tenths Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de',
      BACnetDateTimeDetail.TimeOnly, BACnetDateTimeResolution.Tenths);
    const res: string = fbdt.format('1180813510090842');
    expect(res).toBe('10:09:08,4');
  });

  // time only, no wc - hundredths
  it('BACnetDateTime: happy path Format: time only with hundredths Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en',
      BACnetDateTimeDetail.TimeOnly, BACnetDateTimeResolution.Hundredths);
    const res: string = fbdt.format('1180813510090842');
    expect(res).toBe('10:09:08.42 AM');
  });
  it('BACnetDateTime: happy path Format: time only with hundredths Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de',
      BACnetDateTimeDetail.TimeOnly, BACnetDateTimeResolution.Hundredths);
    const res: string = fbdt.format('1180813510090842');
    expect(res).toBe('10:09:08,42');
  });

  // time is missing but declared to be UTC
  it('BACnetDateTime: time wc Format: d/t (Feb 4) UTC Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en',
      BACnetDateTimeDetail.DateAndTime,
      BACnetDateTimeResolution.Seconds,
      BACnetDateTimeSupportDayOfWeek.NeverDisplay,
      true);
    const res: string = fbdt.format('1180204FFFFFFFFF');
    expect(res).toBe('2/4/2018 *:*:* *');
  });
  it('BACnetDateTime: time wc Format: d/t (Feb 4) UTC Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('1180204FFFFFFFFF');
    expect(res).toBe('4.2.2018 *:*:*');
  });

  // all wildcarded
  it('BACnetDateTime: all wildcards Format: d/t Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en');
    const res: string = fbdt.format('FFFFFFFFFFFFFFFF');
    expect(res).toBe('*/*/* *:*:* *');
  });
  it('BACnetDateTime: all wildcards Format: d/t Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    const res: string = fbdt.format('FFFFFFFFFFFFFFFF');
    expect(res).toBe('*.*.* *:*:*');
  });

  // time only: hour is wildcarded: en should have wc for am/pm, de not
  it('BACnetDateTime: time with wc hours Format: time only Locale: EN', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('en', BACnetDateTimeDetail.TimeOnly);
    const res: string = fbdt.format('11808135FF0908FF');
    expect(res).toBe('*:09:08 *');
  });
  it('BACnetDateTime: time with wc hours Format: time only Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de', BACnetDateTimeDetail.TimeOnly);
    const res: string = fbdt.format('11808135FF0908FF');
    expect(res).toBe('*:09:08');
  });

  // unknown locale
  it('BACnetDateTime: happy path Format: d/t Locale: null', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime(null!);
    const res: string = fbdt.format('11808135100908FF');
    const dt: Date = new Date(2018, 7, 13, 10, 9, 8);
    expect(res).toContain(dt.toLocaleDateString());
    expect(res).toContain(dt.toLocaleTimeString());
  });
  it('BACnetDateTime: happy path Format: d/t Locale: undefined', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime(undefined!);
    const res: string = fbdt.format('11808135100908FF');
    const dt: Date = new Date(2018, 7, 13, 10, 9, 8);
    expect(res).toContain(dt.toLocaleDateString());
    expect(res).toContain(dt.toLocaleTimeString());
  });
  it('BACnetDateTime: happy path Format: d/t Locale: XYZ', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('XYZ');
    const res: string = fbdt.format('11808135100908FF');
    const dt: Date = new Date(2018, 7, 13, 10, 9, 8);
    expect(res).toContain(dt.toLocaleDateString());
    expect(res).toContain(dt.toLocaleTimeString());
  });

  // invalid format arguments
  it('BACnetDateTime: short string Format: not used Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    expect(() => fbdt.format('FFF')).toThrow();
  });
  it('BACnetDateTime: invalid year Format: not used Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    expect(() => fbdt.format('1F808135100908FF')).toThrow();
  });
  it('BACnetDateTime: invalid month Format: not used Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    expect(() => fbdt.format('118F8135100908FF')).toThrow();
  });
  it('BACnetDateTime: invalid day Format: not used Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    expect(() => fbdt.format('11808F35100908FF')).toThrow();
  });
  it('BACnetDateTime: invalid hour Format: not used Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    expect(() => fbdt.format('11808135F00908FF')).toThrow();
  });
  it('BACnetDateTime: invalid minute Format: not used Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    expect(() => fbdt.format('11808135100F08FF')).toThrow();
  });
  it('BACnetDateTime: invalid second Format: not used Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    expect(() => fbdt.format('118081351009F8FF')).toThrow();
  });
  it('BACnetDateTime: invalid hundredths of second Format: not used Locale: DE', () => {
    const fbdt: FormatBACnetDateTime = new FormatBACnetDateTime('de');
    expect(() => fbdt.format('11808135100908F0')).toThrow();
  });
});
