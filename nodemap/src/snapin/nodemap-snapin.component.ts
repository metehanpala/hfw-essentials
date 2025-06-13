import { JsonPipe } from '@angular/common';
import { Component, HostBinding, HostListener, Injectable, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TileScrolledEvent, TilesViewComponent, TilesViewDataResult } from '@gms-flex/controls';
import {
  FullQParamId, FullSnapInId, IHfwMessage, ISnapInConfig, MessageParameters, ParamsSendMessage,
  QParam, SnapInBase, VerticalBarConfig, VerticalBarItem
} from '@gms-flex/core';
import { GmsNodeMapStorageService, NodeMapState } from '@gms-flex/nodemap-root-services';
import {
  AppRightsService, BrowserObject, CnsHelperService, CnsLabel, CnsLabelEn, ConnectionState,
  Event,
  EventFilter,
  EventService,
  EventStates,
  EventSubscription,
  GmsMessageData, GmsSelectionType, Operation, Page, SearchOption, SiIconMapperService,
  SystemBrowserService,
  Tables, TablesEx, TablesServiceBase, TextEntry, ViewNode
} from '@gms-flex/services';
import { AppContextService, isNullOrUndefined, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { GridData, HeaderData } from '@gms-flex/snapin-common';
import { TranslateService } from '@ngx-translate/core';
import { Criterion, MenuItem, OptionCriterion, SearchCriteria, SiFormContainerComponent } from '@simpl/element-ng';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Observable, Subject, Subscription } from 'rxjs';

import { NodeMapItem, Om, WsiNodeMapItem, WsiOm } from '../services/data.model';
import { NodeMapSnapInService } from '../services/nodemap-snapin.service';
import { NodeMapService } from '../services/nodemap.service';
import { TraceModules } from '../shared/trace-modules';
import { NodeMapSnapInViewModelBase } from '../view-model/snapin-vm.base';
import { TemplateStrings } from './data.model';

@Injectable({
  providedIn: 'root'
})
export class Services {
  public constructor(
    public readonly tablesService: TablesServiceBase,
    public readonly snapinConfig: ISnapInConfig,
    public readonly cnsHelperService: CnsHelperService,
    public readonly snapinService: NodeMapSnapInService,
    public readonly appContextService: AppContextService,
    public readonly nodeMapService: NodeMapService) {
  }
}

@Injectable({
  providedIn: 'root'
})
export class Services1 {
  public constructor(
    public readonly modalService: BsModalService,
    public readonly appRightsService: AppRightsService,
    public readonly settingsService: SettingsServiceBase,
    public readonly iconMapperService: SiIconMapperService,
    public readonly systemBrowserService: SystemBrowserService,
    public readonly eventService: EventService) {
  }
}

type Command = {
  commandName: string;
  data: NodeMapItem;
  booleanValue?: boolean;
};

// US1974222
interface StateIcons {
  icon: string;
  secondaryIcon: string;
}

/**
 * Sorting
 *
 * 0 => Sort by Name
 * 1 => Sort by DisplayName
 *
 * @enum {number}
 */
enum Sorting {
  Name,
  DisplayName
}

const nodeMapSnapinId = 3200;
const configAppRight = 102400;
const log = false;

// US2053493
class UTWsiNodeMapItem implements WsiNodeMapItem {
  public SystemId: number;
  public Id: string;
  public Type: number;
  public SubType: number;
  public Discipline: number;
  public SubDiscipline: number;
  public NetworkType: number;
  public IsDeviceGroup: boolean;
  public ParentGroupName: string;
  public ParentGroupDisplayName: string;
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
  public SymbolPngFileRelativePath: string;
  public CountChildren: number;
  public MostImportantAlarmCustomerText: string;

  constructor() {
    this.SystemId = 1;
    this.Designations = ['', ''];
  }
}
// US2053493

/* *yarn
* @Component
 *
 * @export
 * @class NodeMapSnapInComponent
 * @extends {SnapInBase}
 * @implements {OnInit}
 * @implements {OnChanges}
 * @implements {OnDestroy}
 */
@Component({
  selector: 'gms-nodemap-snapin',
  providers: [JsonPipe],
  templateUrl: './nodemap-snapin.component.html',
  styleUrl: './_nodemap-snapin.component.scss',
  standalone: false
})

/**
 * NodeMapSnapInComponent
 *
 * @export
 * @class NodeMapSnapInComponent
 * @extends {SnapInBase}
 * @implements {OnInit}
 * @implements {OnChanges}
 */
export class NodeMapSnapInComponent extends SnapInBase implements OnInit, OnChanges, OnDestroy {

  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;
  @HostBinding('class.snapin-container') public guardSnapIn = true;
  @HostBinding('class.snapin-container-overflow-auto') public guardOverflow = true;

  @ViewChild('tilesViewTemplate') public readonly tilesView: TilesViewComponent;
  @ViewChild('deviceGrouptemplate') public deviceGrouptemplate: TemplateRef<any>;
  @ViewChild('tilesizetemplate') public tilesizetemplate: TemplateRef<any>;
  @ViewChild('createGrouptemplate') public createGrouptemplate: TemplateRef<any>;   // US2053493

  public errorCodeTranslateKeyMap = new Map<string, string>([
    ['description.required', 'description is required!']
  ]);

  public controlNameTranslateKeyMap = new Map<string, string>([
    ['description', 'Description']
  ]);

  @ViewChild(SiFormContainerComponent) public formContainer!: SiFormContainerComponent<any>;
  public form!: FormGroup;
  public tooltips = false;
  public labelWidth = 140;

  @Input() public selectedObject: BrowserObject;

  /* public variables*/
  public templateStrings: TemplateStrings = {};
  public sizeModel = 'm';
  public modalRef!: BsModalRef;
  public primaryActions: any[] = [];
  public primaryActionsIcons: any[] = [];
  public secondaryActionsIcons: any[] = [];
  public primaryActionsModeIcons: any[] = [];
  public secondaryActionsModeIcons: any[] = [];

  public tilesViewData: TilesViewDataResult | undefined;

  public items: NodeMapItem[] = [];
  public totalNumberOfItems: number;
  public oms: Om[] = [];
  public itemsForGroup: string[] = [];
  public createGroup = false;
  // pagination based fixes to 10
  // public itemsPerPage = 10;
  // public itemsPerPage = 2147483647; // now changed to max value of uint in c#
  public itemsPerPageOptions: number[] = [5, 10, 25, 50];
  public displayedDeviceGroupId: string;
  public displayedDeviceGroupLabel: string;
  public displayedDeviceGroupDisplayName: string;
  public displayedDeviceGroupName: string;
  public displayedDeviceGroupItemsCount: number;
  public addGroupDeviceGroup: NodeMapItem = null;
  public GetDeviceGroupItems: NodeMapItem[] = [];
  public deviceGroups: NodeMapItem[] = [];
  public devices: NodeMapItem[] = [];             // US2053493
  public allDeviceGroups: NodeMapItem[] = [];     // US2053493
  public allDeviceGroupsAll: NodeMapItem[] = [];  // US2053489
  public currentGroupItems: NodeMapItem[] = [];   // US2053491
  public adddeviceGroups: NodeMapItem[] = [];
  public deviceGroupId: string;
  public deviceGroupDisplayName: string;
  public searchText: string;
  public searchTextCreateNewGroup = '';    // US2053493
  public reattachInd: Subject<void> = new Subject<void>();
  public sorting = Sorting.Name;
  public ascendingOrder = true;
  public dataTotal = 5;
  public logEvent: (p: any) => void;
  public cnsLabelObject: CnsLabel = new CnsLabel();
  public pageSize = 10000;

  public step: number;                // US2053493
  public containerHeightVH: number;   // US2053493
  public tableHeightVH: number;       // US2053493

  public readonly trackByIndex = (index: number): number => index;

  public disabled = false;

  // virtualization variables
  public skip = 0;
  public itemsPerPage = 100;

  /** local variables */
  public disciplineFromIdMap: Map<number, string> = new Map<number, string>();
  public subDisciplineFromIdMap: Map<number, string> = new Map<number, string>();
  public objectTypeFromIdMap: Map<number, string> = new Map<number, string>();
  public objectSubTypeFromIdMap: Map<number, string> = new Map<number, string>();

  public categoriesFromIdMap: Map<number, string> = new Map<number, string>();
  public categoriesIconFromIdMap: Map<number, string> = new Map<number, string>();

  private readonly saveDataToStorageService = true;
  private EventFilterId: string = null;
  private currentNodeMapState: NodeMapState = null;
  // storage service
  private storageService: GmsNodeMapStorageService;

  private readonly Entries: string[] = [];
  private editApplicationRight = true;
  private configApplicationRight = false;
  private Commands: Command[] = [];
  private updateHTML = false;

  // data for UI refresh logic
  private counter = 0;
  private intervalRefresh = undefined;
  private selectedObjectMustBeConnected = false;
  private waitingForData = false;

  private hdrData: HeaderData[] = [];
  private subscriptions: Subscription[] = [];
  private eventSubscriptions: EventSubscription[] = [];
  private messageSubscription: Subscription;
  private readonly blinkSubscription: Subscription[] = [];
  private currentPage = 1;
  public snapInId: string;
  private snapInVm: NodeMapSnapInViewModelBase;
  private locale: string;
  private hldlFullConfig: any;

  private gotDisconnected = false;

  // US2053493
  public createNewGroupName = '';
  private selectedGroupId = '';
  private currentGroupId = '';
  // US2053493

  // Defect2238648
  public renameGroupClass = 'form-control';
  // Defect2238648

  // US2119362
  public onTileClickSub: Subject<NodeMapItem> = new Subject<NodeMapItem>();
  // US2119362

  // US2169381
  public onTileDoubleClickSub: Subject<NodeMapItem> = new Subject<NodeMapItem>();
  // US2169381

  private multipleSelectionActive = false;
  public selectedTileItems: NodeMapItem[] = [];
  private commonActions: string[] = [];
  private currentlyClickedDataItem: NodeMapItem;
  private readonly activeClass = 'active-item';
  private readonly deactiveClass = 'deactive-item';
  private readonly sniSelectorQuery = 'gms-nodemap-snapin ';
  private readonly cardQuery = this.sniSelectorQuery + 'hfw-tiles-view si-card ';
  private readonly cabQuery = this.cardQuery + 'si-content-action-bar';
  private readonly mitQuery = this.sniSelectorQuery + 'hfw-tiles-view si-menu-legacy-item';

  // system browser selected object attributes
  private selectedObjectName: string;
  private selectedObjectDescription: string;
  private selectedObjectOM: string;
  private selectedObjectSystemId: number;
  private selectedObjectLocation: string;
  private selectedObjectDesignation: string;
  public modePrimaryItems: MenuItem[];
  public ShowAllDevices: boolean;
  public fullSnapinID: FullSnapInId;

  private readonly deviceTypeOptions: OptionCriterion[]; // = [
  //     {iconClass: 'element-group-member', label:'Fire', selected: true, value: '100'},
  //     {iconClass: 'element-group-member', label:'Camera', selected: true, value: '600'},
  //     {iconClass: 'element-group-member', label:'Computer', selected: true, value: '1200'},
  //     {iconClass: 'element-group-member', label:'ControlPanel', selected: true, value: '1700'}];

  public filterCriteria: Criterion[];

  public filteredSearch = {
    criteria: [
      {
        name: 'state',
        label: 'State',
        // options: [
        //     { iconClass: 'element-group-member', label: 'connected', selected: true, value: 'connected' },
        //     { iconClass: 'element-group-member', label: 'disconnected', selected: true, value: 'disconnected' }],
        onlySelectValue: true
      },
      {
        name: 'events',
        label: 'Events',
        // options: [
        //     { iconClass: 'element-group-member', label: 'pending', selected: true, value: 'pending' },
        //     { iconClass: 'element-group-member', label: 'non-pending', selected: true, value: 'non-pending' }],
        onlySelectValue: true
      },
      {
        name: 'discipline',
        label: 'Discipline',
        // options: [
        //     { iconClass: 'element-group-member', label: 'Fire', selected: false, value: '100' },
        //     { iconClass: 'element-group-member', label: 'Building Automation', selected: false, value: '200' },
        //     { iconClass: 'element-group-member', label: 'Building Infrastructure', selected: false, value: '300' },
        //     { iconClass: 'element-group-member', label: 'Management System', selected: false, value: '400' },
        //     { iconClass: 'element-group-member', label: 'Security', selected: false, value: '500' },
        //     { iconClass: 'element-group-member', label: 'Energy Management', selected: false, value: '600' },
        //     { iconClass: 'element-group-member', label: 'Notification', selected: false, value: '700' }],
        multiSelect: true
      },
      {
        name: 'description',
        label: 'Description'
      },
      {
        name: 'name',
        label: 'Name'
      },
      // {
      //     name: 'ownership',
      //     label: 'Ownership',
      //     // options: [
      //     //     { iconClass: 'element-group-member', label: 'Yes', selected: false, value: 'Yes' },
      //     //     { iconClass: 'element-group-member', label: 'No', selected: false, value: 'No' }],
      //     onlySelectValue: true
      // },
      {
        name: 'deviceType',
        label: 'Device Type',
        multiSelect: true
      },
      {
        name: 'system',
        label: 'System',
        multiSelect: true
      }
    ],
    lazyCriterionProvider: (typed: string): Observable<Criterion[]> => {
      const result = new Subject<Criterion[]>();
      const filteredCategories: Criterion[] = [];

      filteredCategories.push({
        name: 'state', label: this.templateStrings.stateText, options: [
          { iconClass: null, label: this.templateStrings.connectedText, selected: false, value: '1' },
          { iconClass: null, label: this.templateStrings.disconnectedText, selected: false, value: '0' }],
        onlySelectValue: true
      });
      filteredCategories.push({
        name: 'events', label: this.templateStrings.eventsText, options: [
          { iconClass: null, label: this.templateStrings.pendingText, selected: false, value: '1' },
          { iconClass: null, label: this.templateStrings.notpendingText, selected: false, value: '0' }],
        onlySelectValue: true
      });

      const discipleOptions: OptionCriterion[] = [];
      const disciplines: number[] = [];
      this.items.forEach(item => {
        if (!item.isDeviceGroup && !disciplines.includes(item.browserObject.Attributes.DisciplineId)) {
          disciplines.push(item.browserObject.Attributes.DisciplineId);
        }
      });

      disciplines.forEach(disciplineId =>
        discipleOptions.push({
          iconClass: this.services1.iconMapperService.getGlobalIconSync(TablesEx.Disciplines, disciplineId),
          label: this.disciplineFromIdMap.get(disciplineId), selected: false, value: disciplineId.toString()
        }));

      if (discipleOptions.length > 0) {
        filteredCategories.push({
          name: 'discipline', label: this.templateStrings.discipline, options: discipleOptions,
          multiSelect: true
        });
      }

      filteredCategories.push({ name: 'description', label: this.templateStrings.description });

      filteredCategories.push({ name: 'name', label: this.templateStrings.name });

      // if there are devices in the view
      if (this.items.filter(x => x.isDeviceGroup === false).length > 0) {
        filteredCategories.push({ name: 'network', label: this.templateStrings.network });
      }

      // code kept RFU... filteredCategories.push({
      //     code kept RFU... name: 'ownership', label: 'Ownership', options: [
      //         code kept RFU... { iconClass: 'element-lock-filled', label: 'Yes', selected: false, value: '1' },
      //         code kept RFU... { iconClass: 'element-unlock', label: 'No', selected: false, value: '0' }
      //     code kept RFU... ],
      //     code kept RFU... onlySelectValue: true
      // code kept RFU... });

      const objectTypeOptions: OptionCriterion[] = [];

      // select all item's type and subtype
      const itemSubtypes: number[] = [];
      const itemTypes: number[] = [];
      this.items.forEach(item => {
        if (item.browserObject.Attributes.SubTypeId !== 0) {
          if (!itemSubtypes.includes(item.browserObject.Attributes.SubTypeId)) {
            itemSubtypes.push(item.browserObject.Attributes.SubTypeId);
          }
        } else if (item.browserObject.Attributes.TypeId !== 0 && !itemTypes.includes(item.browserObject.Attributes.TypeId)) {
          itemTypes.push(item.browserObject.Attributes.TypeId);
        }
      });

      itemTypes.forEach(itemtype =>
        objectTypeOptions.push({ iconClass: null, label: this.objectTypeFromIdMap.get(itemtype), selected: false, value: itemtype.toString() }));
      itemSubtypes.forEach(itemSubtype =>
        objectTypeOptions.push({ iconClass: null, label: this.objectTypeFromIdMap.get(itemSubtype), selected: false, value: itemSubtype.toString() }));

      if (objectTypeOptions.length > 0) {
        filteredCategories.push({
          name: 'deviceType', label: this.templateStrings.deviceType, options: objectTypeOptions,
          multiSelect: true
        });
      }

      // select all item's system
      const itemSystemsOptions: OptionCriterion[] = [];
      const itemSystems: string[] = [];
      this.items.forEach(item => {
        const system = item.id.split(':')[0];
        if (!itemSystems.includes(system)) {
          itemSystems.push(system);
        }
      });
      itemSystems.forEach(system =>
        itemSystemsOptions.push(
          { iconClass: null, label: system, selected: false, value: system }
        )
      );
      filteredCategories.push({
        name: 'system', label: this.templateStrings.system, options: itemSystemsOptions, multiSelect: true
      });

      setTimeout(() => {
        // dummy timeout to simulate e.g. REST delay
        result.next(filteredCategories);
      }, 10);
      return result.asObservable();
    }
  };

