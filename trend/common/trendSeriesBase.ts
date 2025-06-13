import {
  BrowserObject, PropertyDetails, PropertyInfo, TrendQualityValue,
  TrendSeriesInfo, TrendServiceBase, ValueDetails, ValueServiceBase
} from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { AxisType, DataZoomEvent, MissingData, RangeType, RemoveOlderDataFromLiveChart, TrendProperty, YAxisPosition } from '@simpl/trendviewer-ng';
import { Observable, Subscription } from 'rxjs';

import { TrendDefinitionService } from '../services/trend-definition-service';
import { QualityIconProvider } from '../services/trend-quality-icon-service';
import { TrendSnapinService } from '../services/trend-snapin.service';
import { AxisTypes } from '../shared/trend-searched-item';
import { NonTrendSeries } from './interfaces/nonTrendSeries';
import { eQuality, SeriesCNSInfo, SliderMovement, TQVEngineered, TrendDataQuality } from './interfaces/trend.models';

const ADDITIONAL_TIME = 2000;
const ONE_SECOND = 1000;

const SHOW_QUALITY_FOR: TrendDataQuality[] = [TrendDataQuality.LogInterrupted, TrendDataQuality.BufferFull,
  TrendDataQuality.InOverridden, TrendDataQuality.InFailure, TrendDataQuality.InOutOfService, TrendDataQuality.InAlarm, TrendDataQuality.DriverFailed];

const TRUE_CONSTANT = 'true';
const FALSE_CONSTANT = 'false';

export interface seriesProperties {
  seriesName: string;
  seriesDisplayName: string;
  seriesAlias: string;
  seriesDesignation: string;
  seriesLocation: string;
  type: number;
  subType: number;
}
export interface ReducedDataProperties {
  reducedData: any[];
  rightBorder: number;
  newBorder: number;
  maxTimeStamp: string;
}
export interface LiveValueBuffer {
  valArray: any[];
  missingArray: MissingData[];
  timeShiftArray: any[];
}
export interface ConditionValues {
  addBreakBeforeValue: boolean;
  addBreakAfterValue: boolean;
  dispValue: any;
}
export interface FromToForZoomAndPan {
  from: string;
  to: string;
  percentageFactorForNoOfSamples: number;
}
// The class acts as a viewmodel for trendview definition where it has properties of trend view definition returned from service.
// the methods related to retriving data from wsi, handling COVs,etc shall be addressed in this class itself.
export abstract class TrendSeriesBase {
  public accessDeniedOffline = false;
  public accessDeniedOnline = false;
  public isOfflineTsd = false;
  public seriesCNSInfo: SeriesCNSInfo = {
    seriesDisplayName: '',
    seriesName: '',
    seriesAlias: '',
    seriesLocation: '',
    seriesDesignation: '',
    type: 0,
    subType: 0
  };
  public trendObjectInfo: TrendSeriesInfo;
  public seriesIdentifier: string;
  public isBinarySeries = false;
  public textGroupId?: string;
  public systemId: number;
  public enumTexts: any;
  public unit: string;
  public resolution: number;
  public propertyType: string;
  public propertyList: TrendProperty[];
  public trendSeriesMinTimestamp?: string;
  public trendSeriesMaxTimestamp?: string;
  public lastReducedCoVDisplayed: TQVEngineered;
  public ObjectIdOfTrendLog: string;
  public ObjectIdOfTrendLogInternal: string;
  public ObjectIdOfTrendLogOnline: string;
  public ObjectIdOfTrendedObject: string;
  public position?: YAxisPosition;
  public seriesType?: AxisType;
  public subscriptions: Subscription[] = [];
  public traceModule = 'gmsSnapins_TrendSeries';
  public QUALITY_RECTANGLE_COLOR_RED = '#ffe5ff';
  public valueBuffer: any[] = [];
  private previousDataZoomEvent: DataZoomEvent;
  private currentDataZoomSliderDelta: number;
  private sliderMovement: SliderMovement = SliderMovement.None;
  // last sequence number for the buffer in case of Offline trend logs
  private lastSequenceNumberTimestamp: string = null;
  private leftBorder: any;
  private rightBorder: any;
  private newBorder: any;
  private sliceDuration: any;
  private lastValue: any = null;
  private lastActValue: any = null;
  private readonly isSeriesMultiState: Map<string, boolean>;
  private lastDisplayedCoV: TQVEngineered;
  private isNoHDBDataWorkFlow: boolean;
  private readonly isNonTrended: boolean;
  private tqvEngineered: TQVEngineered;
  constructor(public trendServiceBase: TrendServiceBase,
    public traceService: TraceService,
    public trendDefinitionService: TrendDefinitionService,
    public valueService: ValueServiceBase,
    protected trendSnapinService: TrendSnapinService,
    private readonly qualityIconProvider: QualityIconProvider) {
    this.isSeriesMultiState = new Map<string, boolean>();
  }

  public abstract cacheCov(tqv: TQVEngineered);
  public abstract getSeriesData(from: string, to: string, noOfSamples?: number, isInitialLoad?: boolean): Observable<any>;
  public abstract removeOlderCov();

  // to get the configuration for quick analysis
  public abstract getQuickAnalysisConfiguration(): RemoveOlderDataFromLiveChart;

  // flag series non trended series if it has historic data
  public abstract setIfHistoricHDBDataPresent(isHistoricDatapresent: number): void;

  public getSeriesProperties(browserObject?: BrowserObject): seriesProperties {
    return {
      seriesName: browserObject.Name,
      seriesDisplayName: browserObject.Descriptor,
      seriesAlias: browserObject.Attributes?.Alias,
      seriesDesignation: browserObject.Designation,
      seriesLocation: browserObject.Location,
      type: browserObject.Attributes?.TypeId,
      subType: browserObject.Attributes?.SubTypeId
    };
  }

