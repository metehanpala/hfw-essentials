/* eslint-disable no-warning-comments */
import { Injectable } from '@angular/core';
import {
  AxisAttachment, BrowserObject, CnsLabelEn, GmsSubscription, ObjectNode, PropertyDetails, PropertyInfo, PropertyServiceBase,
  RelativeTime, SubChartRepresentation, SystemBrowserServiceBase, TrendSeriesDefinition,
  TrendServiceBase, TrendViewDefinition, TvCovType, ValidationInput, ValueDetails, ValueServiceBase
} from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { SiToastNotificationService } from '@simpl/element-ng';
import {
  AddSeriesType, AxisType, ChartXAxis, ChartYAxis, clone, ContentActions, DataZoomRange,
  RelativeTimeConfig,
  RelativeTimeRange,
  SiTrendviewerConfigService,
  SiTrendviewerService,
  TrendviewerSubchartGrid,
  YAxisPosition
} from '@simpl/trendviewer-ng';
import { forkJoin, Observable, throwError as observableThrowError, Subscription } from 'rxjs';

import { NonTrendSeries } from '../common/interfaces/nonTrendSeries';
import { TrendChartConstants } from '../common/interfaces/trend.models';
import { TrendSeries } from '../common/interfaces/trendSeries';
import { QualityIconService } from '../services/quality-icon-service';
import { TrendDefinitionService } from '../services/trend-definition-service';
import { QualityIconProvider } from '../services/trend-quality-icon-service';
import { TrendSnapinService } from '../services/trend-snapin.service';
import { AxisTypes, InterpolationOptions, RelativeTimeRanges, YAxisPositions } from '../shared/trend-searched-item';
import { TrendBaseManager } from './trendBase.manager';

@Injectable({
  providedIn: 'root'
})
export class TrendDefinitionManager extends TrendBaseManager {
  constructor(private readonly traceService: TraceService,
    private readonly trendviewerService: SiTrendviewerService,
    private readonly trendServiceBase: TrendServiceBase,
    private readonly trendDefinitionService: TrendDefinitionService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly trendSnapinService: TrendSnapinService,
    private readonly qualityIconService: QualityIconService,
    private readonly propertyServiceBase: PropertyServiceBase,
    private readonly qualityIconProvider: QualityIconProvider,
    public trendViewerConfigService: SiTrendviewerConfigService,
    public siToastService: SiToastNotificationService,
    public valueService: ValueServiceBase) {
    super();
  }
  public subChartGridModel: TrendviewerSubchartGrid[] = [];
  public subscriptionIds: string[] = [];
  public propValueChangedObservableArray: GmsSubscription<ValueDetails>[] = [];
  private readonly traceModule = 'gmsSnapins_TrendDefinitionManager';
  private readonly subscriptions: Subscription[] = [];
  private displayNameType: CnsLabelEn;
  private selectedObject: BrowserObject;
  private readonly yAxisResult: any;
  private objectNodeCollection: ObjectNode[];
  private oldestTimeStamp: Date;
  private propertyCollection: PropertyInfo<PropertyDetails>[];
  private updatedSubchart: Map<string, number> = new Map<string, number>();
  private readonly snapinId = this.trendSnapinService.snapId.fullId();
  // If the selection is a trendviewdefinition, read the stored trend view definition from pvss
  // In this case the confguration of TVD is saved and shall be retrieved whenever requested
  public readTrendViewDefinition(selectedObject: BrowserObject, displayNameType: CnsLabelEn): void {
    this.traceService.debug(this.traceModule, 'TrendChartComponent.readTrendViewDefinition() read the stored trend view definition');
    // First get the trend view definition from wsi
    this.displayNameType = displayNameType;
    this.selectedObject = selectedObject;
    this.trendSnapinService.tsdSubscriptionMapping = new Map<string, TrendSeries>();
    this.subscriptions.push(this.trendServiceBase.getTrendViewDefinition(this.selectedObject.ObjectId).subscribe(tvd =>
      this.processTVD(tvd),
    error => {
      this.traceService.error(this.traceModule, 'TrendChartComponent.readTrendViewDefinition().getTrendViewDefinition() error', error);
    }));
    // TODO: Find a better solution to restore scroll position using Angular component life cycle hooks.
    setTimeout(() => {
      this.trendSnapinService.restoreScrollPositionsSub.next();
    }, 2000);
  }

