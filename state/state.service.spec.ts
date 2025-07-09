import { APP_BASE_HREF } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router, RouteReuseStrategy, RoutesRecognized, UrlTree } from '@angular/router';
import { HfwControlsModule } from '@gms-flex/controls';
import {
  AppContextService,
  AuthenticationServiceBase,
  MockAuthenticationService,
  MockProductService,
  MockTraceService,
  ModeData,
  ModeService,
  ProductService,
  TraceService
} from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { Observable, of } from 'rxjs';

import { FullPaneId } from '../../common/fullsnapinid/full-pane-id.model';
import { FullQParamId } from '../../common/fullsnapinid/full-qparam-id.model';
import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { FrameInfo, IHfwMessage, MessageParameters, SnapinDisplay } from '../../common/interfaces';
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
import * as hldl from '../shared/hldl/hldl-data.model';
import { HldlReaderService } from '../shared/hldl/hldl-reader.service';
import { HldlService } from '../shared/hldl/hldl.service';
import { MockHldlReaderService } from '../shared/hldl/mock-hldl-reader.service';
import { RouterOutletComponent } from '../shared/routing/router-outlet.component';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { SnapInStore } from '../shared/stores/snapin.store';
import { SnapinHostComponent } from '../snapin-host/snapin-host.component';
import { SplitterHostComponent } from '../splitterhost/splitterhost.component';
import { ErrorManagerService } from '../state/error-manager.service';
import { AppStatus } from './app-status.model';
import { ReuseStrategyService } from './reuse-strategy.service';
import { RoutingHelperService } from './routing-helper.service';
import { SnapinInstancesService } from './snapin-instances.service';
import { StateService } from './state.service';
import { FakePageComponent } from './test/fake-page.component';

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

export class MessageBrokerStub implements IHfwMessage {
  public sendMessage(fullId: FullSnapInId, location: FullPaneId, types: string[], messageBody: any,
    preselection: boolean, qParam: QParam, broadcast: boolean, applyRuleId: string): Observable<boolean> {
    return of(true);
  }
  public selectViaQParamService(message: MessageParameters): Observable<boolean> {
    return of(true);
  }
  public sendMessageFromRightPanel(senderId: string, senderFrameId: string, communicationId: string, types: string[], messageBody: any,
    preselection: boolean, qParam: QParam, broadcast: boolean, applyRuleId: string, secondarySelectionInSinglePane: boolean): Observable<boolean> {
    return of(true);
  }
  public getRightPanelMessage(frameId: string): Observable<any> {
    return of(null);
  }
  public switchToNextFrame(frameId: string): Observable<boolean> {
    return of(true);
  }
  public changeMode(mode: ModeData, openingFrameId: string, firstSelectionObj?: MessageParameters): Observable<boolean> {
    return of(true);
  }
  public getCurrentWorkAreaFrameInfo(): Observable<FrameInfo> | any {
    return of(undefined);
  }
  public getCurrentLayoutId(frameId: string): Observable<string> | any {
    return of(null);
  }
  public getCurrentMode(): Observable<ModeData | null> {
    return of(null);
  }
  public changeLayout(frameId: string, layoutId: string): Observable<boolean> {
    return of(true);
  }
  public lockLayout(frameId: string): void {
  }
  public logout(): void {
  }
  public clearLastMessage(fullId: FullSnapInId): void {
  }
  public getMessage(fullId: FullSnapInId): Observable<any> {
    return of(null);
  }
  public getPreselectionService(fullId: FullSnapInId): IPreselectionService {
    return null!;
  }
  public getStorageService(fullId: FullSnapInId): IStorageService {
    return null!;
  }
  public getQueryParam(qParamId: FullQParamId): Observable<string | null> {
    return of(null);
  }
  public resetFrameSettingsToDefault(frameId: string): Observable<boolean> {
    return of(true);
  }
  public displaySnapInTab(snapins: SnapinDisplay[]): Observable<boolean> {
    return of(true);
  }
  public hideSnapInTab(frameId: string, snapinId: string): Observable<boolean> {
    return of(true);
  }
  public calculateUrlOnSelection(fullId: FullSnapInId,
    location: FullPaneId,
    types: string[],
    messageBody: any,
    qParam: QParam,
    broadcast: boolean,
    applyRuleId: string): Observable<string> {
    return of('');
  }
  public getUpdatingLocation(fullId: FullSnapInId): FullPaneId {
    return null!;
  }
  public canChangeUserRoles(): Observable<boolean> {
    return of(true);
  }
  public fullScreenSnapin(location: FullPaneId, fullScreen: boolean): void {
  }
  public getCurrentWorkAreaView(): Observable<string | undefined> {
    return of(undefined);
  }
  public changeView(frameId: string, viewId: string): Observable<boolean> {
    return of(true);
  }
}

