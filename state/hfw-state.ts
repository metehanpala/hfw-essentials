import { isNullOrUndefined, ModeData, SettingsServiceBase } from '@gms-flex/services-common';
import { BehaviorSubject, Observable } from 'rxjs';

import { FullPaneId } from '../../common/fullsnapinid/full-pane-id.model';
import { FullQParamId } from '../../common/fullsnapinid/full-qparam-id.model';
import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { IPreselectionService } from '../../common/interfaces/ipreselection.service';
import { IStorageService } from '../../common/interfaces/istorage.service';
import { fullScreenSettingsPrefix } from '../settings/settings.service';
import { CommunicationRule, SnapInReference } from '../shared/hldl/hldl-data.model';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { QParamStore } from '../shared/stores/qparam-store';
import { SnapInStore } from '../shared/stores/snapin.store';
import { AppStatus } from './app-status.model';
import { MODE_QPARAM } from './qparams-handler';

/**
 * Class representing an hfw application state.
 *
 * @export
 * @class HfwState
 */
export class HfwState {

  public frameMap!: Map<string, FrameStore>;
  // public selections: Map<string, any>;

  // // map composed by frameId modeId, qParamMap [fullQParamId - value]
  // public qParams: Map<string, Map<string, Map<string, string>>> = new Map<string, Map<string, Map<string, string>>>();

  // map composed by qParamMap [fullQParamId - value]
  public qParams: Map<string, string> = new Map<string, string>();

  public modeQParams: Map<string, string> = new Map<string, string>();

  public appStatus: AppStatus = AppStatus.Initializing;

  public switchingFrameId: string | null = null;

  private readonly _activeWorkAreaId: BehaviorSubject<string> = new BehaviorSubject<string>(null!);

  private readonly _selectedMode: BehaviorSubject<ModeData | null> = new BehaviorSubject<ModeData | null>(null);

  public static clone(sourceState: HfwState): HfwState {
    const res = new HfwState();

    // frameMap
    res.frameMap = HfwState.cloneFrameMap(sourceState);

    // qParams
    res.qParams = HfwState.cloneQParams(sourceState.qParams);

    // set activeWorkArea
    res.changeWorkAreaFrame(sourceState.activeWorkAreaIdValue);

    return res;
  }

  public static cloneQParams(sourceMap: Map<string, string>): Map<string, string> {
    const res = new Map<string, string>();
    sourceMap.forEach((qParam, qParamKey) => {
      res.set(qParamKey, (' ' + qParam).slice(1));
    });
    return res;
  }

  public static cloneFrameMap(sourceState: HfwState): Map<string, FrameStore> {
    const res = new Map<string, FrameStore>();
    sourceState.frameMap.forEach((frame, id) => {
      res.set(id, FrameStore.clone(frame));
    });
    return res;
  }

  public get activeWorkAreaId(): Observable<string> {
    return this._activeWorkAreaId.asObservable();
  }

  public get activeWorkAreaIdValue(): string {
    return this._activeWorkAreaId.value;
  }

  public changeWorkAreaFrame(id: string): void {
    this._activeWorkAreaId.next(id);
  }

  /**
   * Returns the array of FrameStores.
   */
  public getFramesStore(): FrameStore[] | null {
    if (this.frameMap != null) {
      return Array.from(this.frameMap.values());
    } else {
      return null;
    }
  }

  /**
   * Returns the FrameStore of the specified ids.
   */
  public getFrameStoreViaId(frameId: string): FrameStore {
    return ((this.frameMap != null) ? this.frameMap.get(frameId) : null)!;
  }

  /**
   * Returns an array of SnapInInstance information from the gived array of snapin instances.
   */
  public getSnapInsFromPaneId(frameId: string, paneId: string): SnapInStore[] | null {
    const pane: PaneStore = this.getPaneStoreViaIds(frameId, paneId);
    const frame: FrameStore | null = this.getFrameStoreViaId(frameId);
    if (pane?.paneConfig?.snapInReferences != null) {
      const snapins: SnapInStore[] = [];
      pane.paneConfig.snapInReferences.forEach((sni: SnapInReference) => {
        if (frame?.snapInInstanceMap.get(sni.id) != undefined) {
          snapins.push(frame.snapInInstanceMap.get(sni.id)!);
        }
      });
      return snapins;
    }
    return null;
  }

