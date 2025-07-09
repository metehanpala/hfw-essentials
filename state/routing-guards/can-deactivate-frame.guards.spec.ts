import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';

import { UnsavedDataReason } from '../../../common/unsaved-data/unsaved-data.model';
import { PaneStore } from '../../shared/stores/pane.store';
import { AppStatus } from '../app-status.model';
import { CanDeactivateFrameGuard } from './can-deactivate-frame.guards';

describe('CanDeactivate Frame Guard', () => {
  let canDeactivateFrameGuard: CanDeactivateFrameGuard;
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
    appStatus: AppStatus.SwitchingFrame,
    getCurrentPaneStores: () => {
      const panes: PaneStore[] = [];
      return panes;
    },
    isLogOutCalling: () => false,
    checkUnsaved: (targetPanes: PaneStore[], reason: UnsavedDataReason) => of(true)
  };

  const traceServiceStub: any = {
    debug: (source: string, message?: string, ...optionalParams: any[]) => {}
  };

  const frameCompStub: any = {
    id: 'system-manager'
  };

  const currentStateStub: any = {
    url: 'system-manager'
  };
  const currentNextStateStub: any = {
    url: 'event-list'
  };

  it('should allow deactivate', () => {
    canDeactivateFrameGuard = new CanDeactivateFrameGuard(traceServiceStub, router, stateServiceStub);

    expect(canDeactivateFrameGuard).not.toBeNull();
    (canDeactivateFrameGuard.canDeactivate(frameCompStub, null!, currentStateStub, currentNextStateStub) as Observable<boolean>).subscribe((res: boolean) => {
      expect(res).toBeTruthy();
    }).unsubscribe();
  });
});
