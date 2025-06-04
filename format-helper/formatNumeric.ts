// Whole-script strict mode syntax
/* jslint node: true */
import { isNullOrUndefined } from '@gms-flex/services-common';
/* eslint-disable-next-line @typescript-eslint/naming-convention */
import * as Long from 'long';

const twenty = 20;
const twoNumber = 2;

interface NumericFormatter {
  format(d: number | Long): string;
  getDecimalSeparator(): string;
  getGroupingSeparator(): string;
}

// this is the formatter we expect to use: relies on the
// standard internationalization class
class IntlFormatter implements NumericFormatter {
  private _decSep!: string;
  private _grpSep!: string;

  public constructor(private readonly locale: string, private readonly inf: Intl.NumberFormat) {
  }

  public format(n: number): string {
    return this.inf.format(n);
  }

  public getDecimalSeparator(): string {
    if (this._decSep === undefined) {
      this.findSeparators();
    }

    return this._decSep;
  }
  public getGroupingSeparator(): string {
    if (this._grpSep === undefined) {
      this.findSeparators();
    }

    return this._grpSep;
  }

  private findSeparators(): void {
    const n = 1234.56;
    const one = 1;
    const two = 2;
    const four = 4;
    const five = 5;

    let oneS: string;
    let twoS: string;
    let fourS: string;
    let fiveS: string;

    this._decSep = '.';
    this._grpSep = ',';

    try {
      const s: string = this.format(n);

      if (this.locale === null || this.locale === undefined) {
        oneS = one.toLocaleString();
        twoS = two.toLocaleString();
        fourS = four.toLocaleString();
        fiveS = five.toLocaleString();
      } else {
        oneS = one.toLocaleString(this.locale);
        twoS = two.toLocaleString(this.locale);
        fourS = four.toLocaleString(this.locale);
        fiveS = five.toLocaleString(this.locale);
      }

      const dec = `.*${fourS}(.*)${fiveS}.*`;
      const grp = `.*${oneS}(.*)${twoS}.*`;

      const decRegex = new RegExp(dec);
      const grpRegex = new RegExp(grp);

      this._decSep = s.replace(decRegex, '$1');
      this._grpSep = s.replace(grpRegex, '$1');
    } catch (e) {
      this._decSep = '.';
      this._grpSep = ',';
    }
  }
}

// we provide a primitive formatter when we are
// unable to use the internationalization class
class DefaultFormatter implements NumericFormatter {
  private _deciSep!: string;
  private _grpiSep!: string;
  private _zeroStr!: string;
  private readonly _options: Intl.NumberFormatOptions;
  private readonly _res: number;

  // a null/def resolution can fall through: when that
  // happens we take it as "do not care" - otherwise we
  // limit it 0 to 20
  public constructor(private readonly locale: string, grouping: boolean, res: number) {
    this._options = { useGrouping: grouping };
    this._res = res;
    if (!isNullOrUndefined(this._res)) {
      this._res = Math.min(20, Math.max(0, this._res));
    }
  }

  public getDecimalSeparator(): string {
    if (this._deciSep === undefined) {
      this.findSeparators();
    }

    return this._deciSep;
  }

  public getGroupingSeparator(): string {
    if (this._grpiSep === undefined) {
      this.findSeparators();
    }

    return this._grpiSep;
  }

  public format(n: number): string {
    let s;
    try {
      s = this.setLocaleString(n);
      if (this._deciSep !== null) {
        const pieces: string[] = s.split(this._deciSep);
        if (pieces.length === 1) {
          // no fractional part in the incoming numeric value
          s = this.noFractionalPart(s);
        } else if (pieces.length === twoNumber) {
          // number has fractional part
          let f: string = pieces[1];
          let sep: string = this._deciSep;
          if (!isNullOrUndefined(this._res)) {
            // user provided a resolution
            if (this._res === 0) {
              // user said no fractional part, we also skip sep
              f = '';
              sep = '';
            } else if (f.length > this._res) {
              f = f.substring(0, this._res);
            } else if (f.length < this._res) {
              f = this.padZeroes(f, this._res - f.length);
            }
          }
          s = pieces[0] + sep + f;
        }
      }
    } catch (e) {
      s = n.toLocaleString([], this._options);
    }

    return s;
  }

  private setLocaleString(n: number): string {
    if (!isNullOrUndefined(this.locale)) {
      return n.toLocaleString(this.locale, this._options);
    }
    return n.toLocaleString([], this._options);
  }

  private noFractionalPart(s: string): string {
    let temp: string = s;
    // no fractional part in the incoming numeric value
    if (!isNullOrUndefined(this._res)) {
      // tweak: only append dec sep when res is gt zero
      if (this._res > 0) {
        temp += this._deciSep;
        temp = this.padZeroes(temp, this._res);
        return temp;
      }
      return temp;
    }
    return temp;
  }

