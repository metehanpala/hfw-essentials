import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { TrendServiceBase } from '@gms-flex/services';
import { TranslateService } from '@ngx-translate/core';
import { ModalRef } from '@simpl/element-ng';
 
import { TrendSeries } from '../common/interfaces/trendSeries';
import { TrendSeriesBase } from '../common/trendSeriesBase';
import { TrendDefinitionService } from '../services/trend-definition-service';
import { ExportFormatOption, SeriesDN } from './model/trend-export.model';
import { TrendDataHandlerService } from './services/trend-data-handler-service';
 
@Component({
  selector: 'gms-trend-export',
  templateUrl: './trend-export.component.html',
  styleUrl: './trend-export.component.css',
  standalone: false
})
export class TrendExportComponent implements OnInit {
  @ViewChild('template', { static: false }) public popupELementRefForExportModal: TemplateRef<void>;

  @Output() public readonly invalidRangeSelected = new EventEmitter<boolean>(false);

  public seriesid: string;
  public fileTypes = [{ id: 'pdf', value: 'TREND_FOLDER.PDF' }, { id: 'csv', value: 'TREND_FOLDER.CSV' }, { id: 'xlsx', value: 'TREND_FOLDER.XLSX' }];
  public sampleDensityOptions: { id: string, densityTitle: string }[] = [];
  public diffInHours: number;
  public diffInDays: number;
  public formatselected: string;
  public selectedSampleDensity: string;
  public settingsexport: boolean;
  public systemId: number;
  public exportFormatOption: ExportFormatOption = {
    FileFormat: '',
    ExportOption: '',
    systemId: 0
  };
  public seriesDN: SeriesDN[] = [];
  public fromDate: string;
  public toDate: string;
  public invalidDensitySelectedMessage = '';
  public invalidDensitySelectedInfo = '';

  private seriesN: string[] = [];
  private readonly trendSeriesId: string[] = []
  private diffInMilliseconds: number;
  private readonly modalRef?: ModalRef;

  constructor(
    private readonly trendDefinitionService: TrendDefinitionService,
    private readonly trendDataHandlerService: TrendDataHandlerService,
    private readonly translateService: TranslateService) { }

  public ngOnInit(): void {
    if (this.fileTypes && this.fileTypes.length > 0) {
      this.formatselected = this.fileTypes[0].id;
    }
    this.calculateTime();
    this.selectedSampleDensity = this.sampleDensityOptions[0]?.id;
  }

  public trackByFileId(index: number, fileType: { id: string, value: string }): string {
    return fileType.id;
  }

  public trackByDensityId(index: number, density: { id: string, densityTitle: string }): string {
    return density.id;
  }

  public calculateTime(): void {
    if (this.seriesDN || this.seriesN) {
      this.seriesDN = [];
      this.seriesN = [];
    }
    for (const [key1, value1] of this.trendDefinitionService.trendedSeriesCollection) {
      const seriesData = this.trendDefinitionService.trendedSeriesCollection.get(key1);
      this.systemId = seriesData.systemId;
      const zoomDataResponse = this.trendDefinitionService.responsezoomData;
      const startTime = zoomDataResponse.dataZoomEventrequired.rangeStart;
      const endTime = zoomDataResponse.dataZoomEventrequired.rangeEnd;
      this.fromDate = new Date(startTime).toISOString();
      this.toDate = new Date(endTime).toISOString();
      const newZoomRange = endTime - startTime;
      const unit = seriesData.unit;
      this.diffInMilliseconds = endTime - startTime;
      this.diffInHours = this.diffInMilliseconds / (1000 * 60 * 60);
      const getzoomdata = seriesData.getFromToForZoomAndPan(zoomDataResponse.dataZoomEventrequired, newZoomRange, this.fromDate, this.toDate);
      const noOfSamples = seriesData.getNumberOfSamples(this.trendDefinitionService.numberOfSamples, newZoomRange, getzoomdata.percentageFactorForNoOfSamples);
      this.seriesDN.push({
        seriesId: seriesData.trendObjectInfo.TrendseriesId,
        seriesName: seriesData.seriesCNSInfo.seriesName,
        seriesDisplayName: seriesData.seriesCNSInfo.seriesDisplayName,
        seriesDesignation: seriesData.seriesCNSInfo.seriesDesignation,
        seriesAlias: seriesData.seriesCNSInfo.seriesAlias,
        unit: unit,
        noOfSamples: noOfSamples,
        resolution: seriesData.resolution,
        enumTexts: seriesData.enumTexts ? seriesData.enumTexts : undefined
      }); 
    }
    this.invalidRangeSelected.emit(false);
  
    if (this.diffInHours >= 24) {
      const days = this.diffInMilliseconds / (1000 * 60 * 60 * 24);
      this.diffInDays = days;
    }  
    
    if (this.diffInHours <= 1) {
      this.sampleDensityOptions = this.trendDataHandlerService.getSampleDensityOptions('lessThanOrEqualOneHour');
    } else if (this.diffInHours > 1 && this.diffInHours < 24) {
      this.sampleDensityOptions = this.trendDataHandlerService.getSampleDensityOptions('betweenOneHourToTwentyFourHours');
    } else if (this.diffInDays >= 1 && this.diffInDays <= 7) {
      this.sampleDensityOptions = this.trendDataHandlerService.getSampleDensityOptions('betweenOneDayAndSevenDays');
    } else if (this.diffInDays >= 1 && this.diffInDays <= 30) {
      this.sampleDensityOptions = this.trendDataHandlerService.getSampleDensityOptions('betweenSevenDayAndThirtyDays');
    } else if (this.diffInDays > 30 && this.diffInDays <= 365) {
      this.sampleDensityOptions = this.trendDataHandlerService.getSampleDensityOptions('betweenThirtyAndThreeSixtyFiveDays');
    } else if (this.diffInDays > 365 && this.diffInDays <= 730) {
      this.sampleDensityOptions = this.trendDataHandlerService.getSampleDensityOptions('betweenThreeSixtyFiveAndSevenThirtyDays');
    } else { 
      this.sampleDensityOptions = [];
      this.invalidDensitySelectedMessage = this.translateService.instant("TREND_FOLDER.TREND_EXPORT.INVALID_DENSITY_SELECTED_MESSAGE");
      this.invalidDensitySelectedInfo = this.translateService.instant("TREND_FOLDER.TREND_EXPORT.INVALID_DENSITY_SELECTED_INFO");
      this.invalidRangeSelected.emit(true);
    }

  }
}
