import { Injectable } from '@angular/core';
import { IHfwMessage } from '@gms-flex/core';
import {
  AxisDefinitionUpdateRepresentation, BrowserObject, CnsHelperService, CnsLabelEn,
  Designation, RelativeTime, SubChartRepresentation, SubChartUpdateCollectionRepresentation,
  SubChartUpdateRepresentation, TimeRange, TrendSeriesDefinition, TrendSeriesDefinitionUpdateCollection,
  TrendSeriesUpdateDefinition, TrendViewDefinition, TrendViewDefinitionUpdate, ValidationInput
} from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { ObjectManagerSaveActionResult } from '@gms-flex/snapin-common';
import { TranslateService } from '@ngx-translate/core';
import { SiToastNotificationService } from '@simpl/element-ng';
import {
  AxisType,
  ChartDefinition,
  clone,
  DataZoomEvent,
  MissingData,
  RangeType,
  RelativeTimeRange,
  RemoveOlderDataFromLiveChart,
  SiTrendviewerConfigService,
  TrendData,
  TrendSeriesDetails,
  TrendSeries as TrendSeriesSimpl
} from '@simpl/trendviewer-ng';
import { TrendViewerViewState } from '@simpl/trendviewer-ng/shared/view-state';
import { forkJoin, Observable, Subject, Subscription } from 'rxjs';

import { NonTrendSeries } from '../common/interfaces/nonTrendSeries';
import {
  FromToOnInitialFetching, LiveData, LocationCallSource, ManagedType, OutOfScopeSubchart, RetainTrendSeriesId,
  SeriesCNSInfo, TrendChartConstants, TVDSettings
} from '../common/interfaces/trend.models'
import { TrendSeries } from '../common/interfaces/trendSeries';
import { AxisTypes, InterpolationOptions } from '../shared/trend-searched-item';
import { TrendBaseManager } from '../trend-chart/trendBase.manager';
import { Zoomdata } from '../trend-export/model/trend-export.model';
import { TrendSnapinService } from './trend-snapin.service';

@Injectable({
  providedIn: 'root'
})
export class TrendDefinitionService {
  public tvdObjectId: string;
  public tvdObjectIdCopy: string;
  public isTVdToDelete = true;
  public numberOfSamples = 100;
  // use this value when user clicks on save as button
  public originalNumberOfSamples = 100;
  public generalSettingsQualityIndication = false;
  public presetDataZoom: any;
  public timeRange: TimeRange;
  public retainTrendSeries: RetainTrendSeriesId[] = [];
  public deleteTrendSub: Subject<void> = new Subject<void>();
  public startStopTrendSnapinProgress: Subject<boolean> = new Subject<boolean>();
  public deleteTrendResponseSub: Subject<boolean> = new Subject<boolean>();
  public nonTrendSeriesHandleSub: Subject<TrendViewDefinition> = new Subject<TrendViewDefinition>();
  public updateSubchartConfigurationSub: Subject<ChartDefinition> = new Subject<ChartDefinition>();
  public removeSeries: Subject<string[]> = new Subject<string[]>();
  public duplicateCollection: string[];
  public changedSeriesSub: Subject<[number, string, TrendSeriesSimpl]> = new Subject<[number, string, TrendSeriesSimpl]>();
  public storingState: TrendViewerViewState;
  public retainedState: TrendViewerViewState;
  public currentTVD: TrendViewDefinition;
  public showQualityIndication: boolean;
  public noStateChanged = false;
  public subChartIndex = 0; // to save subchart index on each addDatapoint call
  public outOfScopeSeriesCollection: TrendSeriesDefinition[] = [];
  public outOfScopeSubchartCollection: Map<number, OutOfScopeSubchart>;
  public isDiscardClicked = false;
  public displayNameType: string;
  public tvdNameOnCreation: string;
  public orgNameWithSpecialChar: string;
  public clearSeriesInterval = new Subject();
  public responsezoomData: Zoomdata;
  public originalSeriesCollectionForPropertyChange: Map<string, TrendSeries | NonTrendSeries> = new Map<string, TrendSeries | NonTrendSeries>();
  public readonly trendedSeriesCollection: Map<string, TrendSeries | NonTrendSeries> = new Map<string, TrendSeries | NonTrendSeries>();
  private isInitialLoadingDummy = true;
  private isFirstSeries = true;
  private readonly RELATIVE_TIMERANGE_MODE = 2;
  private readonly ABSOLUTE_TIMERANGE_MODE = 1;
  private readonly traceModule = 'gmsSnapins_TrendChartService';
  // Cached information of series identifier and the associated trended object. the information is specific to
  // selected trend object and will be cleared once the selection is changed
  private readonly subscriptions: Subscription[] = [];
  private totalNumberOfSeries = 0;
  private chartDefForCallback: ChartDefinition;
  // Caching current set Tvd for update
  private currentTVDSettings: TVDSettings;
  private readonly defaultTVDSettings: TVDSettings = {
    timeRange: {
      ValidTimeRange: this.RELATIVE_TIMERANGE_MODE,
      AbsoluteTimeRange: {},
      RelativeTimeRange: {}
    },
    numberOfSamplesPerTrendSeries: 100,
    removeOnlineTrendLogOfDeletedTrendSeries: false
  };

  // setting number of trends to identify whetther to get full range of data or to use from and to two items dummy data only
  public setTotalNumberOfSeries(numberOfSeries: number): void {
    this.totalNumberOfSeries = numberOfSeries;
  }

  constructor(
    public siToastService: SiToastNotificationService,
    private readonly trendViewerConfigService: SiTrendviewerConfigService,
    private readonly traceService: TraceService,
    private readonly messageBroker: IHfwMessage,
    private readonly cnsHelperService: CnsHelperService,
    private readonly trendSnapinService: TrendSnapinService,
    private readonly translateService: TranslateService) {

  }

  public getDisplayNameDescription(currentDisplayMode: CnsLabelEn, cnsInfo: SeriesCNSInfo): string {
    let seriesNameToShow = '';
    switch (currentDisplayMode) {
      case CnsLabelEn.Name:
      case CnsLabelEn.NameAndDescription:
        seriesNameToShow = cnsInfo.seriesName;
        break;
      case CnsLabelEn.Description:
      case CnsLabelEn.DescriptionAndName:
        seriesNameToShow = cnsInfo.seriesDisplayName;
        break;
      case CnsLabelEn.NameAndAlias:
        seriesNameToShow = cnsInfo.seriesAlias && cnsInfo.seriesAlias.length > 0 ? cnsInfo.seriesAlias : cnsInfo.seriesName;
        break;
      case CnsLabelEn.DescriptionAndAlias:
        seriesNameToShow = cnsInfo.seriesAlias && cnsInfo.seriesAlias.length > 0 ? cnsInfo.seriesAlias : cnsInfo.seriesDisplayName;
        break;
      case undefined:
      default:
        seriesNameToShow = cnsInfo.seriesDisplayName;
        break;
    }
    return seriesNameToShow;
  }

