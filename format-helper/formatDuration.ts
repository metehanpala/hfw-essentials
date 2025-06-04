// Whole-script strict mode syntax
/* jslint node: true */
import { isNullOrUndefined } from '@gms-flex/services-common';

class TimeInterval {
  private readonly days: number;
  private readonly hours: number;
  private readonly minutes: number;
  private readonly seconds: number;
  private readonly milliseconds: number;
  public constructor(private readonly rawValue: number, private readonly rawUnits: string) {
    this.days = 0;
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.milliseconds = 0;
    let rawHrs = 0;
    let rawMins = 0;
    let rawSecs = 0;
    switch (this.rawUnits) {
      case 'd':
        this.days = this.rawValue;
        break;
      case 'h':
        this.hours = this.rawValue % 24;
        this.days = Math.floor(this.rawValue / 24);
        break;
      case 'm':
        rawHrs = Math.floor(this.rawValue / 60);
        this.minutes = this.rawValue % 60;
        this.hours = rawHrs % 24;
        this.days = Math.floor(rawHrs / 24);
        break;
      case 's':
        rawMins = Math.floor(this.rawValue / 60);
        rawHrs = Math.floor(rawMins / 60);
        this.seconds = this.rawValue % 60;
        this.minutes = rawMins % 60;
        this.hours = rawHrs % 24;
        this.days = Math.floor(rawHrs / 24);
        break;
      case 'ts':
        rawSecs = Math.floor(this.rawValue / 10);
        rawMins = Math.floor(rawSecs / 60);
        rawHrs = Math.floor(rawMins / 60);
        this.milliseconds = 100 * (this.rawValue % 10);
        this.seconds = rawSecs % 60;
        this.minutes = rawMins % 60;
        this.hours = rawHrs % 24;
        this.days = Math.floor(rawHrs / 24);
        break;
      case 'hs':
        rawSecs = Math.floor(this.rawValue / 100);
        rawMins = Math.floor(rawSecs / 60);
        rawHrs = Math.floor(rawMins / 60);
        this.milliseconds = 10 * (this.rawValue % 100);
        this.seconds = rawSecs % 60;
        this.minutes = rawMins % 60;
        this.hours = rawHrs % 24;
        this.days = Math.floor(rawHrs / 24);
        break;
      case 'ms':
        rawSecs = Math.floor(this.rawValue / 1000);
        rawMins = Math.floor(rawSecs / 60);
        rawHrs = Math.floor(rawMins / 60);
        this.milliseconds = this.rawValue % 1000;
        this.seconds = rawSecs % 60;
        this.minutes = rawMins % 60;
        this.hours = rawHrs % 24;
        this.days = Math.floor(rawHrs / 24);
        break;
      default:
        break;
    }
  }
  public getDays(): number {
    return this.days;
  }
  public getHours(): number {
    return this.hours;
  }
  public getMinutes(): number {
    return this.minutes;
  }
  public getSeconds(): number {
    return this.seconds;
  }
  public getTenthsOfSeconds(): number {
    return Math.floor(this.milliseconds / 100);
  }
  public getHundredthsOfSeconds(): number {
    return Math.floor(this.milliseconds / 10);
  }
  public getMilliseconds(): number {
    return this.milliseconds;
  }
  public getTotalDays(): number {
    return this.days;
  }
  public getTotalHours(): number {
    return this.hours + 24 * this.days;
  }
  public getTotalMinutes(): number {
    return this.minutes + 60 * (this.hours + 24 * this.days);
  }
  public getTotalSeconds(): number {
    return this.seconds + 60 * (this.minutes + 60 * (this.hours + 24 * this.days));
  }
  public getTotalTenthsOfSeconds(): number {
    return Math.floor((this.milliseconds + 1000 * (
      this.seconds + 60 * (
        this.minutes + 60 * (
          this.hours + 24 * this.days)))) / 100);
  }
  public getTotalHundredthsOfSeconds(): number {
    return Math.floor((this.milliseconds + 1000 * (
      this.seconds + 60 * (
        this.minutes + 60 * (
          this.hours + 24 * this.days)))) / 10);
  }
  public getTotalMilliseconds(): number {
    return this.milliseconds + 1000 * (
      this.seconds + 60 * (
        this.minutes + 60 * (
          this.hours + 24 * this.days)));
  }

