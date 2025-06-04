# FormatDate

This document describes the FormatDate class and how it is to be used.

## FormatDate class

The reason for the existence of this class is to format a date and time *with milliseconds* for a specified locale (which can be different than the default browser locale).



### Constructor

`FormatDate(locale: string)`

| Argument | Data Type | Description                                                  |
| -------- | --------- | ------------------------------------------------------------ |
| locale   | string    | The locale to be used when formatting the date, time, and milliseconds. The locale is a string, such as "de" or "en" (or the longer version, such as "en-US" or "de-DE"). |



### Functions

`format(d: Date): string`

The format function will throw an exception if the argument is null or undefined.

| Argument | Data Type | Description                                      |
| -------- | --------- | ------------------------------------------------ |
| d        | Date      | Date and time. This can be in UTC or local time. |

The return from the format function will be the *local* date and time formatted as: the short date followed by a space, the long time, and the number of milliseconds. An example, using the 'en' locale:

​			`1/1/1970 10:09:08.413 AM` 



### Properties

The following property indicates the format of the time.

| Property   | Data Type | Description                                                  |
| ---------- | --------- | ------------------------------------------------------------ |
| is24Format | boolean   | This property will be true when the locale (the argument to the class constructor) produces a formatted time that follows the convention of a 24 hour clock. As defined in Wikipedia: "[a] 24-hour clock is the convention of time keeping in which the day runs from midnight to midnight and is divided into 24 hours, indicated by the hours passed since midnight, from 0 to 23. This system is [...] used by international standard ISO 8601." |



## Developer Notes

The following should be kept in mind when using the FormatDate class:

1. The format function will throw an exception if the argument is null or undefined.

2. If the locale argument to the constructor does not represent a valid locale (null / undefined / unknown locale), some environments will throw an exception when the locale is used, while other environments will default to the current browser locale. In those cases where an exception is throw, the class will attempt to use an undefined locale (which normally defaults to the current browser locale). If that fails as well, the FormatDate.format function will attempt to format the incoming Date object with the current browser locale.