  public OnTrendedPropertyValueChanged(valueDetails: ValueDetails): void {
    this.traceService.debug(this.traceModule, 'TrendSeries.OnTrendedPropertyValueChanged() ValueDetails: ', valueDetails);
    const value = valueDetails?.Value?.Value?.toLowerCase();
    if (value === TRUE_CONSTANT || value === FALSE_CONSTANT) {
      valueDetails.Value.Value = this.booleanStringValueHandler(value);
    }
    this.removeOlderCov();
    // For offline series, we request for new data when buffer value gets updated
    if (this.isOfflineTsd) {
      if (this.lastSequenceNumberTimestamp === null) {
        this.lastSequenceNumberTimestamp = this.trendSeriesMaxTimestamp;
      }
      // Here delay is added to wait for HDB write operation and to make behaviour similar to WPF client
      setTimeout(() => {
        // Getting data from last fetched time top curent time
        this.traceService.debug(this.traceModule,
          'TrendSeries.OnTrendedPropertyValueChanged().getTrendData() for trendseriesId: %s, fromDate: %s, toDate: %s, interval:%s',
          this.trendObjectInfo.TrendseriesId, this.lastSequenceNumberTimestamp,
          new Date(Date.now()).toISOString(), this.trendDefinitionService.numberOfSamples.toString());
        let startDateForReadPeriod: string;
        // Calculating start date to fetch data using ReadPeriod by subtracting current data zoom range with the current datetime.
        // So data is fetched only for the visible range and not from the last sequence time when the last data is collected.
        // the number of samples sent to get the trend data is 0.75 of the current number of samples because when we collect the data
        // it should fetch 150 samples instead of 200[considering the offline trend logs shows data till current datetime 25%,50%,0%]
        // so the values are evenly distributed on chart.
        // This could have been handled using datazoom but more effort is required.
        // NOTE: This has to be revisited when Edit Trend functionality for the number of samples is done.
        const noOfSamplesToReadPeriod: number = this.trendDefinitionService.numberOfSamples * 3 / 4;
        // Defect 1578335: Trend View does not update the view after manual upload
        // issues 1: we are reading/collecting data from HDB after 2.5 seconds. But the problem is HDBWriter has timer of 10 seconds which writes
        // data in HDB after every 10 seconds. So, from Flex we go to HDB in 2.5 seconds once we received a last_seq_num notification but by that time there is
        // no commanded data in HDB and so it doesnt show up data in chart. But if you command another value and then it shows up that value.
        // solution: ncrease timer to 10 seconds. This is not 100% perfect solution but it will increase percentage to 90% or something.
        // here another approach can be make first call in 5 seconds and if we dont receive data, make another call at 12th seconds again

        /* issues 2: From Flex, we request data of latest 5 minutes (based on general settings).
          But if your TL has data of last month and you are collecting data */
        // and if your visible ranges is 5 minutes, then we send request to get data from HDB for latest 5 minutes. And, so we dont get anythihng in response.
        // and because of this, chart doesnt move/show data and user feels like manual upload/collect command doesnt work.
        // but it should go to HDB and should show the 5 minutes data from last month (as there was previous month data)
        // solution:  make 2 WSI calls.
        //    a. With first call, get HDB data from last sequence time to current with expected intervals. It will tell us that whether
        //        there is data or not in HDB. If we receive data then make another call with visible range only
        //    b. if we dont recive data from first call, then dont make another call.
        this.subscriptions.push(this.trendServiceBase.getBorderTimeRangeForTrend(this.trendObjectInfo.TrendseriesId).subscribe(borderRange => {
          this.traceService.debug(this.traceModule, 'OfflineTrendlog.OnTrendedPropertyValueChanged.getBorderTimeRangeForTrend():', borderRange);
          if (borderRange) {
            // if we get the borders and if the right border is latest, then only bring the whole data
            // lastSequenceNumberTimestamp is the right side value shown in chart if there is no single record was present at the time of loading chart
            if (this.lastSequenceNumberTimestamp !== undefined) {
              let isToContinue = false;
              // Use case 1: If your chart doesnt have data in HDB and then you command a value. And if that value is latest than what chart is shown
              // Use care 2: If your TL has some data loaded already in chart and then user commands some value from simulater/telnet
              if ((borderRange.To !== borderRange.From && new Date(this.lastSequenceNumberTimestamp) <= new Date(borderRange.To)) ||
                (borderRange.To === borderRange.From && new Date(this.lastSequenceNumberTimestamp) <= new Date(borderRange.To))) {
                if (this.currentDataZoomSliderDelta !== undefined) {
                  startDateForReadPeriod = new Date(new Date(borderRange.To).getTime() - this.currentDataZoomSliderDelta).toISOString();
                } else {
                  startDateForReadPeriod = this.lastSequenceNumberTimestamp;
                }
                isToContinue = true;
              } else if (borderRange.To === borderRange.From && new Date(this.lastSequenceNumberTimestamp) > new Date(borderRange.To)) {
                // from == to means we have single record in HDB
                /* Use case 3: If user TL doesnt have data in HDB. user selects chart in Flex.
                   Commads some value older than visible range in HDB. */
                this.traceService.debug(this.traceModule,
                  'OfflineTrendlog.OnTrendedPropertyValueChanged().getTrendData() response: lastSequenceNumberTimestamp > borderRange.To',
                  borderRange);
                /* we should always show the data with respect to right border.
                   If you are looking at the future and you get only record from HDB which is in past then */
                // we need to change last sequence to the new record
                this.lastSequenceNumberTimestamp = new Date(borderRange.To).toISOString();
                if (this.currentDataZoomSliderDelta !== undefined) {
                  startDateForReadPeriod = new Date(new Date(this.lastSequenceNumberTimestamp).getTime() - this.currentDataZoomSliderDelta).toISOString();
                } else {
                  startDateForReadPeriod = this.lastSequenceNumberTimestamp;
                }
                // as we dont have data in chart and we received one record after manual upload and that record is older than the range that we show in chart
                // so we need to change the right border and new border to use in reduction algorithm
                this.rightBorder = new Date(borderRange.To).getTime();
                this.newBorder = this.rightBorder + this.sliceDuration;
                isToContinue = true;
              }

              if (isToContinue) {
                // readPeriod excludes the to border. So adding extra one second so that we will get the last record also
                const toDateTime = new Date(borderRange.To).getTime() + 1000;
                this.subscriptions.push(this.trendServiceBase.getTrendData(this.trendObjectInfo.TrendseriesId, startDateForReadPeriod,
                  new Date(toDateTime).toISOString(), noOfSamplesToReadPeriod.toString()).subscribe(trendDataResult => {
                  this.traceService.debug(this.traceModule, 'OfflineTrendlog.OnTrendedPropertyValueChanged().getTrendData() response: ',
                    trendDataResult);
                  if (trendDataResult != null) {
                    trendDataResult.Series.forEach(trendQualityValue => {
                      const tqv: TQVEngineered = new TQVEngineered(trendQualityValue.Timestamp,
                        trendQualityValue.Value,
                        trendQualityValue.Quality, JSON.parse(trendQualityValue.QualityGood));
                      this.valueBuffer.push(tqv);
                      this.cacheCov(tqv);
                    });
                    // the last sequence number time should be updated as the last value's time when we collect
                    if (trendDataResult.Series.length > 0) {
                      this.lastSequenceNumberTimestamp = this.valueBuffer[this.valueBuffer.length - 1].Timestamp.toISOString();
                    }
                  }
                }, error => {
                  this.traceService.error(this.traceModule,
                    'OfflineTrendlog.OnTrendedPropertyValueChanged().getTrendData() error: ',
                    error);
                }));
              }
            } else {
              /* as we dont have border data/we dont have latest data, we dont need to make another call
                 and dont need to try to bring data as there is no latest data in HDB */
              this.traceService.debug(this.traceModule,
                'OfflineTrendlog.OnTrendedPropertyValueChanged.getBorderTimeRangeForTrend(): there is no right border greater than what is shown in chart');
            }
          }
        }));

        // Storing the last time when records where fetched, so that when next time when data is needed we know the from time.
        // Also, fetch data from last minute to avoid data loss
        // this.lastSequenceNumberTimestamp = new Date(Date.now() - 60 * 1000).toISOString();
        // now we are going to HDB after 11 seconds and checks if we have new data. 2.5 seconds was not enough as
        // HDB itself has 10 seconds timer to push data in HDB
      }, 11000);
    } else { // For online series we store the value changes
      const tqv: TQVEngineered = new TQVEngineered(valueDetails.Value.Timestamp, valueDetails.Value.Value,
        valueDetails.Value.Quality, valueDetails.Value.QualityGood);
      // To display current value of newly trended series following code is added
      // on subscription current may come with older timestamp (time when the device was connected or value read by PVSS)
      // In above case that value will be filtered out at reduction, hence setting the timestamp to current date and time
      // assuming the COV will have older timestamp in this case only
      const currentTime = new Date();
      currentTime.setMilliseconds(0);
      if (tqv.Timestamp < currentTime) {
        tqv.Timestamp = currentTime;
      }

      // Due the the WSI Defect 1190006 : On commanding any subscription enabled Bacnet datapoint from Desigo CC Client,
      // generates multiple notifications for the same value commanded, we are getting multiple COVs with previously value
      // which is getting plotted on chart hence wrong data is displayed on the charts. To avoid this, we are checking
      // if last buffer value and current change of value (cov) are same values we are not adding it in buffer data
      // i.e. the live trending data scenarios.
      const bufferLength = this.valueBuffer.length;
      let lastBufferValue: TQVEngineered;
      if (bufferLength) {
        lastBufferValue = this.valueBuffer[bufferLength - 1];
        if (lastBufferValue.Value !== tqv.Value) {
          this.valueBuffer.push(tqv);
          this.cacheCov(tqv);
        }
      } else {
        this.valueBuffer.push(tqv);
        this.cacheCov(tqv);
      }
    }
  }

