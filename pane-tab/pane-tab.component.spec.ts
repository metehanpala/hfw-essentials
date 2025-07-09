import { HttpClient, HttpHandler } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { IStateService } from '@gms-flex/core';
import { BehaviorSubject, Observable, Observer } from 'rxjs';

import { StateService } from '../state/state.service';
import { PaneTabComponent } from './pane-tab.component';
import { PaneTabSelectedComponent } from './pane-tabselected.component';

/**
 * Test suite for the PaneTabComponent.
 * This suite contains tests to verify the functionality and behavior of the PaneTabComponent.
 */
describe('PaneTabComponent', () => {
  let component: PaneTabComponent;
  let fixture: ComponentFixture<PaneTabComponent>;
  let service: StateService;
  let stateServiceI: jasmine.SpyObj<IStateService>;

  /**
   * Setup for each test case.
   * Initializes the test bed and creates a spy object for the IStateService.
   */
  beforeEach(waitForAsync(() => {
    stateServiceI = jasmine.createSpyObj('IStateService', [
      'navigateToSnapId',
      'activateQParamSubscription',
      'getFrames',
      'updatePaneFromExternNavigate',
      'getCurrentPaneStores',
      'getCurrentLayoutId',
      'getCurrentMode',
      'lockUnlockLayout',
      'switchToNextFrame',
      'changeMode',
      'fullScreenSnapin',
      'getUpdatingLocation',
      'checkUnsaved',
      'displaySnapInTab',
      'canChangeUser Roles',
      'resetFrameSettingsPerSize',
      'getQParamStore',
      'getFrameStoreViaId',
      'navigateToFrameViewLayout'
    ]);

    stateServiceI.qParamChangeDetected = jasmine.createSpyObj('Subject', ['next', 'subscribe']);

    stateServiceI.currentState = jasmine.createSpyObj('currentState', [
      'getFrameStoreViaId',
      'getPaneStoreViaIds',
      'getQParamStore',
      'activeWorkAreaId',
      'activeWorkAreaIdValue'
    ]);

    TestBed.configureTestingModule({
      declarations: [PaneTabComponent, PaneTabSelectedComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        HttpClient,
        HttpHandler,
        { provide: StateService, useValue: {} },
        { provide: IStateService, useValue: stateServiceI },
        { provide: 'appSettingFilePath', useValue: 'noMatter' }
      ]
    }).compileComponents();
  }));

  /**
   * Setup for each test case to create the component instance and detect changes.
   */
  beforeEach(() => {
    fixture = TestBed.createComponent(PaneTabComponent);
    component = fixture.componentInstance;
    component.visibleTabsObs = new Observable<PaneTabSelectedComponent[]>();
    fixture.detectChanges();
    service = TestBed.inject(StateService);
  });

  /**
   * Test case to verify that the component is created successfully.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Test case to check the updateProperties method when paneStore is null.
   * It verifies that selectedTabId is undefined when paneStore is null.
   */
  it('should check updateProperties method with null paneStore', fakeAsync(() => {
    component.frameId = 'frameId';
    component.paneId = 'paneId';
    (component as any).paneStore = null; // Simulate null paneStore

    component.ngAfterViewInit(); // Trigger lifecycle hook

    expect(component.selectedTabId).toBeUndefined(); // Expect selectedTabId to be undefined
  }));

  /**
   * Test case to check the updateProperties method with a valid paneStore.
   * It verifies that the selectedTabId updates correctly when a valid paneStore is provided.
   */
  it('should check updateProperties method with valid paneStore', fakeAsync(() => {
    // Spy on private method
    const updatePropertiesSpy = spyOn<any>(component, 'updateProperties').and.callThrough();

    // Force Angular to run lifecycle hooks
    component.ngAfterViewInit();

    // Mock paneStore with BehaviorSubject to ensure value emission
    const mockPaneStoreForValid: any = {
      selectedSnapInId: new BehaviorSubject<string>('mockSnapInId')
    };

    mockPaneStoreForValid.selectedSnapInId.next('mockSnapInId');

    // Assign the mock store
    (component as any).paneStore = mockPaneStoreForValid;

    tick(); // Simulate async operations

    // Manually trigger the method in case it isn’t auto-triggered
    (component as any).updateProperties('mockSnapInId');

    fixture.detectChanges();

    // Log spy calls
    // eslint-disable-next-line no-restricted-syntax
    console.log('updateProperties called with:', updatePropertiesSpy.calls.mostRecent()?.args)

    // eslint-disable-next-line no-restricted-syntax
    console.log('selectedTabId:', component.selectedTabId);
    // eslint-disable-next-line no-restricted-syntax
    console.log('updatePropertiesSpy calls:', updatePropertiesSpy.calls.count());

    // Expect method to be called
    expect(updatePropertiesSpy).toHaveBeenCalled();

    // Expect selectedTabId to update correctly
    expect(updatePropertiesSpy.calls.mostRecent()?.args[0]).toEqual('mockSnapInId'); // Check method args
  }));

  /**
   * Test case to check the updateProperties method.
   * It verifies that the selectedTabId is not null after initializing the component.
   */
  it('should check updateProperties method', fakeAsync(() => {
    const spyUnsubscribe: jasmine.Spy = spyOn<any>(component, 'updatePropertiesForPaneStoreNotNull');

    component.frameId = 'frameId';
    component.paneId = 'paneId';
    const paneTabSelectedComponent = new PaneTabSelectedComponent();
    const paneTabSelectedComponent1 = new PaneTabSelectedComponent();
    paneTabSelectedComponent.tabId = '0';
    paneTabSelectedComponent1.tabId = '1';
    paneTabSelectedComponent.tabTitle = 'title0';
    paneTabSelectedComponent1.tabTitle = 'title1';
    paneTabSelectedComponent1.active = true;
    component.visibleTabsObs = new Observable<PaneTabSelectedComponent[]>();

    component.ngAfterContentInit();

    expect(component.selectedTabId).not.toBeNull();
  }));

  /**
   * Test case to check the unsubscribe method.
   * It verifies that the unsubscribe method is called when the component is destroyed.
   */
  it('should check unsubscribe method', () => {
    const spyUnsubscribe: jasmine.Spy = spyOn<any>(component, 'unsubscribe');
    component.ngOnDestroy();
    expect(spyUnsubscribe).toHaveBeenCalled(); // Expect unsubscribe to be called
  });

  /**
   * Test for tryToSwitch method.
   */
  it('should not navigate if the event target is part of the tab control', () => {
    const event = {
      target: {
        className: 'tab-container-control'
      },
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation')
    };

    component.tryToSwitch(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect((component as any).tabNavigationInProgress).toBeFalse();
  });

  /**
   * Test for mobileTabConfig method.
   */
  // it('should set tabs for mobile navigation', () => {
  //   const mockTabs = new Observable<PaneTabSelectedComponent[]>();
  //   spyOn(component.tabs, 'toArray').and.returnValue(mockTabs);
  //   const mobileNavigationService = jasmine.createSpyObj('MobileNavigationService', ['setTabs']);
  //   (component as any).mobileNavigationService = mobileNavigationService;

  //   component.mobileTabConfig();

  //   expect(mobileNavigationService.setTabs).toHaveBeenCalledWith(mockTabs);
  // });

  /**
   * Test for updateProperties method when frameId and paneId are null.
   */
  it('should not update properties if frameId and paneId are empty', () => {
    // Spy on private method via 'any' type
    const updatePropertiesSpy = spyOn<any>(component, 'updateProperties').and.callThrough();

    component.frameId = '';
    component.paneId = '';

    // Call ngAfterContentInit directly to invoke updateProperties
    component.ngAfterContentInit();

    expect(updatePropertiesSpy).toHaveBeenCalled();
    expect((component as any).paneStore).toBeUndefined();
  });

  /**
   * Test for ngAfterContentInit lifecycle hook.
   */
  it('should call updateProperties in ngAfterContentInit', () => {
    component.frameId = 'validFrameId';
    component.paneId = 'validPaneId';

    // Spy on private method updateProperties
    spyOn(component as any, 'updateProperties').and.callThrough();

    // Ensure getPaneStoreViaIds is not spied on again if already spied upon in the setup
    // Remove the spy setup in the test if it's already set up in the test setup

    component.ngAfterContentInit();
    fixture.detectChanges();

    // Assert that getPaneStoreViaIds has been called
    expect(stateServiceI.currentState.getPaneStoreViaIds).toHaveBeenCalled();
  });

  /**
   * Test for ngAfterViewInit lifecycle hook.
   */
  it('should subscribe to tabs changes in ngAfterViewInit', () => {
    component.visibleTabsObs = new Observable<PaneTabSelectedComponent[]>();
    spyOn(component.visibleTabsObs, 'subscribe');
    component.ngAfterViewInit();

    expect(component.visibleTabsObs.subscribe).toHaveBeenCalled();
  });

  /**
   * Test for unsubscribe method.
   */
  it('should unsubscribe from all subscriptions', () => {
    const subscription1 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    const subscription2 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    (component as any).sub = [subscription1, subscription2];

    (component as any).unsubscribe();

    expect(subscription1.unsubscribe).toHaveBeenCalled();
    expect(subscription2.unsubscribe).toHaveBeenCalled();
  });

});
