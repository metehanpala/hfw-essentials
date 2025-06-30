import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { IHfwMessage, ISnapInConfig, SnapInBase } from '@gms-flex/core';
import {
  BrowserObject, CnsHelperService, ExecuteCommandServiceBase,
  GmsMessageData, GmsSelectionType,
  GraphicsService, ObjectAttributes,
  SystemBrowserServiceBase, TablesServiceBase
} from '@gms-flex/services';
import {
  AppContextService, TraceService
} from '@gms-flex/services-common';
import { TimerService } from '@gms-flex/snapin-common';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';

import { GmsGraphicsViewerSnapInModule } from '../gms-graphics-viewer-snapin.module';
import { GraphicsViewerSnapInComponent } from './graphics-viewer-snapin.component';

export class TranslateServiceStub {

  public get(key: any): Observable<any> {
    return of(key);
  }

  public get onLangChange(): Observable<any> {
    return of({ lang: 'en' });
  }

  public getBrowserLang(): string {
    return 'en';
  }

  public setDefaultLang(value: string): void {

  }
}

@Component({
    selector: 'gms-graphic-view',
    template: `
    <div *ngIf="graphic">A graphic is present</div>
    <div *ngIf="!graphic">No graphic is present</div>`,
    standalone: false
})

class MockGraphicViewComponent implements OnDestroy, OnChanges, OnInit {
  @Input() public _selectedObject: any = 'the selected object';
  // dummy variable created to satisfy lint rules
  private _dummy: string = '';

  public ngOnChanges(): void {
    this._dummy = 'ngOnChanges()';
  }

  public ngOnInit(): void {
    this._dummy = 'ngOnInit()';
  }

  public ngOnDestroy(): void {
    this._dummy = 'ngOnDestroy()';
  }
}