  public getLegendToolTipText(currentDisplayMode: CnsLabelEn, cnsInfo: SeriesCNSInfo): string {
    let toolTipText = '';
    switch (currentDisplayMode) {
      case CnsLabelEn.Name:
      case CnsLabelEn.NameAndDescription:
      case CnsLabelEn.NameAndAlias:
        toolTipText = cnsInfo.seriesDesignation;
        break;
      case undefined:
      default:
        toolTipText =
        cnsInfo.seriesLocation;
        break;
    }
    return toolTipText;
  }

  public removeSeriesFromOfflineSeriesCollection(seriesId: string): void {
    this.trendSnapinService.offlineSeriesCollection.delete(seriesId);
    this.handleManualUploadContentAction();
  }

  public retainOriginalSeriesForPropertyChange(seriesId: string): void {
    const retainedSeries = this.originalSeriesCollectionForPropertyChange.get(seriesId);
    if (!retainedSeries) {
      const seriesToBeRetained = this.trendedSeriesCollection.get(seriesId);
      if (seriesToBeRetained) {
        this.originalSeriesCollectionForPropertyChange.set(seriesId, seriesToBeRetained);
      }
    }
  }

  public updateTrendSeriesCollectionForDiscardedSeries(seriesId: string): void {
    const retainedSeries = this.originalSeriesCollectionForPropertyChange.get(seriesId);
    if (retainedSeries) {
      this.trendedSeriesCollection.set(seriesId, retainedSeries);
      this.originalSeriesCollectionForPropertyChange.delete(seriesId);
    }
  }

  public getTrendSeriesCollection(): Map<string, TrendSeries | NonTrendSeries> {
    return this.trendedSeriesCollection;
  }

  // caching the series id and trend info to perform operations later on request by control
  public cacheTrendedObjectInfo(seriesIdentifier: string, trendedObjDataInfo: TrendSeries): void {
    this.trendedSeriesCollection.set(seriesIdentifier, trendedObjDataInfo);
  }

  // Get live data from the series buffer
  public getLiveData(seriesIdentifier: string): LiveData {
    this.traceService.debug(this.traceModule, 'TrendDefinitionService.getLiveData() Get live data from the series buffer:', seriesIdentifier);
    const trendseriesInfo: TrendSeries | NonTrendSeries = this.trendedSeriesCollection.get(seriesIdentifier);
    let trendData: any[] = [];
    let missingData = new Array<MissingData>();
    let timeShiftData: any[] = [];
    let removeOlderData: RemoveOlderDataFromLiveChart = { isToReplaceData: false };
    let isOffline = true;
    if (trendseriesInfo) {
      isOffline = trendseriesInfo.isOfflineTsd;
      const { valArray, missingArray, timeShiftArray }: any = trendseriesInfo.getLiveValueBuffer();
      if (valArray) {
        trendData = valArray;
        missingData = missingArray;
        timeShiftData = timeShiftArray;
        removeOlderData = trendseriesInfo.getQuickAnalysisConfiguration();
      }
      if (trendData.length > 0) {
        // preparing binary series
        if (trendseriesInfo.isBinarySeries && !isOffline) {
          this.dummyDataForBinaryQuality(trendData, missingData);
        }
        // preparing offline TL quality
        if (isOffline) {
          this.dummyDataForOfflineTLQuality(trendData, missingData, true);
        }
      }
    }
    return { trendData, isOffline, missingData, timeShiftData, removeOlderData };
  }

  public dummyDataForOfflineTLQuality(trendData: any[], missingData: MissingData[], isLive: boolean): void {
    missingData.forEach(f => f.isOffline = true);
    const incompleteQuality = missingData.findIndex(f => f.data.length === 1);
    if (incompleteQuality !== -1) {
      missingData[incompleteQuality].data.push(isLive ? missingData[incompleteQuality].data[0] : trendData[trendData.length - 1][0]);
      missingData[incompleteQuality].isDummyData = true;
    }
    // Defect 1207029: Trend in flex: Tooltip for data not loaded quality is not shown
    // removing data not loaded quality to regenerate this uncomment below 2 lines
    // const maxDate = new Date(Math.max(...trendData.map(m => m[0])));
    // missingData.push({ data: [(maxDate)], color: qualityColor, isDataNotLoaded: true, isOffline: true });
  }

  public dummyDataForBinaryQuality(trendData: any[], missingData: MissingData[]): void {
    // prepare binary quality data to not show angular rectangle by pushing extra value to complete the incomplete quality
    const incompleteQualityData = missingData.find(f => f.data.length === 1);
    if (incompleteQualityData !== undefined) {
      incompleteQualityData.data.push(trendData[trendData.length - 1][0]);
      incompleteQualityData.isDummyData = true;
    }
  }

  // Get zoom level for the series
  public getZoomLevel(seriesIdentifier: string, dataZoomEvent: DataZoomEvent): number {
    this.traceService.debug(this.traceModule, 'TrendDefinitionService.getZoomLevel() Get zoom level for the series:%s, zoomEvent:%s',
      seriesIdentifier, dataZoomEvent);
    // Here expecting trendSeriesInfo object will always be available. since, the zoom operation will immedietly call this method and the
    // simultaneous system browser selection is not possible
    const trendSeriesInfo: any = this.trendedSeriesCollection.get(seriesIdentifier);
    if (trendSeriesInfo) {
      const zoomLevel = this.trendedSeriesCollection.get(seriesIdentifier).calculateZoomLevel(dataZoomEvent);
      this.responsezoomData =
     {
       seriesID: seriesIdentifier,
       dataZoomEventrequired: dataZoomEvent,
       zoomlevelRange: zoomLevel
     };
      return zoomLevel;

    } else {
      this.traceService.debug('Condition of the series identifier not found');
    }
  }

  public setViewState(viewState: TrendViewerViewState): void {
    this.storingState = viewState;
    const currentState: any = this.trendSnapinService.storage.getState(this.trendSnapinService.snapId);
    if (currentState && !this.noStateChanged) {
      currentState.state = viewState;
      this.trendSnapinService.storage.setState(this.trendSnapinService.snapId, currentState);
    }
    this.noStateChanged = false;
    // Check and assign displayNameType from message if available for selected node
    // as one node can have only one name that value should not be changed
    if (!this.displayNameType) {
      this.displayNameType = this.trendSnapinService.selectedObject.Name;
    }
  }

  public setDirtyFlag(isPropertyChanged: boolean): void {
    this.trendSnapinService.storage.setDirtyState(this.trendSnapinService.snapId, isPropertyChanged);
  }

  public deleteTrend(): Observable<boolean> {
    return new Observable(observer => {
      const subscription: Subscription = this.deleteTrendResponseSub.subscribe(response => {
        observer.next(response);
        observer.complete();
        subscription.unsubscribe();
      });
      this.deleteTrendSub.next();
    });
  }

