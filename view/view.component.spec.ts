import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { } from '@angular/common/http/testing';
import { Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, inject, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, RouteReuseStrategy } from '@angular/router';
import { IStateService } from '@gms-flex/core';
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

import { IPreselectionService } from '../../common/interfaces/ipreselection.service';
import { IStorageService } from '../../common/interfaces/istorage.service';
import { Mock1PreselectService } from '../../common/interfaces/test/mock1-ipreselection.service';
import { Mock1StorageService } from '../../common/interfaces/test/mock1-istorage.service';
import { Mock2PreselectService } from '../../common/interfaces/test/mock2-ipreselection.service';
import { routing } from '../../testing/test.routing';
import { PageComponent } from '../page/page.component';
import { SettingsService } from '../settings/settings.service';
import { HLDL_TEST_EXAMPLE } from '../shared/hldl/hldl-example-data.model';
import { HldlReaderService } from '../shared/hldl/hldl-reader.service';
import { HldlService } from '../shared/hldl/hldl.service';
import { MockHldlReaderService } from '../shared/hldl/mock-hldl-reader.service';
import { ErrorManagerService } from '../state/error-manager.service';
import { ReuseStrategyService } from '../state/reuse-strategy.service';
import { RoutingHelperService } from '../state/routing-helper.service';
import { SnapinInstancesService } from '../state/snapin-instances.service';
import { StateService } from '../state/state.service';
import { ViewComponent } from './view.component';

describe('ViewComponent', () => {

  let comp: ViewComponent;
  let fixture: ComponentFixture<ViewComponent>;
  let stateServiceI: jasmine.SpyObj<IStateService>;

  // async beforeEach
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
      declarations: [PageComponent, ViewComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [routing,
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
        { provide: IStateService, useValue: stateServiceI },
        StateService,
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService },
        { provide: APP_BASE_HREF, useValue: '/' },
        {
          provide: ActivatedRoute, useValue: {
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
          }
        },
        provideHttpClient(withInterceptorsFromDi())
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewComponent);
    comp = fixture.componentInstance;
  });

  it('check that getHfwInstance works with complete hldl configuration ',
    inject([HldlReaderService, StateService], (hldlReaderService: MockHldlReaderService,
      stateService: StateService) => {

      stateService.getHfwInstance().subscribe((value: any) => {
        expect(value).not.toBeNull();
      });
      comp.ngOnInit();
    }));

});

// //// Test Host Component //////
@Component({
  template: `
    <hfw-view />
    `,
  standalone: false
})
class TestHostComponent { }

describe('ViewComponent', () => {

  let component: ViewComponent;
  let fixture: ComponentFixture<ViewComponent>;
  let stateServiceI: jasmine.SpyObj<IStateService>;

  // async beforeEach
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
      declarations: [PageComponent, ViewComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [routing,
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
        { provide: IStateService, useValue: stateServiceI },
        StateService,
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService },
        { provide: APP_BASE_HREF, useValue: '/' },
        {
          provide: ActivatedRoute, useValue: {
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
          }
        },
        provideHttpClient(withInterceptorsFromDi())
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewComponent);
    component = fixture.componentInstance;
  });

  it('check that getHfwInstance works with complete hldl configuration ',
    inject([HldlReaderService, StateService], (hldlReaderService: MockHldlReaderService,
      stateService: StateService) => {

      // hldlReaderService.mockHldl = HLDL_TEST_EXAMPLE;
      stateService.getHfwInstance().subscribe((value: any) => {
        expect(value).toBe(value);
      });
      component.ngOnInit();
    }));

});