  // Gets the current value buffer for offline/online series
  public getLiveValueBuffer(): LiveValueBuffer {
    this.traceService.debug(this.traceModule,
      'TrendSeries.getLiveValueBuffer(): get reduced data of value buffer ',
      this.valueBuffer);
    // Splice: we clear the buffer When buffer Value is retrieved
    const bufferData: TQVEngineered[] = this.valueBuffer;
    const reducedDataProperties: ReducedDataProperties = this.getReducedData(bufferData,
      this.rightBorder, this.newBorder, this.sliceDuration, this.trendSeriesMaxTimestamp);
    const reducedData = reducedDataProperties.reducedData;
    this.rightBorder = reducedDataProperties.rightBorder;
    this.newBorder = reducedDataProperties.newBorder;
    this.trendSeriesMaxTimestamp = reducedDataProperties.maxTimeStamp;
    const spliceIndex: number = this.valueBuffer.findIndex(x => x.Timestamp.getTime() > this.rightBorder);
    this.valueBuffer = spliceIndex > 0 ? this.valueBuffer.splice(spliceIndex, this.valueBuffer.length) : this.valueBuffer;
    this.traceService.debug(this.traceModule, 'TrendSeries.getLiveValueBuffer() reduced data:', reducedData);

    // Defect: 961208 - send min and max COVs from buffer with last plotted COV for each call for live data
    // if reduced data is not available else send reduced data
    const nonReducedData: any[] = [];
    let displayData: TQVEngineered[] = [];
    if (this.lastReducedCoVDisplayed !== undefined) {
      nonReducedData.push(this.lastReducedCoVDisplayed);
    }
    if (reducedData.length === 0) {
      // Defect 968491: Trend in flex - Improper data is shown in offline trend log.
      if (this.isOfflineTsd) {
        displayData = reducedData;
      } else {
        displayData = nonReducedData.concat(this.getMinMaxOfValueBuffer());
        if (displayData.length === 1 || (this.lastDisplayedCoV && displayData.some(data => data.Timestamp === this.lastDisplayedCoV.Timestamp))) {
          // If displayData.length == 1 => no new data but only last displyed cov is added,
          // If displayData.Timestamp has some min max values which have same Timestamp with last displayed cov then,
          // empty the displayData for dummy data to be added for continuous straight line for live update.
          displayData = [];
        }
      }
    } else {
      this.lastReducedCoVDisplayed = reducedData[reducedData.length - 1];
      displayData = nonReducedData.concat(reducedData);
    }

    displayData = displayData.sort((a: TQVEngineered, b: TQVEngineered) => a.Timestamp.getTime() - b.Timestamp.getTime());

    if (displayData && displayData.length > 0) {
      this.lastDisplayedCoV = displayData[displayData.length - 1];
    }

    const calculatedData: any[] = [];
    const missingData: MissingData[] = [];
    const timeShiftData: any[] = [];
    displayData.forEach(rawTqvData => {
      if (!isNullOrUndefined(rawTqvData)) {
        this.populateTrendData(rawTqvData, this.trendObjectInfo.TrendseriesId, calculatedData, missingData, timeShiftData);
      } else {
        this.traceService.debug(this.traceModule, 'The reduction gave wrong data', reducedData);
      }
    });
    return { valArray: calculatedData, missingArray: missingData, timeShiftArray: timeShiftData };
  }

