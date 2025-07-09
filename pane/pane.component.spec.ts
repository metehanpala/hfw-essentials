import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, NO_ERRORS_SCHEMA, SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, RouteReuseStrategy } from '@angular/router';
import { HfwControlsModule } from '@gms-flex/controls';
import { AppContextService,
  AuthenticationServiceBase,
  MockAuthenticationService,
  MockProductService,
  MockTraceService,
  ModeService,
  ProductService,
  TraceService } from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';

import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { IStateService } from '../../common/interfaces';
import { IPreselectionService } from '../../common/interfaces/ipreselection.service';
import { IStorageService } from '../../common/interfaces/istorage.service';
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
import { SnapinHostComponent } from '../snapin-host/snapin-host.component';
import { SplitterHostComponent } from '../splitterhost/splitterhost.component';
import { AppStatus } from '../state/app-status.model';
import { ErrorManagerService } from '../state/error-manager.service';
import { ReuseStrategyService } from '../state/reuse-strategy.service';
import { RoutingHelperService } from '../state/routing-helper.service';
import { SnapinInstancesService } from '../state/snapin-instances.service';
import { StateService } from '../state/state.service';

describe('PaneComponent', () => {
  let comp: any;
  let fixture: ComponentFixture<PaneComponent>;
  const obj: any = {
    'docked': 'top'
  };
  const stateServiceStub: any = {
    appStatus: AppStatus.ProcessingNewSelection,
    updatePaneFromExternNavigate: () => {},
    getPaneStoreViaIds: () => {},
    getPaneById: () => {},
    getSnapInsFromPaneId: () => {},
    getFrameById: () => obj
  };

  let stateServiceI: jasmine.SpyObj<IStateService>;

  // async beforeEach
  beforeEach(waitForAsync(() => {

    stateServiceI = jasmine.createSpyObj('IStateService', ['navigateToSnapId', 'activateQParamSubscription', 'getFrames', 'updatePaneFromExternNavigate']);
    stateServiceI.currentState = jasmine.createSpyObj('currentState', ['getFrameStoreViaId', 'getPaneStoreViaIds']);

    stateServiceI.activateQParamSubscription.and.returnValue();

    TestBed.configureTestingModule({
      declarations: [PageComponent, FrameComponent, SnapinHostComponent,
        PageNotFoundComponent, PaneComponent, SplitterHostComponent,
        PaneTabComponent, PaneHeaderComponent, PaneTabSelectedComponent,
        SnapinHostComponent,
        RouterOutletComponent, LayoutComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [BrowserAnimationsModule, BrowserModule,
        HfwControlsModule, routing,
        ModalModule.forRoot(), TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })],
      providers: [
        { provide: 'appSettingFilePath', useValue: 'app-settings.json' },
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
        SettingsService,
        SnapinInstancesService,
        StateService,
        { provide: IStateService, useValue: stateServiceI },
        // { provide: StateService, useValue: stateServiceStub },
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService },
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: ActivatedRoute, useValue: {
          'snapshot': {
            'data': {
              'panes': [
                {},
                {}
              ],
              'layoutInstances': [
                {},
                {}
              ],
              'id': 'summary-bar'
            }
          }
        } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents(); // compile template and css
  }));

  // synchronous beforeEach
  beforeEach(() => {
    fixture = TestBed.createComponent(PaneComponent);
    comp = fixture.componentInstance;
  });

  it('check that getHfwInstance works with complete hldl configuration ',
    inject([HldlReaderService, StateService], (hldlReaderService: MockHldlReaderService,
      stateService: StateService) => {
      stateService.getHfwInstance().subscribe((value: any) => {
        expect(value).not.toBeNull();
      });
    }));

});

// //// Test Host Component //////

@Component({
  template: `
    <hfw-pane class="hfw-flex-container-column hfw-flex-item-grow"
      [paneId]='paneInstanceId' [frameId]='frameId' />
  `,
  standalone: false
})
class TestHostComponent {
  public frameId = 'system-manager';
  public paneInstanceId = 'PrimaryPane';
}

let stateServiceI: jasmine.SpyObj<IStateService>;

describe('PaneComponent with test host', () => {

  let testHost: TestHostComponent;
  let fixtureTestHost: ComponentFixture<TestHostComponent>;
  let homeInstance: PaneComponent;

  stateServiceI = jasmine.createSpyObj('IStateService', ['navigateToSnapId', 'activateQParamSubscription', 'getFrames']);
  stateServiceI.currentState = jasmine.createSpyObj('currentState', ['getFrameStoreViaId']);

  stateServiceI.activateQParamSubscription.and.returnValue();

  // async beforeEach
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TestHostComponent, PageComponent, FrameComponent, SnapinHostComponent,
        PageNotFoundComponent, PaneComponent, SplitterHostComponent,
        PaneTabComponent, PaneHeaderComponent, PaneTabSelectedComponent,
        SnapinHostComponent,
        RouterOutletComponent, LayoutComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [BrowserAnimationsModule, BrowserModule,
        HfwControlsModule, routing,
        ModalModule.forRoot(), TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })],
      providers: [
        { provide: 'appSettingFilePath', useValue: 'app-settings.json' },
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
        SettingsService,
        SnapinInstancesService,
        StateService,
        { provide: IStateService, useValue: stateServiceI },
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService },
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: ActivatedRoute, useValue: {
          'snapshot': {
            'data': {
              'panes': [
                {},
                {}
              ],
              'layoutInstances': [
                {},
                {}
              ],
              'id': 'summary-bar'
            }
          }
        } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents(); // compile template and css
  }));

  beforeEach(() => {
    fixtureTestHost = TestBed.createComponent(TestHostComponent);
    testHost = fixtureTestHost.componentInstance;
    homeInstance = fixtureTestHost.debugElement.children[0].componentInstance;
  });

  it('check that getHfwInstance works with complete hldl configuration - 2',
    inject([HldlReaderService, StateService], (hldlReaderService: MockHldlReaderService,
      stateService: StateService) => {
      const stateSpy: StateService = fixtureTestHost.debugElement.children[0].injector.get(StateService) as StateService;
      stateSpy.getHfwInstance().subscribe((value: any) => {
        expect(value).not.toBeNull();
      });

      // fixtureTestHost.detectChanges(); // trigger initial data binding

    }));

});

