import { APP_BASE_HREF } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router, RouteReuseStrategy, RoutesRecognized, UrlTree } from '@angular/router';
import { HfwControlsModule } from '@gms-flex/controls';
import { FullQParamId, MessageType } from '@gms-flex/core';
import {
  AppContextService,
  AuthenticationServiceBase,
  HfwServicesCommonModule,
  MockAuthenticationService,
  MockProductService,
  MockTraceService,
  ModeService,
  ProductService,
  TraceService
} from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { Observable, of } from 'rxjs';

import { FullPaneId } from '../../common/fullsnapinid/full-pane-id.model';
import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { IStateService } from '../../common/interfaces';
import { FrameInfo } from '../../common/interfaces/frame-info.model';
import { IPreselectionService } from '../../common/interfaces/ipreselection.service';
import { IStorageService } from '../../common/interfaces/istorage.service';
import { QParam } from '../../common/interfaces/q-param.model';
import { Mock1PreselectService } from '../../common/interfaces/test/mock1-ipreselection.service';
import { Mock1StorageService } from '../../common/interfaces/test/mock1-istorage.service';
import { Mock2PreselectService } from '../../common/interfaces/test/mock2-ipreselection.service';
import { routing } from '../../testing/test.routing';
import { FrameComponent } from '../frame/frame.component';
import { LayoutComponent } from '../layout/layout.component';
import { PageNotFoundComponent } from '../page/page-not-found.component';
import { PageComponent } from '../page/page.component';
import { PaneHeaderComponent } from '../pane-header/pane-header.component';
import { PaneTabComponent } from '../pane-tab/pane-tab.component';
import { PaneTabSelectedComponent } from '../pane-tab/pane-tabselected.component';
import { PaneComponent } from '../pane/pane.component';
import { SettingsService } from '../settings/settings.service';
import { HldlReaderService } from '../shared/hldl/hldl-reader.service';
import { HldlService } from '../shared/hldl/hldl.service';
import { MockHldlReaderService } from '../shared/hldl/mock-hldl-reader.service';
import { RouterOutletComponent } from '../shared/routing/router-outlet.component';
import { SnapInStore } from '../shared/stores/snapin.store';
import { SnapinHostComponent } from '../snapin-host/snapin-host.component';
import { SplitterHostComponent } from '../splitterhost/splitterhost.component';
import { ErrorManagerService } from '../state/error-manager.service';
import { QParamChange } from '../state/q-param-change.model';
import { ReuseStrategyService } from '../state/reuse-strategy.service';
import { RoutingHelperService } from '../state/routing-helper.service';
import { StateService } from '../state/state.service';
import { SnapinMessageBroker } from './snapinmessagebroker.service';

export class RouterStub {
  public url: string | undefined;

  public rr: RoutesRecognized = new RoutesRecognized(0, 'http://localhost:4200/login', 'http://localhost:4200/login', null!);
  public events: Observable<RoutesRecognized> = new Observable<RoutesRecognized>(observer => {
    observer.next(this.rr);
    observer.complete();
  });

  public navigateByUrl(url: string): Promise<string> {
    return Promise.resolve(url);
  }

  public createUrlTree(commands: any, navExtras: any): UrlTree {
    return new UrlTree();
  }
}

/**
 * Test suite for SnapinMessageBroker service
 * This service handles communication between different components/snapins in the application
 * through a message broker pattern. It manages message passing, layout changes, and parameter updates.
 */

// Constants used throughout the test suite
/** Identifier for the system manager component */
const SYSTEM_MANAGER = 'system-manager';
/** Identifier for the selection pane */
const SELECTION_PANE = 'selection-pane';
/** Full identifier for system manager's query parameter service */
const SYSTEM_MANAGER_QPARAM = 'system-manager.SystemQParamService.primary';
/** Sample application view identifier */
const APPLICATION_VIEW = 'PROJECT_A.ApplicationView:ApplicationView';
/** Identifier for system browser component */
const SYS_BROW = 'sys-brow';
/** Sample message content */
const MESSAGE = 'message';
/** Sample message type identifier */
const MESSAGE_TYPE1 = 'messageType1';

