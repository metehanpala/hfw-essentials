import { FormatHelper } from '../utilities/format-helper';

export class Utility {

    public static DP_OBJ_PROP_DELIMITER: string = ';';
    public static DP_OBJECTMODEL_PROP_PREFIX: string = '.';

    // Note: function property names start with "@", e.g. "AI_1;@Value"
    public static DP_FUNC_PROP_PREFIX: string = '@';

    // Note: function property names can also start with "@[]" when they are returned by OnResolve as default function property
    public static DP_FUNC_PROP_PREFIX_FULL: string = '@[]';

    public static REPLICATION_WILDCARD: string = '[*]';

    // eslint-disable-next-line
    public static numericRegEx: RegExp = RegExp("^[0-9]+$");
    // eslint-disable-next-line
    public static hexRegEx: RegExp = RegExp("^[0-9A-F]+$");

    public static ALARM_ANCHOR_DESCRIPTION: string = 'alarm-anchor';

    // eslint-disable-next-line
    public static URLprotocolRegEx: any = new RegExp("/^https?:/");

    // public static URLpatternRegEx: any = new RegExp("^(https?:\\/\\/)" + // protocol
    //    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    //    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    //    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    //    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
    //    "(\\#[-a-z\\d_]*)?$", "i"); // fragment locator\

    // Defect 1324071: DESIGO CC -Flex Client - URL string with sequence of special characters [Origin PCR - 1312078] - V5.1
    // query string and fragment locator (part of a URL) excluded from the regex pattern to identify URL  format from string - no needs.

    /* eslint-disable */
    public static URLpatternRegEx: any = new RegExp("^(https?:\\/\\/)" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))", 'i'); // OR ip (v4) address
    /* eslint-enable */

    // Search string replaces all the replication matches on replace call.
    // Typescript issue - does not allow this at this time
    // RegEx form is not supported like below
    public static REPLICATION_SEARCH_REGX(): any {
        const regExStr: any = /\[\*\]/g;
        return regExStr;
    }

    /**
     * Checks if the supplied string is a literal string, meaning it is surrounded by quotes
     * @param str The string to be tested
     * @returns True if the string is a literal string and false if not
     */
    public static IsStringLiteral(str: string): boolean {
        if (str === undefined || str.length < 2) {
            return false;
        }

        return Utility.IsCharStringLiteral(str[0]) && Utility.IsCharStringLiteral(str[str.length - 1]);
    }

    /**
     * Checks if the supplied character contains to a literal string
     * @param c The character to be tested
     * @returns True if the string starts like a literal string and false if not
     */
    public static IsCharStringLiteral(c: string): boolean {
        return c === '"' || c === '“' || c === '”';
    }

    public static IsNumeric(char: string): boolean {
        return Utility.numericRegEx.test(char);
    }

    public static IsHexDigit(char: string): boolean {
        return Utility.hexRegEx.test(char);
    }

    public static ConvertDecimalSeparator(text: string): string {
        const currentDecimalDelimiter: string = '.'; // TBD locale specific character needs . or , needs to be here.
        const decimalDelimiterToConvert: string = currentDecimalDelimiter === '.' ? ',' : '.';
        return text.replace(decimalDelimiterToConvert, currentDecimalDelimiter);
    }

    // Converts Expression result to bool
    public static ConvertToBool(value: any): boolean {
        if (value === undefined) {
            return false;
        }

        const parsedValue: number = parseFloat(value);
        if (!isNaN(parsedValue) && (parsedValue === 1 || parsedValue === 0)) {
            return (parsedValue === 1);
        }

        const parsedString: string = String(value).trim();
        if (parsedString.length > 0) {
            if (parsedString.toLowerCase() === 'false') {
                return false;
            }

            return true;
        }

        return false;
    }

    // Converts Deserialized Boolean String To Bool
    public static ConvertBooleanStringToBool(value: string): boolean {
        return value.toLowerCase() === 'true';
    }

    // Converts Expression result to double
    public static ConvertToDouble(value: any): number {
        if (value === undefined || value === null) {
            return Number.NaN;
        }

        const parsedValue: number = FormatHelper.StringToNumber(value as string);
        if (!isNaN(parsedValue)) {
            return parsedValue;
        }

        const parsedString: string = String(value).trim();
        if (parsedString.length > 0) {
            if (parsedString.toLowerCase() === 'true') {
                return 1;
            }
            if (parsedString.toLowerCase() === 'false') {
                return 0;
            }

            return Number.NaN;
        }

        return Number.NaN;
    }

    // Helps a number to be rounded for the specified precision.
    public static Round(value: number, precision: number): number {
        const factor: number = Math.pow(10, precision);
        return Math.round(value * factor) / factor;
    }

    /**
     * Applies the specifiec range for a value.
     * Example: ApplyRange(25d, -10d, 20d) returns 20
     * @param value The value
     * @param min The minimum value
     * @param max The maximum value
     * @returns The value within the specified range
     */
    public static ApplyRange(value: any, min: any, max: any): number {
        const maxValue: number = parseFloat(max);
        const minValue: number = parseFloat(min);
        const parsedValue: number = parseFloat(value);
        if (!isNaN(parsedValue)) {
            if ((!isNaN(minValue) && (isNaN(parsedValue)) || parsedValue < minValue)) {
                return minValue;
            }
            if (!isNaN(maxValue) && (isNaN(parsedValue) || parsedValue > maxValue)) {
                return maxValue;
            }
        }

        return value;
    }

    public static IsPercentValue(value: string): boolean {
        return value !== undefined && value.length > 1 && value[value.length - 1] === '%';
    }

    public static ParseAbsoluteOrRelative(value: string, compare: number, defaultValue: number = Number.NaN): number {
        if (value !== undefined || value.length === 0) {
            return defaultValue;
        }
        let parsedValue: number = defaultValue;
        value = Utility.ConvertDecimalSeparator(value);
        if (Utility.IsPercentValue(value)) {
            value = value.slice(0, value.length - 1);
            parsedValue = Number(value);
            if (Number.isNaN(parsedValue)) {
                parsedValue = defaultValue;
            }
            parsedValue = compare * parsedValue / 100;
        }
        else {
            parsedValue = Number(value);
            if (Number.isNaN(parsedValue)) {
                parsedValue = defaultValue;
            }
        }
        return parsedValue;
    }

    // Parses the percentage value.
    public static ParsePercentage(percentage: string, whole: number): number {

        if (percentage && percentage.endsWith('%')) {
            return parseFloat(percentage) / 100 * whole;
        }
        return parseFloat(percentage);
    }

    // Parent's visibility is inherited
    // Check the actual Dom visibility
    public static isDomVisible(srcElement: any): boolean {
        if (!!srcElement) {
            const actualVisibility: string = window.getComputedStyle(srcElement).visibility;
            return actualVisibility === 'visible';
        }
        return false;
    }
}