  public calculateOldestTimeStamp(trendSeriesCollection: TrendSeriesDefinition[]): void {
    this.oldestTimeStamp = undefined;
    trendSeriesCollection.forEach(series => {
      if (series.MinTimeStamp) {
        // Find smallest timestamp among all TSDs for xAxis alignment of sub charts.
        if (this.oldestTimeStamp) {
          this.oldestTimeStamp = new Date(Math.min(this.oldestTimeStamp.getTime(),
            new Date(series.MinTimeStamp).getTime()));
        } else {
          this.oldestTimeStamp = new Date(series.MinTimeStamp);
        }
      }
    });
    if (this.oldestTimeStamp === undefined) {
      // Assign default time range to oldest timestamp if no series has any min timestamp value.
      this.oldestTimeStamp = new Date(this.trendSnapinService.generateDefaultTimeRangeDifference(new Date()));
    }
  }

  public deleteTrend(objectId: string, validationInput: ValidationInput): Observable<boolean> {
    return new Observable(observer => {
      this.trendServiceBase.deleteTrendViewDefinition(objectId, validationInput).subscribe(() => {
        observer.next(true);
      },
      error => {
        this.siToastService.queueToastNotification('danger', error.statusText, '', true);
        this.trendDefinitionService.deleteTrendResponseSub.next(false);
        return observableThrowError(error);
      });
    });
  }

  public unsubscribeWsisubscriptions(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }

  public bulkSubscription(propValueChangedObservableArray: GmsSubscription<ValueDetails>[], subscriptionIds: string[]): void {
    // Bulk subscription
    propValueChangedObservableArray.forEach(sub => {
      this.traceService.debug(this.traceModule, 'TrendChartComponent.createNewTrendViewDefinition() live update subscription: ', sub);
      // same datapoint Id, but a diff designation
      const result: any[] = subscriptionIds.filter(d => d.split(TrendChartConstants.SUB_ID_SEPERATOR)[0] === sub.gmsId);
      if (result !== undefined) {
        result.forEach(id => {
          const trendSeries: TrendSeries = this.trendSnapinService.tsdSubscriptionMapping.get(id);
          const tsdSubscription: Subscription = sub.changed.subscribe(
            valueDetails => {
              if (!!trendSeries) {
                trendSeries.OnTrendedPropertyValueChanged(valueDetails);
              }
            },
            error => this.traceService.error(this.traceModule, 'TrendChartComponent.createNewTrendViewDefinition():' + error));
          if (!!trendSeries) { this.trendSnapinService.covSubscription.set(trendSeries.seriesIdentifier, tsdSubscription); }
        });
      }
    });
  }

