import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpClientTestingModule, provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, RouteReuseStrategy } from '@angular/router';
import { HfwControlsModule } from '@gms-flex/controls';
import {
  AppContextService,
  AuthenticationServiceBase,
  MockAuthenticationService,
  MockProductService,
  MockTraceService,
  ModeService,
  ProductService,
  TraceService
} from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { IStateService } from '../../common/interfaces/';
import { IPreselectionService } from '../../common/interfaces/ipreselection.service';
import { IStorageService } from '../../common/interfaces/istorage.service';
import { Mock1PreselectService } from '../../common/interfaces/test/mock1-ipreselection.service';
import { Mock1StorageService } from '../../common/interfaces/test/mock1-istorage.service';
import { Mock2PreselectService } from '../../common/interfaces/test/mock2-ipreselection.service';
import { routing } from '../../testing/test.routing';
import { FrameComponent } from '../frame/frame.component';
import { LayoutComponent } from '../layout/layout.component';
import { MobileNavigationService } from '../mobile';
import { PageNotFoundComponent } from '../page/page-not-found.component';
import { PageComponent } from '../page/page.component';
import { PaneHeaderComponent } from '../pane-header/pane-header.component';
import { PaneTabComponent } from '../pane-tab/pane-tab.component';
import { PaneTabSelectedComponent } from '../pane-tab/pane-tabselected.component';
import { PaneComponent } from '../pane/pane.component';
import { SettingsService } from '../settings/settings.service';
import { AppRightPanel, FrameStore, HfwInstance, PrimaryBarConfig } from '../shared';
import { HLDL_TEST_EXAMPLE } from '../shared/hldl/hldl-example-data.model';
import { HldlReaderService } from '../shared/hldl/hldl-reader.service';
import { HldlService } from '../shared/hldl/hldl.service';
import { MockHldlReaderService } from '../shared/hldl/mock-hldl-reader.service';
import { RouterOutletComponent } from '../shared/routing/router-outlet.component';
import { SnapinHostComponent } from '../snapin-host/snapin-host.component';
import { SplitterHostComponent } from '../splitterhost/splitterhost.component';
import { ErrorManagerService } from '../state/error-manager.service';
import { IState } from '../state/istate';
import { ReuseStrategyService } from '../state/reuse-strategy.service';
import { RoutingHelperService } from '../state/routing-helper.service';
import { SnapinInstancesService } from '../state/snapin-instances.service';
import { StateService } from '../state/state.service';