  /**
   * Returns the PaneStore of the specified fullId.
   */
  public getPaneStore(fullId: FullPaneId): PaneStore | null {
    if (fullId != null) {
      return this.getPaneStoreViaIds(fullId.frameId, fullId.paneId);
    } else {
      return null;
    }
  }

  /**
   * Returns the PaneStore of the specified ids.
   */
  public getPaneStoreViaIds(frameId: string, paneId: string): PaneStore {
    if (frameId != null && paneId != null) {
      const frame: FrameStore | null = this.getFrameStoreViaId(frameId);
      if (frame?.paneMap != null) {
        return frame.paneMap.get(paneId)!;
      }
    }
    return null!;
  }

  /**
   * Returns the SnapInReference of the specified fullId and location.
   * As well as the snap-in is hosted in a right panel.
   */
  public getSnapInReference(fullId: FullSnapInId, location: FullPaneId): SnapInReference | null {
    const snapInStore = this.getSnapInStore(fullId);
    if (snapInStore != null) {
      const paneStore = this.getPaneStoreViaIds(fullId.frameId, location.paneId);
      if (!isNullOrUndefined(paneStore)) {
        return paneStore.paneConfig!.snapInReferences.find(s => s.id === fullId.snapInId)!;
      }
    }
    return null;

  }

  /**
   * Returns the snapin communication rules of the specified fullId.
   */
  public getSnapInCommRules(fullId: FullSnapInId, location: FullPaneId): CommunicationRule[] | null {
    const sniReference: SnapInReference | null = this.getSnapInReference(fullId, location);
    if (!isNullOrUndefined(sniReference)) {
      return sniReference!.communicationRules;
    }
    return null;
  }

  /**
   * Returns the SnapinInfo of the specified Ids.
   */
  public getSnapInStoreViaIds(frameId: string, sniId: string): SnapInStore | null {
    if (frameId != null && sniId != null) {
      const frame: FrameStore | null = this.getFrameStoreViaId(frameId);
      if (frame?.snapInInstanceMap != null && frame.snapInInstanceMap.get(sniId) != undefined) {
        return frame.snapInInstanceMap.get(sniId)!;
      }
    }
    return null;
  }

  /**
   * Returns the SnapinInfo of the specified fullId.
   */
  public getSnapInStore(fullId: FullSnapInId): SnapInStore | null {
    if (fullId != null) {
      return this.getSnapInStoreViaIds(fullId.frameId, fullId.snapInId);
    }
    return null;
  }

  public getCurrentPaneFullId(fullId: FullSnapInId): FullPaneId {
    if (!isNullOrUndefined(fullId)) {
      const snapinStore = this.getSnapInStore(fullId);
      const frameStore = this.getFrameStoreViaId(fullId.frameId);
      if (!isNullOrUndefined(snapinStore) && !isNullOrUndefined(frameStore) && frameStore.selectedLayoutIdValue) {
        const currentPanes = frameStore.paneIdsPerLayout.get(frameStore.selectedLayoutIdValue);
        let paneId: string;
        snapinStore!.hostingPanesIds.forEach(p => {
          if (currentPanes?.includes(p)) {
            paneId = p;
          }
        });
        if (!isNullOrUndefined(paneId!)) {
          return new FullPaneId(fullId.frameId, paneId!);
        }
      }

    }
    return null!;
  }

  /**
   * Returns the snapin communication rules of the specified QParamService.
   */
  public getQParamServiceCommRules(fullId: FullQParamId): CommunicationRule[] | null {
    if (fullId != null) {
      const frameStore: FrameStore | null = this.getFrameStoreViaId(fullId.frameId);
      if (frameStore?.frameConfig != null && frameStore.qParamStore) {
        const qParamSrv = frameStore.frameConfig.qParamServices.find(q => q.id === fullId.typeId);
        if (qParamSrv) {
          const channel = qParamSrv.channels!.find(c => c.id === fullId.channelId);
          if (channel) {
            return channel.communicationRules;
          }
        }
      }
    }
    return null;
  }

  public getQParamStore(fullId: FullQParamId | undefined): QParamStore | null {
    if (fullId != null) {
      const frameStore: FrameStore = this.getFrameStoreViaId(fullId.frameId)!;
      return frameStore.qParamStore;
    }
    return null;
  }