  // Get the data from WSI
  public getSeriesDataFromService(seriesIdentifier: string, zoomLevel: number, range: RangeType): Observable<TrendData> {
    this.traceService.debug(this.traceModule, 'TrendDefinitionService.getSeriesDataFromService() request to fetch data for series identifier:',
      seriesIdentifier);
    return new Observable<TrendData>(observer => {
      let requestForInitialData = false;
      let newZoomRange = 0;
      // range will be null when fetching the initial data
      if (range === null) {
        requestForInitialData = true;
      } else {
        newZoomRange = range.rangeEnd - range.rangeStart;
        if (newZoomRange <= 0) {
          observer.next({ chartData: [] });
          return;
        }
      }

      let from = '';
      let to = '';
      let percentageFactorForNoOfSamples: number;

      let noOfSamples: number = this.numberOfSamples;
      const trendSeriesinfo: any = this.trendedSeriesCollection.get(seriesIdentifier);
      // trendSeriesinfo can be null on quick selections of Tvds made in system browser
      if (trendSeriesinfo && !trendSeriesinfo.accessDeniedOffline) {
        // Request for intial data
        if (requestForInitialData) {
          ({ from, to } = this.getFromToOnInitialFetching(seriesIdentifier, from, to));
          // removed initial full view data load as this was the reason to crash the chart.
          // and added from and to date(full range) with dummy values to load the full chart
          // in future, we need to check if we can provide actual values instead of dummy NULL values
          // setting number of trends to identify whetther to get full range of data or to use from and to two items dummy data only
          // calling this original full view data in case if there is only one trend as this was not firing initial default zoom event

          // Adding setTimeout() to make the call to refreshSeries async.

          if (this.presetDataZoom) {
            // First we calculate the zoom range that was requested to charts
            let requestedZoomRange: number;
            if (this.presetDataZoom.visibleWidth) {
              requestedZoomRange = this.presetDataZoom.visibleWidth;
            } else if (this.presetDataZoom.startValue && this.presetDataZoom.endValue) {
              requestedZoomRange = this.presetDataZoom.endValue - this.presetDataZoom.startValue;
            }
            // Since charts does not provide zoom call when zoom range is bigger that actual data range for first series, we provide
            // the full zoom instead of dummy values
            if (requestedZoomRange) {
              const actualDataRange: number = new Date(to).getTime() - new Date(from).getTime();

              if (this.isFirstSeries === true && requestedZoomRange >= actualDataRange) {
                this.traceService.debug(this.traceModule,
                  'TrendDefinitionService.getSeriesDataFromService() Zoom range > actual data for first series. Thus sending full data');
                this.isInitialLoadingDummy = false;
              }
              this.isFirstSeries = false;
            }
          }
          // To handle scenario of newly trended object (for newly added object TrendSeriesId will be undefined) we are adding dummy chart data
          if (this.isInitialLoadingDummy === true || !trendSeriesinfo.trendObjectInfo.TrendseriesId) {
            setTimeout(() => {
              let chartData: any = [];
              if (to) {
                if (trendSeriesinfo?.trendDefinitionService?.currentTVD?.TimeRange?.IsFullRangeSaved === true) {
                  chartData = [[new Date(from).getTime(), null], [new Date().getTime(), null]];
                } else {
                  chartData = [[new Date(from).getTime(), null], [new Date(to).getTime(), null]];
                }
              } else {
                chartData = [[new Date(from).getTime(), null], [new Date().getTime(), null]];
              }
              if (trendSeriesinfo.isBinarySeries) {
                chartData[0][1] = NaN;
                chartData[1][1] = NaN;
              }
              observer.next({ chartData });
            });
          } else {
            // On initial loading the no of samples shoud be half. this is a special case to be handled. since in other cases,
            // there will be no data fetching on initial load (because of above if)
            noOfSamples = Math.floor(noOfSamples / 2);
            this.traceService.info(this.traceModule, 'TrendSeries.getSeriesDataFromService(): Number of samples sending:' + noOfSamples);
            trendSeriesinfo.getDataForRequestedRange(from, to, noOfSamples, observer, trendSeriesinfo, true);
          }
        } else { /** Request Data for zoom operations */
          ({ from, to, percentageFactorForNoOfSamples } = trendSeriesinfo.getFromToForZoomAndPan(range, newZoomRange, from, to));
          noOfSamples = trendSeriesinfo.getNumberOfSamples(noOfSamples, newZoomRange, percentageFactorForNoOfSamples);

          if (this.validRange(from, to)) {
            this.traceService.info(this.traceModule, 'TrendSeries.getSeriesDataFromService(): Number of samples sending:' + noOfSamples);
            trendSeriesinfo.getDataForRequestedRange(from, to, noOfSamples, observer, trendSeriesinfo);
          } else {
            observer.next({ chartData: [] });
          }
        }
        trendSeriesinfo.setIntervalforCOVReduction(this.numberOfSamples);
      } else {
        observer.next({ chartData: [] });
      }
    });
  }

  public clearChartService(): void {
    this.traceService.debug(this.traceModule, 'TrendDefinitionService.clearChartService():clearing trend chart service');
    this.unsubscribeRequests();
    this.trendSnapinService.unSubscribeAllPropertyValues();

    this.trendedSeriesCollection.forEach(trendInfo => {
      trendInfo.unsubscribeSeriesSpecificRequests();
    });
    this.trendedSeriesCollection.clear();
    this.currentTVDSettings = undefined;
    this.tvdObjectId = undefined;
    this.tvdObjectIdCopy = undefined;
    this.timeRange = undefined;
    this.isTVdToDelete = true;
    this.retainTrendSeries = [];
    this.subChartIndex = undefined;
    this.originalSeriesCollectionForPropertyChange = new Map<string, TrendSeries | NonTrendSeries>();
  }

  public clearStorageProperties(): void {
    this.storingState = undefined;
    this.retainedState = undefined;
  }

  public unsubscribeRequests(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }

  public setPresetZoomConditions(datazoom: any): void {
    this.presetDataZoom = datazoom;
    this.isInitialLoadingDummy = true;
    this.isFirstSeries = true;
  }

  public selectDataPoints(): void {
    this.subscriptions.push(this.trendSnapinService.selectDataPoints(LocationCallSource.LOCATION_SELECT).subscribe(selectedPoints => {
      if (selectedPoints) {
        this.trendSnapinService.locationChange.next(selectedPoints[0]);
      }
    }, error => {
      this.traceService.error(this.traceModule, 'TrendDefinitionService.selectDataPoints():', error);
    }));
  }