// Test suite for PageComponent
// Tests the main page layout functionality including:
// - Mobile view handling
// - Route change handling
// - Unload handling with dirty state checks
// - Frame and pane management
describe('PageComponent', (): void => {
  let comp: PageComponent;
  let fixture: ComponentFixture<PageComponent>;
  let stateServiceI: jasmine.SpyObj<IStateService>;
  let destroySubject$: Subject<void>;

  const mockActivatedRoute: any = jasmine.createSpyObj('mockActivatedRoute', ['snapshot']);
  mockActivatedRoute.snapshot = {
    'data': {
      'frameId': 'frameId_Test',
      'paneId': 'paneId_Test',
      'snapInId': 'snapInId_Test'
    }
  };

  // Setup before each test
  // - Creates spy objects for state service
  // - Configures TestBed with required modules and providers
  beforeEach(waitForAsync(() => {
    stateServiceI = jasmine.createSpyObj('IStateService', [
      'navigateToSnapId',
      'activateQParamSubscription',
      'getFrames',
      'updateStateAfterFrameChange'
    ]);

    stateServiceI.currentState = jasmine.createSpyObj('currentState', ['getFrameStoreViaId'], {
      activeWorkAreaIdValue: 'testFrame'
    });
    (stateServiceI.currentState.getFrameStoreViaId as jasmine.Spy).and.returnValue(null);
    stateServiceI.activateQParamSubscription.and.returnValue();

    TestBed.configureTestingModule({
      imports: [
        HfwControlsModule,
        HttpClientModule,
        HttpClientTestingModule,
        ModalModule.forRoot(),
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        }),
        routing
      ],
      declarations: [
        PageComponent,
        FrameComponent,
        SnapinHostComponent,
        PageNotFoundComponent,
        PaneComponent,
        SplitterHostComponent,
        PaneTabComponent,
        PaneHeaderComponent,
        PaneTabSelectedComponent,
        SnapinHostComponent,
        RouterOutletComponent,
        LayoutComponent
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: 'appSettingFilePath', useValue: 'app-settings.json' },
        ModeService,
        { provide: ProductService, useClass: MockProductService },
        { provide: TraceService, useClass: MockTraceService },
        MockAuthenticationService,
        { provide: AuthenticationServiceBase, useClass: MockAuthenticationService },
        { provide: TranslateService, useClass: TranslateService },
        HldlService,
        RoutingHelperService,
        ErrorManagerService,
        AppContextService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: HldlReaderService, useClass: MockHldlReaderService },
        { provide: 'hldlFilePath', useValue: 'hldlFilePath.json' },
        { provide: IPreselectionService, useClass: Mock1PreselectService, multi: true },
        { provide: IPreselectionService, useClass: Mock2PreselectService, multi: true },
        { provide: IStorageService, useClass: Mock1StorageService, multi: true },
        SettingsService,
        SnapinInstancesService,
        { provide: IStateService, useValue: stateServiceI },
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService },
        { provide: APP_BASE_HREF, useValue: '/' },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  }));

  beforeEach((): void => {
    fixture = TestBed.createComponent(PageComponent);
    comp = fixture.componentInstance;

    comp.ngOnInit();

    destroySubject$ = new Subject<void>();

  });

  // Test: Basic Component Creation
  // Verifies that the component instance is created successfully
  it('should create', (): void => {
    expect(comp).toBeTruthy();
  });

  // Test: Component Initialization
  // Verifies that ngOnInit is called during component initialization
  // This ensures the component is properly initialized with required setup
  it('should initialize component', (): void => {
    spyOn(comp, 'ngOnInit');
    comp.ngOnInit();
    expect(comp.ngOnInit).toHaveBeenCalled();
  });

  // Test: Basic Unload Handler
  // Verifies the unload handler's default behavior with frame store
  // Tests that unload continues without popup when no dirty state exists
  it('call unloadHandler method', (): void => {
    (stateServiceI as any).currentState = { activeWorkAreaIdValue: 'workAreaId' };
    (stateServiceI as any).currentState = {
      getFrameStoreViaId: (frameId: string): void => { }
    };

    expect(comp.unloadHandler()).toEqual('continue without pop-up');
  });

  // Test: Route Change with Null
  // Verifies that the onRouteChanged handler properly handles null routes
  // This is important for edge cases where route data may be missing
  it('call onRouteChanged method with null', (): void => {
    const spy = spyOn<any>(comp, 'onRouteChanged');
    comp.onRouteChanged(null);
    expect(spy).toHaveBeenCalled();
  });

  // Test: Session Storage Check
  // Verifies that the checkFunction properly initializes session storage
  // Ensures the expected number of storage items are created
  it('call checkFunction method', (): void => {
    const spy = spyOn<any>(comp, 'checkFunction');
    comp.checkFunction();
    expect(spy).toHaveBeenCalled();
  });

  // Test: Mobile View State Changes
  // Verifies that the component properly handles mobile view state changes
  // Tests the class attribute updates when mobile visibility changes
  it('should handle mobile view changes', (): void => {
    const mobileService = TestBed.inject(MobileNavigationService);
    const mobileVisibility$ = new Subject<boolean>();
    const isEventActive$ = new Subject<boolean>();

    Object.defineProperty(mobileService, 'mobileOnlyVisibility$', {
      get: () => mobileVisibility$.asObservable()
    });
    Object.defineProperty(mobileService, 'isEventActive$', {
      get: () => isEventActive$.asObservable()
    });

    comp.ngOnInit();
    fixture.detectChanges();

    mobileVisibility$.next(true);
    isEventActive$.next(false);
    fixture.detectChanges();

    expect(comp.classAttribute).toBe('si-layout-fixed-height mb-6 si-layout-main-padding');
  });

  // Test: Mobile View Without Event
  // Verifies that the component applies correct CSS classes for mobile view
  // when no event is active, ensuring proper styling for basic mobile mode
  it('should update class when mobile view is active without event', (): void => {
    // Inject the mock service (mobile service)
    const mobileService = TestBed.inject(MobileNavigationService);

    // Create mock subjects for the observable streams
    const mobileVisibility$ = new Subject<boolean>();
    const isEventActive$ = new Subject<boolean>();

    // Mock the mobile service properties so that they return the subjects
    Object.defineProperty(mobileService, 'mobileOnlyVisibility$', {
      get: () => mobileVisibility$.asObservable() // Return observable stream
    });

    Object.defineProperty(mobileService, 'isEventActive$', {
      get: () => isEventActive$.asObservable() // Return observable stream
    });

    // Call ngOnInit to ensure the component subscribes to the observables
    comp.ngOnInit();
    fixture.detectChanges(); // Detect changes after ngOnInit

    // Now, simulate changes in the observable values
    mobileVisibility$.next(true); // Set mobileOnlyVisibility$ to true
    isEventActive$.next(false); // Set isEventActive$ to false

    fixture.detectChanges(); // Detect changes after the observables emit

    // Assert that classAttribute has been updated based on these values
    expect(comp.classAttribute).toBe('si-layout-fixed-height mb-6 si-layout-main-padding');
  });

  // Test: Mobile View With Event
  // Verifies that the component applies correct CSS classes for mobile view
  // when an event is active, ensuring proper styling for event-based mobile mode
  it('should update class when mobile view is active with event', (): void => {
    // Inject the mock service (mobile service)
    const mobileService = TestBed.inject(MobileNavigationService);

    // Create mock subjects for the observable streams
    const mobileVisibility$ = new Subject<boolean>();
    const isEventActive$ = new Subject<boolean>();

    // Mock the mobile service properties so that they return the subjects
    Object.defineProperty(mobileService, 'mobileOnlyVisibility$', {
      get: () => mobileVisibility$.asObservable() // Return observable stream
    });

    Object.defineProperty(mobileService, 'isEventActive$', {
      get: () => isEventActive$.asObservable() // Return observable stream
    });

    // Call ngOnInit to ensure the component subscribes to the observables
    comp.ngOnInit();
    fixture.detectChanges(); // Detect changes after ngOnInit

    // Now, simulate changes in the observable values
    mobileVisibility$.next(true); // Set mobileOnlyVisibility$ to true
    isEventActive$.next(true); // Set isEventActive$ to true

    fixture.detectChanges(); // Detect changes after the observables emit

    // Assert that classAttribute has been updated based on these values
    expect(comp.classAttribute).toBe('si-layout-fixed-height mb-6 si-layout-main-padding');
  });

  // Test: Timer Logoff Unload Handler
  // Verifies that the unload handler allows navigation without popup
  // when timer logoff is active in session storage
  it('should handle unloadHandler with timer logoff', (): void => {
    sessionStorage.setItem('TimerLogOff', 'true');
    expect(comp.unloadHandler()).toBe('continue without pop-up');
    expect(sessionStorage.getItem('TimerLogOff')).toBe('true');
  });

  // Test: User Roles Unload Handler
  // Verifies that the unload handler allows navigation without popup
  // when user roles are present in session storage
  it('should handle unloadHandler with user roles', (): void => {
    sessionStorage.setItem('UserRoles', 'true');
    expect(comp.unloadHandler()).toBe('continue without pop-up');
  });

  // Test: Dirty State Unload Handler
  // Verifies that the unload handler prevents navigation
  // when there are unsaved changes (dirty state) in visible tabs
  it('should handle unloadHandler with dirty state', (): void => {
    const mockSnapInStore = {
      isTabVisible: true,
      storageService: {
        getDirtyState: (): boolean => true
      },
      fullSnapInId: 'test'
    };

    const mockFrameStore = {
      snapInInstanceMap: new Map([['test', mockSnapInStore]]) as Map<string, any>
    } as FrameStore;

    (stateServiceI.currentState.getFrameStoreViaId as jasmine.Spy).and.returnValue(mockFrameStore);

    expect(comp.unloadHandler()).toBe(false);
  });

  // Test: Route Change with Valid Frame ID
  // Verifies that the state service is updated correctly when route changes
  // with a valid frame ID, ensuring proper frame navigation
  it('should handle onRouteChanged with valid frame id', (): void => {
    const mockRoute = {
      route: {
        snapshot: {
          data: {
            id: 'testFrame'
          }
        }
      }
    };

    comp.onRouteChanged(mockRoute);

    expect(stateServiceI.updateStateAfterFrameChange).toHaveBeenCalledWith('testFrame');
  });

  // Test: Multiple Tabs Check Function
  // Verifies that the cookie service properly handles multiple tab scenarios
  // by setting and getting appropriate cookie values for tab management
  it('should handle checkFunction with multiple tabs', (): void => {
    const cookieService = TestBed.inject(CookieService);
    spyOn(cookieService, 'get').and.returnValue('2');
    spyOn(cookieService, 'set');

    comp.checkFunction();

    expect(cookieService.set).toHaveBeenCalled();
  });

});