describe('PaneComponent', () => {
  let comp: any;
  let fixture: ComponentFixture<PaneComponent>;
  let service: StateService;
  let hldlService: HldlService;

  const obj: any = {
    'docked': 'top'
  };
  const hldlServiceStub: any = {
    getFrameById: () => obj
  };
  const stateStub: any = {
    getPaneStoreViaIds: () => {},
    getSnapInsFromPaneId: () => {}
  };
  const stateServiceStub: any = {
    currentState: stateStub,
    updatePaneFromExternNavigate: () => {},
    getPaneById: () => {}
  };

  stateServiceI = jasmine.createSpyObj('IStateService', ['navigateToSnapId', 'activateQParamSubscription', 'getPaneById',
    'getFrames', 'updatePaneFromExternNavigate']);
  stateServiceI.currentState = jasmine.createSpyObj('currentState', ['getFrameStoreViaId', 'getPaneStoreViaIds', 'getSnapInsFromPaneId']);

  stateServiceI.activateQParamSubscription.and.returnValue();

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PageComponent, PaneComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [routing,
        ModalModule.forRoot(), TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })],
      providers: [
        ModeService,
        { provide: ProductService, useClass: MockProductService },
        { provide: TraceService, useClass: MockTraceService },
        MockAuthenticationService,
        { provide: AuthenticationServiceBase, useClass: MockAuthenticationService },
        { provide: HldlService, useValue: hldlServiceStub },
        RoutingHelperService,
        ErrorManagerService,
        AppContextService,
        { provide: HldlReaderService, useClass: MockHldlReaderService },
        SettingsService,
        { provide: IStateService, useValue: stateServiceI },
        SnapinInstancesService,
        { provide: StateService, useValue: stateServiceStub },
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService },
        provideHttpClient(withInterceptorsFromDi())
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaneComponent);
    comp = fixture.componentInstance;
    service = TestBed.inject(StateService);
  });

  it('should update properties on changes', () => {
    const spy: jasmine.Spy = spyOn<any>(comp, 'updateProperties');
    const changes: any = { name: SimpleChange };
    comp.ngOnChanges(changes);
    expect(spy).toHaveBeenCalledWith();
  });

  it('should update pane on route change', () => {
    const newSnapin: any = {
      fullId: 'fullId'
    };
    comp.frameId = 'frameId';
    comp.paneId = 'paneId';
    fixture.detectChanges();
    comp.onRouteChanged(newSnapin);
    expect(stateServiceI.updatePaneFromExternNavigate).toHaveBeenCalledWith('frameId', 'paneId', 'fullId');
  });

  it('should make expected calls to state service on update prop', () => {
    comp.frameId = 'frameId';
    comp.paneId = 'paneId';
    fixture.detectChanges();

    comp.updateProperties();
    expect(stateServiceI.currentState.getPaneStoreViaIds).toHaveBeenCalledWith('frameId', 'paneId');
    expect(stateServiceI.getPaneById).toHaveBeenCalledWith('paneId', 'frameId');
    expect(stateServiceI.currentState.getSnapInsFromPaneId).toHaveBeenCalledWith('frameId', 'paneId');
  });

});