// //////  Tests  /////////////
const SYSTEM_MANAGER = 'system-manager';
const EVENT_LIST = 'event-list';

describe('StateService', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PageComponent, FakePageComponent, FrameComponent, SnapinHostComponent,
        PageNotFoundComponent, PaneComponent, SplitterHostComponent,
        PaneTabComponent, PaneHeaderComponent, PaneTabSelectedComponent,
        SnapinHostComponent,
        RouterOutletComponent, LayoutComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [HfwControlsModule, routing,
        ModalModule.forRoot(), TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })],
      providers: [HttpClient,
        { provide: 'appSettingFilePath', useValue: 'app-settings.json' },
        ModeService,
        { provide: ProductService, useClass: MockProductService },
        ModeService,
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
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService },
        { provide: APP_BASE_HREF, useValue: '/' }, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    })
      .compileComponents();
  }));

  it('check that getHfwInstance works with complete hldl configuration ',
    inject([HldlReaderService, AuthenticationServiceBase, StateService, ActivatedRoute, Router],
      (hldlReaderService: MockHldlReaderService, authenticationService: MockAuthenticationService,
        stateService: StateService, activatedRoute: ActivatedRoute, router: Router) => {

        // stateService.appStatus = AppStatus.running;
        stateService.getHfwInstance().
          subscribe((value: any) => {
            if (value != null) {

              stateService.appStatus = AppStatus.Initializing;
              expect(stateService.appStatus).toBe(AppStatus.Initializing);

              const fakeMsgBroker: MessageBrokerStub = new MessageBrokerStub();

              stateService.navigateFrames(fakeMsgBroker);

              stateService.currentState.changeWorkAreaFrame(EVENT_LIST);
              stateService.currentState.activeWorkAreaId.subscribe((valueId: string) => {
                expect(valueId).toEqual(EVENT_LIST);
              }).unsubscribe();

              stateService.currentState.changeWorkAreaFrame(SYSTEM_MANAGER);

              const hfwFrames: hldl.HfwFrame[] = stateService.getFrames()!;

              const frameStores: FrameStore[] = stateService.currentState.getFramesStore()!;

              const fullSnapInId: FullSnapInId = new FullSnapInId(EVENT_LIST, 'el');

              const fullSnapInId2: FullSnapInId = new FullSnapInId(SYSTEM_MANAGER, 'graph');

              const fullPaneId1: FullPaneId = new FullPaneId(EVENT_LIST, 'el-pane');

              const fullPaneId2: FullPaneId = new FullPaneId(SYSTEM_MANAGER, 'primary-pane');

              expect(FullSnapInId.areEqual(fullSnapInId, fullSnapInId2)).toBeFalsy();

              const getPreselectionService: IPreselectionService = stateService.currentState.getPreselectionService(fullSnapInId)!;

              const getStorageService: IStorageService = stateService.currentState.getStorageService(fullSnapInId)!;

              const snapInStore: SnapInStore = stateService.currentState.getSnapInStore(fullSnapInId)!;

              const paneStore: PaneStore = stateService.currentState.getPaneStore(fullPaneId1)!;

              const paneNotFound: hldl.Pane = stateService.getPaneById(fullPaneId1.paneId, fullSnapInId.frameId)!;
              const pane: hldl.Pane = stateService.getPaneById(fullPaneId1.paneId, fullPaneId1.frameId)!;

              const snapInStoresFromPane: SnapInStore[] = stateService.currentState.getSnapInsFromPaneId(fullSnapInId.frameId, fullPaneId1.paneId)!;

              const commRules: hldl.CommunicationRule[] = stateService.currentState.getSnapInCommRules(fullSnapInId, fullPaneId1)!;

              stateService.updatePaneFromExternNavigate(fullSnapInId.frameId, fullPaneId1.paneId, fullSnapInId2);

              const qParam: QParam = { name: fullSnapInId.frameId + '.SystemQParamService.primary', value: 'value' };
              stateService.pushNewSelectionQParam(qParam, stateService.currentState);

              // Implementing createUrlTree for next Methods

              stateService.switchToNextFrame(fullSnapInId.frameId, fakeMsgBroker).subscribe((res: boolean) => { expect(true).toEqual(true); });

              stateService.navigateToFrameViewLayout(fullSnapInId.frameId, 'tree-view', '2-pane').subscribe((res: boolean) => { expect(true).toEqual(true); });

              stateService.navigateToMultipleSelection(false);

              stateService.updatePaneFromExternNavigate(fullSnapInId.frameId, fullPaneId1.paneId, fullSnapInId2);

              // stateService.getCurrentLayoutId(fullSnapInId.frameId).subscribe((value: string) => {
              //   expect(value).toBe("ThreePanesLayout");
              // }).unsubscribe();

              stateService.lockUnlockLayout(fullSnapInId2.frameId);

              const currentPanes: PaneStore[] = stateService.getCurrentPaneStores();

              stateService.getCurrentLayoutId(fullSnapInId.frameId).subscribe((res: string) => { expect(true).toEqual(true); });

              stateService.getCurrentMode().subscribe((res: ModeData | undefined | null) => { expect(res)!.not.toBeNull(); });

              const f: FrameStore = stateService.currentState.getFrameStoreViaId(SYSTEM_MANAGER);
              const layoutId: string = stateService.getLayoutIdWhenClosed(f, 'comparison-pane')!;

              const paneVisible: boolean = stateService.currentState.isPaneVisibleInCurrentLayout(fullPaneId2);
              const isPaneReachable: boolean = stateService.currentState.isPaneReachable(fullPaneId2);

              stateService.updateLayoutFromExternNavigate(SYSTEM_MANAGER, 'tree-view', '2-pane-comparison');
              const panes: PaneStore[] = stateService.getPaneWontSurvive(SYSTEM_MANAGER, '1-pane');

              stateService.onResize();

              const currWorkAreaId: string = stateService.currentState.activeWorkAreaIdValue;
            }
          });

      }));

  it('check dispose of stores ',
    inject([HldlReaderService, AuthenticationServiceBase, StateService, ActivatedRoute, Router],
      (hldlReaderService: MockHldlReaderService, authenticationService: MockAuthenticationService,
        stateService: StateService, activatedRoute: ActivatedRoute, router: Router) => {

        // stateService.appStatus = AppStatus.running;
        stateService.getHfwInstance().
          subscribe((value: any) => {
            if (value != null) {

              stateService.appStatus = AppStatus.Initializing;
              expect(stateService.appStatus).toBe(AppStatus.Initializing);
              stateService.currentState.getFramesStore()!.forEach((f: FrameStore) => { f.dispose(); });
            }
          });

      }));

  it('check getUpdatingLocation ',
    inject([HldlReaderService, AuthenticationServiceBase, StateService, ActivatedRoute, Router],
      (hldlReaderService: MockHldlReaderService, authenticationService: MockAuthenticationService,
        stateService: StateService, activatedRoute: ActivatedRoute, router: Router) => {

        stateService.currentState.changeWorkAreaFrame(EVENT_LIST);
        stateService.currentState.changeWorkAreaFrame(SYSTEM_MANAGER);

        const fullSnapInId: FullSnapInId = new FullSnapInId(EVENT_LIST, 'el');
        expect(stateService.getUpdatingLocation(fullSnapInId)).toBeNull();
      }));

  it('check hasRouteConfigBeenReset ',
    inject([HldlReaderService, AuthenticationServiceBase, StateService, ActivatedRoute, Router],
      (hldlReaderService: MockHldlReaderService, authenticationService: MockAuthenticationService,
        stateService: StateService, activatedRoute: ActivatedRoute, router: Router) => {

        expect(stateService.hasRouteConfigBeenReset).toBe(false);
      }));

  it('check updateAvailableFrames ',
    inject([HldlReaderService, AuthenticationServiceBase, StateService, ActivatedRoute, Router],
      (hldlReaderService: MockHldlReaderService, authenticationService: MockAuthenticationService,
        stateService: StateService, activatedRoute: ActivatedRoute, router: Router) => {

        const fullSnapInId: FullSnapInId = new FullSnapInId(EVENT_LIST, 'el');
        stateService.updateAvailableFrames([fullSnapInId.frameId]).
          subscribe((value: any) => {
            if (value != null) {
              expect(value).toBe(true);
            }
          });
      }));
});
