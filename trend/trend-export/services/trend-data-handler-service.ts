import { Injectable } from "@angular/core";
import { TrendQualityValue, TrendServiceBase } from '@gms-flex/services';
import { TranslateService } from "@ngx-translate/core";
import { catchError, forkJoin, map, Observable, of, Subject } from "rxjs";

import { AggregateUnits, ExportDataConfig, ExportFormatOption, SeriesDN, SeriesInfo } from '../model/trend-export.model';
import { TrendExcelExportService } from "./trend-excel-export-service";
import { TrendExportMapperBaseService } from "./trend-export-mapper-base-service";
import { TrendPdfExportService } from "./trend-pdf-export-service";

const sampledensityOptions = [
  // The raw data option has been removed from the list based on discussions, 
  // as the number of samples in raw data can be very large and is not currently supported for trend export.
  {
    id: "lessThanOrEqualOneHour",
    sampleDensity: [
      { id: "AsShownInChart", densityTitle: 'TREND_FOLDER.AS_SHOWN_IN_CHART' }
      // { id: "RawData", densityTitle: 'TREND_FOLDER.RAW_DATA' }
    ]
  },
  {
    id: "betweenOneHourToTwentyFourHours",
    sampleDensity: [
      { id: "AsShownInChart", densityTitle: 'TREND_FOLDER.AS_SHOWN_IN_CHART' },
      // { id: "RawData", densityTitle: 'TREND_FOLDER.RAW_DATA' },
      { id: "Hourly", densityTitle: 'TREND_FOLDER.HOURLY' }
    ]
  },
  {
    id: "betweenOneDayAndSevenDays",
    sampleDensity: [
      { id: "AsShownInChart", densityTitle: 'TREND_FOLDER.AS_SHOWN_IN_CHART' },
      // { id: "RawData", densityTitle: 'TREND_FOLDER.RAW_DATA' },
      { id: "Hourly", densityTitle: 'TREND_FOLDER.HOURLY' },
      { id: "Daily", densityTitle: 'TREND_FOLDER.DAILY' }
    ]
  },
  {
    id: "betweenSevenDayAndThirtyDays",
    sampleDensity: [
      { id: "AsShownInChart", densityTitle: 'TREND_FOLDER.AS_SHOWN_IN_CHART' },
      // { id: "RawData", densityTitle: 'TREND_FOLDER.RAW_DATA' },
      { id: "Hourly", densityTitle: 'TREND_FOLDER.HOURLY' },
      { id: "Daily", densityTitle: 'TREND_FOLDER.DAILY' }
    ]
  },
  {
    id: "betweenThirtyAndThreeSixtyFiveDays",
    sampleDensity: [
      { id: "AsShownInChart", densityTitle: 'TREND_FOLDER.AS_SHOWN_IN_CHART' },
      { id: "Hourly", densityTitle: 'TREND_FOLDER.HOURLY' },
      { id: "Daily", densityTitle: 'TREND_FOLDER.DAILY' },
      { id: "Weekly", densityTitle: 'TREND_FOLDER.WEEKLY' },
      { id: "Monthly", densityTitle: 'TREND_FOLDER.MONTHLY' }
    ]
  },
  {
    id: "betweenThreeSixtyFiveAndSevenThirtyDays",
    sampleDensity: [
      { id: "AsShownInChart", densityTitle: 'TREND_FOLDER.AS_SHOWN_IN_CHART' },
      { id: "Weekly", densityTitle: 'TREND_FOLDER.WEEKLY' },
      { id: "Monthly", densityTitle: 'TREND_FOLDER.MONTHLY' }
    ]
  }
];

@Injectable()
export class TrendDataHandlerService {
  constructor(
    private readonly translateService: TranslateService,
    private readonly trendPdfExportService: TrendPdfExportService,
    private readonly trendService: TrendServiceBase,
    private readonly trendExcelExportService: TrendExcelExportService
  ) {
    this.translateService.getDefaultLang();
  }

  // Function to fetch sample density options
  public getSampleDensityOptions(key: string): { id: string, densityTitle: string }[] {
    const densityOption = sampledensityOptions.find(option => option.id === key);
    return densityOption?.sampleDensity || [];
  }
  
