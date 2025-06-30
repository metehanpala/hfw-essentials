export interface GraphicSnapinHldlConfig {

    // True - Alarm/Event Indication will be shown.
    // False or Config parameter missing - Alarm/Event Indication will not be shown.
    EnableAlarmIndication: boolean;

    // Default size - 16 pixels, Valid range 8-64 pixels.
    // Value lesser than 8, will be ceiled to 8.
    // Greater than 64, will be floored to 64.
    // Config parameter missing - Default size.
    AlarmIconSize: number;

    // True - Navigates to first system browser child of the target designation which has graphics.
    // False - Default behavior - Navigates to the respective designation.
    EnableDownwardNavigation: boolean;

    // Object model names of objects to be exluded from Downward navigation
    // If Downward Navigation is true
    // Ex: GMS_Aggregator
    ExcludeFromDownwardNavigation: string[];

    // Indicates if the instance is created in single pane layout.
    IsSinglePane: boolean;

    // Indicates if the instance needs to avoid preselect === true on a secondary selection.
    avoidPreselectOnSecondarySelection: boolean;
}
