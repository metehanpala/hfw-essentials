import { BehaviorSubject, Observable } from 'rxjs';

import { FullPaneId } from '../../../common/fullsnapinid/full-pane-id.model';
import { FullSnapInId } from '../../../common/fullsnapinid/fullsnapinid.model';
import { Pane } from '../hldl/hldl-data.model';
import { SnapInStore } from './snapin.store';

export class PaneStore {

  public fullPaneId!: FullPaneId;

  private _isVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  private _selectedSnapInId: BehaviorSubject<string> = new BehaviorSubject<string>(null!);

  private readonly _isFullScreen: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // returns true if there is a Layout wich can display the pane or not.
  private readonly _isDisplayable: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private _tabChangeInProgress = false;

  public static clone(source: PaneStore): PaneStore {
    const pane = new PaneStore(source.paneConfig);

    pane.fullPaneId = new FullPaneId(source.fullPaneId.frameId, source.fullPaneId.paneId);

    const isVisible = source.isVisibleValue;
    if (!isVisible) {
      pane.close();
    }
    pane.selectSnapIn(source.selectedSnapInIdValue);
    pane.setIsDisplayable(source.isDisplayableValue);

    return pane;
  }

  public static getMostImportantInMap(pane: Pane, sniMap: Map<string, SnapInStore>): FullSnapInId {
    let res: FullSnapInId;

    if (pane?.snapInReferences != null && sniMap != null) {

      for (const reference of pane.snapInReferences) {
        if (sniMap.has(reference.id)) {
          res = sniMap.get(reference.id)!.fullSnapInId;
          break;
        }
      }
    }
    return res!;
  }

  public get isVisible(): Observable<boolean> {
    return this._isVisible.asObservable();
  }

  public get isVisibleValue(): boolean {
    return this._isVisible.getValue();
  }

  public get isDisplayable(): Observable<boolean> {
    return this._isDisplayable.asObservable();
  }

  public get isDisplayableValue(): boolean {
    return this._isDisplayable.getValue();
  }

  public get selectedSnapInId(): Observable<string> {
    return this._selectedSnapInId.asObservable();
  }

  public get selectedSnapInIdValue(): string {
    return this._selectedSnapInId.getValue();
  }

  public get tabChangeInProgress(): boolean {
    return this._tabChangeInProgress;
  }

  public constructor(public paneConfig: Pane | null) {
    if (this.paneConfig?.startAsClosed) {
      this.close();
    }
  }

  public get fullScreen(): Observable<boolean> {
    return this._isFullScreen.asObservable();
  }

  public getFullScreen(): boolean {
    return this._isFullScreen.getValue();
  }

  public open(): void {
    this._isVisible.next(true);
  }

  public close(): void {
    this._isVisible.next(false);
  }

  public selectSnapIn(id: string): void {
    if (id !== this.selectedSnapInIdValue) {
      this._selectedSnapInId.next(id);
    }
  }

  public setIsDisplayable(value: boolean): void {
    this._isDisplayable.next(value);
  }

  public setTabChangeInProgress(value: boolean): void {
    this._tabChangeInProgress = value;
  }

  public setFullScreen(value: boolean): void {
    if (value !== this._isFullScreen.getValue()) {
      this._isFullScreen.next(value);
    }
  }

  public dispose(): void {
    this._isVisible.complete();
    this._isVisible = null!;
    this._selectedSnapInId.complete();
    this._selectedSnapInId = null!;
    this.paneConfig = null;
  }
}