  public processTSD(tsd: TrendSeriesDefinition, tvd: TrendViewDefinition, nonTrendSeries?: NonTrendSeries): void {
    let trendSeries: TrendSeries | NonTrendSeries;

    if (tsd.TrendLogOnlineObjectId || tsd.TrendLogObjectId || tsd.Type === TrendChartConstants.TSD_TYPE_OFFLINE) {
      trendSeries = new TrendSeries(this.trendServiceBase, this.traceService,
        this.trendDefinitionService, this.valueService, this.trendSnapinService, this.qualityIconProvider);
    } else {
      trendSeries = new NonTrendSeries(this.trendServiceBase, this.traceService,
        this.trendDefinitionService, this.valueService, this.trendSnapinService, this.qualityIconProvider);
    }

    // error handling
    const page: ObjectNode = this.objectNodeCollection ? this.objectNodeCollection.filter(resultNode => {
      if (resultNode.ObjectId === tsd.TrendedObjectId) {
        return resultNode;
      }
    })[0] : undefined;

    const propInfoElement: PropertyInfo<PropertyDetails> = this.propertyCollection ?
      this.propertyCollection.find(propertyInfoElement => propertyInfoElement.ObjectId === tsd.TrendedObjectId) : undefined;
    const propDescription: string = trendSeries.setPropertyInfo(propInfoElement, tsd.PropertyName, nonTrendSeries);

    trendSeries.isOfflineTsd = (tsd.Type === TrendChartConstants.TSD_TYPE_OFFLINE);
    trendSeries.accessDeniedOffline = tsd.AccessDeniedOffline;
    trendSeries.accessDeniedOnline = tsd.AccessDeniedOnline;
    trendSeries.trendObjectInfo = {
      TrendseriesId: tsd.TrendSeriesId, ObjectId: tsd.TrendedObjectId, PropertyName: tsd.PropertyName,
      CollectorObjectOrPropertyId: tsd.Type === TrendChartConstants.TSD_TYPE_ONLINE ? tsd.TrendLogOnlineObjectId :
        tsd.TrendLogObjectId,
      PropertyIndex: undefined, TrendedPropertyIdentifier: undefined, TrendType: undefined
    };

    // setting trended object information that will be used for content action
    trendSeries.ObjectIdOfTrendLog = trendSeries.isOfflineTsd ? trendSeries.trendObjectInfo.CollectorObjectOrPropertyId : undefined;
    trendSeries.ObjectIdOfTrendLogInternal = tsd.TrendLogObjectIdInternal;
    trendSeries.ObjectIdOfTrendLogOnline = !trendSeries.isOfflineTsd ? trendSeries.trendObjectInfo.CollectorObjectOrPropertyId : undefined;
    trendSeries.ObjectIdOfTrendedObject = trendSeries.trendObjectInfo.ObjectId;

    // to handle tsdSubscriptionMapping after save/saveAs reload
    if (!this.trendSnapinService.tsdSubscriptionMapping) {
      this.trendSnapinService.tsdSubscriptionMapping = new Map<string, TrendSeries>();
    }

    if (tsd.TrendSeriesId) {
      const subscriptionId: string = this.getSubscriptionId(trendSeries.trendObjectInfo, trendSeries.isOfflineTsd);

      const newSubscriptionId: string = this.createSubscriptionId(subscriptionId, tsd.TrendSeriesId);
      // upending trendseries id to make subscription id unique for tvds having TLM objects as for TLM we get same subscription id for all trend series
      this.subscriptionIds.push(newSubscriptionId);
      // mapping subscription with TrendseriesDataInfo object
      this.trendSnapinService.tsdSubscriptionMapping.set(newSubscriptionId, trendSeries);
    }

    if (nonTrendSeries) {
      trendSeries.setSeriesNames(propDescription, nonTrendSeries.getSeriesProperties());
    } else {
      trendSeries.setSeriesNames(propDescription, trendSeries.getSeriesProperties(page.Nodes[0]));
    }
    trendSeries.trendSeriesMinTimestamp = this.oldestTimeStamp.toISOString();
    trendSeries.trendSeriesMaxTimestamp = tsd.MaxTimeStamp;
    if (!trendSeries.trendSeriesMaxTimestamp && !trendSeries.trendSeriesMinTimestamp) {
      const maxDate: Date = new Date();
      // Had to send new date to getStartDate because of shallow copy issue
      const minDate: Date = this.getStartDate(this.trendDefinitionService.timeRange, new Date());
      trendSeries.trendSeriesMaxTimestamp = maxDate.toISOString();
      trendSeries.trendSeriesMinTimestamp = minDate.toISOString();
    } else if (new Date(trendSeries.trendSeriesMaxTimestamp).getTime() === new Date(trendSeries.trendSeriesMinTimestamp).getTime()) {
      const maxDate: Date = new Date(trendSeries.trendSeriesMinTimestamp);
      const minDate: Date = new Date(trendSeries.trendSeriesMinTimestamp);
      minDate.setSeconds(maxDate.getSeconds() - 2);
      trendSeries.trendSeriesMinTimestamp = minDate.toISOString();
    }
    trendSeries.systemId = this.selectedObject ? this.selectedObject.SystemId : this.trendSnapinService.selectedObject.SystemId;
    this.trendSnapinService.setTrendSeriesEnumDict(tsd.TrendSeriesId, tsd.EnumerationTexts);
    trendSeries.enumTexts = tsd.EnumerationTexts ? tsd.EnumerationTexts.map(item => item.Descriptor) : undefined;
    trendSeries.position = this.getAxisPosition(tsd.AxisAttachment);

    const identifier: string = trendSeries.seriesIdentifier = this.getSeriesIdentifier();
    trendSeries.trendObjectInfo.TrendseriesId = tsd.TrendSeriesId;
    this.trendDefinitionService.cacheTrendedObjectInfo(identifier, trendSeries);

    const uniqueId: string = tsd.TrendedObjectId + '_' + tsd.PropertyName;
    const seriesDisplayName: string = this.trendDefinitionService.getDisplayNameDescription(this.displayNameType, trendSeries.seriesCNSInfo);
    const seriesIdentifier: string = identifier + ':' + seriesDisplayName;
    this.trendDefinitionService.updateStorageSeries(identifier, uniqueId, trendSeries.trendObjectInfo.CollectorObjectOrPropertyId);
    trendSeries.propertyList = propInfoElement ? this.getPropertyList(propInfoElement.Properties) : [];
    const contentActions: ContentActions = this.trendSnapinService.getContentActions(trendSeries);

    // Below code will assign series identifier for which we need to add dummy data on timerange change
    const config = this.trendViewerConfigService.get();
    if (!tsd.isNonTrended) {
      const visible = !this.isHiddenSet(uniqueId, seriesIdentifier, trendSeries.trendObjectInfo.CollectorObjectOrPropertyId,
        tsd.IsLineVisible, tsd.isNonTrended);
      if (config.seriesToShowCurrentData === '-1' && visible) {
        config.seriesToShowCurrentData = trendSeries.isOfflineTsd ? '-1' : identifier;
      }
    }
    if (config.seriesToShowCurrentData === undefined) {
      config.seriesToShowCurrentData = '-1';
    }
    if (config.interpolationOptions && !trendSeries.isBinarySeries) {
      config.interpolationOptions = ['linear', 'end'];
    }
    if (config.alignTicks) {
      config.alignTicks = false;
    }
    this.trendViewerConfigService.update(config);
    const gridIndex: number = this.calculateGridIndex(tsd, trendSeries, identifier);
    this.trendviewerService.addSeries(this.snapinId, {
      identifier,
      gridIndex: gridIndex === -1 ? undefined : gridIndex,
      properties: {
        name: seriesDisplayName,
        displayName: tsd.CustomDescription,
        lineWidth: tsd.LineWidth,
        lineColor: this.getLineColor(tsd.Color),
        lineStepType: trendSeries.isBinarySeries ? InterpolationOptions.Start : tsd.ChartLineType === 'StepLine' ? InterpolationOptions.End : undefined,
        lineType: this.getLineType(tsd.ChartLineStyle),
        showSymbol: tsd.ShowMarkers,
        yAxisProperties: this.getYAxisProperties(trendSeries, tvd, (gridIndex === -1 ? 0 : gridIndex)),
        symbol: this.mapMarkerTypeToSymbol(tsd.MarkerType, tsd.ShowMarkers),
        selectedProperty: tsd.PropertyName,
        properties: trendSeries.propertyList,
        symbolSize: tsd.LineWidth + TrendChartConstants.SYMBOL_SIZE_OFFSET,
        visible: !this.isHiddenSet(uniqueId, seriesIdentifier, trendSeries.trendObjectInfo.CollectorObjectOrPropertyId, tsd.IsLineVisible, tsd.isNonTrended),
        unit: trendSeries.unit,
        resolution: trendSeries.resolution,
        smooth: undefined,
        legendTooltipText: this.trendDefinitionService.getLegendToolTipText(this.displayNameType, trendSeries.seriesCNSInfo),
        markerSymbolSize: 0,
        contentActions
      }
    }, AddSeriesType.Initial);
    if (!(tsd.TrendLogOnlineObjectId || tsd.TrendLogObjectId || tsd.Type === TrendChartConstants.TSD_TYPE_OFFLINE)) {
      this.trendSnapinService.nonTrendedSeriesCollcetion.set(identifier, trendSeries as NonTrendSeries);
    }
    if (trendSeries.isOfflineTsd) {
      this.trendSnapinService.offlineSeriesCollection.set(identifier, trendSeries);
    }
  }

