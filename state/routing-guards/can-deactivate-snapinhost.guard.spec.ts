import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';

import { FullSnapInId } from '../../../common/fullsnapinid/fullsnapinid.model';
import { UnsavedDataReason } from '../../../common/unsaved-data/unsaved-data.model';
import { PaneStore } from '../../shared/stores/pane.store';
import { AppStatus } from '../app-status.model';
import { CanDeactivateSnapInHostGuard } from './can-deactivate-snapinhost.guard';

describe('CanDeactivate SnapInHost Guard', () => {
  let canDeactivateSnapInHostGuard: CanDeactivateSnapInHostGuard;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  const stateServiceStub: any = {
    appStatus: AppStatus.Running,
    getCurrentPaneStores: () => {
      const panes: PaneStore[] = [];
      return panes;
    },
    isLogOutCalling: () => false,
    checkUnsaved: (targetPanes: PaneStore[], reason: UnsavedDataReason) => of(true),
    getPaneWontSurvive: (frameId: string, layoutId: string) => []
  };

  const sniHostCompStub: any = {
    fullId: new FullSnapInId('system-manager', 'trend')
  };

  const currentStateStub: any = {
    url: 'https://127.0.0.1:444/#/main/page/(o1:summary-bar/l/(o2:sb)//main:system-manager/3-pane/(o16:sys-brow//o17:graph//o19:prp-view//o21:related))'
  };
  const currentNextStateStub: any = {
    url: 'https://127.0.0.1:444/#/main/page/(o1:summary-bar/l/(o2:sb)//main:system-manager/3-pane/(o16:sys-brow//o17:graph//o19:prp-view//o21:related))'
  };

  const currentNextStateChangeLayoutStub: any = {
    url: 'https://127.0.0.1:444/#/main/page/(o1:summary-bar/l/(o2:sb)//main:system-manager/2-pane/(o16:sys-brow//o17:graph))'
  };

  const traceServiceStub: any = {
    debug: (source: string, message?: string, ...optionalParams: any[]) => {}
  };

  const sniBaseStub: any = {
    onUnsavedDataCheck: (reason: UnsavedDataReason) => of(true)
  };

  const snapinInstancesServiceStub: any = {
    getSnapInBase: (fullId: string) => sniBaseStub
  };

  const routeStub: any = {
    routeConfig: {
      path: 'trend'
    }
  };

  it('should let deactivation', () => {
    canDeactivateSnapInHostGuard = new CanDeactivateSnapInHostGuard(traceServiceStub, stateServiceStub, router, snapinInstancesServiceStub);

    expect(canDeactivateSnapInHostGuard).not.toBeNull();

    (canDeactivateSnapInHostGuard.canDeactivate(null!, routeStub, currentStateStub, currentNextStateStub) as Observable<boolean>)
      .subscribe((res: boolean) => {
        expect(res).toBeTruthy();
      }).unsubscribe();

    (canDeactivateSnapInHostGuard.canDeactivate(sniHostCompStub, routeStub, currentStateStub, currentNextStateChangeLayoutStub) as Observable<boolean>)
      .subscribe((res: boolean) => {
        expect(res).toBeTruthy();
      }).unsubscribe();

    (canDeactivateSnapInHostGuard.canDeactivate(sniHostCompStub, routeStub, currentStateStub, currentNextStateStub) as Observable<boolean>)
      .subscribe((res: boolean) => {
        expect(res).toBeTruthy();
      }).unsubscribe();
  });
});
