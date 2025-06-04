# FormatBACnetDateTime

This document describes the FormatBACnetDateTime class and how it is to be used.



## FormatBACnetDateTime class

The reason for the existence of this class is to format a string containing a "BACnet-encoded" date and time into a displayable string.  A string with a BACnet-encoded date and time will be 16 characters long and have the following form:

​			`YYYMMDDWhhmmssHH`

Where the fields are:

| Field | Description                                                  |
| ----- | ------------------------------------------------------------ |
| YYY   | The year with an offset of 1900. For example, the year 2014 is presented as "114". |
| MM    | The month, where January = 1. A special month value of 13 indicates "odd" months <br/>while a special month value of 14 indicates "even" months. |
| DD    | The day of the month (beginning at 1). A special day value of 32 indicates the <br/>last day of the month, while 33 indicates "odd" days. A special day value of 34 
indicates "even" days. |
| W     | The day of the week, where Monday = 1.                       |
| hh    | Hour of the day, with a range of 0 to 23.                    |
| mm    | Minute, with a range of 0 to 59.                             |
| ss    | Seconds, with a range of 0 to 59.                            |
| HH    | Hundredths of a second, with a range of 0 to 99.             |

Any of the above fields may be "wildcarded" (meaning: unspecified) by filling the field with the character 'f' or F'. Note that *all* of the characters in the field must contain the same character ('f' or 'F').



### Enumerations

The enumerations that are required are listed here.

#### BACnetDateTimeDetail

This enumeration allows the client to specify what information is to be included in the formatted output.

| Numeric Value | Symbolic Value | Description                                                  |
| ------------- | -------------- | ------------------------------------------------------------ |
| 0             | Unspecified    | The content of the formatted value (date and/or time) is unspecified. The formatted output will include the date when one or more of the fields are specified; the same will be true of the time. |
| 1             | DateOnly       | The formatted value is to include only the date.             |
| 2             | TimeOnly       | The formatted value is to include only the time.             |
| 3             | DateAndTime    | The formatted value is to include both date and time.        |



#### BACnetDateTimeResolution

This enumeration controls what the resolution of time is to be included in the formatted output (when the detail indicates that time is to be part of the output). Note that when the detail indicates "date only" this argument is ignored.

| Numeric Value | Symbolic Value | Description                   |
| ------------- | -------------- | ----------------------------- |
| 0             | Seconds        | Display only seconds          |
| 1             | Tenths         | Display tenths of seconds     |
| 2             | Hundredths     | Display hundredths of seconds |



#### BACnetDateTimeSupportDayOfWeek

This enumeration specifies what to do about the "day of week" field when creating the formatted value. Note that the weekday will only be included if the detail indicates that the date is to be part of the output.

| Numeric Value | Symbolic Value           | Description                                      |
| ------------- | ------------------------ | ------------------------------------------------ |
| 0             | NeverDisplay             | Never display day of week.                       |
| 1             | DisplayWhenNotWildcarded | Display day of week when not wildcarded.         |
| 2             | AlwaysDisplay            | Show day of week regardless of being wildcarded. |



### Constructor

`FormatBACnetDateTime(locale: string, detail?: BACnetDateTimeDetail, res?: BACnetDateTimeResolution, dow?: BACnetDateTimeSupportDayOfWeek, isUtc?: boolean)`

The constructor will throw an exception is the locale is null, undefined, or an empty string.

| Argument | Description                                                  |
| -------- | ------------------------------------------------------------ |
| locale   | The locale to be used when formatting the date, time, and milliseconds. The locale is a string, such as "de" or "en" (or the longer version, such as "en-US" / "de-DE"). |
| detail?  | An optional argument indicating what is to be displayed in the formatted output. The default value is BACnetDateTimeDetail.DateAndTime. |
| res?     | An optional argument indicating the time resolution - used only when the detail indicates that the time should be displayed. The default value is BACnetDateTimeResolution.Seconds. |
| dow?     | An optional argument indicating what to do about the day of week - used only when the detail indicates that the date should be displayed. The default value is BACnetDateTimeSupportDayOfWeek.NeverDisplay. |
| isUtc?   | an optional argument indicating if the encoded date and time is UTC. This argument will be ignored if any of the following fields are wildcarded: year / month / day / hour / minute / second. The default value is false. |



### Functions

`format(s: string): string`

The format function will throw an exception if the argument is not a valid "BACnet-encoded" date/time string.

| Argument | Data Type | Description                      |
| -------- | --------- | -------------------------------- |
| s        | string    | BACnet-encoded date/time string. |

The result of the format function can contain up to three fields: the weekday, the short date, and the long time. It will take this form:

​	                   `[Weekday] [Short Date]  [Long Time]` 

The various arguments to the constructor control what appears in the output. The string can contain the following 'special' characters:

| Special  Character | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| *                  | This indicates that the field was wildcarded (filled with 'f' or 'F'). |
| ^                  | The day of month field (DD) contained the value of 32, indicating the "last day of the month". |
| -                  | Indicates the 'odd' months or days, depending on where it appears. Note that the special value for odd months is 13 and even days is 33. |
| +                  | Indicates the 'even' months or days, depending on where it appears. Note that the special value for even months is 14 and even days is 34. |



## Developer Notes

The following should be kept in mind when using the FormatBACnetDateTime class:

1. The constructor will throw an exception if the locale argument is null, undefined, or an empty string.
2. The format function will throw an exception if the argument is not a string containing a valid BACnet-encoded date/time.
3. If the locale argument to the constructor does not represent a valid locale (null / undefined / unknown locale), some environments will throw an exception when the locale is used, while other environments will default to the current browser locale. In those cases where an exception is thrown, the class will attempt to use an undefined locale (which normally defaults to the current browser locale). If that fails as well, the class will resort to some primitive formatting using the default browser locale.