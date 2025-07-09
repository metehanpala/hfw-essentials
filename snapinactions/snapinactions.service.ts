import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable } from 'rxjs';

import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { ISnapInActions } from '../../common/interfaces/isnapinactions.service';
import { SnapInActions } from '../../common/interfaces/snapin-actions.model';
import { TraceModules } from '../shared/trace/trace-modules';

/**
 * Service for handling snapin actions to be inserted in hfw pane header.
 */
@Injectable({
  providedIn: 'root'
})
export class SnapinActionsService implements ISnapInActions {

  private readonly actions: Map<string, BehaviorSubject<SnapInActions>> = new Map<string, BehaviorSubject<SnapInActions>>();

  constructor(private readonly traceService: TraceService) {
    this.traceService.info(TraceModules.snapInActions, 'SnapinActionsService created');
  }

  public getSnapInActions(fullId: FullSnapInId): Observable<SnapInActions> {
    this.traceService.info(TraceModules.snapInActions, 'SnapInActionsService getSnapInActions: ', fullId.fullId());
    if (fullId && this.actions.has(fullId.fullId())) {
      return this.actions.get(fullId.fullId())!.asObservable();
    }
    this.actions.set(fullId.fullId(), new BehaviorSubject<SnapInActions>(null!));
    return this.actions.get(fullId.fullId())!.asObservable();
  }

  public setSnapInActions(fullId: FullSnapInId, actions: SnapInActions): void {
    this.traceService.info(TraceModules.snapInActions, 'SnapInActionsService setSnapInActions: ', fullId.fullId(), actions);
    if (!this.actions.has(fullId.fullId()) || this.actions.get(fullId.fullId()) === undefined) {
      this.actions.set(fullId.fullId(), new BehaviorSubject<SnapInActions>(actions));
    } else {
      if (this.actions?.get(fullId.fullId())) {
        this.actions.get(fullId.fullId())!.next(actions);
      }
    }
  }
}