  public addDataPoint(gridIndex: number): void {
    this.subChartIndex = gridIndex;
    this.subscriptions.push(this.trendSnapinService.selectDataPoints(LocationCallSource.SELECT_DATA_POINT_TITLE).subscribe(selectedPoints => {
      if (selectedPoints) {
        this.trendSnapinService.addDataPoint.next(selectedPoints);
        selectedPoints.forEach(point => {
          if (point.Attributes.ManagedTypeName.startsWith(ManagedType.TrendLog)) {
            this.trendSnapinService.getPropertyStatusRights(point.ObjectId);
          }
        });
      }
    }, error => {
      this.traceService.error(this.traceModule, 'TrendDefinitionService.addDataPoint():', error);
    }));
  }
  public savePopupCallback = (name: string, description: string, parentDesignation: Designation): Observable<ObjectManagerSaveActionResult> => {
    this.orgNameWithSpecialChar = description;
    this.tvdNameOnCreation = name;
    return new Observable(observer => {
      // eslint-disable-next-line no-warning-comments
      // TODO: dummy browser objects needs to be removed once support is provided by Object Manager team
      const browserObject: BrowserObject = {
        Attributes: undefined,
        Descriptor: description,
        Designation: parentDesignation.designation.toString(),
        HasChild: true,
        Name: this.tvdNameOnCreation,
        Location: parentDesignation.designation.toString(),
        ObjectId: parentDesignation.designationParts[0] + ':' + parentDesignation.designationParts[parentDesignation.designationParts.length - 1],
        SystemId: 1,
        ViewId: 0,
        ViewType: 1
      };
      const actionResult: ObjectManagerSaveActionResult = {
        newObject: browserObject
      };
      this.trendSnapinService.selectedObject.Name = this.tvdNameOnCreation;
      this.trendSnapinService.selectedObject.Descriptor = this.orgNameWithSpecialChar;
      this.chartDefForCallback.chartConfiguration.location = {
        id: parentDesignation.designation.toString(),
        path: parentDesignation.designation.toString(),
        enable: true
      };
      this.chartDefForCallback.chartConfiguration.isNewTrend = true;
      // call save function
      const saveTvdConfigSubsc: Subscription = this.saveTvdConfiguration(this.chartDefForCallback).subscribe(tvdData => {
        // to reload saved TVD
        this.trendSnapinService.searchNewNode(tvdData.TvdObjectId, this.trendSnapinService.systemId).subscribe(newNodes => {
          const newNodeBrowserObject = newNodes[0].Nodes[0];
          this.refreshSavedTvd(tvdData, newNodeBrowserObject.Descriptor);
          this.trendSnapinService.setSelectedObject(newNodeBrowserObject);
          this.handleNonTrendSeries(tvdData);
          if (this.trendSnapinService.isNewTrendWorkFlow) {
            this.trendSnapinService.tvdSavedFromNewTrend = true;
            this.trendSnapinService.showSaveConfirmationForNewTrend = false;
          }
          this.nonTrendedObjectSubscriptionHandler();
          observer.next(actionResult);
          observer.complete();
          saveTvdConfigSubsc.unsubscribe();
        });
      }, error => {
        // should be undefined to keep dialog open
        actionResult.newObject = undefined;
        actionResult.message = error.statusText;
        observer.next(actionResult);
        observer.complete();
        saveTvdConfigSubsc.unsubscribe();
      });
    });
  };

  public saveAsTrendDefinition(chartDefinition: ChartDefinition): Observable<boolean> {
    return new Observable<boolean>(observer => {
      if (this.tvdObjectId) {
        this.tvdObjectIdCopy = clone(this.tvdObjectId);
      }
      this.tvdObjectId = undefined;
      this.chartDefForCallback = chartDefinition;
      const selectDatapoinSubs: Subscription = this.trendSnapinService.selectDataPointsWithSave(LocationCallSource.SAVE_AS_TITLE, chartDefinition,
        this.savePopupCallback).subscribe(saveReponse => {
        if (!saveReponse) {
          this.tvdObjectId = this.tvdObjectIdCopy;
        }
        observer.next(saveReponse);
        observer.complete();
        selectDatapoinSubs.unsubscribe();
      }, error => {
        this.tvdObjectId = this.tvdObjectIdCopy;
        observer.error(error);
        observer.complete();
        this.traceService.error(this.traceModule, 'TrendDefinitionService.saveAsTrendDefinition():', error);
        selectDatapoinSubs.unsubscribe();
      });
    });
  }

  public seriesPropertyChanged(trendSeriesSimpl: TrendSeriesSimpl): void {
    const changedSeries: TrendSeries = this.trendedSeriesCollection.get(trendSeriesSimpl.identifier);
    if (changedSeries) {
      this.changedSeriesSub.next([changedSeries.systemId, changedSeries.trendObjectInfo.ObjectId, trendSeriesSimpl]);
    }
  }

  public showProperties(trendSeries: TrendSeries): void {
    // This is intentional
  }

  public setCurrentTVD(tvd: TrendViewDefinition): void {
    this.currentTVD = tvd;
    this.currentTVDSettings = {
      numberOfSamplesPerTrendSeries: tvd.NumberDisplayedSamplesPerTrendSerie,
      timeRange: tvd.TimeRange,
      removeOnlineTrendLogOfDeletedTrendSeries: tvd.RemoveOnlineTrendLogOfDeletedTrendSerie
    };
    this.tvdObjectId = tvd.TvdObjectId;
    this.showQualityIndication = tvd.ShowQualityIndication === undefined ? this.generalSettingsQualityIndication : tvd.ShowQualityIndication;
    this.isTVdToDelete = true;
  }

  public unsubscribeRemovedSeriesCOVs(seriesIdentifiersPresentInTVD: string[]): void {
    this.trendedSeriesCollection.forEach((series, id) => {
      if (!seriesIdentifiersPresentInTVD.includes(id)) {
        // unsubscribe only removed series, i.e. those not present are removed.
        this.trendSnapinService.unsubscribeCOVs(id);
      }
    });
  }

  public getSeriesInformationDetails(selectedSeriesDetails: TrendSeriesDetails): void {
    const snapinSeriesDetails = this.getTrendSeriesCollection().get(selectedSeriesDetails.id);
    this.trendSnapinService.getSeriesInformationDetails(selectedSeriesDetails, snapinSeriesDetails);
  }

