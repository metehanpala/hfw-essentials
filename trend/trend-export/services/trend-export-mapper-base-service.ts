import { Injectable, OnDestroy } from "@angular/core";
import { AggregatedSeriesResult, SystemsServiceBase, TrendQualityValue } from "@gms-flex/services";
import { TranslateService } from "@ngx-translate/core";
import { Workbook } from "exceljs";
import { Content } from 'pdfmake/interfaces';
import { Subscription } from "rxjs";

import { SiemensLogo } from '../../shared/siemens-logo';
import { ExportDataConfig, ExportFormatDataMap, SeriesInfo, SystemViewNode, TableValue } from "../model/trend-export.model";

@Injectable()
export abstract class TrendExportMapperBaseService implements OnDestroy {
  public dataToExport: ExportFormatDataMap;
  public tableValueList: TableValue[] = [];
  protected dataHeaders: string[];
  public fileType: string;
  public fromDate: string;
  public toDate: string;
  public fileName: string;
  public locale: string;
  public systemId: number;
  public systems: SystemViewNode | undefined;
  public systemName: string;

  protected systemServiceSubscription: Subscription;
  protected selectedDensityOption: string;
  protected readonly _subscriptions: Subscription[] = [];
  protected toLabel = '';
  protected fromLabel = '';
  protected avgLabel = '';
  protected minLabel = '';
  protected maxLabel = '';
  protected timestampLabel = '';
  protected valueLabel = '';
  protected designationLabel = '';
  protected aliasLabel = '';
  protected qualityLabel = '';
  protected descriptionLabel = '';
  protected dataPointNameLabel = '';
  protected unitLabel = '';
  protected trendReportTitle = '';
  protected sampleDensityText = '';
  protected pageText = '';
  protected ofText = '';
  protected runAtText = '';
  protected peridTableLabel = '';
  protected dataTableHeader = '';
  protected pointInfoTableLebel = '';
  protected productSub: Subscription;
  protected logoUrl = '';
  protected noDataAvailableText = '';
  protected systemLabel = '';

  constructor(protected readonly translateService: TranslateService, protected readonly systemsService: SystemsServiceBase) {
    this.locale = this.translateService.getBrowserLang();
    this.getTranslations();
    this.logoUrl = SiemensLogo.image;
  }

  protected abstract createFileContent(): Workbook | Content[];

  protected abstract exportFile(): void;

  public setExportProperties(config: ExportDataConfig): void {
    this.toDate = config.toDate;
    this.fromDate = config.fromDate;
    this.fileType = config.fileType;
    this.selectedDensityOption = config.desnsityOption;
    this.systemId = config.systemId;
  }

  public mapDataToFormattedObject(trendData: SeriesInfo[]): void {
    const isRawDataOrAsShownInChart = this.selectedDensityOption === 'RawData' || this.selectedDensityOption === 'AsShownInChart';
    
    this.tableValueList = trendData.map(trendSeries => ({
      pointValues: [this.systemName, trendSeries.name, trendSeries.description, trendSeries.unit ? trendSeries.unit : ''],
      dataValues: trendSeries.data ? trendSeries.data.map((data: TrendQualityValue | AggregatedSeriesResult) => 
        this.formatDataValues(isRawDataOrAsShownInChart, data, trendSeries)) : null,
      dataHeaders: this.getTableHedaers(isRawDataOrAsShownInChart, trendSeries.unit),
      pointInfo: [trendSeries.designation, trendSeries.alias ? trendSeries.alias : null],
      resolution: trendSeries.resolution
    }));
    const pointHeader_1 = [this.designationLabel, this.aliasLabel]; // Example labels
    const pointHeader_2 = [this.systemLabel, this.dataPointNameLabel, this.descriptionLabel, this.unitLabel]   
    this.dataToExport = {
      pointHeaders: [pointHeader_1, pointHeader_2],
      // dataHeaders: this.dataHeaders,
      tableValues: this.tableValueList
    };

    this.dataToExport.sheetHeaders = [this.fromLabel, this.toLabel, this.sampleDensityText];
    this.dataToExport.sheetValues = [
      this.formatDateToBrowserLocale(this.fromDate),
      this.formatDateToBrowserLocale(this.toDate),
      this.getDensityTitle(this.selectedDensityOption)
    ];
  }

