# **Duration**

A duration is an interval of time. There are normally three pieces of information associated with a duration:

- Value: The "raw" duration value is represented by an unsigned four byte integer (in those languages where such a thing can be defined).
- Units: What the raw duration value represents: this can be anything from the number of milliseconds to the number of days (more on this below).
- Format: How the raw duration value is to be converted to a string. For example, the raw duration value may be in milliseconds but the user may want to see the duration in "minutes + seconds".

This document describes the FormatDuration class used to format a raw duration into a string that can be presented to the user (either in the user interface or in a report). The short version of how to use the FormatDuration class: 

1. Create an instance of the FormatDuration class. 
2. Format a raw duration value by calling the function FormatDuration.format.



## **FormatDuration class**



### Constructor

`FormatDuration(locale: string, units: string, format: string)`

| Argument | Data Type | Description                                                  |
| -------- | --------- | ------------------------------------------------------------ |
| locale   | string    | The locale to be used when creating the string to be presented to the user. The locale controls the time and decimal separators. The locale is a string, such as "de" or "en" (or the longer version, such as "en-US" / "de-DE"). |
| units    | string    | The units of the raw duration value. This is a string such as "ms" (which indicates milliseconds). Refer to a table below for a list of valid units and their string representations. |
| format   | string    | How the duration is to be displayed to the user. The specifier consists of one or more fields that are from the list of reserved characters. A full description of format specifiers is given below. |



### Functions

`format(duration: number): string`

The format function will throw an exception if the argument is null or undefined.

| Argument | Data Type | Description      |
| -------- | --------- | ---------------- |
| duration | number    | The raw duration |



### **Duration Units**

The table below contains the range of units that the raw duration value can take on.

| Units | Description                                  |
| ----- | -------------------------------------------- |
| d     | The raw duration is in days                  |
| h     | The raw duration is in hours                 |
| m     | The raw duration is in minutes               |
| s     | The raw duration is in seconds               |
| ts    | The raw duration is in tenths of seconds     |
| hs    | The raw duration is in hundredths of seconds |
| ms    | The raw duration is in milliseconds          |



### **Format Specifier**

This section describes a format specifier (also see Developer Notes below for some suggestions on how to define a format specifier).

*Duration Normalization*

During the process of formatting a raw duration value, the FormatDuration class will "normalize" the duration value into the equivalent number of days, hours, minutes, seconds, and milliseconds (where each field a the logical limit, such as 0 to 23 for the number of hours and 0 to 59 for the number of minutes and seconds): . For example, a raw duration value of 3675 minutes is 2 days, 13 hours, and 15 minutes.

*Specifier Definition*

A format specifier is a string that contains one or more field identifiers, where each field corresponds to one of the normalized values (days / hours / minutes / seconds / etc.). Each field is represented by an instance of a reserved character, where the number of repeated characters is the minimum width of the formatted value. There are two fields (time separator and decimal separator) that 'placeholders' for the actual values that are determined by the locale. 

An example of a format specifier would be "`H:mm:ss.fff`" which contains seven fields:

| Field | Description                                                  |
| ----- | ------------------------------------------------------------ |
| H     | The total number of hours in the duration (see description below). |
| :     | A time separator as dictated by the locale. Note that a colon (':') is generally used as a time separator. |
| mm    | The normalized minutes (0 to 59), with a minimum field width of two characters. If the number of minutes is less than 10 the field will be left-padded with a zero ('0'). |
| :     | A time separator.                                            |
| ss    | The normalized seconds (0 to 59) with a minimum field width of two characters. If the number of seconds is less than 10 the field will be left-padded with a zero ('0'). |
| .     | A decimal separator as dictated by the locale.               |
| fff   | The fractional number of the field to the immediate left - in this case, seconds. The field has a width of 3, so the numeric value will be the number of milliseconds. Note that 'f' is used to represent a fractional field that is always displayed, as compared to 'F' which represents an optional field - if the fractional amount is zero, the field will not be displayed. |

Another example is "`D:hh:mm.FF`" which contains seven fields:

