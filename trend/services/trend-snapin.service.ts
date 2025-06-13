/* eslint-disable no-warning-comments */
import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import { CompleteChartDataSource, SearchedItem, TilesViewDataResult, UnsaveDialogService } from '@gms-flex/controls';
import { FullSnapInId, IStorageService } from '@gms-flex/core';
import {
  ApplicationRight, AppRightsService, BrowserObject, CnsHelperService, CnsLabel, CommandInput, Designation, EnumerationText,
  ExecuteCommandServiceBase, GeneralSetings, GmsSubscription, ObjectNode, Page, PropertyCommand, PropertyValuesServiceBase,
  ReadCommandServiceBase, SearchOption, SystemBrowserServiceBase, TablesServiceBase, TrendDataResult, TrendSeriesDefinition,
  TrendServiceBase, TrendViewDefinition, TrendViewDefinitionUpdate, ValueDetails, ValueSubscription2ServiceBase, ViewNode, ViewType
} from '@gms-flex/services';
import { isNullOrUndefined, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import {
  AggregateViewId, ModalDialogResult, ObjectManagerSaveAction, ObjectManagerService,
  ObjectManagerServiceModalOptions, ViewFilter
} from '@gms-flex/snapin-common';
import { TranslateService } from '@ngx-translate/core';
import { SiToastNotificationService } from '@simpl/element-ng';
import { ChartDefinition, ContentActions, SiTrendviewerConfigService, TrendSeriesDetails, TrendViewerConfig } from '@simpl/trendviewer-ng';
import { firstValueFrom, forkJoin, Observable, of, Subject, Subscription, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { NonTrendSeries } from '../common/interfaces/nonTrendSeries';
import { LocationCallSource, SearchTypes, TileObject, TrendSelectionDetail } from '../common/interfaces/trend.models';
import { TrendSeries } from '../common/interfaces/trendSeries';
import { TrendSearchedItem } from '../shared/trend-searched-item';
import { TimerPhaseEnum, TimerService } from './timer-service';

const DEFAULT_PROPERTY_COLLECT = '.Log_Enable';
const COMMAND_ID = 'Collect';
const DEFAULT_TIME_RANGE_DIFFERENCE = 5 * 60 * 1000; // 5 mins

export class TrendInfo {
  public objectId: string;
  public propertyIndex: string;
  public propertyName: string;
  public collectorObjectOrPropertyId: string;
  public trendseriesId: string;
  public trendedPropertyIdentifier: string;
}

export declare const enum TrendFolder {
  ROOT,
  TVD,
  TL_ONLINE,
  TL_OFFLINE,
  TL_PREDICTED
}

export class View {
  public id: number;
  public name: string;
}

export class StaticResource {
  public static completeChartDataSourceArray: CompleteChartDataSource[] = new Array<CompleteChartDataSource>();
}

export class Series {
  public value: string;
  public quality: string;
  public qualityGood: string;
  public timestamp: string;
}
export class PrintThumbnailData {
  public trendSearchedItem: TrendSearchedItem;
  public completeChartDataSource: CompleteChartDataSource;
  public event: EventEmitter<SearchedItem>;
}

export class TrendContainerInfo {
  public trendSeriesIDs: string[];
  public lines: any[];
  public axisAttachment: string[];

  constructor() {
    this.trendSeriesIDs = [];
    this.lines = [];
    this.axisAttachment = [];
  }
}

@Injectable({
  providedIn: 'root'
})
export class TrendSnapinService implements OnDestroy {
  public textGroups: any = {};
  public addDataPoint: Subject<BrowserObject[]> = new Subject<BrowserObject[]>();
  public generalSettingsSub: Subject<void> = new Subject<void>();
  public selectedObject: BrowserObject;
  public systemId: number;
  public previousTVD: string;
  public objectTypeFilter = '{"7400":[]}';
  public readonly trendsUrl: string = '/api/trendseriesinfo/';
  public readonly trendsDataUrl: string = '/api/trendseries/';
  public printThumbnail: EventEmitter<PrintThumbnailData> = new EventEmitter<PrintThumbnailData>();
  public trendTileSelectionSub: Subject<TileObject> = new Subject<TileObject>();
  public locationChange: Subject<BrowserObject> = new Subject<BrowserObject>();
  public subSendShowProeprtiesMessage: Subject<TrendSelectionDetail> = new Subject<TrendSelectionDetail>();
  public isNewTrendWorkFlow = false;
  // If user is creating tvd from related item, below flag will handle whether to show save confirmation dialog or not
  public showSaveConfirmationForNewTrend = false;
  // Below flag will check if tvd created from related item is saved or not.
  public tvdSavedFromNewTrend = false;
  public nonTrendedSeriesCollcetion: Map<string, NonTrendSeries> = new Map<string, NonTrendSeries>();
  public offlineSeriesCollection: Map<string, TrendSeries> = new Map<string, TrendSeries>();
  public savedTVDObjectIdSub: Subject<string | undefined> = new Subject<string | undefined>();
  public saveAsTVDData: Subject<any> = new Subject<any>();
  public storage: IStorageService;
  public snapId: FullSnapInId;
  public retainedBrowserObject: BrowserObject;
  public updateContentActionSub: Subject<void> = new Subject<void>();
  public trendSeriesInfoSub: Subject<any> = new Subject<any>();
  public trendSeriesInformationDetailsSub: Subject<any> = new Subject<any>();
  public readonly translationKey: string = 'TREND_FOLDER.';

  public fullBackupData: TileObject[];
  public fullData: TileObject[];
  public displayType: Subject<SearchTypes> = new Subject<SearchTypes>();
  public searchType: SearchTypes;

  public propertyRights: boolean;
  public tsdSubscriptionMapping: Map<string, TrendSeries>;
  public covSubscription: Map<string, Subscription> = new Map<string, Subscription>();

  public trendDefaultConfig: any;
  public errorWhileManualCollect: boolean;
  public restoreScrollPositionsSub: Subject<void> = new Subject();

  public trendSelectionDetailData: TrendSelectionDetail = {
    sourceNodeDetail: null,
    action: ''
  };

  private valueSubscriptionArray: GmsSubscription<ValueDetails>[] = [];
  private sniId: string;
  private valueSubscriptionRegId: string = undefined;
  private readonly cnsLabelChangeSubscription: Subscription;
  private readonly INTERVAL: string = '20';
  private readonly TREND_FOLDER_ID: string = 'ApplicationViewTrendFolderTvd';
  private readonly newFolderKey: string = 'TREND_FOLDER.NEW_FOLDER';

  private readonly THUMBNAIL_DATA_RANGE: number = 604800000; // 1 week = 24*60*60*1000*7
  private readonly traceModule = 'gmsSnapins_TrendSnapinService';
  private subscriptions: Subscription[] = [];
  private searchSubscription: Subscription;
  private trendSeriesEnumDict: Map<string, EnumerationText[]>;
  private readonly trendConfigureOptId: number = 1730; // Configure Operation ID from WSI
  private readonly trendSnapinId: number = 54;
  private appRightsTrend: ApplicationRight;
  private readonly cmdArgs: CommandInput[];

  constructor(
    public siToastService: SiToastNotificationService,
    private readonly objectManagerService: ObjectManagerService,
    private readonly trendService: TrendServiceBase,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly valueSubscriptionService: ValueSubscription2ServiceBase,
    private readonly cnsHelperService: CnsHelperService,
    private readonly traceService: TraceService,
    private readonly translateService: TranslateService,
    private readonly appRightsService: AppRightsService,
    private readonly trendViewerConfigService: SiTrendviewerConfigService,
    private readonly tablesService: TablesServiceBase,
    private readonly settingsService: SettingsServiceBase,
    private readonly unsavedDataDialog: UnsaveDialogService,
    private readonly execCommandService: ExecuteCommandServiceBase,
    private readonly readCommandService: ReadCommandServiceBase,
    private readonly propertyValuesService: PropertyValuesServiceBase,
    private readonly timerService: TimerService
  ) {
    if (this.cnsHelperService) {
      this.cnsLabelChangeSubscription = this.cnsHelperService.activeCnsLabel.subscribe(() => {
        if (!isNullOrUndefined(this.cnsHelperService.activeCnsLabelValue)) {
          this.updateCnsValue(this.cnsHelperService.activeCnsLabelValue);
          this.displayType.next(this.searchType);
        }
      });
    }
    const config: TrendViewerConfig = this.trendViewerConfigService.get();
    config.isLocationOptionEnabled = false;
    this.trendViewerConfigService.update(config);
  }

  public ngOnDestroy(): void {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.ngOnDestroy(): unsubscribe all subscriptions');
    this.cnsLabelChangeSubscription.unsubscribe();
    this.unsubscribeAPICalls();
  }

  public trendTileSearch(options: { skip?: number; pageSize?: number } = {}): Observable<TilesViewDataResult> {
    return new Observable(observer => {
      if (!isNullOrUndefined(this.searchSubscription)) {
        this.searchSubscription.unsubscribe();
      }
      let searchWords = '';
      let searchOption: SearchOption;
      switch (this.searchType) {
        case SearchTypes.NAME:
          searchOption = SearchOption.designation;
          searchWords = this.selectedObject.Designation;
          break;
        case SearchTypes.DESCRIPTION:
          searchOption = SearchOption.description;
          searchWords = this.selectedObject.Location;
          break;
        default:
          return;
      }
      searchWords = searchWords + '.*';

      this.traceService.debug(this.traceModule, 'TrendSnapinService.trendSearch(): Search string: ', searchWords);
      this.searchSubscription = this.systemBrowserService.searchNodes(this.systemId, searchWords, this.selectedObject.ViewId,
        searchOption, false, true, undefined, 1, undefined, this.objectTypeFilter)
        .pipe(
          map((page: Page) => {
            const navigationBrowserObject: TileObject[] = [];
            page.Nodes.forEach((node: BrowserObject) => {
              const currTileObjectData: TileObject = new TileObject(node);
              navigationBrowserObject.push(currTileObjectData);
            });

            this.fullBackupData = navigationBrowserObject;
            this.fullData = this.fullBackupData;
            const skip: number = options.skip || 0;
            const pageSize: number = options.pageSize || this.fullBackupData.length;
            const tileLoadingTimeString = 'Time taken to load trend tiles in milliseconds: ';
            this.timerService.stopPhase(TimerPhaseEnum.GetTrendTileContent);
            const timeTaken = this.timerService.durationPhase(TimerPhaseEnum.GetTrendTileContent);
            this.traceService?.info(this.traceModule, tileLoadingTimeString + `${timeTaken}`);
            return ({
              data: this.fullData.slice(skip, skip + pageSize).map(item => ({ ...item })),
              total: this.fullData.length
            });
          }),
          catchError(err => {
            const subscription: Subscription = this.translateService.get('TREND_VIEWER.TEXT_LONG.UNABLE_TO_GET_SEARCH_RESULTS').subscribe(localeTextToShow => {
              this.siToastService.queueToastNotification('danger', localeTextToShow, '');
              if (subscription) {
                subscription.unsubscribe();
              }
            });
            return throwError(err);
          })
        ).subscribe(res => {
          observer.next(res);
          observer.complete();
        },
        error => {
          observer.next(error);
          observer.complete();
        });
    });
  }

  public getTrendViewDefinition(objectID: string): Observable<TrendViewDefinition> {
    return this.trendService.getTrendViewDefinition(objectID);
  }

  public unsubscribeAPICalls(): void {
    try {
      this.traceService.debug(this.traceModule, 'TrendSnapinService.unsubscribeAPICalls()');
      this.subscriptions.forEach((subscription: Subscription) => { if (!isNullOrUndefined(subscription)) { subscription.unsubscribe(); } });
      this.subscriptions = [];
      if (!isNullOrUndefined(this.searchSubscription)) {
        this.searchSubscription.unsubscribe();
      }
    } catch (error) {
      this.traceService.error(this.traceModule, error);
    }
  }

  public searchNewNode(objectId: string, systemId: number): Observable<ObjectNode[]> {
    return this.systemBrowserService.searchNodeMultiple(systemId, [objectId]);
  }

  // gets config for OM pop up
  public getObjectManagerConfig(systemId: number, addDataPoint: boolean): Observable<ObjectManagerServiceModalOptions> {
    return new Observable(observer => {
      const objectManagerConfig: ObjectManagerServiceModalOptions = {
        singleSelection: false,
        hideSearch: false
      };
      this.subscriptions.push(this.getAggregateViews(systemId).subscribe((views: AggregateViewId[]) => {
        //
        //  TODO: Review the need to get all views from the server.  It appears that the intent here is to
        //  set up an Object Manager view-filter that specifies ALL aggregate views  should be shown.  If so,
        //  this can be accomplished simply by setting the `viewIds` property in the ViewFilter to `undefined`.
        //  The Object Manager will interpret this as show-all-views.
        //  Example,
        //
        //    objectManagerConfig.views.viewIds = undefined;
        //
        //  The local `getAggregateViews` method can then be removed as this is the only place if appears to be called.
        //
        objectManagerConfig.views = this.toViewSpecification(views, null);
        if (!addDataPoint) {
          const searchSub: Observable<ObjectNode[]> = this.systemBrowserService.searchNodeMultiple(systemId, [this.TREND_FOLDER_ID]);
          const translateSub: Observable<string> = this.translateService.get(this.newFolderKey);
          this.subscriptions.push(forkJoin([searchSub, translateSub]).subscribe(res => {
            objectManagerConfig.singleSelection = true;
            const objectNodes: ObjectNode[] = res[0];
            // to handle if there is no nodes due to application rights
            if (objectNodes[0]?.Nodes) {
              // Defect 1099206: Filtering only application  view nodes to display in saveas pop up
              const applicationViewNode: BrowserObject = objectNodes[0].Nodes.find(node => node.ViewType === ViewType.Application);
              if (applicationViewNode) {
                objectManagerConfig.roots = [applicationViewNode.Designation];
                objectManagerConfig.selectableTypes = objectManagerConfig.creatableTypes =
                                    [applicationViewNode.Attributes.ObjectModelName];
                objectManagerConfig.newItemBtnTxt = res[1];
              }
              observer.next(objectManagerConfig);
              observer.complete();
            } else {
              this.traceService.debug(this.traceModule, 'TrendSnapinService.getObjectManagerConfig(): ', objectNodes);
              const subscription: Subscription = this.translateService
                .get('TREND_FOLDER.ERROR_MESSAGES.TRENDVIEW_PATH_NOT_IDENTIFIED').subscribe(localeTextToShow => {
                  this.siToastService.queueToastNotification('danger', localeTextToShow, '');
                  if (subscription) {
                    subscription.unsubscribe();
                  }
                });
              observer.next(objectManagerConfig);
              observer.complete();
            }
          }, error => { observer.error(error); observer.complete(); }));
        } else {
          observer.next(objectManagerConfig);
          observer.complete();
        }
      }, error => { observer.error(error); observer.complete(); }));
    });
  }

  public setSelectedObject(selectedObject: BrowserObject): void {
    this.selectedObject = Object.assign({}, selectedObject);
    this.systemId = this.selectedObject.SystemId;
  }

  public updateCnsValue(cnsValue: CnsLabel): void {
    switch (cnsValue.cnsLabel) {
      case 0:
      case 2:
      case 4:
        this.searchType = SearchTypes.DESCRIPTION;
        break;
      case 1:
      case 3:
      case 5:
        this.searchType = SearchTypes.NAME;
        break;
      default: break;
    }
  }

  public generateThumbnail(tile: TrendSearchedItem): Observable<void> {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.generateThumbnail(): ', tile);
    const generateThumbnailSub: Subject<void> = new Subject<void>();

    // TODO: need to keep commented code as this might be useful in future for dynamic image genegration
    // this.getTrendSeriesIDsForTrendObject(tile.objectID).subscribe((trendContainerInfo: TrendContainerInfo) => {
    //     trendSeriesIDs = trendContainerInfo.trendSeriesIDs;
    //     tile.lines = trendContainerInfo.lines;
    //     tile.axisAttachment = trendContainerInfo.axisAttachment;
    // },
    //     (error) => {
    //         this.traceService.error(this.traceModule, "TrendSnapinService.generateThumbnail().getTrendSeriesIDsForTrendObject() error: ",
    //             error);
    //     },
    //     () => {
    //         let chartDataSource: CompleteChartDataSource;
    //         this.getChartDataSource(trendSeriesIDs).subscribe((resultantChartDataSource: CompleteChartDataSource) => {
    //             chartDataSource = resultantChartDataSource;
    //         },
    //             (error) => { this.traceService.error(this.traceModule, "TrendSnapinService.generateThumbnail().getChartDataSource() error: ", error); },
    //             () => {
    // setTimeout(() => {
    const printData: PrintThumbnailData = new PrintThumbnailData();
    printData.trendSearchedItem = tile;
    this.traceService.debug(this.traceModule, 'TrendSnapinService.generateThumbnail().printThumbnail: ', printData);
    this.printThumbnail.emit(printData);
    generateThumbnailSub.next();
    generateThumbnailSub.complete();
    // }, 0);
    //         });
    // });
    return generateThumbnailSub.asObservable();
  }

  public getChartDataSource(trendSeriesIDs: string[]): Observable<CompleteChartDataSource> {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.getChartDataSource() for trendseries: ', trendSeriesIDs);
    const getChartDataSourceObservable: any = new Observable((observer: any) => {
      const completeChartDataSource: CompleteChartDataSource = new CompleteChartDataSource(trendSeriesIDs.length);

      const to: Date = new Date(Date.now());
      const from: Date = new Date((to.getTime() - this.THUMBNAIL_DATA_RANGE));

      const trendDataReadRequestCollection: Observable<TrendDataResult>[] = [];

      trendSeriesIDs.forEach((trendSeriesId: string) => {
        trendDataReadRequestCollection.push(this.trendService.getTrendData(trendSeriesId, from.toISOString(),
          to.toISOString(), this.INTERVAL)
        // this pipe is added to handle the error for some trend. this handles if therer is any
        // error for any one trend, but continues executions for other
          .pipe(catchError(error => (of(error)))));
      });

      const trendChartSub: Subscription = forkJoin(trendDataReadRequestCollection).subscribe(
        (trendDataReadResponseCollection: TrendDataResult[]) => {
          trendDataReadResponseCollection.forEach((trendDataReadResponse: TrendDataResult) => {
            const series: any[][] = [];

            if (!isNullOrUndefined(trendDataReadResponse) &&
                            !isNullOrUndefined(trendDataReadResponse.Series) &&
                            trendDataReadResponse.Series.length > 0) {

              trendDataReadResponse.Series.forEach(pointData => {
                const point: any[] = [];
                point.push(pointData.Timestamp);
                point.push(Number.parseInt(pointData.Value, 10));
                series.push(point);
              });

            }
            completeChartDataSource.push(series);
          });
          this.traceService.debug(this.traceModule, 'TrendSnapinService.getChartDataSource() completeChartDataSource: ', completeChartDataSource);
          observer.next(completeChartDataSource);
          observer.complete();
        },
        error => {
          observer.error(error);
          // TODO print error
        }
      );
      this.subscriptions.push(trendChartSub);
    });

    return getChartDataSourceObservable;
  }

  public onTileClick(tile: any): void {
    this.trendTileSelectionSub.next(tile);
  }

  public GetTargetNavigationBrowserObj(tile: TileObject): Observable<Page> {
    const page: Observable<Page> = this.systemBrowserService.searchNodes(tile.SystemId, tile.Designation, tile.ViewId);
    return page;
  }

  public registerForValueSubscription(sniId: string): void {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.registerForValueSubscription() for sniId: ', sniId);
    this.sniId = sniId;

    // Register snapIn with value subscription service if not already
    if (!this.valueSubscriptionRegId) {
      this.valueSubscriptionRegId = this.valueSubscriptionService.registerClient(this.sniId);
    }
  }

  public unRegisterForValueSubscription(): void {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.unRegisterForValueSubscription() called');
    // Unregister with value subscription service

    // added this.valueSubscriptionArray.length > 0 to handle defect 945136(Improper subscription)
    // added this second condition as we were getting double call for ngOnDestry and hence this error was there
    if (this.valueSubscriptionRegId && this.valueSubscriptionArray.length > 0) {
      this.valueSubscriptionArray = [];
      this.valueSubscriptionService.disposeClient(this.valueSubscriptionRegId);
      this.valueSubscriptionRegId = undefined;
    }
  }

  // Returns the Observables for the given property lists
  public getPropertyValuesObservables(propListObjectAndPropertyId: string[]): GmsSubscription<ValueDetails>[] {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.getPropertyValuesObservables(): ', propListObjectAndPropertyId);

    const valSubscriptions: GmsSubscription<ValueDetails>[] =
      this.valueSubscriptionService.subscribeValues(propListObjectAndPropertyId, this.valueSubscriptionRegId);
    this.valueSubscriptionArray = this.valueSubscriptionArray.concat(valSubscriptions);
    // Returning the valSubscriptions observable so that client can subscribe to its changed event
    return valSubscriptions;
  }

  public unsubscribeCOVs(seriesIdentifier: string): void {
    this.covSubscription.get(seriesIdentifier)?.unsubscribe();
    this.tsdSubscriptionMapping.forEach((value, key) => {
      if (value.seriesIdentifier === seriesIdentifier) { this.tsdSubscriptionMapping.delete(key); }
    });
  }

  public unsubscribeAllCOVs(): void {
    this.covSubscription.forEach((subscription: Subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
    this.covSubscription = new Map<string, Subscription>();
    this.tsdSubscriptionMapping = new Map<string, TrendSeries>();
  }
  // Unsubscribes All previously subscribed property values
  public unSubscribeAllPropertyValues(): void {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.unSubscribeAllPropertyValues() called');
    if (!this.valueSubscriptionRegId) {
      return;
    }

    if (this.valueSubscriptionArray != null && this.valueSubscriptionArray.length > 0) {
      this.valueSubscriptionService.unsubscribeValues(this.valueSubscriptionArray, this.valueSubscriptionRegId);
      setTimeout(() => {
        this.valueSubscriptionArray = [];
      }, 10);
    }
  }

  public populateEnumTexts(systemId: number, textGroup: string): Observable<any> {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.populateEnumTexts() called for- systemId:%s, textGroup:%s', systemId, textGroup);
    const observable: Observable<any> = new Observable(observer => {
      if (textGroup !== undefined && this.textGroups[textGroup] === undefined) { // get textgroup from WSI if not already fetched - this.systemId,
        const getTextGroupsSub1: Subscription = this.tablesService.getTextAndColorForTextGroupEntries(systemId.toString(), textGroup).subscribe(res => {
          this.traceService.debug(this.traceModule, 'get textgroup response: ' + res);

          const result: EnumerationText[] = res.map(state => ({
            Descriptor: state.Text,
            Value: state.Value
          }));

          this.textGroups[textGroup] = result;
          observer.next(this.textGroups[textGroup]);
          observer.complete();
        });
        this.subscriptions.push(getTextGroupsSub1);
      } else {
        observer.next(this.textGroups[textGroup]);
        observer.complete();
      }
    });
    return observable;
  }

  // returns two values 1.IsMultiState & 2 converted.
  public getEnumString(trendSeriesId: string, enumNumber: any): any {
    const enumDict: EnumerationText[] = this.getTrendSeriesEnumDict(trendSeriesId);
    if (isNullOrUndefined(enumDict) || enumDict.length === 0) {
      // return as the datatype is not enum for this serie.
      return {
        convertedValue: enumNumber,
        IsError: false,
        IsMultiState: false
      };
    } else {
      const returnVal: EnumerationText[] = enumDict.filter(items => {
        if (items.Value === enumNumber) {
          return items;
        }
      });
      if ((!isNullOrUndefined(returnVal)) && (returnVal.length > 0)
                && (!isNullOrUndefined(returnVal[0]) && !isNullOrUndefined(returnVal[0].Descriptor))) {
        return {
          convertedValue: returnVal[0].Descriptor,
          IsError: false,
          IsMultiState: true
        };
      }
    }
    return {
      convertedValue: enumNumber,
      IsError: true,
      IsMultiState: true
    };
  }

  // this are the temporary functions added here. we will be moving this functions to common after this release.
  public setTrendSeriesEnumDict(trendSeriesId: string, enumString: EnumerationText[]): void {
    if (isNullOrUndefined(this.trendSeriesEnumDict)) {
      this.trendSeriesEnumDict = new Map<string, EnumerationText[]>();
    }
    this.trendSeriesEnumDict.set(trendSeriesId, enumString);
  }

  // this are the temporary functions added here. we will be moving this functions to common after this release.
  public getTrendSeriesEnumDict(trendSeriesId: string): EnumerationText[] {
    if (!isNullOrUndefined(this.trendSeriesEnumDict) && this.trendSeriesEnumDict.has(trendSeriesId)) {
      return this.trendSeriesEnumDict.get(trendSeriesId);
    }
    return [];
  }

  public selectDataPointsWithSave(source: LocationCallSource, chartDefinition: ChartDefinition, saveCallback: ObjectManagerSaveAction): Observable<boolean> {
    this.traceService.debug(this.traceModule, 'TrendSnapinComponent.selectDataPointsWithSave(): Open object manager');
    return new Observable(observer => {
      const configSub: Observable<ObjectManagerServiceModalOptions> =
                this.getObjectManagerConfig(this.systemId, source === LocationCallSource.SELECT_DATA_POINT_TITLE);
      const translateSub: Observable<string> = this.translateService.get(this.translationKey + source.toString());
      const forkSubs: Subscription = forkJoin([configSub, translateSub]).subscribe(configAndTranslateSerRes => {
        // In case if there is no nodes to select
        if (configAndTranslateSerRes[0].roots !== undefined) {
          this.traceService.debug(this.traceModule, 'TrendSnapinComponent.selectDataPointsWithSave(): Open object manager config: ',
            configAndTranslateSerRes[0]);
          configAndTranslateSerRes[0].defaultSaveObjectDesc = chartDefinition.chartConfiguration.title;
          if (!chartDefinition.chartConfiguration.isNewTrend) {
            configAndTranslateSerRes[0].defaultSaveObjectName = Designation.createNodeName(this.selectedObject.Name);
          } else {
            // if a user adds the description from the general tab the saveas popup will show the data of the description or on new creation of the tvd
            configAndTranslateSerRes[0].defaultSaveObjectName = Designation.createNodeName(chartDefinition.chartConfiguration.title);
          }
          configAndTranslateSerRes[0].selectedNode = chartDefinition.chartConfiguration.location.id;
          // call to objectManagerService for save pop-up
          const saveSubs: Subscription = this.objectManagerService.save(configAndTranslateSerRes[1], saveCallback,
            configAndTranslateSerRes[0]).subscribe(selectedPoints => {
            if (selectedPoints === undefined || selectedPoints.action === ModalDialogResult.Cancelled) {
              observer.next(false);
              observer.complete();
              this.unsavedDataDialog.closeDialog();
            } else if (selectedPoints.action === ModalDialogResult.Ok) {
              observer.next(true);
              observer.complete();
            }
            saveSubs.unsubscribe();
          },
          error => {
            this.traceService.info(this.traceModule, 'TrendSnapinComponent.selectDataPointsWithSave() failed to open OM pop up', error);
            observer.error(error);
            observer.complete();
            saveSubs.unsubscribe();
          }
          );
          forkSubs.unsubscribe();
        } else {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  public selectDataPoints(source: LocationCallSource): Observable<BrowserObject[]> {
    this.traceService.debug(this.traceModule, 'TrendSnapinComponent.selectDataPoints(): Open object manager');
    return new Observable(observer => {
      const configSub: Observable<ObjectManagerServiceModalOptions> =
                this.getObjectManagerConfig(this.systemId, source === LocationCallSource.SELECT_DATA_POINT_TITLE);
      const translateSub: Observable<string> = this.translateService.get(this.translationKey + source.toString());
      this.subscriptions.push(forkJoin([configSub, translateSub]).subscribe(res => {
        this.traceService.debug(this.traceModule, 'TrendSnapinComponent.selectDataPoints(): Open object manager config: ', res[0]);
        this.subscriptions.push(this.objectManagerService.show(res[1], res[0]).subscribe(selectedPoints => {
          if (selectedPoints === undefined || selectedPoints.action === ModalDialogResult.Cancelled) {
            observer.next(undefined);
            observer.complete();
          } else if (selectedPoints.action === ModalDialogResult.Ok) {
            observer.next(selectedPoints.selection);
            observer.complete();
          }
        },
        error => {
          this.traceService.info(this.traceModule, 'TrendSnapinComponent.selectDataPoints() failed to open OM pop up', error);
          observer.error(error);
          observer.complete();
        }));
      }));
    });
  }

  public putTrendViewDefinition(tvdUpdate: TrendViewDefinitionUpdate): Observable<TrendViewDefinition> {
    return this.trendService.putTrendViewDefinition(tvdUpdate);
  }
  public getGenSettings(generalSettingKey: string): Observable<string> {
    return this.settingsService.getSettings(generalSettingKey);
  }

  public putGenSettings(generalSettingKey: string, generalSettingsData: JSON): Observable<boolean> {
    return this.settingsService.putSettings(generalSettingKey, generalSettingsData);
  }

  public GetConfigureRights(): boolean {
    this.appRightsTrend = this.appRightsService.getAppRights(this.trendSnapinId);
    return this.appRightsTrend.Operations.find(appRight => appRight.Id === this.trendConfigureOptId) ? true : false;
  }
  public disableContentAction(disableDelete: boolean): void {
    const trendReadOnly = !this.GetConfigureRights();
    const config: TrendViewerConfig = this.trendViewerConfigService.get();
    config.actionsToDisable.edit = trendReadOnly;
    this.trendViewerConfigService.update(config);
  }

  public disableManualUploadContentAction(disableManUpload: boolean): void {
    const config: TrendViewerConfig = this.trendViewerConfigService.get();
    const subTranslationService: Subscription = this.translateService.get('TREND_FOLDER.CUSTOM_CONTENT_ACTION.MANUAL_UPLOAD').subscribe(localeTextToShow => {
      {
        const manualUpload = config.viewContentActions.secondaryActions.find(action => action.title === localeTextToShow);
        manualUpload.disabled = disableManUpload;
        this.trendViewerConfigService.update(config);
      }
    });
    this.subscriptions.push(subTranslationService);
  }

  public disableDeleteContentAction(disableDelete: boolean): void {
    const trendReadOnly = !this.GetConfigureRights();
    const config: TrendViewerConfig = this.trendViewerConfigService.get();
    const subTranslationService: Subscription = this.translateService.get('TREND_VIEWER.TEXT_SHORT.DELETE_TREND').subscribe(localeTextToShow => {
      {
        const deleteTrend = config.viewContentActions.secondaryActions.find(action => action.title === localeTextToShow);
        deleteTrend.disabled = disableDelete ? true : trendReadOnly;
        this.trendViewerConfigService.update(config);
      }
    });
    this.subscriptions.push(subTranslationService);
  }

  public resetSeriesId(): void {
    const config: TrendViewerConfig = this.trendViewerConfigService.get();
    config.seriesToShowCurrentData = '-1';
    this.trendViewerConfigService.update(config);
  }

  public showTrendProperties(trendSeries: TrendSeries, isTrendedObject: boolean, sendActionName?: string): void {
    let collectorId: string;
    if (isTrendedObject) {
      collectorId = trendSeries.trendObjectInfo.ObjectId;
    } else {
      collectorId = trendSeries.trendObjectInfo.CollectorObjectOrPropertyId;
    }
    const sub: Subscription = this.searchNewNode(collectorId, trendSeries.systemId)
      .subscribe(nodes => {
        this.trendSelectionDetailData.sourceNodeDetail = nodes[0].Nodes.find(node => node.ViewType === Math.max(...nodes[0].Nodes.map(n => n.ViewType)));
        if (sendActionName && sendActionName === 'navigate-trend-point') {
          this.trendSelectionDetailData.action = sendActionName;
        } else {
          this.trendSelectionDetailData.action = null;
        }
        this.subSendShowProeprtiesMessage.next(this.trendSelectionDetailData);
        if (sub) {
          sub.unsubscribe();
        }
      });
  }

  public showProperties(trendSeries, rowDetails): void {
    this.trendSeriesInfoSub.next({ trendSeries, rowDetails });
  }

  public getSeriesInformationDetails(selectedSeriesDetails: TrendSeriesDetails, snapinSeriesDetails: TrendSeries | NonTrendSeries): void {
    this.trendSeriesInformationDetailsSub.next({ selectedSeriesDetails, snapinSeriesDetails });
  }
  public getContentActions(trendSeries: TrendSeries): ContentActions {
    const isTrendLogPresent: boolean = (trendSeries.ObjectIdOfTrendLog || trendSeries.ObjectIdOfTrendLogOnline) ? true : false;
    const secondaryActions = [
      {
        title: 'TREND_VIEWER.DATA_SOURCE_TAB.DATA_TABLE.TRENDED_OBJECT', disabled: false,
        action: (): void => this.showTrendProperties(trendSeries, true)
      },
      {
        title: 'TREND_VIEWER.DATA_SOURCE_TAB.DATA_TABLE.TRENDLOG_OBJECT', disabled: !isTrendLogPresent,
        action: (): void => this.showTrendProperties(trendSeries, false)
      },
      {
        title: 'TREND_VIEWER.DATA_SOURCE_TAB.DATA_TABLE.NAVIGATE_TO', disabled: false,
        action: (): void => {
          const actionName = 'navigate-trend-point';
          this.showTrendProperties(trendSeries, true, actionName);
        }
      }
    ] as any;
    if (trendSeries?.propertyList?.length > 1) {
      secondaryActions.splice(0, 0,
        {
          title: 'TREND_VIEWER.DATA_SOURCE_TAB.DATA_TABLE.SELECT_PROPERTY', action: rowDetails => this.showProperties(trendSeries, rowDetails)
        });
    }
    const contentActions: ContentActions = { secondaryActions };
    return contentActions;
  }

  public clearRetainedBrowserObject(): void {
    this.retainedBrowserObject = undefined;
    this.previousTVD = undefined;
  }

  public setQualityAreaAndIcons(showQualityArea: boolean, showQualityIcons: boolean): void {
    const config: TrendViewerConfig = this.trendViewerConfigService.get();
    config.showQualityIcons = showQualityIcons;
    config.showQualityArea = showQualityArea;
    this.trendViewerConfigService.update(config);
  }

  public setDefaultTimeRangeInSeries(series: TrendSeries, fromDate: Date, toDate: Date): void {
    fromDate.setTime(this.generateDefaultTimeRangeDifference(toDate));
    series.trendSeriesMinTimestamp = fromDate.toISOString();
    series.trendSeriesMaxTimestamp = toDate.toISOString();
  }

  public generateDefaultTimeRangeDifference(providedDate: Date): number {
    return (providedDate.getTime() - DEFAULT_TIME_RANGE_DIFFERENCE);
  }

  // Check for Property group status rights
  public getPropertyStatusRights(objectId: string, upload: boolean = false, commandInput?: CommandInput[]): void {
    this.subscriptions.push(this.propertyValuesService.readPropertiesAndValue(objectId, false).subscribe(
      prop => {
        this.getCollectPropertyIds(objectId, prop.Attributes.ManagedTypeName, upload, commandInput);
      }
    ));

  }

  // Collect Trend log offline data
  public collectTrendOfflineData(objectId: string, propertyName: string, commandName: string, commandInput: CommandInput[]): void {
    const sub: Subscription = this.execCommandService.executeCommand(objectId + '.' + propertyName,
      commandName, commandInput).subscribe(
      error => {
        if (error != null) {
          this.errorWhileManualCollect = true;
        }
      }
    );
    this.subscriptions.push(sub);
  }

  public saveAsTvdSubscription(tvd: TrendViewDefinition, title: string): void {
    this.saveAsTVDData.next({ tvd, title });
  }

  public nonTrendedObjectTrendValueSubscription(): void {
    this.savedTVDObjectIdSub.next(undefined);
    this.nonTrendedSeriesCollcetion.clear();
  }

  private getAggregateViews(systemId: any): Observable<AggregateViewId[]> {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.getViews() called for systemId:%s ', systemId);
    return this.systemBrowserService.getViews(systemId).pipe(
      map((viewNodes: ViewNode[]) => {
        const viewIds: AggregateViewId[] = [];
        viewNodes.forEach(v => {
          const newId: AggregateViewId = AggregateViewId.createFromViewNode(v);
          if (!viewIds.some(id => AggregateViewId.isEqual(id, newId))) {
            viewIds.push(newId);
          }
        });
        return viewIds;
      }),
      catchError((err: any) => throwError(err))
    );
  }

  /**
   * create a ObjectManagerViewFilter from AggregateViewIds with optional system name
   * @param ids AggregateIds
   * @param sysName string
   */
  private toViewSpecification(ids: AggregateViewId[], sysName?: string): ViewFilter {
    if (ids === undefined || ids.length < 1) {
      return undefined;
    }
    return {
      viewIds: ids,
      systemName: sysName
    } as ViewFilter;
  }

  private async getCollectPropertyIds(objectId: string, managedType: string, upload: boolean = false, commandInput?: CommandInput[]): Promise<void> {
    let collectProperties: any[];
    for (const key of this.trendDefaultConfig.collectPropertyNameSubsystem) {
      collectProperties = key[managedType];
      if (collectProperties && collectProperties.length === 0) {
        continue;
      } else if (collectProperties && collectProperties.length > 0) {
        for (const prop of collectProperties) {
          let gotSuccessfulResult = false;
          const response = this.readCommandService.readPropertyCommand(objectId + '.' + prop.property);
          let promise;
          try {
            promise = await firstValueFrom(response);
          } catch (error) {
            // added the try catch block to handle the error while reading property.
            // PCR (Product Change Request) 2155114: Button on DCC Flex Client for updating off-line trend data not active
          }
          if (promise) {
            /* if the result of reading the property command is successful, yet no commands are present,
              then the command property does not have write access. Hence, disable the manual upload */
            if (promise?.[0]?.Commands?.length === 0) {
              this.propertyRights = false;
              this.disableManualUploadContentAction(true);
            } else if (promise[0]?.Commands?.length > 0) {
              this.propertyRights = true;
              this.disableManualUploadContentAction(false);
              gotSuccessfulResult = true;
              if (upload) {
                this.collectTrendOfflineData(objectId, prop.property, prop.command, commandInput);
              }
            }
          }
          if (gotSuccessfulResult) { break; }
        }
      }
    }
  }

}
