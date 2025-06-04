// Whole-script strict mode syntax
/* jslint node: true */
/**
 * Enumeration for specifying what to show
 * @readonly
 * @enum {number}
 */
export enum BACnetDateTimeDetail {
  Unspecified = 0,
  DateOnly = 1,
  TimeOnly = 2,
  DateAndTime = 3
}

/**
 * Enumeration for specifying time resolution (when time is to be displayed)
 * @readonly
 * @enum {number}
 */
export enum BACnetDateTimeResolution {
  Seconds = 0,
  Tenths = 1,
  Hundredths = 2
}

/**
 * Enumeration specifying day of week support (dow only shows when detail includes date)
 * @readonly
 * @enum {number}
 */
export enum BACnetDateTimeSupportDayOfWeek {
  NeverDisplay = 0,
  DisplayWhenNotWildcarded = 1,
  AlwaysDisplay = 2
}

class ParsedBACnetDateTime {
  public year: number | undefined;
  public month: number | undefined;
  public day: number | undefined;
  public dow: number | undefined;
  public hour: number | undefined;
  public minute: number | undefined;
  public second: number | undefined;
  public hundredths: number | undefined;
  public isValid: boolean;
  public fieldsWildcarded: boolean;
  public constructor(private readonly rawDateTime: string) {
    this.year = undefined;
    this.month = undefined;
    this.day = undefined;
    this.dow = undefined;
    this.hour = undefined;
    this.minute = undefined;
    this.second = undefined;
    this.hundredths = undefined;
    this.isValid = false;
    this.fieldsWildcarded = true;

    if (this.isValidBACnetDateTimeAsString(this.rawDateTime)) {
      this.year = this.getFieldValue(this.rawDateTime, 0, 3);
      this.month = this.getFieldValue(this.rawDateTime, 3, 2);
      this.day = this.getFieldValue(this.rawDateTime, 5, 2);
      this.dow = this.getFieldValue(this.rawDateTime, 7, 1);
      this.hour = this.getFieldValue(this.rawDateTime, 8, 2);
      this.minute = this.getFieldValue(this.rawDateTime, 10, 2);
      this.second = this.getFieldValue(this.rawDateTime, 12, 2);
      this.hundredths = this.getFieldValue(this.rawDateTime, 14, 2);
      this.isValid = true;

      // // TODO: should we validate each field??

      // some important notes:
      // - BACnet year is offset by 1900
      // - BACnet defines the month range as 1..12 but JS wants 0..11
      // - BACnet defines the hour range as 0..23 but JS wants 1..24
      // - month: 13 means odd, 14 means even
      // - day: 32 means last day, 33 means odd, 34 means even
      // => we consider a mth/dom with a 'reserved' value to be wildcarded
      if (this.hour === undefined || this.minute === undefined || this.second === undefined) {
        this.fieldsWildcarded = true;
      }
      if (this.year === undefined || (this.month === undefined || (this.month >= 13 && this.month <= 14))) {
        this.fieldsWildcarded = true;
      }
      if (this.day === undefined || (this.day >= 32 && this.day <= 34)) {
        this.fieldsWildcarded = true;
      }

      if (this.year !== undefined) {
        this.year += 1900;
      }
    }
  }
  private getFieldValue(s: string, start: number, len: number): number | undefined {
    let num;
    const t: string = s.substring(start, start + len);
    // note that we are relying on the upstream code to validate the field;
    // if it begins with an "f" then the entire field is wildcarded
    if (t[0] !== 'f' && t[0] !== 'F') {
      num = parseInt(t, 10);
    }
    return num;
  }
  private isValidBACnetDateTimeAsString(s: string): boolean {
    let isValid1 = false;
    let isValid2 = false;
    let isValid3 = false;
    if (s !== null && s !== undefined && typeof (s) === 'string' && s.length === 16) {
      isValid1 = true;
    }
    if (this.isValidField(s, 0, 3) && // yr
      this.isValidField(s, 3, 2) && // mth
      this.isValidField(s, 5, 2) && // dy
      this.isValidField(s, 14, 2)) { // hundredths
      isValid2 = true;
    }
    if (this.isValidField(s, 7, 1) && // dow
      this.isValidField(s, 8, 2) && // hr
      this.isValidField(s, 10, 2) && // min
      this.isValidField(s, 12, 2)) { // security
      isValid3 = true;
    }
    if (isValid1 === isValid2 === isValid3) {
      return true;
    } else {
      return false;
    }
  }
  // this is probably being a bit paranoid, but we are checking all char
  // in the field to make sure that the entire field is either digits or
  // wildcard characters
  private isValidField(s: string, start: number, len: number): boolean {
    let numDigits = 0;
    let numWildcards = 0;
    for (let i = 0; i < len; ++i) {
      if (s[start + i] >= '0' && s[start + i] <= '9') {
        numDigits++;
      }
      if (s[start + i] === 'f' || s[start + i] === 'F') {
        numWildcards++;
      }
    }
    return len === numDigits || len === numWildcards;
  }
}