| Field | Description                                                  |
| ----- | ------------------------------------------------------------ |
| D     | The total number of days in the duration (see description below). |
| :     | A time separator as dictated by the locale.                  |
| hh    | The normalized hours (0 to 24), with a minimum field width of two characters. If the number of minutes is less than 10 the field will be left-padded with a zero ('0'). |
| :     | A time separator.                                            |
| mm    | The normalized minutes(0 to 59) with a minimum field width of two characters. If the number of seconds is less than 10 the field will be left-padded with a zero ('0'). |
| .     | A decimal separator as dictated by the locale.               |
| fff   | The fractional number of the field to the immediate left - in this case, minutes. The field has a width of 2, so the numeric value will be hundredths of a minute. Note that 'F' is used to declare the fractional part, so it will not appear if the amount is zero. |

Note that characters in the format specifier that are not in the list of reserved characters will be included in the formatted duration (this includes whitespace characters such as a blank). If there is a need to include a reserved character as part of the additional text, it must be 'escaped' (preceded by a forward slash). For example, to produce a formatted duration like this:

​					`My label: 1:02`

The format specifier could look something like: "`\My label\: H:mm.FF`" where characters 'M' and ':' have been escaped since they are reserved.

*Reserved Characters*

The format specifier can contain a combination of the following reserved characters:

| Character | Description                                                  |
| --------- | ------------------------------------------------------------ |
| `d`       | Number of days                                               |
| `D`       | Total number of days (since there is no larger field, this is also the number of days) |
| `h`       | Number of normalized hours                                   |
| `H`       | Total number of hours (normalized hours and normalized days converted to hours) |
| `m`       | Number of normalized minutes                                 |
| `M`       | Total number of minutes (normalized minutes plus normalized hours and normalized days converted to minutes) |
| `s`       | Number of normalized seconds                                 |
| `S`       | Total number of seconds (normalized seconds plus normalized minutes, normalized hours, and normalized days converted to seconds) |
| `t`       | The fractional part of seconds converted to tenths of seconds |
| `T`       | Total tenths of seconds (the total number of milliseconds converted to tenths of seconds) |
| `c`       | The fractional part of seconds converted to hundredths of seconds |
| `C`       | Total hundredths of seconds (the total number of milliseconds converted to hundredths of seconds) |
| `i`       | (lower case i) The fractional part of seconds converted to milliseconds |
| `I`       | (upper case i) Total milliseconds (the normalized milliseconds plus the normalized days, normalized hours, normalized minutes, and normalized seconds all converted to milliseconds) |
| `f`       | The fractional part of the field to the left: the fractional part will always be displayed |
| `F`       | The fractional part of the field to the left: the fractional part will only be displayed if it is non-zero |
| `:`       | (colon) A placeholder for the time separator for the specified locale |
| `.`       | (period) A placeholder for the decimal separator for the specified locale |



## **Developer Notes**

The following should be kept in mind when using the FormatDuration class:

1. The format function will throw an exception if the argument is null or undefined.

2. If the locale argument to the constructor does not represent a valid locale (null / undefined / unknown locale), some environments will throw an exception when the locale is used, while other environments will default to the current browser locale. In those cases where an exception is throw, the class will attempt to use an undefined locale (which normally defaults to the current browser locale). If that fails as well, the duration will be unable to format the raw duration value: a call to FormatDuration.format will return the raw duration value formatted as an integer.
3. If the units argument to the constructor does not identify a valid unit the FormatDuration will not be able to 'normalize' the duration: therefore, the result of the FormatDuration.format function will be the raw duration value formatted as an integer.
4. If the Format argument to the constructor is null, undefined, or an empty string the FormatDuration.format function will return the raw duration value formatted as an integer.
5. The fractional part (a field consisting of one or more 'f' or 'F' characters) is limited to a width of 8: any width larger will result in a thrown exception.
6. The format function will throw an exception If the duration value is null, undefined, or not a number.
7. Conceptually, think of the "total number of X" (where 'X' is days / hours / minutes / seconds / tenths of seconds / hundredths of seconds / milliseconds) as the sum of the normalized field value and the normalized values above it. For example: the "total number of minutes" is the normalized number of minutes plus the normalized hours and normalized days converted to minutes. 
8. Think of the "fractional part of X" as the sum of the normalized values of the fields 'below' X, converted to the units of X. For example, if the format specifier contains a fractional part that is to the right of minutes, the numeric value placed in that field will be the number of normalized seconds plus normalized milliseconds divided by 60 (seconds per minute). So a duration of 90 seconds with a format specifier of "`M.ff`" will result in a string of "1.50" (the decimal separator will depend on the locale). 
9. While the "total number of X" field can be defined with more than one character, in practice this field is usually placed on the far left and one is sufficient: the FormatDuration will expand the field as required in order to fit the totalized value.