  public getPreselectionService(fullId: FullSnapInId): IPreselectionService | null {
    if (fullId != null) {
      const sni: SnapInStore | null = this.getSnapInStore(fullId);
      if (sni != null) {
        return sni.preselectionService;
      }
    }
    return null;
  }

  public getStorageService(fullId: FullSnapInId): IStorageService | null {
    if (fullId != null) {
      const sni: SnapInStore | null = this.getSnapInStore(fullId);
      if (sni != null) {
        return sni.storageService;
      }
    }
    return null;
  }

  public getFirstTabVisibleInPane(paneStore: PaneStore): string {
    let res!: string;
    if (paneStore?.paneConfig?.snapInReferences != null) {
      for (const snapInReference of paneStore.paneConfig.snapInReferences) {
        const snapinStore = this.getSnapInStoreViaIds(paneStore.fullPaneId.frameId, snapInReference.id);
        if (snapinStore?.isTabVisible) {
          res = snapinStore.snapInId;
          break;
        }
      }
    }
    return res!;
  }

  public get selectedMode(): Observable<ModeData | null> {
    return this._selectedMode.asObservable();
  }

  public get selectedModeValue(): ModeData | null {
    return this._selectedMode.getValue();
  }

  public changeSelectedMode(mode: ModeData): void {
    this._selectedMode.next(mode);
  }

  public isPaneReachable(fullId: FullPaneId): boolean {
    const frame: FrameStore = this.getFrameStoreViaId(fullId.frameId)!;
    return frame.availableLayoutsValue.some(l => this.paneIsInLayout(frame, fullId.paneId, l.id) === true);
  }

  public paneIsInLayout(frame: FrameStore, paneId: string, layoutId: string | null): boolean {
    if (layoutId !== null && frame?.paneIdsPerLayout?.has(layoutId) &&
      frame.paneIdsPerLayout!.get(layoutId)!.findIndex(p => p === paneId) >= 0) {
      return true;
    } else {
      return false;
    }
  }

  public isPaneVisibleInCurrentLayout(fullId: FullPaneId): boolean {
    // first check if pane is not closed
    const pane: PaneStore | null = this.getPaneStore(fullId);
    if (pane != null && !pane.isVisibleValue) {
      return false;
    }

    // then check is in current layout
    const frame: FrameStore = this.getFrameStoreViaId(fullId.frameId)!;
    return this.paneIsInLayout(frame, fullId.paneId, frame.selectedLayoutIdValue);
  }

  public getFirsLayoutIdWithoutPane(frame: FrameStore, paneId: string): string | null {
    if (frame != null) {
      for (const layout of frame.availableLayoutsValue) {
        const res: boolean = this.paneIsInLayout(frame, paneId, layout.id);
        if (!res) {
          return layout.id;
        }
      }
    }
    return null;
  }

  public getAppQParamAndModeQParam(): Map<string, string> {
    const resultQParamMap = new Map<string, string>();
    if (this.qParams) {
      this.qParams.forEach((value, key) => {
        resultQParamMap.set(key, value);
      });
    }
    if (!isNullOrUndefined(this.modeQParams)) {
      if (this.modeQParams.has(MODE_QPARAM)) {
        // copy mode QParam.
        this.modeQParams.forEach((value, key) => {
          resultQParamMap.set(key, value);
        });
      }
    }
    return resultQParamMap;
  }

  public getModeQParam(modeId: string): Map<string, string> | null {
    if (!isNullOrUndefined(this.modeQParams)) {
      if (this.modeQParams.has(MODE_QPARAM) &&
        this.modeQParams.get(MODE_QPARAM) === modeId) {
        return this.modeQParams;
      }
    }
    return null;
  }

  public setModeQParam(selectedModeId: string): void {
    if (isNullOrUndefined(this.modeQParams)) {
      this.modeQParams = new Map<string, string>();
    }
    this.modeQParams.set(MODE_QPARAM, selectedModeId);
  }

  public setFrameSettings(frameStore: FrameStore, frameId: string, settingsService: SettingsServiceBase): void {
    if (frameStore != null) {
      const fullScreenSettings: string = frameStore.getPaneFullScreenSettings();
      settingsService.putSettings(fullScreenSettingsPrefix + frameId, fullScreenSettings).subscribe();
    }
  }

  public dispose(): void {
    this.frameMap.forEach(frame => {
      frame.dispose();
    });
  }
}