  // Used to keep the search criteria as provided by the user
  public searchFilterCriteria: SearchCriteria = {
    criteria: [],
    value: ''
  };
  /**
   * Constructor
   * @param {TraceService} traceService
   * @param {TranslateService} translateService
   * @param {IHfwMessage} messageBroker
   * @param {Services} services
   */
  public constructor(
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute,
    private readonly traceService: TraceService,
    private readonly translateService: TranslateService,
    private readonly appContextService: AppContextService,
    private readonly services: Services,
    private readonly services1: Services1) {
    super(messageBroker, activatedRoute);

    traceService.debug('constructor)');

    this.setLocalization();
  }

  // US2119362
  public onMouseEnter(nodeMapItem: NodeMapItem, ev): void {
    if (nodeMapItem != null) {
      if (nodeMapItem.isDeviceGroup || ev.ctrlKey) {
        nodeMapItem.cardBackgroundColor = 'card-background';
        nodeMapItem.cardCursor = 'default';
      } else {
        nodeMapItem.cardBackgroundColor = 'button-background';
        nodeMapItem.cardCursor = 'pointer';
      }
    }
  }

  public onMouseLeave(nodeMapItem: NodeMapItem): void {
    if (nodeMapItem != null) {
      nodeMapItem.cardBackgroundColor = 'card-background';
      nodeMapItem.cardCursor = 'default';
    }
  }
  // US211936

  // US2053493
  public controlsExchanged = false;

  /**
   * onExistingGroupRadioChanged
   *
   * @param {*} event
   * @memberof NodeMapSnapInComponent
   */
  public onExistingGroupRadioChanged(event): void {
    if (this.step === 4) {
      this.controlsExchanged = true;
    }

    const elem1: HTMLElement = document.getElementById('newGroupInput');
    if (elem1 !== null) {
      elem1.setAttribute('disabled', '');
    }
    const elem2: HTMLElement = document.getElementById('existingGroupInput');
    if (elem2 !== null) {
      elem2.removeAttribute('disabled');
    }
  }

  /**
   * onNewGroupRadioChanged
   *
   * @param {*} event
   * @memberof NodeMapSnapInComponent
   */
  public onNewGroupRadioChanged(event): void {
    if (this.step === 4) {
      this.controlsExchanged = false;
    }

    const elem1: HTMLElement = document.getElementById('newGroupInput');
    if (elem1 !== null && this.step !== 4) {
      elem1.removeAttribute('disabled');
    }
    const elem2: HTMLElement = document.getElementById('existingGroupInput');
    if (elem2 !== null) {
      elem2.setAttribute('disabled', '');
    }
    this.canSave();
  }

  /**
   * canMoveNext
   *
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public canMoveNext(): boolean {
    const selectedDevices = this.devices.filter(dev => dev.isSelected);
    return selectedDevices.length > 0;
  }

  /**
   * moveNext
   *
   * @memberof NodeMapSnapInComponent
   */
  public moveNext(): void {
    const tmpModalRef = this.modalRef;
    this.searchTextCreateNewGroup = '';
    if (this.step === 5) {
      this.containerHeightVH = 48.5;  // 46;
      this.tableHeightVH = 49.5;      // 47;
      this.step = 4;
      this.devices.forEach(device => device.isVisible = device.isSelected);
      this.openModal(this.createGrouptemplate);
    } else {
      this.Commands.push({ commandName: 'SG2', data: null, booleanValue: false });
      this.executeCommands();
    }
    if (tmpModalRef !== undefined) {
      tmpModalRef.hide();
    }
  }

  /**
   * onBack
   *
   * @param {*} $event
   * @memberof NodeMapSnapInComponent
   */
  public onBack($event): void {
    const tmpModalRef = this.modalRef;
    this.devices.forEach(
      dev => {
        dev.isVisible = dev.isSelected;
      }
    );
    this.Commands.push({ commandName: 'SG', data: null, booleanValue: false });
    this.executeCommands();
    if (tmpModalRef !== undefined) {
      tmpModalRef.hide();
    }
  }
  // US2053493

  @HostListener('window:keydown', ['$event'])
  public keydownEvent(event: KeyboardEvent): void {
    if (event.ctrlKey) {
      this.multipleSelectionActive = true;
    }
  }

  @HostListener('window:keyup', ['$event'])
  public keyupEvent(event: KeyboardEvent): void {
    if (!event.ctrlKey) {
      this.multipleSelectionActive = false;
    }
  }

  private contentBarClicked = false;

  @HostListener('click', ['$event'])
  public click(event: any): void {
    const target = event.target as HTMLElement;
    this.contentBarClicked = !isNullOrUndefined(target.closest(this.cabQuery));
    let alreadySelectedTileClicked = false;
    if (this.selectedTileItems.length > 0) {
      if (!isNullOrUndefined(target.closest(this.cardQuery))) {
        alreadySelectedTileClicked = this.selectedTileItems.some(item => item.id + item.label === target.closest(this.cardQuery).id);
      }
    }
    if (this.contentBarClicked) {
      let items: NodeMapItem[];
      if (alreadySelectedTileClicked) {
        items = this.selectedTileItems;
      } else {
        items = [this.currentlyClickedDataItem];
      }
      this.calculateCommonActions(items, alreadySelectedTileClicked);
    }
    // click outside of any tile item and inside the nodemap snapin
    if (!alreadySelectedTileClicked && isNullOrUndefined(target.closest(this.cardQuery)) &&
      !isNullOrUndefined(target.closest(this.sniSelectorQuery)) && isNullOrUndefined(target.closest(this.mitQuery))) {
      const multipleItemSelected = this.selectedTileItems.length > 0;
      if (multipleItemSelected && !target.innerHTML.startsWith('<si-menu-legacy-item ')) {
        this.selectedTileItems.forEach(item => {
          this.applyDeactiveStyle(item);
        });
        this.selectedTileItems = [];
        this.applyDeactiveStyle(undefined);
      }
    }
  }

  public populatePrimaryActions(dataItem: NodeMapItem, ev: any): void {
    // Manage primary actions population
    if (ev?.srcElement?.className === 'icon element-options-vertical' ||
      ev?.srcElement?.className === 'dropdown-item flex-grow-0 focus-inside cdk-menu-trigger' ||
      ev?.srcElement?.className === 'dropdown-item flex-grow-0 focus-inside cdk-menu-trigger ng-star-inserted') {

      dataItem.actions = [];

      if (dataItem.isDeviceGroup) {
        dataItem.ownedChildren = this.items.filter(it => it.owner === undefined && it.parentGroupName === dataItem.name).length;
        this.pushGroupCRUDActions(dataItem);
      } else {
        this.setAttributes(dataItem);
        this.assignDeviceToGroup(dataItem);     // US2053489
      }

      this.pushRemoveGroupActions(dataItem);
      // US2119361
      if (!dataItem.isDeviceGroup) {
        this.pushNavigateTo(dataItem);
      }
      // US2119361

      // US2169384
      if (!dataItem.isDeviceGroup) {
        this.pushShowInProperties(dataItem);
      }
      // US2169384

      dataItem.UIActions = dataItem.actions;
      this.setItemActions(dataItem);
    } else {
      this.onTileClick(dataItem, ev);
    }
  }

  /**
   * setItemActions
   *
   * @private
   * @param {NodeMapItem} item
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private setItemActions(item: NodeMapItem): void {
    if (this.selectedTileItems.length === 0) {
      return;
    }

    const itemIndex = this.selectedTileItems.indexOf(item);
    if (itemIndex < 0 && this.selectedTileItems.length > 0) {
      item.actions.forEach(action => {
        action['disabled'] = true;
        action['action'] = undefined;
      });
    } else {
      // item.actions = this.cloneActions(this.actionsCache.get(item.id));
      item.actions.forEach(action => {
        if (!this.editApplicationRight) {
          action['action'] = undefined;
        } else if (this.selectedTileItems.length > 0 &&
          (action.title === this.templateStrings.removeFromGroup_ ||
            action.title === this.templateStrings.navigateTo_ ||
            action.title === this.templateStrings.showInProperties_)) {
          action['disabled'] = true;
          action['action'] = undefined;
        }
      });
    }
    item.UIActions = this.cloneActions(item.actions);
  }

  public onTileClick(dataItem: NodeMapItem, ev): void {
    if (ev.ctrlKey) {
      setTimeout(() => {
        // dummy timeout to simulate e.g. REST delay
        if (!dataItem.isDeviceGroup && dataItem.parentGroupName === '' && !this.contentBarClicked) {
          this.currentlyClickedDataItem = dataItem;
          if (this.multipleSelectionActive) {
            const itemIndex: number = this.selectedTileItems.indexOf(dataItem);
            if (itemIndex > -1) {
              this.selectedTileItems.splice(itemIndex, 1);
              this.applyDeactiveStyle(dataItem);
            } else {
              this.selectedTileItems.push(dataItem);
              this.applyActiveStyle(dataItem);
            }
          }
        }
      }, 50);
    }
  }

  // US2119362
  public onInfoDeviceClick(selectedItem: NodeMapItem, ev): void {
    if (!isNullOrUndefined(selectedItem) && !selectedItem.isDeviceGroup && !ev.ctrlKey) {
      this.onTileClickSub.next(selectedItem);
    }
  }
  // US2119362

  // US2169381
  public onInfoDeviceDoubleClick(selectedItem: NodeMapItem, ev): void {
    if (!isNullOrUndefined(selectedItem) && selectedItem.isDeviceGroup && !ev.ctrlKey) {
      this.onTileDoubleClickSub.next(selectedItem);
    }
  }
  // US2169381

  /**
   * actionsCache
   *
   * @private
   * @memberof NodeMapSnapInComponent
   */
  private readonly actionsCache = new Map<string, any>();

  /**
   * loadActionsCache
   *
   * @private
   * @memberof NodeMapSnapInComponent
   */
  private loadActionsCache(): void {
    this.actionsCache.clear();

    this.items.forEach(item => {
      this.actionsCache.set(item.id, this.cloneActions(item.actions));
    });
  }

  /**
   * cloneActions
   *
   * @private
   * @param {} actions
   * @returns
   * @memberof NodeMapSnapInComponent
   */
  private cloneActions(actions: any[]) {
    if (isNullOrUndefined(actions)) {
      return actions;
    }
    return actions.map(obj => ({ ...obj }));
  }

  /**
   * setActions
   *
   * @private
   * @memberof NodeMapSnapInComponent
   */
  private setActions(): void {
    this.items.forEach(item => {
      const itemIndex = this.selectedTileItems.indexOf(item);
      if (itemIndex < 0 && this.selectedTileItems.length > 0) {
        item.actions.forEach(action => {
          action['disabled'] = true;
          action['action'] = undefined;
        });
      } else {
        item.actions = this.cloneActions(this.actionsCache.get(item.id));
        item.actions.forEach(action => {
          if (!this.editApplicationRight) {
            action['action'] = undefined;
          } else if (this.selectedTileItems.length > 0 &&
            (action.title === this.templateStrings.removeFromGroup_ ||
              action.title === this.templateStrings.navigateTo_ ||
              action.title === this.templateStrings.showInProperties_)) {
            action['disabled'] = true;
            action['action'] = undefined;
          }
        });
      }
    });
  }

  /**
   * applyActiveStyle
   *
   * @private
   * @param {} dataItem
   * @memberof NodeMapSnapInComponent
   */
  private applyActiveStyle(dataItem: NodeMapItem): void {
    if (!dataItem.isDeviceGroup) {
      // this.setActions();

      document.getElementById(dataItem.id + dataItem.label).classList.remove(this.deactiveClass);
      document.getElementById(dataItem.id + dataItem.label).classList.add(this.activeClass);
    }
  }

  /**
   * applyDeactiveStyle
   *
   * @private
   * @param {} dataItem
   * @memberof NodeMapSnapInComponent
   */
  private applyDeactiveStyle(dataItem: NodeMapItem): void {
    if (dataItem === undefined) {
      // this.setActions();
    } else if (!dataItem.isDeviceGroup) {
      // this.setActions();

      document.getElementById(dataItem.id + dataItem.label).classList.remove(this.activeClass);
      document.getElementById(dataItem.id + dataItem.label).classList.add(this.deactiveClass);
    }
  }

