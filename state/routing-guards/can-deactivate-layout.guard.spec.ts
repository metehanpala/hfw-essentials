import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';

import { UnsavedDataReason } from '../../../common/unsaved-data/unsaved-data.model';
import { PaneStore } from '../../shared/stores/pane.store';
import { AppStatus } from '../app-status.model';
import { CanDeactivateLayoutGuard } from './can-deactivate-layout.guard';

describe('CanDeactivate Layout Guard', () => {
  let canDeactivateLayoutGuard: CanDeactivateLayoutGuard;
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

  const layoutCompStub: any = {
    frameId: 'system-manager',
    layoutConfig: {
      id: '3-pane'
    }
  };

  const currentStateStub: any = {
    url: 'https://127.0.0.1:444/#/main/page/(o1:summary-bar/l/(o2:sb)//main:system-manager/3-pane/(o16:sys-brow//o17:graph//o19:prp-view//o21:related))'
  };
  const currentNextStateStub: any = {
    url: 'https://127.0.0.1:444/#/main/page/(o1:summary-bar/l/(o2:sb)//main:system-manager/3-pane/(o16:sys-brow//o17:graph//o19:prp-view//o21:related))'
  };

  const traceServiceStub: any = {
    debug: (source: string, message?: string, ...optionalParams: any[]) => {}
  };

  it('should let deactivation', () => {
    canDeactivateLayoutGuard = new CanDeactivateLayoutGuard(traceServiceStub, router, stateServiceStub);

    expect(canDeactivateLayoutGuard).not.toBeNull();
    (canDeactivateLayoutGuard.canDeactivate(layoutCompStub, null!, currentStateStub, currentNextStateStub) as Observable<boolean>)
      .subscribe((res: boolean) => {
        expect(res).toBeTruthy();
      }).unsubscribe();
  });
});
