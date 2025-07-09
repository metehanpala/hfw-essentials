import { isNullOrUndefined } from '@gms-flex/services-common';

import { FullPaneId } from '../../../common/fullsnapinid/full-pane-id.model';
import { FullSnapInId } from '../../../common/fullsnapinid/fullsnapinid.model';
import { IQParamService } from '../../../common/interfaces/iqparam.service';
import { HfwFrame,
  HfwInstance,
  LayoutInstance,
  Pane,
  PrimaryBarConfig,
  SnapInInstance,
  SnapInType } from '../../shared/hldl/hldl-data.model';
import { FrameStore } from '../../shared/stores/frame.store';
import { PaneStore } from '../../shared/stores/pane.store';
import { QParamStore } from '../../shared/stores/qparam-store';
import { SnapInStore } from '../../shared/stores/snapin.store';
import { SplitterStore } from '../../shared/stores/splitter.store';
import { IState } from '../istate';

export interface StateDataStructure {
  hfwInstance: HfwInstance;
  frameMap: Map<string, FrameStore>;
}

export class StateDataStructureCreator {

  /**
   * Fills the interal structures deserializing the json object recieved as input.
   */
  public static createDataStructure(hfwInstance: HfwInstance, state: IState, framesToCreate?: string[]): StateDataStructure {
    const result: StateDataStructure = { hfwInstance, frameMap: new Map<string, FrameStore>() };
    if (hfwInstance != null) {
      if (hfwInstance.hfwFrames != null) {
        if (framesToCreate) {
          hfwInstance = StateDataStructureCreator.filterFrames(hfwInstance, framesToCreate);
        }

        hfwInstance.hfwFrames.forEach(frame => {
          const frameStore: FrameStore = StateDataStructureCreator.createFrameStore(frame, hfwInstance, state);
          result.frameMap.set(frame.id, frameStore);
        });
      }
    }
    return result;
  }

  public static addFramesToDataStructure(
    addedFrames: string[], fullHldlConfig: HfwInstance, hfwInstance: HfwInstance, state: IState, framesToCreate: string[]
  ): FrameStore[] {
    let frames: FrameStore[];
    if (fullHldlConfig?.hfwFrames != null) {
      addedFrames.forEach(frameId => {
        const frame = fullHldlConfig.hfwFrames.find(f => f.id === frameId);
        if (!isNullOrUndefined(frame)) {
          const frameStore: FrameStore = StateDataStructureCreator.createFrameStore(frame!, hfwInstance, state);
          if (!frames) {
            frames = [frameStore];
          } else {
            frames.push(frameStore);
          }
          // insert frame config into current hfwInstance in the right position
          const index: number = StateDataStructureCreator.findNewFrameIndex(frame!, fullHldlConfig, hfwInstance);
          hfwInstance.hfwFrames.splice(index, 0, frame!);
        }
      });
      if (!isNullOrUndefined(hfwInstance.primaryBarConfig)) {
        hfwInstance.primaryBarConfig = StateDataStructureCreator.filterPrimaryItems(fullHldlConfig, framesToCreate);
      }
    }
    return frames!;
  }

  public static removeFrameFromDataStructure(removedFrames: string[], hfwInstance: HfwInstance, framesToCreate: string[]): void {
    if (hfwInstance?.hfwFrames != null) {
      removedFrames.forEach(frameId => {
        const index: number = hfwInstance.hfwFrames.findIndex(f => f.id === frameId);
        hfwInstance.hfwFrames.splice(index);
      });
      if (!isNullOrUndefined(hfwInstance.primaryBarConfig)) {
        hfwInstance.primaryBarConfig = StateDataStructureCreator.filterPrimaryItems(hfwInstance, framesToCreate);
      }
    }
  }

  private static findNewFrameIndex(frame: HfwFrame, fullHldlConfig: HfwInstance, hfwInstance: HfwInstance): number {
    const fullFrameIndex = fullHldlConfig.hfwFrames.findIndex(f => f.id === frame.id);
    let index = 0;
    /* eslint-disable-next-line @typescript-eslint/prefer-for-of */
    hfwInstance.hfwFrames.forEach(() => {
      const currFrameIndex = fullHldlConfig.hfwFrames.findIndex(f => f.id === frame.id);
      if (currFrameIndex <= fullFrameIndex) {
        index++;
      }
    });
    return index;
  }

  private static createFrameStore(frame: HfwFrame, hfwInstance: HfwInstance, state: IState): FrameStore {
    const snapInInstanceMap: Map<string, SnapInStore> = StateDataStructureCreator.createSnapinMap(frame, hfwInstance.snapInTypes, state);
    const paneMap: Map<string, PaneStore> = StateDataStructureCreator.createPaneMap(frame, snapInInstanceMap);
    const splitterStoreMap: Map<string, SplitterStore> = StateDataStructureCreator.createSplitterMap(frame.layoutInstances);
    const qParamStore: QParamStore | null = StateDataStructureCreator.createQParam(frame, state);
    return new FrameStore(frame, snapInInstanceMap, paneMap, splitterStoreMap, qParamStore);
  }

