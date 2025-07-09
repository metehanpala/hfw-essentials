/* eslint-disable @typescript-eslint/naming-convention */
import { forwardRef, Inject, Injectable, Optional } from '@angular/core';
import { Router, RouteReuseStrategy, UrlTree } from '@angular/router';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { IHfwMessage } from '../../common/interfaces/ihfwmessage';
import { IPreselectionService } from '../../common/interfaces/ipreselection.service';
import { IQParamService } from '../../common/interfaces/iqparam.service';
import { IStorageService } from '../../common/interfaces/istorage.service';
import { MessageParameters } from '../../common/interfaces/message-parameters.model';
import { QParam } from '../../common/interfaces/q-param.model';
import { UnsavedDataReason } from '../../common/unsaved-data/unsaved-data.model';
import * as hldl from '../shared/hldl/hldl-data.model';
import { HLDL_TEST_EXAMPLE } from '../shared/hldl/hldl-example-data.model';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { SnapInStore } from '../shared/stores/snapin.store';
import { TraceModules } from '../shared/trace/trace-modules';
import { AppStatus } from './app-status.model';
import { StateDataStructure, StateDataStructureCreator } from './data-structure-creation/state-data-structure-creator';
import { HfwState } from './hfw-state';
import { IState } from './istate';
import { LayoutManagement } from './layout-management/layout-management';
import { QParamChange } from './q-param-change.model';
import { QParamsHandler } from './qparams-handler';
import { RoutingHelperService } from './routing-helper.service';
export class MockPreselectionService implements IPreselectionService {

  public typeId!: string;

  public receivePreSelection(_messageTypes: string[], _messageBody: any, _fullId: FullSnapInId): Observable<boolean> {
    return of(true);
  }
}

export class MockQParamService implements IQParamService {

  public typeId!: string;

  public getMessageParameters(_paramValue: string): Observable<MessageParameters> {
    const fakeQParam: QParam = { name: 'fakeQParam', value: 'fakeQParamValue' };
    const msg: MessageParameters = { types: ['fake'], messageBody: 'messageBody', qParam: fakeQParam };
    return of(msg);
  }

  public getFirstAutomaticSelection(): Observable<MessageParameters> {
    const fakeQParam: QParam = { name: 'fakeQParam', value: 'fakeQParamValue' };
    const message: MessageParameters = { types: ['fake'], messageBody: 'messageBody', qParam: fakeQParam };
    return of(message);
  }
}

/**
 * This service provides information retrieved from the parsed hldl file.
 */
@Injectable({
  providedIn: 'root'
})
export class MockStateService implements IState {

  public redirectUrl = 'redirectUrl';

  public qParamChangeDetected: BehaviorSubject<{ snapIn: SnapInStore; value: string }> = new BehaviorSubject<{ snapIn: SnapInStore; value: string }>(null!);

  // protected _frameMap: Map<string, FrameStore>;
  public currentState: HfwState = new HfwState();

  protected _hfwInstance!: hldl.HfwInstance;

  private readonly qParamsHandler: QParamsHandler;

  private activeWorkArea: hldl.HfwFrame | null = null;

  // indicates the list of Param to preserve from the deeplink.
  // private deepLinkQueryParametersToPreserve: string[] = [];

  private changingLayoutFrameStore!: FrameStore;

  private changingLayoutId!: string;

  private _appStatus: AppStatus = AppStatus.Initializing;

  private readonly _activeWorkAreaId: BehaviorSubject<string> = new BehaviorSubject<string>(null!);

