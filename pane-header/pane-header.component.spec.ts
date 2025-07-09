import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpClientTestingModule, provideHttpClientTesting } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouteReuseStrategy } from '@angular/router';
import { HfwControlsModule } from '@gms-flex/controls';
import { MockTraceService, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { SiContentActionBarModule, SiResizeObserverModule } from '@simpl/element-ng';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { FullPaneId, FullSnapInId } from '../../common/fullsnapinid';
import { IObjectSelection, ISnapInActions, IStateService } from '../../common/interfaces';
import { SnapInActions } from '../../common/interfaces/snapin-actions.model';
import { routing } from '../../testing/test.routing';
import { PageComponent } from '../page/page.component';
import { PaneTabComponent, PaneTabSelectedComponent } from '../pane-tab';
import { MockSettingsServiceBase } from '../settings/settings.service.spec';
import * as hldl from '../shared/hldl/hldl-data.model';
import { HLDL_TEST_EXAMPLE } from '../shared/hldl/hldl-example-data.model';
import { RouterOutletComponent } from '../shared/routing/router-outlet.component';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { MockStateService } from '../state/mock-state.service';
import { ReuseStrategyService } from '../state/reuse-strategy.service';
import { RoutingHelperService } from '../state/routing-helper.service';
import { StateService } from '../state/state.service';
import { HfwTabComponent, HfwTabsetComponent } from '../tabs';
import { PaneHeaderComponent } from './pane-header.component';

describe('PaneHeaderComponent', () => {
  let component: PaneHeaderComponent;
  let fixture: ComponentFixture<PaneHeaderComponent>;
  let stateServiceI: jasmine.SpyObj<IStateService>;
  let mockPaneStore: jasmine.SpyObj<PaneStore>;
  let mockFrameStore: jasmine.SpyObj<FrameStore>;

  const stateStub: any = {
    getFrameStoreViaId: () => { },
    getPaneStoreViaIds: () => new PaneStore(HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[0].panes[0]),
    getSnapInStoreViaIds: () => null
  };
  const stateServiceStub: any = {
    currentState: stateStub,
    getLayoutIdWhenClosed: () => null,
    getFirsLayoutIdWithoutPane: () => { },
    navigateToFrameViewLayout: () => { }
  };

  const objSelectionSvcStub: any = {
    getSelectedObject: (fullPaneId: FullPaneId) => new Observable(o => {
      o.next(null);
      o.complete();
    }),
    setSelectedObject: (fullPaneId: FullPaneId, msg: any) => { }
  };

  const snapInActionsSvcStub: any = {
    getSnapInActions: (fullSnapInId: FullSnapInId) => new Observable(o => {
      o.next(null);
      o.complete();
    }),
    setSnapInActions: (fullSnapInId: FullSnapInId, actions: SnapInActions) => { }
  };

  beforeEach(waitForAsync(() => {
    stateServiceI = jasmine.createSpyObj('IStateService', [
      'navigateToSnapId', 'activateQParamSubscription', 'getFrames',
      'updatePaneFromExternNavigate', 'getCurrentPaneStores'
    ]);

    stateServiceI.currentState = jasmine.createSpyObj('currentState', ['getFrameStoreViaId', 'getPaneStoreViaIds']);
    stateServiceI.activateQParamSubscription.and.returnValue();

    // Create a mock PaneStore with all required methods and properties
    mockPaneStore = jasmine.createSpyObj('PaneStore', [
      'open',
      'close',
      'selectSnapIn',
      'setIsDisplayable',
      'setTabChangeInProgress',
      'setFullScreen',
      'dispose',
      'getFullScreen'
    ], {
      'fullScreen': of(false),
      'selectedSnapInId': of('test-snapin'),
      'paneConfig': HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[0].panes[0]
    });

    mockPaneStore.getFullScreen = jasmine.createSpy('getFullScreen').and.returnValue(of(false));

    // Create a mock FrameStore with methods that return observables
    mockFrameStore = jasmine.createSpyObj('FrameStore', [
      'isLocked'
    ]);

    const isLockedSubject = new BehaviorSubject<boolean>(false);

    // Mocking the isLocked getter to return the BehaviorSubject as observable
    Object.defineProperty(mockFrameStore, 'isLocked', {
      get: jasmine.createSpy().and.returnValue(isLockedSubject.asObservable())
    });

    TestBed.configureTestingModule({
      imports: [
        HfwControlsModule,
        TabsModule.forRoot(),
        HttpClientTestingModule,
        SiContentActionBarModule,
        SiResizeObserverModule,
        HttpClientModule,
        routing,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      declarations: [
        PageComponent, RouterOutletComponent, PaneTabComponent, PaneTabSelectedComponent, PaneHeaderComponent,
        HfwTabComponent, HfwTabsetComponent
      ],
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA
      ],
      providers: [
        MockStateService,
        RoutingHelperService,
        { provide: IStateService, useValue: stateServiceI },
        { provide: IObjectSelection, useValue: objSelectionSvcStub },
        { provide: ISnapInActions, useValue: snapInActionsSvcStub },
        { provide: TraceService, useClass: MockTraceService },
        { provide: SettingsServiceBase, useClass: MockSettingsServiceBase },
        { provide: StateService, useValue: stateServiceStub },
        { provide: PaneStore, useValue: mockPaneStore },
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService },
        { provide: FrameStore, useValue: mockFrameStore },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaneHeaderComponent);
    component = fixture.componentInstance;

    // Set required input properties
    component.frameId = 'test-frame';
    component.paneId = 'test-pane';
    component.closeButton = true;
    component.titleVisible = true;
    component.displayEmpty = false;
    component.hasTab = true;
    component.snapIns = [];

    // Set up state service spies
    stateServiceI.currentState.getFrameStoreViaId = jasmine.createSpy().and.returnValue(mockFrameStore);
    stateServiceI.currentState.getPaneStoreViaIds = jasmine.createSpy().and.returnValue(mockPaneStore);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize paneStore correctly', () => {
    component.paneRefresh();
    expect(component.paneStore).toBeTruthy();
    expect(stateServiceI.currentState.getPaneStoreViaIds).toHaveBeenCalledWith('test-frame', 'test-pane');
  });
});