  // US1974222
  /**
   * isEventAcked()
   *
   * @private
   * @param {string} [eventState]
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  private isEventAcked(eventState: string): boolean {
    switch (eventState) {
      case 'Unprocessed':
      case 'UnprocessedWithTimer': {
        return false;
      }
      default: {
        return true;
      }
    }
  }

  /**
   * getSourceStateIcons()
   *
   * @private
   * @param {string} [sourceState]
   * @param {string} [eventState]
   * @returns {string}
   * @memberof NodeMapSnapInComponent
   */
  private getSourceStateIcons(sourceState: string, eventState: string): StateIcons {
    const icons = { icon: '', secondaryIcon: undefined };
    if (sourceState === 'Quiet') {
      if (this.isEventAcked(eventState)) {
        icons.icon = 'element-alarm-background text-body';
        icons.secondaryIcon = 'element-alarm-tick text-body';
      } else {
        icons.icon = 'element-alarm text-body';
      }
    } else if (this.isEventAcked(eventState)) {
      icons.icon = 'element-alarm-background-filled event-info-source-icon-active-color';
      icons.secondaryIcon = 'element-alarm-tick text-body';
    } else {
      icons.icon = 'element-alarm-filled event-info-source-icon-active-color';
    }
    return icons;
  }

  /**
   * isAllDeviceAreDisconnected()
   *
   * @private
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public areAllDeviceDisconnected(nodeMapItem: NodeMapItem): boolean {
    if (nodeMapItem.isDeviceGroup) {
      if ((nodeMapItem.disconnectedChildren > 0) && (nodeMapItem.disconnectedChildren === nodeMapItem.countChildren)) {
        return true;
      }
    } else if (nodeMapItem.isOffline) {
      return true;
    }
    return false;
  }

  /**
   * onEventsChange()
   *
   * @private
   * @param {any[]} [events]
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public onEventsChange(events: any[], nodeMapItem: NodeMapItem): void {

    if (nodeMapItem === null) {
      this.traceService.warn(TraceModules.nodeMapSnapIn, 'Event change Callback - Invalid Event format');
      return;
    }

    // Update the events associated to a single NodeMapItem evaluating incoming notifications from EventService
    this.updateEventsForNodeMapItem(events, nodeMapItem);

    // Update the counter to display the number of events on top of the alarm bell
    nodeMapItem.eventCounter = this.computeEventCounter(nodeMapItem);

    if (nodeMapItem.eventsMap.size === 0) {
      if (!this.areAllDeviceDisconnected(nodeMapItem)) {
        nodeMapItem.mostImportantEventText = '';
        nodeMapItem.categoryEventIcon = '';
      } else {
        // offline
        nodeMapItem.mostImportantEventText = this.templateStrings.deviceOffline_;
        nodeMapItem.categoryEventIcon = '';
      }
      return;
    }

    // Evaluate the most important event based on priorities
    const mostImportantEvent = this.computeMostImportantEvent(nodeMapItem);

    if (isNullOrUndefined(mostImportantEvent)) {
      nodeMapItem.mostImportantEvent = null;
      return;
    }

    if (isNullOrUndefined(nodeMapItem.mostImportantEvent)) {
      nodeMapItem.mostImportantEvent = new Event();
    }
    nodeMapItem.mostImportantEvent.updateEvent(mostImportantEvent);

    // popover icon
    const srcState = nodeMapItem.mostImportantEvent?.srcState;
    const state = nodeMapItem.mostImportantEvent?.state;
    const iconClasses = this.getSourceStateIcons(srcState, state);
    nodeMapItem.popoverIcon = iconClasses.icon;

    if (!this.areAllDeviceDisconnected(nodeMapItem)) {
      nodeMapItem.mostImportantEventText = nodeMapItem.mostImportantEvent?.cause;

      // load icon category background color
      // nodeMapItem.categoryIconColor = `rgb(${ev.customData.eventItem.category.colors.get(EventColors.ButtonGradientDark)})`;
      nodeMapItem.categoryIconColor = 'black';

      // load subDiscipline icon. It's the same showed into the event list
      const subDisciplineId: number = nodeMapItem.mostImportantEvent?.srcSubDisciplineId;
      if (subDisciplineId > 0) {
        nodeMapItem.categoryEventIcon = this.services1.iconMapperService.getGlobalIconSync(TablesEx.SubDisciplines, subDisciplineId);
      } else {
        this.traceService.warn(TraceModules.nodeMapSnapIn, 'Event change Callback - Device SubDiscipline not found');
      }
    } else {
      // offline
      nodeMapItem.mostImportantEventText = this.templateStrings.deviceOffline_;
      nodeMapItem.categoryEventIcon = '';
    }
  }
  // US1974222

  private computeMostImportantEvent(nodeMapItem: NodeMapItem): Event {
    if (nodeMapItem.eventCounter === 0) {
      return null;
    }

    let flatEventList: Event[] = [];
    nodeMapItem.eventsMap.forEach(item => {
      const eventsArray = [...item.values()];
      if (eventsArray.length > 1) {
        // subsequent case
        const mostImportantSubsequent = this.getMostImportantSubsequent(eventsArray);
        flatEventList.push(mostImportantSubsequent);
      } else {
        flatEventList = flatEventList.concat([...item.values()]);
      }
    });

    if (flatEventList.length === 0) {
      return null;
    }

    const mostImportantEvent = new Event();
    mostImportantEvent.updateEvent(flatEventList[0]);

    flatEventList.forEach(e => {
      let swap = false;
      const prioOnStatus = this.priorityOnStatus(e.stateId, mostImportantEvent.stateId);
      // console.log("<<<pos>>>", "[" + prioOnStatus + "]",
      //     e.stateId, e.cause, e.categoryDescriptor,
      //     mostImportantEvent.stateId, mostImportantEvent.cause, mostImportantEvent.categoryDescriptor);
      if (prioOnStatus < 0) {
        swap = true;
      } else if (prioOnStatus === 0) {
        if (e.categoryId < mostImportantEvent.categoryId) {
          swap = true;
        } else if (e.categoryId === mostImportantEvent.categoryId) {
          if (e.originalCreationTime?.getTime() > mostImportantEvent.originalCreationTime?.getTime()) {
            swap = true;
          }
        }
      }
      if (swap) {
        mostImportantEvent.updateEvent(e);
      }
    });

    return mostImportantEvent;
  }

  private priorityOnStatus(stateA: EventStates, stateB: EventStates): number {
    let a = Number(stateA);
    let b = Number(stateB);
    if (stateA === EventStates.UnprocessedWithTimer) {
      a = EventStates.Unprocessed;
    } else if (stateA === EventStates.ReadyToBeResetWithTimer) {
      a = EventStates.ReadyToBeReset;
    }
    if (stateB === EventStates.UnprocessedWithTimer) {
      b = EventStates.Unprocessed;
    } else if (stateB === EventStates.ReadyToBeResetWithTimer) {
      b = EventStates.ReadyToBeReset;
    }
    return a < b ? -1 : (a > b ? 1 : 0);
  }

  private getMostImportantSubsequent(events: Event[]): Event {
    const mostImportantSubsequent = new Event();
    mostImportantSubsequent.updateEvent(events[0]);

    events.forEach(e => {
      if (e.stateId < mostImportantSubsequent.stateId) {
        mostImportantSubsequent.stateId = e.stateId;
        mostImportantSubsequent.state = e.state;
        mostImportantSubsequent.eventId = e.eventId;
      }
      if (e.srcStateId < mostImportantSubsequent.srcStateId) {
        mostImportantSubsequent.srcStateId = e.srcStateId;
        mostImportantSubsequent.srcState = e.srcState;
        mostImportantSubsequent.cause = e.cause;
      }
    });

    return mostImportantSubsequent;
  }

  private computeEventCounter(nodeMapItem: NodeMapItem): number {
    let counter = 0;
    [...nodeMapItem.eventsMap.values()].forEach(
      eventArray => counter += eventArray.length
    );
    return counter;
  }

  private updateEventsForNodeMapItem(events: Event[], nodeMapItem: NodeMapItem): void {
    events.forEach(e => {
      if (e.stateId !== EventStates.Closed) {
        const key: string = e.srcPropertyId + e.categoryId; // The key is created as objectId + categoryId to identify subsequent events
        const item = nodeMapItem.eventsMap.get(key);
        if (item) {
          const eventsArray: Event[] = [...item.values()];
          const eventIndex = eventsArray.findIndex(ev => e.eventId === ev.eventId);
          if (eventIndex < 0) {
            eventsArray.push(e);
          } else {
            eventsArray.splice(eventIndex, 1, e);
          }
          nodeMapItem.eventsMap.set(key, eventsArray);
        } else {
          nodeMapItem.eventsMap.set(key, [e]);
        }
      } else {
        const key: string = e.srcPropertyId + e.categoryId;
        const item = nodeMapItem.eventsMap.get(key);

        if (item) {
          const indexItemToRemove = [...item.values()].findIndex(ev => ev.eventId === e.eventId);
          const eventsArray: Event[] = [...item.values()];
          eventsArray.splice(indexItemToRemove, 1);

          if (eventsArray.length === 0) {
            nodeMapItem.eventsMap.delete(key);
          } else {
            nodeMapItem.eventsMap.set(key, eventsArray);
          }
        }
      }
    });
  }

  /**
   * setLocalization()
   *
   * @private
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private setLocalization(): void {
    this.setupDefaultCulture();

    this.subscriptions.push(this.services.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
      if (defaultCulture !== null) {
        this.translateService.setDefaultLang(defaultCulture);
      } else {
        this.translateService.setDefaultLang(this.translateService.getBrowserLang());
      }
    }));

    this.subscriptions.push(this.services.appContextService.userCulture.subscribe((userCulture: string) => {
      if (userCulture !== null) {
        this.translateService.use(userCulture).subscribe((res: any) => { // done on purpose
        });
      } else {
        this.traceService.warn(TraceModules.nodeMapSnapIn, 'User Culture is empty');
      }
    }));

    this.subscriptions.push(
      this.translateService.get([
        'SEARCH_FILTER_WATERMARK',
        'VIEW_ELEMENTS',
        'DELETE_GROUP',
        'REMOVE_FROM_GROUP',
        'RENAME_DESCRIPTION',
        'SAVE',
        'RENAME',
        'CANCEL',
        'ENABLE_SHOW_GROUPS',
        'DISABLE_SHOW_GROUPS',
        'MODE_ALL',
        'MODE_GROUPS',
        'EDIT_MENU',
        'ASSIGN_TO_GROUP',
        'EXISTING_GROUP',
        'NEW_GROUP',
        'DEVICE',
        'SELECT_DEVICES_TO_GROUP',
        'ASSIGN_DEVICES_TO_GROUP',
        'NEXT',
        'ASSIGN_DEVICE_TO_GROUP',
        'ASSIGN',
        'MANAGE_GROUP',
        'REMOVE_GROUPS',
        'ASSIGN_TO_EXISTING_GROUP',
        'CURRENT_GROUP',
        'GROUP',
        'REMOVE',
        'SELECT_DEVICES',
        'ADD',
        'DEVICEOFFLINE',
        'NAVIGATETO',
        'SHOW_IN_PROPERTIES',
        'SUBMIT_TEXT',
        'EVENTS_TEXT',
        'PENDING_TEXT',
        'NOTPENDING_TEXT',
        'DISCIPLINE_TEXT',
        'NAME_TEXT',
        'DESCRIPTION_TEXT',
        'DEVICETYPE_TEXT',
        'NETWORK_TEXT',
        'SYSTEM_TEXT',
        'STATE_TEXT',
        'CONNECTED_TEXT',
        'DISCONNECTED_TEXT',
        'ITEMS_TEXT'
      ]).subscribe(values => this.onTranslateStrings(values))
    );
  }

  /**
   * onTranslateStrings
   *
   * @private
   * @param {Object} strings
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private onTranslateStrings(strings: object): void {
    this.templateStrings = {
      searchFilterWatermark_: strings['SEARCH_FILTER_WATERMARK'],
      viewElements_: strings['VIEW_ELEMENTS'],
      deleteGroup_: strings['DELETE_GROUP'],
      removeFromGroup_: strings['REMOVE_FROM_GROUP'],
      renameDescription_: strings['RENAME_DESCRIPTION'],
      save_: strings['SAVE'],
      rename_: strings['RENAME'],
      cancel_: strings['CANCEL'],
      modeAll_: strings['MODE_ALL'],
      modeGroups_: strings['MODE_GROUPS'],
      editMenu_: strings['EDIT_MENU'],
      assignToGroup_: strings['ASSIGN_TO_GROUP'],
      existingGroup_: strings['EXISTING_GROUP'],
      newGroup_: strings['NEW_GROUP'],
      device_: strings['DEVICE'],
      selectDevicesToGroup_: strings['SELECT_DEVICES_TO_GROUP'],
      assignDevicesToGroup_: strings['ASSIGN_DEVICES_TO_GROUP'],
      next_: strings['NEXT'],
      assignDeviceToGroup_: strings['ASSIGN_DEVICE_TO_GROUP'],
      assign_: strings['ASSIGN'],
      manageGroup_: strings['MANAGE_GROUP'],
      removeGroups_: strings['REMOVE_GROUPS'],
      assignToExistingGroup_: strings['ASSIGN_TO_EXISTING_GROUP'],
      currentGroup_: strings['CURRENT_GROUP'],
      group_: strings['GROUP'],
      remove_: strings['REMOVE'],
      selectDevices_: strings['SELECT_DEVICES'],
      add_: strings['ADD'],
      deviceOffline_: strings['DEVICEOFFLINE'],
      // US2119361
      navigateTo_: strings['NAVIGATETO'],
      // US2169384
      showInProperties_: strings['SHOW_IN_PROPERTIES'],
      submitText: strings['SUBMIT_TEXT'],
      eventsText: strings['EVENTS_TEXT'],
      pendingText: strings['PENDING_TEXT'],
      notpendingText: strings['NOTPENDING_TEXT'],
      discipline: strings['DISCIPLINE_TEXT'],
      name: strings['NAME_TEXT'],
      description: strings['DESCRIPTION_TEXT'],
      network: strings['NETWORK_TEXT'],
      deviceType: strings['DEVICETYPE_TEXT'],
      system: strings['SYSTEM_TEXT'],
      stateText: strings['STATE_TEXT'],
      connectedText: strings['CONNECTED_TEXT'],
      disconnectedText: strings['DISCONNECTED_TEXT'],
      items: strings['ITEMS_TEXT']
    } as TemplateStrings;
  }

  /**
   * addGroupHandler
   *
   * @private
   * @param {boolean} [initialAdd]
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private addGroupHandler(initialAdd?: boolean): void {
    // US2053493
    this.devices.forEach(device => {
      device.isSelected = false;
    });
    this.devices.sort((a, b) => this.compareFn(a, b));
    this.allDeviceGroupsAll.sort((a, b) => this.compareFn(a, b));
    // US2053493
    this.step = 0;
    this.updateHTML = true;
    this.Commands.push({ commandName: 'SG', data: null, booleanValue: initialAdd });
    this.startRefreshLoop();
  }

  // US2053491
  /**
   * removeGroupsHandler
   *
   * @private
   * @memberof NodeMapSnapInComponent
   */
  private removeGroupsHandler(): void {
    this.updateHTML = true;
    this.Commands.push({ commandName: 'RemoveGroups', data: null });
    this.startRefreshLoop();
  }
  // US2053491

