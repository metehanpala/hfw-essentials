# Graphics Viewer SnapIn - Layout Configuration Specification

The Graphics Viewer snapin supports specific configuration capabilities via the `config` property of the `snapInType` or the `config` property of the `snapInReference`.

## Snapin Config Parameters

> Below config parameters shall only be available/configurable at the 'snapInType' config.

- [Graphics Viewer SnapIn - Layout Configuration Specification](#graphics-viewer-snapin---layout-configuration-specification)
  - [Snapin Config Parameters](#snapin-config-parameters)
    - [EnableAlarmIndication](#enablealarmindication)
    - [AlarmIconSize](#alarmiconsize)
    - [EnableDownwardNavigation](#enabledownwardnavigation)
    - [ExcludeFromDownwardNavigation](#excludefromdownwardnavigation)

### EnableAlarmIndication

 > Use to switch the alarm indication(s) - On/Off.

- Default value is ‘true’. Alarm Indication(s) shall be displayed.
- If ‘false’ Alarm Indication(s) shall not be displayed.
- Config parameter manually made unavailable/removed in/from HLDL – Alarm Indication shall not be displayed.

### AlarmIconSize
>
> Use to configure the alarm indication icon size to desired size, within the valid limit (8 - 64 px).

- Default value is 16 px. Valid range of 8-64 px.
- Configuration value which is > 64 px shall be brought down to 64 px. And < 8 px  shall be brought up to 8 px.
- Config parameter manually made unavailable/removed in/from HLDL – Alarm Indication shall retain the default value of 16 px.

### EnableDownwardNavigation
>
> Use to switch the graphics downward navigation - On/Off.

- Default value is 'false'.
- If 'true' Downward Navigation shall be enabled.
- Config parameter manually made unavailable/removed in/from HLDL – Downward Navigation shall be disabled, default navigation shall be available.

### ExcludeFromDownwardNavigation
>
> Use to exclude an object using object model name from graphics downward navigation. - List of object model names.
>
> Example: ["GMS_Aggregator", "GMS_Servers_Folder"]

- If Downward Navigation is enabled, any object model name mentioned in the exclusion list shall have default navigation.

--------------

Back to [Layout Definition](https://code.siemens.com/gms-flex/gms/-/blob/master/docs/hldl/layout-definition-creation.md).