  // calculate the zoom level for the series
  public calculateZoomLevel(newDataZoomEvent: DataZoomEvent): number {
    this.traceService.debug(this.traceModule, 'TrendSeries.calculateZoomLevel(): calculate the zoom level for the series', newDataZoomEvent);
    let newRangeDelta: any = newDataZoomEvent.rangeEnd - newDataZoomEvent.rangeStart;
    this.currentDataZoomSliderDelta = newRangeDelta;
    if (this.previousDataZoomEvent) {
      const previousRangeDelta: any = this.previousDataZoomEvent.rangeEnd - this.previousDataZoomEvent.rangeStart;
      // Detecting whether it is slider movement or zoom in/out
      // Need to detect it here only since the total slider range is received here.(after this getSeriesData() receives delta range)
      if (previousRangeDelta === newRangeDelta) {
        this.sliderMovement = this.detectSliderMovement(newDataZoomEvent);
      } else {
        this.sliderMovement = SliderMovement.None;
      }
    }
    this.previousDataZoomEvent = newDataZoomEvent;

    // The zoomLevel calculation is logarithmic as we want the following behaviour:
    // Whenever the user zooms in by a well defined factor (e.g. 60%) the zoomLevel shall increased by 1.
    // Example:
    // No zoom (full range): zoomLevel = 0;
    // Zoom in by 60% of full range: zoomLevel = 1;
    // Zoom in again by 60% (results in 36% of full range): zoomLevel = 2;
    // In addition, no increase of the zoomLevel is needed whenever the zoomed range is below 1
    const factor = 80; // zoom level change set on 80% zooming
    if (newRangeDelta < 1000) {
      // 1 second limitation: no further zooming
      // Currently HDB throws exception on rquesting data at milliseconds
      newRangeDelta = 1000;
    }
    const minDate: Date = new Date(this.trendSeriesMinTimestamp);
    const maxDate: Date = new Date(this.trendSeriesMaxTimestamp);
    const calculatedZoomLevel: number = Math.floor(((Math.log10((maxDate.valueOf() - minDate.valueOf()) / newRangeDelta)) / (Math.log10(100 / factor))));
    this.traceService.debug(this.traceModule, 'TrendSeries.calculateZoomLevel() calculated the zoom level:', calculatedZoomLevel);
    /* in case zoom level zero then it is considered as full view but
      it was not triggering for zoom event. so as to populate the data */
    // but expected is to get trigger for zoom event and now we are setting 1020 which is out of range of
    // zoom level values. Then we are getting zoom event fired for full view.
    return (calculatedZoomLevel === 0 ? 1020 : calculatedZoomLevel);
  }

  // Get the from to range on zooming
  public getFromToForZoomAndPan(range: RangeType, newZoomRange: number, from: string, to: string): FromToForZoomAndPan {
    this.traceService.debug(this.traceModule,
      'TrendSeries.getFromToForZoomAndPan(): Get the from to range on zooming for- RangeType: %s, newZoomRange: %s, from: %s, to:%s',
      range, newZoomRange, from, to);
    let rangeForPecentage: number;
    const additionalRangeFactor = 50;

    if (this.sliderMovement !== SliderMovement.None) {
      rangeForPecentage = this.previousDataZoomEvent.rangeEnd - this.previousDataZoomEvent.rangeStart;
    } else {
      rangeForPecentage = newZoomRange;
    }
    const extraRange: number = (rangeForPecentage * additionalRangeFactor) / 100;
    let actualFromRange: number;
    let actualToRange: number;
    let fromRange: number;
    if (!isNaN(range.rangeStart)) {
      if (this.sliderMovement === SliderMovement.Right) {
        fromRange = range.rangeStart;
      } else {
        fromRange = range.rangeStart - extraRange;
      }

      actualFromRange = fromRange;
      if (fromRange < new Date(this.trendSeriesMinTimestamp).getTime()) {
        fromRange = new Date(this.trendSeriesMinTimestamp).getTime();
      }

      from = new Date(fromRange).toISOString();
    }
    let toRange: number;
    if (!isNaN(range.rangeEnd)) {
      if (this.sliderMovement === SliderMovement.Left) {
        toRange = range.rangeEnd;
      } else {
        toRange = range.rangeEnd + extraRange;
      }

      actualToRange = toRange;
      if (toRange > new Date(this.trendSeriesMaxTimestamp).getTime()) {
        // when we change timerange in edit mode, we have to display current data so to handle that case
        // assigned trendSeriesMaxTimestamp to current date time.
        this.trendSeriesMaxTimestamp = new Date().toISOString();
        toRange = new Date(this.trendSeriesMaxTimestamp).getTime();
      }
      to = new Date(toRange).toISOString();
    }
    const actualTotalRange = actualToRange - actualFromRange;
    const currentTotalRange = toRange - fromRange;
    const percentageFactorForNoOfSamples = currentTotalRange / actualTotalRange;

    this.traceService.debug(this.traceModule, 'TrendSeries.getFromToForZoomAndPan(): ', { from, to });
    return { from, to, percentageFactorForNoOfSamples };
  }

  // get the appropriate number of samples to be fetched from WSI
  public getNumberOfSamples(noOfSamples: number, newZoomRange: number, percentageFactorForNoSamples: number): number {
    this.traceService.info(this.traceModule, 'TrendSeries.getNumberOfSamples(): percentageFactorForNoSamples:' + percentageFactorForNoSamples
      + ', No of samples: ' + noOfSamples);
    this.traceService.debug(this.traceModule, 'TrendSeries.getNumberOfSamples(): get the appropriate number of samples to be fetched from WSI: ',
      noOfSamples, newZoomRange);
    // Recalculation of no of samples is needed due to following case:
    // Initially chart is loaded with full range data.(say 1 Jun 2019 to 30 Jun 2019)
    // Zoom in for a perticular range (say 4 Jun to 10 Jun)
    // Move the slider a little to right. do not zoom, just move slider (new range ON SLIDER becomes 6 Jun to 12 Jun)
    // Due to optimization on control side, we receive only delta range here (i.e received range becomes 10 Jun to 12 Jun)
    // Fetching the same number of records for this small range (10 Jun to 12 Jun) creates very dense curve in this interval,
    // also the number of records on graph in this case are more than the configured number
    // The no of samples in this case are calculated in proportion to the zoom range.
    // There is a possibility of more no of records (more than configured) loaded in this case if the data is not evenly distributed
    if (this.sliderMovement !== SliderMovement.None) {
      const zoomRange: any = this.previousDataZoomEvent.rangeEnd - this.previousDataZoomEvent.rangeStart;
      // Fixes 868980
      // Since we have doubled the no of samples, in panning, the no shall be reduced as earlier
      noOfSamples = Math.floor(noOfSamples / 2);
      noOfSamples = Math.floor((newZoomRange / zoomRange) * noOfSamples);
      this.traceService.debug(this.traceModule, 'TrendSeries.getNumberOfSamples(): number of samples', noOfSamples);
    } else {
      noOfSamples = Math.floor(noOfSamples * percentageFactorForNoSamples);
    }

    if (noOfSamples <= 0) {
      // When the slider movement is very small, no of samples may be around zero. when interval is passed as zero
      // to wsi, all the data from that range is retrieved, which caused cluttered data is small range.
      // thus reducing the no of samples.
      noOfSamples = 2;
    }
    this.traceService.info(this.traceModule, 'TrendSeries.getNumberOfSamples(): calculated number of samples:' + noOfSamples);
    return noOfSamples;
  }

