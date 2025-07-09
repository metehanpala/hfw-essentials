import { isNullOrUndefined } from '@gms-flex/services-common';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { FavoriteLayoutsPerRange } from '../../state/user-settings.handler';
import { Docked, HfwFrame, LayoutInstance, SnapInReference, Splitter } from '../hldl/hldl-data.model';
import { LayoutUtilities } from '../utils/layout-utilities';
import { PaneStore } from './pane.store';
import { QParamStore } from './qparam-store';
import { SnapInStore } from './snapin.store';
import { SplitterStore } from './splitter.store';

export class FrameStore {

  // Map containing couples Key-<layoutId> Value-<paneIdsArray>
  public paneIdsPerLayout: Map<string, string[]> = new Map<string, string[]>();

  public hasBeenNavigatedOnce = false;

  public isFullScreenToReset = false;

  public favoriteLayoutsPerRange: FavoriteLayoutsPerRange = {};

  public layoutFittingMap: Map<string, boolean> = new Map<string, boolean>();

  // Available Layouts basing on mediaQuery
  private readonly _availableLayouts: BehaviorSubject<LayoutInstance[]> = new BehaviorSubject<LayoutInstance[]>(null!);

  private _selectedLayoutId: BehaviorSubject<string> = new BehaviorSubject<string>('');

