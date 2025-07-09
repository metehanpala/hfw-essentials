import { APP_BASE_HREF } from '@angular/common';
import { HttpClient, HttpHandler, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router, RouteReuseStrategy } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AppContextService,
  AuthenticationServiceBase,
  MockAuthenticationService,
  MockProductService,
  MockTraceService,
  ModeService,
  ProductService,
  TraceService } from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable } from 'rxjs';

import { FullPaneId, FullSnapInId } from '../../common/fullsnapinid';
import { IStateService } from '../../common/interfaces';
import { IPreselectionService } from '../../common/interfaces/ipreselection.service';
import { IStorageService } from '../../common/interfaces/istorage.service';
import { RuntimeInfo } from '../../common/interfaces/runtime-info.model';
import { Mock1PreselectService } from '../../common/interfaces/test/mock1-ipreselection.service';
import { Mock1StorageService } from '../../common/interfaces/test/mock1-istorage.service';
import { Mock2PreselectService } from '../../common/interfaces/test/mock2-ipreselection.service';
import { routing } from '../../testing/test.routing';
import { PageComponent } from '../page/page.component';
import { SettingsService } from '../settings/settings.service';
import * as hldl from '../shared/hldl/hldl-data.model';
import { HLDL_TEST_EXAMPLE } from '../shared/hldl/hldl-example-data.model';
import { HldlReaderService } from '../shared/hldl/hldl-reader.service';
import { HldlService } from '../shared/hldl/hldl.service';
import { MockHldlReaderService } from '../shared/hldl/mock-hldl-reader.service';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { SnapInStore } from '../shared/stores/snapin.store';
import { MockStateService } from '../state';
import { AppStatus } from '../state/app-status.model';
import { StateDataStructure, StateDataStructureCreator } from '../state/data-structure-creation/state-data-structure-creator';
import { ErrorManagerService } from '../state/error-manager.service';
import { ReuseStrategyService } from '../state/reuse-strategy.service';
import { RoutingHelperService } from '../state/routing-helper.service';
import { SnapinInstancesService } from '../state/snapin-instances.service';
import { StateService } from '../state/state.service';
import { SnapInConfigService } from './snapinconfig.service';

// //////  Tests  /////////////
const EVENT_LIST = 'event-list';