class DtReplacer {
  public index: number;
  public length: number;
  private _field = '*';
  public constructor(s: string, f1: string, f2: string) {
    let i: number;
    let f = '';
    i = s.indexOf(f1);
    if (i !== -1) {
      f = f1;
    } else {
      i = s.indexOf(f2);
      if (i !== -1) {
        f = f2;
      }
    }
    this.index = i;
    this.length = f.length;
  }
  public get field(): string {
    return this._field;
  }
  public set field(f: string) {
    this._field = f;
  }
  public format(s: string): string {
    let t: string = s;
    if (this.index !== -1) {
      t = s.substring(0, this.index) +
                this._field +
                s.substring(this.index + this.length);
    }
    return t;
  }
  public toString(): string {
    return ` I: ${this.index} L: ${this.length} F: ${this.field}`;
  }
}

export class FormatBACnetDateTime {
  /**
   * @constructor
   * @param locale - the locale used to format the BACnet date/time
   * @param detail? - date, time, date+time (default is date + time)
   * @param dow? - is day of week required (default is never)
   * @param isUtc - should values be considered as UTC?
   *
   * @description
   * It is worth noting that the UTC flag is ignored if any of the following
   * fields in the BACnet date/time string are wildcarded: year, month, day,
   * hour, minute, second. When one (or more) of those fields is wildcarded
   * the date and time is not fully specified therefore the BACnet date/time
   * will be treated as "local time."
   */
  public constructor(
    private readonly locale: string,
    private readonly detail?: BACnetDateTimeDetail,
    private readonly res?: BACnetDateTimeResolution,
    private readonly dow?: BACnetDateTimeSupportDayOfWeek,
    private readonly isUtc?: boolean) {
    this.detail = this.detail ?? BACnetDateTimeDetail.DateAndTime;
    this.res = this.res ?? BACnetDateTimeResolution.Seconds;
    this.dow = this.dow ?? BACnetDateTimeSupportDayOfWeek.NeverDisplay;
    this.isUtc = this.isValidBool(this.isUtc!) ? this.isUtc : false;
  }

  /**
   * @name format
   * @summary Format a BACnet-encoded date/time string
   *
   * @description
   * Format a BACnet-encoded date/time string. Short date, long time,
   * with fractions of seconds if the resolution specifies it.
   *
   * @param bdt - the date/time as a string with BACnet encoding
   * @returns the formatted date/time
   *
   * @example
   * // default to: date+time, no fractions of seconds, no dow, not UTC
   * let fdt = new FormatBACnetDateTime( "en" );
   * let result = fdt.format( "1180920F04103055" );
   * // result is "9/20/2018 5:10:30 AM"
   */
  public format(bdt: string): string {
    const pdt: ParsedBACnetDateTime = new ParsedBACnetDateTime(bdt);
    if (!pdt.isValid) {
      throw new Error('A valid encoded BACnet date/time is required');
    }
    switch (this.detail) {
      case BACnetDateTimeDetail.DateOnly:
        return this.formatJustDate(pdt);
      case BACnetDateTimeDetail.TimeOnly:
        return this.formatJustTime(pdt);
      default: // captures both unspecified AND d+t
        return `${this.formatJustDate(pdt)} ${this.formatJustTime(pdt)}`;
    }
  }

  private formatRawTime(pdt: ParsedBACnetDateTime): string {
    let ds = '';
    let hr: DtReplacer;
    if (pdt.hour === undefined) {
      // if the hr is wc then we need to replace am/pm with *
      const dt1: Date = new Date(Date.UTC(1997, 3, 5, 7, 5, 3));
      ds = this.formatTimeOnlyUTC(dt1);
      ds = this.replaceAmPmWithWildcard(ds);
      hr = new DtReplacer(ds, '07', '7');
    } else {
      // we have an hour value, want am/pm when locale needs it
      const dt2: Date = new Date(Date.UTC(1997, 3, 5, pdt.hour, 5, 3));
      ds = this.formatTimeOnlyUTC(dt2);
      hr = new DtReplacer('a', 'b', 'c');
    }

    const min: DtReplacer = new DtReplacer(ds, '05', '5');
    const sec: DtReplacer = new DtReplacer(ds, '03', '3');

    hr.field = this.formatField(pdt.hour!, hr.length);
    min.field = this.formatField(pdt.minute!, min.length);
    sec.field = this.formatField(pdt.second!, sec.length);

    const arry: DtReplacer[] = [hr, min, sec];
    arry.sort((a: DtReplacer, b: DtReplacer): number => b.index - a.index);
    return arry[2].format(arry[1].format(arry[0].format(ds)));
  }

