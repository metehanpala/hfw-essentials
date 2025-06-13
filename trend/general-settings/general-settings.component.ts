import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BrowserObject, GeneralSetings } from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { RelativeTimeRange } from '@simpl/trendviewer-ng';
import { Subscription } from 'rxjs';

import { TrendSnapinService } from '../services/trend-snapin.service';
import { RelativeTimeRanges } from '../shared/trend-searched-item';

export interface TimeRangeValue {
  unitValue: number;
  id: RelativeTimeRange;
}
const TIMERANGE = {
  timeRangeItems: [
    { id: RelativeTimeRanges.Minute, displayName: 'TREND_VIEWER.TEXT_SHORT.TIMERANGE_MINUTE' },
    { id: RelativeTimeRanges.Hour, displayName: 'TREND_VIEWER.TEXT_SHORT.TIMERANGE_HOUR' },
    { id: RelativeTimeRanges.Day, displayName: 'TREND_VIEWER.TEXT_SHORT.TIMERANGE_DAY' },
    { id: RelativeTimeRanges.Week, displayName: 'TREND_VIEWER.TEXT_SHORT.TIMERANGE_WEEK' },
    { id: RelativeTimeRanges.Month, displayName: 'TREND_VIEWER.TEXT_SHORT.TIMERANGE_MONTH' },
    { id: RelativeTimeRanges.Year, displayName: 'TREND_VIEWER.TEXT_SHORT.TIMERANGE_YEAR' },
    { id: RelativeTimeRanges.All, displayName: 'TREND_VIEWER.TEXT_SHORT.TIMERANGE_ALL' }
  ]
};

const SLIDING_VALUE: any =
  [
    { id: 1, slideValue: 16 },
    { id: 2, slideValue: 8 },
    { id: 3, slideValue: 4 },
    { id: 4, slideValue: 2 }
  ];

const GENERAL_SETTINGS = 'Flex_Trend_GeneralSettings';
@Component({
  selector: 'gms-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrl: './general-settings.component.scss',
  standalone: false
})

export class GeneralSettingsComponent implements OnInit, OnDestroy {
  public isInvalidTimerange = false;
  public generalSettingsPayload: GeneralSetings;
  public saveSeittingsSub: Subscription;
  public pixelsPerSample: number;
  public slidingValue: any;
  public dataAccuracy: string;
  public timeRangeConfig = TIMERANGE;
  public displayQualityInformation: boolean;
  public selectedItem: TimeRangeValue = { id: RelativeTimeRanges.Week, unitValue: 1 };

  // @Input() public selectedObject: BrowserObject;
  constructor(
    public trendSnapinService: TrendSnapinService,
    private readonly traceService: TraceService,
    private readonly translateService: TranslateService) { }
  
  public ngOnInit(): void {
    this.getGeneralSettings();
    this.saveSeittingsSub = this.trendSnapinService.generalSettingsSub.subscribe(result => {
      this.saveGeneralSettings();
    });

  }public ngOnDestroy(): void {
    if (this.saveSeittingsSub) {
      this.saveSeittingsSub.unsubscribe();
    }
  }

  public getGeneralSettings(): void {
    let trendGeneralSettings: GeneralSetings;
    this.trendSnapinService.getGenSettings(GENERAL_SETTINGS).subscribe(result => {
      trendGeneralSettings = JSON.parse(result);
      if (result === undefined || result === null) {
        this.slidingValue = 1;
        this.selectedItem = {
          id: RelativeTimeRanges.Week,
          unitValue: 1
        };
        this.displayQualityInformation = false;
      } else {
        for (const slide of SLIDING_VALUE) {
          if (slide.slideValue === trendGeneralSettings.pixelsPerSample) {
            this.slidingValue = slide.id;
            this.pixelsPerSample = slide.slideValue;
            break;
          }
        }
        this.selectedItem = {
          id: trendGeneralSettings.timeRange.timeRangeUnit as RelativeTimeRange,
          unitValue: trendGeneralSettings.timeRange.timeRangeValue
        };
        this.displayQualityInformation = trendGeneralSettings.displayQuality;
      }
    }, error => {
      this.slidingValue = 1;
      this.selectedItem = {
        id: RelativeTimeRanges.Week,
        unitValue: 1
      };
    });
  }

  public validateNumber(e: any): void {
    const input: string = String.fromCharCode(e.charCode);
    const reg: any = /^\d+$/;
    if (!reg.test(input)) {
      e.preventDefault();
    }
  }

  public selectionChanged(event: boolean): void {
    this.displayQualityInformation = event;
  }

  public saveGeneralSettings(): void {
    this.generalSettingsPayload = {
      pixelsPerSample: (this.pixelsPerSample === undefined || this.pixelsPerSample === null) ? 16 : this.pixelsPerSample,
      timeRange: {
        timeRangeUnit: this.selectedItem.id,
        timeRangeValue: this.selectedItem.unitValue
      },
      displayQuality: this.displayQualityInformation
    };
    // JSON.parse and JSON.stringify are required to convert the string type to object of type json
    this.trendSnapinService.putGenSettings(GENERAL_SETTINGS,
      JSON.parse(JSON.stringify(this.generalSettingsPayload))
    ).subscribe(res => {
      this.traceService.debug('GeneralSettingsComponent.saveGeneralSettings():Component destroyed.');
    });
  }

  public logEvent(event: any): number {
    switch (event) {
      case 1:
        this.pixelsPerSample = 16;
        break;
      case 2:
        this.pixelsPerSample = 8;
        break;
      case 3:
        this.pixelsPerSample = 4;
        break;
      case 4:
        this.pixelsPerSample = 2;
        break;
      default:
        break;
    }
    return this.pixelsPerSample;
  }
}
