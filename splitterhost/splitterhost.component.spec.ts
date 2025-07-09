// import { NO_ERRORS_SCHEMA } from "@angular/core";
// import { APP_BASE_HREF } from "@angular/common";
// import { TraceService, MockTraceService } from "@gms-flex/services-common";
// import { HldlService } from "../shared/hldl/hldl.service";
// import "rxjs/add/observable/of";
// import "rxjs/add/operator/map";
// import "rxjs/add/operator/do";
// import { IPreselectionService } from "../../common/interfaces/ipreselection.service";
// import { IStorageService } from "../../common/interfaces/istorage.service";
// import { RoutingHelperService } from "../state/routing-helper.service";
// import * as hldl from "../shared/hldl/hldl-data.model";

// import { AppContextService } from "@gms-flex/services-common";
// import { HttpClient } from "@angular/common/http";
// import { StateService } from "../state/state.service";
// import { HldlReaderService } from "../shared/hldl/hldl-reader.service";

// import { FrameComponent } from "../frame/frame.component";
// import { PageNotFoundComponent } from "../page/page-not-found.component";
// import { LayoutComponent } from "../layout/layout.component";
// import { PaneComponent } from "../pane/pane.component";
// import { PaneHeaderComponent } from "../pane-header/pane-header.component";
// import { PaneTabSelectedComponent } from "../pane-tab/pane-tabselected.component";
// import { PaneTabComponent } from "../pane-tab/pane-tab.component";
// import { SnapinHostComponent } from "../snapin-host/snapin-host.component";
// import { RouterOutletComponent } from "../shared/routing/router-outlet.component";
// import { SplitterHostComponent } from "./splitterhost.component";
// import { HttpClientModule } from "@angular/common/http";
// import { Mock1PreselectService } from "../../common/interfaces/test/mock1-ipreselection.service";
// import { Mock2PreselectService } from "../../common/interfaces/test/mock2-ipreselection.service";
// import { Mock1StorageService } from "../../common/interfaces/test/mock1-istorage.service";
// import { routing } from "../../testing/test.routing";
// import { HfwControlsModule } from "@gms-flex/controls";
// import { HfwServicesCommonModule } from "@gms-flex/services-common";
// import { PageComponent } from "../page/page.component";
// import { ActivatedRoute } from "@angular/router";
// import { BrowserModule } from "@angular/platform-browser";
// import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

// import { async, TestBed, inject,
//   ComponentFixture } from "@angular/core/testing";

//   describe("SplitterHostComponent", () => {

//     let comp:    SplitterHostComponent;
//     let fixture: ComponentFixture<SplitterHostComponent>;

//     // async beforeEach
//     beforeEach(async(() => {
//       TestBed.configureTestingModule({
//         imports: [ HfwControlsModule, HfwServicesCommonModule, HttpClientModule, HttpClientTestingModule, routing ],
//         declarations: [PageComponent, FrameComponent, SnapinHostComponent,
//           PageNotFoundComponent, PaneComponent, SplitterHostComponent,
//           PaneTabComponent, PaneHeaderComponent, PaneTabSelectedComponent,
//           SnapinHostComponent,
//           RouterOutletComponent, LayoutComponent],
//         providers: [ HttpClient,
//           { provide: TraceService, useClass: MockTraceService },
//           HldlService,
//           RoutingHelperService,
//           AppContextService,
//           HldlReaderService,
//           { provide: XHRBackend, useClass: MockBackend },
//           { provide: "hldlFilePath", useValue: "hldlFilePath.json"},
//           { provide: IPreselectionService, useClass: Mock1PreselectService, multi: true },
//           { provide: IPreselectionService, useClass: Mock2PreselectService, multi: true },
//           { provide: IStorageService, useClass: Mock1StorageService, multi: true },
//           StateService,
//           { provide: APP_BASE_HREF, useValue: "/" },
//           { provide: ActivatedRoute, useValue: {
//             "snapshot": {
//               "data": {
//                 "panes": [
//                   {},
//                   {}
//                 ],
//                 "layoutInstances": [
//                   {},
//                   {}
//                 ],
//                 "id": "summary-bar"
//               }
//             }
//           }}
//         ],

