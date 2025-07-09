import { Injectable, Optional } from '@angular/core';
import {
  AppSettings,
  AppSettingsService,
  HfwUtility,
  isNullOrUndefined,
  ModeData,
  TraceService
} from '@gms-flex/services-common';
import { Observable, Observer, of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { FullPaneId } from '../../common/fullsnapinid/full-pane-id.model';
import { FullQParamId } from '../../common/fullsnapinid/full-qparam-id.model';
import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { FrameInfo } from '../../common/interfaces/frame-info.model';
import { IHfwMessage } from '../../common/interfaces/ihfwmessage';
import { IObjectSelection } from '../../common/interfaces/iobjectselection';
import { IPreselectionService } from '../../common/interfaces/ipreselection.service';
import { IStateService } from '../../common/interfaces/istate.service';
import { IStorageService } from '../../common/interfaces/istorage.service';
import { MessageParameters } from '../../common/interfaces/message-parameters.model';
import { QParam } from '../../common/interfaces/q-param.model';
import { SnapinDisplay } from '../../common/interfaces/snapin-display/snapin-display';
import { UnsavedDataReason } from '../../common/unsaved-data';
import { LayoutInstance } from '../shared/hldl/hldl-data.model';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { QParamStore } from '../shared/stores/qparam-store';
import { SnapInStore } from '../shared/stores/snapin.store';
import { TraceModules } from '../shared/trace/trace-modules';
import { AppStatus } from '../state/app-status.model';
import { HfwState } from '../state/hfw-state';
import { QParamChange } from '../state/q-param-change.model';
import { ComponentMessageParam, HfwMessageParam, QParamServiceMessageParam, SnapinMessageParam } from './message-param.model';
import { MessageTargets } from './message-targets.model';
import { PreselectionHandler } from './preselection-handler';
import { SnapinFinder } from './snapin-finder';

const invalidValue = 'SendMessage received with invalid input values.';

/**
 * Service for handling messages between snapins and HFW.
 */
@Injectable({
  providedIn: 'root'
})
export class SnapinMessageBroker implements IHfwMessage {

  private preselectSubscription!: Subscription | null;

  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private readonly preselectionTimeout: number = 8000;

  private isProcessingQParamChange = false;

  public constructor(private readonly appSettingsService: AppSettingsService,
    private readonly trace: TraceService,
    private readonly stateService: IStateService,
    @Optional() private readonly objectSelectionService: IObjectSelection) {
    this.trace.debug(TraceModules.msgBroker, 'SnapinMessageBroker service created.');

    const settings: AppSettings = this.appSettingsService.getAppSettingsValue();
    if (settings?.preselectionTimeout != null) {
      this.preselectionTimeout = settings.preselectionTimeout;
    }

    this.subscribeqParamChangeDetected();
  }

  // IHfwMessage methods

  public sendMessage(
    fullId: FullSnapInId,
    location: FullPaneId,
    messageTypes: string[],
    messageBody: any,
    preselection: boolean,
    qParam: QParam,
    broadcast: boolean,
    applyRuleId: string,
    secondarySelectionInSinglePane: boolean,
    skipNavigation?: boolean,
    specificState?: HfwState): Observable<boolean> {

    const state = !isNullOrUndefined(specificState) ? specificState : this.stateService.currentState;

    if (messageTypes != null && fullId.frameId != null && fullId.snapInId != null &&
      state?.getSnapInStore(fullId) != null) {
      const msg: SnapinMessageParam = new SnapinMessageParam(fullId, location, messageTypes, messageBody, preselection,
        qParam, broadcast, applyRuleId, secondarySelectionInSinglePane, skipNavigation);
      return new Observable((observer: Observer<boolean>) => {
        this.onSendMessageSubscription(observer, msg, state, !isNullOrUndefined(specificState));
        return (): any => this.sendMessageTeardownLogic(fullId.fullId());
      });
    } else {
      this.trace.debug(TraceModules.msgBroker, invalidValue);
      return of(false);
    }
  }

  public selectViaQParamService(message: MessageParameters): Observable<boolean> {
    const fullQParamId = FullQParamId.createFrom(message.qParam.name);

    if (!isNullOrUndefined(fullQParamId)) {
      return this.sendMessageFromQParamService(
        fullQParamId,
        message.types,
        message.messageBody,
        true,
        message.qParam,
        false,
        null,
        false);
    } else {
      return of(false);
    }
  }

  public sendMessageFromRightPanel(senderId: string,
    senderFrameId: string,
    communicationId: string,
    types: string[],
    messageBody: any,
    preselection: boolean,
    qParam: QParam,
    broadcast: boolean,
    applyRuleId: string,
    secondarySelectionInSinglePane: boolean): Observable<boolean> {

    const frame = this.stateService.currentState.getFrameStoreViaId(senderFrameId);
    if (senderId != null && frame != null && !isNullOrUndefined(frame.frameConfig.rightPanelCommunications && types != null)) {
      const communication = frame.frameConfig.rightPanelCommunications.find(c => c.id === communicationId);
      if (!isNullOrUndefined(communication)) {
        const msg: ComponentMessageParam = new ComponentMessageParam(senderId, senderFrameId, communicationId, types, messageBody, preselection,
          qParam, broadcast, applyRuleId, secondarySelectionInSinglePane);
        return new Observable((observer: Observer<boolean>) => {
          this.onSendMessageSubscription(observer, msg, this.stateService.currentState, false);
          return (): any => this.sendMessageTeardownLogic(senderId);
        });
      }
    }

    this.trace.debug(TraceModules.msgBroker, invalidValue);
    return of(false);

  }

  public changeLayout(frameId: string, layoutId: string): Observable<boolean> {
    const frameStore = this.stateService.currentState.getFrameStoreViaId(frameId);
    if (frameStore?.selectedViewIdValue && layoutId != null) {
      return this.stateService.navigateToFrameViewLayout(frameId, frameStore.selectedViewIdValue, layoutId);
    } else {
      return of(false);
    }
  }

  public changeView(frameId: string, viewId: string): Observable<boolean> {
    if (frameId != null && viewId != null) {
      return this.stateService.selectView(frameId, viewId);
    } else {
      return of(false);
    }
  }

  public getCurrentLayoutId(frameId: string): Observable<string> {
    return this.stateService.getCurrentLayoutId(frameId);
  }

  public getCurrentMode(): Observable<ModeData | null> {
    return this.stateService.getCurrentMode();
  }

  public getCurrentWorkAreaFrameInfo(): Observable<FrameInfo> {
    return this.stateService.currentState.activeWorkAreaId.pipe(map((id: string) => {
      if (id != null) {
        const frame: FrameStore = this.stateService.currentState.getFrameStoreViaId(id)!;
        return {
          id: frame.id,
          isLayoutLocked: frame.isLockedValue
        };
      }
      return null!;
    }));
  }

  public getCurrentWorkAreaView(): Observable<string | undefined> {
    const id = this.stateService.currentState.activeWorkAreaIdValue;
    const frame = this.stateService.currentState.getFrameStoreViaId(id);
    if (frame) {
      return frame.selectedViewId;
    } else {
      return of(undefined);
    }
  }

  public lockLayout(frameId: string): void {
    this.stateService.lockUnlockLayout(frameId);
  }

  public switchToNextFrame(frameId: string, message?: MessageParameters): Observable<boolean> {
    if (frameId != null) {
      return this.stateService.switchToNextFrame(frameId, this, message);
    } else {
      return of(false);
    }
  }

  public changeMode(mode: ModeData, preferredFrameId?: string, firstSelectionObj?: MessageParameters): Observable<boolean> {
    if (mode != null) {
      return this.stateService.changeMode(mode, this, preferredFrameId, firstSelectionObj);
    } else {
      return of(false);
    }
  }

  public fullScreenSnapin(location: FullPaneId, fullScreen: boolean): void {
    this.trace.debug(TraceModules.msgBroker, 'full screen called by %s', location.fullId());
    this.stateService.fullScreenSnapin(location, fullScreen);
  }

  public getMessage(fullId: FullSnapInId): Observable<any> {
    if (fullId != null) {
      const sni: SnapInStore | null = this.stateService.currentState.getSnapInStore(fullId);
      if (sni != null) {
        return sni.message;
      }
    }
    return of(null);
  }

  public getRightPanelMessage(frameId: string): Observable<any> {
    if (frameId != null) {
      const frame: FrameStore | null = this.stateService.currentState.getFrameStoreViaId(frameId);
      if (frame != null) {
        return frame.rightPanelMessage;
      }
    }
    return of(null);
  }

  public getPreselectionService(fullId: FullSnapInId): IPreselectionService {
    return this.stateService.currentState.getPreselectionService(fullId)!;
  }

  public getStorageService(fullId: FullSnapInId): IStorageService {
    return this.stateService.currentState.getStorageService(fullId)!;
  }

  public getQueryParam(qParamId: FullQParamId): Observable<string> | any {
    if (qParamId != null) {
      const qParam: QParamStore | null = this.stateService.currentState.getQParamStore(qParamId);
      if (qParam != null) {
        return qParam.getQParam(qParamId.channelId);
      }
    }
    return of(null);
  }

  public logout(skipUnsavedData = false, isInactivityLogout = false): void {
    this.stateService.triggerLogout(skipUnsavedData, isInactivityLogout);
  }

  public canChangeUserRoles(): Observable<boolean> {
    return this.stateService.canChangeUserRoles();
  }

  public clearLastMessage(fullId: FullSnapInId): void {
    if (fullId != null) {
      const sni: SnapInStore | null = this.stateService.currentState.getSnapInStore(fullId);
      if (sni != null) {
        this.trace.info(TraceModules.msgBroker, 'Clearing %s message BehaviorSubject', fullId.fullId());
        sni.clearMessage();
      }
    }
  }

  public resetFrameSettingsToDefault(frameId: string): Observable<boolean> {
    return this.stateService.resetFrameSettingsPerSize(frameId);
  }

  public displaySnapInTab(snapins: SnapinDisplay[], context?: any): Observable<boolean> {
    return this.stateService.displaySnapInTab(snapins, context);
  }

  public calculateUrlOnSelection(fullId: FullSnapInId,
    location: FullPaneId,
    types: string[],
    messageBody: any,
    qParam: QParam,
    broadcast: boolean,
    applyRuleId: string,
    secondarySelectionInSinglePane: boolean): Observable<string> {
    return new Observable((observer: Observer<string>) => {
      this.onCalculateUrlSubscription(observer, fullId, location, types, messageBody, qParam, broadcast, applyRuleId, secondarySelectionInSinglePane);
      return (): any => this.calculateUrlTeardownLogic(fullId);
    });
  }

  public getUpdatingLocation(fullId: FullSnapInId): FullPaneId {
    return this.stateService.getUpdatingLocation(fullId);
  }
  // IHfwMessage methods end

  public sendMessageFromQParamService(sender: FullQParamId | null,
    messageTypes: string[],
    messageBody: any,
    preselection: boolean,
    qParam: QParam,
    broadcast: boolean,
    applyRuleId: string | null,
    avoidSelectSnapInOnFocus: boolean,
    skipNavigation?: boolean): Observable<boolean> {

    if (messageTypes != null && sender != null && sender.frameId != null && sender.typeId != null) {
      const msg: QParamServiceMessageParam = new QParamServiceMessageParam(sender, messageTypes, messageBody, preselection,
        qParam, broadcast, applyRuleId, avoidSelectSnapInOnFocus, skipNavigation);
      return new Observable((observer: Observer<boolean>) => {
        this.onSendMessageSubscription(observer, msg, this.stateService.currentState, false);
        return (): any => this.sendMessageTeardownLogic(sender.fullId());
      });
    } else {
      this.trace.debug(TraceModules.msgBroker, invalidValue);
      return of(false);
    }
  }

  private onCalculateUrlSubscription(observer: Observer<string>, fullId: FullSnapInId,
    location: FullPaneId,
    types: string[],
    messageBody: any,
    qParam: QParam,
    broadcast: boolean,
    applyRuleId: string,
    secondarySelectionInSinglePane: boolean): void {
    const tempState: HfwState = HfwState.clone(this.stateService.currentState);
    this.sendMessage(fullId, location, types, messageBody, true, qParam,
      broadcast, applyRuleId, secondarySelectionInSinglePane, true, tempState).subscribe(res => {
      this.trace.debug(TraceModules.msgBroker, 'SendMessage for url calculation completed with:result %s.', res);
      const mainUrlTree = this.stateService.getUrlTreeOfCurrentState(false, tempState);
      tempState.dispose();
      observer.next(mainUrlTree.toString());
      observer.complete();
    });
  }

  private onSendMessageSubscription(observer: Observer<boolean>,
    msg: HfwMessageParam,
    state: HfwState,
    isSentForUrlCalculationPurpose: boolean): void {

    this.traceIncomingMessage(msg);
    if ((this.preselectSubscription != null) && (this.preselectSubscription.closed === false)) {
      this.preselectSubscription.unsubscribe();
    }

    const sniFinder: SnapinFinder = new SnapinFinder(state);
    const targets: MessageTargets = sniFinder.findTargetSnapIns(msg);

    if (targets?.targets != null && targets.targets.length > 0) {
      if (msg.preselection) {
        if (!isSentForUrlCalculationPurpose) {
          this.stateService.checkUnsaved(targets.targetsPane, UnsavedDataReason.NewSelection).subscribe((res: boolean) => {
            if (res === true) {
              this.processPreselection(observer, targets, msg, state, false);
            } else {
              const sender = this.getMessageSender(msg);
              this.trace.info(TraceModules.msgBroker, 'incoming message from %s aborted by the user.', sender);
              this.pushToClientAndDispose(observer, false);
            }
          });
        } else { // if it only for url calculation purpose check unsaved is unecessary.
          this.processPreselection(observer, targets, msg, state, true);
        }
      } else {
        const targetMap: Map<string, Map<string, SnapInStore>> = SnapinFinder.groupByFrameAndPane(targets.targets);
        this.routeMessage(msg, targetMap, targets.targetsPane, false, state, false, targets.targetRightPanelFrameIds);
        this.pushToClientAndDispose(observer, true);
      }
    } else {
      if (targets.targetRightPanelFrameIds.length > 0) {
        const targetMap: Map<string, Map<string, SnapInStore>> = SnapinFinder.groupByFrameAndPane(targets.targets);
        this.routeMessage(msg, targetMap, targets.targetsPane, false, state, false, targets.targetRightPanelFrameIds);
        this.pushToClientAndDispose(observer, true);

      } else {
        this.trace.info(TraceModules.msgBroker, 'No target snapins for the incoming message.');
        this.pushToClientAndDispose(observer, false);
      }
    }
  }

  private pushToClientAndDispose(observer: Observer<boolean>, result: boolean): void {
    observer.next(result);
    observer.complete();
  }

  private sendMessageTeardownLogic(id: string): void {
    this.trace.info(TraceModules.msgBroker, 'sendMessageTeardownLogic() called for handlerId=%s, disposing all calls, deleting state...', id);
  }

  private calculateUrlTeardownLogic(fullId: FullSnapInId): void {
    this.trace.info(TraceModules.msgBroker, 'sendMessageTeardownLogic() called for handlerId=%s, disposing all calls, deleting state...', fullId.fullId());
  }

  private processPreselection(observer: Observer<boolean>,
    targets: MessageTargets,
    msg: HfwMessageParam,
    state: HfwState,
    isSentForUrlCalculationPurpose: boolean): void {

    this.trace.debug(TraceModules.msgBroker, 'setting processingNewSelection from processPreselection');
    this.stateService.appStatus = AppStatus.ProcessingNewSelection;

    const sniPerId: Map<string, SnapInStore> = new Map<string, SnapInStore>();
    targets.targets.forEach(sni => {
      sniPerId.set(sni.fullSnapInId.fullId(), sni);
    });

    if (!isSentForUrlCalculationPurpose) {
      this.stateService.cleanTargetSnapinsState(sniPerId);
    }

    const handlerId: string = this.getMessageSender(msg);
    const preselectionHandler: PreselectionHandler = new PreselectionHandler(handlerId, sniPerId, msg.messageTypes,
      msg.messageBody, this.preselectionTimeout, this.trace);
    this.preselectSubscription = preselectionHandler.preselectAllSnapins().subscribe(preselectResult =>
      this.onPreselect(observer, preselectResult, msg, targets.targetsPane, targets.canSwitchLayout,
        state, isSentForUrlCalculationPurpose, targets.targetRightPanelFrameIds));
  }

  private onPreselect(observer: Observer<boolean>,
    preselectResult: SnapInStore[],
    msg: HfwMessageParam,
    targetPanes: PaneStore[],
    canSwitchLayout: boolean,
    state: HfwState,
    isSentForUrlCalculationPurpose: boolean,
    targetRightPanelFrameIds: string[]): void {
    this.trace.info(TraceModules.msgBroker, 'onPreselect() called: preselection done, number of selectable snapins: %s', preselectResult.length);
    this.setQParameter(msg.qParam, state);

    const senderFullId: FullSnapInId | null = (msg instanceof SnapinMessageParam) ? msg.fullId : null;

    const targetMap: Map<string, Map<string, SnapInStore>> = SnapinFinder.groupByFrameAndPane(preselectResult);

    let isChangingLayout = false;
    const secondarySelectionInSinglePane = (msg instanceof SnapinMessageParam) ? msg.secondarySelectionInSinglePane : undefined;
    this.setTabVisibility(targetMap, targetPanes, senderFullId, state, secondarySelectionInSinglePane!);
    if (canSwitchLayout) {
      isChangingLayout = this.selectMatchingLayout(targetMap, state);
    }
    this.routeMessage(msg, targetMap, targetPanes, isChangingLayout, state, isSentForUrlCalculationPurpose,
      targetRightPanelFrameIds);
    this.pushToClientAndDispose(observer, true);
    this.preselectSubscription = null;
  }

  private setQParameter(qParam: QParam | null, state: HfwState): void {
    this.stateService.pushNewSelectionQParam(qParam, state);
  }

  private routeMessage(msg: HfwMessageParam,
    frameMap: Map<string, Map<string, SnapInStore>>,
    targetPanes: PaneStore[],
    isWorkAreaLayoutChanging: boolean,
    state: HfwState,
    isSentForUrlCalculationPurpose: boolean,
    rightPanelFrames: string[]): void {

    if (rightPanelFrames && rightPanelFrames.length > 0) {
      rightPanelFrames.forEach(frameId => {
        const frameStore = state.getFrameStoreViaId(frameId);
        frameStore.sendRightPanelMessage(msg.messageBody);
        if (this.objectSelectionService && !isSentForUrlCalculationPurpose) {
          this.objectSelectionService.setRightPanelSelectedObject(frameId, msg.messageBody);
        }
      });
    }

    frameMap.forEach(snapInMap => {
      const avoidSelectSnapInOnFocus = (msg instanceof QParamServiceMessageParam) ? msg.avoidSelectSnapInOnFocus : false;
      this.routeMessageToFrame(msg.messageTypes, msg.messageBody, msg.preselection, snapInMap, targetPanes, state,
        isSentForUrlCalculationPurpose, avoidSelectSnapInOnFocus);
    });

    if (msg.preselection) {
      if (!isSentForUrlCalculationPurpose) {
        if (!this.isProcessingQParamChange) {
          if (msg.skipNavigation == null || msg.skipNavigation === false) {
            this.stateService.navigateToMultipleSelection(isWorkAreaLayoutChanging);
          } else {
            this.stateService.appStatus = AppStatus.Running;
          }
        } else {
          this.isProcessingQParamChange = false;
          this.stateService.appStatus = AppStatus.Running;
        }
      } else {
        this.stateService.appStatus = AppStatus.Running;
      }
    } else if (this.stateService.appStatus == AppStatus.ProcessingNewSelection) {
      this.stateService.appStatus = AppStatus.Running;
    }
  }

  private routeMessageToFrame(messageTypes: string[],
    message: any,
    preselection: boolean | null,
    sniMap: Map<string, SnapInStore>,
    targetPanes: PaneStore[],
    state: HfwState,
    isSentForUrlCalculationPurpose: boolean,
    avoidSelectSnapInOnFocus: boolean): void {
    sniMap.forEach(receiver => {
      this.traceOutgoingMessage(receiver.fullSnapInId, preselection, messageTypes);
      receiver.sendMessage(message);

      if (this.objectSelectionService && !isSentForUrlCalculationPurpose) {
        this.objectSelectionService.setSelectedObject(receiver.fullSnapInId, message);
      }
    });

    const processedPanes: Map<string, PaneStore> = new Map<string, PaneStore>();

    sniMap.forEach(receiver => {
      receiver.hostingPanesIds.forEach((paneId: string) => {
        if (targetPanes.find(p => p.fullPaneId.frameId === receiver.fullSnapInId.frameId &&
          p.fullPaneId.paneId === paneId) != null) {
          this.processPane(receiver.fullSnapInId.frameId, paneId, processedPanes, preselection, sniMap, state,
            avoidSelectSnapInOnFocus);
        }
      });
    });

  }

  private processPane(frameId: string,
    paneId: string,
    processedPanes: Map<string, PaneStore>,
    preselection: boolean | null,
    sniMap: Map<string, SnapInStore>,
    state: HfwState,
    avoidSelectSnapInOnFocus: boolean): void {
    if (!processedPanes.has(paneId)) {
      let snapInOnFocus: FullSnapInId;
      let needToChangeSnapInOnFocus = false;
      const paneStore: PaneStore = state.getPaneStoreViaIds(frameId, paneId);

      const selectedSnapInStore: SnapInStore | null = state.getSnapInStoreViaIds(frameId, paneStore.selectedSnapInIdValue);
      if (avoidSelectSnapInOnFocus === false &&
        preselection &&
        (selectedSnapInStore == null ||
          selectedSnapInStore.canLoseFocusOnPreselection ||
          !sniMap.has(paneStore.selectedSnapInIdValue))) {
        needToChangeSnapInOnFocus = true;
        snapInOnFocus = PaneStore.getMostImportantInMap(paneStore.paneConfig!, sniMap);
      } else {
        if (selectedSnapInStore != null) {
          snapInOnFocus = selectedSnapInStore.fullSnapInId;
        } else {
          snapInOnFocus = PaneStore.getMostImportantInMap(paneStore.paneConfig!, sniMap);
        }
      }

      const frameStore: FrameStore | null = state.getFrameStoreViaId(snapInOnFocus!.frameId);
      if (frameStore != null && paneStore != null) {
        if (!frameStore.isLockedValue) {
          paneStore.open();
        }
        // check and set snap-in that will be put in foreground
        if (needToChangeSnapInOnFocus || isNullOrUndefined(paneStore.selectedSnapInIdValue)) {
          paneStore.selectSnapIn(snapInOnFocus!.snapInId);
        }
      }

      processedPanes.set(paneId, paneStore);
    }
  }

  private setTabVisibility(frameMap: Map<string, Map<string, SnapInStore>>,
    targetPanes: PaneStore[],
    sender: FullSnapInId | null,
    state: HfwState,
    secondarySelectionInSinglePane: boolean): void {

    frameMap.forEach((sniMap, frameId) => {
      // show reached snap-in tabs
      sniMap.forEach((reciever, _key, _map) => {
        reciever.isTabVisible = true;
        const processedPanes: Map<string, PaneStore> = new Map<string, PaneStore>();

        reciever.hostingPanesIds.forEach((paneId: string) => {
          const paneStore: PaneStore | undefined = targetPanes.find(p => p.fullPaneId.frameId === frameId && p.fullPaneId.paneId === paneId);
          if (paneStore && paneStore != null) {
            this.hideUneffecteSnapin(paneStore, processedPanes, _map, sender!, state, secondarySelectionInSinglePane);
          }
        });
      });
    });
  }

  private hideUneffecteSnapin(pane: PaneStore,
    processedPanes: Map<string, PaneStore>,
    targetMap: Map<string, SnapInStore>,
    sender: FullSnapInId,
    state: HfwState,
    secondarySelectionInSinglePane: boolean): void {
    if (!processedPanes.has(pane.fullPaneId.paneId)) {

      // hide remaining snap-in tabs
      for (const sni of pane.paneConfig!.snapInReferences) {
        if (targetMap.get(sni.id) == null) {
          const sniStore: SnapInStore = state.getSnapInStoreViaIds(pane.fullPaneId.frameId, sni.id)!;
          const isSenderSnapin = FullSnapInId.areEqual(sender, sniStore.fullSnapInId);
          if (isSenderSnapin === true) {
            if (secondarySelectionInSinglePane !== true) {
              sniStore.isTabVisible = false;
            }
          } else {
            sniStore.isTabVisible = false;
          }
        }
      }
      processedPanes.set(pane.fullPaneId.paneId, pane);
    }
  }

  private selectMatchingLayout(frameMap: Map<string, Map<string, SnapInStore>>, state: HfwState): boolean {
    let isChangingLayout = false;

    frameMap.forEach((snapInMap, frameKey) => {
      const frame: FrameStore | null = state.getFrameStoreViaId(frameKey);

      const targetPanes: string[] = [];
      snapInMap.forEach((sni: SnapInStore) => {
        sni.hostingPanesIds.forEach((paneId: string) => {
          if (targetPanes.find(s => s === paneId) == null) {
            targetPanes.push(paneId);
          }
        });
      });

      // if some pane is missing from the current layout
      if (!targetPanes.every(p => this.paneIsInLayout(p, frame.paneIdsPerLayout.get(frame.selectedLayoutIdValue)!))) {
        // find the missing pane in the current layout
        const paneId: string | undefined = targetPanes.find(p => !this.paneIsInLayout(p, frame!.paneIdsPerLayout.get(frame!.selectedLayoutIdValue)!));
        const paneFullId: FullPaneId = new FullPaneId(frameKey, paneId!);

        // check if current layout has a onLayoutChange definition
        const currentLayout: LayoutInstance | undefined = frame.availableLayoutsValue.find(l => l.id === frame.selectedLayoutIdValue);
        if (currentLayout?.onLayoutChange != null && frame?.availableLayoutsValue.find(l => l.id === currentLayout?.onLayoutChange) != null &&
          this.paneIsInLayout(paneId!, frame.paneIdsPerLayout.get(currentLayout.onLayoutChange)!)) {
          frame.selectLayout(currentLayout.onLayoutChange);
          isChangingLayout = true;
        } else {
          this.stateService.selectFirstAvailableLayoutForPane(paneFullId);
          isChangingLayout = true;
        }
      }
    });
    return isChangingLayout;
  }

  private paneIsInLayout(paneKey: string, panes: string[]): boolean {
    return panes.includes(paneKey);
  }

  // private isMobileSender(sender: FullPaneId): boolean {
  //   let res: boolean = false;
  //   const senderPane: PaneStore = this.stateService.getPaneStore(sender);
  //   if (senderPane != null &&
  //     senderPane.paneConfig.mobileNavigation === true) {
  //     res = true;
  //   }
  //   return res;
  // }

  private sendMessageAfterQParamChange(qParamStore: QParamStore, qParam: QParam/* value: string*/): void {
    if (qParamStore == null || qParamStore.qParamService == null) {
      this.trace.debug(TraceModules.msgBroker, 'queryParameterService not provided.');
      return;
    }
    this.trace.info(TraceModules.msgBroker, 'Getting message parameters for new qParam: [channel: %s, value: %s], to %s service',
      qParam.name, qParam.value, qParamStore.config.id);
    qParamStore.qParamService.getMessageParameters(qParam.name, qParam.value).subscribe((message: MessageParameters) => {
      this.trace.debug(TraceModules.msgBroker, 'getMessageParameters returns. result: %s', JSON.stringify(message));
      if (message !== null) {
        this.isProcessingQParamChange = true;
        this.sendMessageFromQParamService(
          FullQParamId.createFrom(qParam.name),
          message.types,
          message.messageBody,
          true,
          qParam,
          false,
          null,
          true).subscribe((res: boolean) => {
          this.trace.debug(TraceModules.msgBroker, 'SendMessageAfterQParamChange completed. result: %s', res);
        });
      }
    });
  }

  private subscribeqParamChangeDetected(): void {
    if (this.stateService.qParamChangeDetected != null) {
      this.stateService.qParamChangeDetected.subscribe((data: QParamChange) => {
        if (data != null) {
          const qParamStore: QParamStore = this.stateService.currentState.getQParamStore(data.qParamFullId)!;
          this.sendMessageAfterQParamChange(qParamStore, { name: data.qParamFullId!.fullId(), value: data.value });
        }
      });
    }
  }

  private traceIncomingMessage(msg: HfwMessageParam): void {
    const sender: string = this.getMessageSender(msg);
    const secondarySelectionInSingle: boolean | undefined = (msg instanceof SnapinMessageParam) ? msg.secondarySelectionInSinglePane : undefined;
    const qParamString: string | null = (isNullOrUndefined(msg.qParam)) ? null : `${msg.qParam!.name}:${msg.qParam!.value}`;

    this.trace.info(TraceModules.msgBroker,
      '\nincoming message from %s\nmessageTypes=%s; preselect=%s; broadcast=%s; ruleId=%s; qParam:%s; secondarySelectionInSingle:%s',
      sender, msg.messageTypes.join('-'), msg.preselection, msg.broadcast, msg.applyRuleId, qParamString, secondarySelectionInSingle);
    if (this.trace.isDebugEnabled(TraceModules.msgBroker)) {
      this.trace.debug(TraceModules.msgBroker, 'message body:\n%s', HfwUtility.serializeObject(msg.messageBody));
    }
  }

  private traceOutgoingMessage(fullId: FullSnapInId, preselect: boolean | null, messageTypes: string[]): void {
    this.trace.info(TraceModules.msgBroker,
      '\noutgoing message to %s\nmessageTypes=%s; preselect=%s', fullId.fullId(), messageTypes.join('-'), preselect);
  }

  private getMessageSender(msg: HfwMessageParam): string {
    let res = '';
    if (msg instanceof SnapinMessageParam) {
      res = msg.fullId.fullId();
    } else {
      if (msg instanceof QParamServiceMessageParam && msg.sender != null) {
        res = msg.sender.fullId();
      } else {
        if (msg instanceof ComponentMessageParam) {
          res = msg.senderFrameId + '.' + msg.senderId;
        }
      }
    }
    return res;
  }
}