  public saveTvdConfiguration(chartDefinition: ChartDefinition, validationInput?: ValidationInput): Observable<TrendViewDefinition> {
    return new Observable<TrendViewDefinition>(observer => {
      chartDefinition.chartSeriesCollection = this.checkDuplicateSeries(clone(chartDefinition.chartSeriesCollection));
      if (chartDefinition) {
        // this is for new case
        if (!this.currentTVDSettings) {
          this.currentTVDSettings = this.defaultTVDSettings;
          this.tvdObjectId = undefined;
        }
        const tvdUpdate: TrendViewDefinitionUpdate = new TrendViewDefinitionUpdate();
        tvdUpdate.TvdObjectId = this.tvdObjectId;
        tvdUpdate.ValidationInput = validationInput;
        tvdUpdate.Designation = chartDefinition.chartConfiguration.location.id;
        tvdUpdate.ShowQualityIndication = chartDefinition.chartConfiguration.showQualityIndication;
        // when new node is created assign Description to CNS node as below:
        // new node - if no Description, assign name of node
        // new node - if Description, assign Description only
        // when edited - only Description has to be edited,  name remains constant.
        tvdUpdate.CNSNode = {
          Name: this.tvdNameOnCreation,
          Description: chartDefinition.chartConfiguration.isNewTrend ? this.orgNameWithSpecialChar : chartDefinition.chartConfiguration.title
        };
        // below code is added to handle the case when user changes the description by adding the special characters 
        // this will be only for the saveAs option 
        if (chartDefinition.chartConfiguration.isNewTrend) {
          chartDefinition.chartConfiguration.title = this.orgNameWithSpecialChar;
        }
        tvdUpdate.NumberDisplayedSamplesPerTrendSerie = this.currentTVDSettings.numberOfSamplesPerTrendSeries;
        tvdUpdate.RemoveOnlineTrendLogOfDeletedTrendSerie = this.currentTVDSettings.removeOnlineTrendLogOfDeletedTrendSeries;
        let isAbsoluteFullView = false;
        tvdUpdate.TimeRange = this.currentTVDSettings.timeRange;

        if (chartDefinition.chartConfiguration.relativeTimeConfiguration &&
          chartDefinition.chartConfiguration.relativeTimeConfiguration.relativeTimeRange !== 'all') {
          tvdUpdate.TimeRange.ValidTimeRange = this.RELATIVE_TIMERANGE_MODE;
          tvdUpdate.TimeRange.RelativeTimeRange.TimeUnit = RelativeTime[
            chartDefinition.chartConfiguration.relativeTimeConfiguration.relativeTimeRange] as RelativeTimeRange;
          tvdUpdate.TimeRange.RelativeTimeRange.NumberOfTimeUnits = chartDefinition.chartConfiguration.relativeTimeConfiguration.unitValue;
          tvdUpdate.TimeRange.RelativeTimeRange.AnchorTime = new Date().toISOString();
          tvdUpdate.TimeRange.RelativeTimeRange.AnchorMode = 1;
          tvdUpdate.TimeRange.IsFullRangeSaved = false;
        } else {
          tvdUpdate.TimeRange.IsFullRangeSaved = true;
          tvdUpdate.TimeRange = this.currentTVDSettings.timeRange;
          tvdUpdate.TimeRange.ValidTimeRange = this.ABSOLUTE_TIMERANGE_MODE;
          isAbsoluteFullView = true;
        }
        tvdUpdate.SubChartCollection = new SubChartUpdateCollectionRepresentation();
        tvdUpdate.SubChartCollection.SubCharts = new Array<SubChartUpdateRepresentation>();

        // Max/Min/Auto Scaling- Keep std client and flex settings separate
        chartDefinition.chartConfiguration.subChartGrids.forEach((subchart, index) => {
          if (chartDefinition.chartConfiguration.yAxis) {
            tvdUpdate.SubChartCollection.SubCharts.push(new SubChartUpdateRepresentation());
            tvdUpdate.SubChartCollection.SubCharts[index].SubChartId = subchart.categoryId;
            chartDefinition.chartConfiguration.yAxis.forEach(axisYItem => {
              if (axisYItem.gridIndex === index) {
                if (axisYItem.type === 'value') {
                  const axisY: AxisDefinitionUpdateRepresentation = new AxisDefinitionUpdateRepresentation();
                  axisY.AutoScale = axisYItem.scale;
                  axisY.ScaleMax = axisYItem.max;
                  axisY.ScaleMin = axisYItem.min;
                  axisY.Title = '';
                  if (axisYItem.position === TrendChartConstants.AXISY_TYPE_LEFT.toString()) {
                    tvdUpdate.SubChartCollection.SubCharts[index].AxisYLeft = clone(axisY);
                  } else if (axisYItem.position === TrendChartConstants.AXISY_TYPE_RIGHT.toString()) {
                    tvdUpdate.SubChartCollection.SubCharts[index].AxisYRight = clone(axisY);
                  }
                }
              }
            });
          }
        });

        const trendSeriesDataInfoMap: Map<string, TrendSeries> = this.getTrendSeriesCollection();
        tvdUpdate.TsdCollectionInfo = new TrendSeriesDefinitionUpdateCollection();
        tvdUpdate.TsdCollectionInfo.TrendSeriesDefinitions = new Array<TrendSeriesUpdateDefinition>();
        let tvdMinTimeStamp: any;
        let tvdMaxTimeStamp: any;
        const trendBaseManager: TrendBaseManager = new TrendBaseManager();
        if (chartDefinition.chartSeriesCollection) {
          chartDefinition.chartSeriesCollection.forEach(trendSeries => {
            const tsdId: string = trendSeries.identifier;
            const tsdInfo: TrendSeries = trendSeriesDataInfoMap.get(tsdId);
            if (tsdInfo) {
              const series: TrendSeriesUpdateDefinition = new TrendSeriesUpdateDefinition();
              series.SubChartId = chartDefinition.chartConfiguration.subChartGrids[trendSeries.gridIndex].categoryId;
              series.AccessDeniedOffline = tsdInfo.accessDeniedOffline;
              series.AccessDeniedOnline = tsdInfo.accessDeniedOnline;

              series.TrendLogObjectId = tsdInfo.isOfflineTsd ? tsdInfo.trendObjectInfo.CollectorObjectOrPropertyId : undefined;
              series.TrendLogObjectIdInternal = tsdInfo.ObjectIdOfTrendLogInternal;
              series.TrendLogOnlineObjectId = !tsdInfo.isOfflineTsd ? tsdInfo.trendObjectInfo.CollectorObjectOrPropertyId : undefined;
              series.isNonTrended = series.TrendLogOnlineObjectId === undefined;
              series.TrendedObjectId = tsdInfo.trendObjectInfo.ObjectId;
              series.ObjectPropertyId = tsdInfo.trendObjectInfo.ObjectId + '.' + trendSeries.properties.selectedProperty;

              series.Color = trendBaseManager.setLineColor(trendSeries.properties.lineColor);
              series.IsLineVisible = trendSeries.properties.visible;
              series.LineWidth = trendSeries.properties.lineWidth;
              const stepTypeOptions = this.trendViewerConfigService.get().interpolationOptions;
              if (trendSeries.properties.yAxisProperties.type === 'value') {
                series.ChartLineType = trendSeries.properties.lineStepType === InterpolationOptions.End ? 'StepLine' : 'Line';
              }
              series.ShowMarkers = trendBaseManager.getMarkerVisibilityFromSymbol(
                trendSeries.properties.symbol, trendSeries.properties.showSymbol);
              series.ChartLineStyle = trendBaseManager.MapLinetypeToChartLineStyle(trendSeries.properties.lineType).toString();
              series.MarkerType = trendBaseManager.mapSymbolToMarkerType(
                trendSeries.properties.symbol);
              series.Type = tsdInfo.isOfflineTsd ?
                TrendChartConstants.TSD_TYPE_OFFLINE.toString() :
                TrendChartConstants.TSD_TYPE_ONLINE.toString();
              series.Smoothing = trendSeries.properties.smooth;
              series.CustomDescription = trendSeries.properties.displayName;

              series.AxisAttachment = trendBaseManager.mapYAxisIndexToAxisAttachment(trendSeries.properties.yAxisProperties.position);
              tvdUpdate.TsdCollectionInfo.TrendSeriesDefinitions.push(series);

              // Computing min max for full view
              if (isAbsoluteFullView) {
                if (tsdInfo.trendSeriesMinTimestamp) {
                  const fromTime: number = new Date(tsdInfo.trendSeriesMinTimestamp).getTime();
                  if (!tvdMinTimeStamp || fromTime < tvdMinTimeStamp) {
                    tvdMinTimeStamp = fromTime;
                  }
                }
                if (tsdInfo.trendSeriesMaxTimestamp) {
                  const toTime: number = new Date(tsdInfo.trendSeriesMaxTimestamp).getTime();
                  if (!tvdMaxTimeStamp || toTime > tvdMaxTimeStamp) {
                    tvdMaxTimeStamp = toTime;
                  }
                }
              }
            }
          });
        }

        if (isAbsoluteFullView) {
          // If tvd is empty with no data then assigning default timerange from general settings
          if (!tvdMinTimeStamp && !tvdMaxTimeStamp) {
            const maxDate: Date = new Date();
            const minDate: Date = trendBaseManager.getStartDate(this.timeRange, maxDate);
            tvdUpdate.TimeRange.AbsoluteTimeRange.To = maxDate.toISOString();
            tvdUpdate.TimeRange.AbsoluteTimeRange.From = minDate.toISOString();
          } else {
            tvdUpdate.TimeRange.AbsoluteTimeRange.From = new Date(tvdMinTimeStamp).toISOString();
            tvdUpdate.TimeRange.AbsoluteTimeRange.To = new Date(tvdMaxTimeStamp).toISOString();
          }
        } else {
          // update absolute timerange when user select min, hour, week, month, year
          // below changes are to fix defect : In edit mode, if user change timerange and tvd is paused,
          // it should correctly reflect on chart
          const timeRange: TimeRange = {
            timeRangeUnit: tvdUpdate.TimeRange.RelativeTimeRange.TimeUnit,
            timeRangeValue: tvdUpdate.TimeRange.RelativeTimeRange.NumberOfTimeUnits
          };
          const maxDate: Date = new Date(tvdUpdate.TimeRange.RelativeTimeRange.AnchorTime);
          const minDate: Date = trendBaseManager.getStartDate(timeRange, new Date(tvdUpdate.TimeRange.RelativeTimeRange.AnchorTime));
          tvdUpdate.TimeRange.AbsoluteTimeRange.From = new Date(minDate).toISOString();
          tvdUpdate.TimeRange.AbsoluteTimeRange.To = maxDate.toISOString();
        }

        this.handleOutOfScopeSubchartCollection(tvdUpdate, chartDefinition);
        // check if there is any out of scope datapoint, and if available add it in collection while saving
        this.handleOutOfScopeSeriesCollection(tvdUpdate);

        this.subscriptions.push(this.trendSnapinService.putTrendViewDefinition(tvdUpdate).subscribe(tvd => {
          this.removeDuplicateSeries(this.duplicateCollection);
          tvdUpdate.TsdCollectionInfo.TrendSeriesDefinitions.forEach(ele => {
            tvd.TsdCollectionInfo.TrendSeriesDefinitions.
              find(f => f.TrendedObjectId === ele.TrendedObjectId).isNonTrended = ele.isNonTrended;
          });
          if (this.tvdObjectId === undefined) {
            this.tvdObjectId = tvd.TvdObjectId;
            this.isTVdToDelete = true;
          }
          // delete will be enabled after every save successful
          this.trendSnapinService.disableContentAction(false);
          this.trendSnapinService.disableDeleteContentAction(false);
          
          // update system browser selected object name with saved tvd.
          this.initializeLayout(chartDefinition);

          // update system browser selected object description with saved tvd.
          this.trendSnapinService.selectedObject.Descriptor = chartDefinition.chartConfiguration.title;
          this.updateSubchartConfigurationSub.next(chartDefinition);
          this.handleNonTrendSeries(tvd);

          const currentSeriesIdentifiersInTVD = [];

          // unsubscribe removed trended points
          if (chartDefinition.chartSeriesCollection) {
            chartDefinition.chartSeriesCollection.forEach(x => currentSeriesIdentifiersInTVD.push(x.identifier));
            // Need to pass the all the series identifier currently present in TVD in below method.
            this.unsubscribeRemovedSeriesCOVs(currentSeriesIdentifiersInTVD);
          }
          observer.next(tvd);
          observer.complete();

        }, error => {
          this.siToastService.queueToastNotification('danger', error.statusText, '', true);
          observer.error(error);
          observer.complete();
        }));
      }
    });
  }