  private formatJustTime(pdt: ParsedBACnetDateTime): string {
    if (pdt.fieldsWildcarded) {
    // one of three cases will cause us to enter here:
    // 1) one of the required fields is wildcarded
    // 2) the month is one of the reserved values
    // 3) the day-of-month is one of the reserved values
      let ds = this.formatRawTime(pdt);
      // add fractions of sec when requested and appropriate. note that
      // we don't have to check for a wildcard char (for sec) since we
      // will not add the fractions of seconds in that case...
      if (this.res !== BACnetDateTimeResolution.Seconds && pdt.second !== undefined && pdt.hundredths !== undefined) {
        const i: number = this.findIndexOfLastDigit(ds);
        const nd: number = this.res === BACnetDateTimeResolution.Tenths ? 1 : 2;
        const val: number = pdt.hundredths / 100.0;
        const h: string = this.formatNumeric(nd, val);
        ds = ds.substring(0, i + 1) + h.substring(1) + ds.substring(i + 1);
      }
      return ds;
    } else {
      // note that we have to adjust month because BACnet
      // defines the range slightly differently
      let dt3: Date;
      dt3 = new Date(pdt.year!, pdt.month! - 1, pdt.day, pdt.hour, pdt.minute, pdt.second)!;

      if (this.isUtc) {
        dt3 = new Date(Date.UTC(pdt.year!, pdt.month! - 1, pdt.day, pdt.hour, pdt.minute, pdt.second)!)!;
      }
      const ds = this.formatTimeOnly(dt3);
      return this.addFractionOfSec(ds, pdt);
    }
  }

  private addFractionOfSec(ds: string, pdt: ParsedBACnetDateTime): string {
    // add fractions of sec when requested and appropriate. note that
    // we don't have to check for a wildcard char (for sec) since we
    // will not add the fractions of seconds in that case...
    if (this.res !== BACnetDateTimeResolution.Seconds && pdt.second !== undefined && pdt.hundredths !== undefined) {
      const i: number = this.findIndexOfLastDigit(ds);
      const nd: number = this.res === BACnetDateTimeResolution.Tenths ? 1 : 2;
      const val: number = pdt.hundredths / 100.0;
      const h: string = this.formatNumeric(nd, val);
      ds = ds.substring(0, i + 1) + h.substring(1) + ds.substring(i + 1);
    }
    return ds;
  }

  private findIndexOfLastDigit(s: string): number {
    let f = false;
    let i: number = s.length;
    while (!f && i > 0) {
      --i;
      f = s[i] >= '0' && s[i] <= '9';
    }
    return i;
  }

  private replaceAmPmWithWildcard(s: string): string {
    const i: number = this.findIndexOfLastDigit(s);
    // we will only append wc IF:
    // 1) we found a digit (hopefully we do)
    // 2) it is NOT the last char of the string (locale doesn't use am/pm)
    if ((i >= 0) && (i < (s.length - 1))) {
      s = s.substring(0, i + 1) + ' *';
    }
    return s;
  }

  private formatTimeOnlyUTC(dt: Date): string {
    let s: string;
    const o: Intl.DateTimeFormatOptions = { timeZone: 'UTC', hour: 'numeric',
      minute: 'numeric', second: 'numeric' };

    try {
      const df: Intl.DateTimeFormat = Intl.DateTimeFormat(this.locale, o);
      s = df.format(dt);
    } catch (e1) {
      try {
        const df: Intl.DateTimeFormat = Intl.DateTimeFormat([], o);
        s = df.format(dt);
      } catch (e2) {
        try {
          s = dt.toLocaleDateString([], o);
        } catch (e3) {
          s = '';
        }
      }
    }
    return s;
  }

  private formatTimeOnly(dt: Date): string {
    let s: string;
    const o: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', second: 'numeric' };

    try {
      const df: Intl.DateTimeFormat = Intl.DateTimeFormat(this.locale, o);
      s = df.format(dt);
    } catch (e1) {
      try {
        const df: Intl.DateTimeFormat = Intl.DateTimeFormat([], o);
        s = df.format(dt);
      } catch (e2) {
        try {
          s = dt.toLocaleTimeString([], o);
        } catch (e3) {
          s = '';
        }
      }
    }
    return s;
  }

  private formatNumeric(nd: number, val: number): string {
    let s: string;
    const o: Intl.NumberFormatOptions = { minimumFractionDigits: nd, maximumFractionDigits: nd };

    try {
      const nf: Intl.NumberFormat = Intl.NumberFormat(this.locale, o);
      s = nf.format(val);
    } catch (e1) {
      try {
        const nf: Intl.NumberFormat = Intl.NumberFormat(undefined, o);
        s = nf.format(val);
      } catch (e2) {
        try {
          s = val.toLocaleString([], o);
        } catch (e3) {
          s = val.toString();
        }
      }
    }
    return s;
  }