  // Get the data between specified time range without adding any boundary values
  public getDataForRequestedRange(from: string, to: string, noOfSamples: number, observer: any, trendSeriesinfo: any, isInitialLoad: boolean = false): void {
    this.traceService.debug(this.traceModule, 'TrendSeries.getDataForRequestedRange() from: %s, to:%s, noOfSamples: %s', from, to, noOfSamples);
    // trend series id can be null if there is any error from WSI. in such cases there is no meaning in requesting data
    // Currently identified case when WSI returns error(while requesting trend series id) is when we trend a new object in system,
    // its treded information is not available in WSI for 5 minutes (WSI desgin of fetching new trend info every 5 minutes)and it throws exception
    const isOfflineTsd = trendSeriesinfo?.isOfflineTsd;
    const isBinarySeries = trendSeriesinfo?.isBinarySeries;
    const fromDateMilliseconds = new Date(from).getTime();
    const toDateMilliseconds = new Date(to).getTime();
    if ((toDateMilliseconds - fromDateMilliseconds) < ONE_SECOND) {
      // If difference between toDate and fromDate is less than 1 second i.e. 1000 milliseconds
      // we assign a difference of 1 second to avoid WSI divide by zero error.
      from = new Date(toDateMilliseconds - ONE_SECOND).toISOString();
    }
    this.subscriptions.push(this.getSeriesData(from, to, noOfSamples, isInitialLoad)
      .subscribe(trendDataResult => {
        this.traceService.debug(this.traceModule, 'TrendSeries.getDataForRequestedRange().getTrendData() reponse: ', trendDataResult);
        let chartData: any[] = [];
        const missingData: MissingData[] = [];
        const timeShiftData: any[] = [];
        this.isNoHDBDataWorkFlow = false;
        if (trendDataResult === null) {
          this.handleNoDataFromHDBCase(observer, trendSeriesinfo, from);
        } else if (trendDataResult?.Series && trendDataResult?.Series.length > 0) {
          /** trendDataresult can be null in case of any exception from WSI */
          // When there is one single record in HDB, we are adding one dummy record
          if (trendDataResult.Series.length === 1) {
            const dummySeries: TrendQualityValue = Object.assign({}, trendDataResult.Series[0]);
            dummySeries.Timestamp = new Date(new Date(trendDataResult.Series[0].Timestamp).valueOf() + ADDITIONAL_TIME).toISOString();
            trendDataResult.Series.push(dummySeries);

          }
          trendDataResult.Series.forEach(tqv => {
            if (tqv !== undefined) {
              const tqvEngg: TQVEngineered = new TQVEngineered(tqv.Timestamp, tqv.Value, tqv.Quality, JSON.parse(tqv.QualityGood));
              this.populateTrendData(tqvEngg, this.trendObjectInfo.TrendseriesId, chartData, missingData, timeShiftData);
            }
          });
          const lastElement: any = trendDataResult.Series[trendDataResult.Series.length - 1];

          // Removing milliseconds from the dates as they are insiginficant and can affect the date comparision
          const maxTime: Date = new Date(this.trendSeriesMaxTimestamp);
          maxTime.setMilliseconds(0);
          const TQVMaxTime: Date = new Date(lastElement.Timestamp);
          TQVMaxTime.setMilliseconds(0);

          // if the slider is moved to the right side updating last displayed COV
          if (TQVMaxTime >= maxTime) {
            this.lastReducedCoVDisplayed = new TQVEngineered(lastElement.Timestamp, lastElement.Value, lastElement.Quality,
              JSON.parse(lastElement.QualityGood));
          }
        } else if (isInitialLoad) {
          chartData = [[new Date(from).getTime(), null], [new Date(to).getTime(), null]];
        }
        this.traceService.info(this.traceModule, 'TrendSeries.getDataForRequestedRange(): Received data length:' + chartData.length);
        if (chartData.length > 0) {
          if (isBinarySeries && !isOfflineTsd) {
            this.trendDefinitionService.dummyDataForBinaryQuality(chartData, missingData);
          }
          // preparing offline TL quality
          if (isOfflineTsd) {
            this.trendDefinitionService.dummyDataForOfflineTLQuality(chartData, missingData, false);
          }
        }
        if (!this.isNoHDBDataWorkFlow) {
          observer.next({ chartData, missingData, timeShiftData: timeShiftData.length > 0 ? timeShiftData : null });
        }
      },
      error => {
        this.traceService.error(this.traceModule, 'TrendSeries.getDataForRequestedRange().getTrendData() error: ', error);
        observer.next({ chartData: [], missingData: [] });
      }
      ));
  }

  public unsubscribeSeriesSpecificRequests(): void {
    this.traceService.debug(this.traceModule, 'TrendSeries.unsubscribeSeriesSpecificRequests()');
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }

  public setIntervalforCOVReduction(numberOfSamples: number): void {
    this.traceService.debug(this.traceModule, 'TrendSeries.setIntervalforCOVReduction() Number of samples', numberOfSamples);
    this.leftBorder = this.previousDataZoomEvent?.rangeStart ?
      this.previousDataZoomEvent.rangeStart : new Date(this.trendSeriesMinTimestamp).getTime();
    this.rightBorder = this.previousDataZoomEvent?.rangeEnd ?
      this.previousDataZoomEvent.rangeEnd : new Date(this.trendSeriesMaxTimestamp).getTime();
    // For each slice, 2 values are selected i.e. min and max.
    const NO_OF_SLICES: number = numberOfSamples / 2;
    // the calculated interval is same as in the standard client.
    this.sliceDuration = (this.rightBorder - this.leftBorder) / NO_OF_SLICES;
    this.newBorder = this.rightBorder + this.sliceDuration;
    this.traceService.debug(this.traceModule, 'TrendSeries.setIntervalforCOVReduction() New border:', this.newBorder);
  }

  // Gets the property name information to be displayed on the chart
  // If the property is default property, no property info is shown, return empty in this case
  public setPropertyInfo(propertyInfo: PropertyInfo<PropertyDetails>, trendedProp: string, nonTrendSeries?: NonTrendSeries): string {
    let propName = '';
    if (nonTrendSeries) {
      this.propertyType = nonTrendSeries.propertyType;
      this.textGroupId = nonTrendSeries.textGroupId;
      this.unit = nonTrendSeries.unit;
      this.resolution = nonTrendSeries.resolution;
    } else if (propertyInfo) {
      propertyInfo.Properties.forEach(prop => {
        if (prop.PropertyName === trendedProp) {
          this.propertyType = prop.Type;
          this.textGroupId = prop.TextTable;
          this.unit = prop.UnitDescriptor;
          this.resolution = prop.Resolution;
          if (propertyInfo.Attributes.DefaultProperty !== trendedProp) {
            propName = prop.Descriptor;
          }
        }
      });
    }
    this.checkIfBinary();
    return propName;
  }

