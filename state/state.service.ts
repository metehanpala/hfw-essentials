/* eslint-disable @typescript-eslint/naming-convention */
import { PlatformLocation } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, NgZone, Optional } from '@angular/core';
import { ActivatedRoute, NavigationStart, Params, Router, RouteReuseStrategy, UrlTree } from '@angular/router';
import {
  AppContextService, AuthenticationServiceBase, isNullOrUndefined,
  ModeData, ModeService, TraceService, UserInfoStorage
} from '@gms-flex/services-common';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject,
  concat,
  interval,
  Observable,
  of,
  Subject,
  Subscription,
  throwError } from 'rxjs';
import { catchError, concatMap, delay, map, share, take, tap, timeout } from 'rxjs/operators';

import { FullPaneId } from '../../common/fullsnapinid/full-pane-id.model';
import { FullQParamId } from '../../common/fullsnapinid/full-qparam-id.model';
import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { IHfwMessage } from '../../common/interfaces/ihfwmessage';
import { IPreselectionService } from '../../common/interfaces/ipreselection.service';
import { IQParamService } from '../../common/interfaces/iqparam.service';
import { IStateService } from '../../common/interfaces/istate.service';
import { IStorageService } from '../../common/interfaces/istorage.service';
import { MessageParameters } from '../../common/interfaces/message-parameters.model';
import { QParam } from '../../common/interfaces/q-param.model';
import { SnapinDisplay } from '../../common/interfaces/snapin-display/snapin-display';
import { SnapInBase } from '../../common/snapin-base/snapin.base';
import { UnsavedDataReason } from '../../common/unsaved-data';
import { MobileNavigationService } from '../mobile/mobile-service/mobile-navigation.service';
import { SettingsService } from '../settings/settings.service';
import * as hldl from '../shared/hldl/hldl-data.model';
import { HldlService } from '../shared/hldl/hldl.service';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { QParamStore } from '../shared/stores/qparam-store';
import { SnapInStore } from '../shared/stores/snapin.store';
import { TraceModules } from '../shared/trace/trace-modules';
import { LayoutUtilities, ScreenSize } from '../shared/utils/layout-utilities';
import { SnapinMessageBroker } from '../snapinmessagebroker';
import { FavoriteLayoutsPerRange, UserFramePreferences } from '../state/user-settings.handler';
import { AppStatus } from './app-status.model';
import { AutomaticFirstSelectionHandler } from './automatic-first-selection-handler';
import { ChangeModeHandler } from './change-mode-handler';
import { StateDataStructure, StateDataStructureCreator } from './data-structure-creation/state-data-structure-creator';
import { ErrorManagerService } from './error-manager.service';
import { HfwState } from './hfw-state';
import { LayoutManagement } from './layout-management/layout-management';
import { NavigateHandler } from './navigate.handler';
import { QParamChange } from './q-param-change.model';
import { QParamsHandler } from './qparams-handler';
import { ReuseStrategyLayoutChange } from './reuse-strategy-layout-change';
import { ReuseStrategyService } from './reuse-strategy.service';
import { RoutingHelperService } from './routing-helper.service';
import { RoutingUtilities } from './routing-utilities';
import { SnapinInstancesService } from './snapin-instances.service';
import { UnsavedDataHandler } from './unsaved-data.handler';
import { UserSettingsHandler } from './user-settings.handler';

/**
 * This service maintain the application status.
 */
@Injectable({
  providedIn: 'root'
})
export class StateService implements IStateService {
  private static readonly mobileLayoutId = '2-pane-mobile';

  public redirectUrl!: string;

  public isMobile: boolean | undefined;

  public qParamChangeDetected: BehaviorSubject<QParamChange> = new BehaviorSubject<QParamChange>(null!);

  public layoutSelected =
    new BehaviorSubject<{ frameId: string; viewId: string | undefined; layoutId: string | null; favoriteLayouts?: FavoriteLayoutsPerRange }>(null!);

  public currentState: HfwState = new HfwState();
  public backButton!: boolean;

  public get hasRouteConfigBeenReset(): boolean {
    return this._hasRouteConfigBeenReset;
  }

  public layoutResetObs: Observable<void>;

  private readonly layoutResetSubject = new Subject<void>();

  private _hasRouteConfigBeenReset = false;

  private isAppStartedWithDeeplink!: boolean;

  /**
   * The run-time representation of the HLDL file.
   */
  protected _hfwInstance!: hldl.HfwInstance;

  private readonly _isDataStructureReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private changingLayoutFrameStore!: FrameStore;

  private changingLayoutId!: string | null;

  private windowResizeBinding: any;

  private readonly qParamsHandler: QParamsHandler;
  private readonly settingsHandler: UserSettingsHandler;

  // the msgBrokerInstance given from navigateFrames method called by the app.
  private msgBroker!: IHfwMessage;

  private _isLogOutCalling = false;

  private readonly sub: Subscription;

  public constructor(private readonly hfwTrace: TraceService,
    private readonly hldlService: HldlService,
    private readonly settings: SettingsService,
    private readonly router: Router,
    private readonly platformLocation: PlatformLocation,
    private readonly authenticationService: AuthenticationServiceBase,
    protected httpClient: HttpClient,
    private readonly ngZone: NgZone,
    private readonly routingHelper: RoutingHelperService,
    protected appContext: AppContextService,
    private readonly errorManagerService: ErrorManagerService,
    private readonly modeService: ModeService,
    private readonly routeReuseStrategy: RouteReuseStrategy,
    private readonly snapinInstances: SnapinInstancesService,
    private readonly cookieService: CookieService,
    @Inject(MobileNavigationService) private readonly mobileNavigationService: MobileNavigationService,
    @Optional() @Inject(IPreselectionService) private readonly iPreselectionServices: IPreselectionService[],
    @Optional() @Inject(IStorageService) private readonly iStorageServices: IStorageService[],
    @Optional() @Inject(IQParamService) private readonly iQParamServices: IQParamService[]) {
    this.errorManagerService.init();
    this.qParamsHandler = new QParamsHandler(this, this.hfwTrace);
    this.settingsHandler = new UserSettingsHandler(this.settings, this.hfwTrace);

    const source = interval(1000);
    this.sub = source.subscribe(value => this.receiveLogOff(value));

    this.router.events.forEach(event => {
      if (event instanceof NavigationStart) {
        if (event.navigationTrigger === 'popstate') {
          if (location.href.endsWith('/main/page') || location.href.includes('/loading') || location.href.includes('/loginpage')) {
            history.go(1);
            history.pushState(null, '', window.location.href);
            this.backButton = true;
          }
        }
        // if (event.navigationTrigger === 'imperative' && location.href.endsWith('/main/page')) {
        //   this.router.navigate(['/loginpage'], { replaceUrl: true });
        //   history.go(1);
        //   history.pushState(null, '', window.location.href);
        //   this.backButton = true;
        // }
      }
    });

    // Mobile Only Visibility
    this.isMobile = this.mobileNavigationService.mobileOnlyVisibilityLast;

    this.mobileNavigationService.mobileOnlyVisibility$.subscribe((mobileOnlyVisibility: boolean) => {
      this.isMobile = mobileOnlyVisibility;
    });

    this.layoutResetObs = this.layoutResetSubject.asObservable();
  }

  public get appStatus(): AppStatus {
    return this.currentState.appStatus;
  }

  public set appStatus(value: AppStatus) {
    if (value != null) {
      this.currentState.appStatus = value;
    }
  }

  public get isDataStructureReady(): Observable<boolean> {
    return this._isDataStructureReady.asObservable();
  }

  public notifyLayoutReset(): void {
    this.layoutResetSubject.next();
  }

  /**
   * Returns an Observable with the array of frames of the current HLDL instance.
   */
  public getHfwInstance(framesToCreate?: string[], layoutsPerFrameView?: Map<string, string>, saveSelectedLayout?: boolean): Observable<hldl.HfwInstance> {
    this.isAppStartedWithDeeplink = this.redirectUrl != null && this.redirectUrl !== '/' && 
      !this.redirectUrl.startsWith('/?code='); // done here since this is the first call made to stateService
    if (this._hfwInstance != null) {
      return of(this._hfwInstance);
    } else {
      return this.hldlService.getHfwInstance().pipe(
        tap((hldlData: hldl.HfwInstance) => {
          if (hldlData != null) {
            const data = JSON.parse(JSON.stringify(hldlData));
            this.hfwTrace.debug(TraceModules.state, 'Start creating data structures and routing configuration...');
            this.createDataStructure(data, framesToCreate);
            this.selectLayoutsAndSnapins();
            this.loadSnapInsResources(data);
            // intentionally push the configuration for the whole profile.
            this.routingHelper.pushConfiguration(this.hldlService.getHfwInstanceValue()!.hfwFrames);
            this._hasRouteConfigBeenReset = true;

            // check for neverDestroy parameter for each snapin instance
            this.neverDestroyCheck();
          }
        }),
        concatMap((data: hldl.HfwInstance) => this.settingsHandler.retrieveUserSettings(data, layoutsPerFrameView, saveSelectedLayout)),
        map(framePreferences => {
          this.applyUserSettings(framePreferences, !this.isAppStartedWithDeeplink);
          this._isDataStructureReady.next(true);
          return this._hfwInstance;
        })
      );
    }
  }

