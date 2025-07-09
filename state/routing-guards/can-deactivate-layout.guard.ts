import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { IStateService } from '../../../common/interfaces/istate.service';
import { UnsavedDataReason } from '../../../common/unsaved-data/unsaved-data.model';
import { LayoutComponent } from '../../layout/layout.component';
import { PaneStore } from '../../shared/stores/pane.store';
import { TraceModules } from '../../shared/trace/trace-modules';
import { GuardHelper } from './guard-helper';

@Injectable({
  providedIn: 'root'
})
export class CanDeactivateLayoutGuard {

  public constructor(private readonly trace: TraceService,
    private readonly router: Router,
    private readonly stateService: IStateService) {
  }

  public canDeactivate(
    component: LayoutComponent,
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): Observable<boolean> | boolean {

    const reason: UnsavedDataReason = GuardHelper.getReason(this.stateService, this.router, state, nextState);

    if (reason === UnsavedDataReason.NewSelection || // skip because unsavedata check has been already performed.
        reason === UnsavedDataReason.FrameChange || // skip because unsavedata check must be performed at frame guard level.
        reason === UnsavedDataReason.LogOut || // skip because unsavedata check must be performed at Page guard level.
        reason === UnsavedDataReason.TabChange) { // skip because unsavedata check has been already performed by snihost guard.
      this.trace.debug(TraceModules.guards,
        'CanDeactivate<LayoutComponent> %s.%s . Returning true. reason: %s', component.frameId, component.layoutConfig.id, UnsavedDataReason[reason]);
      return of(true);
    }

    const layoutId: string | null = GuardHelper.getLayoutId(this.router, nextState)!;

    if (layoutId != null) {
      if (isNullOrUndefined(component) && isNullOrUndefined(component.frameId)) {
        const paneStores: PaneStore[] = this.stateService.getPaneWontSurvive(component.frameId, layoutId);
        this.trace.debug(TraceModules.guards,
          'CanDeactivate<LayoutComponent> %s.%s . Evaluating. reason: %s', component.frameId, component.layoutConfig.id, UnsavedDataReason[reason]);
        return this.stateService.checkUnsaved(paneStores, UnsavedDataReason.LayoutChange).pipe(
          tap((res: boolean) => {
            this.trace.debug(TraceModules.guards, 'CanDeactivate<LayoutComponent> %s.%s . returns: %s ', component.frameId, component.layoutConfig.id, res);
          })
        );
      } else {
        this.trace.debug(TraceModules.guards,
          'CanDeactivate<LayoutComponent> %s.%s . Returning true. reason: %s', component.frameId, component.layoutConfig.id, UnsavedDataReason[reason]);
        return of(true);
      }
    } else {
      this.trace.debug(TraceModules.guards,
        'CanDeactivate<LayoutComponent> %s.%s . Returning true. reason: %s', component.frameId, component.layoutConfig.id, UnsavedDataReason[reason]);
      return of(true);
    }
  }
}
