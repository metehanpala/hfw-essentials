/* eslint-disable no-warning-comments */
import { Injectable } from '@angular/core';
import {
  BrowserObject, CnsLabelEn, GmsManagedTypes, GmsSubscription, ObjectNode, PropertyDetails,
  PropertyInfo, PropertyServiceBase, RelativeTime, SystemBrowserServiceBase, TrendSeriesInfo,
  TrendServiceBase, ValidationInput, ValueDetails, ValueServiceBase
} from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { YAxisPosition } from '@simpl/charts-ng';
import { SiToastNotificationService } from '@simpl/element-ng';
import {
  AddSeriesType, AxisType, ChartXAxis, ContentActions, DataZoomRange, LineStepType,
  RelativeTimeConfig, RelativeTimeRange, SeriesProperties, SiTrendviewerConfigService, SiTrendviewerService,
  TrendSeries as TrendSeriesSimpl, TrendViewerConfig
} from '@simpl/trendviewer-ng';
import { forkJoin, Observable, throwError as observableThrowError, of, Subject, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { NonTrendSeries } from '../common/interfaces/nonTrendSeries';
import { ManagedType, TrendActiveView, TrendChartConstants, TrendType } from '../common/interfaces/trend.models';
import { TrendSeries } from '../common/interfaces/trendSeries';
import { TrendSeriesBase } from '../common/trendSeriesBase';
import { QualityIconService } from '../services/quality-icon-service';
import { TrendDefinitionService } from '../services/trend-definition-service';
import { QualityIconProvider } from '../services/trend-quality-icon-service';
import { TrendSnapinService } from '../services/trend-snapin.service';
import { AxisTypes, InterpolationOptions, RelativeTimeRanges, YAxisPositions } from '../shared/trend-searched-item';
import { TrendBaseManager } from './trendBase.manager';

@Injectable({
  providedIn: 'root'
})
export class TrendLogManager extends TrendBaseManager {

  constructor(
    public trendViewerConfigService: SiTrendviewerConfigService,
    public siToastService: SiToastNotificationService,
    public valueService: ValueServiceBase,
    private readonly traceService: TraceService,
    private readonly trendServiceBase: TrendServiceBase,
    private readonly trendDefinitionService: TrendDefinitionService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly trendSnapinService: TrendSnapinService,
    private readonly trendviewerService: SiTrendviewerService,
    private readonly propertyServiceBase: PropertyServiceBase,
    private readonly qualityIconService: QualityIconService,
    private readonly qualityIconProvider: QualityIconProvider) {
    super();
  }
  private readonly traceModule = 'gmsSnapins_TrendLogManager';
  private readonly subscriptions: Subscription[] = [];
  private displayNameType: CnsLabelEn;
  private selectedObject: BrowserObject;
  private isSeriesPropertyChange = false;
  private readonly snapinId = this.trendSnapinService.snapId.fullId();
  public handlePropertyChange(systemId: number, objectId: string, trendSeriesSimpl: TrendSeriesSimpl, displayNameType: CnsLabelEn): void {
    this.subscriptions.push(this.systemBrowserService.searchNodeMultiple(systemId, [objectId], false).subscribe(page => {
      if (page[0]?.Nodes && page[0]?.Nodes?.length > 0) {
        this.isSeriesPropertyChange = true;
        // Retain original series that will be reused after discard for resetting the original series on chart.
        this.trendDefinitionService.retainOriginalSeriesForPropertyChange(trendSeriesSimpl.identifier);

        // sending existing series identifier to replace the existing series instead of removing and adding completly new.
        // with this solution it solves the issue - on property change legends in chart was changing and new series was getting
        // added at the end of legend list
        this.createNewTrendViewDefinition(page[0].Nodes[0], false, trendSeriesSimpl, displayNameType, trendSeriesSimpl.identifier);
      }
    }));
  }

  public deleteTrend(objectId: string, validationInput: ValidationInput): Observable<boolean> {
    return new Observable(observer => {
      this.trendServiceBase.deleteOnlineTrendLog(objectId, validationInput).subscribe(() => {
        observer.next(true);
      },
      error => {
        this.siToastService.queueToastNotification('danger', error.statusText, '', true);
        this.trendDefinitionService.deleteTrendResponseSub.next(false);
        return observableThrowError(error);
      });
    });
  }

  // When the selection is either Trend log online, Trend Log , Trend log multiple, create the new trend definition.
  // In these cases there is no configuration saved and the definition needs to be initialized with default configuration
  public createNewTrendViewDefinition(selectedObject: BrowserObject, addDataPoint: boolean,
    trendSeriesSimpl: TrendSeriesSimpl, displayNameType: CnsLabelEn, seriesIdentifier: string = undefined): void {
    const subscriptionIds: string[] = [];
    this.displayNameType = displayNameType;
    this.selectedObject = selectedObject;
    // Currently, Selection of New Trend from Management view is not supported.Will be covered under Edit workflows
    if (selectedObject.Attributes.ManagedType !== GmsManagedTypes.NEW_TREND.id) {
      const tlInfo: {
        isOfflineTrend: boolean; dataZoomRange: DataZoomRange;
        relativeTimeConfiguration: RelativeTimeConfig;
      } = this.getZoomRangeTL(selectedObject);
      if (!(addDataPoint || trendSeriesSimpl)) {
        this.trendSnapinService.tsdSubscriptionMapping = new Map<string, TrendSeries>();
        this.trendDefinitionService.tvdObjectId = selectedObject ? selectedObject.ObjectId : undefined;
        this.trendDefinitionService.isTVdToDelete = false;
        this.ConfigureChart(tlInfo.dataZoomRange, tlInfo.relativeTimeConfiguration);
        this.trendSnapinService.disableContentAction(tlInfo.isOfflineTrend);
        this.trendSnapinService.disableDeleteContentAction(tlInfo.isOfflineTrend);

      }
      const allSeriesSubscription: Subscription = this.getTrendSeriesCollection(selectedObject, addDataPoint, trendSeriesSimpl).subscribe(allSeries => {
        this.trendDefinitionService.startStopTrendSnapinProgress.next(false);
        const addSeriesobservable: Observable<any>[] = [];
        allSeries.forEach(series => {
          series.isOfflineTsd = tlInfo.isOfflineTrend;
          series.systemId = selectedObject.SystemId;
          // subscription array update
          const subscriptionId: string = this.getSubscriptionId(series.trendObjectInfo, series.isOfflineTsd);
          const newSubscriptionId: string = this.createSubscriptionId(subscriptionId, series.trendObjectInfo.TrendseriesId);
          // Upending trendseries id to make subscription id unique for TLM as for TLM we get same subscription id for all trend series
          subscriptionIds.push(newSubscriptionId);
          // tsd subscription mapping update
          this.trendSnapinService.tsdSubscriptionMapping.set(newSubscriptionId, series);
          if (addDataPoint || trendSeriesSimpl) {
            const endDate: Date = new Date();
            // Had to send new date to getStartDate because of shallow copy issue
            const startDate: Date = this.getStartDate(this.trendDefinitionService.timeRange, new Date());
            series.trendSeriesMaxTimestamp = endDate.toISOString();
            series.trendSeriesMinTimestamp = startDate.toISOString();
          }
          if (trendSeriesSimpl) {
            if (seriesIdentifier) {
              trendSeriesSimpl.identifier = seriesIdentifier;
            } else {
              trendSeriesSimpl.identifier = undefined;
            }
          }

          // check from where series is getting added.
          const addSeriesType = this.checkAddSeriesType(addDataPoint, trendSeriesSimpl);
          this.isSeriesPropertyChange = false;
          // pass as a parameter
          addSeriesobservable.push(this.addSeries(series, trendSeriesSimpl, addSeriesType).pipe(catchError(error => of(error))));
        });
        this.subscriptions.push(forkJoin(addSeriesobservable).subscribe(response => {
          if (!(addDataPoint || trendSeriesSimpl)) {
            if (this.trendDefinitionService.retainedState) {
              if (this.trendDefinitionService.retainedState.activeView === TrendActiveView.view &&
                this.trendDefinitionService.retainedState.trendChartState.isLive) {
                this.trendviewerService.startLiveUpdate(this.trendSnapinService.snapId.fullId());
              }
            } else {
              this.trendviewerService.startLiveUpdate(this.snapinId);
            }
          }
          // this.SUB_ID_SEPERATOR doesn"t work inside a forkjoin as the this context is that of the forkjoin.
          if (subscriptionIds && subscriptionIds.length > 0) {
            const propValueChangedObservableArray: GmsSubscription<ValueDetails>[] =
              this.trendSnapinService.getPropertyValuesObservables([subscriptionIds[0].split(TrendChartConstants.SUB_ID_SEPERATOR)[0]]);
            this.bulkSubscription(propValueChangedObservableArray, subscriptionIds);
          }
        }));
        allSeriesSubscription.unsubscribe();
      }, error => {
        this.traceService.error(this.traceModule, 'TrendChartComponent.readTLM() error', error);
        allSeriesSubscription.unsubscribe();
      });
      this.subscriptions.push(allSeriesSubscription);
    }
  }

  // Create the new trend definition.
  // In this case there is no configuration saved and the definition needs to be initialized with default configuration
  public createEmptyChartTrendViewDefinition(selectedObject: BrowserObject,
    displayNameType: CnsLabelEn): void {
    this.displayNameType = displayNameType;
    this.selectedObject = selectedObject;
    const tlInfo: {
      isOfflineTrend: boolean; dataZoomRange: DataZoomRange;
      relativeTimeConfiguration: RelativeTimeConfig;
    } = this.getZoomRangeTL(selectedObject);
    // To handle the retain state for play/pause in offline/online
    if (this.trendDefinitionService.retainedState) {
      const isLiveUpdateStarted = this.trendDefinitionService.retainedState.trendChartState.isLive;
      if (!isLiveUpdateStarted) {
        this.trendviewerService.stopLiveUpdate(this.snapinId);
      } else {
        this.trendviewerService.startLiveUpdate(this.snapinId);
      }
    } else {
      this.trendviewerService.startLiveUpdate(this.snapinId);
    }
    this.ConfigureChart(tlInfo.dataZoomRange, tlInfo.relativeTimeConfiguration, true);
    // Delete will be disabled for empty chart
    this.trendSnapinService.disableContentAction(true);
    this.trendSnapinService.disableDeleteContentAction(true);
  }

  public unsubscribeWsisubscriptions(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
    this.trendSnapinService.unsubscribeAllCOVs();
  }
  // TODO: to rename to newlyTrendedObjectSubscription
  public nonTrendedObjectTrendValueSubscription(): void {
    const subscriptionIds: string[] = [];
    this.trendSnapinService.nonTrendedSeriesCollcetion.forEach(series => {
      const subscriptionId: string = this.getSubscriptionId(series.trendObjectInfo, series.isOfflineTsd);
      const newSubscriptionId: string = this.createSubscriptionId(subscriptionId, this.getSeriesIdentifier());
      subscriptionIds.push(newSubscriptionId);
      // tsd subscription mapping update
      this.trendSnapinService.tsdSubscriptionMapping.set(newSubscriptionId, series);
    });
    if (subscriptionIds && subscriptionIds.length > 0) {
      const propValueChangedObservableArray: GmsSubscription<ValueDetails>[] =
          this.trendSnapinService.getPropertyValuesObservables([subscriptionIds[0].split(TrendChartConstants.SUB_ID_SEPERATOR)[0]]);
      this.bulkSubscription(propValueChangedObservableArray, subscriptionIds);
    }
  }

  // Handle subscription for previously non-trended objects (before save non trended objects).
  public updateNonTrendedSeriesContentActions(): void {
    this.trendSnapinService.nonTrendedSeriesCollcetion.forEach((series, identifier) => {
      const contentActions: ContentActions = this.trendSnapinService.getContentActions(series);
      const seriesProperties: any = {
        contentActions
      };
      this.trendviewerService.updateSeriesProperties(this.snapinId, identifier, seriesProperties, true);
    });
  }

  private checkAddSeriesType(addDataPoint: boolean, trendSeriesSimpl: TrendSeriesSimpl): AddSeriesType {
    if (this.isSeriesPropertyChange) {
      return AddSeriesType.PropertyChange;
    }
    return addDataPoint || trendSeriesSimpl ? AddSeriesType.AddDatapoint : AddSeriesType.Initial;
  }

  private getTrendSeriesCollection(selectedObject: BrowserObject, addDataPoint: boolean, trendSeriesSimpl: TrendSeriesSimpl):
  Observable<TrendSeries[] | NonTrendSeries[]> {
    const observable: Observable<TrendSeries[] | NonTrendSeries[]> = new Observable(observer => {
      let retVal: TrendSeries[] | NonTrendSeries[] = [];
      this.subscriptions.push(this.trendServiceBase.getTrendSeriesInfo(selectedObject.ObjectId).subscribe(trendSeriesInfo => {
        this.traceService.debug(this.traceModule, 'TrendChartComponent.createNewTrendViewDefinition().getTrendSeriesInfo():', trendSeriesInfo);
        if (trendSeriesInfo) {
          // this condition is added to get tsd only for online trends in case of add and modify datapoints.
          if ((addDataPoint || trendSeriesSimpl) && selectedObject
            && (!selectedObject.Attributes?.ManagedTypeName.startsWith(ManagedType.TrendLog)
            && selectedObject.Attributes?.ManagedType !== GmsManagedTypes.TRENDVIEWDEFINITION.id
            && selectedObject.Attributes?.ManagedType !== GmsManagedTypes.TREND_LOG_PREDICTED.id)) {

            // this had to be done as there is no flag provided to identify onlin tsds from WSI
            // should be removed once WSI provides fals to identify online tsds
            const collectorIds: string[] = this.getCollectorIds(trendSeriesInfo, addDataPoint, selectedObject, trendSeriesSimpl);
            if (collectorIds.length <= 0) {
              this.subscriptions.push(this.handleNonTrendedObject(selectedObject, addDataPoint, trendSeriesSimpl).subscribe(result => {
                observer.next(result);
                observer.complete();
              }));
            } else {
              let filterCondition: (tsd: TrendSeriesInfo) => boolean;
              if (trendSeriesInfo.filter(tsd => tsd.TrendType === TrendType.TrendLogOnline).length > 1) {
                // will get called when property is changed from select property then decision to show property is based on the selected property selection
                if (trendSeriesSimpl?.properties?.selectedProperty !== undefined) {
                  filterCondition = (tsd: TrendSeriesInfo): boolean => tsd.TrendType === TrendType.TrendLogOnline &&
                    tsd.PropertyName === trendSeriesSimpl?.properties?.selectedProperty;
                } else { // will get called in case of add data point in that case if selected from mgmt. view in that case we have to show default property
                  filterCondition = (tsd: TrendSeriesInfo): boolean => tsd.TrendType === TrendType.TrendLogOnline &&
                    tsd.PropertyName === selectedObject?.Attributes?.DefaultProperty;
                }
              } else {
                // when the added series didn't have only one TLO created
                // (will get called in case of add data point of online data point or if the selected point from mgmt. view have only one TLO)
                filterCondition = (tsd: TrendSeriesInfo): boolean => tsd.TrendType === TrendType.TrendLogOnline;
              }
              const onlineTSInfo: TrendSeriesInfo = trendSeriesInfo.find(filterCondition);
              if (!!onlineTSInfo) {
                this.subscriptions.push(this.getTSDCollection([onlineTSInfo], selectedObject).subscribe(result => {
                  retVal = result;
                  observer.next(retVal);
                  observer.complete();
                }));
              } else {
                this.subscriptions.push(this.handleNonTrendedObject(selectedObject, addDataPoint, trendSeriesSimpl).subscribe(result => {
                  observer.next(result);
                  observer.complete();
                }));
              }
            }
          } else {
            this.subscriptions.push(this.getTSDCollection(trendSeriesInfo, selectedObject).subscribe(result => {
              retVal = result;
              observer.next(retVal);
              observer.complete();
            }));
          }
        } else {
          // Non trended series
          this.subscriptions.push(this.handleNonTrendedObject(selectedObject, addDataPoint, trendSeriesSimpl).subscribe(result => {
            observer.next(result);
            observer.complete();
          }));
        }
      },
      error => {
        this.traceService.error(this.traceModule, 'TrendChartComponent.createNewTrendViewDefinition().getTrendSeriesInfo() error', error);
        observer.error(error);
        observer.complete();
      }));
    });
    return observable;
  }

  private getCollectorIds(trendSeriesInfo: TrendSeriesInfo[], addDataPoint: boolean,
    selectedObject: BrowserObject, trendSeriesSimpl: TrendSeriesSimpl): string[] {
    return trendSeriesInfo.filter(tsi => {
      if ((addDataPoint && tsi.PropertyName === selectedObject.Attributes.DefaultProperty) ||
      (trendSeriesSimpl && tsi.PropertyName === trendSeriesSimpl.properties.selectedProperty)) {
        return tsi.CollectorObjectOrPropertyId;
      }
    }).map(tsd => {
      if (!isNullOrUndefined(tsd.CollectorObjectOrPropertyId) && tsd.CollectorObjectOrPropertyId !== '') {
        return tsd.CollectorObjectOrPropertyId;
      }
    });
  }

  private handleNonTrendedObject(selectedObject: BrowserObject, addDataPoint: boolean, trendSeriesSimpl: TrendSeriesSimpl): Observable<NonTrendSeries[]> {
    const observable: Observable<NonTrendSeries[]> = new Observable(observer => {
      const retVal: NonTrendSeries[] = [];
      const trendSeries = new NonTrendSeries(this.trendServiceBase, this.traceService,
        this.trendDefinitionService, this.valueService, this.trendSnapinService, this.qualityIconProvider);
      const page: ObjectNode[] = [{ ObjectId: selectedObject.ObjectId, Nodes: [selectedObject], ErrorCode: undefined }];
      this.subscriptions.push(this.propertyServiceBase.readPropertiesMulti([selectedObject.ObjectId], 3, true).subscribe(propertyInfo => {
        this.traceService.debug(this.traceModule, 'TrendChartComponent.createNewTrendViewDefinition().readProperties():', propertyInfo);
        let trendInfo: TrendSeriesInfo;
        if (addDataPoint || !!trendSeriesSimpl) {
          trendInfo = new TrendSeriesInfo();
          trendInfo.ObjectId = selectedObject.ObjectId;
          trendInfo.PropertyName = !!trendSeriesSimpl ? trendSeriesSimpl.properties.selectedProperty
            : selectedObject.Attributes.DefaultProperty;
          /* NOTE: This is special case of add datapoint / property change.
           If point is non trended and it has HDB data, then we want to show HDB data in chart. */
          // in this case, we dont receive TLO and so no TrendseriesId. But to fetch HDB data, we need TrendSeriesId.
          /* so, to handle this case, we are creating TrendSeriesId on Flex side as there is not way to get it from WSI.
            This shall not be done else where in Trend Flex */
          trendInfo.TrendseriesId = trendInfo.ObjectId + '.' + trendInfo.PropertyName + ':_offline.._value';
        }
        this.getSeriesInfo(trendInfo, page, propertyInfo, selectedObject.Attributes.DefaultProperty, trendSeries);
        if (trendSeries.isBinarySeries) {
          this.trendSnapinService.populateEnumTexts(selectedObject.SystemId, trendSeries.textGroupId).
            subscribe(enumString => {
              this.trendSnapinService.setTrendSeriesEnumDict(trendInfo.TrendseriesId, enumString);
              trendSeries.enumTexts = enumString.map(item => item.Descriptor);
            });
        }
        retVal.push(trendSeries);
        observer.next(retVal);
        observer.complete();
      }));
    });
    return observable;
  }

  private bulkSubscription(propValueChangedObservableArray: GmsSubscription<ValueDetails>[], subscriptionIds: string[]): void {
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
            error => this.traceService.error(this.traceModule, 'TrendChartComponent.bulkSubscription():' + error));
          if (!!trendSeries) { this.trendSnapinService.covSubscription.set(trendSeries.seriesIdentifier, tsdSubscription); }
        });
      }
    });
  }

  private addSeries(series: TrendSeries, existingSeries: TrendSeriesSimpl, addSeriesType: AddSeriesType): Observable<any> {
    const observable: Observable<any> = new Observable(observer => {
      const contentActions: ContentActions = this.trendSnapinService.getContentActions(series);
      const isUnknownTL = series.trendObjectInfo.ObjectId === undefined;
      const seriesProperties: SeriesProperties = {
        name: this.trendDefinitionService.getDisplayNameDescription(this.displayNameType, series.seriesCNSInfo),
        smooth: undefined,
        legendTooltipText: this.trendDefinitionService.getLegendToolTipText(this.displayNameType, series.seriesCNSInfo),
        yAxisProperties: {
          position: YAxisPositions.Left,
          type: series.seriesType,
          scale: true,
          min: 0,
          max: 100,
          name: series.unit ? series.unit : '',
          data: series.enumTexts,
          categoryId: series.textGroupId
        },
        // add customName property here
        properties: series.propertyList,
        selectedProperty: series.trendObjectInfo.PropertyName,
        lineStepType: series.isBinarySeries ? InterpolationOptions.Start : undefined,
        visible: true,
        unit: series.unit,
        resolution: series.resolution,
        markerSymbolSize: 0,
        symbolSize: TrendChartConstants.SYMBOL_SIZE_OFFSET + 1,
        contentActions
      };

      if (existingSeries?.properties) {
        seriesProperties.lineColor = existingSeries.properties.lineColor;
        seriesProperties.yAxisProperties.position = seriesProperties.yAxisProperties.type !== 'category' ?
          existingSeries.properties.yAxisProperties.position : seriesProperties.yAxisProperties.position;
        seriesProperties.lineType = existingSeries.properties.lineType;
        seriesProperties.lineWidth = existingSeries.properties.lineWidth;
        seriesProperties.markerSymbolSize = existingSeries.properties.markerSymbolSize;
        seriesProperties.selectedProperty = existingSeries.properties.selectedProperty;
        seriesProperties.showSymbol = existingSeries.properties.showSymbol;
        seriesProperties.smooth = undefined;
        seriesProperties.symbol = existingSeries.properties.symbol;
        seriesProperties.symbolSize = existingSeries.properties.symbolSize;
        seriesProperties.visible = existingSeries.properties.visible;
      }
      if (isUnknownTL) {
        // to handle unknown trend name kept empty space else [seriesId + ':'] will appear
        seriesProperties.name = ' ';
      }
      let identifier: string = this.getSeriesIdentifier();
      if (existingSeries?.identifier) {
        identifier = existingSeries.identifier;
      }
      series.seriesIdentifier = identifier;
      const seriesUniqueId: string = series.trendObjectInfo.ObjectId + '_' + series.trendObjectInfo.PropertyName;
      const seriesIdentifier: string = identifier + ':' + series.seriesCNSInfo.seriesDisplayName;
      // update in series array for storage state
      this.trendDefinitionService.updateStorageSeries(identifier, seriesUniqueId, series.trendObjectInfo.CollectorObjectOrPropertyId);
      seriesProperties.visible = !this.isHiddenSet(seriesUniqueId, seriesIdentifier,
        series.trendObjectInfo.CollectorObjectOrPropertyId, seriesProperties.visible);
      if (series.isBinarySeries) {
        this.trendSnapinService.populateEnumTexts(series.systemId, series.textGroupId).subscribe(enumString => {
          seriesProperties.yAxisProperties.data = enumString.map(item => item.Descriptor);
          this.trendviewerService.updateSeriesProperties(this.snapinId, identifier, seriesProperties, false);
        });
      }
      // Below code will assign series identifier for which we need to add dummy data on timerange change
      const config = this.trendViewerConfigService.get();
      if (config.seriesToShowCurrentData === undefined) {
        config.seriesToShowCurrentData = '-1';
      }
      if (config.seriesToShowCurrentData === '-1' && seriesProperties.visible) {
        config.seriesToShowCurrentData = series.isOfflineTsd ? '-1' : identifier;
      }
      this.trendViewerConfigService.update(config);

      if (series?.trendObjectInfo && series?.trendObjectInfo?.TrendseriesId) {
        this.subscriptions.push(this.trendServiceBase.getBorderTimeRangeForTrend(series.trendObjectInfo.TrendseriesId).subscribe(borderRange => {
          this.traceService.debug(this.traceModule, 'TrendChartComponent.getBorderTimeRangeForTrend():', borderRange);
          if (borderRange) {
            if (borderRange.From !== borderRange.To) {
              series.trendSeriesMinTimestamp = borderRange.From;
              series.trendSeriesMaxTimestamp = borderRange.To;
            } else if (borderRange.From === borderRange.To) {
              // set default time range if To and From values are equal from WSI.
              const toDate: Date = new Date(borderRange.To);
              const fromDate: Date = new Date(borderRange.To);
              this.trendSnapinService.setDefaultTimeRangeInSeries(series, fromDate, toDate);
            }
          } else {
            this.trendSnapinService.setDefaultTimeRangeInSeries(series, new Date(), new Date());
          }
          this.prepareSeriesObject(identifier, series, existingSeries, seriesProperties, observer, addSeriesType);
        },
        error => {
          this.traceService.error(this.traceModule, `TrendChartComponent.addseries()`, error);
          observer.error();
          observer.complete();
        }));
      } else {
        this.prepareSeriesObject(identifier, series, existingSeries, seriesProperties, observer, addSeriesType);
      }
    });
    return observable;
  }

  private prepareSeriesObject(identifier: string, series: TrendSeries, existingSeries: TrendSeriesSimpl, seriesProperties: SeriesProperties,
    observer, addSeriesType: AddSeriesType): void {
    this.trendDefinitionService.cacheTrendedObjectInfo(identifier, series);
    if (series instanceof NonTrendSeries) {
      this.trendSnapinService.nonTrendedSeriesCollcetion.set(identifier, series);
    } else {
      this.trendDefinitionService.removeUnusedNonTrendedSeries(identifier, series?.trendObjectInfo?.PropertyName);
    }
    if (series.isOfflineTsd) {
      this.trendSnapinService.offlineSeriesCollection.set(identifier, series);
    }
    // adds a series to chart
    this.trendviewerService.addSeries(this.snapinId, {
      // Store the identifier. as this will be needed when the data is requested by control. also for other operations by control.
      identifier,
      gridIndex: existingSeries ? existingSeries.gridIndex : this.trendDefinitionService.subChartIndex,
      properties: seriesProperties
    }, addSeriesType);
    observer.next();
    observer.complete();
  }

  private getZoomRangeTL(selectedObject: BrowserObject): {
    isOfflineTrend: boolean; dataZoomRange: DataZoomRange;
    relativeTimeConfiguration: RelativeTimeConfig; } {
    let isOfflineTrend: boolean;
    if (selectedObject && selectedObject.Attributes.ManagedTypeName !== ManagedType.TrendLogOnline
        && selectedObject.Attributes.ManagedTypeName.startsWith(ManagedType.TrendLog)) {
      // For offline trends, subscription is done on the buffer size. when the buffer gets full, the data will be
      // fetched in case of live update
      isOfflineTrend = true;
    } else {
      // For Online trends, subscription is done on the trended property, when the value changes,
      // it is updated in the charts
      isOfflineTrend = false;
    }
    const relativeTimeConfiguration = {
      unitValue: this.trendDefinitionService.timeRange.timeRangeValue,
      relativeTimeRange: this.trendDefinitionService.timeRange.timeRangeUnit as RelativeTimeRange
    };
    const dataZoomRange = this.getZoomRange(relativeTimeConfiguration);

    // In case of offline trend, we show data for last 60 minutes, and for online we show data for last 5 mins
    return { isOfflineTrend, dataZoomRange, relativeTimeConfiguration };
  }

  // configure x axis and chart properties depending on series type
  private ConfigureChart(dataZoomRange: DataZoomRange, relativeTimeConfiguration: RelativeTimeConfig, isEmptyChart?: boolean): void {
    const xAxis: ChartXAxis = {
      type: AxisTypes.Time,
      gridIndex: this.trendDefinitionService.subChartIndex ?? 0, // ToDo : check with rule implementation integration
      splitLine: {
        show: false
      }
    };

    const chartProperties: any = {
      xAxis: [xAxis],
      yAxisPointer: true,
      legendTooltip: true,
      iconEnum: this.qualityIconService.getIconEnum(),
      dataZoomRange,
      showCustomLegend: true,
      relativeTimeConfiguration,
      showQualityIndication: this.trendDefinitionService.generalSettingsQualityIndication
    };

    chartProperties.isNewTrend = true;
    chartProperties.location = {
      id: '',
      path: '',
      enable: true
    };
    if (!isEmptyChart) {
      chartProperties.title = this.selectedObject.Descriptor;
    }

    this.trendDefinitionService.setPresetZoomConditions(dataZoomRange);

    // Apply the chart properties
    this.trendviewerService.setChartProperties(this.snapinId, chartProperties);
  }

  private getSeriesInfo(tsdInfo: TrendSeriesInfo, page: ObjectNode[], propertyInfo: PropertyInfo<PropertyDetails>[],
    defaultProperty: string, trendSeries: TrendSeries): void {
    let propName = '';
    let pageElement: ObjectNode;
    let propInfoElement: PropertyInfo<PropertyDetails>;

    if (tsdInfo && !isNullOrUndefined(tsdInfo.ObjectId) && tsdInfo.ObjectId !== '') {
      pageElement = page.find(pageNode => pageNode.Nodes[0].ObjectId === tsdInfo.ObjectId);
    } else if (page[0]?.Nodes[0]) {
      pageElement = page[0];
    }

    if (!!tsdInfo) {
      trendSeries.trendObjectInfo = tsdInfo;
      propInfoElement = propertyInfo.find(propertyInfoElement => propertyInfoElement.ObjectId === tsdInfo.ObjectId);
      propName = trendSeries.setPropertyInfo(propInfoElement, tsdInfo.PropertyName);
      // setting trended object information that will be used for content action
      trendSeries.ObjectIdOfTrendLog = trendSeries.isOfflineTsd ? tsdInfo.CollectorObjectOrPropertyId : undefined;
      trendSeries.ObjectIdOfTrendLogOnline = !trendSeries.isOfflineTsd ? tsdInfo.CollectorObjectOrPropertyId : undefined;
      trendSeries.ObjectIdOfTrendedObject = tsdInfo.ObjectId;
    } else {
      propInfoElement = propertyInfo[0];
      propName = trendSeries.setPropertyInfo(propInfoElement, defaultProperty);
    }
    trendSeries.setSeriesNames(propName, trendSeries.getSeriesProperties(pageElement.Nodes[0]));
    trendSeries.propertyList = this.getPropertyList(propInfoElement.Properties);
  }

  private getTSDCollection(trendSeriesInfo: TrendSeriesInfo[], selectedObject: any): Observable<TrendSeries[]> {
    const observable: Observable<TrendSeries[]> = new Observable(observer => {
      const retVal: TrendSeries[] = [];
      const objectIds: string[] = trendSeriesInfo.map(
        tsi => {
          if (!isNullOrUndefined(tsi.ObjectId) && tsi.ObjectId !== '') {
            return tsi.ObjectId;
          }
        });
      const objectIdsOfNull: any[] = trendSeriesInfo.filter(
        tsi => (isNullOrUndefined(tsi.ObjectId) || tsi.ObjectId === '')
      );

      // handle this separately
      if (objectIdsOfNull.length > 0) {
        // the series for which object id is not known then we cannot ask for readproperty or systembrowser call, but these series need to be shown
        // the retVal will be in differetn order than that of trendSeriesInfo, but this is ok as the scenerio in which ordering will differ
        // is only case of TL
        // in any way TL will have single series hence no need to reorder the series based on trendSeriesInfo.
        objectIdsOfNull.forEach(tsdInfoNull => {
          const trendSeries: TrendSeries = new TrendSeries(this.trendServiceBase, this.traceService,
            this.trendDefinitionService, this.valueService, this.trendSnapinService, this.qualityIconProvider);
          trendSeriesInfo.forEach(tsdInfo => {
            if (tsdInfo.ObjectId === undefined) {
              // for unknown Trend: to display trended property tsdInfo is required
              // also for unk trend propertyName is undefined thus need to set series type else charts will throw excepts
              trendSeries.trendObjectInfo = tsdInfo;
              // TODO: seriesType is set to value as for unknown trend ObjectId and propertyName is undefined.
              // The behavior for binary series is inline with the standard client
              trendSeries.seriesType = AxisTypes.Value;
            }
            retVal.push(trendSeries);
          });
        });
        observer.next(retVal);
        observer.complete();
      }
      // TODO: need to rethink on this condition because ideally the "objectIds" shouldn"t have formed in such a way that
      // there is one item which is "undefined".
      // but don"t know why that "objectIds" is getting formed need to check.
      if (objectIds.length > 0 && !isNullOrUndefined(objectIds[0])) {
        this.subscriptions.push(this.systemBrowserService.searchNodeMultiple(selectedObject.SystemId, objectIds, null).subscribe(page => {
          this.traceService.debug(this.traceModule, 'TrendChartComponent.createNewTrendViewDefinition().searchNodes():', page);
          this.subscriptions.push(this.propertyServiceBase.readPropertiesMulti(objectIds, 3, true).subscribe(propertyInfo => {
            this.traceService.debug(this.traceModule, 'TrendChartComponent.createNewTrendViewDefinition().readProperties():', propertyInfo);

            trendSeriesInfo.forEach(tsdInfo => {
              const trendSeries: TrendSeries = new TrendSeries(this.trendServiceBase, this.traceService,
                this.trendDefinitionService, this.valueService, this.trendSnapinService, this.qualityIconProvider);
              this.getSeriesInfo(tsdInfo, page, propertyInfo, selectedObject.Attributes.DefaultProperty, trendSeries);
              if (trendSeries.isBinarySeries) {
                this.trendSnapinService.populateEnumTexts(selectedObject.SystemId, trendSeries.textGroupId).
                  subscribe(enumString => {
                    this.trendSnapinService.setTrendSeriesEnumDict(tsdInfo.TrendseriesId, enumString);
                    trendSeries.enumTexts = enumString.map(item => item.Descriptor);
                  });
              }
              retVal.push(trendSeries);
            });
            observer.next(retVal);
            observer.complete();
          }, error => {
            this.traceService.error(this.traceModule, 'TrendChartComponent.createNewTrendViewDefinition().readPropertiesMulti() error', error);
            observer.error(error);
            observer.complete();
          }));
        }, error => {
          this.traceService.error(this.traceModule, 'TrendChartComponent.createNewTrendViewDefinition().searchNodeMultiple() error', error);
          observer.error(error);
          observer.complete();
        }));
      } else {
        observer.next(retVal);
        observer.complete();
      }
    });
    return observable;
  }

  private isHiddenSet(trendId: string, identifier: string, collectorId: string, visibility: boolean): boolean {
    const seriesCollectionId: string = trendId + ':' + collectorId;
    if (this.trendDefinitionService.retainedState) {
      const hiddenSeries: Set<string> = this.trendDefinitionService.retainedState.trendChartState.hiddenSeries;
      if (hiddenSeries) {
        if (this.trendviewerService.getHiddenSeries(this.snapinId).has(seriesCollectionId)) {
          this.trendviewerService.getHiddenSeries(this.snapinId).delete(seriesCollectionId);
          this.trendviewerService.getHiddenSeries(this.snapinId).add(identifier);
          return true;
        }
        return false;
      }
    }
    if (!visibility) {
      if (this.trendviewerService.getHiddenSeries(this.snapinId).has(seriesCollectionId)) {
        this.trendviewerService.getHiddenSeries(this.snapinId).delete(seriesCollectionId);
        this.trendviewerService.getHiddenSeries(this.snapinId).add(identifier);
      } else {
        this.trendviewerService.getHiddenSeries(this.snapinId).add(identifier);
      }
      return true;
    }
  }
}
