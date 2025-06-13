import { SafeStyle } from '@angular/platform-browser';
import { BrowserObject, Event } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';

export interface CustomServiceModalResult {
  description: string;
  name: string;
  id: string;
  designation: string;
  location: string;
  label: string;
}

export interface WsiNodeMapSubscription {
  ErrorCode: number;
  RequestId: string;
  RequestFor: string;
}

export interface WsiNodeMapItem {
  SystemId: number;
  Id: string;
  Type: number;
  SubType: number;
  Discipline: number;
  SubDiscipline: number;
  NetworkType: number;
  IsDeviceGroup: boolean;
  ParentGroupName:  string;
  ParentGroupDisplayName:  string;
  Designations: string[];
  Name: string;
  Location: string;
  DisplayName: string;
  Alias: string;
  IsOffline: boolean;
  IsSystemOffline: boolean;
  DisconnectedChildren: number;
  Owner: string;
  MostImportantAlarmCategoryId: number;
  IsMostImportantAlarmUnprocessed: boolean;
  MostImportantAlarmCategoryBackgroundColor: string;
  MostImportantAlarmCategoryTextColor: string;
  MostImportantAlarmCustomerText: string;
  SymbolPngFileRelativePath: string;
  CountChildren: number;
}

export interface WsiOm {
  OModel: string;
  Path: string;
}

export interface WsiNodeMapDataChangedEvent {
  Items: WsiNodeMapItem[];
  TotalNumberOfItems: number;
  Oms: WsiOm[];
}

export class Om {
  public OModel: string;
  public Path: string;
  constructor(wsiOm: WsiOm) {
    this.OModel = wsiOm.OModel;
    this.Path = wsiOm.Path;
  }
}

export class NodeMapItem {
  public isSelected: boolean;
  public isVisible: boolean;    // US2053491
  public browserObject: BrowserObject;
  public id: string;
  public networkType: number;
  public networkTypeDescriptor: string;
  public isDeviceGroup: boolean;
  public disconnectedChildren: number;
  public ownedChildren: number;
  public parentGroupLabel: string;
  public parentGroupName: string;
  public parentGroupDisplayName: string;
  public name: string;
  public displayName: string;
  public label: string;
  public isOffline: boolean;
  public isSystemOffline: boolean;
  public owner: string;
  public mostImportantAlarmCategoryId: number;
  public isMostImportantAlarmUnprocessed: boolean;
  public mostImportantAlarmCategoryBackgroundColor: string;
  public mostImportantAlarmCategoryTextColor: string;
  public mostImportantAlarmCustomerText: string;
  public symbolPngFileRelativePath: string;
  public countChildren: number;
  public symbolSource: string;
  public sourceStyleText: SafeStyle;
  public actions: any[];
  public UIActions: any[];
  public disciplineIcon: string;
  // US1974222
  public mostImportantEventText: string;
  public categoryEventIcon: string;
  public eventCounter: number;
  public eventIds: number[];
  public mostImportantEvent: Event;
  public eventsMap: Map<string, Event[]>;
  public showPopover: boolean;
  public designations: string[];
  public categoryIconColor: string;
  public mostImportantAlarmCategoryIcon: string;

  // US2119362
  public cardBackgroundColor: string;
  public cardCursor: string;
  // US2119362

  public popoverIcon: string;

  constructor(wsiNodeMapItem: WsiNodeMapItem) {
    this.id = wsiNodeMapItem.Id;
    this.networkType = wsiNodeMapItem.NetworkType;
    this.networkTypeDescriptor = '';
    this.isDeviceGroup = wsiNodeMapItem.IsDeviceGroup;
    this.disconnectedChildren = 0;
    this.ownedChildren = 0;
    this.parentGroupName = wsiNodeMapItem.ParentGroupName;
    this.parentGroupDisplayName = wsiNodeMapItem.ParentGroupDisplayName;
    this.name = wsiNodeMapItem.Name;
    this.displayName = wsiNodeMapItem.DisplayName;
    this.isOffline = wsiNodeMapItem.IsOffline;
    this.isSystemOffline = wsiNodeMapItem.IsSystemOffline;
    this.disconnectedChildren = wsiNodeMapItem.DisconnectedChildren;
    this.owner = wsiNodeMapItem.Owner;
    this.mostImportantAlarmCategoryId = wsiNodeMapItem.MostImportantAlarmCategoryId;
    this.isMostImportantAlarmUnprocessed = wsiNodeMapItem.IsMostImportantAlarmUnprocessed;
    this.mostImportantAlarmCategoryBackgroundColor = wsiNodeMapItem.MostImportantAlarmCategoryBackgroundColor;
    this.mostImportantAlarmCategoryTextColor = wsiNodeMapItem.MostImportantAlarmCategoryTextColor;
    this.mostImportantAlarmCustomerText = wsiNodeMapItem.MostImportantAlarmCustomerText;
    this.symbolPngFileRelativePath = wsiNodeMapItem.SymbolPngFileRelativePath;
    this.countChildren = wsiNodeMapItem.CountChildren;
    this.label = null;
    this.actions = null;
    this.UIActions = [{}];
    this.disciplineIcon = 'element-plant';

    // US2119362
    this.cardBackgroundColor = 'card-background';
    this.cardCursor = 'default';
    // US2119362

    // US1974222
    this.categoryEventIcon = null;
    this.mostImportantEventText = null;
    this.eventCounter = 0;
    this.eventIds = [];
    this.mostImportantEvent = null;
    this.eventsMap = new Map<string, Event[]>();
    this.showPopover = false;
    this.categoryIconColor = 'green';
    this.designations = [];
    this.popoverIcon = 'element-alarm-filled';

     // set designations
     if (!(isNullOrUndefined(wsiNodeMapItem) || isNullOrUndefined(wsiNodeMapItem.Designations) || wsiNodeMapItem.Designations.length <= 0)) {
      wsiNodeMapItem.Designations.forEach(childDesignation => {
          const designation: string = childDesignation + '**';
          this.designations.push(designation);
      });
  }

    this.mostImportantAlarmCategoryIcon = 'element-plant';

    const hasChild: boolean = wsiNodeMapItem.CountChildren > 0;

    let objectDesignations = '';
    const additionalInfo: string[] = [];

    this.designations.forEach(desig => {
      objectDesignations = objectDesignations + '/' + desig;
      additionalInfo.push(desig);
    });

    this.browserObject = {
      Attributes: {
          Alias: wsiNodeMapItem.Alias,
          DefaultProperty: null,
          DisciplineDescriptor: null,
          DisciplineId: wsiNodeMapItem.Discipline,
          FunctionName: null,
          ManagedType: null,
          ManagedTypeName: null,
          ObjectId: wsiNodeMapItem.Id,
          SubDisciplineDescriptor: null,
          SubDisciplineId: wsiNodeMapItem.SubDiscipline,
          SubTypeDescriptor: null,
          SubTypeId: wsiNodeMapItem.SubType,
          TypeDescriptor: null,
          TypeId: wsiNodeMapItem.Type,
          ObjectModelName: null
      },
      Name: wsiNodeMapItem.Name,
      Descriptor: wsiNodeMapItem.DisplayName,
      HasChild: hasChild,
      ObjectId: wsiNodeMapItem.Id,
      SystemId: wsiNodeMapItem.SystemId,
      ViewId: null,
      ViewType: null,
      Designation: objectDesignations,
      AdditionalInfo: additionalInfo,
      Location: wsiNodeMapItem.Location
    };
  }
}
