// Whole-script strict mode syntax
/* jslint node: true */
'use strict';
const isDigit = (s: string): boolean => '0' <= s && s <= '9';

class DateFormatter {
  private readonly _dtf: Intl.DateTimeFormat | null;

  public constructor(locale: string) {
    try {
      this._dtf = Intl.DateTimeFormat(locale);
    } catch (e1) {
      try {
        this._dtf = Intl.DateTimeFormat(undefined);
      } catch (e2) {
        this._dtf = null;
      }
    }
  }
  public format(dt: Date): string {
    let d: string;
    if (this._dtf !== null) {
      d = this._dtf.format(dt);
    } else {
      d = dt.toLocaleDateString();
    }
    return d;
  }
}

class TimeFormatter {
  private readonly _tmf: Intl.DateTimeFormat | null;
  private readonly _is24: boolean;
  public constructor(locale: string) {
    const o: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', second: 'numeric' };
    try {
      this._tmf = Intl.DateTimeFormat(locale, o);
    } catch (e1) {
      try {
        this._tmf = Intl.DateTimeFormat(undefined, o);
      } catch (e2) {
        this._tmf = null;
      }
    }

    // now that we know how we are to format the
    // time we can check to see if it is in 24 hr format

    const d: Date = new Date(2018, 3, 11, 13, 14, 15);
    const s: string = this.format(d).trim();
    const i: number = s.length - 1;
    this._is24 = isDigit(s[i]);
  }

  public format(dt: Date): string {
    let t: string;
    if (this._tmf !== null) {
      t = this._tmf.format(dt);
    } else {
      t = dt.toLocaleTimeString();
    }
    return t;
  }

  public is24Format(): boolean {
    return this._is24;
  }
}

class MillisecondsFormatter {
  private readonly _nmf: Intl.NumberFormat | null;

  public constructor(locale: string) {
    const o: Intl.NumberFormatOptions = { minimumFractionDigits: 3, maximumFractionDigits: 3 };
    try {
      this._nmf = Intl.NumberFormat(locale, o);
    } catch (e1) {
      try {
        this._nmf = Intl.NumberFormat(undefined, o);
      } catch (e2) {
        this._nmf = null;
      }
    }
  }

  public format(dt: Date): string {
    let m: string;
    const n: number = dt.getMilliseconds() / 1000.0;
    if (this._nmf !== null) {
      m = this._nmf.format(n);
    } else {
      m = n.toLocaleString();
    }
    // we strip off the leading zero: the caller wants everything
    // from the decimal separator on
    return m.substring(1);
  }
}

export class FormatDate {
  private readonly _dtf: DateFormatter;
  private readonly _tmf: TimeFormatter;
  private readonly _msf: MillisecondsFormatter;

  /*
   * Constructor
   * @param {String} locale - the locale that the desired date/time is to be formatted in
   */
  public constructor(locale: string) {
    this._dtf = new DateFormatter(locale);
    this._tmf = new TimeFormatter(locale);
    this._msf = new MillisecondsFormatter(locale);
  }

  /**
   * @name formatDate
   * @summary Format a date and time: short date, long time (with milliseconds)
   *
   * @description
   * Format a date and time value.
   *
   * @param dt - the date and time
   * @returns the formatted date and time
   * @memberOf FormatDate
   *
   * @example
   * var d = new Date( Date.UTC( 2010, 6, 4, 10, 9, 8, 433 );
   * var s = formatDate( "de-DE", d );
   * // result is "4.7.2010 05:09:08,433"
   */
  public format(dt: Date): string {
    if ((dt === null) || (dt === undefined)) {
      throw new Error('Date information is required');
    }

    const d: string = this._dtf.format(dt);
    const t: string = this._tmf.format(dt);
    const m: string = this._msf.format(dt);
    const i: number = this.findLastNumericChar(t);

    return `${d} ${t.substring(0, i + 1)}${m}${t.substring(i + 1)}`;
  }

  /**
   * @prop {boolean} is24HourFormat
   *  Does the locale call for a 24 hour format?
   */
  public get is24HourFormat(): boolean {
    return this._tmf.is24Format();
  }

  private findLastNumericChar(t: string): number {
    let f = false;
    let i: number = t.length;
    while (!f && i > 0) {
      --i;
      f = isDigit(t[i]);
    }
    return i;
  }
}
