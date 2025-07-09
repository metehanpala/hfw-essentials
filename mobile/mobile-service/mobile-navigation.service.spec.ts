/* eslint-disable @typescript-eslint/dot-notation */
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing'; // Importing fakeAsync for handling asynchronous tests
import { TraceService } from '@gms-flex/services-common';
import { of } from 'rxjs';

import { DeviceType, MobileNavigationService } from './mobile-navigation.service';
interface MenuItemAction {
  type: 'action',
  label: string,
  action: ((actionParam: any, source: this) => void) | string;
}

class MockTraceService {
  public info(module: string, message: string, value: any): void { }
}

describe('MobileNavigationService', () => {
  let service: MobileNavigationService;
  let traceService: TraceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MobileNavigationService,
        { provide: TraceService, useClass: MockTraceService }
      ]
    });

    service = TestBed.inject(MobileNavigationService);
    traceService = TestBed.inject(TraceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update mobile visibility', fakeAsync(() => {
    // Spy on the next method to ensure it's being called
    const nextSpy = spyOn(service['mobileOnlyVisibilitySubject'], 'next');

    // Call the method to update the visibility
    service.updateMobileOnlyVisibility(true);

    // Verify that next() is called
    expect(nextSpy).toHaveBeenCalledWith(true);

    // Ensure async code has time to process
    tick();

    // Now subscribe to the observable
    service.mobileOnlyVisibility$.subscribe(value => {
      expect(value).toBe(true);
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should update event snapin active state', fakeAsync(() => {
    // Spy on the next method to ensure it's being called
    const nextSpy = spyOn(service['calculateBottomSpaceSubject'], 'next');

    // Call the method to update the event snapin active state
    service.updateBottomSpaceCalculationFlag(true);

    // Verify that next() is called
    expect(nextSpy).toHaveBeenCalledWith(true);

    // Ensure async code has time to process
    tick();

    // Subscribe to the observable and check emitted values
    service.calculateBottomSpace$.subscribe(value => {
      expect(value).toBe(true); // Assert the expected value
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should update operator tasks snapin active state', fakeAsync(() => {
    // Spy on the next method to ensure it's being called
    const nextSpy = spyOn(service['handleSummaryBarSubject'], 'next');

    // Call the method to update the operator tasks snapin active state
    service.updateOperatorTasksSnapinActive(true);

    // Verify that next() is called
    expect(nextSpy).toHaveBeenCalledWith(true);

    // Ensure async code has time to process
    tick();

    // Subscribe to the observable and check emitted values
    service.handleSummaryBar$.subscribe(value => {
      expect(value).toBe(true);
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should update account snapin active state', fakeAsync(() => {
    // Spy on the next method to ensure it's being called
    const nextSpy = spyOn(service['handleSummaryBarSubject'], 'next');

    // Call the method to update the account snapin active state
    service.updateAccountSnapinActive(true);

    // Verify that next() is called
    expect(nextSpy).toHaveBeenCalledWith(true);

    // Ensure async code has time to process
    tick();

    // Subscribe to the observable and check emitted values
    service.handleSummaryBar$.subscribe(value => {
      expect(value).toBe(true); // Assert the expected value
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should set content action items', fakeAsync(() => {
    const nextSpy1 = spyOn(service['primaryItemsSubject'], 'next');
    const nextSpy2 = spyOn(service['secondaryItemsSubject'], 'next');
    const primaryItems: MenuItemAction[] = [{ type: 'action', label: 'Item 1', action: 'action1' }, { type: 'action', label: 'Item 2', action: 'action2' }];
    const secondaryItems: MenuItemAction[] = [{ type: 'action', label: 'Item 3', action: 'action3' }];

    // Call the method to set content action items
    service.setContentActionItems(primaryItems, secondaryItems);

    // Verify that next() is called
    expect(nextSpy1).toHaveBeenCalledWith(primaryItems);
    expect(nextSpy2).toHaveBeenCalledWith(secondaryItems);

    // Ensure async code has time to process
    tick();

    // Subscribe to primaryItems$ and assert the expected values
    service.primaryItems$.subscribe(items => {
      expect(items).toEqual(primaryItems); // Assert primary items
    });

    // Subscribe to secondaryItems$ and assert the expected values
    service.secondaryItems$.subscribe(items => {
      expect(items).toEqual(secondaryItems); // Assert secondary items
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should get device info', () => {
    const deviceType = service.getDeviceInfo();
    expect(deviceType).toBeDefined();
  });

  it('should set snapin title', fakeAsync(() => {
    const nextSpy = spyOn(service['snapinTitleSubject'], 'next');

    const title = 'Test Title';

    // Call the method to set the snapin title
    service.setSnapinTitle(title);

    // Verify that next() is called with Snapin Title
    expect(nextSpy).toHaveBeenCalledWith(title);

    // Ensure async code has time to process
    tick();

    // Subscribe to snapinTitle$ and assert the expected value
    service.snapinTitle$.subscribe(titleValue => {
      expect(titleValue).toBe(title); // Assert that the title is correctly set
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should set snap ins', fakeAsync(() => {
    const nextSpy = spyOn(service['snapInsSubject'], 'next');

    const snapins = [{ id: 1, name: 'Snapin 1' }];

    // Call the method to set snap-ins
    service.setSnapIns(snapins);

    // Verify that next() is called with Snapins
    expect(nextSpy).toHaveBeenCalledWith(snapins);

    // Ensure async code has time to process
    tick();

    // Subscribe to snapIns$ and assert the expected value
    service.snapIns$.subscribe(value => {
      expect(value).toEqual(snapins); // Assert snap-ins are correctly set
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should set pane store', fakeAsync(() => {
    const nextSpy = spyOn(service['paneStoreSubject'], 'next');

    const paneStore = { id: 1, name: 'Pane Store' };

    // Call the method to set the pane store
    service.setPaneStore(paneStore);

    // Verify that next() is called with PaneStore
    expect(nextSpy).toHaveBeenCalledWith(paneStore);

    // Ensure async code has time to process
    tick();

    // Subscribe to paneStore$ and assert the expected value
    service.paneStore$.subscribe(value => {
      expect(value).toEqual(paneStore); // Assert the pane store is correctly set
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should set pane config', fakeAsync(() => {
    const nextSpy = spyOn(service['paneConfigSubject'], 'next');

    const paneConfig = { config: 'config' };

    // Call the method to set the pane configuration
    service.setPaneConfig(paneConfig);

    // Verify that next() is called with PaneConfig
    expect(nextSpy).toHaveBeenCalledWith(paneConfig);

    // Ensure async code has time to process
    tick();

    // Subscribe to paneConfig$ and assert the expected value
    service.paneConfig$.subscribe(value => {
      expect(value).toEqual(paneConfig); // Assert the pane configuration is correctly set
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should set tabs', fakeAsync(() => {
    const nextSpy = spyOn(service['tabsSubject'], 'next');

    const tabs = [{ id: 1, title: 'Tab 1' }];

    // Call the method to set tabs
    service.setTabs(tabs);

    // Verify that next() is called with Tabs
    expect(nextSpy).toHaveBeenCalledWith(tabs);

    // Ensure async code has time to process
    tick();

    // Subscribe to tabs$ and assert the expected value
    service.tabs$.subscribe(value => {
      expect(value).toEqual(tabs); // Assert the tabs are correctly set
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should set system browser active state', fakeAsync(() => {
    const nextSpy = spyOn(service['sysBrowActiveSubject'], 'next');

    // Call the method to set the system browser active state
    service.setSysBrowActive(true);

    // Verify that next() is called
    expect(nextSpy).toHaveBeenCalledWith(true);

    // Ensure async code has time to process
    tick();

    // Subscribe to sysBrowActive$ and assert the expected value
    service.sysBrowActive$.subscribe(value => {
      expect(value).toBe(true); // Assert the browser active state is correctly set
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should trigger back navigation', fakeAsync(() => {
    const nextSpy = spyOn(service['backNavigateSubject'], 'next');
    // Call the method to trigger back navigation
    service.setbackNavigate();

    // Ensure async code has time to process
    tick();

    // Verify that next() is called
    expect(nextSpy).toHaveBeenCalledWith(true);

    // Subscribe to backNavigate$ and assert the expected value
    service.backNavigate$.subscribe(value => {
      expect(value).toBe(true); // Assert the back navigation is triggered
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should set last node state', fakeAsync(() => {
    const nextSpy = spyOn(service['isLastNodeSubject'], 'next');

    // Call the method to set last node state
    service.setLastNode(true);

    // Verify that next() is called
    expect(nextSpy).toHaveBeenCalledWith(true);

    // Ensure async code has time to process
    tick();

    // Subscribe to isLastNode$ and assert the expected value
    service.isLastNode$.subscribe(value => {
      expect(value).toBe(true); // Assert the last node state is correctly set
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

  it('should set right panel state', fakeAsync(() => {
    const nextSpy = spyOn(service['isRightPanelOpenSubject'], 'next');

    // Call the method to set the right panel state
    service.setRightPanelState(true);

    // Verify that next() is called
    expect(nextSpy).toHaveBeenCalledWith(true);

    // Ensure async code has time to process
    tick();

    // Subscribe to isRightPanelOpen$ and assert the expected value
    service.isRightPanelOpen$.subscribe(value => {
      expect(value).toBe(true); // Assert the right panel state is correctly set
    });

    // Ensure flush() to complete all async operations
    flush();
  }));

});