//         schemas:      [ NO_ERRORS_SCHEMA ]
//       })
//         .compileComponents();  // compile template and css
//     }));

//        // synchronous beforeEach
//     beforeEach(() => {
//       fixture = TestBed.createComponent(SplitterHostComponent);
//       comp    = fixture.componentInstance;
//     });

//    it("check that getHfwInstance works with complete hldl configuration ",
//      inject([XHRBackend, StateService], (mockBackend: MockBackend,
//        stateService: StateService)  => {
//       let resp: Response = new Response(new ResponseOptions({status: 200, body: body}));
//       mockBackend.connections.subscribe((c: MockConnection) => c.mockRespond(resp));
//       stateService.getHfwInstance().subscribe((value: any) => {
//         expect(value).toBe(value);
//       });

//     }));

//   });

//     describe("SplitterHostComponent with test host", () => {

//       let testHost: TestHostComponent;
//       let fixture: ComponentFixture<TestHostComponent>;
//       let homeInstance: SplitterHostComponent;

//       // async beforeEach
//       beforeEach(async(() => {
//         TestBed.configureTestingModule({
//           imports: [ BrowserAnimationsModule, BrowserModule,
//           HfwControlsModule, HfwServicesCommonModule, HttpModule, HttpClientModule, routing ],
//           declarations: [TestHostComponent, PageComponent, FrameComponent, SnapinHostComponent,
//             PageNotFoundComponent, PaneComponent, SplitterHostComponent,
//             PaneTabComponent, PaneHeaderComponent, PaneTabSelectedComponent,
//             SnapinHostComponent,
//             RouterOutletComponent, LayoutComponent],
//           providers: [ HttpClient,
//             { provide: TraceService, useClass: MockTraceService },
//             HldlService,
//             RoutingHelperService,
//             AppContextService,
//             HldlReaderService,
//             { provide: XHRBackend, useClass: MockBackend },
//             { provide: "hldlFilePath", useValue: "hldlFilePath.json"},
//             { provide: IPreselectionService, useClass: Mock1PreselectService, multi: true },
//             { provide: IPreselectionService, useClass: Mock2PreselectService, multi: true },
//             { provide: IStorageService, useClass: Mock1StorageService, multi: true },
//             StateService,
//             { provide: APP_BASE_HREF, useValue: "/" },
//             { provide: ActivatedRoute, useValue: {
//               "snapshot": {
//                 "data": {
//                   "panes": [
//                     {},
//                     {}
//                   ],
//                   "layoutInstances": [
//                     {},
//                     {}
//                   ],
//                   "id": "summary-bar"
//                 }
//               }
//             }}
//           ],

//           schemas:      [ NO_ERRORS_SCHEMA ]
//         })
//           .compileComponents();  // compile template and css
//       }));

//       beforeEach(() => {
//         fixture  = TestBed.createComponent(TestHostComponent);
//         testHost = fixture.componentInstance;
//         homeInstance = fixture.debugElement.children[0].componentInstance;
//       });

//      it("check that getHfwInstance works with complete hldl configuration ",
//        inject([XHRBackend], (mockBackend: MockBackend)  => {
//         let stateSpy: StateService  = fixture.debugElement.children[0].injector.get(StateService) as StateService;
//         let resp: Response = new Response(new ResponseOptions({status: 200, body: body}));
//         mockBackend.connections.subscribe((c: MockConnection) => c.mockRespond(resp));
//         stateSpy.getHfwInstance().subscribe((value: any) => {
//           expect(value).toBe(value);
//         });

//         fixture.detectChanges(); // trigger initial data binding
//         homeInstance.onChildrenStateChanged(true, true);
//         homeInstance.onChildrenStateChanged(false, false);
//         homeInstance.onChildrenStateChanged(true, false);
//         homeInstance.onChildrenStateChanged(false, true);

