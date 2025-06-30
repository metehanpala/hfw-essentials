export class Constants {
    // gmsText
    public static VALUE_NOTANUMBER: string = '#NAN';
    public static FORMAT_ERROR: string = '#FORMAT';
    public static FORMAT_ENG: string = '#ENG';
    public static GENERAL_ERROR: string = '#COM';
    // gmsCommand
    public static priority: string = 'PRIORITY';
    public static maxStringLength: number = 2048;
    public static borderDefaultColor: string = '#808080';

    // colors
    public static transparentColor: string = 'transparent';

    /**
     * bool false default text value; numeric indicates no text was found
     */
    public static defaultBoolFalseText: string = '0';

    /**
     * Value used for bool false when nothing else exists
     */
    public static defaultBoolFalseNumericValue: number = 0;

    /**
     * bool true default text value; numeric indicates no text was found
     */
    public static defaultBoolTrueText: string = '1';

    /**
     * Value used for bool true when nothing else exists
     */
    public static defaultBoolTrueNumericValue: number = 1;
}