  public initializeLayout(chartDefinition: ChartDefinition): void {
    const activeCnsLabel$ = this.cnsHelperService.activeCnsLabel;
    const message$ = this.displayNameType;

    forkJoin({
      activeCnsLabel: activeCnsLabel$,
      message: message$
    }).subscribe(({ activeCnsLabel, message }) => {
      const displayMode = this.cnsHelperService.activeCnsLabelValue.cnsLabel;

      const validLabels = [
        CnsLabelEn.Name,
        CnsLabelEn.NameAndDescription,
        CnsLabelEn.NameAndAlias
      ];

      // based on displaymode from layout
      // Update the selected object's name based on the label validation
      if (validLabels.includes(displayMode)) {
        this.trendSnapinService.selectedObject.Name = message;
      } else {
        this.trendSnapinService.selectedObject.Name = chartDefinition.chartConfiguration.title;
      }
     
    });
  }

  public handleOutOfScopeSubchartCollection(tvdUpdate: TrendViewDefinitionUpdate, chartDefinition: ChartDefinition): void {
    if (this.outOfScopeSubchartCollection && this.outOfScopeSubchartCollection.size > 0) {
      this.outOfScopeSubchartCollection.forEach((subchart, position) => {
        const subchartlength = tvdUpdate.SubChartCollection.SubCharts.length;
        // If subchart has all out of scope points
        if (subchart.allSeriesOutOfScope) {
          // check if we have same id present in subchart collection from TV
          // If we dont have same ID, push subchart at same position
          // If we have, then in else add new chart with new id. Also change series id with the same
          if (tvdUpdate.SubChartCollection.SubCharts.every(s => s.SubChartId !== subchart.subCharts.SubChartId)) {
            const index = position < subchartlength ? position : subchartlength;
            tvdUpdate.SubChartCollection.SubCharts.splice(index, 0, subchart.subCharts);
          } else {
            const series = this.outOfScopeSeriesCollection.find(f => f.SubChartId === subchart.subCharts.SubChartId);
            const newId = this.getUniqueGridId(subchartlength, tvdUpdate.SubChartCollection.SubCharts);
            subchart.subCharts.SubChartId = newId;
            tvdUpdate.SubChartCollection.SubCharts.splice(subchartlength, 0, subchart.subCharts);
            series.SubChartId = newId;
          }
        }

        // If subchart has some out of scope points
        if (!subchart.allSeriesOutOfScope) {
          // check if we have same id present in subchart collection from TV
          // If we dont have same ID, push subchart at same position
          // If we have, then in else check type of subchart from TV and if doesn't match -> add new chart with new id.
          // Also change series id with the same
          if (tvdUpdate.SubChartCollection.SubCharts.every(s => s.SubChartId !== subchart.subCharts.SubChartId)) {
            const index = position < subchartlength ? position : subchartlength;
            tvdUpdate.SubChartCollection.SubCharts.splice(index, 0, subchart.subCharts);
          } else {
            const existingGrid = chartDefinition.chartConfiguration.subChartGrids.filter(fi => fi.categoryId === subchart.subCharts.SubChartId)[0];
            if (existingGrid) {
              const outOfScopeSeries = this.outOfScopeSeriesCollection.find(f => f.SubChartId === subchart.subCharts.SubChartId);
              if (outOfScopeSeries && existingGrid.type !== this.outOfScopeSeriesType(outOfScopeSeries)) {
                const newId = this.getUniqueGridId(subchartlength, tvdUpdate.SubChartCollection.SubCharts);
                subchart.subCharts.SubChartId = newId;
                // push at the end of subchart list
                tvdUpdate.SubChartCollection.SubCharts.splice(subchartlength, 0, subchart.subCharts);
                outOfScopeSeries.SubChartId = newId;
              }
            }
          }
        }
      });
    }
  }