  private readonly _selectedViewId: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);

  private _isLocked: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private readonly _rightPanelMessage: BehaviorSubject<any> = new BehaviorSubject(null);

  public get id(): string {
    return this.frameConfig.id;
  }

  public get docked(): Docked {
    return this.frameConfig.docked;
  }

  public get selectedViewId(): Observable<string | undefined> {
    return this._selectedViewId.asObservable();
  }

  public get selectedViewIdValue(): string | undefined {
    return this._selectedViewId.getValue();
  }

  public get selectedLayoutId(): Observable<string> {
    return this._selectedLayoutId.asObservable().pipe(filter(value => value !== ''));
  }

  public get selectedLayoutIdValue(): string {
    return this._selectedLayoutId.getValue();
  }

  public get availableLayouts(): Observable<LayoutInstance[]> {
    return this._availableLayouts.asObservable();
  }

  public get availableLayoutsValue(): LayoutInstance[] {
    return this._availableLayouts.getValue();
  }

  public get isLocked(): Observable<boolean> {
    return this._isLocked.asObservable();
  }

  public get isLockedValue(): boolean {
    return this._isLocked.getValue();
  }

  public static clone(source: FrameStore): FrameStore {

    const res: FrameStore = new FrameStore(source.frameConfig,
      FrameStore.cloneSnapInInstanceMap(source),
      FrameStore.clonePaneMap(source),
      FrameStore.cloneSplitterMap(source),
      QParamStore.clone(source.qParamStore)
    );
    res.hasBeenNavigatedOnce = source.hasBeenNavigatedOnce;
    // favoriteLayoutsPerRange ??
    if (source.selectedLayoutIdValue) {
      res.selectLayout(source.selectedLayoutIdValue);
    }
    // _isLocked ??
    return res;
  }

  public static cloneSplitterMap(source: FrameStore): Map<string, SplitterStore> {
    const res = new Map<string, SplitterStore>();
    source.splitterStoreMap.forEach((split, id) => {
      res.set(id, SplitterStore.clone(split));
    });
    return res;
  }

  public static clonePaneMap(source: FrameStore): Map<string, PaneStore> {
    const res = new Map<string, PaneStore>();
    if (source?.paneMap) {
      source.paneMap.forEach((pane, id) => {
        res.set(id, PaneStore.clone(pane));
      });
    }
    return res;
  }

  public static cloneSnapInInstanceMap(sourceFrame: FrameStore): Map<string, SnapInStore> {
    const res = new Map<string, SnapInStore>();
    sourceFrame.snapInInstanceMap.forEach((snapIn, id) => {
      res.set(id, SnapInStore.clone(snapIn));
    });
    return res;
  }

  public constructor(public frameConfig: HfwFrame,
    public snapInInstanceMap: Map<string, SnapInStore>,
    public paneMap: Map<string, PaneStore>,
    public splitterStoreMap: Map<string, SplitterStore>,
    public qParamStore: QParamStore | null) {

    this.fillLayoutMap();
    this.updateAvailableLayouts();
    if (this.frameConfig) {
      this.layoutFittingMap = LayoutUtilities.layoutMapCreator(this.frameConfig);
    }
  }

  /*
   * Returns message observable.
   */
  public get rightPanelMessage(): Observable<any> {
    return this._rightPanelMessage.asObservable();
  }

  public sendRightPanelMessage(message: any): void {
    if (this._rightPanelMessage != null) {
      this._rightPanelMessage.next(message);
    }
  }

  public selectLayout(id: string): void {
    this._selectedLayoutId.next(id);
  }

  public selectView(id: string): void {
    this._selectedViewId.next(id);
  }

  public lockUnlock(): void {
    this._isLocked.next(!this._isLocked.getValue());
  }

  public dispose(): void {
    if (!isNullOrUndefined(this.snapInInstanceMap)) {
      this.snapInInstanceMap.forEach((snapin: SnapInStore) => {
        snapin.dispose();
      });
      this.snapInInstanceMap.clear();
    }
    if (!isNullOrUndefined(this.paneMap)) {
      this.paneMap.forEach((value: PaneStore) => {
        value.dispose();
      });
      this.paneMap.clear();
    }
    this.paneMap = null!;
    this._isLocked.complete();
    this._isLocked = null!;
    this._selectedLayoutId.complete();
    this._selectedLayoutId = null!;
    this.frameConfig = null!;
  }

  public resetPaneFullScreenState(): void {
    this.paneMap?.forEach(store => store.setFullScreen(false));
  }

  public resetPaneState(paneId: string): void {
    if (this.paneMap?.has(paneId)) {
      const pane: PaneStore = this.paneMap.get(paneId)!;
      pane.selectSnapIn(null!);
      if (pane.paneConfig) {
        pane.paneConfig.snapInReferences.forEach((sniRef: SnapInReference) => {
          const sni: SnapInStore | undefined = this.snapInInstanceMap.get(sniRef.id);
          if (sni != null && sni != undefined) {
            sni.isTabVisible = false;
          }
        });
      }
    }
  }

  public selectPreferredSnapIn(viewId: string): void {
    if (this.frameConfig.views) {
      const view = this.frameConfig.views.find(v => v.id === viewId);
      if (view?.preferredSnapin?.snapinId) {
        const paneStore = this.paneMap.get(view.preferredSnapin.paneId);
        if (paneStore) {
          paneStore.selectSnapIn(view.preferredSnapin.snapinId);
        }
      }
    }
  }

  public updateAvailableLayouts(changingViewId?: string): void {
    const view = (changingViewId) ? changingViewId : this.selectedViewIdValue;
    const availableLayouts = this.getAvailableLayoutsOnView(view);
    this._availableLayouts.next(availableLayouts);
  }

  public getAvailableLayoutsOnView(viewId: string | undefined): LayoutInstance[] {
    if (isNullOrUndefined(this.frameConfig.layoutInstances)) {
      return [];
    }
    let availableLayouts = this.frameConfig.layoutInstances.filter((l: LayoutInstance) => isNullOrUndefined(l.mediaQuery) ||
      window.matchMedia(l.mediaQuery!).matches);
    const selectedView = this.frameConfig.views?.find(v => v.id === viewId);
    if (selectedView && selectedView.viewLayouts?.length > 0) {
      availableLayouts = availableLayouts.filter((l: LayoutInstance) => selectedView.viewLayouts.find(vl => vl.id === l.id));
    }

    return availableLayouts;
  }

  public getSplitterSettings(): string {
    const obj: { [key: string]: any } = {};
    this.splitterStoreMap.forEach((value, key) => {
      (obj[key] = value.getSplitterChangesValue());
    });
    return JSON.stringify(obj).replace(/"/g, '\'');
  }

  public getPaneFullScreenSettings(): string {
    const obj: { [key: string]: any } = {};
    this.paneMap?.forEach((value, key) => {
      if (value.getFullScreen()) {
        obj[key] = true;
      }
    });
    return JSON.stringify(obj).replace(/"/g, '\'');
  }

  public getFavoriteLayoutsPerRange(): FavoriteLayoutsPerRange {
    return this.favoriteLayoutsPerRange;
  }

  private fillLayoutMap(): void {
    if (isNullOrUndefined(this.frameConfig.layoutInstances)) {
      return;
    }
    if (this.frameConfig) {
      this.frameConfig.layoutInstances.forEach(l => {
        const paneIds: string[] = [];

        if (!isNullOrUndefined(l.paneInstance)) {
          paneIds.push(l.paneInstance.id);
        } else {
          if (l.splitter) {
            this.fillSplitter(l.splitter, paneIds);
          }
        }
        this.paneIdsPerLayout.set(l.id, paneIds);
      });
    }
  }

  private fillSplitter(splitter: Splitter, paneIds: string[]): void {
    if (this.checkSplitter(splitter)) {
      paneIds.push(splitter.firstChild.paneInstance.id);
    } else {
      if (!isNullOrUndefined(splitter.firstChild.splitter)) {
        this.fillSplitter(splitter.firstChild.splitter, paneIds);
      }
    }
    if (!isNullOrUndefined(splitter) && !isNullOrUndefined(splitter.secondChild)) {
      if (!isNullOrUndefined(splitter.secondChild.paneInstance)) {
        paneIds.push(splitter.secondChild.paneInstance.id);
      } else {
        if (!isNullOrUndefined(splitter.secondChild.splitter)) {
          this.fillSplitter(splitter.secondChild.splitter, paneIds);
        }
      }
    }
  }

  private checkSplitter(splitter: Splitter): boolean {
    if (!isNullOrUndefined(splitter) && !isNullOrUndefined(splitter.firstChild) && !isNullOrUndefined(splitter.firstChild.paneInstance)) {
      return true;
    }
    return false;
  }

}