  public mapBinaryMultiData(value: any, enumTexts: string[]): string {
    if (enumTexts.length > 2) {
      return enumTexts[value - 1];
    } else if (value >= 0 && value < enumTexts.length) {
      return enumTexts[value];
    }
    return ''; 
  }

  public getTableHedaers(isRawDataOrAsShownInChart, unit): string[] {
    if (isRawDataOrAsShownInChart) {
      return [this.timestampLabel, this.valueLabel];
    } else {
      return unit
        ? [this.fromLabel, this.toLabel, this.avgLabel, this.minLabel, this.maxLabel]
        : [this.timestampLabel, this.valueLabel];
    }
  }

  public formatDataValues(isRawDataOrAsShownInChart: boolean, data: TrendQualityValue | AggregatedSeriesResult, trendSeries: SeriesInfo): string[] {
    const { unit, enumTexts } = trendSeries;
  
    if (isRawDataOrAsShownInChart) {
      data = data as TrendQualityValue;
      return [
        data.Timestamp,
        unit ? data.Value : this.mapBinaryMultiData(Number((data as TrendQualityValue).Value), enumTexts)
      ];
    } else {
      data = data as AggregatedSeriesResult;
      if (unit) {
        return [
          data.FromTime,
          data.ToTime,
          data.AvgY.toString(),
          data.Min.toString(),
          data.Max.toString()
        ];
      } else {
        return [
          data.FromTime,
          this.mapBinaryMultiData(Number(data.FromValue), enumTexts)
        ];
      }
    }
  }

  public ngOnDestroy(): void {
    this._subscriptions.forEach(sub => sub.unsubscribe());
    this.systemServiceSubscription.unsubscribe();
    this.productSub.unsubscribe();
  }