  public handleOutOfScopeSeriesCollection(tvdUpdate: TrendViewDefinitionUpdate): void {
    // check if there is any out of scope datapoint, and if available add it in collection while saving
    if (this.outOfScopeSeriesCollection && this.outOfScopeSeriesCollection.length > 0) {
      this.outOfScopeSeriesCollection.forEach(trendSeries => {
        const series: TrendSeriesUpdateDefinition = new TrendSeriesUpdateDefinition();
        series.SubChartId = trendSeries.SubChartId;
        series.TrendLogObjectId = trendSeries.TrendLogObjectId;
        series.TrendLogOnlineObjectId = trendSeries.TrendLogOnlineObjectId;
        series.TrendedObjectId = trendSeries.TrendedObjectId;
        series.ObjectPropertyId = trendSeries.TrendedObjectId + '.' + trendSeries.PropertyName;
        series.Color = trendSeries.Color;
        series.IsLineVisible = trendSeries.IsLineVisible;
        series.LineWidth = trendSeries.LineWidth;
        series.ShowMarkers = trendSeries.ShowMarkers;
        series.ChartLineStyle = trendSeries.ChartLineStyle;
        series.MarkerType = trendSeries.MarkerType;
        series.Type = trendSeries.Type;
        series.Smoothing = trendSeries.Smoothing;
        series.CustomDescription = trendSeries.CustomDescription;
        series.AxisAttachment = trendSeries.AxisAttachment;
        tvdUpdate.TsdCollectionInfo.TrendSeriesDefinitions.push(series);
        series.ChartLineType = trendSeries.ChartLineType;
      });
    }
  }

  public removeEmptySubChartOnTVDLoad(tvd: TrendViewDefinition): SubChartRepresentation[] {
    // Below subchart ids are ids having any in scope series
    const distinctSubchartIds = [...new Set(tvd.TsdCollectionInfo.TrendSeriesDefinitions.filter(f => !f.AccessDenied).map(series => series.SubChartId))];
    const updatedSubChart: SubChartRepresentation[] = [];
    this.outOfScopeSubchartCollection = new Map<number, OutOfScopeSubchart>();

    if (tvd.TsdCollectionInfo.TrendSeriesDefinitions.some(f => f.AccessDenied)) {
      tvd.SubChartCollection.SubCharts.forEach((chart, index) => {
        const outOfScopeSubcharts: OutOfScopeSubchart = new OutOfScopeSubchart();
        // check if there is any sunchart which doesn't have any inscope series
        if (distinctSubchartIds.every(x => x !== chart.SubChartId)) {
          outOfScopeSubcharts.subCharts = chart;
          outOfScopeSubcharts.allSeriesOutOfScope = true;
          this.outOfScopeSubchartCollection.set(index, outOfScopeSubcharts);
        } else {
          updatedSubChart.push(chart);
          // check if chart has some inScope series
          if (tvd.TsdCollectionInfo.TrendSeriesDefinitions.filter(f => f.AccessDenied).some(x => x.SubChartId === chart.SubChartId)
            && chart.SubChartId !== outOfScopeSubcharts.subCharts?.SubChartId) {
            outOfScopeSubcharts.subCharts = chart;
            outOfScopeSubcharts.allSeriesOutOfScope = false;
            this.outOfScopeSubchartCollection.set(index, outOfScopeSubcharts);
          }
        }
      });
    }
    return updatedSubChart;
  }

  public removeDuplicateSeries(identifierList: string[]): void {
    this.removeSeries.next(identifierList);
  }

  // Remove non trended series from collcetion if any
  public handleNonTrendSeriesCollection(seriesId): void {
    if (this.trendSnapinService.nonTrendedSeriesCollcetion && this.trendSnapinService.nonTrendedSeriesCollcetion.size > 0) {
      this.trendSnapinService.nonTrendedSeriesCollcetion.delete(seriesId);
    }
  }

  // add hidden series
  public updateStorageSeries(identifier: string, uniqueId: string, collectorId: string): void {
    const data: RetainTrendSeriesId = {
      identifier,
      UniqueId: uniqueId,
      collectorId
    };
    this.retainTrendSeries.push(data);
  }

  public manualUploadContentActions(disable: boolean): void {
    this.trendSnapinService.disableManualUploadContentAction(disable);
  }

  public getPropertyStatus(): boolean {
    return this.trendSnapinService.propertyRights;
  }

  public removeUnusedNonTrendedSeries(seriesIdentifier: string, chartSeriesPropertyName: string): void {
    const nonTrendedSeries = this.trendSnapinService.nonTrendedSeriesCollcetion.get(seriesIdentifier);
    if (nonTrendedSeries && chartSeriesPropertyName !== nonTrendedSeries?.trendObjectInfo?.PropertyName) {
      this.trendSnapinService.nonTrendedSeriesCollcetion.delete(seriesIdentifier);
    }
  }

