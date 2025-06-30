import { FormatNumeric } from '@gms-flex/controls';
import { parseLong } from '@gms-flex/snapin-common';
import Long from 'long';
export interface paramFormatNumeric {
  locale: string;
  res: number;
  grouping?: boolean;
}
export class FormatHelper {

    public static int32Min: number = -2147483648;
    public static int32Max: number = 2147483647;
    public static uint32Min: number = 0;
    public static uint32Max: number = 4294967295;

    public static int64Min: Long = Long.MIN_VALUE;
    public static int64Max: Long = Long.MAX_VALUE;
    public static uint64Min: Long = Long.UZERO;
    public static uint64Max: Long = Long.MAX_UNSIGNED_VALUE;

    public static enUS: string = 'en-US';
    // key - locale, value - [DecimalSeparator, GrouppingSeparator]
    public static Separators: Map<string, [string, string]> = new Map<string, [string, string]>();
    /**
     * Provides a help for deserialization which expected all strings value serialized with "en-US"
     * @param str input string to be processed and converted to float number
     */
    public static StringToNumber(str: string): number {
        if (str === undefined) {
            return undefined;
        }
        try {
            str = str.split(',').join('.');
        }
        catch {
            // log error
        }
        return Number(str);
    }

    private static getSeparators(localeValue: string): [string, string] {
        if (localeValue === undefined) {
            localeValue = FormatHelper.enUS;
        }
        let values: [string, string];
        if (FormatHelper.Separators.has(localeValue)) {
            values = FormatHelper.Separators.get(localeValue);
        }
        else {
          const paramsFormatNumb: paramFormatNumeric = {
            locale: localeValue,
            res: 2,
            grouping: true
          };
            const formatNumeric: FormatNumeric = new FormatNumeric(paramsFormatNumb);
            values = [formatNumeric.decimalSeparator, formatNumeric.groupingSeparator];
            FormatHelper.Separators.set(localeValue, values);
        }
        return values;
    }

    public static getDecimalSeparator(locale: string): string {
        const values = FormatHelper.getSeparators(locale);
        return values[0];
    }

    public static getGroupingSeparator(locale: string): string {
        const values = FormatHelper.getSeparators(locale);
        return values[1];
    }

    public static getNumberfromString(str: string, locale: string): number {
        let result: number = Number.NaN;
        if (str !== undefined) {
            if (locale === undefined) {
                locale = FormatHelper.enUS;
            }

            const t: string = FormatHelper.Replace(str, FormatHelper.getGroupingSeparator(locale));
            const t2: string = FormatHelper.Replace(t, FormatHelper.getDecimalSeparator(locale), FormatHelper.getDecimalSeparator(FormatHelper.enUS));
            result = parseFloat(t2);
        }
        return result;
    }

    public static reFormatValue(value: string, locale: string, defaultLocale: string, precision: number): string {
        let result: string;
        if (value !== undefined) {
            if (value.indexOf('E') > 0 || value.indexOf('e') > 0) {
                const v: number = parseFloat(value);
                value = FormatHelper.NumberToString(v, locale, defaultLocale, precision);
            }
            result = FormatHelper.Replace(value, FormatHelper.getGroupingSeparator(locale));
        }
        return result;
    }

    public static Replace(str: any, remove: string, insert: string = ''): string {
        let result: string = str.toString();
        try {
            if (result.includes(remove)) {
                result = result.split(remove).join(insert);
            }
        }
        catch
        {
            // log
        }
        return result;
    }