  protected getTranslations(): void {
    this._subscriptions.push(
      this.translateService.get([
        'TREND_FOLDER.TREND_EXPORT.FROM',
        'TREND_FOLDER.TREND_EXPORT.TO',
        'TREND_FOLDER.TREND_EXPORT.AVG',
        'TREND_FOLDER.TREND_EXPORT.MIN',
        'TREND_FOLDER.TREND_EXPORT.MAX',
        'TREND_FOLDER.TREND_EXPORT.TIMESTAMP',
        'TREND_FOLDER.TREND_EXPORT.VALUE',
        'TREND_FOLDER.TREND_EXPORT.DATA_POINT_NAME',
        'TREND_FOLDER.TREND_EXPORT.DESCRIPTION',
        'TREND_FOLDER.TREND_EXPORT.UNIT',
        'TREND_FOLDER.TREND_EXPORT.TREND_DATA_TITLE',
        'TREND_FOLDER.TREND_EXPORT.DENSITY_TEXT',
        'TREND_FOLDER.TREND_EXPORT.PAGE_TEXT',
        'TREND_FOLDER.TREND_EXPORT.OF_TEXT',
        'TREND_FOLDER.TREND_EXPORT.RUN_AT_TEXT',
        'TREND_FOLDER.TREND_EXPORT.NO_DATA_AVAILABLE',
        'TREND_FOLDER.TREND_EXPORT.DESIGNATION',
        'TREND_FOLDER.TREND_EXPORT.ALIAS',
        'TREND_FOLDER.TREND_EXPORT.QUALITY',
        'TREND_FOLDER.TREND_EXPORT.PERIOD_TABLE',
        'TREND_FOLDER.TREND_EXPORT.POINT_INFO_TABLE_LABEL',
        'TREND_FOLDER.TREND_EXPORT.DATA_TABLE_LABEL',
        'TREND_FOLDER.TREND_EXPORT.SYSTEM_LABEL'
      ]).subscribe(values => {
        this.fromLabel = values['TREND_FOLDER.TREND_EXPORT.FROM'];
        this.toLabel = values['TREND_FOLDER.TREND_EXPORT.TO'];
        this.avgLabel = values['TREND_FOLDER.TREND_EXPORT.AVG'];
        this.minLabel = values['TREND_FOLDER.TREND_EXPORT.MIN'];
        this.maxLabel = values['TREND_FOLDER.TREND_EXPORT.MAX'];
        this.timestampLabel = values['TREND_FOLDER.TREND_EXPORT.TIMESTAMP'];
        this.valueLabel = values['TREND_FOLDER.TREND_EXPORT.VALUE'];
        this.dataPointNameLabel = values['TREND_FOLDER.TREND_EXPORT.DATA_POINT_NAME'];
        this.descriptionLabel = values['TREND_FOLDER.TREND_EXPORT.DESCRIPTION'];
        this.unitLabel = values['TREND_FOLDER.TREND_EXPORT.UNIT'];
        this.trendReportTitle = values['TREND_FOLDER.TREND_EXPORT.TREND_DATA_TITLE'];
        this.sampleDensityText = values['TREND_FOLDER.TREND_EXPORT.DENSITY_TEXT'];
        this.pageText = values['TREND_FOLDER.TREND_EXPORT.PAGE_TEXT'];
        this.ofText = values['TREND_FOLDER.TREND_EXPORT.OF_TEXT'];
        this.runAtText = values['TREND_FOLDER.TREND_EXPORT.RUN_AT_TEXT'];
        this.noDataAvailableText = values['TREND_FOLDER.TREND_EXPORT.NO_DATA_AVAILABLE'];
        this.designationLabel = values['TREND_FOLDER.TREND_EXPORT.DESIGNATION'];
        this.aliasLabel = values['TREND_FOLDER.TREND_EXPORT.ALIAS'];
        this.qualityLabel = values['TREND_FOLDER.TREND_EXPORT.QUALITY'];
        this.peridTableLabel = values['TREND_FOLDER.TREND_EXPORT.PERIOD_TABLE'];
        this.pointInfoTableLebel = values['TREND_FOLDER.TREND_EXPORT.POINT_INFO_TABLE_LABEL'];
        this.dataTableHeader = values['TREND_FOLDER.TREND_EXPORT.DATA_TABLE_LABEL'];
        this.systemLabel = values['TREND_FOLDER.TREND_EXPORT.SYSTEM_LABEL'];
      })
    );
  }

  public formatDateToBrowserLocale(date: string): string {
    return new Date(date).toLocaleString(this.locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  public checkStringType(value: any): string {
    if (this.isNumber(value)) {
      return 'Number';
    } else if (this.isDate(value)) {
      return 'Date';
    }
    return 'String';
  }

  public generateFileName(): void {
    this.systemServiceSubscription = this.systemsService.getSystemsExt().subscribe(
      systems => {
        const system = systems.Systems.find(s => s.Id === this.systemId);
        this.systemName = system?.Name ?? '';
        const projectName = (system as any)?.ProjectName ?? '';
        this.fileName = `${this.systemName}_${projectName}__${new Date(this.fromDate).toDateString()}-${new Date(this.toDate).toDateString()}`;
      },
      error => {}
    );
  }

  protected abstract calculateDynamicColumnWidths(data: (string | number)[][], headers: string[]): string[];

  private isNumber(value: any): boolean {
    return !isNaN(Number(value)) && value !== ''; 
  }

  private isDate(value: any): boolean {
    if (value === '0') {
      return false;
    }
    
    const parsedDate = Date.parse(value);
    return !isNaN(parsedDate);
  }

  private getDensityTitle(key: string): string {
    switch (key) {
      case 'RawData':
        return this.translateService.instant('TREND_FOLDER.RAW_DATA');
      case 'Monthly':
        return this.translateService.instant('TREND_FOLDER.MONTHLY');
      case 'Hourly':
        return this.translateService.instant('TREND_FOLDER.HOURLY');
      case 'Daily':
        return this.translateService.instant('TREND_FOLDER.DAILY');
      case 'Weekly':
        return this.translateService.instant('TREND_FOLDER.WEEKLY');
      default: // As Shown In Chart case
        return this.translateService.instant('TREND_FOLDER.AS_SHOWN_IN_CHART');
    }
  }
}
