/* eslint-disable @typescript-eslint/dot-notation */
import { APP_BASE_HREF } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { fakeAsync, flush, inject, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router, RouteReuseStrategy, RoutesRecognized, UrlTree } from '@angular/router';
import { HfwControlsModule } from '@gms-flex/controls';
import { IStateService } from '@gms-flex/core';
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

import { FullQParamId } from '../../common/fullsnapinid/full-qparam-id.model';
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
import { QParamStore } from '../shared/stores/qparam-store';
import { SnapInStore } from '../shared/stores/snapin.store';
import { SnapinHostComponent } from '../snapin-host/snapin-host.component';
import { SnapinMessageBroker } from '../snapinmessagebroker/snapinmessagebroker.service';
import { SplitterHostComponent } from '../splitterhost/splitterhost.component';
import { ErrorManagerService } from '../state/error-manager.service';
import { MockStateService } from '../state/mock-state.service';
import { ReuseStrategyService } from '../state/reuse-strategy.service';
import { RoutingHelperService } from '../state/routing-helper.service';
import { StateService } from '../state/state.service';
import { AutomaticFirstSelectionHandler } from './automatic-first-selection-handler';

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
    const urlTree: UrlTree = new UrlTree();
    return urlTree;
  }
}

// //////  Tests  /////////////
describe('Automatic First Selection Handler', () => {

  let stateServiceI: jasmine.SpyObj<IStateService>;

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

    stateServiceI.activateQParamSubscription.and.returnValue();

    TestBed.configureTestingModule({
      declarations: [
        FrameComponent,
        LayoutComponent,
        PageComponent,
        PageNotFoundComponent,
        PaneComponent,
        PaneTabComponent,
        PaneHeaderComponent,
        PaneTabSelectedComponent,
        RouterOutletComponent,
        SnapinHostComponent,
        SnapinHostComponent,
        SplitterHostComponent
      ],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [HfwControlsModule,
        HfwServicesCommonModule,
        routing,
        ModalModule.forRoot(), TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })],
      providers: [
        SnapinMessageBroker,
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
        SettingsService,
        { provide: IStateService, useValue: stateServiceI },
        { provide: StateService, useClass: MockStateService },
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService },
        { provide: APP_BASE_HREF, useValue: '/' },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('Automatic First Selection Handle', inject([SnapinMessageBroker, StateService, TraceService], (
    snapinMessageBroker: SnapinMessageBroker,
    state: MockStateService,
    trace: MockTraceService) => {

    const selectionQParam: QParamStore = state.currentState.getQParamStore(new FullQParamId('system-manager', 'SystemQParamService', ''))!;
    const automaticFirstSelectionHandler: AutomaticFirstSelectionHandler = new AutomaticFirstSelectionHandler(
      'testFirstSelection',
      selectionQParam,
      snapinMessageBroker,
      trace
    );

    // Mock private methods with spies
    spyOn<any>(automaticFirstSelectionHandler, 'sendAutomaticFirstSelection').and.returnValue(of(true));

    automaticFirstSelectionHandler.sendAutomaticFirstSelection().subscribe((res: boolean) => {
      expect(res).toBe(true);
    });
  }));

  it('should call sendAutomaticFirstSelection and return true when message is sent', inject([SnapinMessageBroker, StateService, TraceService], fakeAsync((
    snapinMessageBroker: SnapinMessageBroker,
    state: MockStateService,
    trace: MockTraceService) => {

    const selectionQParam: QParamStore = state.currentState.getQParamStore(new FullQParamId('system-manager', 'SystemQParamService', ''))!;
    const automatciFirst = new AutomaticFirstSelectionHandler('testFirstSelection', selectionQParam, snapinMessageBroker, trace);

    spyOn<any>(automatciFirst, 'onSubscription').and.callThrough();
    // Act
    let result: boolean | undefined;
    automatciFirst.sendAutomaticFirstSelection().subscribe(res => {
      result = res;
    });

    // Ensure all pending async tasks complete
    tick();
    flush();

    // Assert
    expect(result).toBe(true);
  })));

  it('should call sendDeeplinkAutomaticFirstSelection and return true when message is sent',
    inject([SnapinMessageBroker, StateService, TraceService], fakeAsync((
      snapinMessageBroker: SnapinMessageBroker,
      state: MockStateService,
      trace: MockTraceService) => {

      const selectionQParam: QParamStore = state.currentState.getQParamStore(new FullQParamId('system-manager', 'SystemQParamService', ''))!;
      const automatciFirst = new AutomaticFirstSelectionHandler('testFirstSelection', selectionQParam, snapinMessageBroker, trace);

      spyOn<any>(automatciFirst, 'onDeeplinkSubscription').and.callThrough();

      // Act
      let result: boolean | undefined;
      automatciFirst.sendDeeplinkAutomaticFirstSelection('param', 'paramValue').subscribe((res: boolean) => {
        result = res;
      });

      // Ensure all pending async tasks complete
      tick();
      flush();

      // Assert
      expect(result).toBe(true);
      expect(automatciFirst['onDeeplinkSubscription']).toHaveBeenCalled();
    })));

  it('should handle null qParamStore in sendAutomaticFirstSelection method', inject([SnapinMessageBroker, StateService, TraceService], (
    snapinMessageBroker: SnapinMessageBroker,
    state: MockStateService,
    trace: MockTraceService) => {

    const automatciFirst = new AutomaticFirstSelectionHandler('testFirstSelection', null, snapinMessageBroker, trace);

    automatciFirst.sendAutomaticFirstSelection().subscribe((res: boolean) => {
      expect(res).toBe(true); // Expectation based on the current logic for null qParamStore
    });
  }));

  it('should call teardownLogic when unsubscribed from the observable', inject([SnapinMessageBroker, StateService, TraceService], (
    snapinMessageBroker: SnapinMessageBroker,
    state: MockStateService,
    trace: MockTraceService) => {

    const selectionQParam: QParamStore = state.currentState.getQParamStore(new FullQParamId('system-manager', 'SystemQParamService', ''))!;
    const automatciFirst = new AutomaticFirstSelectionHandler('testFirstSelection', selectionQParam, snapinMessageBroker, trace);

    // Spy on private method teardownLogic
    spyOn<any>(automatciFirst, 'teardownLogic').and.callThrough();

    const subscription = automatciFirst.sendAutomaticFirstSelection().subscribe();
    subscription.unsubscribe();

    expect(automatciFirst['teardownLogic']).toHaveBeenCalled(); // Private method access via spy
  }));

  it('should call dispose in teardownLogic', inject([SnapinMessageBroker, StateService, TraceService], (
    snapinMessageBroker: SnapinMessageBroker,
    state: MockStateService,
    trace: MockTraceService) => {

    const selectionQParam: QParamStore = state.currentState.getQParamStore(new FullQParamId('system-manager', 'SystemQParamService', ''))!;
    const automatciFirst = new AutomaticFirstSelectionHandler('testFirstSelection', selectionQParam, snapinMessageBroker, trace);

    // Spy on private method dispose
    spyOn<any>(automatciFirst, 'dispose').and.callThrough();
    automatciFirst['teardownLogic']();

    expect(automatciFirst['dispose']).toHaveBeenCalled(); // Private method access via spy
  }));
});
