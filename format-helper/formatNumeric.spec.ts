// Whole-script strict mode syntax
/* jslint node: true */
'use strict';

const formatNum = '-9223372036854775808';
import { FormatLocaleResGroupingInterface } from 'dist/@gms-flex/controls/controls/format-helper/formatNumeric';
/* eslint-disable-next-line @typescript-eslint/naming-convention */
import * as Long from 'long';

import { FormatNumeric } from './formatNumeric';

// const Long: any = require("long");
const formatWithKnownValues = (n: number, locale: string, grp: boolean, res: number): string => {
  let o: Intl.NumberFormatOptions;
  let inf: Intl.NumberFormat;
  let g: boolean;

  if (grp === null || grp === undefined) {
    g = true; // this is the default in the format helper class
  } else {
    g = grp;
  }

  if (res === null || res === undefined) {
    o = { useGrouping: g };
  } else {
    // here we enforce the same limits as the format helper
    const r: number = Math.min(20, Math.max(res, 0));
    o = { useGrouping: g, minimumFractionDigits: r, maximumFractionDigits: r };
  }

  if (locale === null || locale === undefined) {
    inf = new Intl.NumberFormat([], o);
  } else {
    inf = new Intl.NumberFormat(locale, o);
  }

  return inf.format(n);
};

// for now, these mimic what the actual code does - but should do
// something different.
// note that the reason that we dynamically determine what the
// expected separators are is because the user may customize the
// computer regional settings.

const guessDecimalSeparator = (locale: string): string => {
  const n = 1234.56;
  const four = 4;
  const five = 5;

  let s: string;
  let fourS: string;
  let fiveS: string;

  if (locale === null || locale === undefined) {
    s = n.toLocaleString();
    fourS = four.toLocaleString();
    fiveS = five.toLocaleString();
  } else {
    s = n.toLocaleString(locale);
    fourS = four.toLocaleString(locale);
    fiveS = five.toLocaleString(locale);
  }

  const dec: any = '.*' + fourS + '(.*)' + fiveS + '.*';

  return s.replace(new RegExp(dec), '$1');
};

const guessGroupSeparator = (locale: string): string => {
  const n = 1234.56;
  const one = 1;
  const two = 2;

  let s: string;
  let oneS: string;
  let twoS: string;

  if (locale === null || locale === undefined) {
    s = n.toLocaleString();
    oneS = one.toLocaleString();
    twoS = two.toLocaleString();
  } else {
    s = n.toLocaleString(locale);
    oneS = one.toLocaleString(locale);
    twoS = two.toLocaleString(locale);
  }

  const grp: any = '.*' + oneS + '(.*)' + twoS + '.*';

  return s.replace(new RegExp(grp), '$1');
};