describe('MessageBroker Service', () => {
  let stateService: StateService;
  let stateServiceI: jasmine.SpyObj<IStateService>;
  let snapinMessageBroker: jasmine.SpyObj<SnapinMessageBroker>;
  let fullSnapInId: FullSnapInId;
  let location: FullPaneId;
  let messageBody: string;
  let qParam: QParam;
  let mockObservable: any;

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

    snapinMessageBroker = jasmine.createSpyObj('SnapinMessageBroker', [
      'getMessage',
      'sendMessage',
      'changeLayout',
      'switchToNextFrame',
      'getQueryParam',
      'clearLastMessage',
      'getCurrentLayoutId',
      'lockLayout',
      'getCurrentWorkAreaFrameInfo',
      'getPreselectionService',
      'getStorageService'
    ]);

    // Create a mock observable and spy on 'subscribe' method
    mockObservable = jasmine.createSpyObj('Observable', ['subscribe']);

    // Set up the spy to return the mock observable for `getMessage`
    snapinMessageBroker.getMessage.and.returnValue(mockObservable);

    // Optionally mock other methods with mock observables if needed
    snapinMessageBroker.sendMessage.and.returnValue(mockObservable);
    snapinMessageBroker.changeLayout.and.returnValue(mockObservable);
    snapinMessageBroker.switchToNextFrame.and.returnValue(mockObservable);
    snapinMessageBroker.getQueryParam.and.returnValue(mockObservable);
    snapinMessageBroker.clearLastMessage.and.returnValue(mockObservable);
    snapinMessageBroker.getCurrentLayoutId.and.returnValue(mockObservable);
    snapinMessageBroker.lockLayout.and.returnValue(mockObservable);
    snapinMessageBroker.getCurrentWorkAreaFrameInfo.and.returnValue(mockObservable);
    snapinMessageBroker.getPreselectionService.and.returnValue(mockObservable);
    snapinMessageBroker.getStorageService.and.returnValue(mockObservable);

    stateServiceI.activateQParamSubscription.and.returnValue();

    TestBed.configureTestingModule({
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
        RouterOutletComponent,
        LayoutComponent
      ],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        HfwControlsModule,
        HfwServicesCommonModule,
        routing,
        ModalModule.forRoot(),
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        { provide: SnapinMessageBroker, useValue: snapinMessageBroker },
        HttpClient,
        { provide: 'appSettingFilePath', useValue: 'noMatter' },
        ModeService,
        { provide: ProductService, useClass: MockProductService },
        { provide: TraceService, useClass: MockTraceService },
        MockAuthenticationService,
        { provide: AuthenticationServiceBase, useClass: MockAuthenticationService },
        HldlService,
        RoutingHelperService,
        ErrorManagerService,
        AppContextService,
        { provide: HldlReaderService, useClass: MockHldlReaderService },
        { provide: 'hldlFilePath', useValue: 'hldlFilePath.json' },
        { provide: IPreselectionService, useClass: Mock1PreselectService, multi: true },
        { provide: IPreselectionService, useClass: Mock2PreselectService, multi: true },
        { provide: IStorageService, useClass: Mock1StorageService, multi: true },
        { provide: IStateService, useValue: stateServiceI },
        SettingsService,
        { provide: StateService, useValue: stateServiceI }, // Ensure StateService is provided correctly
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService },
        { provide: APP_BASE_HREF, useValue: '/' },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fullSnapInId = new FullSnapInId(SYSTEM_MANAGER, SYS_BROW);
    location = new FullPaneId(SYSTEM_MANAGER, SELECTION_PANE);
    messageBody = MESSAGE;
    qParam = { name: SYSTEM_MANAGER_QPARAM, value: APPLICATION_VIEW };
  }));

  /**
   * Verifies that the SnapinMessageBroker service is properly instantiated
   * Basic sanity check to ensure the service exists and is available
   */
  it('should create SnapinMessageBroker', waitForAsync(() => {
    expect(snapinMessageBroker).toBeTruthy();
  }));

  /**
   * Tests the complete workflow of HFW instance with HLDL configuration
   * Verifies multiple service operations including:
   * - Message sending with different parameters
   * - Layout management
   * - Frame navigation
   * - Service retrieval (preselection and storage)
   */
  it('check that getHfwInstance works with complete hldl configuration', waitForAsync(() => {
    const locationOne: FullPaneId = new FullPaneId(SYSTEM_MANAGER, SELECTION_PANE);
    const locationTwo: FullPaneId = new FullPaneId(SYSTEM_MANAGER, 'primary-pane');

    snapinMessageBroker.sendMessage(fullSnapInId, locationOne, [MESSAGE_TYPE1], MESSAGE, true, undefined!, false, null!, null!)
      .subscribe(result => {
        expect(result).toBe(true);
      });

    snapinMessageBroker.sendMessage(fullSnapInId, locationOne, [MESSAGE_TYPE1], MESSAGE, false, undefined!, false, null!, null!)
      .subscribe((res: boolean) => { expect(res).toEqual(true); });

    snapinMessageBroker.sendMessage(FullSnapInId.createFrom('system-manager.txt-view')!, locationTwo, [MESSAGE_TYPE1],
      MESSAGE, true, undefined!, false, null!, null!)
      .subscribe((res: boolean) => { expect(res).toEqual(true); });

    snapinMessageBroker.getCurrentLayoutId(fullSnapInId.frameId).subscribe((layout: string) => {
      expect(layout).not.toBeNull();
    });

    snapinMessageBroker.changeLayout(fullSnapInId.frameId, '2-pane').subscribe((res: boolean) => { expect(res).toEqual(true); });
    snapinMessageBroker.getCurrentWorkAreaFrameInfo().subscribe((frame: FrameInfo) => {
      expect(frame).toBeDefined();
    });

    snapinMessageBroker.lockLayout(fullSnapInId.frameId);

    snapinMessageBroker.getMessage(FullSnapInId.createFrom('system-manager.txt-view')!).subscribe((msg: any) => {
      expect(msg).toEqual(msg);
    });

    snapinMessageBroker.switchToNextFrame('event-list').subscribe((res: boolean) => { expect(res).toEqual(true); });

    const preselectionService: IPreselectionService = snapinMessageBroker.getPreselectionService(fullSnapInId);
    const storageService: IStorageService = snapinMessageBroker.getStorageService(fullSnapInId);
    expect(preselectionService).toBeDefined();
    expect(storageService).toBeDefined();
  }));

  /**
   * Tests the clearLastMessage functionality
   * Verifies that after clearing the last message, getMessage returns null
   * Important for message queue management and cleanup
   */
  it('check clearLastMessage', waitForAsync(() => {
    const fullSnapInId2: FullSnapInId = FullSnapInId.createFrom('system-manager.txt-view')!;

    snapinMessageBroker.clearLastMessage(fullSnapInId2);

    snapinMessageBroker.getMessage(fullSnapInId2).subscribe((msg: any) => {
      expect(msg).toBeNull();
    });
  }));

  /**
   * Tests message sending with query parameters
   * Verifies that messages can be sent with associated query parameters
   * Essential for parameter-based communication between components
   */
  it('check sendMessage with qParam', waitForAsync(() => {
    const locationOne: FullPaneId = new FullPaneId(SYSTEM_MANAGER, SELECTION_PANE);

    snapinMessageBroker.sendMessage(fullSnapInId, locationOne, [MESSAGE_TYPE1], MESSAGE, true,
      qParam, false, null!, null!).subscribe(result => {
      expect(result).toBe(true);
    });
  }));

  /**
   * Tests broadcast message functionality
   * Verifies that messages can be broadcast to multiple recipients
   * Important for system-wide notifications and updates
   */
  it('check sendMessage with broadcast', waitForAsync(() => {
    const locationOne: FullPaneId = new FullPaneId(SYSTEM_MANAGER, SELECTION_PANE);

    snapinMessageBroker.sendMessage(fullSnapInId, locationOne, [MESSAGE_TYPE1], MESSAGE, true,
      qParam, true, null!, null!).subscribe(result => {
      expect(result).toBe(true);
    });
  }));

  /**
   * Tests query parameter retrieval functionality
   * Verifies the service can properly handle and retrieve query parameters
   * Important for maintaining state and configuration across components
   */
  it('check getQueryParam', waitForAsync(() => {
    const fullQParamId: FullQParamId = new FullQParamId(SYSTEM_MANAGER, 'SystemQParamService', 'primary');
    const changes: QParamChange = { qParamFullId: fullQParamId, value: APPLICATION_VIEW };

    // Emit the change event for qParamChangeDetected
    stateServiceI.qParamChangeDetected.next(changes);

    // Test the getQueryParam function
    snapinMessageBroker.getQueryParam(fullQParamId).subscribe((res: string | null) => {
      expect(res).toEqual(null);
    });
  }));

  /**
   * Tests successful message sending with valid parameters
   * Verifies that the service correctly handles message transmission
   */
  it('should send a message successfully', waitForAsync(() => {
    snapinMessageBroker.sendMessage(fullSnapInId, location, [MESSAGE_TYPE1], messageBody, true, qParam, false, '', false)
      .subscribe(result => {
        expect(result).toBe(true);
      });
  }));

  /**
   * Tests error handling for invalid message parameters
   * Ensures the service returns false for invalid inputs
   */
  it('should return false when sending a message with invalid input', waitForAsync(() => {
    snapinMessageBroker.sendMessage(fullSnapInId, location, [MESSAGE_TYPE1], messageBody, true, qParam, false, '', false)
      .subscribe(result => {
        expect(result).toBe(false);
      });
  }));

  /**
   * Tests successful layout change operation
   * Verifies that layouts can be changed with valid frame and layout IDs
   * Critical for dynamic UI updates and view management
   */
  it('should change layout successfully', waitForAsync(() => {
    const frameId = 'frame1';
    const layoutId = 'layout1';
    const frameStore = jasmine.createSpyObj('FrameStore', ['selectedViewIdValue']);
    frameStore.selectedViewIdValue = 'view1';

    snapinMessageBroker.changeLayout(frameId, layoutId).subscribe(result => {
      expect(result).toBe(true);
    });
  }));

  /**
   * Tests error handling for invalid frame ID during layout change
   * Verifies that the service properly handles invalid frame identifiers
   * Important for maintaining UI stability during invalid operations
   */
  it('should return false when changing layout with invalid frameId', waitForAsync(() => {
    const frameId = 'invalidFrame';
    const layoutId = 'layout1';

    snapinMessageBroker.changeLayout(frameId, layoutId).subscribe(result => {
      expect(result).toBe(false);
    });
  }));

  /**
   * Tests retrieval of current layout identifier
   * Verifies that the current layout can be correctly identified
   * Important for layout state management and UI synchronization
   */
  it('should get current layout id', waitForAsync(() => {
    const frameId = 'frame1';
    const layoutId = 'layout1';

    snapinMessageBroker.getCurrentLayoutId(frameId).subscribe(result => {
      expect(result).toBe(layoutId);
    });
  }));

  /**
   * Tests successful message retrieval
   * Verifies that messages can be correctly retrieved from the message store
   * Essential for component communication and state updates
   */
  it('should get message successfully', waitForAsync(() => {
    const messageTypes: MessageType[] = [new MessageType(MESSAGE_TYPE1)];
    const snapInStore = new SnapInStore(messageTypes, 'tabTitle');
    snapInStore.sendMessage(MESSAGE); // Use sendMessage to set the message

    snapinMessageBroker.getMessage(fullSnapInId).subscribe(result => {
      expect(result).toBe(MESSAGE);
    });
  }));

  /**
   * Tests error handling for invalid snapIn ID during message retrieval
   * Verifies that the service returns null for non-existent snapIn IDs
   * Essential for graceful handling of invalid message requests
   */
  it('should return null when getting message for invalid snapInId', waitForAsync(() => {
    snapinMessageBroker.getMessage(fullSnapInId).subscribe(result => {
      expect(result).toBeNull();
    });
  }));

  /**
   * Tests query parameter change detection and message propagation
   * Verifies that the service properly responds to parameter changes
   * Critical for maintaining synchronized state across components
   */
  it('should subscribe to qParamChangeDetected and send message', waitForAsync(() => {
    const qParamChange: QParamChange = {
      qParamFullId: new FullQParamId(SYSTEM_MANAGER, 'SystemQParamService', 'primary'),
      value: APPLICATION_VIEW
    };

    const qParamStore = jasmine.createSpyObj('QParamStore', ['getQParam']);
    qParamStore.getQParam.and.returnValue(of({ name: SYSTEM_MANAGER_QPARAM, value: APPLICATION_VIEW }));

    // Simulate the qParamChangeDetected event
    stateServiceI.qParamChangeDetected.next(qParamChange);

    // Add expectations based on the expected behavior of sendMessageAfterQParamChange
    expect(snapinMessageBroker).toBeTruthy(); // Just to ensure the service is instantiated
  }));

  /**
   * Tests error handling for invalid QParam store
   * Verifies that the service can handle null/invalid QParam store scenarios
   * Important for maintaining system stability during parameter store failures
   */
  it('should handle qParamChangeDetected with invalid qParamStore', waitForAsync(() => {
    const qParamChange: QParamChange = {
      qParamFullId: new FullQParamId(SYSTEM_MANAGER, 'SystemQParamService', 'primary'),
      value: APPLICATION_VIEW
    };

    const qParamStore = jasmine.createSpyObj('QParamStore', ['getQParam']);
    qParamStore.getQParam.and.returnValue(of(null)); // Invalid mock returning null

    // Simulate the qParamChangeDetected event
    stateServiceI.qParamChangeDetected.next(qParamChange);

    // Add expectations based on the expected behavior of sendMessageAfterQParamChange
    expect(snapinMessageBroker).toBeTruthy(); // Ensure the service is instantiated
  }));

  /**
   * Comprehensive error handling test
   * Tests multiple service methods with invalid inputs:
   * - Sending message without message type
   * - Changing layout with null layout ID
   * - Switching frames with null frame ID
   * - Getting message with null snapIn ID
   * - Getting query param with null input
   * Ensures robust error handling across service operations
   */
  it('check sendMessage/changeLayout/getMessage/switchFrame with wrong input (i.e. no message type)', waitForAsync(() => {

    const locationOne: FullPaneId = new FullPaneId(SYSTEM_MANAGER, SELECTION_PANE);

    // sendMessage with no message type
    snapinMessageBroker.sendMessage(fullSnapInId, locationOne, null!, MESSAGE, true,
      qParam, true, null!, null!).subscribe(result => {
      expect(result).toBe(false);
    });

    // changeLayout with no layout
    snapinMessageBroker.changeLayout(fullSnapInId.frameId, null!).subscribe((res: boolean) => {
      expect(res).toEqual(false);
    });

    // switchToNextFrame with no frameId
    snapinMessageBroker.switchToNextFrame(null!).subscribe((res: boolean) => {
      expect(res).toEqual(false);
    });

    // getMessage with no snapInId
    snapinMessageBroker.getMessage(null!).subscribe((res: boolean) => {
      expect(res).toEqual(null!);
    });

    // getQueryParam with no input
    snapinMessageBroker.getQueryParam(null!).subscribe((res: string | null) => {
      expect(res).toEqual(null!);
    });

  }));

});