  private padZeroes(value: string, numZeroes: number): string {
    if (this._zeroStr === undefined) {
      this.findSeparators();
    }

    let result: string = value;
    for (let i = 0; i < numZeroes; ++i) {
      result += this._zeroStr;
    }

    return result;
  }

  private findSeparators(): void {
    const n = 1234.56;
    const z = 0;
    const one = 1;
    const two = 2;
    const four = 4;
    const five = 5;

    let s: string;
    let oneS: string;
    let twoS: string;
    let fourS: string;
    let fiveS: string;

    this._deciSep = '.';
    this._grpiSep = ',';

    // note: we force grouping true here so we can see the separator
    const ops: Intl.NumberFormatOptions = { useGrouping: true };

    try {
      if (this.locale === null || this.locale === undefined) {
        this._zeroStr = z.toLocaleString();
        s = n.toLocaleString([], ops);
        oneS = one.toLocaleString();
        twoS = two.toLocaleString();
        fourS = four.toLocaleString();
        fiveS = five.toLocaleString();
      } else {
        this._zeroStr = z.toLocaleString(this.locale);
        s = n.toLocaleString(this.locale, ops);
        oneS = one.toLocaleString(this.locale);
        twoS = two.toLocaleString(this.locale);
        fourS = four.toLocaleString(this.locale);
        fiveS = five.toLocaleString(this.locale);
      }

      const dec = `.*${fourS}(.*)${fiveS}.*`;
      const grp = `.*${oneS}(.*)${twoS}.*`;

      const decRegex = new RegExp(dec);
      const grpRegex = new RegExp(grp);

      this._deciSep = s.replace(decRegex, '$1');
      this._grpiSep = s.replace(grpRegex, '$1');
    } catch (e) {
      this._deciSep = '.';
      this._grpiSep = ',';
    }
  }
}

export interface FormatLocaleResGroupingInterface {
  locale: string;
  res: number;
  grouping?: boolean;
  eu?: string;
}

export class FormatNumeric {
  private readonly _nf: NumericFormatter;
  private readonly _grouping: boolean | undefined;
  /*
   * Constructor
   * @param {String} locale - the locale used to determine something
   * @param {number} res - the number of digits to the right of the decimal separator
   * @param {Boolean} grouping - optional argument controlling character used to group numeric values
   */
  public constructor(numericVar: FormatLocaleResGroupingInterface) {
    this._grouping = this.isNotBoolean(numericVar.grouping) ? true : numericVar.grouping;
    this._nf = this.getNumericFormatter(numericVar.locale, numericVar.res, this._grouping!);
  }
  /**
   * @name format
   * @summary Format a numeric value
   *
   * @description
   * Format a numeric value per the locale, resolution, and optional grouping
   * passed into the class constructor.
   *
   * @param n - the numeric value to format
   * @returns the formatted value
   *
   * @example
   * // resolution is 2, true means display grouping character (,)
   * let fn: FormatNumeric = new FormatNumeric("en", 2, true);
   * let result: string = fn.format(123456.783);
   * // result is "123,456.78"
   */
  public format(n: number | Long): string {
    if (this.isNotNumeric(n)) {
      throw new Error('Format argument must be a number');
    } else if (typeof n === 'number') {
      return this.formatNumber(n);
    } else {
      return this.formatLong(n);
    }
  }

  private formatNumber(n: number): string {
    return this._nf.format(n);
  }

  private formatLong(bigint: Long): string {
    if (this._grouping) {
      return bigint.toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.groupingSeparator);
    } else {
      return bigint.toString();
    }
  }

  /**
   * @prop {string} decimalSeparator
   *  The decimal separator for the locale provided in the constructor.
   */
  public get decimalSeparator(): string {
    return this._nf.getDecimalSeparator();
  }

  /**
   * @prop {string} groupingSeparator
   *  The separator used for numeric grouping for the locale provided in the constructor.
   */
  public get groupingSeparator(): string {
    return this._nf.getGroupingSeparator();
  }

  private isNotNumeric(n: number | Long): boolean {
    return (n === undefined) || (n === null) || ((typeof (n) !== 'number') && (!Long.isLong(n)));
  }

  private isNotBoolean(b: boolean | undefined): boolean {
    return (b === undefined) || (b === null) || (typeof (b) !== 'boolean');
  }

  private getNumericFormatter(locale: string, res: number, grouping: boolean): NumericFormatter {
    let r: NumericFormatter;
    let o: Intl.NumberFormatOptions;
    if (this.isNotNumeric(res) || isNaN(res)) {
      o = { useGrouping: grouping };
    } else {
      const t: number = Math.min(twenty, Math.max(0, res));
      o = { useGrouping: grouping, minimumFractionDigits: t, maximumFractionDigits: t };
    }

    try {
      r = new IntlFormatter(locale, Intl.NumberFormat(locale, o));
    } catch (e1) {
      try {
        r = new IntlFormatter(undefined!, Intl.NumberFormat(undefined, o));
      } catch (e2) {
        r = new DefaultFormatter(locale, grouping, res);
      }
    }
    return r;
  }
}