  public updateAvailableFrames(framesToCreate: string[]): Observable<boolean> {
    const replySubject: Subject<boolean> = new Subject<boolean>();
    // first ensure all framesToCreate exists in current profile.
    const frames = framesToCreate.filter(f => this.hldlService.getHfwInstanceValue()?.hfwFrames?.find(x => x.id === f));
    // check frames which don't need to be added/removed.
    const addedFrameStores = this.addFramesDinamically(frames);
    const removedFrames: string[] = this._hfwInstance?.hfwFrames.filter(f => !framesToCreate.includes(f.id)).map(frame => frame.id);

    // check if the active one is removed.
    if (removedFrames?.includes(this.currentState.activeWorkAreaIdValue)) {
      const frameId = this.getFirstWorkAreaFrame(removedFrames)!.id;
      this.hfwTrace.info(TraceModules.state, 'Removed frames include %s, navigating to %s.', this.currentState.activeWorkAreaIdValue, frameId);
      this.switchToNextFrame(frameId, this.msgBroker).subscribe(res => {
        this.hfwTrace.info(TraceModules.state, 'switchToNextFrame completed with %s.', res);
        this.completeFramesUpdate(frames, removedFrames, addedFrameStores);
        replySubject.next(true);
        replySubject.complete();
      });
    } else {
      this.completeFramesUpdate(frames, removedFrames, addedFrameStores);
      return of(true);
    }

    return replySubject.asObservable();
  }

  public getUpdatingLocation(fullId: FullSnapInId): FullPaneId {
    const sniStore = this.currentState.getSnapInStore(fullId);
    if (!isNullOrUndefined(sniStore) && sniStore!.futurePaneId) {
      return new FullPaneId(fullId.frameId, sniStore!.futurePaneId);
    }
    return null!;
  }

  /**
   * Returns the array of frames of the current HLDL instance.
   */
  public getFrames(): hldl.HfwFrame[] | null {
    return (this._hfwInstance != null) ? this._hfwInstance.hfwFrames : null;
  }

  public activateQParamSubscription(activatedRoute: ActivatedRoute): void {
    this.qParamsHandler.activateQParamSubscription(activatedRoute, this.currentState);
  }

  /**
   * Returns the Pane object of the given IDs.
   */
  public getPaneById(paneId: string, frameId: string): hldl.Pane | null {
    const hfwFrame: hldl.HfwFrame | null = this.hldlService.getFrameById(frameId);
    if (hfwFrame != null) {
      if (hfwFrame.panes != null) {
        const pane: hldl.Pane | undefined = hfwFrame.panes.find(p => p.id === paneId);
        return pane ?? null;
      } else {
        this.hfwTrace.warn(TraceModules.state, 'Hldl Error; No Panes Found for this FrameId.');
      }
    } else {
      this.hfwTrace.warn(TraceModules.state, 'Hldl Error; No HfwFrame Found for this FrameId.');
    }
    return null;
  }

  public navigateFrames(msgBroker: IHfwMessage): Observable<boolean> {
    this.msgBroker = msgBroker;
    if (this.isAppStartedWithDeeplink) {
      this.routingHelper.resetWildcardConfig();
      return this.navigateToDeeplink(msgBroker);
    } else {
      if (this.appStatus === AppStatus.Initializing) {
        return this.startNavigateDefaultUrl(msgBroker);
      }
      return of(false);
    }
  }

  public navigateToDeeplink(msgBroker: IHfwMessage): Observable<boolean> {
    // if the deeplink is pointing to an invalid URL
    // i.e. a layout not available on the current device
    // change the url to a default one, preserving qParams
    this.hfwTrace.debug(TraceModules.state, 'seems not used. %s', msgBroker);
    this.redirectUrl = this.checkDeepLinkUrl(this.redirectUrl);

    const workAreaId: string = RoutingUtilities.getWorkAreaFrameId(this.router, this.redirectUrl);
    this.currentState.changeWorkAreaFrame(this.hldlService.getFrameById(workAreaId)!.id);

    const viewId: string = RoutingUtilities.getWorkAreaFrameViewId(this.router, this.redirectUrl);

    const layoutId: string = RoutingUtilities.getWorkAreaFrameLayoutId(this.router, this.redirectUrl);
    const frameStore: FrameStore | null = this.currentState.getFrameStoreViaId(workAreaId);

    frameStore.selectView(viewId);
    frameStore.selectLayout(layoutId);

    const params: Params | null = this.routingHelper.getQueryParametersFromUrl(this.redirectUrl);
    this.checkModeFromDeeplink(params!);

    const qParamResult = QParamsHandler.scanQParams(params, this.currentState);

    if (params && qParamResult.selectionParams.length > 0) {
      return this.checkAutomaticFirstSelectionOnDeeplink(msgBroker, qParamResult.selectionQParamServices, qParamResult.selectionParams).pipe(
        tap((res: boolean) => {
          this.hfwTrace.debug(TraceModules.state, 'checkAutomaticFirstSelectionOnDeeplink(%s) completed. result: %s', frameStore.id, res);
          const currentUrl: UrlTree = this.getUrlTreeOfCurrentState();
          // adapt deeplink url in case
          const url: string = currentUrl.toString();
          if (url !== this.redirectUrl) {
            this.hfwTrace.debug(TraceModules.state, 'deeplink url \n %s \n differs from calculated one \n %s \n which will be used.',
              this.redirectUrl, url);
            this.redirectUrl = url;
          }
          this.navigateDeeplink(frameStore);
        })
      );
    } else {
      this.hfwTrace.debug(TraceModules.state, 'navigateToDeeplink: no parameters for AutomaticFirstSelectionOnDeeplink.');
      this.navigateDeeplink(frameStore);
      return of(true);
    }
  }

  public updatePaneFromExternNavigate(frameId: string, paneId: string, newSnapIn: FullSnapInId): void {
    if (newSnapIn != null) {
      this.hfwTrace.debug(TraceModules.state, 'updatePaneFromExternNavigate() method enter for pane:%s.%s. snapin:%s', frameId, paneId, newSnapIn.snapInId);
      const paneStore: PaneStore = this.currentState.getPaneStoreViaIds(frameId, paneId);
      if (paneStore != null && !paneStore.tabChangeInProgress) {
        this.hfwTrace.debug(TraceModules.state, 'setting state updatingFromNavigate from updatePaneFromExternNavigate.');
        this.currentState.appStatus = AppStatus.UpdatingFromNavigate;
        paneStore.selectSnapIn(newSnapIn.snapInId);
        this.hfwTrace.debug(TraceModules.state, 'setting state running from updatePaneFromExternNavigate.');
        this.currentState.appStatus = AppStatus.Running;
      }
    }
  }

  public updatePaneDeactivatedFromNavigate(frameId: string, paneId: string, hostingLayoutId: string): void {
    this.hfwTrace.debug(TraceModules.state, 'updatePaneDeactivatedFromNavigate() method enter for pane:%s.%s.', frameId, paneId);
    const paneStore: PaneStore = this.currentState.getPaneStoreViaIds(frameId, paneId);
    const nextFrameId: string = RoutingUtilities.getWorkAreaFrameId(this.router, this.router.url);
    const nextFrameStore: FrameStore | null = this.currentState.getFrameStoreViaId(nextFrameId);
    if (nextFrameStore) {
      const nextLayoutId: string = RoutingUtilities.getWorkAreaFrameLayoutId(this.router, this.router.url);
      let isModeChanging = false;
      if (nextFrameStore != null &&
        this.routingHelper.getModeIdFromUrl(this.router.url) !== this.currentState.selectedModeValue!.id) {
        isModeChanging = true;
      }

      if (paneStore != null && nextFrameId === frameId && !isModeChanging && nextLayoutId === hostingLayoutId &&
        this.currentState.paneIsInLayout(this.currentState.getFrameStoreViaId(nextFrameId)!, paneId, nextLayoutId)) {
        this.hfwTrace.debug(TraceModules.state, 'setting state updatingFromNavigate from updatePaneDeactivatedFromNavigate.');
        this.currentState.appStatus = AppStatus.UpdatingFromNavigate;
        paneStore.selectSnapIn(null!);
        this.hfwTrace.debug(TraceModules.state, 'setting state running from updatePaneDeactivatedFromNavigate.');
        this.currentState.appStatus = AppStatus.Running;
      }
    }
  }