  // sets the information of series names based on displaymodes
  // The information is cached and used later when mode changes
  public setSeriesNames(propName: string, seriesProperties: seriesProperties): void {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.getSeriesNames() series names based on displaymodes');
    this.seriesCNSInfo.seriesName = seriesProperties.seriesName;
    this.seriesCNSInfo.seriesDisplayName = seriesProperties.seriesDisplayName;
    this.seriesCNSInfo.seriesAlias = seriesProperties.seriesAlias;
    this.seriesCNSInfo.seriesDesignation = seriesProperties.seriesDesignation;
    this.seriesCNSInfo.seriesLocation = seriesProperties.seriesLocation;
    this.seriesCNSInfo.type = seriesProperties.type;
    this.seriesCNSInfo.subType = seriesProperties.subType;
    if (propName && propName.length > 0) {
      this.seriesCNSInfo.seriesName += '.' + propName;
      this.seriesCNSInfo.seriesDisplayName += '.' + propName;
      if (this.seriesCNSInfo.seriesAlias) { this.seriesCNSInfo.seriesAlias += '.' + propName; }
      this.seriesCNSInfo.seriesDesignation += '.' + propName;
      this.seriesCNSInfo.seriesLocation += '.' + propName;
    }
  }

  public getReducedData(bufferData: TQVEngineered[], rightBorder: number, newBorder: number,
    sliceDuration: number, trendSeriesMaxTimestamp: string): ReducedDataProperties {
    const reducedData: any[] = [];
    let slice: TQVEngineered[] = [];
    let sliceArray: any[] = [];
    let sliceIndex = 0;
    let itemIndex = 0;
    bufferData.forEach(cov => {
      // if item is in between rBorder and newBorder
      // this second condition is for - if there is only one item in the cache and it is last item
      const COVT: any = cov.Timestamp.getTime();
      if (rightBorder <= COVT && COVT <= newBorder) {
        // push this item to next interval
        slice.push(cov);
        const currentTime: number = new Date().getTime();

        // if element is last item and it is equal to newBorder, then we need to add that element to consider this as new interval
        // CURRENT time check is added if there is only one record and is inbetween somewhere in slice
        if (rightBorder <= COVT && (COVT === newBorder || newBorder <= currentTime) && bufferData.length === itemIndex + 1) {
          rightBorder = newBorder;
          newBorder = newBorder + sliceDuration;
          sliceArray.push([sliceIndex, slice]);
          slice = [];
          sliceIndex++;
        }
      } else if (COVT > newBorder) {

        // this finalises the current slice
        if (slice.length > 0 && COVT <= newBorder + sliceDuration) {
          rightBorder = newBorder;
          newBorder = newBorder + sliceDuration;
          // finalise the interval array
          sliceArray.push([sliceIndex, slice]);
          // remove all items from temp array and missed series item array
          slice = [];
          sliceIndex++;

          // this adds cov in next slice
          slice.push(cov);
        } else if (newBorder + sliceDuration <= COVT) { /**  this should happen for gap of data in slices and if there is no data for initial few slices
            // adding = (equal), if gives some issue, need to remove */
          // this adds cov in current slice
          slice.push(cov);
          rightBorder = COVT;
          newBorder = COVT + sliceDuration;
          // finalise the interval array
          sliceArray.push([sliceIndex, slice]);
          // remove all items from temp array and missed series item array
          slice = [];
          sliceIndex++;
        } else {
          slice.push(cov);
          // If the cov is the last cov in buffer and the timestamp for it is greater than the newBorder this values
          // gets unused if the slice dosen't get finalized. Hence we need to finalize the slice if this cov is the
          // last value in buffer.
          if (bufferData.length === itemIndex + 1) {
            // add to the current slice and finalize it, if this is the last value in buffer.
            rightBorder = newBorder;
            newBorder = newBorder + sliceDuration;
            // finalise the interval array
            sliceArray.push([sliceIndex, slice]);
          }
        }
      }
      itemIndex++;
    });

    sliceArray.forEach(sliceItem => {
      if (sliceItem.length > 1) {
        let max: any;
        let min: any;
        let maxV: any;
        let minV: any;
        let firstNonVal: TQVEngineered;

        // 1. get min and max date and values first
        sliceItem[1].forEach(element => {
          if (max === undefined || max < element.Timestamp.getTime()) {
            max = element.Timestamp;
          }
          if (min === undefined || min > element.Timestamp.getTime()) {
            min = element.Timestamp;
          }
          if (maxV === undefined || maxV < element.Value) {
            maxV = element.Value;
          }
          if (minV === undefined || minV > element.Value) {
            minV = element.Value;
          }
        });

        // 2. get min amd max values
        const minArray: any[] = [];
        const maxArray: any[] = [];
        sliceItem[1].forEach(element => {
          if (minV === element.Value) {
            minArray.push(element);
          }
          if (maxV === element.Value) {
            maxArray.push(element);
          }
          if (element.QualityGood === false) {
            const quality: any = this.qualityIconProvider.getIconConverted(element.Quality, element.Value);
            if (quality.qualityValue === eQuality.NoValue_Driver_Failed) {
              firstNonVal = element; // Driver failed quality data need to be added in reduced data
            }
          }
        });

        // 3. get date for min and max values
        if (minArray.length > 0 && minArray[0] !== undefined && minArray[0].Timestamp !== undefined) {
          min = minArray[0].Timestamp;
        }
        if (maxArray.length > 0 && maxArray[maxArray.length - 1] !== undefined && maxArray[maxArray.length - 1].Timestamp !== undefined) {
          max = maxArray[maxArray.length - 1].Timestamp;
        }

        const seriesMinItem: any = minArray[0];
        const seriesMaxItem: any = maxArray[maxArray.length - 1];

        if (min < max) {
          if (seriesMinItem) {
            reducedData.push(seriesMinItem);
          }
          if (seriesMaxItem) {
            reducedData.push(seriesMaxItem);
          }
          // eslint-disable-next-line no-warning-comments
          // TODO: incase when there is no data in HDB, min and max Timestamp are empty. check how to handle it here
          if (max > trendSeriesMaxTimestamp) {
            // converting to string as max type is Date & used Date and time both in further calculation
            trendSeriesMaxTimestamp = (max).toISOString();
          }
        } else if (min === max) {
          if (seriesMinItem) {
            reducedData.push(seriesMinItem);
          }
          if (max > trendSeriesMaxTimestamp) {
            // converting to string as max type is Date & used Date and time both in further calculation
            trendSeriesMaxTimestamp = (max).toISOString();
          }
        } else {
          if (seriesMaxItem) {
            reducedData.push(seriesMaxItem);
          }
          if (seriesMinItem) {
            reducedData.push(seriesMinItem);
          }
          if (min > trendSeriesMaxTimestamp) {
            // converting to string as min type is Date & used Date and time both in further calculation
            trendSeriesMaxTimestamp = (min).toISOString();
          }
        }
        // if the Value has driver failed quality, add it to the reduced data
        if (firstNonVal !== undefined) {
          if (!reducedData.some(d => d === firstNonVal)) {
            reducedData.push(firstNonVal);
          }
        }
      }
    });
    sliceArray = [];
    bufferData = [];
    sliceIndex = 0;
    return { reducedData, rightBorder, newBorder, maxTimeStamp: trendSeriesMaxTimestamp };
  }