describe('GraphicsSnapInComponent', () => {
  // For stubbing Observables
  const nullObservable: BehaviorSubject<any> = new BehaviorSubject(null);

  // Mocks for Angular services
  const mockActivatedRoute: any = jasmine.createSpyObj('mockActivatedRoute', ['snapshot']);
  mockActivatedRoute.snapshot = {
    'data': {
      'snapinId': {
        'frameId': 'frameId_Test',
        'snapInId': 'snapInId_Test'
      },
      'paneId': {
        'frameId': 'frameId_Test',
        'paneId': 'paneId_Test'
      }
    }
  };

  // Mocks for gms-services services
  const mockTablesService = jasmine.createSpyObj('mockTablesService', ['getGlobalText', 'getIconForTextGroupEntry', 'getTextAndColorForTextGroupEntry']);
  const mockSystemBrowserService: any = jasmine.createSpy('mockSystemBrowserService');
  mockTablesService.getGlobalText.and.returnValue(of(''));

  // Mocks for hfw-services-common dependencies
  const mockTraceService: any = jasmine.createSpyObj('mockTraceService', ['info', 'error', 'warn', 'debug']);
  const mockAppContextService: any = jasmine.createSpyObj('mockAppContextService', ['getBrowserLang']);
  mockAppContextService.defaultCulture = nullObservable;
  mockAppContextService.userCulture = nullObservable;
  mockAppContextService.getBrowserLang.and.returnValue(nullObservable);

  // Mocks for hfw-core dependencies
  const mockSnapInBase: any = jasmine.createSpyObj('mockSnapInBase', ['getFullSnapInIdFromRoute']);
  const mockMessageBroker: any = jasmine.createSpyObj('mockMessageBroker', ['getMessage', 'sendMessage', 'getStorageService']);
  mockMessageBroker.sendMessage.and.returnValue(nullObservable);
  mockMessageBroker.getMessage.and.returnValue(nullObservable);
  mockMessageBroker.getStorageService.and.returnValue(nullObservable);

  // Mocks for internationalisation dependencies
  const mockTranslateService: any = jasmine.createSpyObj('mockTranslateService', ['get', 'onLangChange', 'getBrowserLang', 'setDefaultLang']);
  mockTranslateService.onLangChange.and.returnValue(of({ lang: 'en' }));

  // Mocks for graphicsviewer services
  const mockGraphicsService: any = jasmine.createSpy('mockGraphicsService');
  const mockTimerService: any = jasmine.createSpy('mockTimerService');
  const mockSnapinConfigService: any = jasmine.createSpyObj('mockSnapinConfigService', ['getSnapInHldlConfig']);

  const mockGmsObjectSelectionService: any = jasmine.createSpyObj('mockGmsObjectSelectionService', ['reset']);

  // Mock for GraphicViewComponent: a child component of GraphicsSnapinComponent

  // mock of ObjectSelectionService.selectedObjects
  const mockSelectedObjects: BehaviorSubject<BrowserObject[]> = new BehaviorSubject<BrowserObject[]>([]);

  // mock of ObjectSelectionService.navigate
  const mockNavigate: Subject<BrowserObject> = new Subject<BrowserObject>();

  mockGmsObjectSelectionService.selectedObjects = mockSelectedObjects;
  mockGmsObjectSelectionService.navigate = mockNavigate;

  let fixture: ComponentFixture<GraphicsViewerSnapInComponent>;
  let comp: GraphicsViewerSnapInComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GmsGraphicsViewerSnapInModule],
      declarations: [MockGraphicViewComponent],
      providers: [
        // angular services
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        // hfw-core
        { provide: SnapInBase, useValue: mockSnapInBase },
        { provide: IHfwMessage, useValue: mockMessageBroker },
        { provide: ISnapInConfig, useValue: mockSnapinConfigService },

        // hfw-services
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: TraceService, useValue: mockTraceService },

        // gms-services
        { provide: GraphicsService, useValue: mockGraphicsService },

        // graphicsviewer specific

        { provide: TimerService, useValue: mockTimerService },
        { provide: SystemBrowserServiceBase, useValue: mockSystemBrowserService },
        { provide: TranslateService, useClass: TranslateServiceStub },
        { provide: TablesServiceBase, useValue: mockTablesService },
        CnsHelperService,
        ExecuteCommandServiceBase
      ]
    });

    TestBed.compileComponents();
  }));

  describe('initialization', () => {
    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(GraphicsViewerSnapInComponent);
      comp = fixture.componentInstance;
      fixture.detectChanges();
    }));

    xit('should build without a problem', () => {
      expect(comp instanceof GraphicsViewerSnapInComponent).toBe(true);
    });
  });

  xdescribe('secondary selections', () => {
    const objAttrs: ObjectAttributes = {
      Alias: '',
      DefaultProperty: '',
      DisciplineDescriptor: '',
      DisciplineId: 1,
      FunctionName: '',
      ManagedType: 1,
      ManagedTypeName: '',
      ObjectId: '',
      SubDisciplineDescriptor: '',
      SubDisciplineId: 1,
      SubTypeDescriptor: '',
      SubTypeId: 1,
      TypeDescriptor: '',
      TypeId: 1,
      ObjectModelName: ''
    };

    // Valid BrowserObjects representing normal response from SystemBrowser.searchNodes()
    const bo: BrowserObject = {
      Attributes: objAttrs,
      Descriptor: 'descriptor',
      Designation: 'goodSystem.goodView:goodRoot',
      HasChild: false,
      Name: 'name',
      Location: 'location',
      ObjectId: 'objectid',
      SystemId: 1,
      ViewId: 1,
      ViewType: 0
    };

    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(GraphicsViewerSnapInComponent);
      comp = fixture.componentInstance;
      fixture.detectChanges();
    }));

    it('should call SnapInBase.sendMessage() with correct BrowserObject', () => {
      // reset calls to mockMessageBroker
      mockMessageBroker.sendMessage.calls.reset();

      // the expected GmsMessageData to send to MessageBroker
      const gmsMessageDataArgument: GmsMessageData = new GmsMessageData([bo], GmsSelectionType.Object);
      mockSelectedObjects.next([bo]);
      expect(mockMessageBroker.sendMessage.calls.mostRecent().args).toContain(gmsMessageDataArgument);
    });
  });

});

@Component({
    selector: 'gms-test-cmp',
    template: '<gms-graphics-viewer-snapin />',
    standalone: false
})

class TestComponent {
}
