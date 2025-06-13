import { JsonPipe } from '@angular/common';
import { HttpClient, HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { FullSnapInId, IHfwMessage, ISnapInConfig, VerticalBarItem } from '@gms-flex/core';
import {
  CnsHelperService, ConnectionState, EventService, FilesServiceBase, GmsMessageData,
  GmsSelectionType, HubProxyEvent, SignalRService, SiIconMapperService,
  SystemBrowserService,
  TablesServiceBase, TextEntry, WsiEndpointService, WsiUtilityService
} from '@gms-flex/services';
import {
  AppContextService, AppSettings, AppSettingsService, AuthenticationServiceBase, ErrorNotificationServiceBase,
  SettingsServiceBase,
  TraceService
} from '@gms-flex/services-common';
import { BrowserObject } from '@gms-flex/services/wsi-proxy-api/system-browser';
import { GridData, HeaderData } from '@gms-flex/snapin-common';
import { TranslateService } from '@ngx-translate/core';
import { BlinkService } from '@simpl/element-ng';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';

import { NodeMapItem, WsiNodeMapDataChangedEvent, WsiNodeMapItem, WsiOm } from '../services/data.model';
import { NodeMapSnapInService } from '../services/nodemap-snapin.service';
import { NodeMapService, Services } from '../services/nodemap.service';
import { MockSignalRService } from './mock-signalr.service';
import { NodeMapSnapInComponent } from './nodemap-snapin.component';

// custom classes
class wsiNodeMapItem implements WsiNodeMapItem {
  public SystemId: number;
  public Id: string;
  public IsDeviceGroup: boolean;
  public Designations: string[];
  public Name: string;
  public Location: string;
  public DisplayName: string;
  public Alias: string;
  public IsOffline: boolean;
  public IsSystemOffline: boolean;
  public DisconnectedChildren: number;
  public Owner: string;
  public MostImportantAlarmCategoryId: number;
  public IsMostImportantAlarmUnprocessed: boolean;
  public MostImportantAlarmCategoryBackgroundColor: string;
  public MostImportantAlarmCategoryTextColor: string;
  public MostImportantAlarmCustomerText: string;
  public SymbolPngFileRelativePath: string;
  public CountChildren: number;
  public Type: number;
  public SubType: number;
  public Discipline: number;
  public SubDiscipline: number;
  public NetworkType: number;
  public ParentGroupName: string;
  public ParentGroupDisplayName: string;
  public Label: string;     // US2053491

  constructor(Id: string, DisplayName: string, IsDeviceGroup: boolean, ParentGroupName: string, ParentGroupDisplayName: string) {
    this.SystemId = 0;
    this.Id = Id;
    this.IsDeviceGroup = IsDeviceGroup;
    this.Designations = ['boh', 'mah'];
    this.Name = 'pippo';
    this.Location = 'casa di pippo';
    this.DisplayName = DisplayName;
    this.Alias = 'pippo';
    this.IsOffline = false;
    this.IsSystemOffline = false;
    this.DisconnectedChildren = 0;
    this.Owner = 'pluto';
    this.MostImportantAlarmCategoryId = 1;
    this.IsMostImportantAlarmUnprocessed = false;
    this.MostImportantAlarmCategoryBackgroundColor = 'pippo';
    this.MostImportantAlarmCategoryTextColor = 'pippo';
    this.SymbolPngFileRelativePath = 'pippo';
    this.CountChildren = 0;
    this.Type = 0;
    this.SubType = 0;
    this.Discipline = 0;
    this.SubDiscipline = 0;
    this.NetworkType = 0;
    this.ParentGroupName = ParentGroupName;
    this.ParentGroupDisplayName = ParentGroupDisplayName;
    this.Label = DisplayName;     // US2053491
  }
}

class wsiOm implements WsiOm {
  public OModel: string;
  public Path: string;
}

class wsiNodeMapDataChangedEvent implements WsiNodeMapDataChangedEvent {
  public Items: WsiNodeMapItem[];
  public TotalNumberOfItems: number;
  public Oms: WsiOm[];

  constructor() {
    this.Items = new Array<WsiNodeMapItem>(0);
    this.TotalNumberOfItems = 0;
    this.Oms = new Array<WsiOm>(0);
  }
}

describe('NodeMapPreselectService', () => {
  let name = '';

  beforeEach(() => {
    name = 'NodeMapPreselectService';
  });

  describe('set name', () => {
    it('name should be set', () => {
      expect(name).toBe('NodeMapPreselectService');
    });
  });
});

describe('Testing methods for life cycle hook', () => {
  const _undefined = void 0;
  const _viewNode: any = [];
  const _nodes: any = { Nodes: [{ Attributes: {} }] };
  const nullObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  const viewNodeObservable: BehaviorSubject<any> = new BehaviorSubject(_viewNode);
  const tableObservable: Subject<TextEntry[]> = new Subject();
  const nodesObservable: BehaviorSubject<any> = new BehaviorSubject(_nodes);

  const mockTraceService: any = jasmine.createSpyObj('mockTraceService', ['info', 'error', 'warn', 'debug', 'isDebugEnabled', 'isInfoEnabled']);
  const mockAppContextService: any = jasmine.createSpyObj('mockAppContextService', ['getBrowserLang']);
  const mockTablesServiceBase: any = jasmine.createSpyObj('mockTablesServiceBase', ['getGlobalText']);

  mockTablesServiceBase.getGlobalText.and.returnValue(tableObservable);

  const mockSiIconMapperService: any = jasmine.createSpyObj('mockSiIconMapperService', ['getGlobalIconSync']);
  mockSiIconMapperService.getGlobalIconSync.and.returnValue(nullObservable);

  const mockSystemBrowserService: any = jasmine.createSpyObj('mockSystemBrowserService', ['getViews', 'searchNodes']);
  mockSystemBrowserService.getViews.and.returnValue(viewNodeObservable);
  mockSystemBrowserService.searchNodes.and.returnValue(nodesObservable);

  const mockSettingsServiceBase: any = jasmine.createSpyObj('mockSettingsServiceBase', ['getSettings', 'putSettings']);
  mockSettingsServiceBase.getSettings.and.returnValue(
    of(`{"EventFilterId":null,"DeviceGroupViewId":"ciccio","DeviceGroupDisplayName":null,"DeviceGroupItemsCount":null,"ShowAllDevices":true,
    "SearchFilterCriteria":{"criteria":[{"name":"events","label":"Events","value":"1","options":[]}],"value":""},"TileScrollState":{"skip":12,"take":100}}`));
  mockSettingsServiceBase.putSettings.and.returnValue(of({ 'value': true }));

  const mockEventService: any = jasmine.createSpyObj('mockEventService', ['createEventSubscription', 'destroyEventSubscription']);
  mockEventService.createEventSubscription.and.returnValue({});

  mockAppContextService.defaultCulture = nullObservable;
  mockAppContextService.userCulture = nullObservable;
  mockAppContextService.getBrowserLang.and.returnValue(nullObservable);

  const mockWsiEndpointService: WsiEndpointService = jasmine.createSpyObj('wsiEndpoint', [], { entryPoint: ' ', _wsiSettingFilePath: '' });
  const mockAuthenticationServiceBase: AuthenticationServiceBase = jasmine.createSpyObj('authenticationServiceBase', [], { userToken: ' ' });
  const mockWsiUtilityService: WsiUtilityService = jasmine.createSpyObj('wsiUtilityService', ['httpPostDefaultHeader', 'httpGetDefaultHeader', 'handleError']);
  const mockFilesServiceBase: any = jasmine.createSpyObj('mockFilesServiceBase', ['getFile']);
  const blobObservable: Subject<Blob[]> = new Subject();

  mockFilesServiceBase.getFile.and.returnValue(blobObservable);
  // //////////////////HIC

  const ngZone: NgZone = jasmine.createSpyObj('ngZone', ['runOutsideAngular'], {});

  let errorService: ErrorNotificationServiceBase;

  let eventService: EventService;
  let signalRService: SignalRService;
  let realHttpClient: HttpClient;
  let realTraceService: TraceService;
  let mockActivatedRoute: any;
  let mockFilesService: any;
  let mockModalService: any;
  let mockJson: any;
  let hdrData: any;
  let hdrDataGet: any;

  // custom objects;
  const nodeMapItem: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('itemId', 'Item Display Name', false, '', ''));

  // NodeMapService
  const mockNodeMapService = jasmine.createSpyObj('NodeMapService', ['connectionState', 'subscribe', 'items',
    'totalNumberOfItems', 'oms', 'RequestOwnership', 'XnetDisconnect', 'XnetConnect', 'eventSelect', 'modifyDeviceGroupItems',
    'GetDeviceGroupItems']);
  mockNodeMapService.connectionState.and.returnValue(new Observable<ConnectionState>());
  mockNodeMapService.items.and.returnValue(new Observable<WsiNodeMapItem[]>());
  mockNodeMapService.totalNumberOfItems.and.returnValue(new Observable<number>());
  mockNodeMapService.oms.and.returnValue(new Observable<WsiOm[]>());
  mockNodeMapService.GetDeviceGroupItems.and.returnValue(new Observable<WsiNodeMapItem[]>());

  // TranslateService
  const mockTranslateService = jasmine.createSpyObj('TranslateService', ['get', 'onLangChange', 'getBrowserLang', 'setDefaultLang']);
  mockTranslateService.onLangChange.and.returnValue(of({ lang: 'en' }));
  mockTranslateService.setDefaultLang('en');
  mockTranslateService.get.and.returnValue(of('Save'));

  // SnapInService
  const mockSnapinService = jasmine.createSpyObj('', ['registerViewModel']);

  // StorageService
  const storageService = jasmine.createSpyObj('storageService', ['getState', 'setState']);

  // MessageBrocker
  const mockMessageBroker = jasmine.createSpyObj('messageBroker', ['changeView', 'switchToNextFrame', 'getMessage', 'sendMessage',
    'getPreselectionService', 'getStorageService']);
  mockMessageBroker.getMessage.and.returnValue(nullObservable);
  mockMessageBroker.sendMessage.and.returnValue(nullObservable);
  mockMessageBroker.getPreselectionService.and.returnValue(nullObservable);
  mockMessageBroker.getStorageService.and.returnValue(storageService);
  mockMessageBroker.changeView.and.returnValue(nullObservable);
  mockMessageBroker.switchToNextFrame.and.returnValue(nullObservable);

  // mockSnapinConfig
  const mockSnapinConfig = jasmine.createSpyObj('SnapinConfig', ['getSnapInHldlConfig', 'getLayouts', 'getVerticalBarConfig']);
  mockSnapinConfig.getLayouts.and.returnValue([]);
  mockSnapinConfig.getSnapInHldlConfig.and.returnValue();
  mockSnapinConfig.getVerticalBarConfig.and.returnValue([]);

  // BlinkService (found 2 ways to mock it!)
  // --------------------------------------------------------------------
  // AAA - Way 1: using properties and objects ( directly initialization)
  // --------------------------------------------------------------------
  const mockBlinkService = jasmine.createSpyObj('BlinkService', {}, { pulse$: new Observable<boolean>() });
  /*
  // --------------------------------------------------------------------
  // AAA - Way 2: seting values to mocked property
  // --------------------------------------------------------------------
  mockBlinkService = jasmine.createSpyObj('BlinkService', {} , { pulse$ : new Observable<Boolean>()});
  mockBlinkService.pulse$.and.returnValue(new Observable<boolean>());
  Object.getOwnPropertyDescriptor(mockBlinkService, "pulse$").value?.and.returnValue(new Observable<Boolean>());
  */

  // CnsHelperService
  const mockCnsHelperService = jasmine.createSpyObj('CnsHelperService', ['getCnsLabelsOrdered', 'activeCnsLabel']);
  mockCnsHelperService.getCnsLabelsOrdered.and.returnValue(['label1', 'label2']);
  mockCnsHelperService.activeCnsLabel = of('');

  const tb_Base = {
    // provide the component-under-test and dependent service
    declarations: [NodeMapSnapInComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(), 
      {
        provide: TraceService,
        useValue: mockTraceService // used useValue, instead useClass, because we want use that instance
      },
      {
        provide: TablesServiceBase,
        useValue: mockTablesServiceBase
      },
      {
        provide: IHfwMessage,
        useValue: mockMessageBroker
      },
      {
        provide: ActivatedRoute,
        useValue: mockActivatedRoute
      },
      {
        provide: ISnapInConfig,
        useValue: mockSnapinConfig
      },
      {
        provide: TranslateService,
        useValue: mockTranslateService
      },
      {
        provide: CnsHelperService,
        useValue: mockCnsHelperService
      },
      {
        provide: FilesServiceBase,
        useValue: mockFilesService
      },
      {
        provide: NodeMapSnapInService,
        useValue: mockSnapinService
      },
      {
        provide: AppContextService,
        useValue: mockAppContextService
      },
      {
        provide: NodeMapService,
        useValue: mockNodeMapService
      },
      {
        provide: BsModalService,
        useValue: mockModalService
      },
      {
        provide: BlinkService,
        useValue: mockBlinkService
      },
      {
        provide: JsonPipe,
        useValue: mockJson
      },
      {
        provide: SiIconMapperService,
        useValue: mockSiIconMapperService
      },
      {
        provide: SystemBrowserService,
        useValue: mockSystemBrowserService
      },
      {
        provide: SettingsServiceBase,
        useValue: mockSettingsServiceBase
      },
      {
        provide: EventService,
        useValue: mockEventService
      }
    ]
  };

  describe('Testing methods having mock HTTP', () => {

    let nodeMapSnapInComponent: NodeMapSnapInComponent;
    let fixture: ComponentFixture<NodeMapSnapInComponent>;
    const connectionState = new Observable<SignalR.ConnectionState>();
    const disconnected = new Observable<boolean>();
    const hubConnection = jasmine.createSpyObj('hubConnection', {},
      { connectionState, disconnected });

    const hps = jasmine.createSpyObj('hps', ['get', 'registerEventHandler'], { hubConnection });

    const mockSignalRService = jasmine.createSpyObj('signalRService', ['getNorisHub', 'registerProxy']);
    mockSignalRService.getNorisHub.and.returnValue(hps);
    const httpPost01 = new Observable<WsiNodeMapItem[]>();

    beforeEach(() => {

      // #region Services Mocks

      // AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
      // Currently we're using some "const" --> these have, as their cope, just this test (only). If you need it alsewhere pick out them!!!
      // AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

      // #endregion

      // You must declarate the component like an NgModule

      TestBed.configureTestingModule(tb_Base);

      // create component and test fixture (fixture is the wrapper from TS class & his template)
      fixture = TestBed.createComponent(NodeMapSnapInComponent);

      // get test component from the fixture
      nodeMapSnapInComponent = fixture.componentInstance;

      // Assign the fullId of the SNI (usually it arrived from Hldl)
      nodeMapSnapInComponent.fullId = new FullSnapInId('', '');

      nodeMapSnapInComponent.ngOnInit();
    });

    afterEach(() => {
      nodeMapSnapInComponent.ngOnDestroy();
      const httpTestingController = TestBed.get(HttpTestingController);
      httpTestingController.verify();
    });

    it('should be OK: nodemapSnapInComponent', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
    });

    it('should be OK: headerData property', () => {
      hdrData = new HeaderData('id', 'Label', 20, null, true, false, 0, 20, 0, true);
      nodeMapSnapInComponent.headerData.push(hdrData);
      hdrDataGet = nodeMapSnapInComponent.headerData.pop();
      expect(hdrDataGet).toBeDefined();
      expect(hdrDataGet.id).toMatch('id');
      expect(hdrDataGet.label).toMatch('Label');
      expect(hdrDataGet.widthPercentage).toEqual(20);
      expect(hdrDataGet.isFixedSize).toBeFalse();
      expect(hdrDataGet.columnVisible).toBeTrue();
      expect(hdrDataGet.minColWidth).toEqual(0);
      expect(hdrDataGet.width).toEqual(20);
      expect(hdrDataGet.sortingDirection).toEqual(0);
      expect(hdrDataGet.allowSorting).toBeTrue();
    });

    it('should be KO: headerData property', () => {
      hdrData = new HeaderData('id', 'Label', 20, null, true, false, 20, 30, 1, true);
      nodeMapSnapInComponent.headerData.push(hdrData);
      hdrData.widthPercentage = 30;
      nodeMapSnapInComponent.headerData.push(hdrData);
      hdrDataGet = nodeMapSnapInComponent.headerData.pop();
      expect(hdrDataGet.widthPercentage).not.toEqual(20);
    });

    it('should be OK: ngOnInit()', () => {
      // expect clauses
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.ngOnInit).toBeDefined();
      nodeMapSnapInComponent.ngOnInit();

      // Following row, is commented, because toHaveBeenCalledTimes is not used over an already mocked function ( here nodeMapSnapInComponent.ngOnInit is real)
      // expect(nodeMapSnapInComponent.ngOnInit).toHaveBeenCalledTimes(1);
    });

    it('should be OK: ngOnDestroy()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.ngOnDestroy).toBeDefined();
      nodeMapSnapInComponent.ngOnDestroy();
    });

    it('should be OK: save()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.save).toBeDefined();
      nodeMapSnapInComponent.save();
    });

    it('should be OK: openModal()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.openModal).toBeDefined();
      expect(nodeMapSnapInComponent.openModal(null)).toBeFalse();
    });

    it('should be OK: onAfterDettach()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.onAfterDettach).toBeDefined();
    });

    it('should be OK: onBeforeAttach()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.onBeforeAttach).toBeDefined();
    });

    it('should be OK: refresh()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.refresh).toBeDefined();
    });

    it('should be OK: executeCommandRI()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandRemoveItem).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandRemoveItem(null)).toBeFalse();
      nodeMapSnapInComponent.allDeviceGroupsAll = [];
      expect(nodeMapSnapInComponent.executeCommandRemoveItem(nodeMapItem)).toBeTrue();

    });

    it('should be OK: executeCommandCO()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandConnect).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandConnect(null)).toBeFalse();
      expect(nodeMapSnapInComponent.executeCommandConnect(nodeMapItem)).toBeTrue();
    });

    it('should be OK: executeCommandDI()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandDisconnect).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandDisconnect(null)).toBeFalse();
      expect(nodeMapSnapInComponent.executeCommandDisconnect(nodeMapItem)).toBeTrue();
    });

    it('should be OK: executeCommandRO()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandRequestOwnership).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandRequestOwnership(null)).toBeFalse();
      expect(nodeMapSnapInComponent.executeCommandRequestOwnership(nodeMapItem)).toBeTrue();
    });

    it('should be OK: executeCommandDG()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandDeleteGroup).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandDeleteGroup(null)).toBeFalse();
      expect(nodeMapSnapInComponent.executeCommandDeleteGroup(nodeMapItem)).toBeTrue();
    });

    it('should be OK: executeCommandEG()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandEditGroup).toBeDefined();
      expect(nodeMapSnapInComponent.executeCommandEditGroup(null)).toBeFalse();
      expect(nodeMapSnapInComponent.executeCommandEditGroup(nodeMapItem)).toBeTrue();
    });

    it('should be OK: changeSelectedValue()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.changeSelectedValue).toBeDefined();
      expect(nodeMapSnapInComponent.changeSelectedValue(null)).toBeFalse();
      expect(nodeMapSnapInComponent.addchangeSelectedValue(nodeMapItem)).toBeTrue();
    });

    it('should be OK: addchangeSelectedValue()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.addchangeSelectedValue).toBeDefined();
      expect(nodeMapSnapInComponent.addchangeSelectedValue(null)).toBeFalse();
      expect(nodeMapSnapInComponent.addchangeSelectedValue(nodeMapItem)).toBeTrue();
    });

    // US2053493
    it('should be OK: onExistingGroupRadioChanged()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.onExistingGroupRadioChanged).toBeDefined();
      expect(nodeMapSnapInComponent.onExistingGroupRadioChanged(null)).toBeUndefined();
    });

    it('should be OK: onNewGroupRadioChanged()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.onNewGroupRadioChanged).toBeDefined();
      expect(nodeMapSnapInComponent.onNewGroupRadioChanged(null)).toBeUndefined();
    });

    it('should be OK: canMoveNext()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.canMoveNext).toBeDefined();
      expect(nodeMapSnapInComponent.canMoveNext()).toBeFalse();
    });

    it('should be OK: moveNext()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.moveNext).toBeDefined();
      expect(nodeMapSnapInComponent.moveNext()).toBeUndefined();
    });

    it('should be OK: onBack()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.onBack).toBeDefined();
      expect(nodeMapSnapInComponent.onBack(null)).toBeUndefined();
    });

    it('should be OK: changeSelectedValue()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.changeSelectedValue).toBeDefined();
      expect(nodeMapSnapInComponent.changeSelectedValue(null)).toBeFalse();
    });

    it('should be OK: changeSelectedValueAll()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.changeSelectedValueAll).toBeDefined();
      expect(nodeMapSnapInComponent.changeSelectedValueAll()).toBeUndefined();
    });

    it('should be OK: canSave()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.canSave).toBeDefined();
      expect(nodeMapSnapInComponent.canSave()).toBeFalse();
    });

    it('should be OK: ExecuteCommandForGroups', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      /* eslint-disable */
      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForGroups).toBeDefined();

      const command: any = {
        commandName: 'foo',
        data: new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', '')),
        booleanValue: false
      };

      const startRefreshLoop = false;

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForGroups(command, startRefreshLoop)).toBeFalse();
    });

    it('should be OK: ExecuteCommandForGroups command ViewElements when is DeviceGroup', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForGroups).toBeDefined();

      const command: any = {
        commandName: 'ViewElements',
        data: new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', '')),
        booleanValue: false
      };

      const startRefreshLoop = false;

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForGroups(command, startRefreshLoop)).toBeTrue();
    });

    it('should be OK: ExecuteCommandForGroups command ViewElements when is not DeviceGroup', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForGroups).toBeDefined();

      const command: any = {
        commandName: 'ViewElements',
        data: new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01')),
        booleanValue: false
      };

      const startRefreshLoop = false;

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForGroups(command, startRefreshLoop)).toBeTrue();
    });

    it('should be OK: ExecuteCommandForGroups command DeleteGroup', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForGroups).toBeDefined();

      const command: any = {
        commandName: 'DeleteGroup',
        data: new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', '')),
        booleanValue: false
      };

      const startRefreshLoop = false;

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForGroups(command, startRefreshLoop)).toBeTrue();
    });

    it('should be OK: ExecuteCommandForDevices', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices).toBeDefined();

      const command: any = {
        commandName: 'foo',
        data: new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01')),
        booleanValue: false
      };

      const startRefreshLoop = false;

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices(command, startRefreshLoop)).toBeFalse();
    });

    it('should be OK: ExecuteCommandForDevices command AssignDeviceToGroup', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices).toBeDefined();

      const command: any = {
        commandName: 'AssignDeviceToGroup',
        data: new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01')),
        booleanValue: false
      };

      const startRefreshLoop = false;

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices(command, startRefreshLoop)).toBeTrue();
    });

    it('should be OK: ExecuteCommandForDevices command RemoveItem', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices).toBeDefined();

      const command: any = {
        commandName: 'RemoveItem',
        data: new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01')),
        booleanValue: false
      };
      command.data.Name = 'Device01';
      command.data.browserObject = 'Device01';

      const startRefreshLoop = false;

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices(command, startRefreshLoop)).toBeTrue();
    });

    it('should be OK: ExecuteCommandForDevices command Connect', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices).toBeDefined();

      const command: any = {
        commandName: 'Connect',
        data: new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01')),
        booleanValue: false
      };
      command.data.Name = 'Device01';
      command.data.browserObject = 'Device01';

      const startRefreshLoop = false;

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices(command, startRefreshLoop)).toBeTrue();
    });

    it('should be OK: ExecuteCommandForDevices command Disconnect', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices).toBeDefined();

      const command: any = {
        commandName: 'Disconnect',
        data: new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01')),
        booleanValue: false
      };
      command.data.Name = 'Device01';
      command.data.browserObject = 'Device01';

      const startRefreshLoop = false;

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices(command, startRefreshLoop)).toBeTrue();
    });

    it('should be OK: ExecuteCommandForDevices command RequestOwnership', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices).toBeDefined();

      const command: any = {
        commandName: 'RequestOwnership',
        data: new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01')),
        booleanValue: false
      };
      command.data.Name = 'Device01';
      command.data.browserObject = 'Device01';

      const startRefreshLoop = false;

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandForDevices(command, startRefreshLoop)).toBeTrue();
    });

    it('should be OK: save()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.save).toBeDefined();
      expect(nodeMapSnapInComponent.save()).toBeUndefined();
    });

    it('should be OK: onSelectedGroupChanged()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.onSelectedGroupChanged).toBeDefined();
      expect(nodeMapSnapInComponent.onSelectedGroupChanged(null)).toBeUndefined();
    });

    it('should be OK: onCreateNewGroupKeyup()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.onCreateNewGroupKeyup).toBeDefined();
      expect(nodeMapSnapInComponent.onCreateNewGroupKeyup(null)).toBeUndefined();
    });

    it('should be OK: addGroupHandler()', () => {
        expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
        expect(nodeMapSnapInComponent).toBeDefined();
        expect(nodeMapSnapInComponent.utAddGroupHandler).toBeDefined();
        expect(nodeMapSnapInComponent.utAddGroupHandler()).toBeUndefined();
    });

    it('should be OK: onSearchRequestedCreateGroup()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.onSearchRequestedCreateGroup).toBeDefined();
      expect(nodeMapSnapInComponent.onSearchRequestedCreateGroup(null)).toBeUndefined();
    });

    it('should be OK: cancel()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.cancel).toBeDefined();
      expect(nodeMapSnapInComponent.cancel(0)).toBeUndefined();
    });
    // US2053493

    // US2053489
    it('should be OK: assignDeviceToGroup()', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.utAssignDeviceToGroup).toBeDefined();
      expect(nodeMapSnapInComponent.utAssignDeviceToGroup(false)).toBeUndefined();
      expect(nodeMapSnapInComponent.utAssignDeviceToGroup(true)).toBeUndefined();
    });
    // US2053489

    // US2053491
    it('should be OK: removeGroupsHandler', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.removeGroupsHandler).toBeDefined();

      // @ts-ignore
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.removeGroupsHandler();
      }).not.toThrow();
    });

    it('should be OK: manageGroupHandler', () => {
      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01'));

      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.manageGroupHandler).toBeDefined();

      // @ts-ignore
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.manageGroupHandler(item);
      }).not.toThrow();
    });

    it('should be OK: executeCommandRemoveGroups', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.executeCommandRemoveGroups).toBeDefined();

      // @ts-ignore
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.executeCommandRemoveGroups();
      }).not.toThrow();
    });

    it('should be OK: canSaveControls', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.canSaveControls).toBeDefined();

      // @ts-ignore
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.canSaveControls();
      }).toThrow();
    });

    it('should be OK: canRemoveGroups', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.canRemoveGroups).toBeDefined();

      // @ts-ignore
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.canRemoveGroups();
      }).not.toThrow();
    });
    // US2053491

    it('should be OK: onTileClick', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      const event: any = {
        ctrlKey: false
      };

      // @ts-ignore
      expect(nodeMapSnapInComponent.onTileClick).toBeDefined();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01'));
        // @ts-ignore
        nodeMapSnapInComponent.onTileClick(item, event);
      }).not.toThrow();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', true, 'Group01', 'Group 01'));
        // @ts-ignore
        nodeMapSnapInComponent.onTileClick(item, event);
      }).not.toThrow();
    });

    // US2119362
    it('should be OK: onInfoDeviceClick', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      const event: any = {
        ctrlKey: false
      };

      // @ts-ignore
      expect(nodeMapSnapInComponent.onInfoDeviceClick).toBeDefined();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01'));
        // @ts-ignore
        nodeMapSnapInComponent.onInfoDeviceClick(item, event);
      }).not.toThrow();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', true, 'Group01', 'Group 01'));
        // @ts-ignore
        nodeMapSnapInComponent.onInfoDeviceClick(item, event);
      }).not.toThrow();
    });

    // US2169381
    it('should be OK: onInfoDeviceDoubleClick', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      const event: any = { ctrlKey: false };

      // @ts-ignore
      expect(nodeMapSnapInComponent.onInfoDeviceDoubleClick).toBeDefined();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01'));
        // @ts-ignore
        nodeMapSnapInComponent.onInfoDeviceDoubleClick(item, event);
      }).not.toThrow();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', true, 'Group01', 'Group 01'));
        // @ts-ignore
        nodeMapSnapInComponent.onInfoDeviceDoubleClick(item, event);
      }).not.toThrow();
    });

    it('should be OK: onMouseEnter', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      const event: any = {
        ctrlKey: false
      };

      // @ts-ignore
      expect(nodeMapSnapInComponent.onMouseEnter).toBeDefined();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01'));
        // @ts-ignore
        nodeMapSnapInComponent.onMouseEnter(item, event);
      }).not.toThrow();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', true, 'Group01', 'Group 01'));
        // @ts-ignore
        nodeMapSnapInComponent.onMouseEnter(item, event);
      }).not.toThrow();
    });

    it('should be OK: onMouseLeave', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.onMouseLeave).toBeDefined();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01'));
        // @ts-ignore
        nodeMapSnapInComponent.onMouseLeave(item);
      }).not.toThrow();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', true, 'Group01', 'Group 01'));
        // @ts-ignore
        nodeMapSnapInComponent.onMouseLeave(item);
      }).not.toThrow();
    });

    it('should be OK: calculateCommonActionsNoSelected', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      const action: any = {
        title: 'Remove from Group',
        disabled: false
      };

      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', true, 'Group01', 'Group 01'));
      item.actions = [];
      item.actions.push(action);
      const items: NodeMapItem[] = [item];

      // @ts-ignore
      expect(nodeMapSnapInComponent.calculateCommonActionsNoSelected).toBeDefined();

      // @ts-ignore
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.calculateCommonActionsNoSelected(items);
      }).not.toThrow();
    });

    it('should be OK: calculateCommonActionsSelected', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      const action: any = {
        title: 'Remove from Group',
        disabled: false
      };

      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', true, 'Group01', 'Group 01'));
      item.actions = [];
      item.actions.push(action);
      const items: NodeMapItem[] = [item];

      // @ts-ignore
      expect(nodeMapSnapInComponent.calculateCommonActionsSelected).toBeDefined();

      // @ts-ignore
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.calculateCommonActionsSelected(items);
      }).not.toThrow();
    });
    // US2119362

    // 2119361
    it('should be OK: pushNavigateTo', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.pushNavigateTo).toBeDefined();

      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', ''));
      item.isDeviceGroup = false;
      item.actions = [];

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.pushNavigateTo(item);
      }).not.toThrow();
    });

    // US2169384
    it('should be OK: pushShowInProperties', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.pushShowInProperties).toBeDefined();

      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', ''));
      item.isDeviceGroup = false;
      item.actions = [];

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.pushShowInProperties(item);
      }).not.toThrow();
    });

    it('should be OK: searchTreview', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.searchTreview).toBeDefined();

      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', ''));

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.searchTreview(item, mockSnapinConfig);
      }).not.toThrow();
    });

    it('should be OK: changeViewAndSendSelection', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.changeViewAndSendSelection).toBeDefined();

      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', ''));
      const subItem: VerticalBarItem = new VerticalBarItem('VertId', 'VertFrame', []);

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.changeViewAndSendSelection(item, subItem);
      }).not.toThrow();
    });
    // 2119361

    it('should be OK: cloneActions', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.cloneActions).toBeDefined();

      // @ts-ignore
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.cloneActions(undefined);
      }).not.toThrow();
    });

    it('should be OK: setActions', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.setActions).toBeDefined();

      // @ts-ignore
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.setActions();
      }).not.toThrow();
    });

    it('should be OK: executeCommandSG3', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.executeCommandSG3).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.selectedTileItems).toBeDefined();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', true, 'Group01', 'Group 01'));
        nodeMapSnapInComponent.selectedTileItems = [item, item, item];

        // @ts-ignore
        nodeMapSnapInComponent.executeCommandSG3(item);
      }).not.toThrow();
    });

    it('should be OK: executeCommandManageGroup', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.executeCommandManageGroup).toBeDefined();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', true, 'Group01', 'Group 01'));
        // @ts-ignore
        nodeMapSnapInComponent.executeCommandManageGroup(item);
      }).not.toThrow();
    });

    it('should be OK: changeSelectedValue', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.changeSelectedValue).toBeDefined();

      // @ts-ignore
      expect(() => {
        const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', true, 'Group01', 'Group 01'));

        // @ts-ignore
        nodeMapSnapInComponent.changeSelectedValue(item);

        nodeMapSnapInComponent.step = 1;
        // @ts-ignore
        nodeMapSnapInComponent.changeSelectedValue(item);

        nodeMapSnapInComponent.step = 2;
        // @ts-ignore
        nodeMapSnapInComponent.changeSelectedValue(item);

        nodeMapSnapInComponent.step = 3;
        // @ts-ignore
        nodeMapSnapInComponent.changeSelectedValue(item);

        nodeMapSnapInComponent.step = 4;
        // @ts-ignore
        nodeMapSnapInComponent.changeSelectedValue(item);

        nodeMapSnapInComponent.step = 5;
        // @ts-ignore
        nodeMapSnapInComponent.changeSelectedValue(item);

        nodeMapSnapInComponent.step = 6;
        // @ts-ignore
        nodeMapSnapInComponent.changeSelectedValue(item);
      }).toThrow();
    });

    it('should be OK: onAfterDettach', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      expect(nodeMapSnapInComponent.onAfterDettach).toBeDefined();

      expect(() => {
        nodeMapSnapInComponent.onAfterDettach();
      }).not.toThrow();
    });

    it('should be OK: onBeforeAttach', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      expect(nodeMapSnapInComponent.onBeforeAttach).toBeDefined();

      expect(() => {
        nodeMapSnapInComponent.onBeforeAttach();
      }).toThrow();
    });

    it('should be OK: refresh', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      expect(nodeMapSnapInComponent.refresh).toBeDefined();

      expect(() => {
        nodeMapSnapInComponent.refresh();
      }).toThrow();
    });

    it('should be OK: onDeleteDeviceGroupButtonClicked', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      expect(nodeMapSnapInComponent.onDeleteDeviceGroupButtonClicked).toBeDefined();

      expect(() => {
        nodeMapSnapInComponent.onDeleteDeviceGroupButtonClicked();
      }).not.toThrow();
    });

    it('should be OK: onEditDeviceGroupDisplayNameButtonRenameClicked', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      expect(nodeMapSnapInComponent.onEditDeviceGroupDisplayNameButtonRenameClicked).toBeDefined();

      expect(() => {
        nodeMapSnapInComponent.onEditDeviceGroupDisplayNameButtonRenameClicked();
      }).toThrow();
    });

    it('should be OK: onEditDeviceGroupDisplayNameButtonCancelClicked', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      expect(nodeMapSnapInComponent.onEditDeviceGroupDisplayNameButtonCancelClicked).toBeDefined();

      expect(() => {
        nodeMapSnapInComponent.onEditDeviceGroupDisplayNameButtonCancelClicked();
      }).toThrow();
    });

    it('should be OK: isEventAcked', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.isEventAcked).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.isEventAcked('Unprocessed')).toBeFalse();
    });

    it('should be OK: isEventAcked with unexpected parameter', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.isEventAcked).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.isEventAcked('unexpected')).toBeTrue();
    });

    it('should be OK: getSourceStateIcons', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.getSourceStateIcons).toBeDefined();

      // @ts-ignore
      const iconsQuietUnprocessed: StateIcons = nodeMapSnapInComponent.getSourceStateIcons('Quiet', 'Unprocessed');
      expect(iconsQuietUnprocessed.icon).toBe('element-alarm text-body');

      // @ts-ignore
      const iconsQuietEventNotAcked: StateIcons = nodeMapSnapInComponent.getSourceStateIcons('Quiet', 'eventnotacked');
      expect(iconsQuietEventNotAcked.icon).toBe('element-alarm-background text-body');

      // @ts-ignore
      const iconsNotQuietUnprocessed: StateIcons = nodeMapSnapInComponent.getSourceStateIcons('Not Quiet', 'Unprocessed');
      expect(iconsNotQuietUnprocessed.icon).toBe('element-alarm-filled event-info-source-icon-active-color');

      // @ts-ignore
      const iconsNotQuietEventNotAcked: StateIcons = nodeMapSnapInComponent.getSourceStateIcons('Not Quiet', 'eventnotacked');
      expect(iconsNotQuietEventNotAcked.icon).toBe('element-alarm-background-filled event-info-source-icon-active-color');
    });

    it('should be OK: onEventsChange', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.onEventsChange).toBeDefined();

      const event: GridData = {
        cellData: new Map<string, any>(),
        customData: null,
        isDisabled: false
      };

      event.cellData.set('srcState', 'Quiet');
      event.cellData.set('state', 'Unprocessed');
      const events: GridData[] = [];
      events.push(event);

      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Device01', 'Device 01', false, '', ''));

      expect(() => {
        nodeMapSnapInComponent.onEventsChange(events, item);
      }).not.toThrow();

      item.mostImportantAlarmCategoryBackgroundColor = 'black';
      item.browserObject.Attributes.SubDisciplineId = 1;
      item.isDeviceGroup = false;
      events[0].cellData.set('cause', 'mostImportantEventText(Hello)');
      events[0].customData = {
        eventItem: {
          category: {
              colors: new Map<number, any>(),
              id: 0
          },
          designationList: [{
            ViewId: 9,
            Descriptor: 'mytest'
          }]
        }
      };
      events[0].customData.eventItem.category.colors.set(events[0].customData.eventItem.category.id + 1, 'black');

      expect(() => {
        nodeMapSnapInComponent.onEventsChange(events, item);
      }).not.toThrow();
    });

    it('should be OK: pushGroupCRUDActions', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.pushGroupCRUDActions).toBeDefined();

      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', ''));
      nodeMapSnapInComponent.templateStrings.deleteGroup_ = 'Group01';
      nodeMapSnapInComponent.templateStrings.rename_ = 'Group01';
      // nodeMapSnapInComponent.templateStrings.addElements_ = 'Group01';
      nodeMapSnapInComponent.templateStrings.viewElements_ = 'Group01';

      // @ts-ignore
      nodeMapSnapInComponent.editApplicationRight = false;

      item.actions = [];
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.pushGroupCRUDActions(item);
      }).not.toThrow();
      expect(item.actions.length === 4).toBeTrue();

      // @ts-ignore
      nodeMapSnapInComponent.editApplicationRight = true;

      item.actions = [];
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.pushGroupCRUDActions(item);
        }).not.toThrow();
        expect(item.actions.length === 4).toBeTrue();

    });

    it('should be OK: processRequest', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.processRequest).toBeDefined();

      const objects: BrowserObject[] = [];

      const object: BrowserObject =
      {
        Attributes:
        {
            Alias: null,                      // string
            DefaultProperty: null,            // string
            DisciplineDescriptor: null,       // string
            DisciplineId: null,               // number
            FunctionDefaultProperty: null,    // string
            FunctionName: null,               // string
            ManagedType: null,                // number
            ManagedTypeName: null,            // string
            ObjectId: null,                   // string;
            SubDisciplineDescriptor: null,    // string
            SubDisciplineId: null,            // number
            SubTypeDescriptor: null,          // string
            SubTypeId: null,                  // number
            TypeDescriptor: null,             // string
            TypeId: null,                     // number
            ObjectModelName: null,            // string
            CustomData: null                  // any
        },
        Descriptor: null,                     // string
        Designation: null,                    // string
        HasChild: null,                       // boolean
        Name: null,                           // string
        Location: null,                       // string
        ObjectId: null,                       // string
        SystemId: null,                       // number
        ViewId: null,                         // number
        ViewType: null                       // number
      };

      objects.push(object);
      objects[0].Name = 'Name';
      objects[0].Descriptor = 'Descriptor';
      objects[0].Attributes.ObjectModelName = 'ObjectModelName';
      objects[0].SystemId = 1;
      objects[0].Location = 'Location';
      objects[0].Designation = 'Designation';

      const message: GmsMessageData = new GmsMessageData(objects, GmsSelectionType.None);

      expect(() => {
      // @ts-ignore
      nodeMapSnapInComponent.processRequest(null, GmsSelectionType.None);
      }).not.toThrow();

      expect(() => {
      // @ts-ignore
      nodeMapSnapInComponent.processRequest(message, GmsSelectionType.None);
      }).not.toThrow();
      // @ts-ignore
      expect(nodeMapSnapInComponent.updateHTML).toBeTrue();
      // @ts-ignore
      expect(nodeMapSnapInComponent.selectedObjectName).toBe(objects[0].Name);
      // @ts-ignore
      expect(nodeMapSnapInComponent.selectedObjectDescription).toBe(objects[0].Descriptor);
      // @ts-ignore
      expect(nodeMapSnapInComponent.selectedObjectOM).toBe(objects[0].Attributes.ObjectModelName);
      // @ts-ignore
      expect(nodeMapSnapInComponent.selectedObjectSystemId).toBe(objects[0].SystemId);
      // @ts-ignore
      expect(nodeMapSnapInComponent.selectedObjectLocation).toBe(objects[0].Location);
      // @ts-ignore
      expect(nodeMapSnapInComponent.selectedObjectDesignation).toBe(objects[0].Designation);
    });

    it('should be OK: lazyCriterionProvider', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();
      expect(nodeMapSnapInComponent.filteredSearch.lazyCriterionProvider).toBeDefined();

      expect(() => {
        nodeMapSnapInComponent.filteredSearch.lazyCriterionProvider(null);
      }).not.toThrow();
    });

    it('should be OK: compareFn', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.compareFn).toBeDefined();

      const item1: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', ''));
      const item2: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Group002', 'Group 002', true, '', ''));

      // @ts-ignore
      expect(nodeMapSnapInComponent.compareFn(item1, item2) === 1).toBeFalse();

      // @ts-ignore
      expect(nodeMapSnapInComponent.compareFn(item2, item1) === -1).toBeFalse();
    });

    it('should be OK: showDevicesHandler', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.showDevicesHandler).toBeDefined();

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.showDevicesHandler(true);
      }).not.toThrow();

      expect(nodeMapSnapInComponent.ShowAllDevices).toBeTrue();

      // @ts-ignore
      expect(nodeMapSnapInComponent.Commands[nodeMapSnapInComponent.Commands.length - 1].commandName).toBe('SD');
    });

    it('should be OK: createActionItems', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.createActionItems).toBeDefined();

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.createActionItems();
      }).not.toThrow();

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.editApplicationRight = true;
        // @ts-ignore
        nodeMapSnapInComponent.createActionItems();
      }).not.toThrow();
    });

    it('should be OK: onSelectedObjectChanged', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.onSelectedObjectChanged).toBeDefined();

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.onSelectedObjectChanged();
      }).not.toThrow();
    });

    it('should be OK: ngOnChanges', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.ngOnChanges).toBeDefined();

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.ngOnChanges(null);
      }).not.toThrow();
    });

    it('should be OK: onConnectionStateChanged', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.onConnectionStateChanged).toBeDefined();

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.onConnectionStateChanged(ConnectionState.Disconnected);
      }).not.toThrow();

      // @ts-ignore
      expect(nodeMapSnapInComponent.gotDisconnected).toBeTrue();

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.onConnectionStateChanged(ConnectionState.Connected);
      }).not.toThrow();

      // @ts-ignore
      expect(nodeMapSnapInComponent.gotDisconnected).toBeFalse();
    });

    it('should be OK: executeRemoveItemCommand', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.executeRemoveItemCommand).toBeDefined();

      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', ''));

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.executeRemoveItemCommand(item);
      }).not.toThrow();

      // @ts-ignore
      expect(nodeMapSnapInComponent.updateHTML).toBeTrue();

      // @ts-ignore
      expect(nodeMapSnapInComponent.Commands[nodeMapSnapInComponent.Commands.length - 1].commandName).toBe('RemoveItem');
    });

    it('should be OK: executeDeleteGroupCommand', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.executeDeleteGroupCommand).toBeDefined();

      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', ''));

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.executeDeleteGroupCommand(item);
      }).not.toThrow();

      // @ts-ignore
      expect(nodeMapSnapInComponent.updateHTML).toBeTrue();

      // @ts-ignore
      expect(nodeMapSnapInComponent.Commands[nodeMapSnapInComponent.Commands.length - 1].commandName).toBe('DeleteGroup');
    });

    it('should be OK: executeViewElementsCommand', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.executeViewElementsCommand).toBeDefined();

      const item: NodeMapItem = new NodeMapItem(new wsiNodeMapItem('Group01', 'Group 01', true, '', ''));

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.executeViewElementsCommand(item);
      }).not.toThrow();

      // @ts-ignore
      expect(nodeMapSnapInComponent.updateHTML).toBeTrue();

      // @ts-ignore
      expect(nodeMapSnapInComponent.Commands[nodeMapSnapInComponent.Commands.length - 1].commandName).toBe('ViewElements');
    });

    it('should be OK: ExecuteCommandDataNull', () => {
      expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
      expect(nodeMapSnapInComponent).toBeDefined();

      // @ts-ignore
      expect(nodeMapSnapInComponent.ExecuteCommandDataNull).toBeDefined();

      const command: any = {
        commandName: 'SG',
        data: null,
        booleanValue: false
      };

      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.ExecuteCommandDataNull(command, true);
      }).not.toThrow();

      command.commandName = 'SG2';
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.ExecuteCommandDataNull(command, true);
      }).not.toThrow();

      command.commandName = 'SAM';
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.ExecuteCommandDataNull(command, true);
      }).not.toThrow();

      command.commandName = 'SAY';
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.ExecuteCommandDataNull(command, true);
      }).not.toThrow();

      command.commandName = 'SD';
      expect(() => {
        // @ts-ignore
        nodeMapSnapInComponent.ExecuteCommandDataNull(command, true);
      }).not.toThrow();

    });
  });
  describe('Testing methods having real HTTP POST', () => {

    let nodeMapSnapInComponent: NodeMapSnapInComponent;
    let fixture: ComponentFixture<NodeMapSnapInComponent>;

    // Group01
    const instanceWsiNodeMapItem_Group1 = new wsiNodeMapItem('Group01', 'Group 01', true, '', '');

    // Group01 renamed
    const instanceWsiNodeMapItem_Group1_Renamed = new wsiNodeMapItem('Group01', 'Group 01 Renamed', true, '', '');

    // Group02
    const instanceWsiNodeMapItem_Group2 = new wsiNodeMapItem('Group02', 'Group 02', true, '', '');

    // Device01 (state: not belonging to a group)
    const instanceWsiNodeMapItem_Device1 = new wsiNodeMapItem('Device01', 'Device 01', false, '', '');

    // Device01 (state: belonging to Group01)
    const instanceWsiNodeMapItem_Device1ToGroup1 = new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01');

    // Device02 (state: not belonging to a group)
    const instanceWsiNodeMapItem_Device2 = new wsiNodeMapItem('Device02', 'Device 02', false, '', '');

    // Device02 (state: belonging to Group01)
    const instanceWsiNodeMapItem_Device2ToGroup2 = new wsiNodeMapItem('Device02', 'Device 02', false, 'Group02', 'Group 02');

    const mockAppSettingsService: any = jasmine.createSpyObj('mockAppSettingsService', ['getAppSettingsValue', 'getAppSettings']);
    const mockAppSettings: any = jasmine.createSpyObj('mockAppSettings', [], { traceEnabled: true });

    const appSettingsObservable: BehaviorSubject<AppSettings> = new BehaviorSubject(mockAppSettings);

    mockAppSettingsService.getAppSettingsValue.and.returnValue(mockAppSettings);
    mockAppSettingsService.getAppSettings.and.returnValue(appSettingsObservable);

    let httpTestingCtrl: HttpTestingController;
    let wsiEndpointSvc: WsiEndpointService;
    let ctxId = 0;

    let instanceNodeMapService: NodeMapService;
    let httpClient: HttpClient;

    const data_dev1_group1 = new wsiNodeMapDataChangedEvent();
    data_dev1_group1.Items.push(instanceWsiNodeMapItem_Group1);
    data_dev1_group1.Items.push(instanceWsiNodeMapItem_Device1ToGroup1);
    data_dev1_group1.Oms.push(new wsiOm());
    data_dev1_group1.Oms.push(new wsiOm());
    data_dev1_group1.TotalNumberOfItems = 2;

    const data_dev2_group2 = new wsiNodeMapDataChangedEvent();
    data_dev2_group2.Items.push(instanceWsiNodeMapItem_Group2);
    data_dev2_group2.Items.push(instanceWsiNodeMapItem_Device2ToGroup2);
    data_dev2_group2.Oms.push(new wsiOm());
    data_dev2_group2.Oms.push(new wsiOm());
    data_dev2_group2.TotalNumberOfItems = 2;

    const data_device1 = new wsiNodeMapDataChangedEvent();
    data_device1.Items.push(instanceWsiNodeMapItem_Device1);
    data_device1.Oms.push(new wsiOm());
    data_device1.TotalNumberOfItems = 1;

    const data_device1ToGroup1 = new wsiNodeMapDataChangedEvent();
    data_device1ToGroup1.Items.push(instanceWsiNodeMapItem_Device1ToGroup1);
    data_device1ToGroup1.Oms.push(new wsiOm());
    data_device1ToGroup1.TotalNumberOfItems = 1;

    const data_device2 = new wsiNodeMapDataChangedEvent();
    data_device2.Items.push(instanceWsiNodeMapItem_Device2);
    data_device2.Oms.push(new wsiOm());
    data_device2.TotalNumberOfItems = 1;

    const data_device2ToGroup2 = new wsiNodeMapDataChangedEvent();
    data_device2ToGroup2.Items.push(instanceWsiNodeMapItem_Device2ToGroup2);
    data_device2ToGroup2.Oms.push(new wsiOm());
    data_device2ToGroup2.TotalNumberOfItems = 1;

    const data_group1 = new wsiNodeMapDataChangedEvent();
    data_group1.Items.push(instanceWsiNodeMapItem_Group1);
    data_group1.Oms.push(new wsiOm());
    data_group1.TotalNumberOfItems = 1;

    const data_group1_renamed = new wsiNodeMapDataChangedEvent();
    data_group1_renamed.Items.push(instanceWsiNodeMapItem_Group1_Renamed);
    data_group1_renamed.Oms.push(new wsiOm());
    data_group1_renamed.TotalNumberOfItems = 1;

    const data_group2 = new wsiNodeMapDataChangedEvent();
    data_group1.Items.push(instanceWsiNodeMapItem_Group2);
    data_group1.Oms.push(new wsiOm());
    data_group1.TotalNumberOfItems = 1;
    // const mockSignalRService: MockSignalRService = new MockSignalRService();

    beforeEach(() => {
      // console.log('---------------------beforeEach called------------------------');
      TestBed.configureTestingModule({
    imports: [],
    providers: [
        NodeMapService,
        { provide: SignalRService, useClass: MockSignalRService },
        { provide: AppSettingsService, useValue: mockAppSettingsService },
        { provide: WsiEndpointService, useValue: mockWsiEndpointService },
        { provide: AuthenticationServiceBase, useValue: mockAuthenticationServiceBase },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: ErrorNotificationServiceBase, useValue: errorService },
        { provide: TablesServiceBase, useValue: mockTablesServiceBase },
        { provide: EventService, useValue: eventService },
        { provide: IHfwMessage, useValue: mockMessageBroker },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ISnapInConfig, useValue: mockSnapinConfig },
        { provide: FilesServiceBase, useValue: mockFilesService },
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: BsModalService, useValue: mockModalService },
        { provide: SiIconMapperService, useValue: mockSiIconMapperService },
        { provide: SystemBrowserService, useValue: mockSystemBrowserService },
        { provide: CnsHelperService, useValue: mockCnsHelperService },
        { provide: WsiEndpointService, useValue: mockWsiEndpointService },
        { provide: FilesServiceBase, useValue: mockFilesServiceBase },
        { provide: SettingsServiceBase, useValue: mockSettingsServiceBase },
        { provide: EventService, useValue: mockEventService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
      httpClient = TestBed.inject(HttpClient);
      httpTestingCtrl = TestBed.inject(HttpTestingController);
      instanceNodeMapService = TestBed.inject(NodeMapService);
      wsiEndpointSvc = TestBed.inject(WsiEndpointService);

      fixture = TestBed.createComponent(NodeMapSnapInComponent);
      nodeMapSnapInComponent = fixture.componentInstance;

      // Assign the fullId of the SNI (usually it arrived from Hldl)
      nodeMapSnapInComponent.fullId = new FullSnapInId('', '');
      nodeMapSnapInComponent.ngOnInit();

      const nodeMapSubscriptionUrl = '/api/sr/nodemapsubscriptions/';
      const connectionId = 'TestClientConnectionId';
      // console.log('ctxId = ' + ctxId);
      const url = `${wsiEndpointSvc.entryPoint}${nodeMapSubscriptionUrl}${ctxId}/${connectionId}`; // ${hubProxyShared.connectionId}
      ctxId++;
      // code kept RFU... const request = httpTestingCtrl.expectOne({ method: 'POST' });
      // code kept RFU... expect(request.request.method).toEqual('POST');
      // code kept RFU... request.flush([]);

    });

    afterEach(() => {
      // console.log('-------------------------------afterEach called----------------------------------');
      nodeMapSnapInComponent.ngOnDestroy();

      httpTestingCtrl = TestBed.inject(HttpTestingController);
      wsiEndpointSvc = TestBed.inject(WsiEndpointService);
      const nodeMapSubscriptionUrl = '/api/sr/nodemapsubscriptions/';
      const connectionId = 'TestClientConnectionId';
      const url = `${wsiEndpointSvc.entryPoint}${nodeMapSubscriptionUrl}${connectionId}`; // ${hubProxyShared.connectionId}
      // code kept RFU... const req = httpTestingCtrl.expectOne({ method: 'DELETE' });
      // code kept RFU... expect(req.request.method).toEqual('DELETE');
      // code kept RFU... req.flush([]);

      // httpTestingController.verify();
    });

    it('should be OK: executeCommandRemoveItem() from a group', inject([HttpTestingController, SignalRService, WsiEndpointService, HttpClient],
      (httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {

        // get hub proxy to simulate event notifications on SignalR
        const proxy: HubProxyEvent<WsiNodeMapDataChangedEvent> = mockSignalRService.getNorisHub().proxies[0];

        // check number of items before command execution
        // console.log('BEFORE executeCommandRemoveItem');

        const sub1 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
          /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(2);
        }); // the new device + the new group
        // const sub2 = instanceNodeMapService.items().subscribe(items => items.forEach(item => { console.log('itemId = ' + item.Id);}));
        const sub3 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
            if (instanceWsiNodeMapItem_Device2.Id === item.Id) { /* console.log('itemId = ' + item.Id);*/ occurences++; }
          }); expect(occurences).toBe(1);
        });
        const sub4 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
            if (instanceWsiNodeMapItem_Group2.Id === item.Id) { /* console.log('itemId = ' + item.Id);*/ occurences++; }
          }); expect(occurences).toBe(1);
        });

        proxy.notifyEvents(data_dev2_group2);
        sub1.unsubscribe();
        // sub2.unsubscribe();
        sub3.unsubscribe();
        sub4.unsubscribe();

        expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
        expect(nodeMapSnapInComponent).toBeDefined();
        expect(nodeMapSnapInComponent.executeCommandRemoveItem).toBeDefined();

        // remove Device02 from its group (i.e. Group02)
        nodeMapSnapInComponent.allDeviceGroupsAll = [];
        expect(nodeMapSnapInComponent.executeCommandRemoveItem(new NodeMapItem(instanceWsiNodeMapItem_Device2ToGroup2))).toBeTrue();
        // requests = httpTestingController.match({method: 'POST'});
        // console.log({requests});
        // requests.forEach(req => req.flush([]));
        const nodeMapCommandsUrl = '/api/sr/nodemapcommands/';
        const url = `${wsiEndpointService.entryPoint}${nodeMapCommandsUrl}`;
        const req = httpTestingController.expectOne(r => r.method === 'POST' && r.url === url);
        req.flush([]);

        // console.log('AFTER executeCommandRemoveItem');
        // only Device02 remains: the group is now empty and so will be removed
        const sub5 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
           /* console.log('totalNumberOfItems = ' + totalNumberOfItems);*/ expect(totalNumberOfItems).toEqual(1);
        });
        const sub6 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
           /* console.log('itemId = ' + item.Id);*/ if (instanceWsiNodeMapItem_Device2.Id === item.Id) { occurences++; }
          }); expect(occurences).toBe(1);
        });
        const sub7 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
           /* console.log('itemId = ' + item.Id);*/ if (instanceWsiNodeMapItem_Group1.Id === item.Id) { occurences++; }
          }); expect(occurences).toBe(0);
        });

        // after the device removal from the group, only the device remain, since the group is empty
        proxy.notifyEvents(data_device2);
        sub5.unsubscribe();
        sub6.unsubscribe();
        sub7.unsubscribe();
      }));

    it('should be OK: executeCommandDeleteGroup()', inject([HttpTestingController, SignalRService, WsiEndpointService],
      (httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {

        // get hub proxy to simulate event notifications on SignalR
        const proxy: HubProxyEvent<WsiNodeMapDataChangedEvent> = mockSignalRService.getNorisHub().proxies[0];

        // check number of item before command execution
        // console.log('BEFORE executeCommandDeleteGroup');

        const sub1 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
           /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(2);
        });
        const sub2 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
           /* console.log('itemId = ' + item.Id); */ if (instanceWsiNodeMapItem_Group01.Id === item.Id) { occurences++; }
          }); expect(occurences).toBe(1);
        });

        // check number of item before command execution
        // console.log('BEFORE executeCommandDeleteGroup - notifyEvents');
        // Group01
        const instanceWsiNodeMapItem_Group01 = new wsiNodeMapItem('Group01', 'Group 01', true, '', '');
        // Device01 (state: belonging to Group01)
        const instanceWsiNodeMapItem_Device01ToGroup01 = new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01');

        const data_dev01_group01 = new wsiNodeMapDataChangedEvent();
        data_dev01_group01.Items.push(instanceWsiNodeMapItem_Group01);
        data_dev01_group01.Items.push(instanceWsiNodeMapItem_Device01ToGroup01);
        data_dev01_group01.Oms.push(new wsiOm());
        data_dev01_group01.Oms.push(new wsiOm());
        data_dev01_group01.TotalNumberOfItems = 2;

        proxy.notifyEvents(data_dev01_group01);
        // console.log('AFTER executeCommandDeleteGroup - notifyEvents');
        sub1.unsubscribe();
        sub2.unsubscribe();

        expect(nodeMapSnapInComponent instanceof NodeMapSnapInComponent).toBe(true);
        expect(nodeMapSnapInComponent).toBeDefined();
        expect(nodeMapSnapInComponent.executeCommandDeleteGroup).toBeDefined();

        // remove group 01
        expect(nodeMapSnapInComponent.executeCommandDeleteGroup(new NodeMapItem(instanceWsiNodeMapItem_Group01))).toBeTrue();

        // const requests = httpTestingController.match({ method: 'POST' });
        // console.log({ requests });

        // code kept RFU... const req = httpTestingController.expectOne({ method: 'POST' });
        // code kept RFU... req.flush([]);
        // expect(req.request.method).toEqual('POST');
        // req.event(expectedResponse);

        // console.log('AFTER executeCommandDeleteGroup');
        const sub3 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
           /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(1);
        });
        const sub4 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
           /* console.log('itemId = ' + item.Id); */ if (instanceWsiNodeMapItem_Group01.Id === item.Id) { occurences++; }
          }); expect(occurences).toBe(0);
        });
        proxy.notifyEvents(data_device1);
        sub3.unsubscribe();
        sub4.unsubscribe();
      }));

    it('should be OK: modifyDeviceGroupItems(false)', inject([HttpTestingController, SignalRService, WsiEndpointService],
      (httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {

        // check number of item before command execution
        // console.log('BEFORE createDmodifyDeviceGroupItemseviceGroup(false)');
        const sub1 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
            /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(1);
        });
        const sub2 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
            /* console.log('itemId = ' + item.Id); */ if (item.ParentGroupName === 'Group01') { occurences++; }
          }); expect(occurences).toBe(0);
        });

        // simulate event on SignalR
        const proxy: HubProxyEvent<WsiNodeMapDataChangedEvent> = mockSignalRService.getNorisHub().proxies[0];
        proxy.notifyEvents(data_group1);
        sub1.unsubscribe();
        sub2.unsubscribe();

        expect(instanceNodeMapService instanceof NodeMapService).toBe(true);
        expect(instanceNodeMapService).toBeDefined();
        expect(instanceNodeMapService.modifyDeviceGroupItems).toBeDefined();

        // add an item to the group
        expect(instanceNodeMapService.modifyDeviceGroupItems(false, 'Group01', ['Device1'])).toBe(_undefined);
        // code kept RFU... const req = httpTestingController.expectOne({ method: 'POST' });
        // code kept RFU... expect(req.request.method).toEqual('POST');
        // code kept RFU... req.flush([]);
        // const expectedResponse = new HttpResponse({ status: 201, statusText: 'Created', body: new Subject<any>().asObservable() });
        // req.event(expectedResponse);

        // console.log('AFTER modifyDeviceGroupItems(false)');
        const sub3 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
            /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(2);
        });
        const sub4 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
            /* console.log('itemId = ' + item.Id); */ if (item.ParentGroupName === 'Group01') { occurences++; }
          }); expect(occurences).toBe(1);
        });
        proxy.notifyEvents(data_dev1_group1);
        sub3.unsubscribe();
        sub4.unsubscribe();
      }));

    it('should be OK: modifyDeviceGroupItems(true)', inject([HttpTestingController, SignalRService, WsiEndpointService],
      (httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {

        // check number of item before command execution
        // console.log('BEFORE modifyDeviceGroupItems(true)');
        const sub1 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
              /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(2);
        });
        const sub2 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
              /* console.log('itemId = ' + item.Id); */ if (item.ParentGroupName === 'Group01') { occurences++; }
          }); expect(occurences).toBe(1);
        });

        // simulate event on SignalR
        const proxy: HubProxyEvent<WsiNodeMapDataChangedEvent> = mockSignalRService.getNorisHub().proxies[0];
        proxy.notifyEvents(data_dev1_group1);
        sub1.unsubscribe();
        sub2.unsubscribe();

        expect(instanceNodeMapService instanceof NodeMapService).toBe(true);
        expect(instanceNodeMapService).toBeDefined();
        expect(instanceNodeMapService.modifyDeviceGroupItems).toBeDefined();

        // add an item to the group
        expect(instanceNodeMapService.modifyDeviceGroupItems(true, 'Group01', ['Device1'])).toBe(_undefined);
        // code kept RFU... const req = httpTestingController.expectOne({ method: 'POST' });
        // code kept RFU... expect(req.request.method).toEqual('POST');
        // code kept RFU... req.flush([]);
        // const expectedResponse = new HttpResponse({ status: 201, statusText: 'Created', body: new Subject<any>().asObservable() });
        // req.event(expectedResponse);

        // console.log('AFTER modifyDeviceGroupItems(true)');
        const sub3 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
              /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(1);
        });
        const sub4 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
              /* console.log('itemId = ' + item.Id); */ if (item.ParentGroupName === 'Group01') { occurences++; }
          }); expect(occurences).toBe(0);
        });
        proxy.notifyEvents(data_group1);
        sub3.unsubscribe();
        sub4.unsubscribe();
      }));

    it('should be OK: createDeviceGroup()', inject([HttpTestingController, SignalRService, WsiEndpointService],
      (httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {

        // check number of item before command execution
        // console.log('BEFORE createDeviceGroup');
        const sub1 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
          /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(1);
        });
        const sub2 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
          /* console.log('itemId = ' + item.Id); */ if (instanceWsiNodeMapItem_Group1.Id === item.Id) { occurences++; }
          }); expect(occurences).toBe(0);
        });

        // simulate event on SignalR
        const proxy: HubProxyEvent<WsiNodeMapDataChangedEvent> = mockSignalRService.getNorisHub().proxies[0];
        proxy.notifyEvents(data_device1ToGroup1);
        sub1.unsubscribe();
        sub2.unsubscribe();

        expect(instanceNodeMapService instanceof NodeMapService).toBe(true);
        expect(instanceNodeMapService).toBeDefined();
        expect(instanceNodeMapService.createDeviceGroup).toBeDefined();

        // create group
        expect(instanceNodeMapService.createDeviceGroup('Group01', ['Device1'])).toBe(_undefined);
        // code kept RFU... const req = httpTestingController.expectOne({ method: 'POST' });
        // code kept RFU... expect(req.request.method).toEqual('POST');
        // code kept RFU... req.flush([]);
        // const expectedResponse = new HttpResponse({ status: 201, statusText: 'Created', body: new Subject<any>().asObservable() });
        // req.event(expectedResponse);

        // console.log('AFTER createDeviceGroup');
        const sub3 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
          /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(2);
        });
        const sub4 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
          /* console.log('itemId = ' + item.Id); */ if (instanceWsiNodeMapItem_Group1.Id === item.Id) { occurences++; }
          }); expect(occurences).toBe(1);
        });
        proxy.notifyEvents(data_dev1_group1);
        sub3.unsubscribe();
        sub4.unsubscribe();
      }));

    it('should be OK: editDeviceGroupDisplayName()', inject([HttpTestingController, SignalRService, WsiEndpointService],
      (httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {

        // check number of item before command execution
        // console.log('BEFORE editDeviceGroupDisplayName');
        const sub1 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
            /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(1);
        });
        const sub2 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; /* console.log('Items: ' + items.length); */ items.forEach(
            item => {
              if (instanceWsiNodeMapItem_Group1.DisplayName === item.DisplayName) { occurences++; }
              /* console.log('itemId = ' + item.Id + ' - DisplayName = ' + item.DisplayName);*/
      }); expect(occurences).toBe(1);
        });

        // simulate event on SignalR
        const proxy: HubProxyEvent<WsiNodeMapDataChangedEvent> = mockSignalRService.getNorisHub().proxies[0];
        proxy.notifyEvents(data_group1);
        sub1.unsubscribe();
        sub2.unsubscribe();

        // modify device group Disply Name
        const oldDisplayName = data_device1ToGroup1.Items[0].DisplayName;
        data_group1.Items[0].DisplayName = 'Group 01 Renamed';

        expect(instanceNodeMapService instanceof NodeMapService).toBe(true);
        expect(instanceNodeMapService).toBeDefined();
        expect(instanceNodeMapService.editDeviceGroupDisplayName).toBeDefined();

        // const expectedResponse = new HttpResponse({ status: 201, statusText: 'Created', body: new Subject<any>().asObservable() });
        // req.event(expectedResponse);

        // create group
        expect(instanceNodeMapService.editDeviceGroupDisplayName('Group01', 'Group01_NewDisplayName')).toBe(_undefined);
        // code kept RFU... const req = httpTestingController.expectOne({ method: 'POST' });
        // code kept RFU... expect(req.request.method).toEqual('POST');
        // code kept RFU... req.flush([]);

        // console.log('AFTER editDeviceGroupDisplayName');
        const sub3 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
            /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(1);
        });
        const sub4 = instanceNodeMapService.items().subscribe(items => {
          let occurences = 0; items.forEach(item => {
            /* console.log('itemId = ' + item.Id + ' - DisplayName = ' + item.DisplayName); */
            if ('Group 01 Renamed' === item.DisplayName) { occurences++; }
          }); expect(occurences).toBe(1);
        });
        proxy.notifyEvents(data_group1_renamed);

        // reset the diplay name
        data_group1.Items[0].DisplayName = oldDisplayName;
        sub3.unsubscribe();
        sub4.unsubscribe();
      }));
  });
  describe('Testing methods having real HTTP GET', () => {

    let nodeMapSnapInComponent: NodeMapSnapInComponent;
    let fixture: ComponentFixture<NodeMapSnapInComponent>;
    let instanceNodeMapService: NodeMapService;

    const instanceWsiNodeMapItem_Group = new wsiNodeMapItem('Group01', 'Group 01', true, '', '');

    const instanceWsiNodeMapItem_Device = new wsiNodeMapItem('Device01', 'Device 01', false, 'Group01', 'Group 01');

    const httpPost01 = new Observable<WsiNodeMapItem[]>();
    const mockHttpClient = new HttpClient(null);

    let httpClient: HttpClient;
    let httpTestingController: HttpTestingController;
    let mockSignalRService: MockSignalRService;
    let wsiEndpointService: WsiEndpointService;
    let ctxId = 0;

    const tb_Base2 = {
      // provide the component-under-test and dependent service
      declarations: [NodeMapSnapInComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(), 
        {
          provide: TraceService,
          useValue: mockTraceService // used useValue, insteaed useClass, because we want use that instance
        },
        { provide: TablesServiceBase, useValue: mockTablesServiceBase },
        { provide: IHfwMessage, useValue: mockMessageBroker },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ISnapInConfig, useValue: mockSnapinConfig },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: CnsHelperService, useValue: mockCnsHelperService },
        { provide: FilesServiceBase, useValue: mockFilesService },
        { provide: NodeMapSnapInService, useValue: mockSnapinService },
        { provide: AppContextService, useValue: mockAppContextService },
        {
          provide: NodeMapService
          // useValue: mockNodeMapService
        },
        { provide: WsiEndpointService, useValue: mockWsiEndpointService },
        { provide: ErrorNotificationServiceBase, useValue: errorService },
        { provide: AuthenticationServiceBase, useValue: mockAuthenticationServiceBase },
        { provide: SignalRService, useClass: MockSignalRService },
        { provide: EventService, useValue: eventService },
        { provide: BsModalService, useValue: mockModalService },
        { provide: BlinkService, useValue: mockBlinkService },
        { provide: JsonPipe, useValue: mockJson },
        { provide: SiIconMapperService, useValue: mockSiIconMapperService },
        { provide: SystemBrowserService, useValue: mockSystemBrowserService },
        { provide: SettingsServiceBase, useValue: mockSettingsServiceBase },
        { provide: EventService, useValue: mockEventService }
      ]
    };

    const data_more = new wsiNodeMapDataChangedEvent();
    data_more.Items.push(instanceWsiNodeMapItem_Group);
    data_more.Items.push(instanceWsiNodeMapItem_Device);
    data_more.Oms.push(new wsiOm());
    data_more.Oms.push(new wsiOm());
    data_more.TotalNumberOfItems = 2;

    const data_less_device = new wsiNodeMapDataChangedEvent();
    data_less_device.Items.push(instanceWsiNodeMapItem_Device);
    data_less_device.Oms.push(new wsiOm());
    data_less_device.TotalNumberOfItems = 1;

    const data_less_group = new wsiNodeMapDataChangedEvent();
    data_less_group.Items.push(instanceWsiNodeMapItem_Group);
    data_less_group.Oms.push(new wsiOm());
    data_less_group.TotalNumberOfItems = 1;

    beforeEach(() => {
      TestBed.configureTestingModule(tb_Base2);
      signalRService = TestBed.inject(SignalRService);
      httpClient = TestBed.inject(HttpClient);
      httpTestingController = TestBed.inject(HttpTestingController);
      wsiEndpointService = TestBed.inject(WsiEndpointService);

      const services: Services = new Services(mockWsiEndpointService, mockAuthenticationServiceBase,
        mockWsiUtilityService, signalRService, errorService, eventService);
      instanceNodeMapService = new NodeMapService(mockTraceService, mockHttpClient, ngZone, services);

      fixture = TestBed.createComponent(NodeMapSnapInComponent);
      nodeMapSnapInComponent = fixture.componentInstance;

      // Assign the fullId of the SNI (usually it arrived from Hldl)
      nodeMapSnapInComponent.fullId = new FullSnapInId('', '');
      nodeMapSnapInComponent.ngOnInit();

      const nodeMapSubscriptionUrl = '/api/sr/nodemapsubscriptions/';
      const connectionId = 'TestClientConnectionId';
      // console.log('ctxId = ' + ctxId);
      const url = `${wsiEndpointService.entryPoint}${nodeMapSubscriptionUrl}${ctxId}/${connectionId}`; // ${hubProxyShared.connectionId}
      ctxId++;

      // code kept RFU... const req = httpTestingController.expectOne({ method: 'POST' });
      // code kept RFU... expect(req.request.method).toEqual('POST');
      // code kept RFU... req.flush([]);

    });
    afterEach(() => {
      nodeMapSnapInComponent.ngOnDestroy();

      httpTestingController = TestBed.inject(HttpTestingController);
      wsiEndpointService = TestBed.inject(WsiEndpointService);
      const nodeMapSubscriptionUrl = '/api/sr/nodemapsubscriptions/';
      const connectionId = 'TestClientConnectionId';
      const url = `${wsiEndpointService.entryPoint}${nodeMapSubscriptionUrl}${connectionId}`; // ${hubProxyShared.connectionId}
      // code kept RFU... const req = httpTestingController.expectOne({ method: 'DELETE' });
      // code kept RFU... expect(req.request.method).toEqual('DELETE');
      // code kept RFU... req.flush([]);

      // code kept RFU... httpTestingController.verify();
    });

    it('should be OK: GetDeviceGroupItems()', done => {

      // check number of item before command execution
      // console.log('BEFORE GetDeviceGroupItems()');
      const sub1 = instanceNodeMapService.totalNumberOfItems().subscribe(totalNumberOfItems => {
        /* console.log('totalNumberOfItems = ' + totalNumberOfItems); */ expect(totalNumberOfItems).toEqual(2);
      });
      const sub2 = instanceNodeMapService.items().subscribe(items => {
        let occurences = 0; items.forEach(item => {
        /* console.log('itemId = ' + item.Id); */ if (item.ParentGroupName === 'Group01') { occurences++; }
        }); expect(occurences).toBe(1);
      });

      expect(instanceNodeMapService instanceof NodeMapService).toBe(true);
      expect(instanceNodeMapService).toBeDefined();
      expect(instanceNodeMapService.GetDeviceGroupItems).toBeDefined();

      const deviceGroupId = 'Group01';

      const httpResponseItems = new Array<WsiNodeMapItem>();
      httpResponseItems.push(instanceWsiNodeMapItem_Group, instanceWsiNodeMapItem_Device);

      const httpResponseBody = new Observable<WsiNodeMapItem[]>(
        subscriber => {
          subscriber.next(httpResponseItems);
        }
      );

      const wsiEndpointService1 = TestBed.get(WsiEndpointService);
      const httpTestingController1 = TestBed.get(HttpTestingController);
      const nodeMapExtensionsUrl = '/api/sr/NodeMapExtensions/';
      const url = `${wsiEndpointService1.entryPoint}${nodeMapExtensionsUrl}${encodeURIComponent(deviceGroupId)}`;
      // const headers: HttpHeaders = wsiUtilityService.httpGetDefaultHeader(authenticationServiceBase.userToken);

      const inputResponse = new HttpResponse({ status: 200, statusText: 'OK', body: httpResponseBody });
      const expectedResponse = new HttpResponse({ status: 200, statusText: 'OK', body: httpResponseBody });
      const httpGetSpy: jasmine.Spy<any> = spyOn<any>(httpClient, 'get').and.returnValue(of(inputResponse));
      let result: any;

      httpClient.get(url, { headers: undefined, observe: 'response' }).subscribe(items => { result = items; });

      // get the items of the group
      // instanceNodeMapService.GetDeviceGroupItems(deviceGroupId).subscribe(items => { result = items;});
      expect(httpGetSpy).toHaveBeenCalled();
      expect(httpGetSpy.calls.mostRecent().args[0]).toEqual(url);

      setTimeout(() => {
        expect(result).toEqual(expectedResponse);
        done();
      }, 1);

      // console.log('AFTER GetDeviceGroupItems()');
      sub1.unsubscribe();
      sub2.unsubscribe();

    });

  });
});