  public getBufferValue(): any[] {
    return this.valueBuffer;
  }
  public handleNoDataFromHDBCase(observer: any, trendSeriesinfo: any, fromDate: string): void {
    // If trendDataResult implied no data in HDB or no record for requested time range. In such cases need to read point value
    // to show continuous straight line on the chart.
    let chartData = [];
    this.isNoHDBDataWorkFlow = true;
    const isBinarySeries = trendSeriesinfo.isBinarySeries;
    const initalValueFromDevice = this.valueService.readValue(trendSeriesinfo.trendObjectInfo.ObjectId, true).subscribe(value => {
      if (value.length > 0 && value[0].Value) {
        const valueData = value[0].Value.Value.toLowerCase();
        if (valueData === TRUE_CONSTANT || valueData === FALSE_CONSTANT) {
          value[0].Value.Value = this.booleanStringValueHandler(valueData);
        }
        const toDummy = [new Date().getTime(), value[0].Value.Value];
        const fromDummy = [this.trendSnapinService.generateDefaultTimeRangeDifference(new Date()), null];

        if (isBinarySeries) {
          // Dummy value for binary and multi state series should be passes as NaN instead of null to avoid getting a staright line
          // towards the left at the default state of binary and multi state.
          fromDummy[1] = NaN;
          const convertedEnumTextValue = this.trendSnapinService.getEnumString(trendSeriesinfo.trendObjectInfo.TrendseriesId,
            Number.parseFloat(value[0].Value.Value));
          if (!convertedEnumTextValue.IsError && convertedEnumTextValue.convertedValue) {
            toDummy[1] = this.trendSnapinService.getEnumString(trendSeriesinfo.trendObjectInfo.TrendseriesId,
              Number.parseFloat(value[0].Value.Value)).convertedValue;
          }
        }
        chartData = [fromDummy, toDummy];
        const missingData: MissingData[] = [];
        const timeShiftData: any[] = [];
        this.tqvEngineered = new TQVEngineered(this.tqvEngineered?.Timestamp.toISOString() ?? value[0].Value.Timestamp, value[0].Value.Value,
          value[0].Value.Quality, value[0].Value.QualityGood);
        this.populateTrendData(this.tqvEngineered, trendSeriesinfo.trendObjectInfo.TrendseriesId, chartData, missingData, timeShiftData);
        observer.next({ chartData, missingData, timeShiftData });
        this.isNoHDBDataWorkFlow = false;
        if (initalValueFromDevice) {
          initalValueFromDevice.unsubscribe();
        }
      }
    });
  }

  private checkIfBinary(): void {
    if (this.propertyType === 'ExtendedBool' || this.propertyType === 'ExtendedEnum' || this.propertyType === 'Enum' || this.propertyType === 'Boolean' ||
      this.propertyType === 'ExtendedBitString') {
      this.isBinarySeries = true;
      this.seriesType = AxisTypes.Category;
    } else {
      this.seriesType = AxisTypes.Value;
    }
  }

  // Defect: 961208 - gets the min and max from non reduced data
  private getMinMaxOfValueBuffer(): TQVEngineered[] {
    let maxV: any;
    let minV: any;
    let minCOV: TQVEngineered;
    let maxCOV: TQVEngineered;
    const minMaxArray: TQVEngineered[] = [];
    // 1. get min and max date and values first
    const valueBufferSorted = this.valueBuffer.concat().sort((a: TQVEngineered, b: TQVEngineered) => b.Timestamp.getTime() - a.Timestamp.getTime());
    valueBufferSorted.forEach(element => {
      if (maxV === undefined || maxV <= element.value) {
        maxV = element.value;
        maxCOV = element;
      }
      if (minV === undefined || minV > element.value) {
        minV = element.value;
        minCOV = element;
      }
    });

    if (minCOV !== undefined && maxCOV !== undefined) {
      if (minV === maxV) {
        if (minCOV.Timestamp !== maxCOV.Timestamp) {
          minMaxArray.push(minCOV);
        }
      } else {
        minMaxArray.push(minCOV);
        minMaxArray.push(maxCOV);
      }
    }
    return minMaxArray;
  }

  // Detects whether slider is moved left or right
  private detectSliderMovement(newDataZoomEvent: DataZoomEvent): SliderMovement {
    if (newDataZoomEvent.rangeStart > this.previousDataZoomEvent.rangeStart) {
      return SliderMovement.Right;
    } else {
      return SliderMovement.Left;
    }
  }