  // note that the units coming in is the field designation, NOT
  // the units of the duration
  public getFraction(units: string, digits: number): number {
    let val = 0;
    switch (units) {
      case 'd':
        val = (this.hours + (this.minutes + (this.seconds + this.milliseconds / 1000) / 60) / 60) / 24;
        break;
      case 'h':
        val = (this.minutes + (this.seconds + this.milliseconds / 1000) / 60) / 60;
        break;
      case 'm':
        val = (this.seconds + this.milliseconds / 1000) / 60;
        break;
      case 's':
        val = this.milliseconds / 1000;
        break;
      default:
        // tenths / hundredths / milliseconds / fractions
        break;
    }
    for (let i = 0; i < digits; i++) {
      val *= 10;
    }
    // note: use round here to account for floating point issues
    return Math.round(val);
  }

  public toString(): string {
    return ` D: ${this.days.toString()} H: ${this.hours.toString()} M: ${this.minutes.toString()}
     S: ${this.seconds.toString()} MS: ${this.milliseconds.toString()}`;
  }
}

export class FormatDuration {
  private readonly timeSeparator: string;
  private readonly decimalSeparator: string;
  private readonly cannotFormat: boolean;

  /**
   * Constructor
   * @param locale - the locale used to determine something
   * @param units - the units of the raw duration
   * @param fmt - the desired format of the output
   */
  public constructor(locale: string, private readonly units: string, private readonly fmt: string) {
    this.timeSeparator = this.findTimeSeparator(locale);
    this.decimalSeparator = this.findDecimalSeparator(locale);
    this.cannotFormat = this.isNotAString(this.timeSeparator) ||
                            this.isNotAString(this.decimalSeparator) ||
                            this.isNotAString(this.fmt) ||
                            !this.isValidUnits(this.units);
    // perf improvement: parse format specifier here (once)
  }
  /**
   * @name format
   * @summary Format a duration
   *
   * @description
   * Format a duration.
   *
   * @param duration - the raw duration (an unsigned integer)
   * @returns the formatted duration
   *
   * @example
   * // format 3942 seconds into hours + minutes + seconds
   * var fd = new FormatDuration( "en", "s", "H:mm:ss" );
   * var result = fd.format( 3942 );
   * // result is 1:05:42
   */
  public format(duration: number): string {
    if ((duration === null) || (duration === undefined) || (typeof (duration) !== 'number')) {
      throw new Error('Duration is required');
    }
    // one or more of the constructor args is not valid, so we cannot
    // do any formatting of the duration value.
    if (this.cannotFormat) {
      return duration.toString();
    }
    let previousField = '';
    const ti: TimeInterval = new TimeInterval(duration, this.units);
    let pos = 0;
    let len = 0;
    let lastCharWasDecimal = false;
    let formattedValue = '';
    // // TODO: support random text in []
    while (pos < this.fmt.length) {
      const patternChar: string = this.fmt.charAt(pos);
      switch (patternChar) {
        case '\\':
          if (pos < (this.fmt.length - 2)) {
            pos++;
            len = 1;
            formattedValue += this.fmt.charAt(pos);
          }
          break;
        case 'd':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getDays().toString(), len);
          previousField = 'd';
          break;
        case 'D':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getTotalDays().toString(), len);
          previousField = 'd';
          break;
        case 'h':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getHours().toString(), len);
          previousField = 'h';
          break;
        case 'H':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getTotalHours().toString(), len);
          previousField = 'h';
          break;
        case 'm':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getMinutes().toString(), len);
          previousField = 'm';
          break;
        case 'M':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getTotalMinutes().toString(), len);
          previousField = 'm';
          break;
        case 's':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getSeconds().toString(), len);
          previousField = 's';
          break;
        case 'S':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getTotalSeconds().toString(), len);
          previousField = 's';
          break;
        case 't':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getTenthsOfSeconds().toString(), len);
          previousField = 't';
          break;
        case 'T':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getTotalTenthsOfSeconds().toString(), len);
          previousField = 't';
          break;
        case 'c':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getHundredthsOfSeconds().toString(), len);
          previousField = 'c';
          break;
        case 'C':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getTotalHundredthsOfSeconds().toString(), len);
          previousField = 'c';
          break;
        case 'i':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getMilliseconds().toString(), len);
          previousField = 'i';
          break;
        case 'I':
          len = this.checkField(this.fmt, pos, patternChar);
          formattedValue += this.leftPadZeroes(ti.getTotalMilliseconds().toString(), len);
          previousField = 'i';
          break;
        case 'f':
          len = this.checkField(this.fmt, pos, patternChar);
          this.errorFunction(previousField, len);
          if (len <= 8) {
            // ugh. note that the 'F' code handles any leading
            // decimal separator differently...
            formattedValue += this.leftPadZeroes(ti.getFraction(previousField, len).toString(), len);
          }
          previousField = 'f';
          break;
        case 'F':
          len = this.checkField(this.fmt, pos, patternChar);
          const f: number = ti.getFraction(previousField, len);
          this.errorFunction(previousField, len);
          if (len <= 8 && f !== 0 && lastCharWasDecimal) {
            formattedValue += this.decimalSeparator;
          }
          if (len <= 8 && f !== 0) {
            formattedValue += this.leftPadZeroes(f.toString(), len);
          }
          lastCharWasDecimal = false;
          previousField = 'f';
          break;
        case ':':
          formattedValue += this.timeSeparator;
          len = 1;
          break;
        case '.':
          lastCharWasDecimal = false;
          // look ahead: do we see a field that says "do not
          // display fractions if it is zero"
          if (pos < (this.fmt.length - 1) && this.fmt.charAt(pos + 1) === 'F') {
            lastCharWasDecimal = true;
          } else {
            formattedValue += this.decimalSeparator;
          }
          len = 1;
          break;
        default:
          formattedValue += patternChar;
          len = 1;
          break;
      }
      pos += len;
    }
    return formattedValue;
  }
  private errorFunction(previousField: string, len: number): void {
    if (previousField === 't') {
      throw new Error('Fractional field cannot follow tenths');
    }
    if (previousField === 'c') {
      throw new Error('Fractional field cannot follow hundredths');
    }
    if (previousField === 'i') {
      throw new Error('Fractional field cannot follow milliseconds');
    }
    if (previousField === 'f') {
      throw new Error('Fractional field cannot follow fraction');
    }
    if (previousField === '') {
      throw new Error('Fractional field must follow something!');
    }
    if (len > 8) {
      throw new Error('Fractional field cannot be wider than 8');
    }
  }
  private checkField(format: string, pos: number, val: string): number {
    const len: number = format.length;
    let index: number = pos + 1;
    while ((index < len) && (format.charAt(index) === val)) {
      ++index;
    }
    return index - pos;
  }
  private isNotAString(s: string): boolean {
    return (s === null) || (s === undefined) || (typeof (s) !== 'string') || (s.length === 0);
  }
  private firstNonDigit(str: string): string {
    let s = '';
    if (str !== null) {
      for (const c of str) {
        if ((c < '0') || (c > '9')) {
          s = c;
          break;
        }
      }
    }
    return s;
  }
  private findTimeSeparator(locale: string): string {
    let s = '';
    const t: Date = new Date(1, 1, 1970, 8, 9, 10);
    try {
      s = t.toLocaleTimeString(locale);
    } catch (e) {
      try {
        s = t.toLocaleTimeString();
      } catch (ex) {
        s = '';
      }
    }
    return this.firstNonDigit(s);
  }
  private findDecimalSeparator(locale: string): string {
    let s = '';
    const n = 1.5;
    try {
      s = n.toLocaleString(locale);
    } catch (e) {
      try {
        s = n.toLocaleString();
      } catch (ex) {
        s = '';
      }
    }
    return this.firstNonDigit(s);
  }
  private isValidUnits(units: string): boolean {
    let isGood = false;
    if ((!isNullOrUndefined(units)) && typeof (units) === 'string') {
      switch (units) {
        case 'd':
        case 'h':
        case 'm':
        case 's':
        case 'ts':
        case 'hs':
        case 'ms':
          isGood = true;
          break;
        default:
          break;
      }
    }
    return isGood;
  }
  private leftPadZeroes(value: string, length: number): string {
    let result: string = value;
    while (result.length < length) {
      result = `0${result}`;
    }
    return result;
  }
}
