import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { UnsavedDataReason } from '../../../common/unsaved-data';
import { AppStatus } from '../app-status.model';
import { StateService } from '../state.service';
import { GuardHelper } from './guard-helper';

describe('GuardHelper', () => {

  let router: Router;

  const stateServiceStub: any = {
    appStatus: AppStatus.ProcessingNewSelection,
    isLogOutCalling: () => false
  };

  const routerStateSnapshotStub: any = {
    url: 'https://127.0.0.1:444/#/main/page/(o1:summary-bar/l/(o2:sb)//main:system-manager/3-pane/(o16:sys-brow//o17:graph//o19:prp-view//o21:related))'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        { provide: StateService, useValue: stateServiceStub },
        { provide: RouterStateSnapshot, useValue: routerStateSnapshotStub }
      ]
    });
    router = TestBed.inject(Router);
  });

  it('should check isFrameChanging method', () => {
    const frameChanging: boolean = GuardHelper.isFrameChanging(
      router,
      routerStateSnapshotStub,
      routerStateSnapshotStub);

    expect(frameChanging).toBeFalsy();
  });

  it('should check isLayoutChanging method', () => {
    const isLayoutChanging: boolean = GuardHelper.isLayoutChanging(
      router,
      routerStateSnapshotStub,
      null!
    );

    expect(isLayoutChanging).toBeFalsy();
  });

  it('should check getLayoutId method', () => {
    const layoutId: string = GuardHelper.getLayoutId(
      router,
      routerStateSnapshotStub
    )!;

    // expect(layoutId).toBe("3-pane");
    expect(layoutId).toBe('');
  });

  it('should check getReason method', () => {
    const reason: UnsavedDataReason = GuardHelper.getReason(
      stateServiceStub,
      router,
      routerStateSnapshotStub,
      routerStateSnapshotStub
    );

    expect(reason).toBe(UnsavedDataReason.NewSelection);

    stateServiceStub.appStatus = AppStatus.SwitchingFrame;
    const updatedReason: UnsavedDataReason = GuardHelper.getReason(
      stateServiceStub,
      router,
      routerStateSnapshotStub,
      routerStateSnapshotStub
    );

    expect(updatedReason).toBe(UnsavedDataReason.TabChange);
  });

});
