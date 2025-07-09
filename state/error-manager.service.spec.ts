import { inject, TestBed } from '@angular/core/testing';
import { ErrorDisplayItem, ErrorDisplayMode, ErrorDisplayState, ErrorNotificationServiceBase,
  MockTraceService, TraceService } from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';

import { ErrorManagerService } from './error-manager.service';
import { MockStateService } from './mock-state.service';
import { StateService } from './state.service';

describe('ErrorManagerService', () => {
  let svc: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModalModule.forRoot(), TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } })],
      providers: [ErrorNotificationServiceBase,
        { provide: TraceService, useClass: MockTraceService },
        ErrorManagerService,
        { provide: StateService, useClass: MockStateService }]
    });
    svc = TestBed.inject(ErrorManagerService);
  });

  it('should be created', () => {
    expect(svc).toBeTruthy();
  });

  it('activate deactivate browser size detection', () => {
    svc.activateBrowserSizeDetection();
    svc.stopBrowserSizeDetection();
  });

  it('should make expected calls on active browser size detection ', () => {
    const spy: jasmine.Spy = spyOn(svc, 'showHideSizeError');
    svc.activateBrowserSizeDetection();
    expect(spy).toHaveBeenCalled();
    expect(svc.windowResizeBinding).toBeDefined();
  });

  it('should make expected calls on stop browser size detection ', () => {
    const modalRef: BsModalRef = new BsModalRef();
    const sub: Subscription = new Subscription();
    svc.minSizeSub = sub;
    svc.sizeErrorModalRef = modalRef;
    const spyUnsubscribe: jasmine.Spy = spyOn<any>(svc.minSizeSub, 'unsubscribe');
    const spySizeError: jasmine.Spy = spyOn<any>(svc.sizeErrorModalRef, 'hide');

    svc.stopBrowserSizeDetection();

    expect(svc.sizeErrorModalRef).toEqual(null);
    expect(spySizeError).toHaveBeenCalled();
    expect(spyUnsubscribe).toHaveBeenCalled();
  });

  it('should make expected call on resize', () => {
    const spy: jasmine.Spy = spyOn(svc, 'showHideSizeError');
    svc.onResize({ target: { innerWidth: 300 } });
    expect(spy).toHaveBeenCalled();
  });

  it('should check onErrorChanged method', () => {
    const spyActivate: jasmine.Spy = spyOn<any>(svc, 'activateError');
    const spyInactivate: jasmine.Spy = spyOn<any>(svc, 'inactivateError');
    const spies: jasmine.Spy[] = [spyActivate, spyInactivate, spyActivate];
    let errItem: ErrorDisplayItem;
    const states: ErrorDisplayState[] = [
      ErrorDisplayState.Active, ErrorDisplayState.Inactive, ErrorDisplayState.Deleted
    ];

    for (let i = 0; i < 3; i++) {
      errItem = new ErrorDisplayItem(ErrorDisplayMode.Modal, states[i], 100);
      svc.onErrorChanged(errItem);
      expect(spies[i]).toHaveBeenCalledWith(errItem);
    }
  });

});
