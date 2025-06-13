import { AfterContentChecked, AfterContentInit, Component, ElementRef, EventEmitter, Input,
  NgZone, OnChanges, OnDestroy, OnInit, Output, Renderer2, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { DeviceType, MobileNavigationService } from '@gms-flex/core';
import {
  BrowserObject,
  CnsHelperService,
  CnsLabelEn,
  CommandInput,
  GeneralSetings,
  GmsManagedTypes,
  TrendViewDefinition,
  ValidationEditInfo,
  ValidationInput,
  ValidationResult,
  ValidationResultStatus
} from '@gms-flex/services';
import { TraceModules, TraceService, triggerWindowResize } from '@gms-flex/services-common';
import { ValidationDialogService } from '@gms-flex/snapin-common';
import { TranslateService } from '@ngx-translate/core';
import { themeElement, themeSupport } from '@simpl/charts-ng';
import { DeleteConfirmationDialogResult, ModalRef, ResizeObserverService, SiActionDialogService, SiModalService,
  SiThemeService, SiToastNotificationService } from '@simpl/element-ng';
import { ChartDefinition, RelativeTimeRange, SeriesUpdatableProperties, SiTrendviewerConfigService,
  SiTrendviewerService, TrendSeries as TrendSeriesSimpl, TrendViewerConfig, TrendViewerViewState } from '@simpl/trendviewer-ng';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import { NonTrendSeries } from '../common/interfaces/nonTrendSeries';
import { ManagedType, RetainTrendSeriesId, TrendChartConstants } from '../common/interfaces/trend.models';
import { TrendSeries } from '../common/interfaces/trendSeries';
import { QualityIconService } from '../services/quality-icon-service';
import { TrendDefinitionService } from '../services/trend-definition-service';
import { TrendSnapinService } from '../services/trend-snapin.service';
import { RelativeTimeRanges } from '../shared/trend-searched-item';
import { TrendValidationHelperService } from '../shared/trend-validation-helper.service';
import { TrendDataHandlerService } from '../trend-export/services/trend-data-handler-service';
import { TrendExcelExportService } from '../trend-export/services/trend-excel-export-service';
import { TrendPdfExportService } from '../trend-export/services/trend-pdf-export-service';
import { TrendExportComponent } from '../trend-export/trend-export.component';
import { TrendLogManager } from './trendLog.manager';
import { TrendDefinitionManager } from './trendViewDefinition.manager';

themeSupport.setDefault(themeElement);

declare let require: any;

const RESIZE_THROTTLE_TIMEOUT = 100;
const GENERAL_SETTINGS = 'Flex_Trend_GeneralSettings';
const SUCCESS_TOAST = 'success';
const DANGER_TOAST = 'danger';

@Component({
  selector: 'gms-trend-chart-selector',
  templateUrl: './trend-chart.component.html',
  styleUrl: './trend-chart.scss',
  providers: [TrendValidationHelperService],
  standalone: false
})

export class TrendChartComponent implements OnInit, OnChanges, OnDestroy, AfterContentInit, AfterContentChecked {

  @ViewChild('templateDelete', { static: false }) public popupELementRef: TemplateRef<void>;
  @ViewChild('trenddiv', { static: true }) public trenddiv: ElementRef;
  @ViewChild('template', { static: false }) public popupELementRefForExportModal: TemplateRef<void>;
  @Input() public systemBrowserObject: BrowserObject[];
  public subOpenChartInEditMode: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  @Output() public readonly showHideSnapinValueChanged: EventEmitter<boolean> = new EventEmitter();
  @ViewChild(TrendExportComponent, { static: false })
  public trendExportComponent: TrendExportComponent;
  public isDeleted = false;
  public snapinId: string;
  public currentSelectedTheme = 'light';
  public isMobileDevice = false;
  public isGenerateDisable = false;
  private modalRef?: ModalRef;
  private resizeSubs?: Subscription;
  private trendResizeSubscription?: Subscription;
  private readonly exportSubscription: Subscription;
  // Below flag is to check if tvd is deleted or not.
  private readonly traceModule = 'gmsSnapins_TrendChartComponent';
  private readonly subscriptions: Subscription[] = [];
  private subsDisplayMode: Subscription;
  private subsAddDatapoint: Subscription;
  private subRemoveDuplicteSeries: Subscription;
  private subsSeriesChange: Subscription;
  private subsDeleteTrend: Subscription;
  private subsLocationChanged: Subscription;
  private subApplySettings: Subscription;
  private subSavedTVDObject: Subscription;
  private subSaveAsTVDData: Subscription;
  private updateContentActionSub: Subscription;
  private handleNonTrendSereisSub: Subscription;
  private updateSubchartConfiguration: Subscription;
  private readonly subOkClicked: Subscription;
  private subTranslationService: Subscription;
  private subRestoreScrollPosition: Subscription;
  private displayNameType: CnsLabelEn;
  private settings: GeneralSetings;
  private curWidth = 0;
  private curHeight = 0;
  private deleteTitle = '';
  private deleteMessage = '';
  private deleteSubscription: Subscription;
  private exportErrorMessage = '';
  private exportSuccessMessage = '';
  private contentCereationFailedMsg = '';
  private downloadFailedMsg = '';
  private serviceFailedMsg = '';
  private trendDataHandlerSub: Subscription;

  constructor(private readonly traceService: TraceService,
    private readonly trendviewerService: SiTrendviewerService,
    private readonly trendDefinitionService: TrendDefinitionService,
    private readonly cnsHelperService: CnsHelperService,
    private readonly trendSnapinService: TrendSnapinService,
    private readonly qualityIconService: QualityIconService,
    private readonly trendLogManager: TrendLogManager,
    private readonly trendDefinitionManager: TrendDefinitionManager,
    private readonly ngZone: NgZone,
    private readonly trendViewerConfigService: SiTrendviewerConfigService,
    private readonly translateService: TranslateService,
    private readonly renderer: Renderer2,
    private readonly resizeObserver: ResizeObserverService,
    public toastNotificationService: SiToastNotificationService,
    private readonly siModal: SiActionDialogService,
    private readonly modalService: SiModalService,
    private readonly trendDataHandlerService: TrendDataHandlerService,
    private readonly validationDialogService: ValidationDialogService,
    private readonly trendValidationHelperService: TrendValidationHelperService,
    private readonly mobileNavigationService: MobileNavigationService,
    private readonly siThemeService: SiThemeService,
    private readonly trendPdfExportService: TrendPdfExportService,
    private readonly trendExcelExportService: TrendExcelExportService
  ) { }

  public ngOnChanges(changes: SimpleChanges): void {
    this.traceService.debug(this.traceModule, 'TrendChartComponent.ngOnChanges():Changes Detected');
    // check if previous view state object is available and reinitiate it.
    if (changes.systemBrowserObject.currentValue &&
      this.trendSnapinService.previousTVD && this.trendSnapinService.previousTVD !== changes.systemBrowserObject.currentValue[0].Name) {
      this.trendviewerService.initializeViewState(this.snapinId);
      this.initializeServiceSeries();
    }
    if (!this.trendSnapinService.retainedBrowserObject) {
      this.trendviewerService.initializeViewState(this.snapinId);
      this.initializeServiceSeries();
    }
    this.onSelectedObjectChanged();
  }

  public ngOnInit(): void {
    this.snapinId = this.trendSnapinService.snapId.fullId();
    const deviceInfo = this.mobileNavigationService.getDeviceInfo();
    this.isMobileDevice = deviceInfo === DeviceType.Android || deviceInfo === DeviceType.Iphone;
    this.subApplySettings = this.setSettings().subscribe(() => {
      // handle default General Settings
    });
    this.siThemeService.resolvedColorScheme$.subscribe(theme => {
      if (theme === 'dark') {
        this.currentSelectedTheme = 'dark';
      }
    });
    window.addEventListener('theme-switch', (e: any) => {
      if (e.detail.colorScheme === 'light') {
        this.currentSelectedTheme = 'light';
      } else {
        this.currentSelectedTheme = 'dark';
      }
    });
    this.traceService.debug(this.traceModule, 'TrendChartComponent.ngOnInit():called');
    this.subsAddDatapoint = this.trendSnapinService.addDataPoint.subscribe(selection => {
      this.addMultipleDataPoints(selection);
    });
    this.subsSeriesChange = this.trendDefinitionService.changedSeriesSub.subscribe(changedSeries => {
      this.seriesPropertyChange(changedSeries[0], changedSeries[1], changedSeries[2]);
    });
    this.subsLocationChanged = this.trendSnapinService.locationChange.subscribe(browserObject => {
      this.handleLocationChange(browserObject);
    });
    this.subsDeleteTrend = this.trendDefinitionService.deleteTrendSub.subscribe(() => {
      this.deleteTrend();
    });
    this.subRemoveDuplicteSeries = this.trendDefinitionService.removeSeries.subscribe(series => {
      this.removeDuplicateSeries(series);
    });
    this.subSavedTVDObject = this.trendSnapinService.savedTVDObjectIdSub.subscribe(() => {
      this.trendLogManager.nonTrendedObjectTrendValueSubscription();
    });
    this.updateContentActionSub = this.trendSnapinService.updateContentActionSub.subscribe(() => {
      this.trendLogManager.updateNonTrendedSeriesContentActions();
    });
    this.subSaveAsTVDData = this.trendSnapinService.saveAsTVDData.subscribe(data => {
      this.reloadTvd(data.tvd, data.title);
    });
    this.handleNonTrendSereisSub = this.trendDefinitionService.nonTrendSeriesHandleSub.subscribe(tvd => {
      this.handleNonTrendSeriesTvd(tvd);
    });
    this.updateSubchartConfiguration = this.trendDefinitionService.updateSubchartConfigurationSub.subscribe(chartDefinition => {
      this.updateSubcharts(chartDefinition);
    });
    this.subRestoreScrollPosition = this.trendSnapinService.restoreScrollPositionsSub.subscribe(() => {
      this.restoreScrollPositions();
    });
    this.translateService.get([
      'TREND_FOLDER.CONFIRM_DELETE_TITLE',
      'TREND_FOLDER.CONFIRM_DELETE_MESSAGE',
      'TREND_FOLDER.TREND_EXPORT.EXPORT_SUCCESS_MESSAGE',
      'TREND_FOLDER.TREND_EXPORT.EXPORT_ERROR_MESSAGE',
      'TREND_FOLDER.TREND_EXPORT.DOWNLOAD_PDF_ERROR_MESSAGE',
      'TREND_FOLDER.TREND_EXPORT.CONTENT_CREATION_ERROR_MESSAGE',
      'TREND_FOLDER.TREND_EXPORT.SERVICE_FAILED_MESSAGE'
    ])
      .toPromise().then(strings => {
        this.deleteTitle = strings['TREND_FOLDER.CONFIRM_DELETE_TITLE'];
        this.deleteMessage = strings['TREND_FOLDER.CONFIRM_DELETE_MESSAGE'];
        this.exportSuccessMessage = strings['TREND_FOLDER.TREND_EXPORT.EXPORT_SUCCESS_MESSAGE'];
        this.exportErrorMessage = strings['TREND_FOLDER.TREND_EXPORT.EXPORT_ERROR_MESSAGE'];
        this.downloadFailedMsg = strings['TREND_FOLDER.TREND_EXPORT.DOWNLOAD_PDF_ERROR_MESSAGE'];
        this.contentCereationFailedMsg = strings['TREND_FOLDER.TREND_EXPORT.CONTENT_CREATION_ERROR_MESSAGE'];
        this.serviceFailedMsg = strings['TREND_FOLDER.TREND_EXPORT.SERVICE_FAILED_MESSAGE'];
      });
    this.handleDisplayModeChange();
    this.setTrendViewerConfiguration();
  }

  public ngAfterContentInit(): void {
    this.traceService.debug(this.traceModule, 'TrendChartComponent.ngAfterContentInit():called');
    if (this.trenddiv) {
      this.resizeSubs = this.resizeObserver
        .observe(this.trenddiv.nativeElement, RESIZE_THROTTLE_TIMEOUT, true, true)
        .subscribe(() => this.onDivResize());
    }
  }

  public ngAfterContentChecked(): void {
    this.resizeHandler();
    this.stylingForSmallScreen();
  }

  public onUnsupportedRangeSelected(isValid: boolean): boolean {
    return this.isGenerateDisable = isValid;
  }

  public stylingForSmallScreen(): void {
    if (this.isMobileDevice) {
      const svgElement = this.trenddiv.nativeElement.querySelector('si-trendviewer si-chart-loading-spinner svg'); 

      // By applying this change to the parent div, we avoid additional condition to handle the play button’s state,which toggles between "play" and "pause." 
      // This approach is more efficient and simplifies the logic, as it makes the visibility dependent on the parent div rather than the play button itself.
      // This is because we need the play button to be disabled, whether it's in the play or pause state, when in edit mode and on a small screen.
      const playBtnDisableForSmallScreen = this.trenddiv.nativeElement.querySelector('si-trendviewer .controls.center');
      
      // in edit mode si-spinner should be at center
      if (svgElement) {
        // Only calculate rect if necessary
        const rect: any = Math.floor(this.trenddiv.nativeElement.getBoundingClientRect().width);
        const spinnerCenter = this.isEditModeOpen() ? rect : '0px';
        this.renderer.setStyle(svgElement, 'margin-left', spinnerCenter);
      }
     
      if (playBtnDisableForSmallScreen) {
        // Note- When user switch from mobile to desktop- it will still remain hidden . User need to refresh the browser
        // toggle visibility of play button in edit mode and view mode
        const visibility = this.isEditModeOpen() ? 'hidden' : 'visible';
        this.renderer.setStyle(playBtnDisableForSmallScreen, 'visibility', visibility);
       
      }
    }
  }

  // On resizing of the snapin pane splitters, the control should resize.
  // To    this, call the below method provided by marengo
  public onDivResize(): void {
    this.setNumberOfSampleAndTimerange();
    triggerWindowResize();
  }

  public ngOnDestroy(): void {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.ngOnDestroy() unsubscribe all subscriptions');
    this.saveTrendState();
    this.trendDefinitionService.noStateChanged = true;
    this.trendviewerService.stopLiveUpdate(this.snapinId);
    this.unsubscribeWsisubscriptions();
    if (this.subsDisplayMode) {
      this.subsDisplayMode.unsubscribe();
    }
    if (this.subsAddDatapoint) {
      this.subsAddDatapoint.unsubscribe();
    }
    if (this.subsLocationChanged) {
      this.subsLocationChanged.unsubscribe();
    }
    if (this.subsSeriesChange) {
      this.subsSeriesChange.unsubscribe();
    }
    if (this.subsDeleteTrend) {
      this.subsDeleteTrend.unsubscribe();
    }
    if (this.subApplySettings) {
      this.subApplySettings.unsubscribe();
    }
    if (this.subRemoveDuplicteSeries) {
      this.subRemoveDuplicteSeries.unsubscribe();
    }
    if (this.subSavedTVDObject) {
      this.subSavedTVDObject.unsubscribe();
    }
    if (this.updateContentActionSub) {
      this.updateContentActionSub.unsubscribe();
    }
    if (this.subOkClicked) {
      this.subOkClicked.unsubscribe();
    }
    if (this.subSaveAsTVDData) {
      this.subSaveAsTVDData.unsubscribe();
    }
    if (this.handleNonTrendSereisSub) {
      this.handleNonTrendSereisSub.unsubscribe();
    }
    if (this.updateSubchartConfiguration) {
      this.updateSubchartConfiguration.unsubscribe();
    }
    if (this.subTranslationService) {
      this.subTranslationService.unsubscribe();
    }
    if (this.subRestoreScrollPosition) {
      this.subRestoreScrollPosition.unsubscribe();
    }
    this.trendDefinitionService.clearChartService();
    this.resizeSubs?.unsubscribe();
    this.cleanTrendResizeSubscription();
  }

  public isEditModeOpen(): boolean {
    return this.trendviewerService.isEditModeOpen(this.snapinId);
  }

  public saveTrendViewerChanges(): Observable<boolean> {
    return new Observable(observer => {
      this.trendviewerService.saveUnsavedConfiguration(this.snapinId).subscribe(isSuccess => {
        observer.next(isSuccess);
        observer.complete();
      });
    });
  }

  public unsubscribeAPICalls(): void {
    this.trendDefinitionService.noStateChanged = true;
    this.trendviewerService.stopLiveUpdate(this.snapinId);
    this.unsubscribeWsisubscriptions();
    this.trendDefinitionService.clearChartService();
  }

  public setNumberOfSampleAndTimerange(): void {
    if (this.settings) {
      this.trendDefinitionService.numberOfSamples = Math.floor(this.trenddiv.nativeElement.clientWidth / this.settings.pixelsPerSample);
      this.trendDefinitionService.timeRange = this.settings.timeRange;
      this.trendDefinitionService.generalSettingsQualityIndication = this.settings.displayQuality;

      this.traceService.info(this.traceModule, 'TrendSeries.setNumberOfSample(): width:' + this.trenddiv.nativeElement.clientWidth +
        ', pixelsPerSample: ' + this.settings.pixelsPerSample + ', Calculated no of samples: ' + this.trendDefinitionService.numberOfSamples);
      this.traceService.info(this.traceModule, 'TrendSeries.setTimeRangeValue(): timeRangeValue:' + this.settings.timeRange);
    }
  }

  public deleteYesClicked(): void {
    const objectId: string = this.trendDefinitionService.tvdObjectId;
    this.trendValidationHelperService.trendValidationService([objectId], this.traceModule)
      .subscribe((validationInput: ValidationInput) => {
        if (validationInput) {
          if (this.trendDefinitionService.isTVdToDelete) {
            const subscription: Subscription = this.trendDefinitionManager.deleteTrend(objectId, validationInput).subscribe(isDeleted => {
              if (isDeleted) {
                this.traceService.debug(this.traceModule, 'TrendChartComponent.deleteTrend() WSI Response:Deleted successfully');
                this.completeDeleteTrend(true);
                this.showHideSnapinValueChanged.emit(true);
                this.isDeleted = true;
              } else {
                this.traceService.debug(this.traceModule, 'TrendChartComponent.deleteTrend() WSI Response:Deleted failed');
                this.completeDeleteTrend(false);
              }
              subscription.unsubscribe();
            },
            error => {
              this.completeDeleteTrend(false);
            });
          } else {
            const subscription: Subscription = this.trendLogManager.deleteTrend(objectId, validationInput).subscribe(isDeleted => {
              if (isDeleted) {
                this.traceService.debug(this.traceModule, 'TrendChartComponent.deleteTrend() WSI Response:Deleted successfully');
                this.completeDeleteTrend(true);
                this.showHideSnapinValueChanged.emit(true);
                this.isDeleted = true;
              } else {
                this.traceService.debug(this.traceModule, 'TrendChartComponent.deleteTrend() WSI Response:Deleted failed');
                this.completeDeleteTrend(false);
              }
              subscription.unsubscribe();
            },
            error => {
              this.traceService.error(this.traceModule, 'TrendChartComponent.deleteTrend() WSI error');
              this.completeDeleteTrend(false);
            });
          }
        }
      });

  }

  public completeDeleteTrend(isDeleted: boolean): void {
    this.trendDefinitionService.deleteTrendResponseSub.next(isDeleted);
  }

  public deleteNoClicked(): void {
    this.completeDeleteTrend(false);
  }

  public deleteTrend(): void {
    this.deleteSubscription = this.siModal.showDeleteConfirmationDialog(this.deleteMessage, this.deleteTitle).subscribe(confirmation => {
      switch (confirmation) {
        case DeleteConfirmationDialogResult.Delete:
          this.deleteYesClicked();
          break;
        default:
          this.deleteNoClicked();
          break;
      }
      if (this.deleteSubscription) {
        this.deleteSubscription.unsubscribe();
      }
    });
  }

  public removeDuplicateSeries(series: string[]): void {
    series.forEach(seriesIdentifier => {
      this.trendviewerService.removeSeriesFromEditMode(this.snapinId, seriesIdentifier, true);
    });
  }

  public saveTrendState(): void {
    const selectedSeries: Set<string> = this.trendDefinitionService.storingState?.trendChartState.hiddenSeries;
    if (this.trendDefinitionService.retainTrendSeries && selectedSeries) {
      selectedSeries.forEach(series => {
        let newSeries: RetainTrendSeriesId;
        const element: string = series.split(':')[0];
        if (!this.trendDefinitionService.isDiscardClicked && !!this.trendDefinitionService.getTrendSeriesCollection()?.get(element)?.ObjectIdOfTrendLogOnline) {
          const objTLO = this.trendDefinitionService.getTrendSeriesCollection().get(element).ObjectIdOfTrendLogOnline;
          newSeries = this.trendDefinitionService.retainTrendSeries.filter(ele => ele.identifier === element && ele.collectorId === objTLO)[0];
        } else {
          newSeries = this.trendDefinitionService.retainTrendSeries.filter(ele => ele.identifier === element)[0];
        }
        if (newSeries) {
          this.trendDefinitionService.storingState.trendChartState.hiddenSeries.delete(series);
          this.trendDefinitionService.storingState.trendChartState.hiddenSeries.add(newSeries.UniqueId + ':' + newSeries.collectorId);
        }
      });
    }
    const viewState: TrendViewerViewState = Object.assign({}, this.trendDefinitionService.storingState);
    const res: any = {
      state: viewState,
      savedBrowserObject: this.trendSnapinService.selectedObject,
      isDeleted: this.isDeleted
    };
    if (res) {
      this.trendSnapinService.storage.setState(this.trendSnapinService.snapId, res);
      this.trendDefinitionService.storingState = undefined;
      this.isDeleted = false;
    }
  }

  public restoreScrollPositions(): void {
    const retainedState = this.trendSnapinService.storage.getState(this.trendSnapinService.snapId);
    this.trendviewerService.restoreScrollPositions(this.snapinId, retainedState?.state?.trendChartState?.retainedScrollPositions);
  }

  public cancel(): void {
    this.modalRef.hide();
  }

  public processExport(): void {
    this.modalRef.hide();
    this.trendDefinitionService.startStopTrendSnapinProgress.next(true);
    // Clean any existing subscriptions to avoid memory leaks
    this.cleanTrendResizeSubscription();
    const chart = this.trenddiv.nativeElement.querySelector('si-trendviewer si-trendviewer-chart si-chart-cartesian');
    let spinnerElement = document.querySelector('.progress-container');
    this.trendResizeSubscription = this.resizeObserver.observe(chart, RESIZE_THROTTLE_TIMEOUT, true, true).subscribe(() => {
      if (!spinnerElement) {
        spinnerElement = document.querySelector('.progress-container');
      }
      if (spinnerElement) {
        // subtract 180 as spinner already have 180 of left margin.
        const left = Math.floor(chart.getBoundingClientRect().left - 180);
        this.renderer.setStyle(spinnerElement, 'left', left);
        this.renderer.setStyle(spinnerElement, 'width', chart.getBoundingClientRect().width);
      }
    });
    this.trendDataHandlerSub = this.trendDataHandlerService.fetchSeriesData(this.trendExportComponent.fromDate, this.trendExportComponent.toDate, 
      this.trendExportComponent.seriesDN, this.trendExportComponent.selectedSampleDensity, this.trendExportComponent.formatselected, 
      this.trendExportComponent.systemId).subscribe({
      next: resp => {
        try {
        // Handle file export based on the selected format
          if (this.trendExportComponent.formatselected === 'pdf') {
            this.trendPdfExportService.exportFile();
          } else if (this.trendExportComponent.formatselected === 'csv' || this.trendExportComponent.formatselected === 'xlsx') {
            this.trendExcelExportService.exportFile();
          }
          this.trendDefinitionService.startStopTrendSnapinProgress.next(false);
          this.cleanTrendResizeSubscription();
        } catch (error) {
          const catchedError = this.handleExportError(error);
          this.toastNotificationService.queueToastNotification('danger', this.exportErrorMessage, catchedError, false);
        }
        if (this.trendDataHandlerSub) {
          this.trendDataHandlerSub.unsubscribe();
        }
      },
      error: error => {
        this.trendDefinitionService.startStopTrendSnapinProgress.next(false);
        this.cleanTrendResizeSubscription();
        this.toastNotificationService.queueToastNotification('danger', this.serviceFailedMsg, '', false);
      }
    });
  }

  public onExportButtonClicked(): void {
    if (this.popupELementRefForExportModal) {
      this.modalRef = this.modalService.show(this.popupELementRefForExportModal
        , {
          ignoreBackdropClick: false,
          keyboard: true,
          animated: true,
          ariaLabelledBy: 'sample-modal-title'
        });
    }
  }
  
  private handleExportError(error: Error): string {
    let errorMessage;
    if (error.message.includes('download')) {
      const errorMsg = error.message.indexOf(' ') > 0 ? error.message.slice(1) : error.message;
      return errorMessage = this.downloadFailedMsg + `${errorMsg}`;
    } else if (error.message.includes('content')) {
      const errorMsg = error.message.indexOf(' ') > 0 ? error.message.slice(1) : error.message;
      return errorMessage = this.contentCereationFailedMsg + `${errorMsg}`;
    }
    return errorMessage = '';
  }

  private cleanTrendResizeSubscription(): void {
    if (this.trendResizeSubscription) {
      this.trendResizeSubscription.unsubscribe();
      this.trendResizeSubscription = undefined;
    }
  }

  private setSettings(): Observable<void> {
    return new Observable(observer => {
      const defaultGeneralSettings: GeneralSetings = {
        pixelsPerSample: 2,
        timeRange: {
          timeRangeUnit: RelativeTimeRanges.Week,
          timeRangeValue: 1
        },
        displayQuality: false
      };
      this.trendSnapinService.getGenSettings(GENERAL_SETTINGS).subscribe(result => {
        if (result === undefined || result === null) {
          result = JSON.stringify(defaultGeneralSettings);
        }
        this.settings = JSON.parse(result);
        this.traceService.debug(this.traceModule, 'TrendChartComponent.getGenSettings() WSI Response: ' + JSON.stringify(result));
        observer.next();
      }, error => {
        this.settings = defaultGeneralSettings;
        observer.next();
      });
    });
  }

  private setTrendViewerConfiguration(): void {
    const config: TrendViewerConfig = this.trendViewerConfigService.get();
    config.viewContentActions.secondaryActions = [
      {
        title: 'Export', disabled: false, action: (): void => this.onExportButtonClicked()
      },
      {
        title: '', disabled: false, action: (): void => this.manualUploadAction()
      },
      {
        id: 'delete-trend', title: '', disabled: false, action: (): void => this.deleteTrend()
      }
    ];
    this.subTranslationService = this.translateService.get(
      ['TREND_FOLDER.CUSTOM_CONTENT_ACTION.EXPORT_TREND', 'TREND_FOLDER.CUSTOM_CONTENT_ACTION.MANUAL_UPLOAD',
        'TREND_VIEWER.TEXT_SHORT.DELETE_TREND']).subscribe(success => {
      config.viewContentActions.secondaryActions[0].title = success['TREND_FOLDER.CUSTOM_CONTENT_ACTION.EXPORT_TREND'];
      config.viewContentActions.secondaryActions[0].disabled = false;
      config.viewContentActions.secondaryActions[1].title = success['TREND_FOLDER.CUSTOM_CONTENT_ACTION.MANUAL_UPLOAD'];
      config.viewContentActions.secondaryActions[1].disabled = true;
      config.viewContentActions.secondaryActions[2].title = success['TREND_VIEWER.TEXT_SHORT.DELETE_TREND'];
      config.viewContentActions.secondaryActions[2].disabled = true;
      if (this.subTranslationService) {
        this.subTranslationService.unsubscribe();
      }
    });
    config.enableSubcharts = true;
    this.trendViewerConfigService.update(config);
  }

  // Collect offline trend logs data while clicking on Manual Upload
  private manualUploadAction(): void {
    const offlineTsd = {};
    this.trendDefinitionService.getTrendSeriesCollection().forEach(tsd => {
      if (tsd.isOfflineTsd) {
        offlineTsd[tsd.trendObjectInfo.CollectorObjectOrPropertyId] = tsd;
      }
    });

    if (Object.keys(offlineTsd)) {
      const validationEditInfo: ValidationEditInfo = new ValidationEditInfo(Object.keys(offlineTsd));
      this.trendValidationHelperService.trendValidationService([...Object.keys(offlineTsd)], this.traceModule)
        .subscribe((validationInput: ValidationInput) => {
          if (validationInput) {
            const commandInput: CommandInput = {} as CommandInput;
            const commandInputArr: CommandInput[] = [];
            this.subTranslationService =
            this.translateService.get('TREND_VIEWER.TEXT_LONG.MANUAL_UPLOAD_OFFLINE_TREND_COMMAND_SUCCESS').subscribe(localeTextToShow => {
              this.toastNotificationService.queueToastNotification(SUCCESS_TOAST, localeTextToShow, '');
              if (this.subTranslationService) {
                this.subTranslationService.unsubscribe();
              }
            });
            // Update command input with validation result
            for (const tsdKey of Object.keys(offlineTsd)) {
              commandInput.Password = validationInput.Password;
              commandInput.SuperName = validationInput.SuperName;
              commandInput.SuperPassword = validationInput.SuperPassword;
              commandInput.Comments = validationInput.Comments;
              commandInput.SessionKey = validationInput.SessionKey;
              commandInputArr.push(commandInput);
              this.trendSnapinService.getPropertyStatusRights(tsdKey, true, commandInputArr);
            }
          }
        });
      // Update the command input with validation info
    }

    if (this.trendSnapinService.errorWhileManualCollect) {
      this.subTranslationService = this.translateService.get('TREND_VIEWER.TEXT_LONG.MANUAL_UPLOAD_OFFLINE_TREND_FAILED').subscribe(localeTextToShow => {
        this.toastNotificationService.queueToastNotification(DANGER_TOAST, localeTextToShow, '');
        if (this.subTranslationService) {
          this.subTranslationService.unsubscribe();
        }
      });
    }
  }

  // Change the titles to name or description based on the display mode change.
  private handleDisplayModeChange(): void {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.handleDisplayModeChange() called');
    if (this.cnsHelperService?.activeCnsLabel) {
      this.subsDisplayMode = this.cnsHelperService.activeCnsLabel.subscribe(() => {
        this.displayNameType = this.cnsHelperService.activeCnsLabelValue.cnsLabel;
        // const location: any = {
        //   path: this.trendSnapinService.getChartLocation(),
        //   enable: false
        // };
        // Update the chart title
        if (this.systemBrowserObject && this.systemBrowserObject.length > 0) {
          this.trendviewerService.setChartProperties(this.snapinId, {
            legendTooltip: true,
            iconEnum: this.qualityIconService.getIconEnum(),
            showCustomLegend: true
            // location: location
          }, true);
        }

        // ShowQualityArea is based on generalSettings also As we are hiding icons, setting it to false
        this.trendSnapinService.setQualityAreaAndIcons(this.trendDefinitionService.generalSettingsQualityIndication, false);

        // Update the series names on legends
        this.updateSeriesNames();
      });
    }
  }

  private handleLocationChange(browserObject: BrowserObject): void {
    const location: any = {
      id: browserObject.Designation,
      path: this.getChartLocation(browserObject),
      enable: true
    };
    this.trendviewerService.setChartProperties(this.snapinId, { location });
  }

  // update the series names
  private updateSeriesNames(): void {
    this.traceService.debug(this.traceModule, 'TrendSnapinService.updateSeriesNames() called');
    const tsdInfos: Map<string, TrendSeries> = this.trendDefinitionService.getTrendSeriesCollection();
    tsdInfos.forEach((value: TrendSeries, key: string) => {
      const properties: SeriesUpdatableProperties = {
        name: this.trendDefinitionService.getDisplayNameDescription(this.displayNameType, value.seriesCNSInfo),
        legendTooltipText: this.trendDefinitionService.getLegendToolTipText(this.displayNameType, value.seriesCNSInfo)
      };
      this.trendviewerService.updateSeriesProperties(this.snapinId, key, properties, true);
    });
  }

  // When the selection in system browser changes , reset the chart, clear the existing trend info
  // and process the newly selected trend
  private onSelectedObjectChanged(): void {
    this.clearPreviousSelection(); // to do: check and remove if this is a redundant call
    if (this.systemBrowserObject === undefined || this.systemBrowserObject === null || this.systemBrowserObject.length === 0) {
      this.traceService.debug(this.traceModule, 'TrendChartComponent.onSelectedObjectChanged():Creating new empty TrendViewDefinition');
      this.subOpenChartInEditMode.next(true);
      this.subscriptions.push(this.setSettings().subscribe(() => {
        this.setNumberOfSampleAndTimerange();
        this.trendLogManager.createEmptyChartTrendViewDefinition(undefined, this.displayNameType);
      }));
    } else {
      // For supporting multiple selection
      this.systemBrowserObject.forEach(objectSelected => {
        // If the selection is a trendviewdefinition, read the stored trend view definition from pvss
        // In this case the confguration of TVD is saved and shall be retrieved whenever requested
        if (objectSelected.Attributes.ManagedType === GmsManagedTypes.TRENDVIEWDEFINITION.id &&
            (!this.trendSnapinService.isNewTrendWorkFlow || this.trendSnapinService.tvdSavedFromNewTrend)) {
          this.traceService.debug(this.traceModule, 'TrendChartComponent.onSelectedObjectChanged():reading existing TrendViewDefinition');
          if (!this.trendDefinitionService.timeRange || !this.settings) {
            this.subscriptions.push(this.setSettings().subscribe(() => {
              this.setNumberOfSampleAndTimerange();
              this.trendDefinitionManager.readTrendViewDefinition(objectSelected, this.displayNameType);
            }));
          } else { this.trendDefinitionManager.readTrendViewDefinition(objectSelected, this.displayNameType); }
        } else { /** When the selection is either Trend log online, Trend Log , Trend log multiple, create the new trend definition.
                 In these cases there is no configuration saved and the definition needs to be initialized with default configuration. */
          this.traceService.debug(this.traceModule, 'TrendChartComponent.onSelectedObjectChanged():Creating new TrendViewDefinition');
          if (!this.trendDefinitionService.timeRange || !this.settings) {
            this.subscriptions.push(this.setSettings().subscribe(() => {
              this.setNumberOfSampleAndTimerange();
              this.trendLogManager.createEmptyChartTrendViewDefinition(objectSelected, this.displayNameType);
              this.trendLogManager.createNewTrendViewDefinition(objectSelected, this.trendSnapinService.isNewTrendWorkFlow, undefined, this.displayNameType);
              if (objectSelected.Attributes.ManagedTypeName !== ManagedType.TrendLogOnline
                && objectSelected.Attributes.ManagedTypeName.startsWith(ManagedType.TrendLog)) {
                this.trendSnapinService.getPropertyStatusRights(objectSelected.ObjectId);
              } else {
                this.trendSnapinService.disableManualUploadContentAction(true);
              }
            }));
          } else {
            this.trendLogManager.createEmptyChartTrendViewDefinition(objectSelected, this.displayNameType);
            this.trendLogManager.createNewTrendViewDefinition(objectSelected, this.trendSnapinService.isNewTrendWorkFlow, undefined, this.displayNameType);
          }
        }
      });
    }
    this.restoreScrollPositions();
  }

  private addMultipleDataPoints(selectedObjects: BrowserObject[]): void {
    selectedObjects.forEach(selectedObject => {
      this.trendLogManager.createNewTrendViewDefinition(selectedObject, true, undefined, this.displayNameType);
    });
  }

  private seriesPropertyChange(systemId: number, objectId: string, trendSeriesSimpl: TrendSeriesSimpl): void {
    this.trendLogManager.handlePropertyChange(systemId, objectId, trendSeriesSimpl, this.displayNameType);
  }

  // Chart title based on display mode
  private getChartLocation(browserObject: BrowserObject): string {
    let chartPath: string;
    if (this.displayNameType === CnsLabelEn.Name ||
        this.displayNameType === CnsLabelEn.NameAndAlias ||
        this.displayNameType === CnsLabelEn.NameAndDescription) {
      chartPath = browserObject.Designation;
    } else {
      chartPath = browserObject.Location;
    }
    // this is not expected code. we should call object manager API and need to get selectedObject parent
    // without WSI call
    const path: string = chartPath.split('.').pop();
    return path;
  }

  private clearPreviousSelection(): void {
    // clear subscriptions requests of trendview definition read,
    this.unsubscribeWsisubscriptions();
    // clear series Identifier in config service on node change
    this.trendSnapinService.resetSeriesId();
    // reset the chart i.e. remove the series, make the configuration to default,etc
    this.trendviewerService.resetChart(this.snapinId);
    // clear subscriptions specific to cached series
    this.trendDefinitionService.clearChartService();
    // clear the non trended objects collection
    this.trendSnapinService.nonTrendedSeriesCollcetion = new Map<string, NonTrendSeries>();
    // clear all flags for related item tvd and save confirmation.
    if (!this.trendSnapinService.isNewTrendWorkFlow) {
      this.trendSnapinService.showSaveConfirmationForNewTrend = false;
      this.trendSnapinService.tvdSavedFromNewTrend = false;
    }
    // clear the offline series collection
    this.trendSnapinService.offlineSeriesCollection = new Map<string, TrendSeries>();
  }

  private unsubscribeWsisubscriptions(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
    this.trendDefinitionManager.unsubscribeWsisubscriptions();
    this.trendLogManager.unsubscribeWsisubscriptions();
  }

  private resizeHandler(): void {
    if (this.trenddiv) {
      const rect: any = this.trenddiv.nativeElement.getBoundingClientRect();
      this.ngZone.runOutsideAngular(() => {
        const width: number = Math.floor(rect.width);
        const height: number = Math.floor(rect.height);
        if (width !== this.curWidth || height !== this.curHeight) {
          this.curWidth = width;
          this.curHeight = height;
          this.onDivResize();
        }
      });
    }
  }

  private reloadTvd(data: TrendViewDefinition, title: string): void {
    const chartProperties: any = {
      title,
      isNewTrend: false
    };
    this.trendviewerService.setChartProperties(this.snapinId, chartProperties, true);
  }

  private initializeServiceSeries(): void {
    this.trendviewerService.getHiddenSeries(this.snapinId);
  }

  private handleNonTrendSeriesTvd(tvd: TrendViewDefinition): void {
    this.trendDefinitionManager.calculateOldestTimeStamp(tvd.TsdCollectionInfo.TrendSeriesDefinitions);
    tvd.TsdCollectionInfo.TrendSeriesDefinitions.forEach(tsd => {
      this.trendSnapinService.nonTrendedSeriesCollcetion.forEach((nts, key) => {
        if (nts.trendObjectInfo.ObjectId === tsd.TrendedObjectId) {
          // we need to remove non trended series first and then add new trended series
          this.trendviewerService.removeSeries(this.snapinId, key);
          this.trendDefinitionManager.processTSD(tsd, tvd, nts);
          this.trendSnapinService.tsdSubscriptionMapping.forEach(value => {
            if (value instanceof NonTrendSeries) {
              this.trendSnapinService.covSubscription.get(key)?.unsubscribe();
              this.trendSnapinService.covSubscription.delete(key);
            }
          });
        }
      });
    });

    const ids: string[] = this.trendDefinitionManager.subscriptionIds.map(sub => (sub.split(TrendChartConstants.SUB_ID_SEPERATOR.toString())[0]));

    this.trendDefinitionManager.propValueChangedObservableArray = this.trendSnapinService.getPropertyValuesObservables(ids);

    this.trendDefinitionManager.bulkSubscription(this.trendDefinitionManager.propValueChangedObservableArray, this.trendDefinitionManager.subscriptionIds);
    this.trendSnapinService.nonTrendedSeriesCollcetion.clear();
  }

  private updateSubcharts(chartDefinition: ChartDefinition): void {
    this.trendDefinitionManager.subChartGridModel = chartDefinition.chartConfiguration.subChartGrids;
  }
}
