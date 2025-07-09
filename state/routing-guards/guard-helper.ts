import { Router, RouterStateSnapshot } from '@angular/router';

import { IStateService } from '../../../common/interfaces/istate.service';
import { UnsavedDataReason } from '../../../common/unsaved-data';
import { AppStatus } from '../app-status.model';
import { RoutingUtilities } from '../routing-utilities';

export class GuardHelper {

  public static getReason(stateService: IStateService, router: Router,
    state: RouterStateSnapshot, nextState: RouterStateSnapshot): UnsavedDataReason {
    if (stateService.appStatus === AppStatus.ProcessingNewSelection) { // onUnsavedDataCheck already performed.
      return UnsavedDataReason.NewSelection;
    } else {
      if (stateService.isLogOutCalling()) {
        return UnsavedDataReason.LogOut;
      } else {
        if (this.isFrameChanging(router, state, nextState)) {
          return UnsavedDataReason.FrameChange;
        } else {
          if (this.isLayoutChanging(router, state, nextState)) {
            return UnsavedDataReason.LayoutChange;
          } else {
            return UnsavedDataReason.TabChange;
          }
        }
      }
    }
  }

  public static isFrameChanging(router: Router, state: RouterStateSnapshot, nextState: RouterStateSnapshot): boolean {
    if (nextState != null) {
      const currentId: string = RoutingUtilities.getWorkAreaFrameId(router, state.url);
      const nextId: string = RoutingUtilities.getWorkAreaFrameId(router, nextState.url);
      return currentId !== nextId;
    }
    return false;
  }

  public static isLayoutChanging(router: Router, state: RouterStateSnapshot, nextState: RouterStateSnapshot): boolean {
    if (nextState != null) {
      const currentId: string = RoutingUtilities.getWorkAreaFrameLayoutId(router, state.url);
      const nextId: string = RoutingUtilities.getWorkAreaFrameLayoutId(router, nextState.url);
      return currentId !== nextId;
    }
    return false;
  }

  public static getLayoutId(router: Router, nextState: RouterStateSnapshot): string | null {
    if (nextState != null) {
      return RoutingUtilities.getWorkAreaFrameLayoutId(router, nextState.url);
    }
    return null;
  }
}