describe('SnapInConfig Service', () => {
  let stateServiceI: jasmine.SpyObj<IStateService>;

  beforeEach(waitForAsync(() => {

    stateServiceI = jasmine.createSpyObj('IStateService', ['navigateToSnapId', 'activateQParamSubscription', 'getFrames',
      'updatePaneFromExternNavigate', 'getCurrentPaneStores']);
    stateServiceI.currentState = jasmine.createSpyObj('currentState', ['getFrameStoreViaId', 'getPaneStoreViaIds']);

    stateServiceI.activateQParamSubscription.and.returnValue();

    TestBed.configureTestingModule({
      declarations: [PageComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [routing,
        ModalModule.forRoot(), TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })],
      providers: [
        { provide: 'appSettingFilePath', useValue: 'app-settings.json' },
        ModeService,
        { provide: ProductService, useClass: MockProductService },
        ModeService,
        SnapInConfigService,
        HttpClient,
        { provide: TraceService, useClass: MockTraceService },
        MockAuthenticationService,
        { provide: AuthenticationServiceBase, useClass: MockAuthenticationService },
        HldlService,
        RoutingHelperService,
        ErrorManagerService,
        AppContextService,
        HldlReaderService,
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
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create SnapInConfigService',
    inject([SnapInConfigService], (snapInConfigService: SnapInConfigService) => {
      expect(snapInConfigService instanceof SnapInConfigService).toBe(true);
      expect(snapInConfigService.getLayouts('system-manager')).toBeDefined();
    }));

  it('check that getHfwInstance works with complete hldl configuration ',
    inject([StateService, ActivatedRoute, Router, HldlReaderService, SnapInConfigService], (
      stateService: StateService, activatedRoute: ActivatedRoute, router: Router,
      hldlReaderService: MockHldlReaderService, snapInConfigService: SnapInConfigService) => {

      stateService.appStatus = AppStatus.Running;
      stateService.getHfwInstance().
        subscribe((value: any) => {
          if (value != null) {
            expect(value).not.toBeNull();
            expect(snapInConfigService.getFrames()).toBeDefined();
            expect(snapInConfigService.getFrames().length).toBe(6);
            expect(snapInConfigService.getFrames()[0].id).toBe('summary-bar');
          }
        });
    }));
});

describe('SnapinConfig Service', () => {
  let snapinConfigService: any;

  let hfwFrames: hldl.HfwFrame[];
  let hfwFrame: hldl.HfwFrame;
  let frameStore: FrameStore;

  let sniReference: hldl.SnapInReference;

  const modes: hldl.Mode[] = HLDL_TEST_EXAMPLE.hfwInstance.modes;

  beforeEach(() => {
    const stateStub: any = {
      getSnapInReference: (fullId: FullSnapInId, location: FullPaneId) => sniReference
    };

    const stateServiceStub: any = {
      currentState: stateStub
    };

    const hldlServiceStub: any = {
      getModes: () => modes,
      getSnapInReference: (fullId: FullSnapInId, location: FullPaneId): hldl.SnapInReference => {
        // check if location is null, the snapin can be in the right panel.
        const fr: hldl.HfwFrame = hfwFrames.find(f => f.id === fullId.frameId)!;
        const paneConfig = fr.panes.find(p => p.id === location.paneId);
        const sni = paneConfig!.snapInReferences.find(s => s.id === fullId.snapInId);
        return sni!;
      }
    };

    TestBed.configureTestingModule({
      providers: [
        MockStateService, RoutingHelperService,
        { provide: HldlService, useValue: hldlServiceStub },
        { provide: StateService, useValue: stateServiceStub },
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService },
        { provide: TraceService, useClass: MockTraceService }
      ],
      imports: [RouterTestingModule]
    });

    const svc: MockStateService = TestBed.inject(MockStateService);
    hfwFrames = HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames;
    const dataStructure: StateDataStructure = StateDataStructureCreator.createDataStructure(HLDL_TEST_EXAMPLE.hfwInstance, svc);
    frameStore = dataStructure.frameMap.get(EVENT_LIST)!;
    hfwFrame = frameStore.frameConfig;
    sniReference = new hldl.SnapInReference(EVENT_LIST, [], hfwFrame.panes[0].snapInReferences[0].config, false);

    stateServiceStub.currentState.getFrameStoreViaId = (): FrameStore => frameStore;
    stateServiceStub.currentState.getPaneStore = (): PaneStore => new PaneStore(hfwFrame.panes[0]);
    stateServiceStub.currentState.getSnapInStore = (): SnapInStore => new SnapInStore([], 'tabResId');
    stateServiceStub.getFrames = (): hldl.HfwFrame[] => hfwFrames;
    stateServiceStub.getPrimaryBarConfig = (): hldl.PrimaryBarConfig => (new hldl.PrimaryBarConfig([]));
    stateServiceStub.getVerticalBarConfig = (): hldl.VerticalBarConfig => (new hldl.VerticalBarConfig('f', [], []));

    hldlServiceStub.getFrameById = (): hldl.HfwFrame => hfwFrame;
    hldlServiceStub.hasLoadedProfile = (): boolean => true;
    hldlServiceStub.getSnapInTypes = (): hldl.SnapInType[] => [];
    hldlServiceStub.getPaneConfig = (): hldl.Pane => hfwFrame.panes[0];

    snapinConfigService = new SnapInConfigService(stateServiceStub, hldlServiceStub);
  });

  it('should load instance', () => {
    expect(snapinConfigService).toBeTruthy();
  });

  it('should get layouts', () => {
    const availableLayouts: Observable<any> = snapinConfigService.getLayouts(EVENT_LIST);
    expect(availableLayouts).toEqual(frameStore.availableLayouts);
  });

  it('should get snapin hldl config', () => {
    const fullSnapinId: FullSnapInId = new FullSnapInId(EVENT_LIST, 'el');
    const fullPaneId: FullPaneId = new FullPaneId(EVENT_LIST, 'el-pane');
    const config: any = snapinConfigService.getSnapInHldlConfig(fullSnapinId, fullPaneId);
    const equal = hfwFrame.panes[0].snapInReferences[0].config;
    expect(config).toEqual(hfwFrame.panes[0].snapInReferences[0].config);
  });

  it('should get frames', () => {
    const frames: any[] = snapinConfigService.getFrames();
    expect(frames).toEqual(HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames);
  });

  it('should check if pane can be displayed', () => {
    const isDisplayable: Observable<boolean> = snapinConfigService.paneCanBeDisplayed(EVENT_LIST, 'el');
    const displayableSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    expect(isDisplayable).toEqual(displayableSubject.asObservable());
  });

  it('should get available modes', () => {
    const res: string[] = snapinConfigService.getAvailableModes();
    expect(res).toEqual(['default', 'investigative']);
  });

  it('should get runtime info', () => {
    snapinConfigService.RuntimeInfo = {
      isDesktopViewport: true,
      isTabletViewport: false
    };
    const mockRuntime: RuntimeInfo = snapinConfigService.runtimeInfo;
    const runtimeInfo: RuntimeInfo = snapinConfigService.getRuntimeInfo();
    expect(runtimeInfo).toEqual(mockRuntime);
  });

  it('should getPrimaryBarConfig', () => {
    const res: hldl.PrimaryBarConfig = snapinConfigService.getPrimaryBarConfig();
    expect(res).not.toBeNull(res);
  });

  it('should getVerticalBarConfig', () => {
    const res: hldl.VerticalBarConfig = snapinConfigService.getVerticalBarConfig();
    expect(res).not.toBeNull(res);
  });

  it('should get hasLoadedProfile', () => {
    const res: boolean = snapinConfigService.hasLoadedProfile('p');
    expect(res).toBeTrue();
  });

  it('should getSnapInTypes', () => {
    const res: hldl.SnapInType[] = snapinConfigService.getSnapInTypes();
    expect(res).not.toBeNull(res);
  });

});