  // US2053493
  /**
   * utAddGroupHandler
   *
   * @memberof NodeMapSnapInComponent
   */
  public utAddGroupHandler(): void {
    const wsiNodeMapItem = new UTWsiNodeMapItem();
    for (let count = 0; count < 10; count++) {
      this.devices.push(new NodeMapItem(wsiNodeMapItem));
    }
    this.addGroupHandler();
  }

  /**
   * compareFn
   *
   * @private
   * @param {} a
   * @param {} b
   * @returns {}
   * @memberof NodeMapSnapInComponent
   */
  private compareFn(a: NodeMapItem, b: NodeMapItem): number {
    if (a.label === b.label && !a.isDeviceGroup && !b.isDeviceGroup) {
      const systemA = a.id?.split(':')[0];
      const systemB = b.id?.split(':')[0];
      return (systemB > systemA) ? -1 : 0;
    }
    if (a.label > b.label) {
      return 1;
    }
    return (b.label > a.label) ? -1 : 0;
  }
  // US2053493

  /**
   * compareByTypeFn
   *
   * @private
   * @param {} a
   * @param {} b
   * @returns {}
   * @memberof NodeMapSnapInComponent
   */
  /*
  // code kept RFU... private compareByTypeFn(a: NodeMapItem, b: NodeMapItem): number {
  // code kept RFU...     if (a.isDeviceGroup && !b.isDeviceGroup) {
  // code kept RFU...         return -1;
  // code kept RFU...     }
  // code kept RFU...     if (!a.isDeviceGroup && b.isDeviceGroup) {
  // code kept RFU...         return 1;
  // code kept RFU...     }
  // code kept RFU...     return this.compareFn(a, b);
  // code kept RFU... }
  */

  /**
   * showAllDevicesHandler
   *
   * @private
   * @param {boolean} [all]
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private showDevicesHandler(all?: boolean): void {
    this.updateHTML = true;
    this.Commands.push({ commandName: 'SD', data: null, booleanValue: all });

    this.ShowAllDevices = all;
    this.currentNodeMapState.ShowAllDevices = all;
    this.startRefreshLoop();
  }

  // US2053491
  /**
   * manageGroupHandler
   *
   * @private
   * @param {NodeMapItem} item
   * @memberof NodeMapSnapInComponent
   */
  private manageGroupHandler(item: NodeMapItem): void {
    this.updateHTML = true;
    this.Commands.push({ commandName: 'ManageGroup', data: item });

    this.startRefreshLoop();
  }
  // US2053491

  /**
   * headerData
   *
   * @returns {HeaderData[]}
   * @memberof NodeMapSnapInComponent
   */
  public get headerData(): HeaderData[] {
    // Data item bound to the template
    return this.hdrData;
  }

  /**
   * headerData
   *
   * @param {HeaderData[]} value
   * @memberof NodeMapSnapInComponent
   */
  public set headerData(value: HeaderData[]) {
    // Data item bound to the template
    if (value != null) {
      this.hdrData = value;
    } else {
      this.traceService.warn(TraceModules.nodeMapSnapIn, 'HeaderData value is null or undefined');
    }
  }

  private loadDisciplines(): void {
    this.services.tablesService.getGlobalText(Tables.Disciplines, false)
      .subscribe((textEntries: TextEntry[]) => {
        for (const textEntry of textEntries) {
          this.disciplineFromIdMap.set(textEntry.value, textEntry.text);
        }
      }, error => {
        this.traceService.error('Cannot load Disciplines in loadDisciplines()');
      });
  }

  private loadCategories(): void {
    this.services.tablesService.getGlobalText(Tables.Categories, true)
      .subscribe((textEntries: TextEntry[]) => {
        for (const textEntry of textEntries) {
          this.categoriesFromIdMap.set(textEntry.value, textEntry.text);
        }
      }, error => {
        this.traceService.error('Cannot load Categories in loadCategories()');
      });
  }

  private loadCategoryIcons(): void {
    this.categoriesFromIdMap.forEach((key, value) =>
      this.services.tablesService.getGlobalIcon(Tables.Categories, value)
        .subscribe(icon => this.categoriesIconFromIdMap.set(value, icon)
        ), error => {
          this.traceService.error('Cannot load Categories Icons in loadCategoryIcons()');
        });
  }

  private loadSubDisciplines(): void {
    this.services.tablesService.getGlobalText(Tables.SubDisciplines, false)
      .subscribe((textEntries: TextEntry[]) => {
        for (const textEntry of textEntries) {
          this.subDisciplineFromIdMap.set(textEntry.value, textEntry.text);
        }
      }, error => {
        this.traceService.error('Cannot load SubDisciplines in loadSubDisciplines()');
      });
  }

  private loadObjectTypes(): void {
    this.services.tablesService.getGlobalText(Tables.ObjectTypes, true)
      .subscribe((textEntries: TextEntry[]) => {
        for (const textEntry of textEntries) {
          this.objectTypeFromIdMap.set(textEntry.value, textEntry.text);
          textEntry.subText.forEach(subTextEntry => this.objectTypeFromIdMap.set(subTextEntry.value, subTextEntry.text));
        }
      }, error => {
        this.traceService.error('Cannot load ObjectTypes in loadObjectTypes()');
      });
  }

  private loadObjectSubTypes(): void {
    this.services.tablesService.getGlobalText(Tables.ObjectSubTypes, false)
      .subscribe((textEntries: TextEntry[]) => {
        for (const textEntry of textEntries) {
          this.objectSubTypeFromIdMap.set(textEntry.value, textEntry.text);
        }
      }, error => {
        this.traceService.error('Cannot load ObjectSubTypes in loadObjectSubTypes()');
      });
  }