//       }));

//     });

//  ////// Test Host Component //////
// import { Component } from "@angular/core";
// import { HttpClientTestingModule } from "@angular/common/http/testing";
//  @Component({
//   template: `
//      <hfw-splitterhost class="hfw-flex-container-column hfw-flex-item-grow"
//      [splitterConfig]='splitter2'
//      [frameId]='frameId'>
// </hfw-splitterhost>
//   `
// })
//   class TestHostComponent {
//     public frameId: string = "system-manager";
//     public splitter2: hldl.Splitter = null;

//     public constructor() {
//       let paneInstance: hldl.PaneInstance = new hldl.PaneInstance("PrimaryPane");
//       let firstChild: hldl.FirstChild = new hldl.FirstChild(paneInstance, null);
//       let secondChild: hldl.SecondChild = new hldl.SecondChild(paneInstance, null);
//       let splitter: hldl.Splitter = new hldl.Splitter(firstChild, secondChild, "Vertical", "second", "60%");
//       let secondChild2: hldl.SecondChild = new hldl.SecondChild(null, splitter);

//       this.splitter2 = new hldl.Splitter(firstChild, secondChild2, "Vertical", "second", "60%");
//     }
//   }

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Component, SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, inject, TestBed, waitForAsync } from '@angular/core/testing';
import { RouteReuseStrategy } from '@angular/router';
import { HfwControlsModule, SplitterChanges } from '@gms-flex/controls';
import {
  AppContextService, AuthenticationServiceBase, MockAuthenticationService,
  MockProductService, MockTraceService, ProductService, SettingsServiceBase, TraceService
} from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { SiContentActionBarModule, SiEmptyStateModule, SiResizeObserverModule } from '@simpl/element-ng';
import { FirstChild, PaneInstance, Splitter } from 'dist/@gms-flex/core';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { Subscription } from 'rxjs';

import { IStateService } from '../../common/interfaces';
import { routing } from '../../testing/test.routing';
import { PageComponent } from '../page/page.component';
import { PaneHeaderComponent } from '../pane-header/pane-header.component';
import { PaneTabComponent, PaneTabSelectedComponent } from '../pane-tab';
import { PaneComponent } from '../pane/pane.component';
import { SettingsService } from '../settings/settings.service';
import { HldlReaderService, HldlService, MockHldlReaderService, SecondChild } from '../shared/hldl';
import * as hldl from '../shared/hldl/hldl-data.model';
import { HLDL_TEST_EXAMPLE } from '../shared/hldl/hldl-example-data.model';
import { RouterOutletComponent } from '../shared/routing/router-outlet.component';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { ErrorManagerService } from '../state/error-manager.service';
import { MockStateService } from '../state/mock-state.service';
import { ReuseStrategyService } from '../state/reuse-strategy.service';
import { RoutingHelperService } from '../state/routing-helper.service';
import { SnapinInstancesService } from '../state/snapin-instances.service';
import { StateService } from '../state/state.service';
import { HfwTabComponent, HfwTabsetComponent } from '../tabs';
import { SplitterHostComponent } from './splitterhost.component';

@Component({
  template: `
    <hfw-splitterhost pane1
    [ngClass]="{ 'hfw-hidden-fullscreen': firstChildHiddenOnFullScreen}"
    [frameId]='frameId'
    [paneId]='firstChildConfig'
    [splitterConfig]='firstChildConfig' />

    <hfw-splitterhost pane2
    [ngClass]="{ 'hfw-hidden-fullscreen': firstChildHiddenOnFullScreen}"
    [frameId]='frameId'
    [paneId]='secondChildConfig'
    [splitterConfig]='secondChildConfig' />
  `,
  standalone: false
})
class TestSplitterHostComponent {
  public firstChildConfig: any = null;
  public frameId = 'frameId';
  public paneId = 'paneId';
  public secondChildConfig: any = null;
}