  // handling all api calls for fetching trend data
  public fetchSeriesData(
    startdate: string, 
    enddate: string, 
    seriesDNInfo: SeriesDN[], 
    selectedExportOption: string,
    selectedFileFormat: string,
    systemId: number
  ): Observable<void> {
    const trendData: SeriesInfo[] = [];

    return new Observable<void>(observer => {
      let exportService: TrendExportMapperBaseService;
      if (selectedFileFormat === 'pdf') {
        exportService = this.trendPdfExportService;
      } else if (selectedFileFormat === 'csv' || selectedFileFormat === 'xlsx') {
        exportService = this.trendExcelExportService;
      }

      const config: ExportDataConfig = {
        toDate: enddate,
        fromDate: startdate,
        fileType: selectedFileFormat,
        desnsityOption: selectedExportOption,
        systemId: systemId
      };
      exportService.setExportProperties(config);
      exportService.generateFileName();

      const fetchObservables = seriesDNInfo.map((series: SeriesDN) =>
        this.fetchSeriesDataForExportOption(
          series, 
          startdate, 
          enddate, 
          series.noOfSamples, 
          trendData, 
          selectedExportOption, systemId
        )
      );
      forkJoin(fetchObservables).pipe(
        map(() => {
          exportService.mapDataToFormattedObject(trendData);
        }),
        catchError(error => {
          observer.error(error);
          return of(null);
        })
      ).subscribe({
        next: () => {
          observer.next();
          observer.complete();
        },
        error: error => observer.error(error)
      });
    });
  }

  // Fetch aggregated data with aggrgated unit
  public fetchAggrigatedDataToExport(
    seriesInfo: SeriesDN, 
    aggregateUnit: number, 
    startdate: string, 
    enddate: string, 
    length: number,
    trendData: SeriesInfo[]
  ): Observable<void> {
    return this.trendService.getTrendAggregatedData(seriesInfo.seriesId, aggregateUnit, startdate, enddate, length).pipe(
      map(aggregatedDataResult => {
        const trendDataItem: SeriesInfo = {
          name: seriesInfo?.seriesName,
          description: seriesInfo?.seriesDisplayName,
          designation: seriesInfo?.seriesDesignation,
          alias: seriesInfo?.seriesAlias,
          unit: seriesInfo?.unit,
          data: aggregatedDataResult?.Series,
          resolution: seriesInfo?.resolution,
          enumTexts: seriesInfo?.enumTexts
        };
        trendData.push(trendDataItem);
      })
    );
  }

  // Fetch raw or interval based data for export
  public fetchRawOrIntervalDataToExport(
    seriesInfo: SeriesDN, 
    startdate: string, 
    enddate: string, 
    Interval: number,
    trendData: SeriesInfo[]
  ): Observable<void> {
    return this.trendService.getTrendData(seriesInfo.seriesId, startdate, enddate, Interval.toString()).pipe(
      map(trendDataResult => {
        const trendDataItem: SeriesInfo = {
          name: seriesInfo?.seriesName,
          description: seriesInfo?.seriesDisplayName,
          designation: seriesInfo?.seriesDesignation,
          alias: seriesInfo?.seriesAlias,
          unit: seriesInfo?.unit,
          data: trendDataResult?.Series,
          resolution: seriesInfo?.resolution,
          enumTexts: seriesInfo?.enumTexts
        };
        trendData.push(trendDataItem);
      })
    );
  }

  // handle all api call for different export options
  private fetchSeriesDataForExportOption(
    series: SeriesDN, 
    startdate: string, 
    enddate: string, 
    noOfSamples: number,
    trendData: SeriesInfo[], 
    selectedExportOption: string,
    systemId: number
  ): Observable<void> {
    if (selectedExportOption === 'RawData') {
      return this.fetchRawOrIntervalDataToExport(series, startdate, enddate, 0, trendData);
    } else if (selectedExportOption === 'AsShownInChart') {
      return this.fetchRawOrIntervalDataToExport(series, startdate, enddate, noOfSamples, trendData);
    } else if (
      selectedExportOption === 'Hourly' || 
      selectedExportOption === 'Weekly' || 
      selectedExportOption === 'Monthly' || 
      selectedExportOption === 'Daily'
    ) {
      const aggregateUnit = this.getAggrigateUnit(selectedExportOption);
      return this.fetchAggrigatedDataToExport(series, aggregateUnit, startdate, enddate, 1, trendData);
    } else {
      return of(null);
    }
  }

  private getAggrigateUnit(option: string): number {
    switch (option) {
      case 'Hourly':
        return AggregateUnits.Hour;
      case 'Weekly':
        return AggregateUnits.Week;
      case 'Monthly':
        return AggregateUnits.Month;
      case 'Daily':
        return AggregateUnits.Day;
      default:
        return AggregateUnits.Hour;
    }
  }
}