  /**
   * ngOnChanges
   *
   * @param {SimpleChanges} changes
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public ngOnChanges(changes: SimpleChanges): void {
    this.traceService.debug(TraceModules.nodeMapSnapIn, '*** ngOnChanges ***');
    this.onSelectedObjectChanged();
  }

  /**
   * ngOnInit
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public ngOnInit(): void {
    // US1974222

    this.traceService.debug(TraceModules.nodeMapSnapIn, '***** ngOnInit() ***** %s %s', nodeMapSnapinId.toString(), this.location);
    this.services.nodeMapService.connectionState().subscribe(connectionState => {
      this.traceService.debug(TraceModules.nodeMapSnapIn, '(connectionState().subscribe) %s', connectionState);
      this.onConnectionStateChanged(connectionState);
    });

    const appRightsNodeMap = this.services1.appRightsService.getAppRights(nodeMapSnapinId);
    if (appRightsNodeMap != null) {
      const ConfigRightDocument: Operation[] = appRightsNodeMap.Operations.filter(f => f.Id === configAppRight);
      this.configApplicationRight = (ConfigRightDocument.length > 0) ? true : false;

      this.editApplicationRight = true;
    }

    this.locale = this.translateService.getBrowserLang();
    this.getHldlConfigs();

    this.snapInId = this.fullId.fullId();
    this.snapInVm = this.services.snapinService.registerViewModel(this.snapInId);

    // US1974222
    this.fullSnapinID = new FullSnapInId('system', this.snapInId);

    this.loadDisciplines();
    this.loadSubDisciplines();
    this.loadObjectTypes();
    this.loadObjectSubTypes();
    this.loadCategories();
    this.loadCategoryIcons();

    // get settings from SettingService
    this.services1.settingsService.getSettings('nodemap_settings').subscribe(
      val => this.onGetSettings(val),
      err => this.onGetSettingsError(err)
    );
  }

  public handlePageChange(event: TileScrolledEvent): void {
    if (this.skip === event.skip && this.itemsPerPage === event.take) {
      return;
    }
    if (event.skip < 0) {
      return;
    }
    this.skip = event.skip;
    this.itemsPerPage = event.take;
    // code kept RFU... console.log('handlePageChange', this.skip, this.itemsPerPage);
    if (!isNullOrUndefined(this.currentNodeMapState)) {
      this.currentNodeMapState.TileScrollState = event;
      this.ApplyStateStore();
    }
    this.subscribe();
  }

  private onGetSettings(settings?: any): void {

    try {
      if (!isNullOrUndefined(settings)) {
        this.currentNodeMapState = JSON.parse(settings);
      }
    } catch (error) {
      this.traceService.error(error);
    }

    this.InitNodeMapSni();
  }

  private SubscribeToCnsChanges() {
    this.subscriptions.push(
      this.services.cnsHelperService.activeCnsLabel.subscribe(label => {
        if (this.selectedTileItems.length > 0) {
          this.selectedTileItems.forEach(item => {
            this.applyDeactiveStyle(item);
          });
          this.selectedTileItems = [];
          this.applyDeactiveStyle(undefined);
          this.multipleSelectionActive = false;
        }

        this.cnsLabelObject = label;
        this.setLabels(this.cnsLabelObject, false);
        // code kept RFU... this.items.sort((a, b) => this.compareByTypeFn(a, b));
        this.subscribe();
        this.loadActionsCache();
        this.updateHTML = true;
      }));
  }

  private SubscribeToNodeMapService() {
    this.subscriptions.push(this.services.nodeMapService.items().subscribe((items: WsiNodeMapItem[]) => {
      this.traceService.debug(TraceModules.nodeMapSnapIn, '(items().subscribe) %s', items);
      this.onItemsChanged(items);
    }));

    this.subscriptions.push(this.services.nodeMapService.totalNumberOfItems().subscribe((totalNumberOfItems: number) => {
      this.traceService.debug(TraceModules.nodeMapSnapIn, '(totalNumberOfItems().subscribe) %s', totalNumberOfItems);
      this.onTotalNumberOfItemsChanged(totalNumberOfItems);
    }));
    this.subscriptions.push(this.services.nodeMapService.oms().subscribe((items: WsiOm[]) => {
      this.traceService.debug(TraceModules.nodeMapSnapIn, '(oms().subscribe) %s', items);
      this.onOmsChanged(items);
    }));
  }

  private InitNodeMapState() {
    if (this.currentNodeMapState === null) {
      // read state and store to class variable for reusage
      this.currentNodeMapState = this.storageService.getState(this.fullId);

      if (this.currentNodeMapState === null || this.currentNodeMapState === undefined) {
        this.currentNodeMapState = new NodeMapState();
        this.currentNodeMapState.EventFilterId = null;
        this.currentNodeMapState.DeviceGroupViewId = 'ciccio';
        this.currentNodeMapState.DeviceGroupDisplayName = null;
        this.currentNodeMapState.DeviceGroupName = null;
        this.currentNodeMapState.DeviceGroupItemsCount = null;
        this.currentNodeMapState.ShowAllDevices = true;
        this.currentNodeMapState.SearchFilterCriteria = null;
        this.currentNodeMapState.TileScrollState = null;
      }
    }

    this.displayedDeviceGroupId = this.currentNodeMapState?.DeviceGroupViewId;

    this.displayedDeviceGroupDisplayName = this.currentNodeMapState?.DeviceGroupDisplayName;
    this.displayedDeviceGroupName = this.currentNodeMapState?.DeviceGroupName;
    if (isNullOrUndefined(this.displayedDeviceGroupName) && !isNullOrUndefined(this.displayedDeviceGroupDisplayName)) {
      this.displayedDeviceGroupName = this.displayedDeviceGroupDisplayName.split(' ').join('');
    }
    this.displayedDeviceGroupLabel = this.sorting === Sorting.DisplayName
      ? this.displayedDeviceGroupDisplayName
      : this.displayedDeviceGroupName;

    this.displayedDeviceGroupItemsCount = this.currentNodeMapState?.DeviceGroupItemsCount;
    this.EventFilterId = this.currentNodeMapState?.EventFilterId;
    this.ShowAllDevices = this.currentNodeMapState?.ShowAllDevices;
    this.searchFilterCriteria = this.currentNodeMapState?.SearchFilterCriteria;
    this.skip = this.currentNodeMapState?.TileScrollState?.skip || 0;
    this.itemsPerPage = this.currentNodeMapState?.TileScrollState?.take || 100;
  }

  private onGetSettingsError(err: any): void {
    this.traceService.error('settingsService.getSettings failed.');

    // anyway try to go on getting the info from the storage service
    this.InitNodeMapSni();
  }

  // US2169384
  private ShowInProperties(selectedItem: NodeMapItem): void {
    this.services1.systemBrowserService.searchNodes(0, selectedItem.browserObject.ObjectId, null, 2).subscribe(value => {
      const nodemapObjectArray: BrowserObject[] = [value.Nodes[0]];
      const messageBodyValue: GmsMessageData = new GmsMessageData(nodemapObjectArray, GmsSelectionType.Cns);
      const messageTypes: string[] = nodemapObjectArray.map(item => item.Attributes ? selectedItem.browserObject.Attributes.ManagedTypeName : '');
      const messageToSend: ParamsSendMessage = {
        messageBody: messageBodyValue,
        qParam: undefined,
        preselection: true,
        broadcast: false,
        applyRuleId: undefined
      };

      this.subscriptions.push(this.sendMessage(messageTypes, messageToSend).subscribe((res: boolean) => {
        if (!res) {
          this.traceService.error(TraceModules.nodeMapSnapIn, 'sendMessage() error. result: %s', res);
        }
      }));
    });
  }
  // US2169384

  private InitNodeMapSni() {
    this.storageService = (this.messageBroker.getStorageService(this.fullId) as any) as GmsNodeMapStorageService;

    // if not available also from storage service, use predifined and hardcoded values (way not get them from app.config???)
    this.InitNodeMapState();

    if (!isNullOrUndefined(this.searchFilterCriteria)) {
      this.searchText = JSON.stringify(this.searchFilterCriteria);
    }

    this.SubscribeToNodeMapService();

    // subscribe to messages from AFW
    this.messageSubscription = this.messageBroker.getMessage(this.fullId).subscribe(
      (message => {
        if (message !== null) {
          this.processRequest(message);
        }
      })
    );

    // subscribe to CNS mode changes
    this.SubscribeToCnsChanges();

    // US2119362
    this.subscriptions.push(this.onTileClickSub.subscribe(selectedItem => {
      if (!selectedItem.isDeviceGroup) {
        this.ShowInProperties(selectedItem);
      }
    }));
    // US2119362

    // US2169381
    this.subscriptions.push(this.onTileDoubleClickSub.subscribe(selectedItem => {
      if (selectedItem.isDeviceGroup) {
        this.executeCommandViewElements(selectedItem);
      }
    }));
    // US2169381
  }

  /**
   * setupDefaultCulture
   *
   * @memberof NodeMapSnapInComponent
   */
  private setupDefaultCulture() {
    this.subscriptions.push(this.appContextService.defaultCulture.subscribe({
      next: defaultCulture => {
        if (defaultCulture !== null) {
          this.translateService.setDefaultLang(defaultCulture);
        } else {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'No user culture set on appContextService!');
        }
      },
      error: err => {
        this.translateService.setDefaultLang(this.translateService.getBrowserLang());
      }
    }));
  }

  /**
   * ngOnDestroy
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public ngOnDestroy(): void {
    this.traceService.debug(TraceModules.nodeMapSnapIn, '***** ngOnDestroy() ***** %s', nodeMapSnapinId.toString());

    try {
      this.services.nodeMapService.cancelHttpPendingRequests();

      this.services.nodeMapService.unsubscribe();

      this.subscriptions.forEach((subscription: Subscription) => {
        if (!isNullOrUndefined(subscription)) {
          subscription.unsubscribe();
        }
      });
      this.subscriptions = [];

      this.eventSubscriptions.forEach((eventSubscription: EventSubscription) => {
        this.services1.eventService.destroyEventSubscription(eventSubscription.id)
      });
      this.eventSubscriptions = [];

      this.blinkSubscription.forEach(s => s.unsubscribe());

      if (this.messageSubscription != null) {
        this.messageSubscription.unsubscribe();
        this.messageSubscription = null;
      }

      if (this.intervalRefresh !== undefined) {
        clearInterval(this.intervalRefresh);
        this.intervalRefresh = undefined;
      }

      if (this.snapInVm != null) {
        this.snapInVm.deactivate();
        this.snapInVm = null;
      }

      if (this.saveDataToStorageService) {
        this.ApplyStateStore();
      }

      this.services.snapinService.unregisterViewModel(this.snapInId);

      this.traceService.debug(TraceModules.nodeMapSnapIn, 'Component destroyed.');
    } catch (e) {
      this.traceService.debug(TraceModules.nodeMapSnapIn, 'Error');
    }
  }

  /**
   * openModal
   *
   * @param {TemplateRef<*>} template
   * @param {string} [modalClass]
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public openModal(template: TemplateRef<any>, modalClass?: string): boolean {
    if (this.step !== 4 && this.step !== 5) {
      this.controlsExchanged = false;
    }

    if (this.addGroupDeviceGroup === null) {
      this.form = this.initializeTaskForm();
    }

    if (template != null) {
      this.modalRef = this.services1.modalService.show(template,
        {
          class: 'modal-dialog-scrollable', ignoreBackdropClick: true, ariaLabelledBy: 'customModalLabel'
        }
      );
      return true;
    }
    return false;
  }

  /**
   * createActionItems
   *
   * @private
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private createActionItems(): void {
    if (this.currentNodeMapState.DeviceGroupViewId !== '' && this.currentNodeMapState.DeviceGroupViewId !== 'ciccio') {
      this.modePrimaryItems = [];
      return;
    }
    if (this.editApplicationRight && this.configApplicationRight) {
      // Defect2244040
      // if all groups have been removed and still in "Group" mode, force the switch to "All" mode
      if (this.allDeviceGroupsAll.length === 0 && !this.ShowAllDevices) {
        this.showDevicesHandler(true);
      }
      // Defect2244040

      this.modePrimaryItems = [
        {
          title: this.ShowAllDevices ? this.templateStrings.modeAll_ : this.templateStrings.modeGroups_, disabled: false, icon: 'element-show',
          items: [
            { title: this.templateStrings.modeAll_, action: () => this.showDevicesHandler(true), disabled: this.ShowAllDevices },
            {
              title: this.templateStrings.modeGroups_, action: () => this.showDevicesHandler(false),
              disabled: !this.ShowAllDevices || this.allDeviceGroupsAll.length === 0 // Defect2244040
            }
          ]
        },
        {
          title: this.templateStrings.editMenu_, disabled: false, icon: 'element-edit',
          items: [
            {
              title: this.templateStrings.assignToGroup_, action: () => {
                // US2053493
                this.addGroupHandler(true);
                // US2053493
              }, disabled: false
            },

            /*
            code kept RFU... { title: this.templateStrings.renameGroup_, action: () => alert('Rename group clicked'), disabled: false },
            */
            {
              title: this.templateStrings.removeGroups_, action: () => {
                // US2053491
                this.removeGroupsHandler();
                // US2053491
              }, disabled: this.allDeviceGroupsAll.length === 0 // Defect2244033
            }
          ]
        }
      ];
    } else {
      this.modePrimaryItems = [
        {
          title: this.ShowAllDevices ? this.templateStrings.modeAll_ : this.templateStrings.modeGroups_, disabled: false, icon: 'element-show',
          items: [
            { title: this.templateStrings.modeAll_, action: () => this.showDevicesHandler(true), disabled: this.ShowAllDevices },
            {
              title: this.templateStrings.modeGroups_, action: () => this.showDevicesHandler(false),
              disabled: !this.ShowAllDevices || this.allDeviceGroupsAll.length === 0
            }
          ]
        },
        {
          title: this.templateStrings.editMenu_, disabled: false, icon: 'element-edit',
          items: [
            {
              title: this.templateStrings.assignToGroup_, action: () => {
                // US2053493
                this.addGroupHandler(true);
                // US2053493
              }, disabled: true
            },

            /*
            code kept RFU... { title: this.templateStrings.renameGroup_, action: () => alert('Rename group clicked'), disabled: true },
            */
            {
              title: this.templateStrings.removeGroups_, action: () => {
                // US2053491
                this.removeGroupsHandler();
                // US2053491
              }, disabled: true
            }
          ]
        }
      ];
    }
  }

  /**
   * onAfterDettach
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public onAfterDettach(): void {
    this.traceService.debug(TraceModules.nodeMapSnapIn, '***** onAfterDettach() ***** %s %s', this.fullId.snapInId, this.location);
  }

  /**
   * onBeforeAttach
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public onBeforeAttach(): void {
    this.traceService.debug(TraceModules.nodeMapSnapIn, '***** onBeforeAttach() ***** %s %s', this.fullId.snapInId, this.location);
    this.tilesView.onBeforeAttach();
  }

  /**
   * refresh
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public refresh(): void {
    this.snapInVm.clear();
  }

  /**
   * onBackButtonClicked
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public onBackButtonClicked(): void {
    this.displayedDeviceGroupId = '';
    this.displayedDeviceGroupDisplayName = null;
    this.displayedDeviceGroupName = null;
    this.displayedDeviceGroupLabel = null;
    this.displayedDeviceGroupItemsCount = null;

    this.currentNodeMapState.DeviceGroupViewId = '';
    this.currentNodeMapState.DeviceGroupDisplayName = null;
    this.currentNodeMapState.DeviceGroupName = null;
    this.currentNodeMapState.DeviceGroupItemsCount = null;

    this.ApplyStateStore();
    this.subscribe();
  }

  /**
   * onDeleteDeviceGroupButtonClicked
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public onDeleteDeviceGroupButtonClicked(): void {
    this.items.forEach(item => {
      if (item.isDeviceGroup && item.isSelected) {
        this.services.nodeMapService.deleteDeviceGroup(item.id);
      }
    });
  }

  /**
   * onEditDeviceGroupDisplayNameButtonRenameClicked
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public onEditDeviceGroupDisplayNameButtonRenameClicked(): void {
    this.modalRef.hide();
    this.items.forEach(item => {
      if (item.isDeviceGroup && item.isSelected) {
        this.services.nodeMapService.editDeviceGroupDisplayName(item.id, this.deviceGroupDisplayName);
      }
    });
  }
  /**
   * onEditDeviceGroupDisplayNameButtonCancelClicked
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public onEditDeviceGroupDisplayNameButtonCancelClicked(): void {
    this.modalRef.hide();
  }

  /**
   * onEditCustomGroupDisplayNameButtonCancelClicked
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public onEditCustomGroupDisplayNameButtonCancelClicked(): void {
    this.modalRef.hide();
  }

  /**
   * onPageChanged
   *
   * @param {number} newPage
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public onPageChanged(newPage: number): void {
    this.currentPage = newPage;
    this.subscribe();
  }

  /**
   * onSearchRequested
   *
   * @param {*} event
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  // public onSearchRequested(event: any): void {
  //     this.searchText = event.updates[0].value;
  //     if (this.searchText !== null) {
  //         this.traceService.debug(TraceModules.nodeMapSnapIn, '***** searchChange() ***** %s', this.searchText);
  //         this.ApplyStateStore();
  //         this.subscribe();
  //     }
  // }
  public onSearchFilterChanged(filterCriteria: SearchCriteria): void {
    this.searchFilterCriteria = filterCriteria;
    this.currentNodeMapState.SearchFilterCriteria = filterCriteria;
    this.traceService.debug(TraceModules.nodeMapSnapIn, '***** searchChange() : filterCriteria = ${JSON.stringify(filterCriteria)} ');

    this.searchText = JSON.stringify(filterCriteria);
    if (this.searchText !== null) {
      this.traceService.debug(TraceModules.nodeMapSnapIn, '***** searchChange() ***** %s', this.searchText);
      this.ApplyStateStore();
      this.subscribe();
    }
  }

  private onPutSettings(isSuccess: boolean) {
    this.traceService.debug(TraceModules.nodeMapSnapIn,
      '***** putSettings() succeded to store on Setting Service: NodeMapSettings =  ${JSON.stringify(this.searchText)}');
  }

  private onPutSettingsError(error: any) {

    this.traceService.error('***** putSettings() failed to store on Setting Service: NodeMapSettings = ${JSON.stringify(this.searchText)}');
  }

  // US2053493
  /**
   * onSearchRequestedCreateGroup
   *
   * @param {*} event
   * @memberof NodeMapSnapInComponent
   */
  public onSearchRequestedCreateGroup(event: any): void {
    this.searchTextCreateNewGroup = event;
  }
  // US2053493

  /**
   * ApplyStateStore
   *
   * @private
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private ApplyStateStore(): void {
    this.storageService.setState(this.fullId, this.currentNodeMapState);

    // reset skip to zero before storing the currentNodeMapState
    if (isNullOrUndefined(this.currentNodeMapState.TileScrollState)) {
      this.currentNodeMapState.TileScrollState = { skip: 0, take: 100 };
    }
    const currentSkipValue: number = this.currentNodeMapState.TileScrollState.skip;
    this.currentNodeMapState.TileScrollState.skip = 0;

    this.services1.settingsService.putSettings('nodemap_settings', JSON.parse(JSON.stringify(this.currentNodeMapState))).subscribe(
      val => this.onPutSettings(val),
      err => this.onPutSettingsError(err)
    );

    this.currentNodeMapState.TileScrollState.skip = currentSkipValue;
  }

  /**
   * subscribe
   *
   * @private
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private subscribe(): void {
    this.items.forEach(item => { item.isSelected = false; });

    // this.services.nodeMapService.subscribe(this.itemsPerPage * (this.currentPage - 1), this.itemsPerPage, this.sorting,
    // code kept RFU... console.log('<<<searchText>>>', this.sorting, this.searchText);

    // NOT NEEDED: causes random issues with subscriptions!!!
    // if (this.subscription !== undefined) {
    //     this.services.nodeMapService.unsubscribe();
    //     this.subscription = undefined;
    // }
    this.subscription = this.services.nodeMapService.subscribe(this.skip, this.itemsPerPage, this.sorting,
      this.ascendingOrder, this.searchText, this.displayedDeviceGroupId);
  }

  /**
   * subscription
   *
   * @private
   * @type {}
   * @memberof NodeMapSnapInComponent
   */
  private subscription: Observable<boolean>;

  private previousItemsList = '';

  /**
   * onItemsChanged
   *
   * @private
   * @param {WsiNodeMapItem[]} items
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private onItemsChanged(items: WsiNodeMapItem[]): void {
    // items.forEach(it => {
    //     if (it.IsDeviceGroup) {
    //         it.DisconnectedChildren = 0;
    //         it.IsOffline = false;
    //     } else {
    //         it.IsOffline = false;
    //     }
    // });

    // filter repeated same items lists
    const itemsList = JSON.stringify(items);
    if (this.previousItemsList === itemsList) {
      return;
    }
    this.previousItemsList = itemsList;

    this.traceService.debug(TraceModules.nodeMapSnapIn, 'onItemsChanged detected');
    // convert WsiNodeMapItem to NodeMapItem
    this.items = items.map(x => (new NodeMapItem(x))).filter(x => x.isSystemOffline === false);
    this.deviceGroups = this.items.filter(x => x.isDeviceGroup === true).filter(x => x.isSystemOffline === false);

    this.items.forEach(item => {
      if (this.sorting === Sorting.Name) {
        item.parentGroupLabel = item.parentGroupName;
      } else {
        item.parentGroupLabel = item.parentGroupDisplayName;
      }
    });

    this.tilesViewData =
    {
      data: this.items,
      total: this.totalNumberOfItems
    };
    // code kept RFU... console.log('onItemsChanged', items.length, this.tilesViewData.total /* ,
    // code kept RFU...     items[0].Name, items[1].Name, items[2].Name, items[3].Name, items[4].Name, items[5].Name */);

    // US2053493
    this.subscriptions.push(this.services.nodeMapService.GetDeviceGroups().subscribe((result: any) => {
      const values = result.map(x => (new NodeMapItem(x)));
      this.allDeviceGroupsAll = [];
      values.forEach(x => this.allDeviceGroupsAll.push(x));
      this.allDeviceGroupsAll.sort((a, b) => this.compareFn(a, b));
      this.setLabels(this.cnsLabelObject, true);
      this.createActionItems(); // Defect2244033
    }));
    // US2053493

    this.multipleSelectionActive = false;
    this.selectedTileItems = [];

    for (const item of this.items) {
      item.actions = [];

      if (item.isDeviceGroup) {
        item.ownedChildren = this.items.filter(it => it.owner === undefined && it.parentGroupName === item.name).length;
      } else {
        this.setAttributes(item);
      }
    }

    this.subscribeToEventService();

    // set labels
    this.setLabels(this.cnsLabelObject, true);

    // code kept RFU... this.items.sort((a, b) => this.compareByTypeFn(a, b));
    this.loadActionsCache();
  }

  private subscribeToEventService() {
    this.eventSubscriptions.forEach((eventSubscription: EventSubscription) => {
      this.services1.eventService.destroyEventSubscription(eventSubscription.id);
    });
    this.eventSubscriptions = [];

    // Subscribe to event service, with a delay of 2secs to ensure at the login time that all the events are fetched from WSI
    for (const item of this.items) {
      const eventFilter = new EventFilter(false);
      eventFilter.srcDesignations = item.designations;
      const eventSubscription = this.services1.eventService.createEventSubscription(eventFilter, true);
      this.eventSubscriptions.push(eventSubscription);
      if (!isNullOrUndefined(eventSubscription.events)) {
        this.subscriptions.push(eventSubscription.events.subscribe((events: any[]) => this.onEventsChange(events, item)));
      }
    }
  }

  public onClickEvents(nodemapItem: NodeMapItem, showPopover: boolean) {
    nodemapItem.showPopover = showPopover;
  }

  // US2119361
  /**
   * changeViewAndSendSelection
   *
   * @private
   * @param {*} selectedItem
   * @memberof NodeMapItem
   * @param {*} subItem
   * @memberof VerticalBarItem
   */
  public changeViewAndSendSelection(selectedItem: NodeMapItem, subItem: VerticalBarItem): void {
    if (selectedItem !== null && selectedItem !== undefined && subItem !== undefined) {

      // change view
      this.messageBroker.changeView(subItem.targetFrame, subItem.targetView).subscribe((resView: boolean) => {
        if (!resView) {
          this.traceService.error(TraceModules.nodeMapSnapIn, 'changeView() error. result: %s', resView);
        }

        // select the primary object
        this.navigateTo(selectedItem);
      });
    }
  }

  /**
   * searchTreview
   *
   * @private
   * @param {*} selectedItem
   * @memberof NodeMapItem
   * @param {*} snapinConfig
   * @memberof ISnapInConfig
   */
  public searchTreview(selectedItem: NodeMapItem, snapinConfig: ISnapInConfig): void {
    const verticalBarConfigs: VerticalBarConfig[] = snapinConfig.getVerticalBarConfig();
    if (!isNullOrUndefined(verticalBarConfigs)) {
      verticalBarConfigs.forEach((item: VerticalBarConfig) => {
        item.verticalBarItems.forEach((subItem: VerticalBarItem) => {
          if (!isNullOrUndefined(subItem.targetFrame)) {
            if (subItem.targetView === 'tree-view') {
              // send selection and change view
              this.changeViewAndSendSelection(selectedItem, subItem);
              return;
            }
          }
        });
      });
    }
  }

  // US2169384
  /**
   * pushShowInProperties
   *
   * @private
   * @param {*} nodeMapItem
   * @memberof NodeMapItem
   */
  private pushShowInProperties(nodeMapItem: NodeMapItem): void {
    if (this.selectedTileItems.length > 0) {
      nodeMapItem.actions.push({
        title: this.templateStrings.showInProperties_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'ShowToProperties To clicked');
          this.ShowInProperties(nodeMapItem);
        }, disabled: true
      });
    } else {
      nodeMapItem.actions.push({
        title: this.templateStrings.showInProperties_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'ShowToProperties To clicked');
          this.ShowInProperties(nodeMapItem);
        }, disabled: false
      });
    }
  }
  // US2169384

  // US2119361
  /**
   * pushNavigateTo
   *
   * @private
   * @param {*} nodeMapItem
   * @memberof NodeMapItem
   */
  private pushNavigateTo(nodeMapItem: NodeMapItem): void {
    if (this.selectedTileItems.length > 0) {
      nodeMapItem.actions.push({
        title: this.templateStrings.navigateTo_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Navigate To clicked');
          this.searchTreview(nodeMapItem, this.services.snapinConfig);
        }, disabled: true
      });
    } else {
      nodeMapItem.actions.push({
        title: this.templateStrings.navigateTo_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Navigate To clicked');
          this.searchTreview(nodeMapItem, this.services.snapinConfig);
        }, disabled: false
      });
    }
  }
  // US2119361

  /**
   * navigateTo
   *
   * @private
   * @param {} nodeMapItem
   * @memberof NodeMapSnapInComponent
   */
  private navigateTo(nodeMapItem: NodeMapItem): void {
    this.services1.systemBrowserService.getViews().subscribe((viewNodes: ViewNode[]) => {
      viewNodes.forEach(viewNode => {
        const designation = nodeMapItem.designations[0].split('*').join('');
        this.services1.systemBrowserService.searchNodes(viewNode.SystemId, designation, viewNode.ViewId, SearchOption.designation).
          subscribe((page: Page) => {
            if (page.Nodes.length > 0) {
              page.Nodes.sort(CnsHelperService.compareBrowserObjects);
              const msgBody = new GmsMessageData([page.Nodes[0]]);
              const types = [page.Nodes[0].Attributes.ManagedTypeName];

              const fullQParamId = new FullQParamId('system-manager', 'SystemQParamService', 'primary');
              const qParam = { name: fullQParamId.fullId(), value: page.Nodes[0].Designation };
              const message: MessageParameters = {
                messageBody: msgBody,
                qParam,
                types
              };
              this.switchToNextFrame('system-manager', message).subscribe((frameChanged: boolean) => {
                this.traceService.debug(TraceModules.nodeMapSnapIn, 'navigateTo() completed. result: %s', frameChanged);
              });
            }
          });
      });
    });
  }

  // US2053489
  /**
   * assignDeviceToGroup
   *
   * @private
   * @param {*} item
   * @memberof NodeMapSnapInComponent
   */
  private assignDeviceToGroup(item): void {
    if (this.editApplicationRight && item.parentGroupName === '' && this.configApplicationRight) {
      item.actions.push({
        title: this.templateStrings.assignToGroup_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Assign to group clicked');
          this.executeAssignDeviceToGroupCommand(item);
        }
      });
    } else {
      item.actions.push({
        title: this.templateStrings.assignToGroup_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Assign to group clicked');
          this.executeAssignDeviceToGroupCommand(item);
        }, disabled: true
      });
    }
  }

  /**
   * utAssignDeviceToGroup
   *
   * @param {boolean} editApplicationRight
   * @memberof NodeMapSnapInComponent
   */
  public utAssignDeviceToGroup(editApplicationRight: boolean) {
    /*
    code kept RFU...  this.editApplicationRight = editApplicationRight;
    */
    this.editApplicationRight = true;
    const item = new NodeMapItem(new UTWsiNodeMapItem());
    item.actions = [];
    this.assignDeviceToGroup(item);
    this.executeAssignDeviceToGroupCommand(item);
  }
  // US2053489

  private pushRemoveGroupActions(item: NodeMapItem) {
    /*
    code kept RFU...if (this.displayedDeviceGroupId === undefined || this.displayedDeviceGroupId === null) {
    code kept RFU...     return;
    code kept RFU... }
    */
    if (!(this.editApplicationRight && this.configApplicationRight)) {
      // 2148602
      if (item.isDeviceGroup) {
        return;
      }
      item.actions.push({
        title: this.templateStrings.removeFromGroup_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Remove item clicked');
          this.executeRemoveItemCommand(item);
        }, disabled: true
      });
      return;
    }

    // 2148602
    if (item.isDeviceGroup) {
      return;
    }
    // 2148602
    if (item.parentGroupName === '' || this.selectedTileItems.length > 0) {
      item.actions.push({
        title: this.templateStrings.removeFromGroup_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Remove item clicked');
          this.executeRemoveItemCommand(item);
        }, disabled: true
      });
    } else {
      item.actions.push({
        title: this.templateStrings.removeFromGroup_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Remove item clicked');
          this.executeRemoveItemCommand(item);
        }, disabled: false
      });
    }
  }

  private setAttributes(item: NodeMapItem) {
    item.browserObject.Attributes.DisciplineDescriptor = this.disciplineFromIdMap.get(item.browserObject.Attributes.DisciplineId);
    item.browserObject.Attributes.SubDisciplineDescriptor = this.subDisciplineFromIdMap.get(item.browserObject.Attributes.SubDisciplineId);

    item.browserObject.Attributes.SubTypeDescriptor = item.browserObject.Attributes.SubTypeId !== 0 ?
      this.objectSubTypeFromIdMap.get(item.browserObject.Attributes.SubTypeId) : null;
    item.browserObject.Attributes.TypeDescriptor = (!item.browserObject.Attributes.SubTypeDescriptor) ?
      this.objectTypeFromIdMap.get(item.browserObject.Attributes.TypeId) : item.browserObject.Attributes.SubTypeDescriptor;

    item.disciplineIcon = this.services1.iconMapperService.getGlobalIconSync(TablesEx.Disciplines, item.browserObject.Attributes.DisciplineId);
    item.mostImportantAlarmCategoryIcon = this.categoriesIconFromIdMap.get(item.mostImportantAlarmCategoryId);
  }

  private pushGroupCRUDActions(item: NodeMapItem) {
    if (this.editApplicationRight && this.configApplicationRight) {
      item.actions.push({
        title: this.templateStrings.deleteGroup_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Delete group clicked');
          this.executeDeleteGroupCommand(item);
        }
      });

      item.actions.push({
        title: this.templateStrings.rename_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Edit group display name clicked');
          this.executeCommandEditGroup(item);
        }
      });

      // US2053491
      item.actions.push({
        title: this.templateStrings.manageGroup_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Manage group clicked');
          this.manageGroupHandler(item);
        }
      });
      // US2053491

      // 2148610
      /*
      code kept RFU... item.actions.push({
      code kept RFU... title: this.templateStrings.addElements_, action: () => {
      code kept RFU... this.traceService.debug(TraceModules.nodeMapSnapIn, 'Add elements clicked');
      code kept RFU... this.addElementToGroupHandler(item, true);
      code kept RFU... }
      code kept RFU... });
      */
      // 2148610
    } else {
      item.actions.push({
        title: this.templateStrings.deleteGroup_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Delete group clicked');
          this.executeDeleteGroupCommand(item);
        }, disabled: true
      });
      item.actions.push({
        title: this.templateStrings.rename_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Edit group display name clicked');
          this.executeCommandEditGroup(item);
        }, disabled: true
      });
      // US2053491
      item.actions.push({
        title: this.templateStrings.manageGroup_, action: () => {
          this.traceService.debug(TraceModules.nodeMapSnapIn, 'Manage group clicked');
          this.manageGroupHandler(item);
        }, disabled: true
      });
      // US2053491

      // 2148610
      /*
      code kept RFU... item.actions.push({
      code kept RFU... title: this.templateStrings.addElements_, action: () => {
      code kept RFU... this.traceService.debug(TraceModules.nodeMapSnapIn, 'Add elements clicked');
      code kept RFU... this.addElementToGroupHandler(item, true);
      code kept RFU... }, disabled: true
      code kept RFU... });
      */
      // 2148610
    }

    item.actions.push({
      title: this.templateStrings.viewElements_, action: () => {
        this.traceService.debug(TraceModules.nodeMapSnapIn, 'View elements clicked');
        this.executeViewElementsCommand(item);
      }
    });
  }

  /**
   * onTotalNumberOfItemsChanged
   *
   * @private
   * @param {number} totalNumberOfItems
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private onTotalNumberOfItemsChanged(totalNumberOfItems: number): void {
    this.totalNumberOfItems = totalNumberOfItems;
  }

  /**
   * onOmsChanged
   *
   * @private
   * @param {WsiOm[]} oms
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private onOmsChanged(oms: WsiOm[]): void {
    this.oms = oms.map(x => (new Om(x)));
  }

  /**
   * getHldlConfigs
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private getHldlConfigs(): void {
    this.hldlFullConfig = this.services.snapinConfig.getSnapInHldlConfig(this.fullId, this.location);
  }

  /**
   * setLabels
   *
   * @private
   * @param {CnsLabel} cnsLabel
   * @param {boolean} changeLabels
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private setLabels(cnsLabel: CnsLabel, changeLabels: boolean): void {
    if (isNullOrUndefined(cnsLabel)) {
      this.items.forEach(item => {
        item.label = item.browserObject.Name;
      });
    } else if (cnsLabel.cnsLabel === CnsLabelEn.Description ||
      cnsLabel.cnsLabel === CnsLabelEn.DescriptionAndAlias ||
      cnsLabel.cnsLabel === CnsLabelEn.DescriptionAndName) {
      this.setLabelsDisplayName(changeLabels);
    } else {
      this.setLabelsName(changeLabels);
    }
  }

  /**
   * setLabelsDisplayName
   *
   * @private
   * @param {} changeLabels
   * @memberof NodeMapSnapInComponent
   */
  private setLabelsDisplayName(changeLabels: boolean): void {
    if (this.items.length > 0) {
      if (changeLabels) {
        this.items.forEach(item => {
          item.label = item.browserObject.Descriptor;
        });
      }
      // US2053489
      this.allDeviceGroupsAll.forEach(group => {
        group.label = group.browserObject.Descriptor;
      });
    }
    this.displayedDeviceGroupLabel = this.displayedDeviceGroupDisplayName;
    // US2053489
    this.sorting = Sorting.DisplayName;
  }

  /**
   * setLabelsName
   *
   * @private
   * @param {boolean} changeLabels
   * @memberof NodeMapSnapInComponent
   */
  private setLabelsName(changeLabels: boolean): void {
    if (this.items.length > 0) {
      if (changeLabels) {
        this.items.forEach(item => {
          item.label = item.browserObject.Name;
        });
      }
      // US2053489
      this.allDeviceGroupsAll.forEach(group => {
        group.label = group.browserObject.Name;
      });
    }
    this.displayedDeviceGroupLabel = this.displayedDeviceGroupName;
    // US2053489
    this.sorting = Sorting.Name;
  }

  // US2053491
  /**
   * setLabelsToItems
   *
   * @private
   * @param {CnsLabel} cnsLabel
   * @param {NodeMapItem[]} items
   * @memberof NodeMapSnapInComponent
   */
  private setLabelsToItems(cnsLabel: CnsLabel, items: NodeMapItem[]): void {
    if (cnsLabel.cnsLabel === CnsLabelEn.Description ||
      cnsLabel.cnsLabel === CnsLabelEn.DescriptionAndAlias ||
      cnsLabel.cnsLabel === CnsLabelEn.DescriptionAndName) {
      items.forEach(item => {
        item.label = item.browserObject.Descriptor;
      });
    } else {
      items.forEach(item => {
        item.label = item.browserObject.Name;
      });
    }
  }
  // US2053491

  /**
   * processRequest
   *
   * @private
   * @param {GmsMessageData} message
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private processRequest(message: GmsMessageData): void {
    // In case of invalid message condition, just return
    /* eslint-disable-next-line */
    if (message === null || message.data === null || message.data.length < 1) {
      this.traceService.error(TraceModules.nodeMapSnapIn, 'processRequest - invalid message: ', message);
      return;
    }

    this.traceService.debug(TraceModules.nodeMapSnapIn, 'processRequest', message);

    // save selected object data
    this.selectedObjectName = message.data[0].Name;
    this.selectedObjectDescription = message.data[0].Descriptor;
    this.selectedObjectOM = message.data[0].Attributes.ObjectModelName;
    this.selectedObjectSystemId = message.data[0].SystemId;
    this.selectedObjectLocation = message.data[0].Location;
    this.selectedObjectDesignation = message.data[0].Designation;

    // connect selected object
    this.connectSelectedObject();

    // HTML must be updated
    this.updateHTML = true;

    this.executeCommands();
  }

  /**
   * onSelectedObjectChanged
   *
   * @private
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private onSelectedObjectChanged(): void {
    this.traceService.debug(TraceModules.nodeMapSnapIn, '*** onSelectedObjectChanged ***');
    this.traceService.debug(TraceModules.nodeMapSnapIn, 'onSelectedObjectChanged: ', this.selectedObject);
  }

  /**
   * connectSelectedObject
   *
   * @private
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private connectSelectedObject(): void {
    this.logHelper('£££(1) %s %s %s', this.waitingForData, this.selectedObjectMustBeConnected);
    if (!this.selectedObjectMustBeConnected) {
      this.selectedObjectMustBeConnected = true;
      this.waitingForData = true;
    }

    this.logHelper('£££(2)');
    this.startRefreshLoop();

    this.logHelper('£££(3)', this.Entries);
    if (this.Entries === undefined || this.Entries.length === 0 ||
      this.waitingForData) {
      return;
    }
    this.selectedObjectMustBeConnected = false;

    this.logHelper('£££(4)');
  }

  /**
   * onConnectionStateChanged
   *
   * @private
   * @param {ConnectionState} connectionState
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private onConnectionStateChanged(connectionState: ConnectionState): void {
    this.traceService.debug(TraceModules.nodeMapSnapIn, '<<<<< onConnectionStateChanged >>>>>');
    if (connectionState === ConnectionState.Disconnected) {
      this.gotDisconnected = true;
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      this.gotDisconnected = false;
      this.subscribe();
    }
  }

  // US2053489
  /**
   * executeAssignDeviceToGroupCommand
   *
   * @private
   * @param {NodeMapItem} item
   * @memberof NodeMapSnapInComponent
   */
  private executeAssignDeviceToGroupCommand(item: NodeMapItem): void {
    this.updateHTML = true;
    this.Commands.push({ commandName: 'AssignDeviceToGroup', data: item });

    this.startRefreshLoop();
  }
  // US2053489

  /**
   * executeRemoveItemCommand
   *
   * @private
   * @param {NodeMapItem} item
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private executeRemoveItemCommand(item: NodeMapItem): void {
    this.updateHTML = true;
    this.Commands.push({ commandName: 'RemoveItem', data: item });

    this.startRefreshLoop();
  }

  /**
   * executeDeleteGroupCommand
   *
   * @private
   * @param {NodeMapItem} item
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private executeDeleteGroupCommand(item: NodeMapItem): void {
    this.updateHTML = true;
    this.Commands.push({ commandName: 'DeleteGroup', data: item });

    this.startRefreshLoop();
  }

  /**
   * executeViewElementsCommand
   *
   * @private
   * @param {NodeMapItem} item
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private executeViewElementsCommand(item: NodeMapItem): void {
    this.updateHTML = true;
    this.Commands.push({ commandName: 'ViewElements', data: item });

    this.startRefreshLoop();
  }

  /**
   * executeCommands
   *
   * @private
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private executeCommands(): void {
    let startRefreshLoop = false;

    this.Commands.forEach(value => {

      if (value.data == null) {
        this.ExecuteCommandDataNull(value, startRefreshLoop);
      } else if (value.data.isDeviceGroup) {
        startRefreshLoop = this.ExecuteCommandForGroups(value, startRefreshLoop);
      } else {
        startRefreshLoop = this.ExecuteCommandForDevices(value, startRefreshLoop);
      }
    });

    // start the refresh loop, if needed
    if (this.Commands.length > 0 && startRefreshLoop) {
      this.startRefreshLoop();
    }

    // reset the commands list
    this.Commands = [];
  }

  private ExecuteCommandDataNull(value: Command, startRefreshLoop: boolean) {
    if (value.commandName === 'SG') { // add group (also from inside modal of add element)
      this.executeCommandSG(value.booleanValue);
    }
    // US2053493
    if (value.commandName === 'SG2') {
      this.executeCommandSG2(value.booleanValue);
    }
    // US2053493
    if (value.commandName === 'SD') { // show devices
      this.onShowDevices(value.booleanValue);
    }
    // US2053491
    if (value.commandName === 'RemoveGroups') { // remove groups
      this.executeCommandRemoveGroups();
    }
    // US2053491
  }

  private ExecuteCommandForGroups(value: Command, startRefreshLoop: boolean) {
    switch (value.commandName) {
      case 'ViewElements': // view elements
        this.executeCommandViewElements(value.data);
        startRefreshLoop = true;
        break;

      case 'DeleteGroup': // delete group
        this.executeCommandDeleteGroup(value.data);
        startRefreshLoop = true;
        break;

      // US2053491
      case 'ManageGroup': // manage group
        this.executeCommandManageGroup(value.data);
        startRefreshLoop = true;
        break;
      // US2053491

      default:
        break;
    }
    return startRefreshLoop;
  }

  private ExecuteCommandForDevices(value: Command, startRefreshLoop: boolean) {
    switch (value.commandName) {
      // US2053489
      case 'AssignDeviceToGroup': // assign device to group
        this.executeCommandSG3(value.data);
        startRefreshLoop = true;
        break;
      // US2053489

      case 'RemoveItem': // remove item from group
        this.executeCommandRemoveItem(value.data);
        startRefreshLoop = true;
        break;

      case 'Connect': // x-net connect (orchestrator not working)
        this.executeCommandConnect(value.data);
        startRefreshLoop = true;
        break;

      case 'Disconnect': // x-net disconnect (orchestrator not working)
        this.executeCommandDisconnect(value.data);
        startRefreshLoop = true;
        break;

      case 'RequestOwnership': // request ownership (orchestrator not working)
        this.executeCommandRequestOwnership(value.data);
        startRefreshLoop = true;
        break;

      default:
        break;
    }
    return startRefreshLoop;
  }

  /**
   * startRefreshLoop
   *
   * @private
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private startRefreshLoop(): void {
    this.counter = 0;
    if (this.intervalRefresh === undefined) {
      this.intervalRefresh = setInterval(() => {
        if (this.updateHTML) {
          this.traceService.debug(TraceModules.nodeMapSnapIn, '---(this.counter)(1)');
          this.executeCommands();
          this.traceService.debug(TraceModules.nodeMapSnapIn, '---(this.counter)(2)');
        }

        if (++this.counter > 3) {
          clearInterval(this.intervalRefresh);
          this.intervalRefresh = undefined;
        }
      }, 333);
    }
  }

  /**
   * executeCommandRemoveItem
   *
   * @param {NodeMapItem} data
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public executeCommandRemoveItem(data: NodeMapItem): boolean {
    if (isNullOrUndefined(data)) {
      return false;
    }

    this.traceService.debug(TraceModules.nodeMapSnapIn, '<<<<< Command RI executed >>>>> %s ', data.browserObject);

    let deviceGroupId = '';
    const deviceGroupItems: string[] = [];

    this.allDeviceGroupsAll.forEach(dg => {
      if (data.parentGroupName === dg.name) {
        deviceGroupId = dg.id;
        deviceGroupItems.push(data.id);
      }
    });

    this.services.nodeMapService.modifyDeviceGroupItems(true, deviceGroupId, deviceGroupItems);

    return true;
  }

  /**
   * executeCommandConnect
   *
   * @param {NodeMapItem} data
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public executeCommandConnect(data: NodeMapItem): boolean {
    if (data != null) {
      this.traceService.debug(TraceModules.nodeMapSnapIn, '<<<<< Command CO executed >>>>> %s ', data.browserObject);
      const targets: string[] = [];
      targets.push(data.id);
      this.services.nodeMapService.XnetConnect(targets);
      return true;
    }
    return false;
  }

  /**
   * executeCommandDisconnect
   *
   * @param {NodeMapItem} data
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public executeCommandDisconnect(data: NodeMapItem): boolean {
    if (data != null) {
      this.traceService.debug(TraceModules.nodeMapSnapIn, '<<<<< Command DI executed >>>>> %s ', data.browserObject);
      const targets: string[] = [];
      targets.push(data.id);
      this.services.nodeMapService.XnetDisconnect(targets);
      return true;
    }
    return false;
  }

  /**
   * executeCommandRequestOwnership
   *
   * @param {NodeMapItem} data
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public executeCommandRequestOwnership(data: NodeMapItem): boolean {
    if (data != null) {
      this.traceService.debug(TraceModules.nodeMapSnapIn, '<<<<< Command RO executed >>>>> %s ', data.browserObject);
      const targets: string[] = [];
      targets.push(data.id);
      this.services.nodeMapService.RequestOwnership(targets);
      return true;
    }
    return false;
  }

  /*
   * executeCommandDeleteGroup
   *
   * @param {NodeMapItem} data
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public executeCommandDeleteGroup(data: NodeMapItem): boolean {
    if (data != null) {
      this.traceService.debug(TraceModules.nodeMapSnapIn, '<<<<< Command DG executed >>>>> %s ', data.browserObject);
      const deviceGroupItems: string[] = [];
      this.items.forEach(item => {
        if (item.isDeviceGroup && (item.id === data.id)) {
          this.services.nodeMapService.deleteDeviceGroup(item.id);
        }
      });
      return true;
    }
    return false;
  }

  /**
   * executeCommandEditGroup
   *
   * @param {NodeMapItem} data
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public executeCommandEditGroup(data: NodeMapItem): boolean {
    if (data != null) {
      this.traceService.debug(TraceModules.nodeMapSnapIn, '<<<<< Command EG executed >>>>> %s ', data.browserObject);
      const deviceGroupItems: string[] = [];
      this.deviceGroupDisplayName = data.displayName;

      this.items.forEach(item => {
        if (item.name === data.name) {
          item.isSelected = true;
        }
      });
      this.openModal(this.deviceGrouptemplate);
      return true;
    }
    return false;
  }
  /**
   * onShowDevices
   *
   * @private
   * @param {boolean} [all]
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private onShowDevices(all?: boolean): void {
    this.traceService.debug(TraceModules.nodeMapSnapIn, '<<<<< Command ShowDevices executed >>>>>');
    this.currentNodeMapState.DeviceGroupViewId = all ? 'ciccio' : '';
    this.displayedDeviceGroupId = this.currentNodeMapState.DeviceGroupViewId;
    this.ShowAllDevices = this.currentNodeMapState.ShowAllDevices;
    this.ApplyStateStore();
    this.subscribe();
  }

  /**
   * executeCommandSG
   *
   * @private
   * @param {boolean} [initialAdd]
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private executeCommandSG(initialAdd?: boolean): void {
    if (this.selectedTileItems.length > 0) {
      this.selectedTileItems.forEach(item => {
        this.applyDeactiveStyle(item);
      });
      this.selectedTileItems = [];
      this.applyDeactiveStyle(undefined);
      this.multipleSelectionActive = false;
    }

    // US2053493
    this.devices = this.items.filter(x => !x.isDeviceGroup && x.parentGroupName === '');
    this.devices.sort((a, b) => this.compareFn(a, b));  // US2053489
    this.allDeviceGroups = this.allDeviceGroupsAll;     // US2053489
    if (this.step === 0) {
      this.devices.forEach(
        dev => {
          dev.isSelected = false;
          dev.isVisible = false;
        }
      );
    }
    this.step = 1;
    this.containerHeightVH = 59;
    this.tableHeightVH = 60;
    this.openModal(this.createGrouptemplate);
    // US2053493
  }

  // US2053493
  /**
   * executeCommandSG2
   *
   * @private
   * @param {boolean} [initialAdd]
   * @memberof NodeMapSnapInComponent
   */
  private executeCommandSG2(initialAdd?: boolean): void {
    if (this.step !== 0) {
      if (this.step === 1) {
        this.createNewGroupName = '';
        this.selectedGroupId = '';
        this.containerHeightVH = 48.5;  // 46;
        this.tableHeightVH = 49.5;      // 47;
        this.step = 2;
      } else {
        this.containerHeightVH = 59;
        this.tableHeightVH = 60;
        this.step = 5;
      }
      this.openModal(this.createGrouptemplate);
    }
  }
  // US2053493

  // US2053489
  /**
   * executeCommandSG3
   *
   * @private
   * @param {NodeMapItem} item
   * @memberof NodeMapSnapInComponent
   */
  private executeCommandSG3(item: NodeMapItem): void {
    this.multipleSelectionActive = this.selectedTileItems.length > 1;
    if (!this.multipleSelectionActive) {
      this.createNewGroupName = '';
      this.selectedGroupId = '';
      this.step = 3;
      this.containerHeightVH = 35;
      this.tableHeightVH = 36;
      item.isSelected = true;
      this.devices = [item];
      this.allDeviceGroups = this.allDeviceGroupsAll.filter(x => x.displayName !== item.parentGroupName);
      this.allDeviceGroups.sort((a, b) => this.compareFn(a, b));
      this.openModal(this.createGrouptemplate);
    } else {
      this.devices = [];
      this.selectedTileItems.forEach(it => {
        if (!it.isDeviceGroup) {
          it.isSelected = true;
          it.isVisible = true;
          this.devices.push(it);
        }
      });
      this.devices.sort((a, b) => this.compareFn(a, b));
      this.allDeviceGroups = this.allDeviceGroupsAll;
      this.allDeviceGroups.sort((a, b) => this.compareFn(a, b));

      this.createNewGroupName = '';
      this.selectedGroupId = '';
      this.containerHeightVH = 46;
      this.tableHeightVH = 47;
      this.step = 2;
      this.openModal(this.createGrouptemplate);
    }
  }
  // US2053489

  // US2053491
  /**
   * executeCommandManageGroup
   *
   * @private
   * @param {NodeMapItem} item
   * @memberof NodeMapSnapInComponent
   */
  private executeCommandManageGroup(item: NodeMapItem): void {
    this.createNewGroupName = item.label;
    this.currentGroupId = item.id;
    this.selectedGroupId = '';
    this.step = 4;
    this.controlsExchanged = false;
    this.containerHeightVH = 48.5;  // 46;
    this.tableHeightVH = 49.5;      // 47;
    this.services.nodeMapService.GetDeviceGroupItems(item.id).subscribe(groupItems => {
      this.currentGroupItems = [];
      groupItems.forEach(groupItem => {
        const it = new NodeMapItem(groupItem);
        this.setAttributes(it);
        it.isSelected = true;
        it.isVisible = true;
        this.currentGroupItems.push(it);
      });
      this.setLabelsToItems(this.cnsLabelObject, this.currentGroupItems);
      this.currentGroupItems.sort((a, b) => this.compareFn(a, b));
      this.allDeviceGroups = this.allDeviceGroupsAll.filter(x => x.label !== item.label);
      this.allDeviceGroups.sort((a, b) => this.compareFn(a, b));

      this.devices = this.items.filter(x => !x.isDeviceGroup && x.parentGroupName === '');
      this.devices.forEach(device => {
        device.isSelected = false;
        device.isVisible = false;
      });
      this.devices.sort((a, b) => this.compareFn(a, b));  // US2053489

      this.openModal(this.createGrouptemplate);
    });
  }
  // US2053491

  // US2053491
  /**
   * executeCommandRemoveGroups
   *
   * @private
   * @memberof NodeMapSnapInComponent
   */
  private executeCommandRemoveGroups(): void {
    this.allDeviceGroupsAll.sort((a, b) => this.compareFn(a, b));

    this.createNewGroupName = '';
    this.selectedGroupId = '';
    this.step = 6;
    this.containerHeightVH = 46;
    this.tableHeightVH = 47;
    this.searchTextCreateNewGroup = '';
    this.devices = this.allDeviceGroupsAll;
    this.devices.forEach(dev => { dev.isSelected = false; });
    this.openModal(this.createGrouptemplate);
  }
  // US2053491

  // US2053493
  /**
   * changeSelectedValue
   *
   * @param {NodeMapItem} value
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public changeSelectedValue(value: NodeMapItem): boolean {
    if (value != null) {
      if (this.step !== 4) {
        this.devices[this.devices.indexOf(value)].isSelected = !value.isSelected;
      } else {
        this.currentGroupItems[this.currentGroupItems.indexOf(value)].isSelected = !value.isSelected;
      }
      if (this.step === 1 || this.step === 5) {
        this.devices[this.devices.indexOf(value)].isVisible = value.isSelected;
      }
      return true;
    }
    return false;
  }

  /**
   * changeSelectedValueAll
   *
   * @memberof NodeMapSnapInComponent
   */
  public changeSelectedValueAll(): void {
    const checkBox: HTMLInputElement = document.getElementById('selectAllDevices') as HTMLInputElement;
    if (checkBox !== null) {
      this.devices.forEach(device => {
        if (device.displayName.toLowerCase().includes(this.searchTextCreateNewGroup.toLowerCase())) {
          device.isSelected = checkBox.checked;
          device.isVisible = device.isSelected;
        }
      });
    }
  }
  // US2053493

  /**
   * addchangeSelectedValue
   *
   * @param {NodeMapItem} value
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public addchangeSelectedValue(value: NodeMapItem): boolean {
    if (value != null) {
      if (this.adddeviceGroups.length > 0) {
        this.adddeviceGroups[this.adddeviceGroups.indexOf(value)].isSelected = !value.isSelected;
      }
      return true;
    }
    return false;
  }

  /**
   * cancel
   *
   * @param {number} [modalId]
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public cancel(modalId?: number): void {
    if (this.form !== undefined) {
      this.form.reset();
    }
    this.itemsForGroup = [];
    if (this.modalRef !== undefined) {
      this.modalRef.hide();   // US2053493
      this.services1.modalService.hide(modalId);
    }
    this.step = 0; // US2053493
    this.searchTextCreateNewGroup = '';   // US2053493
  }

  /**
   * initializeTaskForm
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private initializeTaskForm(): FormGroup {
    return new FormGroup(
      {
        description: new FormControl<string>('', [Validators.required])
      }
    );
  }

  /**
   * canSave
   *
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public canSave(): boolean {
    // US2053493
    if (document.getElementById('existingGroupInput') === null) {
      return false;
    }

    let ok = this.canSaveControls();

    if (this.step !== 4) {
      if (this.devices.filter(dev => dev.isSelected).length === 0) {
        ok = false;
      }
    } else if (this.currentGroupItems.filter(cgi => cgi.isSelected).length + this.devices.filter(dev => dev.isSelected).length === 0) {
      ok = false;
    }

    return ok;
    // US2053493
  }

  // Defect2238648
  /**
   * canRenameGroup
   *
   * @returns {}
   * @memberof NodeMapSnapInComponent
   */
  public canRenameGroup(): boolean {
    let ok = true;
    if (this.deviceGroupDisplayName === '') {
      ok = false;
    }
    this.allDeviceGroupsAll.forEach(group => {
      if (group.displayName === this.deviceGroupDisplayName) {
        ok = false;
      }
    });
    this.renameGroupClass = ok ? 'form-control' : 'form-control is-invalid';
    return ok;
  }
  // Defect2238648

  // US2053491
  /**
   * canSaveControls
   *
   * @private
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  private canSaveControls(): boolean {
    let ok = true;
    if (document.getElementById('existingGroupInput').getAttribute('disabled') === null) {
      if (this.allDeviceGroups.length === 0) {
        ok = false;
      }
    }
    if (document.getElementById('newGroupInput').getAttribute('disabled') === null) {
      if (this.createNewGroupName === '') {
        ok = false;
      }
      this.allDeviceGroupsAll.forEach(group => {
        if (group.displayName === this.createNewGroupName && this.step !== 4) {
          ok = false;
        }
      });
    }
    return ok;
  }
  // US2053491

  // US2053491
  /**
   * canRemoveGroups
   *
   * @returns {boolean}
   * @memberof NodeMapSnapInComponent
   */
  public canRemoveGroups(): boolean {
    return this.devices.filter(dev => dev.isSelected).length !== 0;
  }
  // US2053491

  /**
   * save
   *
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  public save(): void {
    // US2053493
    this.itemsForGroup = [];
    const itemsToRemoveFromGroup: string[] = [];
    if (this.step === 4) {
      this.currentGroupItems.forEach(item => {
        if (item.isSelected) {
          this.itemsForGroup.push(item.id);
        } else {
          itemsToRemoveFromGroup.push(item.id);
        }
      });
    }
    this.devices.forEach(item => {
      if (item.isSelected) { this.itemsForGroup.push(item.id); }
    });

    this.manageNewGroupRadio(itemsToRemoveFromGroup);
    this.manageExistingGroupRadio();

    if (!isNullOrUndefined(this.modalRef)) {
      this.modalRef.hide();
    }
    this.subscribe();
    // US2053493
  }

  // US2053491
  /**
   * manageNewGroupRadio
   *
   * @private
   * @param {string[]} itemsToRemoveFromGroup
   * @memberof NodeMapSnapInComponent
   */
  private manageNewGroupRadio(itemsToRemoveFromGroup: string[]): void {
    const newGroupRadio = document.getElementById('newGroupRadio') as HTMLInputElement;
    if (!isNullOrUndefined(newGroupRadio) && newGroupRadio.checked) {
      if (this.step !== 4) {
        this.services.nodeMapService.createDeviceGroup(this.createNewGroupName, this.itemsForGroup);
        setTimeout(() => {
          // dummy timeout to simulate e.g. REST delay
          this.showDevicesHandler(this.ShowAllDevices);
        }, 500);
      } else {
        if (this.itemsForGroup.length > 0) {
          this.services.nodeMapService.modifyDeviceGroupItems(false, this.currentGroupId, this.itemsForGroup);
        }
        if (itemsToRemoveFromGroup.length > 0) {
          setTimeout(() => {
            // dummy timeout to simulate e.g. REST delay
            this.services.nodeMapService.modifyDeviceGroupItems(true, this.currentGroupId, itemsToRemoveFromGroup);
          }, 250);
        }
      }
      this.traceService.info(TraceModules.nodeMapSnapIn, '+++++ createCustomGroup', this.createNewGroupName, this.itemsForGroup);
    }
  }

  /**
   * manageExistingGroupRadio
   *
   * @private
   * @memberof NodeMapSnapInComponent
   */
  private manageExistingGroupRadio(): void {
    const existingGroupRadio = document.getElementById('existingGroupRadio') as HTMLInputElement;
    if (!isNullOrUndefined(existingGroupRadio) && existingGroupRadio.checked) {
      if (this.selectedGroupId === '') {
        this.selectedGroupId = this.allDeviceGroups[0].id;
      }
      if (this.selectedGroupId !== '') {
        if (this.step !== 4) {
          this.services.nodeMapService.modifyDeviceGroupItems(false, this.selectedGroupId, this.itemsForGroup);
          this.traceService.info(TraceModules.nodeMapSnapIn, '+++++ modifyCustomGroupItems', this.selectedGroupId, this.itemsForGroup);
        } else {
          this.services.nodeMapService.modifyDeviceGroupItems(true, this.currentGroupId, this.itemsForGroup);
          setTimeout(() => {
            // dummy timeout to simulate e.g. REST delay
            this.services.nodeMapService.modifyDeviceGroupItems(false, this.selectedGroupId, this.itemsForGroup);
          }, 250);
        }
      }
    }
  }
  // US2053491

  // US2053491
  /**
   * removeGroups
   *
   * @memberof NodeMapSnapInComponent
   */
  public removeGroups(): void {
    this.devices.forEach(item => {
      if (item.isSelected) {
        this.services.nodeMapService.deleteDeviceGroup(item.id);
      }
    });

    if (!isNullOrUndefined(this.modalRef)) {
      this.modalRef.hide();
    }
    this.subscribe();
  }
  // US2053491

  // US2053493
  /**
   * onSelectedGroupChanged
   *
   * @param {*} $event
   * @memberof NodeMapSnapInComponent
   */
  public onSelectedGroupChanged($event): void {
    if (!isNullOrUndefined($event)) {
      this.selectedGroupId = this.allDeviceGroups[$event].id;
    }
  }

  /**
   * onCreateNewGroupKeyup
   *
   * @param {*} $event
   * @memberof NodeMapSnapInComponent
   */
  public onCreateNewGroupKeyup($event): void {
    if (!isNullOrUndefined($event)) {
      this.createNewGroupName = $event.target.value;
    }
  }
  // US2053493

  /**
   * executeCommandVE
   *
   * @private
   * @param {NodeMapItem} data
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private executeCommandViewElements(data: NodeMapItem): void {
    this.traceService.debug(TraceModules.nodeMapSnapIn, '<<<<< Command ViewElements executed >>>>> %s ', data.browserObject);

    if (data.isDeviceGroup) {
      this.displayedDeviceGroupId = data.id;
      this.displayedDeviceGroupDisplayName = data.displayName;
      this.displayedDeviceGroupName = data.name;
      this.displayedDeviceGroupLabel = this.sorting === Sorting.DisplayName ? data.displayName : data.name;
      this.displayedDeviceGroupItemsCount = data.countChildren;

      this.currentNodeMapState.DeviceGroupViewId = data.id;
      this.currentNodeMapState.DeviceGroupDisplayName = data.displayName;
      this.currentNodeMapState.DeviceGroupName = data.name;
      this.currentNodeMapState.DeviceGroupItemsCount = data.countChildren;

      this.ApplyStateStore();
      this.subscribe();
      return;
    }

    const navigationTargets: BrowserObject[] = [];
    navigationTargets.push(data.browserObject);
    const types: string[] = navigationTargets.map((browserObject: BrowserObject) => browserObject.Attributes.ManagedTypeName);
    const messageBody: GmsMessageData = new GmsMessageData(navigationTargets, GmsSelectionType.Cns);

    const qParamValue: QParam = { name: this.fullId.fullId(), value: navigationTargets[0].Designation };

    const messageToSend: ParamsSendMessage = {
      messageBody,
      preselection: true,
      qParam: qParamValue,
      broadcast: false,
      applyRuleId: 'new-primary-selection'
    };

    this.sendMessage(types, messageToSend).subscribe((res: boolean) => {
      this.traceService.debug(TraceModules.nodeMapSnapIn, 'sendMessage() completed. result: %s', res);
    });
  }

  /**
   * logHelper
   *
   * @private
   * @param {*} [message]
   * @param {...any[]} optionalParams
   * @returns {void}
   * @memberof NodeMapSnapInComponent
   */
  private logHelper(message?: any, ...optionalParams: any[]): void {
    if (log) {
      this.traceService.debug(TraceModules.nodeMapSnapIn, message, optionalParams);
    }
  }

  /**
   * calculateCommonActionsNoSelected
   *
   * @private
   * @param {NodeMapItem[]} items
   * @memberof NodeMapSnapInComponent
   */
  private calculateCommonActionsNoSelected(items: NodeMapItem[]): void {
    if (items.length > 0 && !isNullOrUndefined(items[0])) {
      items[0].actions.forEach(action => {
        action.disabled = false;
        if (action.title === this.templateStrings.removeFromGroup_ &&
          items[0].parentGroupName === '' ||
          action.title === this.templateStrings.assignToGroup_ &&
          items[0].parentGroupName !== '') {
          action.disabled = true;
        }
      });
    }
  }

  /**
   * calculateCommonActionsSelected
   *
   * @private
   * @param {NodeMapItem[]} items
   * @memberof NodeMapSnapInComponent
   */
  private calculateCommonActionsSelected(items: NodeMapItem[]): void {
    this.commonActions = [];
    const itemActionMap: Map<string, string[]> = new Map<string, string[]>();
    let titleArr: string[] = [];
    items.forEach(item => {
      item.actions.forEach(action => {
        if (!titleArr.includes(action.title)) {
          titleArr.push(action.title);
        }
      });
      itemActionMap.set(item.id + item.label, titleArr);
      titleArr = [];
    });

    this.getCommonActions(itemActionMap);

    // disable any action which is NOT common in the selected tile items
    this.selectedTileItems.forEach(item => {
      item.actions.forEach(action => {
        if (!this.commonActions.includes(action.title)) {
          action.disabled = true;
        } else {
          action.disabled = false;
          if (action.title === this.templateStrings.removeFromGroup_ || action.title === this.templateStrings.navigateTo_) {
            action.disabled = true;
          }
        }
      });
    });
  }

  /**
   * calculateCommonActions
   *
   * @private
   * @param {NodeMapItem[]} items
   * @param {boolean} isSelectedTileClicked
   * @memberof NodeMapSnapInComponent
   */
  private calculateCommonActions(items: NodeMapItem[], isSelectedTileClicked: boolean): void {
    if (!isSelectedTileClicked) {
      this.calculateCommonActionsNoSelected(items);
    } else {
      this.calculateCommonActionsSelected(items);
    }
  }

  /**
   * getCommonActions
   *
   * @private
   * @param {Map<string, string[]>} itemActionMap
   * @memberof NodeMapSnapInComponent
   */
  private getCommonActions(itemActionMap: Map<string, string[]>): void {
    let values: string[] = []; // create a merged array consisting of titles of the actions

    for (const value of itemActionMap.values()) {
      values = values.concat(value);
    }

    const count = {}; // store the count of occurrences of each element (e.g. {"Assign to group":2, "Remove":1})
    for (const val of values) {
      if (count[val]) {
        count[val] += 1;
      } else {
        count[val] = 1;
      }
    }

    // if the occurrence number of an action is same as map size, than that action exists in each tile item
    for (const val of values) {
      if (count[val] === itemActionMap.size) {
        if (!this.commonActions.includes(val)) {
          this.commonActions.push(val);
        }
      }
    }
  }
}