  // Check whether from to range passed to wsi is correct
  private validRange(from: string, to: string): boolean {
    this.traceService.debug(this.traceModule, 'TrendDefinitionService.validRange() from: %s, to:%s', from, to);
    // The from and to can be empty when there is no data in the database initially.
    // In such case no value shall be passed to trend control
    if (!from || !to) {
      return false;
    }

    const fromTime: number = new Date(from).getTime();
    const toTime: number = new Date(to).getTime();

    // Precautionary handling if the ranges are NaN
    if (isNaN(fromTime) || isNaN(toTime)) {
      return false;
    }

    // If the difference between from to is less than a second, HDB throws excpetion(this is current limitation from HDB)
    // also if the from range is greater thanto range, this is invalid and shall not be processed.
    if ((toTime - fromTime) <= 1000) {
      return false;
    }
    return true;
  }

  // Get the from and to range on initial loading
  private getFromToOnInitialFetching(seriesIdentifier: string, from: string, to: string): FromToOnInitialFetching {
    this.traceService.debug(this.traceModule, 'TrendDefinitionService.getSeriesDataFromService():request to fetch initial data');
    const trendseriesInfo: TrendSeries = this.trendedSeriesCollection.get(seriesIdentifier);

    // trendseriesInfo can be null in following case, thus needs to be handled:
    // trendseriesInfo is cached for the selected trendviewdefinition and cleared when the selection changes(control is also reset in this case)
    // If these selections are quick, trendseriesInfo might get cleared while the request for intial data is still in progress.
    // thus not finding the requested identifier
    if (trendseriesInfo?.trendSeriesMinTimestamp) {
      from = trendseriesInfo.trendSeriesMinTimestamp;
    }

    if (trendseriesInfo?.trendSeriesMaxTimestamp) {
      to = trendseriesInfo.trendSeriesMaxTimestamp;
    }
    return { from, to };
  }

  // Handle subscription for previously non-trended objects (before save non trended objects).
  private nonTrendedObjectSubscriptionHandler(): void {
    if (this.trendSnapinService.nonTrendedSeriesCollcetion && this.trendSnapinService.nonTrendedSeriesCollcetion.size > 0) {
      this.trendSnapinService.nonTrendedObjectTrendValueSubscription();
    }
  }

  private refreshSavedTvd(trendViewDefinition: TrendViewDefinition, title: string): void {
    this.setCurrentTVD(trendViewDefinition);
    this.trendSnapinService.saveAsTvdSubscription(trendViewDefinition, title);
  }

  private handleNonTrendSeries(tvd: TrendViewDefinition): void {
    if (this.trendSnapinService.nonTrendedSeriesCollcetion && this.trendSnapinService.nonTrendedSeriesCollcetion.size > 0) {
      this.nonTrendSeriesHandleSub.next(tvd);
    }
  }

  private handleManualUploadContentAction(): void {
    if (this.trendSnapinService.offlineSeriesCollection.size) {
      this.trendSnapinService.disableManualUploadContentAction(false);
    } else {
      this.trendSnapinService.disableManualUploadContentAction(true);
    }
  }
  private getUniqueGridId(length: number, subchart: SubChartUpdateRepresentation[]): string {
    subchart = subchart ?? [];
    const outOfScopeGridsWithSameId = [...this.outOfScopeSubchartCollection.values()].some(s => s.subCharts.SubChartId === length + '');
    const gridsWithSameId = subchart.some(g => g.SubChartId === length + '');
    if (gridsWithSameId || outOfScopeGridsWithSameId) {
      length = length + 1;
      return this.getUniqueGridId(length, subchart);
    } else {
      return length + '';
    }
  }

  private outOfScopeSeriesType(outOfScopeSeries: TrendSeriesDefinition): AxisType {
    let axisType: AxisType = AxisTypes.Value;
    if (outOfScopeSeries.DataType === 'ExtendedBool' || outOfScopeSeries.DataType === 'ExtendedEnum' ||
              outOfScopeSeries.DataType === 'Enum' || outOfScopeSeries.DataType === 'Boolean') {
      axisType = AxisTypes.Category;
    }
    return axisType;
  }

  private checkDuplicateSeries(chartSeriesCollection: TrendSeriesSimpl[]): TrendSeriesSimpl[] {
    this.duplicateCollection = [];
    const finalSeriesMap: { series: TrendSeries; seriesSimpl: TrendSeriesSimpl }[] = [];
    const trendSeriesDataInfoMap: Map<string, TrendSeries> = this.getTrendSeriesCollection();
    chartSeriesCollection.forEach(seriesSimpl => {
      const series: TrendSeries = trendSeriesDataInfoMap.get(seriesSimpl.identifier);
      /* fix(defect-1094854): in case of offline trended object they have similar datapoint
         then it should not be removed thus comparison is done on CollectorObjectOrPropertyId */
      // fix(defect-1099756): in case of TLM different trended object will get removed from save TLM
      // for non trended object CollectorObjectOrPropertyId will be empty
      // series.trendObjectInfo.TrendType will provide type for TL, TLO and TLM only for first time for rest it is ""
      // for a TLM CollectorObjectOrPropertyId is same for different trended object thus to differentiate between them TrendseriesId is used
      // NOTE: for thorough testing once tvd is created reload it and save it for confirmation, series details are different for already added datapoints
      let filterdArray = [];
      if (series.isOfflineTsd) {
        filterdArray = finalSeriesMap.filter(f => (f.series.isOfflineTsd &&
          (f.series.trendObjectInfo.CollectorObjectOrPropertyId === series.trendObjectInfo.CollectorObjectOrPropertyId ?
            f.series.trendObjectInfo.TrendseriesId === series.trendObjectInfo.TrendseriesId : false)));
      } else {
        filterdArray = finalSeriesMap.filter(f => !f.series.isOfflineTsd &&
          f.series.trendObjectInfo.ObjectId === series.trendObjectInfo.ObjectId &&
          f.seriesSimpl.properties.selectedProperty === seriesSimpl.properties.selectedProperty);
      }

      if (filterdArray.length > 0) {
        this.duplicateCollection.push(seriesSimpl.identifier);
      } else {
        finalSeriesMap.push({ series, seriesSimpl });
      }
    });

    if (this.duplicateCollection.length > 0) {
      const subscription: Subscription = this.translateService.get('TREND_FOLDER.ERROR_MESSAGES.DUPLICATE_SERIES_REMOVED').subscribe(localeTextToShow => {
        this.siToastService.queueToastNotification('danger', localeTextToShow, '');
        if (subscription) {
          subscription.unsubscribe();
        }
      });
      chartSeriesCollection = chartSeriesCollection.filter(f => !this.duplicateCollection.includes(f.identifier));
    }
    return chartSeriesCollection;
  }

}