  private formatRawDate(pdt: ParsedBACnetDateTime): string {
    const dt: Date = new Date(1997, 3, 5);
    const ds: string = this.formatDateOnly(dt);
    const yr: DtReplacer = new DtReplacer(ds, '1997', '97');
    const mth: DtReplacer = new DtReplacer(ds, '04', '4');
    const day: DtReplacer = new DtReplacer(ds, '05', '5');

    yr.field = '*';
    mth.field = '*';
    day.field = '*';

    if (pdt.year !== undefined) {
      let t: string = pdt.year.toString();
      if (yr.length !== 4) {
        t = t.substring(2);
      }
      yr.field = t;
    }

    if (pdt.month !== undefined) {
      // mth is numeric: 13 => odd, 14 => even
      if (pdt.month === 13) {
        mth.field = '-';
      } else if (pdt.month === 14) {
        mth.field = '+';
      } else {
        mth.field = this.formatField(pdt.month, mth.length);
      }
    }

    if (pdt.day !== undefined) {
      // day is numeric:
      //  32 => last day of month
      //  33 => odd days
      //  34 => even days
      if (pdt.day === 32) {
        day.field = '^';
      } else if (pdt.day === 33) {
        day.field = '-';
      } else if (pdt.day === 34) {
        day.field = '+';
      } else {
        day.field = this.formatField(pdt.day, day.length);
      }
    }

    const arry: DtReplacer[] = [yr, mth, day];

    // we start replacing at the end (highest index)
    arry.sort((a: DtReplacer, b: DtReplacer): number => b.index - a.index);

    return arry[2].format(arry[1].format(arry[0].format(ds)));
  }

  private formatJustDate(pdt: ParsedBACnetDateTime): string {
    if (pdt.fieldsWildcarded) {
      // one of three cases will cause us to enter here:
      // 1) one of the required fields (y/m/d/h/m/s) is wildcarded
      // 2) the month is one of the reserved values
      // 3) the day-of-month is one of the reserved values
      let ds = this.formatRawDate(pdt);

      if (this.dow !== BACnetDateTimeSupportDayOfWeek.NeverDisplay) {
        if (pdt.dow === undefined) {
          if (this.dow === BACnetDateTimeSupportDayOfWeek.AlwaysDisplay) {
            ds = '(*) ' + ds;
          }
        } else {
          // dow: 1 = monday
          const dow: number = pdt.dow + 4;
          const t: string = this.formatWeekday(new Date(1970, 0, dow));
          ds = `${t} ${ds}`;
        }
      }
      return ds;
    } else {
      // all "required" fields are not wildcarded so we can use std
      // lib call.we do this so that the lib can adjust for UTC.
      // NOTE! we must adjust month because BACnet defines ranges differently
      return this.adjustMonth(pdt);
    }
  }

  private adjustMonth(pdt: ParsedBACnetDateTime): string {
    let dt: Date;
    if (this.isUtc) {
      dt = new Date(Date.UTC(pdt.year!, pdt.month! - 1, pdt.day, pdt.hour, pdt.minute, pdt.second));
    } else {
      dt = new Date(pdt.year!, pdt.month! - 1, pdt.day, pdt.hour, pdt.minute, pdt.second);
    }
    let ds = this.formatDateOnly(dt);

    if (this.dow !== BACnetDateTimeSupportDayOfWeek.NeverDisplay) {
      if (pdt.dow === undefined) {
        if (this.dow === BACnetDateTimeSupportDayOfWeek.AlwaysDisplay) {
          ds = '(*) ' + ds;
        }
      } else {
        // dow: 1 = monday
        const dow: number = pdt.dow + 4;
        const t: string = this.formatWeekday(new Date(1970, 0, dow));
        ds = `${t} ${ds}`;
      }
    }
    return ds;
  }

  private formatDateOnly(dt: Date): string {
    let s: string;

    try {
      s = dt.toLocaleDateString(this.locale);
    } catch (e1) {
      try {
        s = dt.toLocaleDateString();
      } catch (e2) {
        s = '';
      }
    }
    return s;
  }
  private formatWeekday(dt: Date): string {
    let s: string;
    try {
      s = dt.toLocaleString(this.locale, { weekday: 'long' });
    } catch (e1) {
      try {
        s = dt.toLocaleString(undefined, { weekday: 'long' });
      } catch (e2) {
        s = '(*)';
      }
    }
    return s;
  }
  private formatField(f: number, width: number): string {
    let res = '*';
    if (f !== undefined) {
      res = f.toString();
      while (res.length < width) {
        res = '0' + res;
      }
    }
    return res;
  }
  private isValidBool(b: boolean): boolean {
    return (b !== undefined) && (b !== null) && (typeof (b) === 'boolean');
  }
}
