import { Component, ElementRef, HostBinding, NgZone, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UnsavedDataDialogResult, UnsaveDialogService } from '@gms-flex/controls';
import { IHfwMessage, IObjectSelection, ISnapInActions, ISnapInConfig, IStorageService, ParamsSendMessage, QParam, SnapInBase,
  UnsavedDataReason } from '@gms-flex/core';
import { BrowserObject, GmsManagedType, GmsManagedTypes, GmsMessageData, GmsSelectionType } from '@gms-flex/services';
import { AppContextService, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, ViewType } from '@simpl/element-ng';
import { clone, SiTrendviewerConfigService } from '@simpl/trendviewer-ng';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { Observable, Observer, of, Subscription } from 'rxjs';

import { LocationCallSource, ManagedType } from '../common/interfaces/trend.models';
import { GeneralSettingsComponent } from '../general-settings/general-settings.component';
import { SearchViewComponent } from '../search/search.component';
import { TimerPhaseEnum, TimerService } from '../services/timer-service';
import { TrendDefinitionService } from '../services/trend-definition-service';
import { TrendSnapinService } from '../services/trend-snapin.service';
import { TrendConfigApiService } from '../services/trendviewer-config-api-service';
import { TrendActiveViews } from '../shared/trend-searched-item';
import { TrendChartComponent } from '../trend-chart/trend-chart.component';

@Component({
  selector: 'gms-trend-snapin',
  templateUrl: './trend-snapin.component.html',
  styleUrl: '../gms-trend-snapin.scss',
  standalone: false
})

export class TrendSnapInComponent extends SnapInBase implements OnInit, OnDestroy {

  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;
  @HostBinding('class.snapin-container-overflow-auto') public guardOverflow = true;
  @HostBinding('class.rounded-bottom') public roundedBorder = true;

  // @ViewChild(TrendPreviewPageComponent) trendPreviewPageComponent: TrendPreviewPageComponent;
  @ViewChild(GeneralSettingsComponent, { static: false })
  public inProgress = true;
  public generalSettingComponent: GeneralSettingsComponent;
  public locale = '';
  public displayMode: string;
  public browserObject: BrowserObject[];
  public selectedBrowserObjectName: string;
  public showGenSettings = true;
  public showEmptySnapin = false;
  public modalRef: BsModalRef;
  public searchPlaceHolder: string;
  private readonly traceModule = 'gmsSnapins_TrendSnapInComponent';
  private readonly subscriptions: Subscription[] = [];
  private messageSubscription: Subscription;
  private retainedBrowserObject: BrowserObject;
  private _isTrendFolderSelected = false;
  private snapinName: string;
  private readonly storage: IStorageService;
  private hldlFullConfig: any = undefined;
  private trendSnapinContentActions: {
    primaryActions?: MenuItem[];
    secondaryActions?: MenuItem[];
  };

  @ViewChild(TrendChartComponent, { static: false })
  private readonly trendChartComponent: TrendChartComponent;
  @ViewChild('template', { static: false }) private readonly popupELementRef: TemplateRef<void>;

  @ViewChild('searchComponent') private readonly searchComponent: SearchViewComponent;

  private previousBrowserObject: BrowserObject;
  // private unsavedData: boolean = false; // TODO: to be removed.

  public get IsTrendFolderSelected(): boolean {
    return this._isTrendFolderSelected;
  }
  public set IsTrendFolderSelected(value: boolean) {
    this._isTrendFolderSelected = value;
  }
  // #endregion

