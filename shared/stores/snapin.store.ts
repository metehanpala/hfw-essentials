import { BehaviorSubject, Observable } from 'rxjs';

import { FullSnapInId } from '../../../common/fullsnapinid/fullsnapinid.model';
import { IPreselectionService } from '../../../common/interfaces/ipreselection.service';
import { IStorageService } from '../../../common/interfaces/istorage.service';
import { SnapInBase } from '../../../common/snapin-base/snapin.base';
import { MessageType, SnapInType } from '../hldl/hldl-data.model';
export class SnapInStore {

  /*
   * Store information about snapin type.
   */
  public typeConfig!: SnapInType;

  /*
   * The snapin instance Id in the HLDL.
   */
  public snapInId!: string;

  /*
   * Indicates if the snapin tab is visible.
   */
  public isTabVisible = true;

  public tabTitle!: string;

  public preselectionService!: IPreselectionService | null;

  public storageService!: IStorageService | null;

  public fullSnapInId!: FullSnapInId;

  public hostingPanesIds: string[] = [];

  public canLoseFocusOnPreselection!: boolean;

  // Set the future pane Id in case of reuse. Needed to calculate new FullPaneId on before attach.
  public futurePaneId!: string;

  private _message: BehaviorSubject<any> = new BehaviorSubject(null);

  private snapInBase!: SnapInBase;

  public static clone(source: SnapInStore): SnapInStore {
    const snapin = new SnapInStore(source.messageTypes, source.tabTitleResourceId);

    snapin.typeConfig = Object.assign({}, source.typeConfig);
    snapin.snapInId = (' ' + source.snapInId).slice(1);
    snapin.isTabVisible = source.isTabVisible;
    snapin.tabTitle = (' ' + source.tabTitle).slice(1);
    snapin.preselectionService = source.preselectionService; // just copy the reference.
    snapin.storageService = source.storageService; // just copy the reference.
    snapin.fullSnapInId = new FullSnapInId(source.fullSnapInId.frameId, source.snapInId);
    snapin.hostingPanesIds = source.hostingPanesIds.map(x => (' ' + x).slice(1));
    snapin.canLoseFocusOnPreselection = source.canLoseFocusOnPreselection;
    snapin.sendMessage(source.getMessageValue()); // set latest message received.

    return snapin;
  }

  public constructor(public messageTypes: MessageType[] | null, public tabTitleResourceId: string) {
  }

  /*
   * Returns message observable.
   */
  public get message(): Observable<any> {
    return this._message.asObservable();
  }

  public sendMessage(message: any): void {
    if (this._message != null) {
      this._message.next(message);
    }
  }

  public clearMessage(): void {
    if (this._message != null) {
      this._message.next(null);
    }
  }

  public getMessageValue(): any {
    return this._message.value;
  }

  public getSnapInBase(): SnapInBase {
    return this.snapInBase;
  }

  public setSnapInBase(instance: SnapInBase): void {
    this.snapInBase = instance;
  }

  public dispose(): void {
    this._message.complete();
    this._message = null!;
    this.preselectionService = null;
    this.storageService = null;
    this.fullSnapInId = null!;
  }
}