  public updateLayoutFromExternNavigate(frameId: string, viewId: string, layoutId: string): void {
    this.hfwTrace.debug(TraceModules.state, 'method enter appStatus = ' + AppStatus[this.currentState.appStatus]);
    if (this.currentState.appStatus === AppStatus.Running && frameId != null && layoutId != null) {
      const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);

      if (frame.availableLayoutsValue.length > 0 && frame.availableLayoutsValue.find(l => l.id === layoutId) == null) {
        this.ngZone.run(() => {
          if (frame.selectedViewIdValue) {
            this.hfwTrace.debug(TraceModules.state, 'calling navigateToASpecificLayoutOfAFrame from updateLayoutFromExternNavigate.');
            this.navigateToFrameViewLayout(this.currentState.activeWorkAreaIdValue, viewId,
              frame.availableLayoutsValue[frame.availableLayoutsValue.length - 1].id);
          }
        });
      } else {
        this.hfwTrace.debug(TraceModules.state, 'setting updatingFromNavigate from updateLayoutFromExternNavigate');
        this.currentState.appStatus = AppStatus.UpdatingFromNavigate;
        this.selectViewAndLayoutAndSaveUserSettings(frameId, layoutId, viewId);
        this.hfwTrace.debug(TraceModules.state, 'setting running from updateLayoutFromExternNavigate');
        this.currentState.appStatus = AppStatus.Running;
      }
    } else {
      this.hfwTrace.debug(TraceModules.state,
        'updateLayoutFromExternNavigate hit but not performed due to appStatus = ' + AppStatus[this.currentState.appStatus]);
    }
  }

  public updateViewFromExternNavigate(frameId: string, viewId: string): void {
    this.hfwTrace.debug(TraceModules.state, 'method enter appStatus = ' + AppStatus[this.currentState.appStatus]);
    if (this.currentState.appStatus === AppStatus.Running && frameId != null && viewId != null) {
      const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
      if (frame) {
        this.hfwTrace.debug(TraceModules.state, 'setting updatingFromNavigate from updateViewFromExternNavigate');
        this.currentState.appStatus = AppStatus.UpdatingFromNavigate;
        frame.updateAvailableLayouts(viewId);
        // select new view
        frame.selectView(viewId);
        frame.selectPreferredSnapIn(viewId);
        this.currentState.appStatus = AppStatus.Running;
      }
    } else {
      this.hfwTrace.debug(TraceModules.state,
        'updateViewFromExternNavigate hit but not performed due to appStatus = ' + AppStatus[this.currentState.appStatus]);
    }
  }

  public pushNewSelectionQParam(value: QParam | null, state: HfwState): void {
    if (!isNullOrUndefined(value)) {
      this.qParamsHandler.pushNewSelectionQParam(value, state);
    }
  }

  public switchToNextFrame(frameId: string, msgBroker: IHfwMessage, message?: MessageParameters): Observable<boolean> {
    const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
    if (!isNullOrUndefined(frame) &&
      this.currentState.appStatus === AppStatus.Running &&
      frame.frameConfig.docked === hldl.Docked.none) {

      if (frameId !== this.currentState.activeWorkAreaIdValue) {
        return this.performSwitchFrame(frameId, frame, msgBroker, message);
      } else {
        if (!isNullOrUndefined(message)) { // even if the frame won't change, spread the message.
          return this.spreadMessageAndNavigate(frame, msgBroker, message);
        } else {
          return of(false);
        }
      }
    } else {
      return of(false);
    }
  }

  public updateStateAfterFrameChange(newFrameId: string): void {
    if (newFrameId !== this.currentState.activeWorkAreaIdValue &&
      this.hldlService.getFrameById(newFrameId)!.docked === hldl.Docked.none) {
      this.currentState.changeWorkAreaFrame(newFrameId);
    }
  }

  public changeMode(mode: ModeData, msgBroker: SnapinMessageBroker, preferredFrameId?: string, firstSelectionObj?: any): Observable<boolean> {
    // SUL management of mode change while a frame change is processing
    if (this.currentState.appStatus === AppStatus.Running || this.currentState.appStatus === AppStatus.SwitchingFrame ||
      this.currentState.appStatus === AppStatus.ProcessingNewSelection) {
      const openingFrameId = (!preferredFrameId) ? this.currentState!.activeWorkAreaIdValue! : preferredFrameId;
      const changeModeHandler: ChangeModeHandler = new ChangeModeHandler('changeMode:' + mode.id, mode,
        firstSelectionObj, openingFrameId, msgBroker, this, this.routingHelper,
        this.router, this.modeService,
        this.hfwTrace);
      return changeModeHandler.sendSelectionAndChangeMode();
    }
    return of(false);
  }

  public updateMode(mode: ModeData): void {
    if (this.currentState.selectedModeValue != null && this.currentState.selectedModeValue.id !== mode.id) {
      this.currentState.changeSelectedMode(mode);
    }
    this.modeService.setMode(mode);
  }

  public navigateToMultipleSelection(isWorkAreaChangingLayout: boolean): void {
    if (this.currentState.activeWorkAreaIdValue != null) {
      const mainUrlTree: UrlTree = this.getUrlTreeOfCurrentState();

      const mainUrlTreePlain: string = mainUrlTree.toString();
      if (this.router.url !== mainUrlTreePlain) {
        this.hfwTrace.info(TraceModules.state, 'NAVIGATE: navigateToMultipleSelection \n appStatus: %s \n url: %s', this.appStatus, mainUrlTreePlain);

        if (isWorkAreaChangingLayout) {
          const currentFrame: FrameStore = this.currentState.getFrameStoreViaId(this.currentState.activeWorkAreaIdValue)!;
          const currentLayoutId = currentFrame.selectedLayoutIdValue;
          const snapinsToReuse: FullSnapInId[] | undefined =
            this.evaluateSnapinsToReuseOnLayoutSwitch(this.currentState.activeWorkAreaIdValue, currentLayoutId);
          (this.routeReuseStrategy as ReuseStrategyService).startLayoutChangeRouterReuse(snapinsToReuse);
        }

        this.router.navigateByUrl(mainUrlTree)
          .then(() => {
            if (isWorkAreaChangingLayout) {
              (this.routeReuseStrategy as ReuseStrategyService).stopLayoutChangeRouterReuse();
            }
            this.hfwTrace.debug(TraceModules.state, 'setting running from navigateToMultipleSelection');
            this.appStatus = AppStatus.Running;
          }, err => {
            if (isWorkAreaChangingLayout) {
              (this.routeReuseStrategy as ReuseStrategyService).stopLayoutChangeRouterReuse();
            }
            this.hfwTrace.error(TraceModules.state, 'Error navigating to the current URL. \n' + err);
          });
      } else {
        this.hfwTrace.info(TraceModules.state,
          'NAVIGATE: navigateAfterPreselection skipped. Url equals to the previous one.\n appStatus: %s \n url: %s', this.appStatus, mainUrlTreePlain);
        this.appStatus = AppStatus.Running;
      }
    } else {
      this.hfwTrace.error(TraceModules.state, 'Error navigating to navigateAfterPreselection. activeWorkArea undefined.');
    }
  }

  public navigateToFrameViewLayout(frameId: string, viewId: string, layoutId: string | null): Observable<boolean> {
    if (this.currentState.appStatus !== AppStatus.Initializing) {
      this.changingLayoutFrameStore = this.currentState.getFrameStoreViaId(frameId);
      const layoutIndex: number = this.changingLayoutFrameStore.availableLayoutsValue.findIndex((l: hldl.LayoutInstance) => l.id === layoutId);

      if (layoutIndex >= 0) {
        this.hfwTrace.debug(TraceModules.state, 'setting processingMessage from navigateToASpecificLayoutOfAFrame');
        this.appStatus = AppStatus.ProcessingMessage;
        this.changingLayoutId = layoutId;
        this.changingLayoutFrameStore.resetPaneFullScreenState();

        const mainUrlTree: UrlTree =
          this.routingHelper.getUrlOfCurrentStateAndSpecificLayout(this.currentState,
            this.hldlService.getFrameById(frameId)!,
            viewId,
            layoutId,
            this.currentState.selectedModeValue!);
        (this.routeReuseStrategy as ReuseStrategyService).traceStoredHandles();
        const snapinsToReuse: FullSnapInId[] | undefined = this.evaluateSnapinsToReuseOnLayoutSwitch(frameId, layoutId, viewId);
        (this.routeReuseStrategy as ReuseStrategyService).startLayoutChangeRouterReuse(snapinsToReuse);

        const navigateHandler: NavigateHandler = new NavigateHandler('navigateToFrameViewLayout', mainUrlTree, this.appStatus, this.router, this.hfwTrace);
        return navigateHandler.navigate().pipe(
          tap((res: boolean) => {
            if (res === true) {
              (this.routeReuseStrategy as ReuseStrategyService).stopLayoutChangeRouterReuse();
              (this.routeReuseStrategy as ReuseStrategyService).traceStoredHandles();
              // open, eventually closed pane
              this.changingLayoutFrameStore.paneMap.forEach((pane, key) => {
                if (this.currentState.paneIsInLayout(this.changingLayoutFrameStore, key, this.changingLayoutId)!
                  && !pane.paneConfig?.startAsClosed
                  && !pane.isVisibleValue) {
                  pane.open();
                }
              });

              // select new view and layout
              this.selectViewAndLayoutAndSaveUserSettings(this.changingLayoutFrameStore.id, this.changingLayoutId, viewId);
            }
            this.hfwTrace.debug(TraceModules.state, 'setting running from navigateToFrameViewLayout');
            this.appStatus = AppStatus.Running;
          }),
          catchError(this.handleErrorOnNavigateLayout)
        );
      } else {
        this.hfwTrace.warn(TraceModules.state, `The requested layout does not exists. layoutId:'\'${layoutId}\.`);
        return of(false);
      }
    } else {
      this.hfwTrace.debug(TraceModules.state, 'navigateToFrameViewLayout skipped since app is in initializing status.');
      return of(false);
    }
  }

  public navigateToSnapId(fullPaneId: FullPaneId, snapInId: string): Observable<boolean> {
    if (this.currentState.appStatus !== AppStatus.Initializing &&
      this.currentState.appStatus !== AppStatus.UpdatingFromNavigate &&
      this.currentState.appStatus !== AppStatus.ProcessingMessage &&
      this.currentState.appStatus !== AppStatus.ProcessingNewSelection &&
      fullPaneId != null &&
      snapInId != null) {
      this.hfwTrace.debug(TraceModules.state, 'NAVIGATE: navigateToSnapId (snapInId: %s) \n appStatus: %s \n current-url: %s',
        snapInId,
        this.appStatus,
        this.router.url.toString());
      const paneStore: PaneStore | null = this.currentState.getPaneStore(fullPaneId);
      if (paneStore) {
        paneStore.setTabChangeInProgress(true);
      }
      const frame: FrameStore | null = this.currentState.getFrameStoreViaId(fullPaneId.frameId);
      const paneOutletName: string = this.currentState.getPaneStore(fullPaneId)!.paneConfig!.outletName!;
      if (paneOutletName != null &&
        frame != null &&
        frame.frameConfig != null &&
        frame.frameConfig.outletName != null) {

        // check if pane outlet is not already pointing to this snap-in.
        const segment: string = this.routingHelper.getPaneOutletSnapInId(
          frame.frameConfig.outletName, paneOutletName);

        if (segment !== snapInId && frame.selectedLayoutIdValue) {
          const urlTree: UrlTree = this.routingHelper.getRelativeUrlTree(
            frame.frameConfig.outletName, frame.selectedLayoutIdValue, paneOutletName, snapInId,
            this.currentState.getAppQParamAndModeQParam(),
            this.currentState.selectedModeValue!);

          const navigateHandler: NavigateHandler = new NavigateHandler('navigateToSnapId', urlTree, this.appStatus, this.router, this.hfwTrace);
          return navigateHandler.navigate().pipe(
            tap((res: boolean) => {
              this.hfwTrace.debug(TraceModules.state, 'NAVIGATE: navigateToSnapId done. result: %s', res);
              if (res === true) {
                paneStore!.selectSnapIn(snapInId);
                paneStore!.setTabChangeInProgress(false);
              }
            }),
            catchError(() => of(false))
          );
        } else {
          return of(false);
        }
      } else {
        return of(false);
      }
    } else {
      return of(false);
    }
  }

  public displaySnapInTab(snapins: SnapinDisplay[], context?: any): Observable<boolean> {
    // discard snapins which are not part of the current frame.
    const filteredSnapins = snapins.filter(s => s.frameId === this.currentState.activeWorkAreaIdValue);

    if (!isNullOrUndefined(filteredSnapins) && filteredSnapins.length > 0) {
      const targetPanes: Map<string, SnapinDisplay[]> = this.calculateSnapinDisplayPerPane(snapins);

      // set tab items visibility.
      snapins.forEach(sniDisplay => {
        const snapinStore: SnapInStore | null = this.currentState.getSnapInStoreViaIds(sniDisplay.frameId, sniDisplay.snapinId);
        if (context) {
          this.hfwTrace.info(TraceModules.state, 'displaySnapInTab: Sending context message to %s.', snapinStore!.fullSnapInId.fullId());
          snapinStore!.sendMessage(context);
        }
        this.hfwTrace.info(TraceModules.state, 'displaySnapInTab: Setting %s tab visibility as %s.', snapinStore!.fullSnapInId.fullId(), sniDisplay.showTab);
        snapinStore!.isTabVisible = sniDisplay.showTab; // make snapin tab visible.
      });

      targetPanes.forEach((snapInDisplays, paneId) => {
        const paneStore = this.currentState.getPaneStoreViaIds(snapInDisplays[0].frameId, paneId);
        const nextSniOnFocus = snapInDisplays.find(snapIn => snapIn.activateTab === true && snapIn.showTab === true);
        if (!isNullOrUndefined(nextSniOnFocus)) {
          paneStore.selectSnapIn(nextSniOnFocus!.snapinId);
        } else {
          const previousSelectedGetsHidden = snapInDisplays.find(snapIn => snapIn.showTab === false && paneStore.selectedSnapInIdValue === snapIn.snapinId);
          // in case no SnapinDisplay will be the active tab and
          // the previous selected one gets hidden. select the first snapin by default.
          if (previousSelectedGetsHidden) {
            paneStore.selectSnapIn(this.currentState.getFirstTabVisibleInPane(paneStore));
          }
        }
      });

      return this.navigateToCurrentState();
    } else {
      return of(false);
    }
  }

  public startNavigateDefaultUrl(msgBroker: IHfwMessage): Observable<boolean> {
    const workAreaId = this.getFirstWorkAreaFrame()!.id;

    this.currentState.changeWorkAreaFrame(workAreaId);

    const frame: FrameStore | null = this.currentState.getFrameStoreViaId(workAreaId);

    if (frame) {
      return this.checkPossibleSelectionBeforeSwitch(frame, msgBroker).pipe(
        tap((res: boolean) => this.hfwTrace.debug(TraceModules.state, 'checkPossibleSelectionBeforeSwitch(%s) completed. result: %s', frame!.id, res)),
        concatMap(() => this.navigateToCurrentState()),
        tap((succeeds: boolean) => {
          if (succeeds) {
            frame.hasBeenNavigatedOnce = true;
            this.errorManagerService.activateBrowserSizeDetection();
            this.activateBrowserSizeDetection();
          }
        })
      );
    } else {
      return of(false);
    }
  }

  public getCurrentPaneStores(): PaneStore[] {
    const panes: PaneStore[] = [];
    const frame: FrameStore | null = this.currentState.getFrameStoreViaId(this.currentState.activeWorkAreaIdValue);
    if (frame?.selectedLayoutIdValue) {
      const paneIds: string[] = frame.paneIdsPerLayout.get(frame.selectedLayoutIdValue)!;
      paneIds.forEach(s => panes.push(this.currentState.getPaneStoreViaIds(this.currentState.activeWorkAreaIdValue, s)));
    }
    return panes;
  }

  public getCurrentLayoutId(frameId: string): Observable<string> {
    const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
    if (frame != null) {
      return frame.selectedLayoutId;
    }
    return of('');
  }

  public getCurrentMode(): Observable<ModeData | null> {
    return this.currentState.selectedMode;
  }

  public lockUnlockLayout(frameId: string): void {
    const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
    if (frame != null) {
      frame.lockUnlock();
    }
  }

  public getLayoutIdWhenClosed(frame: FrameStore, paneId: string): string | null {
    if (frame != null) {
      const layout: hldl.LayoutInstance | undefined = frame.frameConfig.layoutInstances.find(l => l.id === frame.selectedLayoutIdValue);
      if (layout != null) {
        const paneInstance: hldl.PaneInstance | null = this.hldlService.getPaneInstance(paneId, layout);
        if (paneInstance != null) {
          return paneInstance.whenClosed;
        }
      }
    }
    return null;
  }

  public isLogOutCalling(): boolean {
    return this._isLogOutCalling;
  }

  public triggerLogout(skipUnsavedData: boolean, isInactivityLogout: boolean): void {
    this._isLogOutCalling = true;
    if (skipUnsavedData && skipUnsavedData === true) {
      this.performLogout(isInactivityLogout);
    } else {
      // check unsaved data
      const paneStores: PaneStore[] = this.getCurrentPaneStores();
      this.checkUnsaved(paneStores, UnsavedDataReason.LogOut).subscribe((res: boolean) => {
        this.hfwTrace.debug(TraceModules.guards, 'checkUnsaved for all active snapins returns: %s ', res);
        if (res === true) {
          this.performLogout(isInactivityLogout);
        } else {
          this._isLogOutCalling = false;
        }
      });
    }
  }

  public triggerUnsavedDataCheckForLogout(): Observable<boolean> {
    this._isLogOutCalling = true;
    const paneStores: PaneStore[] = this.getCurrentPaneStores();
    return this.checkUnsaved(paneStores, UnsavedDataReason.LogOut).pipe(tap(() => this._isLogOutCalling = false));
  }

  public canChangeUserRoles(): Observable<boolean> {
    // Chek if a role change can be applied considering the availability of unsaved data.
    const paneStores: PaneStore[] = this.getCurrentPaneStores();
    return this.checkUnsaved(paneStores, UnsavedDataReason.NewSelection);
  }

  public selectFirstAvailableLayoutForPane(paneFullId: FullPaneId): void {
    const frame: FrameStore | null = this.currentState.getFrameStoreViaId(paneFullId.frameId);
    if (frame != null) {
      const newLayout: hldl.LayoutInstance | undefined =
      frame.availableLayoutsValue.find(l => this.currentState.paneIsInLayout(frame, paneFullId.paneId, l.id));
      if (newLayout) {
        const favoriteLayouts = LayoutManagement.calculateNextFavoriteLayoutPerRange(frame, newLayout.id);
        frame.selectLayout(newLayout.id);
        this.layoutSelected.next({
          frameId: frame.id,
          viewId: frame.selectedViewIdValue,
          layoutId: newLayout.id,
          favoriteLayouts });
      }
    }
  }

  public onResize(): void {
    this.updateAvailableLayouts(false);
  }

  public checkUnsaved(targetPanes: PaneStore[], reason: UnsavedDataReason): Observable<boolean> {
    if (targetPanes != null) {
      const snapinsToBeChecked: { id: string; instance: SnapInBase }[] = [];
      let sniList = '';
      this.getCurrentPaneStores();
      this.getCurrentPaneStores().concat(targetPanes).forEach((paneStore: PaneStore) => {
        if (this.currentState.isPaneVisibleInCurrentLayout(paneStore.fullPaneId) &&
          paneStore.selectedSnapInIdValue != null) {
          sniList += `${paneStore.fullPaneId.frameId}.${paneStore.fullPaneId.paneId}.${paneStore.selectedSnapInIdValue}\n`;
          const fullId: FullSnapInId = new FullSnapInId(paneStore.fullPaneId.frameId, paneStore.selectedSnapInIdValue);
          const snapinCmp: SnapInBase = this.snapinInstances.getSnapInBase(fullId);
          if (snapinCmp !== undefined && (typeof (snapinCmp.onUnsavedDataCheck) === 'function')) {
            const proto: any = Object.getPrototypeOf(snapinCmp);
            const ownProp: any = proto.hasOwnProperty('onUnsavedDataCheck');
            if (ownProp && !snapinsToBeChecked.find(item => item.id === fullId.fullId())) {
              snapinsToBeChecked.push({ id: fullId.fullId(), instance: snapinCmp });
            }
          }
        }
      });

      this.hfwTrace.info(TraceModules.state, 'Check if some of following snapins needs to store unsaved data:\n%s', sniList);
      if (snapinsToBeChecked.length >= 1) {
        const unsavedDataHandler: UnsavedDataHandler = new UnsavedDataHandler(UnsavedDataReason[reason], reason, snapinsToBeChecked, this.hfwTrace);
        return unsavedDataHandler.chekUnsavedDataForAllSnapins();
      } else {
        this.hfwTrace.info(TraceModules.state, 'No snapins implements onUnsavedDataCheck().');
        return of(true);
      }
    } else {
      return of(true);
    }
  }

  // returns the pane which won't survive if switching to the specified layout.
  public getPaneWontSurvive(frameId: string, layoutId: string): PaneStore[] {
    const killedPane: PaneStore[] = [];
    const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);

    const futureLayoutPaneIds: string[] = frame.paneIdsPerLayout.get(layoutId)!;
    if (isNullOrUndefined(futureLayoutPaneIds)) {
      this.hfwTrace.error(TraceModules.state, 'futureLAyoutPanesIds undefined. frameId: %s, layout: %s, selectedLAyout: %s',
        frameId, layoutId, frame.selectedLayoutIdValue);
    }
    const currentLayoutPaneIds: string[] = frame.paneIdsPerLayout.get(frame.selectedLayoutIdValue)!;
    const paneIdsToBeChecked: string[] | null = currentLayoutPaneIds.filter(l => !futureLayoutPaneIds.includes(l));
    if (paneIdsToBeChecked != null && paneIdsToBeChecked?.length > 0) {
      const futureSelectedSnapinIds: string[] = [];
      futureLayoutPaneIds!.forEach(paneId => {
        const paneStore: PaneStore = this.currentState.getPaneStoreViaIds(frameId, paneId);
        if (paneStore.selectedSnapInIdValue != null) {
          futureSelectedSnapinIds.push(paneStore.selectedSnapInIdValue);
        }
      });

      paneIdsToBeChecked.forEach(paneId => {
        const paneStore: PaneStore = this.currentState.getPaneStoreViaIds(frameId, paneId);
        if (paneStore.selectedSnapInIdValue != null && !futureSelectedSnapinIds.includes(paneStore.selectedSnapInIdValue)) {
          killedPane.push(paneStore);
        }
      });
    }
    return killedPane;
  }

  public onNewSelectionQParamDetected(change: QParamChange): void {
    this.qParamChangeDetected.next(change)!;
  }

  public selectViewAndLayoutAndSaveUserSettings(frameId: string, layoutId: string | null, viewId: string): void {
    if (frameId != null && layoutId != null) {
      const frameStore: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
      frameStore.selectView(viewId);
      frameStore.selectPreferredSnapIn(viewId);
      this.settings.saveSelectedViewSettings(frameId, viewId).subscribe((res: boolean) => {
        if (res && frameStore != null && layoutId !== frameStore.selectedLayoutIdValue) {
          const layoutIndex: number = frameStore.availableLayoutsValue.findIndex(l => l.id === layoutId);
          if (layoutIndex >= 0) {
            frameStore.selectLayout(layoutId);
            if (this.settings.isProvided) {
              frameStore.favoriteLayoutsPerRange = LayoutManagement.calculateNextFavoriteLayoutPerRange(frameStore, layoutId);
              const favoriteLayouts = frameStore.favoriteLayoutsPerRange;
              this.layoutSelected.next({ frameId, viewId, layoutId, favoriteLayouts });
            }
          }
        }
      });
    }
  }

  public cleanTargetSnapinsState(targetSnapIns: Map<string, SnapInStore>): void {
    this.hfwTrace.debug(TraceModules.state, 'cleanTargetSnapinsState() method enter.');
    if (targetSnapIns != null) {
      let msgString = 'Cleaning up snapins states due incoming selection for the following snapins...\n';
      targetSnapIns.forEach((s: SnapInStore, key) => {
        if (s.storageService != null) {
          msgString += key + '\n';
          s.storageService.clearState(s.fullSnapInId);
        } else {
          msgString += key + ': storage service not provided.\n';
        }
      });
      this.hfwTrace.info(TraceModules.state, msgString);
    }
  }

  public resetFrameSettingsPerSize(frameId: string): Observable<boolean> {
    const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
    if (!isNullOrUndefined(frame)) {
      return this.restoreDefaultLayoutSettings(frame!);
    }
    return of(false);
  }

  public getIPreselectionService(typeId: string): IPreselectionService {
    let serv: IPreselectionService | null = null;
    if (this.iPreselectionServices != null) {
      serv = this.iPreselectionServices.find(myServ => myServ.typeId === typeId)!;
    }
    return serv ?? null!;
    // return (serv != null) ? serv : { typeId: '' } as IPreselectionService;

  }

  public getIStorageService(typeId: string): IStorageService {
    let serv: IStorageService | null = null;
    if (!isNullOrUndefined(this.iStorageServices) && this.iStorageServices.length > 0) {
      serv = this.iStorageServices.find(myServ => myServ.typeId === typeId)!;
    }
    // return (serv != null) ? serv : { typeId: '' } as IStorageService;
    return serv ?? null!;

  }

  public getIQParamService(typeId: string): IQParamService {
    let serv: IQParamService | null = null;
    if (!isNullOrUndefined(this.iQParamServices) && this.iQParamServices.length > 0) {
      serv = this.iQParamServices.find((myServ: IQParamService) => myServ.typeId === typeId)!;
    }
    return serv ?? null!;
  }

  public getUrlTreeOfCurrentState(skipQParam = false, specificState?: HfwState): UrlTree {
    const state = (specificState) ? specificState : this.currentState;
    return this.routingHelper.getUrlFromState(state, undefined, skipQParam);
  }

  public updatePaneDisplayability(frame: FrameStore): void {
    frame.paneMap.forEach((pane, key) => {
      const isDisplayable: boolean = frame.availableLayoutsValue.some(l => this.currentState.paneIsInLayout(frame, key, l.id) === true);
      pane.setIsDisplayable(isDisplayable);
    });
  }

  public fullScreenSnapin(location: FullPaneId, fullScreen: boolean): void {
    const paneStore: PaneStore | null = this.currentState.getPaneStore(location);
    if (paneStore != null) {
      paneStore.setFullScreen(fullScreen);
    }
  }

  public getPrimaryBarConfig(): hldl.PrimaryBarConfig {
    if (!isNullOrUndefined(this._hfwInstance)) {
      return this._hfwInstance.primaryBarConfig;
    }
    return null!;
  }

  public getVerticalBarConfig(): hldl.VerticalBarConfig[] {
    if (!isNullOrUndefined(this._hfwInstance)) {
      return this._hfwInstance.verticalBarConfigs;
    }
    return null!;
  }

  public selectView(frameId: string, viewId: string): Observable<boolean> {
    const frameStore = this.currentState.getFrameStoreViaId(frameId);
    if (frameStore && !isNullOrUndefined(viewId)) {
      const view = frameStore.frameConfig.views.find(v => v.id === viewId);
      if (view) {
        frameStore.updateAvailableLayouts(viewId);
        // check if a change of layout is needed
        const differentLayout: { isNumberOfLayoutChanged: boolean; newLayoutId: string | null }
            = LayoutManagement.checkFrameNeedsNewLayoutAfterViewChange(frameStore, viewId);
        if (!isNullOrUndefined(differentLayout.newLayoutId)) {
          this.updatePaneDisplayability(frameStore);
          return this.navigateToFrameViewLayout(frameId, viewId, differentLayout.newLayoutId);
        } else {
          return of(true);
        }
      }
    }
    return of(false);
  }

  private neverDestroyCheck(): void {
    // check for neverDestroy parameter for each snapin instance
    this._hfwInstance.hfwFrames.forEach(frame => {
      frame.snapInInstances.forEach(inst => {
        if (!isNullOrUndefined(inst.neverDestroy) && inst.neverDestroy == true) {
          const snapInId: string = inst.snapInId;
          (this.routeReuseStrategy as ReuseStrategyService).addSnapinToReuse(new FullSnapInId(frame.id, snapInId));
        }
      });
    });
  }

  private completeFramesUpdate(frames: string[], removedFrames: string[], addedFrameStores: FrameStore[]): void {
    this.removeFramesDinamically(frames, removedFrames);
    this.selectLayoutsAndSnapins(addedFrameStores);
    this.loadSnapInsResources(this._hfwInstance);
  }

  private addFramesDinamically(framesToCreate: string[]): FrameStore[] {
    let framesStores: FrameStore[];
    const addedFrames: string[] = framesToCreate.filter(f => this._hfwInstance.hfwFrames.find(frame => frame.id === f) === undefined);
    if (!isNullOrUndefined(addedFrames) && addedFrames.length > 0) {
      const fullHldlConfig = JSON.parse(JSON.stringify(this.hldlService.getHfwInstanceValue()));
      framesStores = StateDataStructureCreator.addFramesToDataStructure(addedFrames, fullHldlConfig, this._hfwInstance, this, framesToCreate);
      framesStores.forEach(frame => {
        this.currentState.frameMap.set(frame.id, frame);
      });
    }
    return framesStores!;
  }

  private removeFramesDinamically(framesToCreate: string[], removed: string[]): void {
    StateDataStructureCreator.removeFrameFromDataStructure(removed, this._hfwInstance, framesToCreate);
    removed?.forEach(frameId => {
      this.currentState.frameMap.get(frameId)!.dispose();
      this.currentState.frameMap.delete(frameId);
    });
  }

  private calculateSnapinDisplayPerPane(snapins: SnapinDisplay[]): Map<string, SnapinDisplay[]> {
    const res = new Map<string, SnapinDisplay[]>();

    snapins.forEach(s => {
      const snapinStore: SnapInStore = this.currentState.getSnapInStoreViaIds(s.frameId, s.snapinId)!;

      if (!isNullOrUndefined(snapinStore)) {
        snapinStore.hostingPanesIds.forEach((paneId: string) => {
          if (res.has(paneId)) {
            res.get(paneId)!.push(s);
          } else {
            res.set(paneId, [s]);
          }
        });
      } else {
        this.hfwTrace.warn(TraceModules.state, 'calculateSnapinDisplayPerPane: Snapin instance of id %s.%s does not exist.', s.frameId, s.snapinId);
      }
    });
    return res;
  }

  private selectLayoutsAndSnapins(specificFrames?: FrameStore[]): void {
    const frames = (!specificFrames) ? this.currentState.getFramesStore() : specificFrames;
    if (!isNullOrUndefined(frames)) {
      frames?.forEach(f => {
        if (f) {
          this.selectFirstView(f);

          const firstLayoutId: string = LayoutManagement.getMostFittingLayoutId(f.availableLayoutsValue);
          f.selectLayout(firstLayoutId);
          f.paneMap.forEach(pane => {
            this.selectFirstSnapin(f.frameConfig, pane);
          });
        }
      });
    }
  }

  private selectFirstView(f: FrameStore): void {
    if (!isNullOrUndefined(f.frameConfig.views) && f.frameConfig.views.length > 0) {
      f.selectView(f.frameConfig.views[0].id);
      f.updateAvailableLayouts(); // update available layout basing on the selected view.
    }
  }

  private restoreDefaultLayoutSettings(frame: FrameStore): Observable<boolean> {
    const layoutToApply = LayoutManagement.getMostFittingLayoutId(frame.availableLayoutsValue);
    if (frame.selectedLayoutIdValue !== layoutToApply && frame.selectedViewIdValue) {
      return this.navigateToFrameViewLayout(frame.id, frame.selectedViewIdValue, layoutToApply).pipe(
        tap(res => {
          if (res) {
            this.restoreDefaultSplitterSettings(frame);
          }
        })
      );
    } else {
      this.restoreDefaultSplitterSettings(frame);
      return of(true);
    }
  }

  private restoreDefaultSplitterSettings(frame: FrameStore): void {
    this.settings.deleteSplitterSettings(frame.id);
    frame.splitterStoreMap.forEach((splitterStore, splitterId) => {
      this.hfwTrace.info(TraceModules.settings, 'applying default settings for splitter : %s', splitterId);
      splitterStore.resetConfig();
    });
  }

  private navigateDeeplink(frameStore: FrameStore): void {
    this.hfwTrace.info(TraceModules.state, 'NAVIGATE: navigateToDeeplink \n appStatus: %s \n url: %s', this.appStatus, this.redirectUrl);
    this.router.navigateByUrl(this.redirectUrl)
      .then(() => {
        this.hfwTrace.debug(TraceModules.state, 'setting running from navigateToDeeplink');
        this.appStatus = AppStatus.Running;
        frameStore.hasBeenNavigatedOnce = true;
        this.activateBrowserSizeDetection();
        this.redirectUrl = null!;
      });
  }

  private navigateFrame(frame: FrameStore): Observable<boolean> {
    const mainUrlTree: UrlTree = this.routingHelper.getUrlFromState(this.currentState, frame.id);
    const navigateHandler: NavigateHandler = new NavigateHandler('switchToNextFrame', mainUrlTree, this.appStatus, this.router, this.hfwTrace);
    return navigateHandler.navigate().pipe(tap((res: boolean) => {
      if (res === true) {
        this.updateStateAfterFrameChange(frame.id);
      }
    }));
  }

  private navigateToCurrentState(): Observable<boolean> {
    const mainUrlTree: UrlTree = this.getUrlTreeOfCurrentState();

    const mainUrlTreePlain: string = mainUrlTree.toString();
    if (this.router.url !== mainUrlTreePlain) {
      this.hfwTrace.info(TraceModules.state, 'NAVIGATE: navigateToCurrentState \n appStatus: %s \n url: %s', this.appStatus, mainUrlTreePlain);

      const navigateHandler: NavigateHandler = new NavigateHandler('navigateToCurrentState', mainUrlTree, this.appStatus, this.router, this.hfwTrace);
      return navigateHandler.navigate().pipe(tap((res: boolean) => {
        if (res === true) {
          this.hfwTrace.debug(TraceModules.state, 'setting running from navigateToCurrentState.');
        } else {
          this.hfwTrace.error(TraceModules.state, 'navigateToCurrentState error.');
        }
        this.appStatus = AppStatus.Running;
      }));
    } else {
      this.hfwTrace.info(TraceModules.state,
        'NAVIGATE: navigateToCurrentState skipped. Url equals to the previous one.\n appStatus: %s \n url: %s', this.appStatus, mainUrlTreePlain);
      this.appStatus = AppStatus.Running;
      return of(true);
    }
  }

  private handleErrorOnNavigateLayout(errorMessage: any): Observable<never> {
    (this.routeReuseStrategy as ReuseStrategyService).stopLayoutChangeRouterReuse();
    this.hfwTrace.error(TraceModules.state, 'Error navigating to the current URL. \n' + errorMessage);
    return throwError(errorMessage);
  }

  private checkPossibleSelectionBeforeSwitch(frame: FrameStore, msgBroker: IHfwMessage, message?: MessageParameters): Observable<boolean> {
    const selectionQParamStore: QParamStore | null = frame.qParamStore;
    if (selectionQParamStore?.qParamService) {
      if (message) {
        return this.sendQParamServiceSelection(frame, selectionQParamStore, msgBroker, message, false);
      } else {
        return this.checkAutomaticFirstSelection(frame, selectionQParamStore, msgBroker);
      }
    } else {
      return of(true);
    }
  }

  private checkAutomaticFirstSelection(frame: FrameStore, selectionQParamStore: QParamStore, msgBroker: IHfwMessage): Observable<boolean> {
    if (!frame.hasBeenNavigatedOnce) {
      const automaticSelectionHandler: AutomaticFirstSelectionHandler = new AutomaticFirstSelectionHandler(
        `${frame.id}.${selectionQParamStore.config.id}`,
        selectionQParamStore,
        msgBroker as SnapinMessageBroker,
        this.hfwTrace);
      return automaticSelectionHandler.sendAutomaticFirstSelection();
    } else {
      return of(true);
    }
  }

  private performSwitchFrame(frameId: string, frame: FrameStore, msgBroker: IHfwMessage, message: MessageParameters | undefined): Observable<boolean> {
    const replySubject: Subject<boolean> = new Subject<boolean>();

    this.hfwTrace.debug(TraceModules.state,
      'setting switchingFrame from switchToNextFrame');
    this.currentState.appStatus = AppStatus.SwitchingFrame;
    this.currentState.switchingFrameId = frameId;
    this.checkPossibleSelectionBeforeSwitch(frame, msgBroker, message).subscribe((res: boolean) => {
      this.hfwTrace.debug(TraceModules.state, 'checkPossibleSelectionBeforeSwitch(%s) completed. result: %s', frame.id, res);
      // check if a different layout is needed
      const differentLayout: { isNumberOfLayoutChanged: boolean; newLayoutId: string | null }
        = LayoutManagement.checkFrameNeedsNewLayout(frame, this.hfwTrace);
      if (differentLayout.newLayoutId == null) {
        this.navigateFrame(frame).subscribe((navRes: boolean) => {
          this.hfwTrace.debug(TraceModules.state, 'setting running from switchToNextFrame');
          this.currentState.appStatus = AppStatus.Running;
          this.currentState.switchingFrameId = null;
          if (navRes === true) {
            frame.hasBeenNavigatedOnce = true;
          }
          replySubject.next(navRes);
        });
      } else {
        this.updatePaneDisplayability(frame);
        if (frame.selectedViewIdValue) {
          this.navigateToFrameViewLayout(frameId, frame.selectedViewIdValue, differentLayout.newLayoutId).subscribe((navRes: boolean) => {
            this.hfwTrace.debug(TraceModules.state, 'setting running from switchToNextFrame');
            this.currentState.appStatus = AppStatus.Running;
            if (navRes === true) {
              frame.hasBeenNavigatedOnce = true;
            }
            replySubject.next(navRes);
          });
        }
      }
    });
    return replySubject.asObservable();
  }

  private spreadMessageAndNavigate(frame: FrameStore, msgBroker: IHfwMessage, message: MessageParameters | undefined): Observable<boolean> {
    const selectionQParamStore: QParamStore | null = frame.qParamStore;
    if (selectionQParamStore?.qParamService) {
      const replySubject: Subject<boolean> = new Subject<boolean>();
      this.sendQParamServiceSelection(frame, selectionQParamStore, msgBroker, message!, false).subscribe((res: boolean) => {
        this.hfwTrace.debug(TraceModules.state, 'sendQParamServiceSelection(%s) completed. result: %s', frame.id, res);
        this.navigateFrame(frame).subscribe((navRes: boolean) => {
          replySubject.next(navRes);
        });
      });
      return replySubject.asObservable();
    } else {
      return of(false);
    }
  }

  private sendQParamServiceSelection(frame: FrameStore, selectionQParamStore: QParamStore,
    msgBroker: IHfwMessage, message: MessageParameters, avoidSelectSnapInOnFocus: boolean): Observable<boolean> {
    const typeId = selectionQParamStore.qParamService?.typeId;
    if (!isNullOrUndefined(typeId) && selectionQParamStore.config.channels.length > 0) {
      const fullId: FullQParamId = new FullQParamId(frame.id, typeId!, selectionQParamStore.config.primaryChannelId);
      return (msgBroker as SnapinMessageBroker).sendMessageFromQParamService(fullId, message.types, message.messageBody, true,
        message.qParam, false, null, avoidSelectSnapInOnFocus);
    } else {
      return of(true);
    }
  }

  private checkAutomaticFirstSelectionOnDeeplink(msgBroker: IHfwMessage, selectionQParamStores: QParamStore[], params: Params[]): Observable<boolean> {
    if (selectionQParamStores.length > 0) {
      const observables: Observable<boolean>[] = [];
      selectionQParamStores.forEach((selectionQParam, index) => {
        for (const property in params[index]) {
          if (params[index].hasOwnProperty(property)) {
            const automaticSelectionHandler: AutomaticFirstSelectionHandler = new AutomaticFirstSelectionHandler(property,
              selectionQParam,
              msgBroker as SnapinMessageBroker,
              this.hfwTrace);
            observables.push(automaticSelectionHandler.sendDeeplinkAutomaticFirstSelection(property, params[index][property]));
          }
        }
      });
      return concat(...observables);
    } else {
      return of(true);
    }
  }

  private checkModeFromDeeplink(params: Params): void {
    const modeKey = 'mode';
    if (params[modeKey] != null) {
      const relatedValueKey = 'relatedValue';
      const modeData: ModeData = { id: params[modeKey], relatedValue: params[relatedValueKey] };
      this.updateMode(modeData);
    }
  }

  private navigateToRootFromScratch(): void {
    // Clean OIDC Authentication, only if the station is not "Personally Used"
    const pathName: string = this.platformLocation.pathname.substring(0, (this.platformLocation.pathname.indexOf('main/page/')));
    let basUrl: string = (this.platformLocation as any)._location.origin + pathName;
    if (this.cookieService.check(UserInfoStorage.PersonallyUsed)) {
      const personallyUsed = this.cookieService.get(UserInfoStorage.PersonallyUsed);
      if (personallyUsed === 'false') {
        if (this.cookieService.check(UserInfoStorage.OpenIdLogoutUriKey)) {
          basUrl = this.cookieService.get(UserInfoStorage.OpenIdLogoutUriKey)!;
        }
      }
    }
    const domain = (this.platformLocation as any)._location?.hostname;
    this.cookieService.delete(UserInfoStorage.OpenIdLogoutUriKey, pathName, domain);
    this.cookieService.delete(UserInfoStorage.PersonallyUsed, pathName, domain);
    window.open(basUrl, '_self', '');
  }

  /**
   * Fills the interal structures deserializing the json object recieved as input.
   */
  private createDataStructure(hfwInstance: hldl.HfwInstance, framesToCreate?: string[]): void {
    const dataStructure: StateDataStructure = StateDataStructureCreator.createDataStructure(hfwInstance, this, framesToCreate);
    this._hfwInstance = dataStructure.hfwInstance;
    this.currentState.frameMap = dataStructure.frameMap;
    // ODO here set the initial mode qParam
    // for now default it is hardcoded, but it shouldn't be there (i.e. investigative deeplink).
    const defalutMode = hfwInstance.modes.find(m => m.isDefaultMode === true);
    if (defalutMode) {
      this.currentState.changeSelectedMode({ id: defalutMode.id, relatedValue: null });
      this.currentState.setModeQParam(defalutMode.id);
    }
  }

  private loadSnapInsResources(hfwInstance: hldl.HfwInstance): void {
    if (hfwInstance?.snapInTypes != null) {
      this.appContext.defaultCulture.subscribe((defaultCulture: string | null) => {
        if (defaultCulture != null) {
          this.loadSnapInsResourceFile(hfwInstance.snapInTypes, defaultCulture);
        }
      });
      this.appContext.userCulture.subscribe((userCulture: string | null) => {
        if (userCulture != null) {
          this.loadSnapInsResourceFile(hfwInstance.snapInTypes, userCulture);
        }
      });
    }
  }

  private selectFirstSnapin(frame: hldl.HfwFrame, paneStore: PaneStore): void {
    if (!paneStore.paneConfig?.canStartWithoutSelectedSnapin) {
      let firstSelectedSnapInId!: string;
      if (this.redirectUrl != null && this.redirectUrl !== '/' && !this.redirectUrl.startsWith('/?code=')) {
        firstSelectedSnapInId = this.routingHelper.getSelectedSnapInId(this.redirectUrl, frame, paneStore.paneConfig!);
      }
      if (firstSelectedSnapInId == null) {
        firstSelectedSnapInId = this.hldlService.getFirstSnapInId(paneStore.paneConfig!);
      }
      paneStore.selectSnapIn(firstSelectedSnapInId);
    }
  }

  private checkDeepLinkUrl(deepLinkUrl: string): string {
    let result: string = deepLinkUrl;

    const workAreaId: string = RoutingUtilities.getWorkAreaFrameId(this.router, this.redirectUrl);
    const workAreaLayoutId: string = RoutingUtilities.getWorkAreaFrameLayoutId(this.router, this.redirectUrl);

    const workAreaFrame: hldl.HfwFrame | null = this.hldlService.getFrameById(workAreaId);

    if (workAreaFrame?.layoutInstances.findIndex(l => l.id === workAreaLayoutId) === -1 && this.getFirstWorkAreaFrame() != null) {
      this.hfwTrace.info(TraceModules.state, 'The layoutId %s of the working area frame is not supported on the current device.' +
        ' The default layout will be used.', workAreaLayoutId);

      const newWorkAreaId = this.getFirstWorkAreaFrame()!.id;
      this.currentState.changeWorkAreaFrame(newWorkAreaId);

      const originalUrlTree: UrlTree = this.router.parseUrl(deepLinkUrl);

      const defaultUrlTree: UrlTree = this.getUrlTreeOfCurrentState(true);

      defaultUrlTree.queryParams = originalUrlTree.queryParams;

      result = this.router.serializeUrl(defaultUrlTree);
    }

    return result;
  }

  private getFirstWorkAreaFrame(framesToExclude?: string[]): hldl.HfwFrame | null {
    // check starting frame.
    if (!isNullOrUndefined(this._hfwInstance.startingFrameId)) {
      const starting = this._hfwInstance.hfwFrames.find(f => f.id === this._hfwInstance.startingFrameId);
      if (starting && (starting.docked === null || starting.docked !== hldl.Docked.top)) {
        if (framesToExclude) {
          if (!framesToExclude.includes(starting.id)) {
            return starting;
          }
        } else {
          return starting;
        }
      }
    }
    // pick up the first one.
    let result: hldl.HfwFrame | null = null;
    for (const frame of this._hfwInstance.hfwFrames) {
      if (frame.docked === null || frame.docked !== hldl.Docked.top) {
        if (framesToExclude) {
          if (!framesToExclude.includes(frame.id)) {
            result = frame;
          }
        } else {
          result = frame;
        }
      }
    }
    return result;
  }

  private activateBrowserSizeDetection(): void {
    this.updateAvailableLayouts(true);

    this.ngZone.runOutsideAngular(() => {
      this.windowResizeBinding = this.onResize.bind(this);
      window.addEventListener('resize', this.windowResizeBinding, { passive: false, capture: true });
    });
  }

  private updateAvailableLayouts(isCalledAtStartup: boolean): void {
    const workAreaId = this.currentState.activeWorkAreaIdValue;
    const frame: FrameStore | null = this.currentState.getFrameStoreViaId(workAreaId);
    if (isCalledAtStartup) {
      frame.updateAvailableLayouts();
      this.updatePaneDisplayability(frame);
    } else {
      const checkLayout: { isNumberOfLayoutChanged: boolean; newLayoutId: string | null } = LayoutManagement.checkFrameNeedsNewLayout(frame, this.hfwTrace);
      if (checkLayout.newLayoutId != null) {
        this.updatePaneDisplayability(frame);
        this.ngZone.run(() => {
          if (frame.selectedViewIdValue) {
            this.layoutChangeWithUnsavedDataCheck(workAreaId, frame.selectedViewIdValue, checkLayout.newLayoutId);
          }
        });
      } else {
        if (checkLayout.isNumberOfLayoutChanged) {
          this.updatePaneDisplayability(frame);
        }
      }
    }
  }

  private layoutChangeWithUnsavedDataCheck(frameId: string, viewId: string, layoutId: string | null): void {
    this.navigateToFrameViewLayout(frameId, viewId, layoutId).subscribe((res: boolean) => {
      this.hfwTrace.debug(TraceModules.state, 'navigateToFrameViewLayout completes. result: %s', res);
    });
  }

  private loadSnapInsResourceFile(snapInTypes: hldl.SnapInType[], currentCulture: string): void {
    snapInTypes.forEach((snapInType: hldl.SnapInType) => {

      if (snapInType.resourceFolder != null) {
        const loader: TranslateHttpLoader = new TranslateHttpLoader(this.httpClient, snapInType.resourceFolder, '.json');
        let pending = true;
        this.hfwTrace.debug(TraceModules.state, 'pending seems not used. %s', pending);

        const loadingTranslations: Observable<any> = loader.getTranslation(currentCulture).pipe(share());

        loadingTranslations.pipe(take(1)).subscribe((res: any) => {
          if (res != null) {
            const indexRes: { [key: string]: any } = res;
            this.currentState.frameMap.forEach(frameStore => {
              let sniStores: SnapInStore[] = Array.from(frameStore.snapInInstanceMap.values());
              sniStores = sniStores.filter(sni => (sni.typeConfig.typeId === snapInType.typeId));
              if (sniStores != null) {
                sniStores.forEach((sniStore: SnapInStore) => {
                  sniStore.tabTitle = indexRes[sniStore.tabTitleResourceId];
                });
              }
            });
          }
          pending = false;
        }, (erroe: any) => {
          pending = false;
          this.hfwTrace.debug(TraceModules.state, 'LoadSnapInsResourceFile when load the language  %s we received error :  %s', currentCulture, erroe);
        }
        );
      }
    });
  }

  private evaluateSnapinsToReuseOnLayoutSwitch(currentFrameId: string, futureLayoutId: string | null, changingViewId?: string): FullSnapInId[] | undefined {
    this.hfwTrace.info(TraceModules.reuseSnapin,
      `evaluateSnapinsToReuseOnLayoutSwitch(): evaluate snapins to reuse, frameId: ${currentFrameId}; layoutId: ${futureLayoutId}`);

    // Important: The method handles layout changes within frames only!
    // Intentionally, as frame switches must have a different reuse strategy.
    const currentFrame: FrameStore | null = this.currentState.getFrameStoreViaId(currentFrameId);
    const currentPanes: string[] | undefined = currentFrame!.paneIdsPerLayout.get(currentFrame!.selectedLayoutIdValue);
    const currentSnapinsPerPane: Map<string, { snapinId: string; handled: boolean }> = new Map<string, { snapinId: string; handled: boolean }>();
    currentPanes!.forEach(pane => {
      const paneStore: PaneStore = this.currentState.getPaneStoreViaIds(currentFrameId, pane);
      currentSnapinsPerPane.set(pane, { snapinId: paneStore.selectedSnapInIdValue, handled: false });
    });
    const futurePanes: string[] | undefined = currentFrame.paneIdsPerLayout.get(futureLayoutId!);
    if ((futurePanes == null) || (futurePanes.length === 0)) {
      this.hfwTrace.warn(TraceModules.state, `The requested layout does not exist on frame: ${currentFrameId}; layout: ${futureLayoutId}`);
      return null!;
    }
    const futurePanesPerSnapin: Map<string, { paneId: string; occupied: boolean }[]> = new Map<string, { paneId: string; occupied: boolean }[]>();
    futurePanes.forEach(pane => {
      const paneStore: PaneStore = this.currentState.getPaneStoreViaIds(currentFrameId, pane);
      if (futurePanesPerSnapin.has(paneStore.selectedSnapInIdValue) === false) {
        futurePanesPerSnapin.set(paneStore.selectedSnapInIdValue, [{ paneId: pane, occupied: false }]);
      } else {
        futurePanesPerSnapin.get(paneStore.selectedSnapInIdValue)!.push({ paneId: pane, occupied: false });
      }
    });

    const currentView = this.changingLayoutFrameStore?.frameConfig?.views.find(view => view.id === this.changingLayoutFrameStore?.selectedViewIdValue);
    const nextView = this.changingLayoutFrameStore?.frameConfig?.views.find(view => view.id === changingViewId);

    if (currentView && nextView && nextView.preferredSnapin) {
      // check if preferredSnapin.pane in the next view, exists in the current view
      if (currentPanes?.includes(nextView.preferredSnapin.paneId)) {
        const currentMatchingPaneStore = this.currentState.getPaneStoreViaIds(currentFrameId, nextView.preferredSnapin.paneId);
        if (currentMatchingPaneStore.selectedSnapInIdValue !== nextView.preferredSnapin.snapinId) {
          // currently selected snapin should not be reused in the next view
          futurePanesPerSnapin.delete(currentMatchingPaneStore.selectedSnapInIdValue);
        }
      }
    }

    const snapinsToReuse: FullSnapInId[] =
        ReuseStrategyLayoutChange.evaluateSnapinsToReuse(currentFrameId, currentSnapinsPerPane, futurePanesPerSnapin);
    this.doTraceForSnapinReuse(currentSnapinsPerPane, futurePanesPerSnapin, snapinsToReuse);
    this.setFuturePanes(futurePanesPerSnapin, snapinsToReuse);
    return snapinsToReuse;
  }

  private setFuturePanes(futurePanesPerSnapin: Map<string, { paneId: string; occupied: boolean }[]>, snapinsToReuse: FullSnapInId[]): void {

    snapinsToReuse.forEach(s => {
      const snapinStore = this.currentState.getSnapInStore(s);
      if (!isNullOrUndefined(snapinStore)) {
        let currentPaneId: string;
        let futurePaneId: string;
        const currentFullPaneId = this.currentState.getCurrentPaneFullId(snapinStore!.fullSnapInId);
        if (!isNullOrUndefined(currentFullPaneId)) {
          currentPaneId = currentFullPaneId.paneId;
        }
        const futurePanes = futurePanesPerSnapin.get(s.snapInId);
        if (!isNullOrUndefined(futurePanes) && futurePanes!.length > 0) {
          futurePaneId = futurePanes![0].paneId;
        }
        if (!isNullOrUndefined(currentPaneId!) && !isNullOrUndefined(futurePaneId!) && currentPaneId! !== futurePaneId!) {
          snapinStore!.futurePaneId = futurePaneId!;
        }
      }
    });
  }

  private doTraceForSnapinReuse(
    currentSnapinsPerPane: Map<string, { snapinId: string; handled: boolean }>,
    futurePanesPerSnapin: Map<string, { paneId: string; occupied: boolean }[]>,
    snapinsToReuse: FullSnapInId[]): void {

    let msg = 'Reusable snapins evaluated:\nCurrent snapins per pane:';
    currentSnapinsPerPane.forEach((snapin, paneId) => {
      msg = msg + `\nCurrent pane: ${paneId}; snapin: ${snapin.snapinId}; snapinHandled: ${snapin.handled}`;
    });
    msg = msg + `\nFuture panes per snapin:`;
    futurePanesPerSnapin.forEach((panes, snapin) => {
      msg = msg + `\nFuture snapin: ${snapin};`;
      panes.forEach(pane => {
        msg = msg + `\nFuture pane: ${pane.paneId}; paneOccupied: ${pane.occupied};`;
      });
    });
    msg = msg + `\nSnapins to reuse:`;
    snapinsToReuse.forEach(snapinToReuse => {
      msg = msg + `\nCurrent snapin: ${snapinToReuse.fullId()}`;
    });
    this.hfwTrace.info(TraceModules.reuseSnapin, msg);
  }

  private applySplitterSettings(preferences: UserFramePreferences): void {
    preferences.splitterConfiguration.forEach((settings, frameId) => {
      const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
      if (!isNullOrUndefined(frame)) {
        for (const key in settings) {
          if (settings.hasOwnProperty(key)) {
            const splitStore = frame.splitterStoreMap.get(key);
            if (!isNullOrUndefined(splitStore)) {
              const splitChanges = settings[key];
              if (!isNullOrUndefined(splitChanges) && LayoutUtilities.checkSplitterChanges(splitStore!, splitChanges)) {
                splitStore!.setSplitterChanges(splitChanges);
              } else {
                this.hfwTrace.info(TraceModules.settings, 'splitter %s preferences cannot be applied with current window size.', splitStore?.id);
              }
            }
          }
        }
      }
    });
  }

  /**
   * Applies layout settings to frame preferences, selecting appropriate layouts based on screen size.
   * @param preferences The user frame preferences containing layout configurations.
   * @param needsToApplyFavoriteLayout Flag indicating whether to apply favorite layouts.
   */
  private applyLayoutSettings(preferences: UserFramePreferences, needsToApplyFavoriteLayout: boolean): void {
    // Iterate over each frame preference to apply layout settings
    preferences.layoutConfiguration.forEach((settings, frameViewId) => {
      // Get the frame store based on frame view ID
      const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameViewId.split('.')[0]);

      // Skip if frame is null or undefined
      if (isNullOrUndefined(frame)) {
        return;
      }

      // Get the current screen size
      const size = LayoutUtilities.getScreenSize();

      // Set favorite layouts for the frame
      frame.favoriteLayoutsPerRange = settings;

      // Skip if settings are null or undefined or if favorite layouts shouldn't be applied
      if (isNullOrUndefined(settings) || !needsToApplyFavoriteLayout) {
        return;
      }

      // Select appropriate layout based on screen size
      switch (size) {
        case ScreenSize.Small:
          // Select small layout if defined
          const smallLayoutId = settings.smallLayoutId;
          if (!isNullOrUndefined(smallLayoutId)) {
            frame.selectLayout(smallLayoutId!);
          }
          break;
        case ScreenSize.Mobile:
          // Select mobile layout if mobile layout ID is defined, this is required because
          // on some mobile devices the smallLayout is selected instead of mobileLayout.
          if (!isNullOrUndefined(StateService.mobileLayoutId)) {
            frame.selectLayout(StateService.mobileLayoutId!);
          }
          break;
        default:
          // Select large layout if defined
          const largeLayoutId = settings.largeLayoutId;
          if (!isNullOrUndefined(largeLayoutId)) {
            frame.selectLayout(largeLayoutId!);
          }
      }
    });
  }

  private applyFullScreenSettings(preferences: UserFramePreferences): void {
    preferences.fullScreenStates.forEach((settings, frameId) => {
      const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
      if (!isNullOrUndefined(frame)) {
        for (const key in settings) {
          if (settings.hasOwnProperty(key)) {
            const paneStore = frame.paneMap.get(key);
            if (!isNullOrUndefined(paneStore)) {
              const fullScreenChanges = settings[key];
              if (!isNullOrUndefined(fullScreenChanges)) {
                paneStore?.setFullScreen(fullScreenChanges);
              } else {
                this.hfwTrace.info(TraceModules.settings, 'Full Screen %s preferences cannot be applied to the current pane.', paneStore?.fullPaneId);
              }
            }
          }
        }
      }
    });
  }

  private applyViewSettings(selectedViews: Map<string, string>): void {
    selectedViews.forEach((viewId, frameId) => {
      const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
      if (!isNullOrUndefined(frame)) {
        frame.selectView(viewId);
      }
    });
  }

  private applyUserSettings(preferences: UserFramePreferences, needsToApplyFavoriteLayout: boolean): void {
    this.hfwTrace.info(TraceModules.settings, 'Pushing user settings to client...');

    if (!isNullOrUndefined(preferences)) {
      this.applySplitterSettings(preferences);
      if (preferences.selectedViews && preferences.selectedViews.size > 0) {
        this.applyViewSettings(preferences.selectedViews!);
      }
      this.applyLayoutSettings(preferences, needsToApplyFavoriteLayout);
      if (!needsToApplyFavoriteLayout) {
        this.applyFullScreenSettings(preferences);
      }
    }
  }

  private performLogout(isInactivityLogout: boolean): void {
    this.authenticationService.logout(isInactivityLogout).pipe(
      timeout(2000),
      catchError(() => of(false)),
      // add DELAY to fix 2056934, give times to log off to clean up the situation
      // before a possible attempt to automatic Log On
      delay(1000))
      .subscribe((succeds: boolean) => {
        this.hfwTrace.info(TraceModules.state, `Logout completed. Result: ${succeds}.`);
        this.errorManagerService.stopBrowserSizeDetection();
        this.navigateToRootFromScratch();
      });
  }

  private receiveLogOff(value: any): void {
    if (!this.cookieService.check(UserInfoStorage.UserTokenKey) && (this.platformLocation.pathname.includes('main/page/'))) {
      this.sub.unsubscribe();
      // this logOff will come from a different flex client INSTANCE, to FORCE the closure of this Intance Too
      // since the User log on is the same, no need to force the "isInactivityLogout"
      this.errorManagerService.stopBrowserSizeDetection();
      this.navigateToRootFromScratch();
      this.hfwTrace.info(TraceModules.state, `Logout invoked by missing cookies${value}.`);
    }
  }
}