  public constructor(private readonly router: Router,
    private readonly routeReuseStrategy: RouteReuseStrategy,
    private readonly hfwTrace: TraceService,

    // eslint-disable-next-line @angular-eslint/no-forward-ref
    @Inject(forwardRef(() => RoutingHelperService)) protected routingHelper: RoutingHelperService,
    @Optional() @Inject(IPreselectionService) private readonly iPreselectionServices: IPreselectionService[],
    @Optional() @Inject(IStorageService) private readonly iStorageServices: IStorageService[],
    @Optional() @Inject(IQParamService) private readonly iQParamServices: IQParamService[]) {
    const hldlObj: any = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE));

    this.postDeserialize(hldlObj.hfwInstance.hfwFrames);
    this.createDataStructure(hldlObj.hfwInstance);
    this.selectLayoutsAndSnapins();
    this.routingHelper.pushConfiguration(this._hfwInstance.hfwFrames);
    this.qParamsHandler = new QParamsHandler(this, this.hfwTrace);
    this.hfwTrace.debug(TraceModules.state, 'qParamsHandler and routeReuseStrategy seems not used %s %s', this.qParamsHandler, this.routeReuseStrategy);
  }

  public navigateFrames(msgBroker: IHfwMessage): void {
    if (this.appStatus === AppStatus.Initializing) {
      this.startNavigateDefaultUrl(msgBroker);
    }
  }

  public get activeWorkAreaIdValue(): string {
    return this._activeWorkAreaId.value;
  }

  public get appStatus(): AppStatus {
    return this._appStatus;
  }

  public set appStatus(value: AppStatus) {
    if (value != null) {
      this._appStatus = value;
    }
  }

  public get activeWorkAreaId(): Observable<string> {
    return this._activeWorkAreaId.asObservable();
  }

  public onNewSelectionQParamDetected(_change: QParamChange): void {
    // TODO document why this method 'onNewSelectionQParamDetected' is empty
  }

  public changeWorkAreaFrame(id: string): void {
    this._activeWorkAreaId.next(id);
  }

  public lockUnlockLayout(frameId: string): void {
    const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
    if (frame != null) {
      frame.lockUnlock();
    }
  }

  public getCurrentLayoutId(frameId: string): Observable<string | null> {
    const frame: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
    if (frame != null) {
      return frame.selectedLayoutId;
    }
    return null!;
  }

  /**
   * Returns the array of frames of the current HLDL instance.
   */
  public getFrames(): hldl.HfwFrame[] | null {
    return (this._hfwInstance != null) ? this._hfwInstance.hfwFrames : null;
  }

  public getFrameById(frameId: string): hldl.HfwFrame | null {
    if (this._hfwInstance?.hfwFrames != null) {
      const frame: hldl.HfwFrame | null = this._hfwInstance.hfwFrames.find(f => f.id === frameId)!;
      return frame ?? null;
    }
    return null;
  }

  public switchToNextFrame(frameId: string): Observable<boolean> {
    if (this._appStatus === AppStatus.Running &&
        frameId != null && frameId !== this._activeWorkAreaId.getValue() &&
        this.getFrameById(frameId)?.docked === hldl.Docked.none) {
      this._appStatus = AppStatus.SwitchingFrame;

      // const frame: FrameStore = this.getFrameStoreViaId(frameId);
      // const workAreaMode: ModeData = this.getFrameMode(frame);
      // const workAreaModeId: string = (workAreaMode != null) ? workAreaMode.id : null;
      // const mainUrlTree: UrlTree = this.routingHelper.getUrlOfCurrentState(
      //                                 this._frameMap, frameId, new Map<string, any>(), // this.qParamsHandler.getFrameQParam(frameId, workAreaModeId),
      //                                 workAreaMode);

      this._appStatus = AppStatus.Running;
      this.updateStateAfterFrameChange(frameId);
      return of(true);
      // // TODO: right now we cannot navigate.
    }
    return of(false);
  }

  public updateStateAfterFrameChange(newFrameId: string): void {
    if (newFrameId !== this._activeWorkAreaId.getValue() &&
        this.getFrameById(newFrameId)?.docked === hldl.Docked.none) {
      this.activeWorkArea = this.getFrameById(newFrameId);
      this.changeWorkAreaFrame(newFrameId);
    }
  }

  public navigateToFrameViewLayout(frameId: string, layoutId: string): Observable<boolean> {
    if (this._appStatus !== AppStatus.Initializing) {
      this.changingLayoutFrameStore = this.currentState.getFrameStoreViaId(frameId)!;
      if (this.changingLayoutFrameStore != null) {
        const layoutIndex: number = this.changingLayoutFrameStore.availableLayoutsValue.findIndex((l: hldl.LayoutInstance) => l.id === layoutId);

        if (layoutIndex >= 0 && this.changingLayoutFrameStore?.paneMap) {
          this.appStatus = AppStatus.ProcessingMessage;
          this.changingLayoutId = layoutId;

          // const workAreaMode: ModeData = this.getFrameMode(this.changingLayoutFrameStore);
          // const workAreaModeId: string = (workAreaMode != null) ? workAreaMode.id : null;
          // const mainUrlTree: UrlTree =
          //     this.routingHelper.getUrlOfCurrentStateAndSpecificLayout(this._frameMap,
          //                                                             new Map<string, any>(),
          //                                                             /*this.qParamsHandler.getFrameQParam(this.activeWorkArea.id, workAreaModeId),*/
          //                                                             this.getFrameById(frameId),
          //                                                             layoutId,
          //                                                             workAreaMode);

          // cannot navigate since snapins module cannot be found. ie. '@gms/summary-bar/bundles/gms-summary-bar.umd.min

          // (<ReuseStrategyService>this.routeReuseStrategy).traceStoredHandles();
          // const snapinsToReuse: { curr: FullSnapInId, future: FullSnapInId }[] = this.evaluateSnapinsToReuseOnLayoutSwitch(this.activeWorkArea.id, layoutId);
          // (<ReuseStrategyService>this.routeReuseStrategy).startLayoutChangeRouterReuse(snapinsToReuse);

          // const navigateHandler: NavigateHandler = new NavigateHandler("navigateToFrameViewLayout", mainUrlTree, this.appStatus, this.router, this.hfwTrace);
          // return navigateHandler.navigate().pipe(
          //   tap((res: boolean) => {
          //     if (res === true) {
          //       (<ReuseStrategyService>this.routeReuseStrategy).stopLayoutChangeRouterReuse();
          //       (<ReuseStrategyService>this.routeReuseStrategy).traceStoredHandles();
          //       // open, eventually closed pane
          //       this.changingLayoutFrameStore.paneMap.forEach((pane, key) => {
          //         if (this.routingHelper.paneIsInLayout(this.changingLayoutFrameStore, key, this.changingLayoutId)
          //             && !pane.paneConfig.startAsClosed
          //             && !pane.isVisibleValue ) {
          //           pane.open();
          //         }
          //       });

          //       // select new layout
          //       this.selectLayoutAndSaveUserSettings(this.changingLayoutFrameStore.id, this.changingLayoutId);
          //     }
          //     this.appStatus = AppStatus.running;
          //   }),
          //   catchError(this.handleErrorOnNavigateLayout)
          // );
          this.paneOpenInLayout();
          // select new layout
          this.selectLayoutAndSaveUserSettings(this.changingLayoutFrameStore.id, this.changingLayoutId);
          this.appStatus = AppStatus.Running;
          return of(true);
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

  public cleanTargetSnapinsState(targetSnapIns: Map<string, SnapInStore>): void {
    if (targetSnapIns != null) {
      targetSnapIns.forEach((s: SnapInStore, _key) => {
        if (s.storageService != null) {
          s.storageService.clearState(s.fullSnapInId);
        }
      });
    }
  }

  public pushNewSelectionQParam(_sender: FullSnapInId, _value: any): void {
    // TODO document why this method 'pushNewSelectionQParam' is empty
  }

  /**
   * Returns the Pane object of the given IDs.
   */
  public getPaneById(paneId: string, frameId: string): hldl.Pane | null {
    const hfwFrame: hldl.HfwFrame | null = this.getFrameById(frameId);
    if (hfwFrame != null) {
      if (hfwFrame.panes != null && hfwFrame.panes != undefined) {
        const pane: hldl.Pane | undefined = hfwFrame.panes!.find(p => p.id === paneId);
        return pane ?? null;
      } else {
        // this.hfwTrace.warn(TraceModules.state, "Hldl Error; No Panes Found for this FrameId.");
      }
    }
    return null;
  }

  public navigateAfterPreselection(): void {
    if (this.activeWorkArea != null) {
      const mainUrlTree: UrlTree = this.routingHelper.getUrlFromState(this.currentState);
      this.router.navigateByUrl(mainUrlTree)
        .then(() => {
          this.appStatus = AppStatus.Running;
        });
    }
  }

  public checkUnsaved(_targetPanes: PaneStore[], _reason: UnsavedDataReason): Observable<boolean> {
    return of(true);
  }

  public navigateToMultipleSelection(_isWorkAreaChangingLayout: boolean): void {
    if (this.activeWorkArea != null) {
      this.appStatus = AppStatus.Running;
      //   if (isWorkAreaChangingLayout) {
      //     const currentFrame: FrameStore = this.getFrameStoreViaId(this.activeWorkArea.id);
      //     const currentLayoutId: string = currentFrame.selectedLayoutIdValue;
      //     const snapinsToReuse: { curr: FullSnapInId, future: FullSnapInId }[] =
      //     this.evaluateSnapinsToReuseOnLayoutSwitch(this.activeWorkArea.id, currentLayoutId);
      //     (<ReuseStrategyService>this.routeReuseStrategy).startLayoutChangeRouterReuse(snapinsToReuse);
      //   }

      //   this.router.navigateByUrl(mainUrlTree)
      //     .then(() => {
      //       this.appStatus = AppStatus.running;
      //     }, err => {
      //       if (isWorkAreaChangingLayout) {
      //         (<ReuseStrategyService>this.routeReuseStrategy).stopLayoutChangeRouterReuse();
      //       }
      //     });
      // } else {
      //   this.appStatus = AppStatus.running;
      // }
    }
  }

  public startNavigateDefaultUrl(_msgBroker: IHfwMessage): void {
    this.activeWorkArea = this.findFirstWorkAreaFrame();
    this.changeWorkAreaFrame(this.activeWorkArea!.id!);
  }

  public getIPreselectionService(typeId: string): IPreselectionService {
    if (this.iPreselectionServices != null) {
      this.hfwTrace.debug(TraceModules.state, 'preselection service of %s requested.', typeId);
    }
    return new MockPreselectionService();
  }

  public getIStorageService(typeId: string): IStorageService {
    let serv: IStorageService | null = null;
    if (!isNullOrUndefined(this.iStorageServices) && this.iStorageServices.length > 0) {
      serv = this.iStorageServices.find(myServ => myServ.typeId === typeId)!;
    }
    // return (serv != null) ? serv : null;
    return serv ?? null!;
  }

  public getIQParamService(typeId: string): IQParamService {
    let serv: IQParamService | null = null;
    if (!isNullOrUndefined(this.iQParamServices) && this.iQParamServices.length > 0) {
      serv = this.iQParamServices.find((myServ: IQParamService) => myServ.typeId === typeId)!;
    }
    return serv ?? null!;
  }

  // private handleErrorOnNavigateLayout(errorMessage: any): Observable<never> {
  //   (<ReuseStrategyService>this.routeReuseStrategy).stopLayoutChangeRouterReuse();
  //   return throwError(errorMessage);
  // }

  // private layoutChangeWithUnsavedDataCheck(frameId: string, layoutId: string): void {
  //   this.navigateToFrameViewLayout(frameId, layoutId).subscribe((res: boolean) => {
  //   });
  // }
  // private evaluateSnapinsToReuseOnLayoutSwitch(currentFrameId: string, futureLayoutId: string): { curr: FullSnapInId, future: FullSnapInId }[] {

  //   // Important: The method handles layout changes within frames only!
  //   // Intentionally, as frame switches must have a different reuse strategy.
  //   const currentFrame: FrameStore = this.getFrameStoreViaId(currentFrameId);
  //   const currentPanes: string[] = currentFrame.paneIdsPerLayout.get(currentFrame.selectedLayoutIdValue);
  //   const currentSnapinsPerPane: Map<string, { snapinId: string, handled: boolean }> = new Map<string, { snapinId: string, handled: boolean }>();
  //   currentPanes.forEach(pane => {
  //     const paneStore: PaneStore = this.getPaneStoreViaIds(currentFrameId, pane);
  //     currentSnapinsPerPane.set(pane, { snapinId: paneStore.selectedSnapInIdValue, handled: false });
  //   });
  //   const futurePanes: string[] = currentFrame.paneIdsPerLayout.get(futureLayoutId);
  //   if ((futurePanes == null) || (futurePanes.length === 0)) {
  //     return null;
  //   }
  //   const futurePanesPerSnapin: Map<string, { paneId: string, occupied: boolean }[]> = new Map<string, { paneId: string, occupied: boolean }[]>();
  //   futurePanes.forEach(pane => {
  //     const paneStore: PaneStore = this.getPaneStoreViaIds(currentFrameId, pane);
  //     if (futurePanesPerSnapin.has(paneStore.selectedSnapInIdValue) === false) {
  //       futurePanesPerSnapin.set(paneStore.selectedSnapInIdValue, [{ paneId: pane, occupied: false }]);
  //     }
  //     else {
  //       futurePanesPerSnapin.get(paneStore.selectedSnapInIdValue).push({ paneId: pane, occupied: false });
  //     }
  //   });

  private paneOpenInLayout(): void {
    this.changingLayoutFrameStore.paneMap.forEach((pane, key) => {
      if (this.currentState.paneIsInLayout(this.changingLayoutFrameStore, key, this.changingLayoutId)
          && pane?.paneConfig
          && !pane.paneConfig.startAsClosed
          && !pane.isVisibleValue) {
        pane.open();
      }
    });
  }
  private selectLayoutAndSaveUserSettings(frameId: string, layoutId: string): void {
    if (frameId != null && layoutId != null) {
      const frameStore: FrameStore | null = this.currentState.getFrameStoreViaId(frameId);
      if (frameStore != null && layoutId !== frameStore.selectedLayoutIdValue) {
        const layoutIndex: number = frameStore.availableLayoutsValue.findIndex(l => l.id === layoutId);
        if (layoutIndex >= 0) {
          frameStore.selectLayout(layoutId);
        }
      }
    }
  }

  // private navigateToSnapId(frameId: string, paneId: string, snapInId: string): void {
  //   if (this._appStatus !== AppStatus.initializing &&
  //       this._appStatus !== AppStatus.updatingFromNavigate &&
  //       this._appStatus !== AppStatus.processingMessage &&
  //       this._appStatus !== AppStatus.processingNewSelection &&
  //       frameId != null &&
  //       paneId != null &&
  //       snapInId != null ) {
  //         const frame: FrameStore = this.getFrameStoreViaId(frameId);
  //         const pane: hldl.Pane = this.getPaneById(paneId, frameId);
  //         if (pane != null && pane.outletName != null &&
  //             frame != null &&
  //             frame.frameConfig != null &&
  //             frame.frameConfig.outletName != null ) {
  // private getFrameMode(frame: FrameStore): ModeData {
  //   const res: ModeData = (frame?.selectedModeValue?.id != null) ? frame.selectedModeValue : null;
  //   return res;
  // }

  /**
   * Fills the interal structures deserializing the json object recieved as input.
   */
  private createDataStructure(hfwInstance: hldl.HfwInstance): void {
    const dataStructure: StateDataStructure = StateDataStructureCreator.createDataStructure(hfwInstance, this as IState);
    this._hfwInstance = dataStructure.hfwInstance;
    this.currentState.frameMap = dataStructure.frameMap;
  }

  private selectLayoutsAndSnapins(): void {
    const frames: FrameStore[] | null = this.currentState.getFramesStore();
    if (!isNullOrUndefined(frames)) {
      frames!.forEach(f => {
        const firstLayoutId: string = LayoutManagement.getMostFittingLayoutId(f.availableLayoutsValue);
        f.selectLayout(firstLayoutId);
        f.paneMap!.forEach(pane => {
          this.selectFirstSnapin(f.frameConfig!, pane);
        });
      });
    }
  }

  // private registerAsHostingPane(pane: hldl.Pane, fullPaneId: FullPaneId, snapInInstanceMap: ISnapInReferenceMap): void {
  //   for (const sni of pane.snapInReferences) {
  //     const snapinStore: SnapInStore = snapInInstanceMap[sni.id];
  //     if (snapinStore != null) {
  //       snapinStore.hostingPanesIds.push(fullPaneId.paneId);
  //     }
  //   }
  // }

  private findFirstWorkAreaFrame(): hldl.HfwFrame | null {
    let result: hldl.HfwFrame | null = null;
    for (const frame of this._hfwInstance.hfwFrames) {
      if (frame.docked === null || frame.docked !== hldl.Docked.top) {
        result = frame;
      }
    }
    return result;
  }

  private selectFirstSnapin(frame: hldl.HfwFrame, paneStore: PaneStore): void {
    if (paneStore?.paneConfig && !paneStore.paneConfig.canStartWithoutSelectedSnapin) {
      let firstSelectedSnapInId = '';
      if (this.redirectUrl != null && this.redirectUrl !== '/') {
        firstSelectedSnapInId = this.routingHelper.getSelectedSnapInId(this.redirectUrl, frame, paneStore.paneConfig);
      }
      if (firstSelectedSnapInId == null) {
        firstSelectedSnapInId = this.getFirstSnapInId(paneStore);
      }
      paneStore.selectSnapIn(firstSelectedSnapInId);
    }
  }

  private getFirstSnapInId(pane: PaneStore): string {
    return pane.paneConfig!.snapInReferences[0].id;
  }

  // private getFrameModeId(frame: FrameStore): string {
  //   const res: string = (frame != null && frame.selectedModeValue != null &&
  //     frame.selectedModeValue.id != null &&
  //     frame.selectedModeValue.id !== "default") ? frame.selectedModeValue.id : null;
  //   return res;
  // }

  // Taken from hldlService to adjust hdld data model. BEGIN.

  /**
   * Convert multiple attributes from string to Enum into HLDL tree.
   */
  private postDeserialize(hfwFrames: hldl.HfwFrame[]): void {
    if (hfwFrames != null) {
      let frameOutletNumber = 1;
      for (const frame of hfwFrames) {
        this.convertDockedFromStringToEnum(frame);
        if (frame.docked === hldl.Docked.top) {
          frame.outletName = 'o' + frameOutletNumber.toString();
          frameOutletNumber++;
        } else {
          frame.outletName = 'main';
        }

        if (frame.panes != null) {
          for (const pane of frame.panes) {
            pane.outletName = 'o' + frameOutletNumber.toString();
            frameOutletNumber++;
            this.convertTitleFromStringToEnum(pane);
          }
        }
        if (frame.layoutInstances == null) {
          frame.layoutInstances = this.createDefaultLayout(frame);
        }
      }
    }
  }

  /**
   * Convert from string to Docked enum.
   */
  private convertDockedFromStringToEnum(frame: hldl.HfwFrame): void {
    if (frame != null) {
      frame.docked = (hldl.Docked as any)[frame.docked];
      if (frame.docked == null) {
        frame.docked = hldl.Docked.none;
      }
    }
  }
  /**
   * Convert from string to Title enum.
   */
  private convertTitleFromStringToEnum(pane: hldl.Pane): void {
    pane.paneTitleOrSnapinTitle = (hldl.Title as any)[pane.paneTitleOrSnapinTitle];
    if (pane.paneTitleOrSnapinTitle == null) {
      pane.paneTitleOrSnapinTitle = hldl.Title.pane;
    }
  }

  /**
   * Filters available layout basing on mediaQuery and creates singlepane-layout if not defined.
   */
  private createDefaultLayout(frame: hldl.HfwFrame): hldl.LayoutInstance[] {
    let layouts: hldl.LayoutInstance[] = [];
    if (frame.layoutInstances == null) {
      // create default Layout with single pane.
      let paneInstance: hldl.PaneInstance;
      if (frame.panes != null &&
          frame.panes.length > 0 &&
          frame.panes[0] != null) {
        paneInstance = new hldl.PaneInstance(frame.panes[0].id, null!);
      } else {
        paneInstance = new hldl.PaneInstance('empty', null!);
      }

      layouts = [];
      layouts.push(new hldl.LayoutInstance(paneInstance, null, 'element-layout-pane-1', null, null, null, null, true, null, 'l'));
    }
    return layouts;
  }

  // taken from HldlService end.

}
