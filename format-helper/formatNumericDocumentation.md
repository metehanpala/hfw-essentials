# FormatNumeric

This document describes the FormatNumeric class used to format numeric information. Originally it was thought that such a class would be unnecessary because the existing internationalization NumberFormat class could be used directly. But testing on different devices determined that enough code 'around' the class is required in order to ensure proper behavior.

## FormatNumeric class

The class definition.

### Constructor

`FormatNumeric(locale: string, res: number, grouping?: boolean)`

| Argument  | Description                                                  |
| --------- | ------------------------------------------------------------ |
| locale    | The locale to be used when creating the string to be presented to the user. The locale controls the decimal separator and grouping symbol (if required). The locale is a string, such as "de" or "en" (or the longer version, such as "en-US" or "de-DE"). Note that the locale can be null or undefined, in which case the current locale of the browser will be used. |
| res       | The number of digits to the right of the decimal separator. The valid range is 0 to 20; values less than 0 will be treated as 0 and values greater than 20 will be treated as 20. This parameter value is optional. If not defined, the internationalization NumberFormat class gives a value of 0, unless the number being passed contains a resultion (fractional value). In that case the resolution being passed back is that of the number passed in. |
| grouping? | An optional boolean argument that can be used to control the display of a grouping symbol. An example of a grouping symbol is "," for locale "en". The default is true. |

The constructor will throw if the res argument is null, undefined, or not a number.



### Functions

`format(n: number): string`

| Argument | Description                 |
| -------- | --------------------------- |
| n        | The number to be formatted. |

The format function will throw an exception if the argument is null, undefined, or not a number.



### Properties

The following properties expose the separators used internally by the numeric formatter - note that the separators are determined by the locale provided in the call to the constructor.

| Property          | Data Type | Description                                                  |
| ----------------- | --------- | ------------------------------------------------------------ |
| decimalSeparator  | string    | A decimal separator is a symbol used to separate the integer part from the fractional part of a number written in decimal form; an example of this symbol is a dot (".") or a comma (","). |
| groupingSeparator | string    | A grouping separator is a symbol used to divide a number with many digits into groups; an example of this symbol (or delimiter) is a comma (",") or a dot ("."). |



## Developer Notes

1. Don't forget that the resolution has a range of 0 to 20 - the constructor will silently enforce it.
2. If the locale argument to the constructor does not represent a valid locale (null / undefined / unknown locale), some environments will throw an exception when the locale is used - other environments will default to the current browser locale. In those cases where an exception is thrown the class will attempt to use an undefined locale (defaulting to the current browser locale). If that fails as well, the class will resort to primitive formatting (which uses the current browser locale) and do its best to honor the desired resolution.