  private processTVD(tvd: TrendViewDefinition): void {
    this.trendDefinitionService.startStopTrendSnapinProgress.next(false);
    this.subChartGridModel = [];
    this.updatedSubchart = new Map<string, number>();
    this.traceService.debug(this.traceModule, 'TrendChartComponent.readTrendViewDefinition().getTrendViewDefinition() tvd:', tvd);
    // Setting number of samples for the trend view definition

    // Deprecetated:To display n records, value to be passed to wsi api is n/2
    // Deprecetated:To display n records, value to be passed to wsi api is n/2
    // updated to n because we are demanding 50% left and 50% right for boundary value handling
    // as time range is now twice the selected time-range the numberof samples also should be equiviallant to n
    this.trendDefinitionService.setCurrentTVD(tvd);

    let offlineTLPresence = false;
    // filtering trendseries in scope for the logged in user
    const inScopeObjects = tvd.TsdCollectionInfo.TrendSeriesDefinitions.filter(
      tsd => tsd.TrendLogObjectId || tsd.TrendLogOnlineObjectId);

    inScopeObjects.forEach(tsd => {
      if (tsd.Type.includes(TrendChartConstants.TSD_TYPE_OFFLINE)) {
        this.trendSnapinService.getPropertyStatusRights(tsd.TrendLogObjectId);
        offlineTLPresence = true;
      } else if (!offlineTLPresence) {
        this.trendSnapinService.disableManualUploadContentAction(true);
      }
    });
    // TODO: this can be removed
    this.setNumberOfSamplesForSaveAsTvd(tvd.NumberDisplayedSamplesPerTrendSerie);
    const trendSeriesCollection: TrendSeriesDefinition[] = tvd.TsdCollectionInfo.TrendSeriesDefinitions.filter(
      tsd => {
        if (!tsd.AccessDenied) {
          return tsd;
        }
      });
    this.trendDefinitionService.outOfScopeSeriesCollection = tvd.TsdCollectionInfo.TrendSeriesDefinitions.filter(tsd => tsd.AccessDenied);

    let isLiveUpdateStarted = false;

    if (tvd.TvCovType === TvCovType[TvCovType.Auto]) {
      isLiveUpdateStarted = true;
    }
    if (this.trendDefinitionService.retainedState) {
      isLiveUpdateStarted = this.trendDefinitionService.retainedState.trendChartState.isLive;
    }
    this.trendSnapinService.disableContentAction(false);
    this.trendSnapinService.disableDeleteContentAction(false);
    const subCharts = this.trendDefinitionService.removeEmptySubChartOnTVDLoad(tvd);
    if (subCharts && subCharts.length > 0) {
      tvd.SubChartCollection.SubCharts = subCharts;
    }

    tvd.SubChartCollection.SubCharts.forEach((x, index) => {
      const grid = {
        top: 32,
        left: 64,
        right: 64,
        bottom: 32,
        categoryId: x.SubChartId
      };
      if (index > 0) {
        grid.bottom = undefined;
      }
      this.subChartGridModel.push(grid);
    });

    this.setChartProperties(tvd, isLiveUpdateStarted, this.subChartGridModel);

    // If there are no trended series in the TVD, no need to process further
    // todo: need to check for accessable tsd and return
    if (trendSeriesCollection.length === 0) {
      return;
    }
    // add series
    this.traceService.debug(this.traceModule, 'TrendChartComponent.readTrendViewDefinition():adding trend series');
    // setting number of trends to identify whetther to get full range of data or to use from and to two items dummy data only
    // calling this original full view data in case if there is only one trend as this was not firing initial default zoom event
    // In case of out of scope the counter was getting set as wrong. and the zoom was not
    // getting fired hence setting counter based on on Access Denied series
    // this invokes the appropriate zoom event.
    const inScopeCount: number = isNullOrUndefined(trendSeriesCollection) ? 0 : trendSeriesCollection.length;
    this.trendDefinitionService.setTotalNumberOfSeries(inScopeCount);

    const searchString: string[] = trendSeriesCollection.map(
      tsd =>
        // todo: if there are number of series having same objectIdOftrendedObject then optimize this call.
        tsd.TrendedObjectId
    );
    const readProperty: Observable<PropertyInfo<PropertyDetails>[]> = this.propertyServiceBase.readPropertiesMulti(searchString, 3, true);
    const searchNodes: Observable<ObjectNode[]> = this.systemBrowserService.searchNodeMultiple(this.selectedObject.SystemId, searchString, false);
    this.subscriptions.push(forkJoin([readProperty, searchNodes]).subscribe(result => {
      this.propertyCollection = result[0];
      this.objectNodeCollection = result[1];
      this.calculateOldestTimeStamp(trendSeriesCollection);
      this.addSeries(trendSeriesCollection, tvd);
      // todo: debug trace for response received.
      // Bulk Subscription
      const ids: string[] = this.subscriptionIds.map(sub => (sub.split(TrendChartConstants.SUB_ID_SEPERATOR.toString())[0]));

      this.propValueChangedObservableArray = this.trendSnapinService.getPropertyValuesObservables(ids);

      this.bulkSubscription(this.propValueChangedObservableArray, this.subscriptionIds);

      // start live udpate after adding all the series
      if (isLiveUpdateStarted) {
        this.trendviewerService.startLiveUpdate(this.snapinId);
      } else {
        this.trendviewerService.stopLiveUpdate(this.snapinId);
      }
    },
    error => {
      this.traceService.error(this.traceModule, 'TrendChartComponent.readTrendViewDefinition().searchNodes() error', error);
    }));
  }