  public constructor(
    public sceneZone: NgZone,
    private readonly elementRef: ElementRef,
    private readonly traceService: TraceService,
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute,
    private readonly objectSelectionService: IObjectSelection,
    private readonly translateService: TranslateService,
    private readonly appContextService: AppContextService,
    private readonly trendSnapinService: TrendSnapinService,
    private readonly trendDefinitionService: TrendDefinitionService,
    private readonly snapInActions: ISnapInActions,
    private readonly modalService: BsModalService,
    private readonly trendSearchService: TrendSnapinService,
    private readonly unsavedDataDialog: UnsaveDialogService,
    private readonly snapinConfig: ISnapInConfig,
    private readonly trendDefService: TrendDefinitionService,
    private readonly timerService: TimerService,
    private readonly trendViewerConfigService: SiTrendviewerConfigService) {
    super(messageBroker, activatedRoute);
    this.storage = this.messageBroker.getStorageService(this.fullId);
    this.trendSnapinService.storage = this.storage;
    this.trendSnapinService.snapId = this.fullId;
    this.trendSnapinContentActions = {};
  }

  public ngOnInit(): void {
    this.getHldlConfigs();

    this.locale = this.translateService.getBrowserLang();
    const config = this.trendViewerConfigService.get();
    config.locale = this.locale;
    this.trendViewerConfigService.update(config);

    this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
      if (userCulture != null) {
        this.translateService.use(userCulture).subscribe((res: any) => {
          this.traceService.debug(this.traceModule, 'use user Culture');
          this.subscriptions.push(this.translateService.get('SEARCH-PLACEHOLDER').subscribe(value => {
            this.searchPlaceHolder = value;
          }));
        },
        error => {
          this.traceService.warn(this.traceModule, 'No user Culture for appContextService');
          this.setContentAction();
          this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
            if (defaultCulture != null) {
              this.translateService.setDefaultLang(defaultCulture);
            } else {
              this.traceService.warn(this.traceModule, 'No default Culture for appContextService');
              this.translateService.setDefaultLang(this.translateService.getBrowserLang());
            }
            this.subscriptions.push(this.translateService.get('SEARCH-PLACEHOLDER').subscribe(value => {
              this.searchPlaceHolder = value;
            }));
          }));
        });
      } else {
        this.traceService.warn(this.traceModule, 'No user Culture for appContextService');
      }

    }));

    this.messageSubscription = this.messageBroker.getMessage(this.fullId).subscribe(
      (m => {
        if (m != null) {
          this.timerService.reset();
          this.timerService.startPhase(TimerPhaseEnum.GetTrendTileContent);
          this.processRequest(m);
        }
      })
    );

    this.subscriptions.push(this.trendSnapinService.subSendShowProeprtiesMessage.subscribe(selectedTrendNode => {
      if (selectedTrendNode.action) {
        this.prepareMessageBodyAndSendMessage([selectedTrendNode.sourceNodeDetail], true, selectedTrendNode.action);
      } else {
        this.prepareMessageBodyAndSendMessage([selectedTrendNode.sourceNodeDetail], true);
      }
    }));

    // Subscribing to the tile selection in overview page
    this.subscriptions.push(this.trendSnapinService.trendTileSelectionSub.subscribe(tile => {
      const navigationSubscription: Subscription = this.trendSnapinService.GetTargetNavigationBrowserObj(tile).subscribe(navigationPage => {
        this.prepareMessageBodyAndSendMessage(navigationPage.Nodes, false);
        // Unsubscribe after call to navigation is given
        navigationSubscription.unsubscribe();
      });
    }));

    // This is to update snapin title with the saved tvd title after saving new trend
    this.subscriptions.push(this.trendDefService.updateSubchartConfigurationSub.subscribe(chartConfig => {
      if (chartConfig) {
        const browserObject = new Array<BrowserObject>();
        browserObject.push(clone(this.trendSnapinService.selectedObject));
        browserObject[0].Descriptor = chartConfig.chartConfiguration.title;
        browserObject[0].Attributes.TypeId = 7400;
        this.objectSelectionService.setSelectedObject(this.fullId, new GmsMessageData(browserObject, GmsSelectionType.Object));
      }
    }));

    this.trendSnapinService.registerForValueSubscription(this.fullId.fullId());
  }

  public ngOnDestroy(): void {
    this.trendSnapinService.clearRetainedBrowserObject();
    this.traceService.debug(this.traceModule, 'TrendSnapInComponent.ngOnDestroy():Component destroyed.');
    this.subscriptions.forEach((subscription: Subscription) => {
      if (!isNullOrUndefined(subscription)) {
        subscription.unsubscribe();
      }
    });
    // cancel all  previous ongoing WSI API calls
    this.unsubscribeAPICalls();
    if (this.messageSubscription !== undefined) {
      this.messageSubscription.unsubscribe();
    }

    // First Unsubscribe all the property value subscriptions and then unregister the snapin for change events
    this.trendSnapinService.unSubscribeAllPropertyValues();
    this.trendSnapinService.unRegisterForValueSubscription();
  }

  public onUnsavedDataCheck(reason: UnsavedDataReason): Observable<boolean> {
    if (this.trendChartComponent) {
      // below condition is added to handle the scenario where if a trended series is removed from the online trend object
      // and when we move to a tvd where that series is present, so when we navigate away from that tvd it should show save
      // confirmation dialog
      // condition should be with new trend workflow
      if (this.trendSnapinService.nonTrendedSeriesCollcetion.size > 0) {
        return new Observable((observer: Observer<boolean>) => {
          this.onUnsavedDataSubscription(observer);
        });
      }
      // check if there are unsaved changes in trendviewer
      if (!this.storage.getDirtyState(this.fullId)) {
        // whenever user is trying to create new trend from related item, save confirmation dialog should come
        if (this.trendSnapinService.showSaveConfirmationForNewTrend) {
          return new Observable((observer: Observer<boolean>) => {
            this.onUnsavedDataSubscription(observer);
          });
        } else {
          return of(true);
        }
      } else {
        return new Observable((observer: Observer<boolean>) => {
          this.onUnsavedDataSubscription(observer);
        });
      }
    } else {
      return of(true);
    }
  }

  public onBeforeAttach(): void {
    super.onBeforeAttach();
    if (this.searchComponent) {
      this.searchComponent.onBeforeAttach();
    }
    if (this.trendChartComponent !== undefined) {
      this.trendChartComponent.restoreScrollPositions();
      this.restoreSnapinScrollPostion();
    }
  }

  public onAfterDettach(): void {
    if (this.trendChartComponent !== undefined) {
      this.trendChartComponent?.saveTrendState();
      this.retainSnapinScrollPosition();
    }
  }

  public showGeneralSettings(template: TemplateRef<any>): void {
    this.showGenSettings = !this.showGenSettings;
    this.modalRef = this.modalService.show(template);
  }

  public saveGeneralSettings(): void {
    this.trendSnapinService.generalSettingsSub.next();
    this.modalRef.hide();
  }

  public openNewTrend(): void {
    this._isTrendFolderSelected = false;
    const browserObject = clone(this.browserObject);
    this.subscriptions.push(this.translateService.get('TREND_VIEWER.TEXT_SHORT.NEW_TREND').subscribe(localeTextToShow => {
      browserObject[0].Descriptor = localeTextToShow;
    }));
    browserObject[0].Attributes.TypeId = 7400;
    this.trendSnapinContentActions.primaryActions = [];
    this.trendSnapinContentActions.secondaryActions = [];
    this.objectSelectionService.setSelectedObject(this.fullId, new GmsMessageData(browserObject, GmsSelectionType.Object));
    this.browserObject = undefined;
    this.setContentAction();
  }

  public getContentAction(): {
    primaryActions?: MenuItem[];
    secondaryActions?: MenuItem[];
    viewType?: ViewType;
  } {
    const possibleOperations: GmsManagedType[] = this.getManagedTypes();
    if (possibleOperations.find(obj => obj.name.startsWith(ManagedType.TrendLog)
            || obj.id === GmsManagedTypes.TRENDVIEWDEFINITION.id) && !this.trendSnapinService.isNewTrendWorkFlow) {
      this.inProgress = false;
      return {
        viewType: 'expanded',
        primaryActions: [
          {
            title: 'TREND_FOLDER.ADD_TREND',
            icon: 'element-plus',
            action: (): void => {
              this.openNewTrend();
            },
            disabled: !this.trendSearchService.GetConfigureRights()
          }
        ],
        secondaryActions: [
          {
            title: 'TREND_FOLDER.GENERAL_SETTINGS',
            action: (): void => {
              this.generalSettingClicked();
            }
          }
        ]
      };
    }
    return {};
  }

  public setContentAction(): void {
    this.updateResourceMethod(this.trendSnapinContentActions.primaryActions);
    this.updateResourceMethod(this.trendSnapinContentActions.secondaryActions);
    this.snapInActions.setSnapInActions(this.fullId, this.trendSnapinContentActions);
  }

  public generalSettingClicked(): void {
    this.showGenSettings = !this.showGenSettings;
    this.modalRef = this.modalService.show(this.popupELementRef);
  }

  public showHideTrendChart(isEmptySnapin: boolean): void {
    this.showEmptySnapin = isEmptySnapin;
  }

  // eslint-disable-next-line no-warning-comments
  // TODO: To remove unused method
  public loadEmptyChart(): void {
    this._isTrendFolderSelected = false;
    this.browserObject = undefined;
  }

  public getManagedTypes(): GmsManagedType[] {
    const SupportedManagedTypes: GmsManagedType[] = [];
    const managedType: number = this.trendSnapinService.selectedObject?.Attributes?.ManagedType;
    if (managedType && managedType === GmsManagedTypes.TREND_FOLDER.id) {
      SupportedManagedTypes.push(GmsManagedTypes.TREND_LOG);
      SupportedManagedTypes.push(GmsManagedTypes.TREND_LOG_ONLINE);
      SupportedManagedTypes.push(GmsManagedTypes.TRENDVIEWDEFINITION);
    }
    return SupportedManagedTypes;
  }

  // navigate to newly created trend view definition
  private prepareMessageBodyAndSendMessage(browserNodes: BrowserObject[], isProperty: boolean, navigateSelectedTrend?: string): void {
    const navigationBrowserObject: BrowserObject[] = browserNodes;
    let messageBody: GmsMessageData = new GmsMessageData(navigationBrowserObject, GmsSelectionType.Cns);
    let qParamValue: QParam; // navigationBrowserObject[0].Designation; new-primary-selection should not set qParam in URL
    let ruleName = 'new-primary-selection';
    if (isProperty && navigateSelectedTrend && navigateSelectedTrend === 'navigate-trend-point') {
      messageBody = new GmsMessageData(navigationBrowserObject, GmsSelectionType.Object);
      qParamValue = undefined;
    } else if (isProperty) {
      messageBody = new GmsMessageData(navigationBrowserObject, GmsSelectionType.Object);
      qParamValue = undefined;
      ruleName = undefined;
    }
    const types: string[] = navigationBrowserObject.map((browserObject: BrowserObject) => browserObject.Attributes.ManagedTypeName);
    this.traceService.debug(this.traceModule, 'TrendSnapinComponent.navigateToSystemBrowserNode():created browser object: ', navigationBrowserObject);
    const isPreselection = true;
    const isBroadcast = false;
    const messageToSend: ParamsSendMessage = {
      messageBody,
      preselection: isPreselection,
      qParam: qParamValue,
      broadcast: isBroadcast,
      applyRuleId: ruleName
    };

    this.subscriptions.push(this.sendMessage(types, messageToSend).subscribe((res: boolean) => {
      this.traceService.debug(this.traceModule, 'sendMessage() completed. result: %s', res);
    }));
  }

  // This function processes the incoming message from HFW
  private processRequest(message: GmsMessageData): void {

    // In case of invalid message condition , just return
    if (message == null || message.data == null || message.data.length <= 0) {
      return;
    }
    this.inProgress = true;
    this.subscriptions.push(this.trendDefinitionService.startStopTrendSnapinProgress.subscribe(preogress => {
      this.inProgress = preogress;
    }));
    let receivedBrowserObjects: BrowserObject[] = [];

    if (message.data[0].Attributes.ManagedType === GmsManagedTypes.NEW_TREND.id) {
      // Multiselect behaviour for trendviewer only for create new trend.
      if (message.customData && message.customData.length > 0) {
        receivedBrowserObjects = Object.assign([], message.customData);
      }
      this.trendSnapinService.isNewTrendWorkFlow = true;
    } else {
      // Remove splice to have multiselect behaviour for normal workflow as well.
      receivedBrowserObjects = Object.assign([], message.data.slice(0, 1));
      this.trendSnapinService.isNewTrendWorkFlow = false;
    }

    // cancel all  previous ongoing WSI API calls
    this.unsubscribeAPICalls();

    // Get the selected browser object
    if (receivedBrowserObjects != null && receivedBrowserObjects.length > 0
            && receivedBrowserObjects[0].ObjectId != null && receivedBrowserObjects[0].Attributes != null) {
      if (this.browserObject) {
        if (this.browserObject[0] !== receivedBrowserObjects[0]) {
          this.trendSnapinService.previousTVD = this.browserObject[0].Name;
          this.storage.clearState(this.fullId);
        }
      }

      // if any retain state available
      this.getTrendState();
      // if user is creating new trend from related item, show save confirmation dialog
      // for first time retain browser object will be undefined
      if (this.retainedBrowserObject === undefined && this.trendSnapinService.isNewTrendWorkFlow) {
        this.trendSnapinService.showSaveConfirmationForNewTrend = true;
        this.trendSnapinService.tvdSavedFromNewTrend = false;
      }
      // if tvd is deleted then show delete message with empty snapin text
      if (!(this.showEmptySnapin && this.retainedBrowserObject)) {
        this.browserObject = receivedBrowserObjects;
        if (this.retainedBrowserObject) {
          this.trendSnapinService.retainedBrowserObject = this.retainedBrowserObject;
          // if user do new trend from related item and it is not saved, then again show save confirmation dialog
          // Scenario : if user clicks on discard changes on save confirmation dialog and move to textual viewer or event
          // and if he again come back to trend, in this case snapin will display retained changes and again
          // if try to switch any other node, show save confirmation dialog
          if (this.trendSnapinService.isNewTrendWorkFlow && !this.trendSnapinService.tvdSavedFromNewTrend) {
            this.trendSnapinService.showSaveConfirmationForNewTrend = true;
          }

          // If multiple points are selected in system browser and tvd is created from related item for those points
          // if it is saved and user moves to textual viewer or event node and come back on trend,
          // then on trend snapin only show saved tvd
          if (this.trendSnapinService.isNewTrendWorkFlow && this.trendSnapinService.tvdSavedFromNewTrend) {
            this.browserObject = [];
          }
          this.browserObject[0] = this.retainedBrowserObject;
        }
        this.trendSnapinService.setSelectedObject(this.browserObject[0]);
        this.previousBrowserObject = this.browserObject[0];
      }
    }

    if (this.browserObject == null) {
      return;
    }

    // Load snapin based on selection in system browser
    this.loadSnapin();
  }

  private unsubscribeAPICalls(): void {
    this.trendSnapinService.unsubscribeAPICalls();
    if (!isNullOrUndefined(this.trendChartComponent)) {
      this.trendChartComponent.unsubscribeAPICalls();
    }
  }

  private loadSnapin(): void {
    const managedType: number = this.browserObject[0].Attributes.ManagedType;
    this._isTrendFolderSelected = false;
    this.showEmptySnapin = false;
    if (managedType === GmsManagedTypes.TREND_FOLDER.id && !this.trendSnapinService.isNewTrendWorkFlow) {
      this._isTrendFolderSelected = true;
    }
    this.showBrowserObject();
  }

  private showBrowserObject(): void {
    this.trendSnapinContentActions = this.getContentAction();
    this.setContentAction();
  }

  private updateResourceMethod(actions?: MenuItem[]): void {
    if (actions) {
      actions.forEach(element => {
        this.subscriptions.push(this.translateService.get(element.title).subscribe(localeTextToShow => {
          element.title = localeTextToShow;
          element.tooltip = localeTextToShow;
        }));
        if (element.items) {
          this.updateResourceMethod(element.items);
        }
      });
    }
  }

  private getTrendState(): void {
    this.retainedBrowserObject = undefined;
    this.trendSnapinService.retainedBrowserObject = undefined;
    this.trendDefinitionService.clearStorageProperties();
    const res: any = this.storage.getState(this.fullId);
    if (res) {
      this.trendDefinitionService.retainedState = res.state;
      this.retainedBrowserObject = res.savedBrowserObject;
      this.showHideTrendChart(res.isDeleted);
    }
  }

  private setViewState(): void {
    if (this.trendDefinitionService.storingState) {
      this.trendDefinitionService.storingState.activeView = TrendActiveViews.View;
    }
  }

  private onUnsavedDataSubscription(observer: Observer<boolean>): void {
    const translateSub: Observable<string> =
      this.translateService.get(this.trendSnapinService.translationKey + LocationCallSource.UNSAVE_SNAPIN_NAME_TITLE.toString());
    translateSub.subscribe(configAndTranslateSerRes => {
      this.snapinName = configAndTranslateSerRes;
    });
    this.unsavedDataDialog.showDialog(this.snapinName).subscribe((res: UnsavedDataDialogResult) => {
      switch (res) {
        case UnsavedDataDialogResult.Yes:
          this.trendDefinitionService.isDiscardClicked = false;
          this.trendChartComponent.saveTrendViewerChanges().subscribe(isSuccess => {
            if (isSuccess) {
              // If tvd is created from related item and if it is saved clear all flags
              if (this.trendSnapinService.isNewTrendWorkFlow) {
                this.trendSnapinService.showSaveConfirmationForNewTrend = false;
                this.trendSnapinService.tvdSavedFromNewTrend = true;
              }
              this.unsavedDataDialog.closeDialog();
              this.storage.setDirtyState(this.fullId, false);
              observer.next(true);
              observer.complete();
            } else {
              // If validation fails, close dialogue and open edit mode with validation message
              this.unsavedDataDialog.closeDialog();
              if (!this.trendChartComponent.isEditModeOpen()) {
                this.trendChartComponent.subOpenChartInEditMode.next(true);
              }
              observer.next(false);
              observer.complete();
            }
          });
          break;
        case UnsavedDataDialogResult.No:
          this.trendDefinitionService.isDiscardClicked = true;
          this.setViewState();
          this.storage.setDirtyState(this.fullId, false);
          observer.next(true);
          observer.complete();
          break;
        case UnsavedDataDialogResult.Cancel:
          observer.next(false);
          observer.complete();
          break;
        default:
          observer.next(false);
          observer.complete();
          break;
      }
    });
  }

  private getHldlConfigs(): void {
    if (this.hldlFullConfig === undefined) {
      this.hldlFullConfig = this.snapinConfig.getSnapInHldlConfig(this.fullId, this.location);
      this.trendSnapinService.trendDefaultConfig = this.hldlFullConfig;
    }
  }

  private retainSnapinScrollPosition(): void {
    const scrollTop = this.elementRef.nativeElement.scrollTop;
    if (scrollTop) {
      const currentState = this.storage.getState(this.trendSnapinService.snapId);
      if (currentState) {
        currentState.snapinScrollTop = scrollTop;
        this.storage.setState(this.trendSnapinService.snapId, currentState);
      }
    }
  }

  private restoreSnapinScrollPostion(): void {
    const snapinScrollTop = this.storage.getState(this.trendSnapinService.snapId).snapinScrollTop;
    if (snapinScrollTop) {
      setTimeout(() => {
        this.elementRef.nativeElement.scrollTop = snapinScrollTop;
      });
    }
  }
}