describe('Formatting Numeric', () => {

  // timing test for instantiating a bunch of FormatNumeric instances
  // it('Instantiate 100k numeric formatters', () => {
  //   const start = new Date().getTime();

  //   for (let count = 0; count < 100000; count++) {
  //     const fn: FormatNumeric = new FormatNumeric('en', 3);
  //   }

  //   const elapsed = new Date().getTime() - start;

  //   // console.log('100k FormatNumeric instances in ', elapsed / 1000);

  //   expect(elapsed / 1000).toBeLessThan(3);
  // });

  // simple case with only decimal separator

  it('Numeric: small value Resolution: 3 Locale: EN Grouping: default', () => {
    const test = {
      locale: 'en',
      res: 3
    };
    const fn: FormatNumeric = new FormatNumeric(test);
    const res: string = fn.format(123.45678);
    expect(res).toBe('123.457');
  });
  it('Numeric: small value Resolution: 3 Locale: DE Grouping: default', () => {
    const test1 = {
      locale: 'de',
      res: 3
    };
    const fn: FormatNumeric = new FormatNumeric(test1);
    const res: string = fn.format(123.45678);
    expect(res).toBe('123,457');
  });

  // simple case with padding on right
  it('Numeric: value requiring padding Resolution: 3 Locale: EN Grouping: default', () => {
    const test = {
      locale: 'en',
      res: 3
    };
    const n = 123.4;
    const exp: string = formatWithKnownValues(n, test.locale, true, test.res);
    const fn: FormatNumeric = new FormatNumeric(test);
    const r: string = fn.format(n);
    expect(r).toBe(exp);
  });
  it('Numeric: value requiring padding Resolution: 3 Locale: DE Grouping: default', () => {
    const test1 = {
      locale: 'de',
      res: 3
    };
    const n = 123.4;
    const exp: string = formatWithKnownValues(n, test1.locale, true, test1.res);
    const fn: FormatNumeric = new FormatNumeric(test1);
    const r: string = fn.format(n);
    expect(r).toBe(exp);
  });

  // integer value
  it('Numeric: integer requiring padding Resolution: 3 Locale: EN Grouping: default', () => {
    const test = {
      locale: 'en',
      res: 3
    };
    const n = 123;
    const exp: string = formatWithKnownValues(n, test.locale, true, test.res);
    const fn: FormatNumeric = new FormatNumeric(test);
    const r: string = fn.format(n);
    expect(r).toBe(exp);
  });
  it('Numeric: integer requiring padding Resolution: 3 Locale: DE Grouping: default', () => {
    const test1 = {
      locale: 'de',
      res: 3
    };
    const n = 123;
    const exp: string = formatWithKnownValues(n, test1.locale, true, test1.res);
    const fn: FormatNumeric = new FormatNumeric(test1);
    const r: string = fn.format(n);
    expect(r).toBe(exp);
  });

  // large value with grouping symbol
  it('Numeric: large value Resolution: 2 Locale: EN Grouping: default', () => {
    const test2 = {
      locale: 'en',
      res: 2
    };
    const n = 12345678.98765;
    const exp: string = formatWithKnownValues(n, test2.locale, true, test2.res);
    const fn: FormatNumeric = new FormatNumeric(test2);
    const r: string = fn.format(n);
    expect(r).toBe(exp);
  });
  it('Numeric: large value Resolution: 2 Locale: DE Grouping: default', () => {
    const test3 = {
      locale: 'de',
      res: 2
    };
    const n = 12345678.98765;
    const exp: string = formatWithKnownValues(n, test3.locale, true, test3.res);
    const fn: FormatNumeric = new FormatNumeric(test3);
    const r: string = fn.format(12345678.98765);
    expect(r).toBe(exp);
  });

  // large value without grouping symbol
  it('Numeric: large value Resolution: 2 Locale: EN Grouping: false', () => {
    const test4 = {
      locale: 'en',
      res: 2,
      grouping: false
    };
    const n = 12345678.98765;
    const exp: string = formatWithKnownValues(n, test4.locale, test4.grouping, test4.res);
    const fn: FormatNumeric = new FormatNumeric(test4);
    const r: string = fn.format(n);
    expect(r).toBe(exp);
  });
  it('Numeric: large value Resolution: 2 Locale: DE Grouping: false', () => {
    const test5 = {
      locale: 'de',
      res: 2,
      grouping: false
    };
    const n = 12345678.98765;
    const exp: string = formatWithKnownValues(n, test5.locale, test5.grouping, test5.res);
    const fn: FormatNumeric = new FormatNumeric(test5);
    const r: string = fn.format(n);
    expect(r).toBe(exp);
  });

  // large value, no grouping symbol and large resolution
  it('Numeric: large value Resolution: 25 Locale: EN Grouping: false', () => {
    const test6 = {
      locale: 'en',
      res: 25,
      grouping: false
    };
    const n = 12345678.98765;
    const exp: string = formatWithKnownValues(n, test6.locale, test6.grouping, test6.res);
    const fn: FormatNumeric = new FormatNumeric(test6);
    const r: string = fn.format(n);
    expect(r).toBe(exp);
  });
  it('Numeric: large value Resolution: 25 Locale: DE Grouping: false', () => {
    const test7 = {
      locale: 'de',
      res: 25,
      grouping: false
    };
    const n = 12345678.98765;
    const exp: string = formatWithKnownValues(n, test7.locale, test7.grouping, test7.res);
    const fn: FormatNumeric = new FormatNumeric(test7);
    const r: string = fn.format(n);
    expect(r).toBe(exp);
  });

  // large value (large fraction): no grouping symbol, negative resolution
  it('Numeric: large (large fraction) Resolution: -2 Locale: EN Grouping: false', () => {
    const test8 = {
      locale: 'en',
      res: -2,
      grouping: false
    };
    const fn: FormatNumeric = new FormatNumeric(test8);
    const res: string = fn.format(12345678.987);
    expect(res).toBe('12345679');
  });
  it('Numeric: large (large fraction) Resolution: -2 Locale: DE Grouping: false', () => {
    const test9 = {
      locale: 'de',
      res: -2,
      grouping: false
    };
    const fn: FormatNumeric = new FormatNumeric(test9);
    const res: string = fn.format(12345678.987);
    expect(res).toBe('12345679');
  });

  // large value (small fraction): no grouping symbol, negative resolution
  it('Numeric: large (small fraction) Resolution: -2 Locale: EN Grouping: false', () => {
    const test8 = {
      locale: 'en',
      res: -2,
      grouping: false
    };
    const fn: FormatNumeric = new FormatNumeric(test8);
    const res: string = fn.format(12345678.387);
    expect(res).toBe('12345678');
  });
  it('Numeric: large (small fraction) Resolution: -2 Locale: DE Grouping: false', () => {
    const test9 = {
      locale: 'de',
      res: -2,
      grouping: false
    };
    const fn: FormatNumeric = new FormatNumeric(test9);
    const res: string = fn.format(12345678.387);
    expect(res).toBe('12345678');
  });

  // very small number
  it('Numeric: really small value Resolution: 3 Locale: EN Grouping: default', () => {
    const test2 = {
      locale: 'en',
      res: 2
    };
    const fn: FormatNumeric = new FormatNumeric(test2);
    const res: string = fn.format(0.00001);
    expect(fn.decimalSeparator).toBe('.');
    expect(res).toBe('0.00');
  });
  it('Numeric: really small value Resolution: 3 Locale: DE Grouping: default', () => {
    const test10 = {
      locale: 'DE',
      res: 2
    };
    const fn: FormatNumeric = new FormatNumeric(test10);
    const res: string = fn.format(0.00001);
    expect(fn.decimalSeparator).toBe(',');
    expect(res).toBe('0,00');
  });

  // invalid argument values for grouping: defaults to 'true'
  it('Numeric: large value Resolution: 2 Locale: EN Grouping: null', () => {
    const test11 = {
      locale: 'en',
      res: 2,
      grouping: null
    };
    const n = 12345678.98765;
    const exp: string = formatWithKnownValues(n, test11.locale, true, test11.res);
    const fn: FormatNumeric = new FormatNumeric(test11 as unknown as FormatLocaleResGroupingInterface);
    const r: string = fn.format(n);
    expect(r).toBe(exp);
  });
  it('Numeric: large value Resolution: 2 Locale: EN Grouping: undefined', () => {
    const test12 = {
      locale: 'en',
      res: 2,
      grouping: undefined
    };
    const n = 12345678.98765;
    const exp: string = formatWithKnownValues(n, test12.locale, true, test12.res);
    const fn: FormatNumeric = new FormatNumeric(test12);
    const r: string = fn.format(n);
    expect(r).toBe(exp);
  });

  // unknown locale: note that we only do minimal checking on the result
  it('Numeric: something Resolution: 2 Locale: null Grouping: default', () => {
    const test13 = {
      locale: null,
      res: 2
    };
    const n = 123.45;
    const exp: string = formatWithKnownValues(n, test13.locale!, true, test13.res);
    const fn: FormatNumeric = new FormatNumeric(test13 as unknown as FormatLocaleResGroupingInterface);
    const r: string = fn.format(n);
    expect(r).toContain(exp);
  });
  it('Numeric: something Resolution: 2 Locale: undefined Grouping: default', () => {
    const test14 = {
      locale: undefined,
      res: 2
    };
    const n = 123.45;
    const exp: string = formatWithKnownValues(n, test14.locale!, true, test14.res);
    const fn: FormatNumeric = new FormatNumeric(test14 as unknown as FormatLocaleResGroupingInterface);
    const r: string = fn.format(n);
    expect(r).toContain(exp);
  });
  it('Numeric: something Resolution: 2 Locale: XYZ Grouping: default', () => {
    const test15 = {
      locale: 'XYZ',
      res: 2
    };
    const n = 123.45;
    const exp: string = formatWithKnownValues(n, test15.locale, true, test15.res);
    const fn: FormatNumeric = new FormatNumeric(test15);
    const r: string = fn.format(123.45);
    expect(r).toContain(exp);
  });
  it('Numeric: Resolution: undefined Locale: EN Grouping: true', () => {
    const test16 = {
      locale: 'en',
      res: undefined,
      grouping: true
    };
    const n = 1234.56;
    const expected: string = n.toLocaleString(test16.locale, { useGrouping: test16.grouping });
    const fn: FormatNumeric = new FormatNumeric(test16 as unknown as FormatLocaleResGroupingInterface);
    const res: string = fn.format(n);
    expect(res).toContain(expected);
  });
  it('Numeric: Resolution: undefined Locale: EN Grouping: false', () => {
    const test17 = {
      locale: 'en',
      res: undefined,
      grouping: false
    };
    const n = 1234.56;
    const expected: string = n.toLocaleString(test17.locale, { useGrouping: test17.grouping });
    const fn: FormatNumeric = new FormatNumeric(test17 as unknown as FormatLocaleResGroupingInterface);
    const res: string = fn.format(n);
    expect(res).toContain(expected);
  });
  it('Numeric: Resolution: undefined Locale: EN Grouping: undefined', () => {
    const test18 = {
      locale: 'en',
      res: undefined,
      grouping: undefined
    };
    const n = 1234.56;
    const grouping = true;
    const expected: string = n.toLocaleString(test18.locale, { useGrouping: grouping });
    const fn: FormatNumeric = new FormatNumeric(test18 as unknown as FormatLocaleResGroupingInterface);
    const res: string = fn.format(n);
    expect(res).toContain(expected);
  });
  it('Numeric: Resolution: undefined Locale: undefined Grouping: undefined', () => {
    const test19 = {
      locale: undefined,
      res: undefined,
      grouping: undefined
    };
    const n = 1234.56;
    const grouping = true;
    const expected: string = n.toLocaleString([], { useGrouping: grouping });
    const fn: FormatNumeric = new FormatNumeric(test19 as unknown as FormatLocaleResGroupingInterface);
    const res: string = fn.format(n);
    expect(res).toContain(expected);
  });
  it('Numeric: Resolution: null Locale: null Grouping: null', () => {
    const test20 = {
      locale: null,
      res: null,
      grouping: null
    };
    const n = 1234.56;
    const grouping = true;
    const expected: string = n.toLocaleString([], { useGrouping: grouping });
    const fn: FormatNumeric = new FormatNumeric(test20 as unknown as FormatLocaleResGroupingInterface);
    const res: string = fn.format(n);
    expect(res).toContain(expected);
  });
  it('Numeric: Resolution: null Locale: null Grouping: default', () => {
    const test21 = {
      locale: '',
      res: null
    };
    const n = 1234.56;
    const grouping = true;
    const expected: string = n.toLocaleString([], { useGrouping: grouping });
    const fn: FormatNumeric = new FormatNumeric(test21 as unknown as FormatLocaleResGroupingInterface);
    const res: string = fn.format(n);
    expect(res).toContain(expected);
  });

  // decimal separators
  it('Numeric: Locale: EN (EN decimal separator is expected)', () => {
    const test22 = {
      locale: 'en',
      res: 2
    };
    const sep: string = guessDecimalSeparator(test22.locale);
    const fn: FormatNumeric = new FormatNumeric(test22);
    expect(fn.decimalSeparator).toBe(sep);
  });
  it('Numeric: Locale: DE (DE decimal separator is expected)', () => {
    const test23 = {
      locale: 'de',
      res: 2
    };
    const sep: string = guessDecimalSeparator(test23.locale);
    const fn: FormatNumeric = new FormatNumeric(test23);
    expect(fn.decimalSeparator).toBe(sep);
  });
  it('Numeric: Locale: CH (CH decimal separator is expected)', () => {
    const test24 = {
      locale: 'ch',
      res: 2
    };
    const sep: string = guessDecimalSeparator(test24.locale);
    const fn: FormatNumeric = new FormatNumeric(test24);
    expect(fn.decimalSeparator).toBe(sep);
  });
  it('Numeric: Locale: ar-SA (ar-SA decimal separator is expected)', () => {
    const test25 = {
      locale: 'ar-SA',
      res: 2
    };
    const sep: string = guessDecimalSeparator(test25.locale);
    const fn: FormatNumeric = new FormatNumeric(test25);
    expect(fn.decimalSeparator).toBe(sep);
  });
  it('Numeric: Locale: null (default decimal separator is expected)', () => {
    const test26 = {
      locale: null,
      res: 2
    };
    const sep: string = guessDecimalSeparator(test26.locale!);
    const fn: FormatNumeric = new FormatNumeric(test26 as unknown as FormatLocaleResGroupingInterface);
    expect(fn.decimalSeparator).toBe(sep);
  });

  // grouping separators
  it('Numeric: Locale: EN (EN grouping separator is expected)', () => {
    const test27 = {
      locale: 'en',
      res: 2
    };
    const sep: string = guessGroupSeparator(test27.locale);
    const fn: FormatNumeric = new FormatNumeric(test27);
    expect(fn.groupingSeparator).toBe(sep);
  });
  it('Numeric: Locale: DE (DE grouping separator is expected)', () => {
    const test28 = {
      locale: 'de',
      res: 2
    };
    const sep: string = guessGroupSeparator(test28.locale);
    const fn: FormatNumeric = new FormatNumeric(test28);
    expect(fn.groupingSeparator).toBe(sep);
  });
  it('Numeric: Locale: CH (CH grouping separator is expected)', () => {
    const test29 = {
      locale: 'ch',
      res: 2
    };
    const sep: string = guessGroupSeparator(test29.locale);
    const fn: FormatNumeric = new FormatNumeric(test29);
    expect(fn.groupingSeparator).toBe(sep);
  });
  it('Numeric: Locale: ar-SA (ar-SA grouping separator is expected)', () => {
    const test30 = {
      locale: 'ar-SA',
      res: 2
    };
    const sep: string = guessGroupSeparator(test30.locale);
    const fn: FormatNumeric = new FormatNumeric(test30);
    expect(fn.groupingSeparator).toBe(sep);
  });
  it('Numeric: Locale: null (default grouping separator is expected)', () => {
    const test31 = {
      locale: null,
      res: 2
    };
    const sep: string = guessGroupSeparator(test31.locale!);
    const fn: FormatNumeric = new FormatNumeric(test31 as unknown as FormatLocaleResGroupingInterface);
    expect(fn.groupingSeparator).toBe(sep);
  });

  // invalid format arguments
  it('Numeric: undefined Resolution: Locale: EN Grouping: default', () => {
    const test32 = {
      locale: 'en',
      res: 2
    };
    const fn: FormatNumeric = new FormatNumeric(test32);
    expect(() => fn.format(undefined!)).toThrow();
  });
  it('Numeric: null Resolution: Locale: EN Grouping: default', () => {
    const test33 = {
      locale: 'en',
      res: 2
    };
    const fn: FormatNumeric = new FormatNumeric(test33);
    expect(() => fn.format(null!)).toThrow();
  });

  // long unsigned value default grouping symbol
  it('Long: unsigned value Locale: EN Grouping: default', () => {
    const test34 = {
      locale: 'en',
      res: 0
    };
    const bigint: Long = Long.fromString('18446744073709551615', true);
    const fn: FormatNumeric = new FormatNumeric(test34);
    const r: string = fn.format(bigint);
    expect(r).toBe('18,446,744,073,709,551,615');
  });
  it('Long: unsigned value Locale: DE Grouping: default', () => {
    const test35 = {
      locale: 'de',
      res: 0
    };
    const bigint: Long = Long.fromString('18446744073709551615', true);
    const fn: FormatNumeric = new FormatNumeric(test35);
    const r: string = fn.format(bigint);
    expect(r).toBe('18.446.744.073.709.551.615');
  });

  // long unsigned value without grouping symbol
  it('Long: unsigned value Locale: EN Grouping: false', () => {
    const test36 = {
      locale: 'en',
      res: 0,
      grouping: false
    };
    const bigint: Long = Long.fromString('18446744073709551615', true);
    const fn: FormatNumeric = new FormatNumeric(test36);
    const r: string = fn.format(bigint);
    expect(r).toBe('18446744073709551615');
  });
  it('Long: unsigned value Locale: DE Grouping: false', () => {
    const test37 = {
      locale: 'de',
      res: 0,
      grouping: false
    };
    const bigint: Long = Long.fromString('18446744073709551615', true);
    const fn: FormatNumeric = new FormatNumeric(test37);
    const r: string = fn.format(bigint);
    expect(r).toBe('18446744073709551615');
  });

  // long unsigned value with grouping symbol
  it('Long: unsigned value Locale: EN Grouping: true', () => {
    const test38 = {
      locale: 'en',
      res: 0,
      grouping: true
    };
    const bigint: Long = Long.fromString('18446744073709551615', true);
    const fn: FormatNumeric = new FormatNumeric(test38);
    const r: string = fn.format(bigint);
    expect(r).toBe('18,446,744,073,709,551,615');
  });
  it('Long: unsigned value Locale: DE Grouping: true', () => {
    const test39 = {
      locale: 'de',
      res: 0,
      grouping: true
    };
    const bigint: Long = Long.fromString('18446744073709551615', true);
    const fn: FormatNumeric = new FormatNumeric(test39);
    const r: string = fn.format(bigint);
    expect(r).toBe('18.446.744.073.709.551.615');
  });

  // long signed value with default grouping symbol
  it('Long: signed value Locale: EN Grouping: default', () => {
    const test40 = {
      locale: 'en',
      res: 0
    };
    const bigint: Long = Long.fromString(formatNum, false);
    const fn: FormatNumeric = new FormatNumeric(test40);
    const r: string = fn.format(bigint);
    expect(r).toBe('-9,223,372,036,854,775,808');
  });
  it('Long: signed value Locale: DE Grouping: default', () => {
    const test41 = {
      locale: 'de',
      res: 0
    };
    const bigint: Long = Long.fromString(formatNum, false);
    const fn: FormatNumeric = new FormatNumeric(test41);
    const r: string = fn.format(bigint);
    expect(r).toBe('-9.223.372.036.854.775.808');
  });

  // long signed value without grouping symbol
  it('Long: signed value Locale: EN Grouping: false', () => {
    const test42 = {
      locale: 'en',
      res: 0,
      grouping: false
    };
    const bigint: Long = Long.fromString(formatNum, false);
    const fn: FormatNumeric = new FormatNumeric(test42);
    const r: string = fn.format(bigint);
    expect(r).toBe(formatNum);
  });
  it('Long: signed value Locale: DE Grouping: false', () => {
    const test43 = {
      locale: 'de',
      res: 0,
      grouping: false
    };
    const bigint: Long = Long.fromString(formatNum, false);
    const fn: FormatNumeric = new FormatNumeric(test43);
    const r: string = fn.format(bigint);
    expect(r).toBe(formatNum);
  });

  // long signed value with grouping symbol
  it('Long: signed value Locale: EN Grouping: true', () => {
    const test44 = {
      locale: 'en',
      res: 0,
      grouping: true
    };
    const bigint: Long = Long.fromString(formatNum, false);
    const fn: FormatNumeric = new FormatNumeric(test44);
    const r: string = fn.format(bigint);
    expect(r).toBe('-9,223,372,036,854,775,808');
  });
  it('Long: signed value Locale: DE Grouping: true', () => {
    const test45 = {
      locale: 'de',
      res: 0,
      grouping: true
    };
    const bigint: Long = Long.fromString(formatNum, false);
    const fn: FormatNumeric = new FormatNumeric(test45);
    const r: string = fn.format(bigint);
    expect(r).toBe('-9.223.372.036.854.775.808');
  });

  // long small numbers, no separators expected
  it('Long: small signed value Locale: EN Grouping: true', () => {
    const test46 = {
      locale: 'en',
      res: 0,
      grouping: true
    };
    const bigint: Long = Long.fromString('123', false);
    const fn: FormatNumeric = new FormatNumeric(test46);
    const r: string = fn.format(bigint);
    expect(r).toBe('123');
  });
  it('Long: small signed value Locale: EN Grouping: true', () => {
    const test47 = {
      locale: 'en',
      res: 0,
      grouping: true
    };
    const bigint: Long = Long.fromString('-123', false);
    const fn: FormatNumeric = new FormatNumeric(test47);
    const r: string = fn.format(bigint);
    expect(r).toBe('-123');
  });
});