  // Sets the number of samples to be fetched for a selected trend
  // For TVD, this coniguration is saved and shall be read from there
  // For other types, the default is 100 samples
  private setNumberOfSamplesForSaveAsTvd(noOfSamples: number): void {
    this.traceService.debug(this.traceModule,
      'TrendChartComponent.readTrendViewDefinition():setting number of samples for the trend view definition, no.of samples: ',
      noOfSamples);
    // this nuber of samples are shall be used while save as TVD only.
    // to view number of samples are currently used from general settings
    this.trendDefinitionService.originalNumberOfSamples = noOfSamples;
  }

  private setChartProperties(tvd: any, isLiveUpdateStarted: boolean, subChartGridModel: any): void {

    const xAxis: ChartXAxis = {
      type: AxisTypes.Time,
      gridIndex: 0, // ToDo : check with rule implementation integration
      splitLine: {
        show: false
      }
    };

    const startTime: number = new Date(tvd.TimeRange.AbsoluteTimeRange.From).getTime();
    const endTime: number = new Date(tvd.TimeRange.AbsoluteTimeRange.To).getTime();
    let relativeTimeConfiguration: RelativeTimeConfig;
    let zoomRange: DataZoomRange;
    let zoomRangeRelative: DataZoomRange;
    let isRelative: boolean;

    if (tvd.TimeRange.RelativeTimeRange) {
      relativeTimeConfiguration = {
        unitValue: tvd.TimeRange.RelativeTimeRange.NumberOfTimeUnits,
        relativeTimeRange: RelativeTime[tvd.TimeRange.RelativeTimeRange.TimeUnit] as RelativeTimeRange
      };
    }
    if (tvd.TimeRange.IsFullRangeSaved) {
      tvd.TimeRange.ValidTimeRange = 2;
      relativeTimeConfiguration.relativeTimeRange = (RelativeTimeRanges.All) as RelativeTimeRanges;
      isRelative = true;
      zoomRange = { start: 0, end: 100 };
    } else {
      // Relative Time Range
      if (tvd.TimeRange.ValidTimeRange === 2) {
        isRelative = true;
        zoomRange = isLiveUpdateStarted ? this.getZoomRange(relativeTimeConfiguration)
          : { startValue: startTime, endValue: endTime };
      }
      // Absolute Time Range
      if (tvd.TimeRange.ValidTimeRange === 1) {
        if (relativeTimeConfiguration) {
          zoomRangeRelative = this.getZoomRange(relativeTimeConfiguration);
        }

        if (zoomRangeRelative && zoomRangeRelative.visibleWidth === (endTime - startTime)) {
          isRelative = true;
          zoomRange = isLiveUpdateStarted ? zoomRangeRelative : { startValue: startTime, endValue: endTime };
        } else {
          if (isLiveUpdateStarted) {
            const timeDiff: number = endTime - startTime;
            zoomRange = { visibleWidth: timeDiff, end: 100 };
          } else {
            zoomRange = { startValue: startTime, endValue: endTime };
          }
        }
      }
    }

    if (!isRelative) {
      relativeTimeConfiguration = undefined;
    }

    this.trendDefinitionService.setPresetZoomConditions(zoomRange);
    let chartPath = '';
    if (this.displayNameType === CnsLabelEn.Name ||
            this.displayNameType === CnsLabelEn.NameAndDescription ||
            this.displayNameType === CnsLabelEn.NameAndAlias) {
      chartPath = this.selectedObject.Designation;
    } else {
      chartPath = this.selectedObject.Location;
    }
    const location: any = {
      id: this.selectedObject.Designation,
      path: this.getParentLocation(chartPath),
      enable: false
    };

    const chartProperties: any = {
      /* Defect 1209745 - If we change the Trend view definition title and without
         saving click on same tvd in system browser, then save it via save confirmation dialog. */
      // In System Browser name of the TVD is getting updated but in Trend chart it is showing the previous name
      // In this case, we are getting "selectedObject" details of selected node which is old one and does not have updated Descriptor.
      title: this.trendDefinitionService.currentTVD.NameTvd !== undefined && this.trendDefinitionService.currentTVD.NameTvd !== this.selectedObject.Descriptor
        ? this.trendDefinitionService.currentTVD.NameTvd : this.selectedObject.Descriptor,
      xAxis: [xAxis],
      yAxisPointer: true,
      legendTooltip: true,
      iconEnum: this.qualityIconService.getIconEnum(),
      dataZoomRange: zoomRange,
      showCustomLegend: true,
      relativeTimeConfiguration,
      isNewTrend: false,
      location,
      showQualityIndication: this.trendDefinitionService.generalSettingsQualityIndication
    };

    if (subChartGridModel.length > 0) {
      chartProperties.subChartGrids = clone(subChartGridModel);
    }

    // Set the chart configuration
    this.traceService.debug(this.traceModule, 'TrendChartComponent.readTrendViewDefinition():setting chart properties');
    this.trendviewerService.setChartProperties(this.snapinId, chartProperties);

  }

