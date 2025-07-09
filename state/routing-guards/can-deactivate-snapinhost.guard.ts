import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { TraceService } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { IStateService } from '../../../common/interfaces/istate.service';
import { SnapInBase } from '../../../common/snapin-base/snapin.base';
import { UnsavedDataReason } from '../../../common/unsaved-data/unsaved-data.model';
import { TraceModules } from '../../shared/trace/trace-modules';
import { SnapinHostComponent } from '../../snapin-host';
import { SnapinInstancesService } from '../snapin-instances.service';
import { GuardHelper } from './guard-helper';

@Injectable({
  providedIn: 'root'
})
export class CanDeactivateSnapInHostGuard {

  public constructor(private readonly trace: TraceService,
    private readonly stateService: IStateService,
    private readonly router: Router,
    private readonly snapinInstances: SnapinInstancesService) {
  }

  public canDeactivate(
    component: SnapinHostComponent,
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
    nextState: RouterStateSnapshot): Observable<boolean> | boolean {

    if (component == null && route?.routeConfig?.path) {
      const logName: string = (route.data?.snapinId != null) ? route.data.snapinId.fullId() : route.routeConfig.path;
      this.trace.debug(TraceModules.guards,
        'canDeactivate component null. route data: %s', logName);
      return of(true);
    }

    const reason: UnsavedDataReason = GuardHelper.getReason(this.stateService, this.router, state, nextState);

    if (reason === UnsavedDataReason.NewSelection || // skip because unsavedata check has been already performed.
            reason === UnsavedDataReason.FrameChange || // skip because unsavedata check must be done at frame level.
            reason === UnsavedDataReason.LogOut || // skip because unsavedata check must be performed at Page guard level.
            reason === UnsavedDataReason.LayoutChange) { // skip because unsavedata check must be done at layout level (due reuse).
      const logName: string = (component.fullId != null) ? component.fullId.fullId() : JSON.stringify(component);
      this.trace.debug(TraceModules.guards,
        'CanDeactivate<SnapinHostComponent> %s . Returning true. reason: %s', logName, UnsavedDataReason[reason]);
      return of(true);
    }

    const snapinCmp: SnapInBase = this.snapinInstances.getSnapInBase(component.fullId);

    this.trace.debug(TraceModules.guards,
      'CanDeactivate<SnapinHostComponent> %s . Evaluating reason: ', component.fullId.fullId(), UnsavedDataReason[reason]);
    return this.checkUnsavedData(snapinCmp, reason).pipe(
      tap((res: boolean) => {
        this.trace.debug(TraceModules.guards, 'CanDeactivate<SnapinHostComponent> %s . returns: %s ', component.fullId.fullId(), res);
      })
    );
  }

  private checkUnsavedData(snapinCmp: SnapInBase, reason: UnsavedDataReason): Observable<boolean> {
    if (snapinCmp !== undefined && (typeof (snapinCmp.onUnsavedDataCheck) === 'function')) {
      const proto: any = Object.getPrototypeOf(snapinCmp);
      const ownProp: any = proto.hasOwnProperty('onUnsavedDataCheck');
      if (ownProp) {
        return snapinCmp.onUnsavedDataCheck(reason);
      }
    }
    return of(true);
  }
}