describe('SplitterHostComponent', () => {
  let component: SplitterHostComponent;
  let fixture: ComponentFixture<SplitterHostComponent>;
  let hostComponent: TestSplitterHostComponent;
  let fixtureHostComponent: ComponentFixture<TestSplitterHostComponent>;
  let service: IStateService;
  let stateServiceI: jasmine.SpyObj<IStateService>;

  const paneInstance: hldl.PaneInstance = new hldl.PaneInstance('PrimaryPane', '');
  const firstChild: hldl.FirstChild = new hldl.FirstChild(paneInstance, null!);
  const secondChild: hldl.SecondChild = new hldl.SecondChild(paneInstance, null!);
  const splitter: hldl.Splitter = new hldl.Splitter(firstChild, secondChild, 'Vertical', 'second', '60%', '%60', 'id');
  const secondChild2: hldl.SecondChild = new hldl.SecondChild(paneInstance, null!);

  // const dataStructure: StateDataStructure = StateDataStructureCreator.createDataStructure(HLDL_TEST_EXAMPLE.hfwInstance, svc);

  const stateServiceStub: any = {
    getFrameStoreViaId: (): FrameStore | null => null,
    getPaneStoreViaIds: (): PaneStore | null => null
  };

  beforeEach(waitForAsync(() => {
    stateServiceI = jasmine.createSpyObj('IStateService', ['navigateToSnapId', 'activateQParamSubscription', 'getFrames']);
    stateServiceI.currentState = jasmine.createSpyObj('currentState', ['getFrameStoreViaId']);

    stateServiceI.activateQParamSubscription.and.returnValue();

    TestBed.configureTestingModule({
      declarations: [PageComponent, RouterOutletComponent, PaneComponent, PaneHeaderComponent, PaneTabComponent,
        PaneTabSelectedComponent, SplitterHostComponent, HfwTabComponent, HfwTabsetComponent],
      imports: [HfwControlsModule, SiEmptyStateModule, SiContentActionBarModule, SiResizeObserverModule, TabsModule.forRoot(),
        routing, TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })],
      providers: [{ provide: 'appSettingFilePath', useValue: 'app-settings.json' },
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
        SettingsService,
        SnapinInstancesService,
        { provide: IStateService, useValue: stateServiceI },
        StateService,
        MockStateService,
        SettingsServiceBase,
        // { provide: StateService, useValue: stateServiceStub },
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService }, provideHttpClient(withInterceptorsFromDi())]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixtureHostComponent = TestBed.createComponent(TestSplitterHostComponent);
    hostComponent = fixtureHostComponent.componentInstance;
    fixture = TestBed.createComponent(SplitterHostComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(IStateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update properties onchanges', () => {
    const spy: jasmine.Spy = spyOn<any>(component, 'updateProperties');
    const changes: any = { name: SimpleChange };
    const splitterConfigMock = jasmine.createSpyObj<Splitter>('Splitter', ['firstChild', 'secondChild', 'id', 'orientation']);
    component.splitterConfig = splitterConfigMock;

    component.ngOnChanges(changes);

    expect(spy).toHaveBeenCalled();
  });

  it('should verify undefined frameId on ngOnInit', () => {

    component.ngOnInit();

    expect(component.frameId).not.toBeDefined();
  });

  it('should verify frameId on ngOnInit', () => {

    component.frameId = hostComponent.frameId;
    const splitterConfigMock = jasmine.createSpyObj<Splitter>('Splitter', ['firstChild', 'secondChild', 'id', 'orientation']);
    component.splitterConfig = splitterConfigMock;
    component.ngOnInit();

    expect(component.firstChildSize).not.toBeDefined();
  });

  it('should unsubscribe on destroy', () => {
    (component as any).subscriptions = [new Subscription()];
    const spySub: jasmine.Spy = spyOn<any>(component, 'unsubscribe');

    component.ngOnDestroy();

    expect(spySub).toHaveBeenCalled();
  });

  it('should verify checkChangesFunction', () => {
    component.frameId = hostComponent.frameId;
    const splitterChangesMock: SplitterChanges = { newPaneSize: '', isSplitterCollapseChanged: true, isCollapsed: false };
    component.checkChangesFunction(splitterChangesMock);
    expect(component.paneProgammaticallyCollapsed).toBeFalse();
  });

  it('should verify onSplitterChange', () => {
    component.frameId = hostComponent.frameId;
    const splitterChangesMock: SplitterChanges = { newPaneSize: '', isSplitterCollapseChanged: true, isCollapsed: false };
    component.onSplitterChange(splitterChangesMock);
  });

  it('should verify onUpdateFullScreenClasses', () => {
    component.frameId = hostComponent.frameId;
    component.onUpdateFullScreenClasses(true, true);
    expect(component.secondChildHiddenOnFullScreen).toBeTrue();
  });

  it('should verify splitterConfigFirstChildCheck', () => {
    component.frameId = hostComponent.frameId;
    const splitterConfigMock = jasmine.createSpyObj<Splitter>('Splitter', ['firstChild', 'secondChild', 'id', 'orientation']);
    component.splitterConfig = splitterConfigMock;
    component.splitterConfigFirstChildCheck();
    expect(component.isFirstChildAPane).toBeUndefined();
  });

  it('should verify splitterConfigSecondChildCheck', () => {
    component.frameId = hostComponent.frameId;
    const splitterConfigMock = jasmine.createSpyObj<Splitter>('Splitter', ['firstChild', 'secondChild', 'id', 'orientation']);
    component.splitterConfig = splitterConfigMock;
    component.splitterConfigSecondChildCheck();
    expect(component.secondChildConfig).toBeNull();
  });

  it('should close first and second child pane', () => {
    const spy: jasmine.Spy = spyOn(component.splitterStateChanged, 'emit');
    component.firstPaneClosed = true;
    component.secondPaneClosed = true;

    (component as any).closeFirstChildPane();
    expect(spy).toHaveBeenCalledWith(false);

    (component as any).closeSecondChildPane();
    expect(spy).toHaveBeenCalledWith(false);
  });

  // Should we test private methods, is it a good practice? Will take a look at it later.
  /*  it('should open first and second child pane', () => {
      const paneInstanceMock = jasmine.createSpyObj<PaneInstance>('PaneInstance', ['id', 'whenClosed']);
      const splitterConfigMock = jasmine.createSpyObj<Splitter>('Splitter', ['firstChild', 'secondChild', 'id', 'orientation']);
      const firstChildConfigMock = jasmine.createSpyObj<FirstChild>('FirstChild', ['paneInstance', 'splitter']);
      const paneStoreMock = jasmine.createSpyObj<PaneStore>('PaneStore', ['setFullScreen']);
      paneInstanceMock.id = 'pane1';
      splitterConfigMock.firstChild.paneInstance = paneInstanceMock;
      const spy: jasmine.Spy = spyOn(component.splitterStateChanged, 'emit');
      (component as any).openFirstChildPane();
      console.info('TESST', splitterConfigMock);
      component.splitterConfig = splitterConfigMock;

      console.info(component.splitterConfig);
      expect(spy).toHaveBeenCalledWith(true);
      expect(component.firstPaneClosed).toBeFalsy();
      // @ts-expect-error
      component.openSecondChildPane();
      //expect(spy1).toHaveBeenCalledWith('frameId', 'paneId');
      expect(spy).toHaveBeenCalledWith(true);
      expect(component.secondPaneClosed).toBeFalsy();
    });*/

  it('should make expected calls on children state change', () => {
    const fns: string[] = ['openFirstChildPane', 'openSecondChildPane', 'closeFirstChildPane', 'closeSecondChildPane'];
    const conds: any[] = [[true, true], [true, false], [false, true], [false, false]];
    for (let i = 0; i < 4; i++) {
      const spy: jasmine.Spy = spyOn<any>(component, fns[i]);
      component.onChildrenStateChanged(conds[i][0], conds[i][1]);
      expect(spy).toHaveBeenCalled();
    }
  });

});