  private static filterFrames(hfwInstance: HfwInstance, framesToCreate: any): HfwInstance {
    hfwInstance.hfwFrames = hfwInstance.hfwFrames.filter(f => framesToCreate.includes(f.id));
    if (!isNullOrUndefined(hfwInstance.primaryBarConfig)) {
      hfwInstance.primaryBarConfig = StateDataStructureCreator.filterPrimaryItems(hfwInstance, framesToCreate);
    }
    return hfwInstance;
  }

  private static filterPrimaryItems(hfwInstance: HfwInstance, framesToCreate: any): PrimaryBarConfig {
    if (!isNullOrUndefined(hfwInstance.primaryBarConfig.primaryItems)) {
      hfwInstance.primaryBarConfig.primaryItems.forEach(pi => {
        if (!isNullOrUndefined(pi.childrenIds)) {
          pi.childrenIds = pi.childrenIds.filter(f => framesToCreate.includes(f.id));
        }
      });
      hfwInstance.primaryBarConfig.primaryItems = hfwInstance.primaryBarConfig.primaryItems.filter(pi => pi.childrenIds.length > 0);
    }
    return hfwInstance.primaryBarConfig;
  }

  private static createQParam(frame: HfwFrame, state: IState): QParamStore | null {
    if (!isNullOrUndefined(frame.qParamServices) && frame.qParamServices.length > 0) {
      const srv: IQParamService = state.getIQParamService(frame.qParamServices[0].id);
      const qParamStore = new QParamStore(frame.qParamServices[0]);
      qParamStore.qParamService = srv;
      qParamStore.frameId = frame.id;
      return qParamStore;
    }
    return null;
  }

  private static createSnapinMap(frame: HfwFrame, snapInTypes: SnapInType[], state: IState): Map<string, SnapInStore> {
    const snapInInstanceMap: Map<string, SnapInStore> = new Map<string, SnapInStore>();
    const snapins: SnapInInstance[] = frame.snapInInstances;
    if (snapins?.length != null) {
      for (const sni of snapins) {
        const sniType: SnapInType = snapInTypes.find(t => t.typeId === sni.typeId)!;
        const snapInStore: SnapInStore = this.createSnapInStore(sni, sniType, frame.id, state);
        snapInInstanceMap.set(sni.snapInId, snapInStore);
      }
    }
    return snapInInstanceMap;
  }

  private static createSnapInStore(sniInstance: SnapInInstance, sniType: SnapInType,
    frameId: string, state: IState): SnapInStore {
    const snapInStore: SnapInStore = new SnapInStore(null, sniInstance.tabTitleId ? sniInstance.tabTitleId : sniInstance.snapInId);
    snapInStore.snapInId = sniInstance.snapInId;
    snapInStore.canLoseFocusOnPreselection = sniInstance.canLoseFocusOnPreselection;
    snapInStore.fullSnapInId = new FullSnapInId(frameId, sniInstance.snapInId);
    snapInStore.preselectionService = state.getIPreselectionService(sniInstance.typeId);
    snapInStore.storageService = state.getIStorageService(sniInstance.typeId);
    if (sniType != null) {
      snapInStore.messageTypes = sniType.messageTypes;
      snapInStore.typeConfig = sniType;
    }
    return snapInStore;
  }

  private static createSplitterMap(layoutIns: LayoutInstance[]): Map<string, SplitterStore> {
    let splitterMap: Map<string, SplitterStore> = new Map<string, SplitterStore>();
    if (layoutIns != null) {
      for (const layout of layoutIns) {
        splitterMap = StateDataStructureCreator.recursiveFillSplitterMap(layout, splitterMap);
      }
    }
    return splitterMap;
  }

  private static recursiveFillSplitterMap(layout: any, splitterMap: Map<string, SplitterStore>): Map<string, SplitterStore> {
    if (!isNullOrUndefined(layout.splitter)) {
      if (!splitterMap.has(layout.splitter.id)) {
        const splitterStore = new SplitterStore(layout.splitter);
        splitterMap.set(layout.splitter.id, splitterStore);
      }
      if (layout.splitter.firstChild.splitter) {
        this.recursiveFillSplitterMap(layout.splitter.firstChild, splitterMap);
      }
      if (layout.splitter.secondChild.splitter) {
        this.recursiveFillSplitterMap(layout.splitter.secondChild, splitterMap);
      }
    }
    return splitterMap;
  }

  private static createPaneMap(frame: HfwFrame, snapInInstanceMap: Map<string, SnapInStore>): Map<string, PaneStore> {
    const paneMap: Map<string, PaneStore> = new Map<string, PaneStore>();
    if (frame.panes != null) {
      for (const pane of frame.panes) {
        const paneStore: PaneStore = new PaneStore(pane);
        paneStore.fullPaneId = new FullPaneId(frame.id, pane.id);
        this.registerAsHostingPane(pane, paneStore.fullPaneId, snapInInstanceMap);
        paneMap.set(pane.id, paneStore);
      }
    }
    return paneMap;
  }

  private static registerAsHostingPane(pane: Pane, fullPaneId: FullPaneId, snapInInstanceMap: Map<string, SnapInStore>): void {
    for (const sni of pane.snapInReferences) {
      const snapinStore: SnapInStore | undefined = snapInInstanceMap.get(sni.id); // this.getSnapInStoreViaIds(fullPaneId.frameId, sni.id);
      if (snapinStore != null && snapinStore != undefined) {
        snapinStore.hostingPanesIds.push(fullPaneId.paneId);
      }
    }
  }
}