  // earlier way where we are setting symbol for the data -> disadvantage found the marker/qualityicon is getting displayed.
  private populateTrendData(tqv: TQVEngineered, trendSeriesId: string, chartData: any[], missingData: MissingData[], timeShiftData: any[]): any[] {
    this.traceService.debug(this.traceModule, 'TrendSeries.populateTrendData() trendseriesId:%s, tqv:%s', trendSeriesId, tqv);
    // / is type enum
    // ok then convert
    // if conversion failed show missing data
    // successful -> show actual data
    // if not enum/multistate
    // do not convert
    let actVal: any = tqv.Value;
    let isLastValue = false;
    const trendQualityInfo: any = this.qualityIconProvider.getIconConverted(tqv.Quality, actVal);

    const dateToPush: Date = tqv.Timestamp;

    let isSeriesEnum = false;
    let returnResponse: any = {};
    let convertedValue: any;
    const needToDraw: boolean = this.isSeriesMultiState.has(trendSeriesId);
    if (!needToDraw || (needToDraw && this.isSeriesMultiState.get(trendSeriesId))) {
      returnResponse = this.trendSnapinService.getEnumString(trendSeriesId, actVal);
      this.isSeriesMultiState.set(trendSeriesId, returnResponse.IsMultiState);
      if (returnResponse.IsMultiState) {
        isSeriesEnum = true;
        if (returnResponse.IsError) {
          convertedValue = NaN;
        } else {
          convertedValue = returnResponse.convertedValue;
        }
      }
    }
    if (((trendQualityInfo.qualityValue & eQuality.NoValue_TimeShifted) !== 0)) {
      isLastValue = true;
      actVal = this.lastValue;
      const point: any[] = [(dateToPush), this.lastValue];
      timeShiftData.push(point);
    }
    if (((trendQualityInfo.qualityValue & eQuality.Value_Added) !== 0 || (trendQualityInfo.qualityValue & eQuality.Value_Edited) !== 0)
      && trendQualityInfo.qualityArray.length > 0 && (trendQualityInfo.qualityArray.includes(TrendDataQuality.ManualCorrectionAdd)
        || trendQualityInfo.qualityArray.includes(TrendDataQuality.ManualCorrectionModify))) {
      const valueToPush: any = (!isSeriesEnum || isLastValue) ? actVal : convertedValue;
      const point: any[] = [(dateToPush), valueToPush];
      timeShiftData.push(point);
    }
    if ((trendQualityInfo.qualityValue & eQuality.NoValue) === 0) {
      const valueToPush: any = (!isSeriesEnum || isLastValue) ? actVal : convertedValue;
      const innerPoint: any[] = [(dateToPush), valueToPush];
      if (trendQualityInfo.qualityArray.length > 0) {
        innerPoint.push(trendQualityInfo.qualityArray);
      }
      // set the last value---this may help for considering the qualities(not sure)
      this.lastValue = valueToPush;// setting the last value to get the previous value(set only when the value has good quality)
      // consist non converted last value, used in case of timeshift quality for binary/multistate
      this.lastActValue = actVal;
      let checkForMissingDataTo = false;
      if (trendQualityInfo.qualityArray.length > 0) {
        if (trendQualityInfo.qualityArray.some(trendQuality => SHOW_QUALITY_FOR.includes(trendQuality))) {
          this.qualityIconProvider.generateMissingDataFrom(missingData, dateToPush, this.QUALITY_RECTANGLE_COLOR_RED);
        } else {
          checkForMissingDataTo = true;
        }
      } else {
        checkForMissingDataTo = true;
      }
      if (checkForMissingDataTo && missingData.length > 0) {
        if (missingData[missingData.length - 1].data.length < 2) {
          missingData[missingData.length - 1].data.push(dateToPush);
        }
      }
      chartData.push(innerPoint);
      // uncomment for configuring symbol based on marker
      // if (innerPoint[1] !== null)
      //     chartData.push({ data: innerPoint });
      // else {
      //     chartData.push({ data: innerPoint, symbol: 'none' });
      // }
    } else {
      const conditions: any = this.getConditionValues(trendQualityInfo.qualityValue, this.lastValue, actVal);
      if (conditions.addBreakBeforeValue) {
        const innerPoint: any[] = isSeriesEnum ? [(dateToPush), NaN] : [(dateToPush), null];
        if (trendQualityInfo.qualityArray.length > 0) {
          innerPoint.push(trendQualityInfo.qualityArray);
        }
        chartData.push(innerPoint);
        // uncomment for configuring symbol based on marker
        // if (innerPoint[1] !== null)
        //     chartData.push({ data: innerPoint });
        // else{
        //     chartData.push({ data: innerPoint, symbol: 'none' });
        // }
      }
      if (conditions.dispValue != null) {
        let valueToPush: any = conditions.dispValue;
        if (isSeriesEnum) {
          returnResponse = this.trendSnapinService.getEnumString(trendSeriesId, (isLastValue) ? this.lastActValue : conditions.dispValue);
          if (returnResponse.IsError) {
            valueToPush = NaN;
          } else {
            valueToPush = returnResponse.convertedValue;
          }
        }
        const innerpoint: any[] = [(dateToPush), valueToPush];
        if (trendQualityInfo.qualityArray.length > 0) {
          innerpoint.push(trendQualityInfo.qualityArray);
        }
        chartData.push(innerpoint);
        if (conditions.addBreakAfterValue) {
          valueToPush = isSeriesEnum ? NaN : null;
          if (trendQualityInfo.qualityArray.some(trendQuality => SHOW_QUALITY_FOR.includes(trendQuality))) {
            this.qualityIconProvider.generateMissingDataFrom(missingData, dateToPush, this.QUALITY_RECTANGLE_COLOR_RED);
          }
          const _innerpoint: any[] = [(dateToPush), valueToPush];
          if (trendQualityInfo.qualityArray.length > 0) {
            _innerpoint.push(trendQualityInfo.qualityArray);
          }
          chartData.push(_innerpoint);
        } else {
          // mainly done for Log-interrupted and buffer-full
          if (trendQualityInfo.qualityArray.some(trendQuality => SHOW_QUALITY_FOR.includes(trendQuality))) {
            this.qualityIconProvider.generateMissingDataFrom(missingData, dateToPush, this.QUALITY_RECTANGLE_COLOR_RED);
          }
        }
      }
    }
    this.traceService.debug(this.traceModule, 'TrendSeries.populateTrendData() data:', chartData);
    return [chartData, missingData, timeShiftData];
  }

  private getConditionValues(quality: any, lastValue: any, value: any): ConditionValues {
    let dispValue: any = null;
    if (lastValue != null) {
      dispValue = lastValue;
    }
    let addBreakAfterValue = true;
    let addBreakBeforeValue = true;
    switch (quality & eQuality.NoValue) {
      case eQuality.NoValue_TimeShifted:
        dispValue = value;
        addBreakBeforeValue = false;
        addBreakAfterValue = false;
        break;
      case eQuality.NoValue_LogInterrupted:
        addBreakBeforeValue = false;
        addBreakAfterValue = false;
        break;
      case eQuality.NoValue_LogDisabled:
        break;
      case eQuality.NoValue_Driver_Failed:
        dispValue = value;
        addBreakBeforeValue = false;
        break;
      case eQuality.NoValue_ErrorInLog:
      case eQuality.NoValue_LogEnabled:
      case eQuality.NoValue_BufferPurged:
      case eQuality.NoValue_Overflow:
        break;
      default:
        break;
    }
    return { addBreakBeforeValue, addBreakAfterValue, dispValue };
  }

  private booleanStringValueHandler(value: string): string {
    // Defect 1323207:Flex Client Trends on Binary values (GmsBool) are not visible in the chart [Origin PCR - 1312544]  - V5.1
    // Handling special case for data type 'gms-bool' which returns 'true' and 'false'
    // all other binary type gives indexes thus converting this 'true' => '1' and 'false' => '0'.
    switch (value) {
      case TRUE_CONSTANT:
        return '1';
      case FALSE_CONSTANT:
        return '0';
      default:
        break;
    }
  }

}