  private addSeries(trendSeriesCollection: TrendSeriesDefinition[], tvd: TrendViewDefinition): string[] {
    this.subscriptionIds = [];
    trendSeriesCollection.forEach(tsd => {
      this.processTSD(tsd, tvd);
    });

    return this.subscriptionIds;
  }

  private calculateGridIndex(tsd: any, trendSeries: TrendSeries | NonTrendSeries, identifier: string): number {
    const gridIndex: number = this.subChartGridModel.findIndex(chart => chart.categoryId === tsd.SubChartId);
    return gridIndex === -1 ? undefined : gridIndex;
  }

  private getYAxisProperties(trendSeries: TrendSeries, tvd: TrendViewDefinition, gridIndex: number): ChartYAxis {
    const isLeft: boolean = trendSeries.position === 'left' ? true : false;
    // If tvd is created from standard client, keep default min/max and autoscaling true
    if (tvd.SubChartCollection.SubCharts.length === 0) {
      const yAxisProperties: ChartYAxis = {
        position: trendSeries.position,
        type: trendSeries.seriesType,
        name: trendSeries.unit,
        min: 0,
        max: 100,
        scale: true,
        data: trendSeries.enumTexts,
        categoryId: trendSeries.textGroupId
      };
      return yAxisProperties;
    } else {
      // here we need to check what default values to assign if we dont have subchart
      const subChart: SubChartRepresentation = tvd.SubChartCollection.SubCharts[gridIndex];
      const min = subChart ? (isLeft ? subChart.AxisYLeft?.ScaleMin : subChart.AxisYRight?.ScaleMin) : 0;
      const max = subChart ? (isLeft ? subChart.AxisYLeft?.ScaleMax : subChart.AxisYRight?.ScaleMax) : 100;
      const scale = subChart ? (isLeft ? subChart.AxisYLeft?.AutoScale : subChart.AxisYRight?.AutoScale) : true;
      const yAxisProperties: ChartYAxis = {
        gridIndex,
        position: trendSeries.position,
        type: trendSeries.seriesType,
        name: trendSeries.unit,
        min,
        max,
        scale,
        data: trendSeries.enumTexts,
        categoryId: trendSeries.textGroupId
      };
      return yAxisProperties;
    }
  }
  private getAxisPosition(axisAttachment: string): YAxisPosition {
    if (axisAttachment === AxisAttachment[AxisAttachment.ToRight]) {
      return YAxisPositions.Right;
    }
    return YAxisPositions.Left;
  }

  private isHiddenSet(trendId: string, identifier: string, collectorId: string, visibility: boolean, isNonTrended: boolean): boolean {
    const seriesCollectionId: string = trendId + ':' + collectorId;
    if (this.trendDefinitionService.retainedState) {
      const hiddenSeries: Set<string> = this.trendDefinitionService.retainedState.trendChartState.hiddenSeries;
      if (hiddenSeries) {
        if (this.trendviewerService.getHiddenSeries(this.snapinId).has(seriesCollectionId)) {
          const index: number = this.trendDefinitionService.retainTrendSeries.findIndex(series =>
            series.UniqueId === trendId && series.collectorId === collectorId);
          if (index !== -1) {
            this.trendviewerService.getHiddenSeries(this.snapinId).delete(seriesCollectionId);
            this.trendviewerService.getHiddenSeries(this.snapinId).add(identifier);
          }
          return true;
        }
      }
    }
    if (isNonTrended && visibility === false) {
      this.trendviewerService.getHiddenSeries(this.snapinId).delete(seriesCollectionId);
      this.trendviewerService.getHiddenSeries(this.snapinId).add(identifier);
      return true;
    }
    return false;
  }
}
