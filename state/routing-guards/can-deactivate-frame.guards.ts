import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { TraceService } from '@gms-flex/services-common';
import { Observable, of, tap } from 'rxjs';

import { IStateService } from '../../../common/interfaces/istate.service';
import { UnsavedDataReason } from '../../../common/unsaved-data/unsaved-data.model';
import { FrameComponent } from '../../frame/frame.component';
import { PaneStore } from '../../shared/stores/pane.store';
import { TraceModules } from '../../shared/trace/trace-modules';
import { GuardHelper } from './guard-helper';

@Injectable({
  providedIn: 'root'
})
export class CanDeactivateFrameGuard {

  public constructor(private readonly trace: TraceService,
    private readonly router: Router,
    private readonly stateService: IStateService) {
  }

  public canDeactivate(
    component: FrameComponent,
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): Observable<boolean> | boolean {

    const reason: UnsavedDataReason = GuardHelper.getReason(this.stateService, this.router, state, nextState);

    if (reason === UnsavedDataReason.FrameChange) {
      const paneStores: PaneStore[] = this.stateService.getCurrentPaneStores();
      this.trace.debug(TraceModules.guards,
        'CanDeactivate<FrameComponent> %s . Evaluating. reason: %s', component.id, UnsavedDataReason[reason]);
      if (this.stateService.backButton === true) {
        this.stateService.backButton = false;
        return false;
      } else {
        return this.stateService.checkUnsaved(paneStores, UnsavedDataReason.FrameChange).pipe(
          tap((res: boolean) => {
            this.trace.debug(TraceModules.guards, 'CanDeactivate<FrameComponent> %s . returns: %s ', component.id, res);
          })
        );
      }
    } else {
      if (this.stateService.backButton === true) {
        this.stateService.backButton = false;
        return false;
      } else {
        this.trace.debug(TraceModules.guards,
          'CanDeactivate<FrameComponent> %s . Returning true. reason: %s', component.id, UnsavedDataReason[reason]);
        return of(true);
      }
    }
  }
}