    // Using Intl library to format numbers in the given locale
    public static NumberToString(num: number, locale: string, defaultLocale: string, resolution: number, minResolution: number = undefined): string {
        if (Number.isNaN(num)) {
            return undefined;
        }
        if (locale === null) {
            locale = FormatHelper.enUS;
        }
        if (defaultLocale === null) {
            defaultLocale = FormatHelper.enUS;
        }
        if (minResolution === undefined) {
            minResolution = resolution;
        }

        let numberFormat: Intl.NumberFormat;
        // See BTQ-319979 details on avoiding Intl.NumberFormat exception
        // 1. Avoid PXM50 device (running Chromium) exception.
        // For some reason the getBrowserLang() method
        // on this device returns a language tag string of “C”.
        try {
            numberFormat = new Intl.NumberFormat(locale, {
                minimumFractionDigits: minResolution,
                maximumFractionDigits: resolution
            });
        }
        catch {
            numberFormat = undefined;
        }
        // 2. Avoid generic exception
        try {
            if (numberFormat === undefined) {
                numberFormat = new Intl.NumberFormat(defaultLocale, {
                    minimumFractionDigits: resolution,
                    maximumFractionDigits: resolution
                });
            }
        }
        catch {
            numberFormat = undefined;
        }
        // 3. fallback to using Number.toString(10) to format the value
        return numberFormat !== undefined ? numberFormat.format(num) : num.toString(10);
    }

    // Check if maxPrecision has to be updated,
    // so the displayed value will be updated when up/down buttons clicked.
    public static calculatePrecision(maxPrecision: number, changeValue: number): number {
        const minChangedValue = Math.pow(10, 0 - maxPrecision);
        if (changeValue >= minChangedValue) {
            // changing displayed value by changeValue will always updates the displayed value.
            return maxPrecision;
        }

        // find min precision of the changeValue
        let multiplier: number = Math.pow(10, maxPrecision);
        while (maxPrecision < 6) {
            const roundedValue: number = Math.round(changeValue * multiplier);
            if (roundedValue > 0) {
                break;
            }

            multiplier = 10 * multiplier;
            maxPrecision = maxPrecision + 1;
        }

        return maxPrecision;
    }

    public static calculateLongValueRange(minValue: any, maxValue: any, isUnsignedType: boolean): [Long, Long] {
        let maxValueLong: Long;
        let minValueLong: Long;
        if (maxValue === undefined) {
            maxValueLong = isUnsignedType ? FormatHelper.uint64Max : FormatHelper.int64Max;
        }
        else {
            maxValueLong = FormatHelper.coerceLongValue(FormatHelper.parseLongValue(maxValue, isUnsignedType),
                isUnsignedType ? FormatHelper.uint64Min : FormatHelper.int64Min,
                isUnsignedType ? FormatHelper.uint64Max : FormatHelper.int64Max, true);
        }
        if (minValueLong === undefined) {
            minValueLong = isUnsignedType ? FormatHelper.uint64Min : FormatHelper.int64Min;
        }
        else {
            minValueLong = FormatHelper.coerceLongValue(FormatHelper.parseLongValue(minValue, isUnsignedType),
                isUnsignedType ? FormatHelper.uint64Min : FormatHelper.int64Min, maxValueLong, false);
        }
        return [minValueLong, maxValueLong];
    }

    public static parseLongValue(value: any, isUnsignedType: boolean, locale: string = undefined): Long {
        if (locale === undefined) {
            locale = FormatHelper.enUS;
        }
        const result: string = FormatHelper.Replace(value, FormatHelper.getGroupingSeparator(locale));

        return parseLong(result, isUnsignedType);
    }

    public static coerceLongValue(value: Long, min: Long, max: Long, defaultMax: boolean): Long {
        if (value) {
            value = value.lessThan(min) ? min : value;
            value = value.greaterThan(max) ? max : value;
        }
        else {
            value = defaultMax ? max : min;
        }
        return value;
    }

    public static formatNumber(value: any, localeValue: string, resValue = 0): string {
        let result: string;
        const paramsFormatNumb: paramFormatNumeric = {
          locale: localeValue,
          res: resValue
        };
        if (value !== undefined) {
            const formatNumeric: FormatNumeric = new FormatNumeric(paramsFormatNumb);
            result = formatNumeric.format(value);
        }
        return result;
    }

    public static LongMinToNumber(): number {
        return Long.MIN_VALUE.toNumber();
    }

    public static LongMaxToNumber(): number {
        return Long.MAX_VALUE.toNumber();
    }
}
