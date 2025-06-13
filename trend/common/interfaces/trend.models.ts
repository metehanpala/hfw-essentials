import { BrowserObject, ObjectAttributes, SubChartRepresentation } from '@gms-flex/services';
import { MissingData, RemoveOlderDataFromLiveChart } from '@simpl/trendviewer-ng';

export enum TrendChartConstants {
  NO_OF_SAMPLES_FOR_NEW_TREND = 100, // default samples are 100. so samples to be sent to WSI are n/2 = 50
  SERIES__LAST_SEQ_NUM = '.general.Last_Seq_Num',
  TSD_TYPE_OFFLINE = 'Offline',
  OFFLINE_TREND_INITIAL_VISIBLE_WIDTH = 3600000, // In ms
  ONLINE_TREND_INITIAL_VISIBLE_WIDTH = 300000, // In ms
  SUB_ID_SEPERATOR = '**',
  TSD_TYPE_ONLINE = 'Online',
  SYMBOL_SIZE_OFFSET = 4,
  // Constants for setting WSI property axis attachment
  SERIES_AXIS_ATTACHMENT_LEFT = 'ToLeft',
  SERIES_AXIS_ATTACHMENT_RIGHT = 'ToRight',

  // Constants for getting chartconfiguration
  AXISY_TYPE_RIGHT = 'right',
  AXISY_TYPE_LEFT = 'left',
  SUBCHARTID = 'Subchart'
}

// These are also the keys from en-us files
// used as OM pop up title
export enum LocationCallSource {
  SELECT_DATA_POINT_TITLE = 'SELECT_DATA_POINT_TITLE',
  LOCATION_SELECT = 'SELECT_LOCATION',
  SAVE_AS_TITLE = 'SAVE_AS_TITLE',
  UNSAVE_SNAPIN_NAME_TITLE = 'UNSAVE_SNAPIN_NAME_TITLE'
}

export class TVDSettings {
  public numberOfSamplesPerTrendSeries: number;
  public timeRange: any;
  public removeOnlineTrendLogOfDeletedTrendSeries?: boolean;
}

export class SeriesCNSInfo {
  public seriesName: string;
  public seriesDisplayName: string;
  public seriesAlias: string;
  public seriesLocation: string;
  public seriesDesignation: string;
  public type: number;
  public subType: number;
}

export class TQVEngineered {
  public Value: number;
  public Quality: string;
  public QualityGood: boolean;
  public Timestamp: Date;

  constructor(timeStamp: string, value: string, quality: string, qualityGood: boolean) {
    this.Value = Number.parseFloat(value);
    this.Timestamp = new Date(timeStamp);
    this.Quality = quality;
    this.QualityGood = qualityGood;
  }
}

export enum SliderMovement {
  Left,
  Right,
  None
}

export enum TrendQualityGroup {
  HighSeverity,
  Timeshift,
  MediumSeverity,
  AlwaysShowCategory,
  NoShowCategory
}

export enum TrendDataQuality {
  DriverFailed,
  ErrorInLog,
  LogDisabled,
  LogEnabled,
  BufferPurged,
  Overflow,
  TimeChange,
  LogInterrupted,
  InOutOfService,
  InFailure,
  InAlarm,
  InOverridden,
  NormalizedWithQualityItem,
  TrendDisabled,
  // following
  NoIcon,
  Unknown,
  OutOfAlarm,
  OutOfOverridden,
  OutOfOutOfService,
  OutOfFailure,
  TrendEnabled,
  HashCom,
  Reduced,
  StartLogging,
  BufferFull,
  ManualCorrectionAdd,
  ManualCorrectionModify
}

export class TrendQualityInfo {
  public qualityArray: TrendDataQuality[];
  public qualityValue: eQuality;
}

export enum eQuality {
  Value_Ok = 0,
  Value_InAlarm = 0x00000001,
  Value_Fault = 2,
  Value_Overriden = 4,
  Value_OutOfService = 0x00000008,
  Value_NormalizedWithQualityItem = 16,
  Value_Reduced = 32,
  Value_StartLogging = 64,
  Value = 127,
  PriorityValueBase = 256,
  PriorityValueMask = 7936,
  NoValue_LogDisabled = 1048576,
  NoValue_LogEnabled = 2097152,
  NoValue_BufferPurged = 4194304,
  NoValue_Overflow = 8388608,
  NoValue_TimeShifted = 16777216,
  NoValue_Driver_Failed = 33554432,
  NoValue_ErrorInLog = 67108864,
  NoValue_LogInterrupted = 134217728,
  Value_Added = 0x00000051,
  Value_Edited = 0x00000052,
  NoValue = 267386880

  // actual values are like this '9440107803283292417' uint64 -> string & | lshdf
}

export class Line {
  public color: string;
  public chartLineType: boolean;
  public lineId: string;
  public smoothing = true;
  public yAxis: string;
}

export enum EUsage {

  // Controls the visibility of properties in the operation pane (DL2).
  // eslint-disable-next-line
  General = 1 << 0,
  // Controls the visibility of properties in the extended operation pane (DL3).
  // eslint-disable-next-line
  Detail = 1 << 1,
  // Controls the visibility of properties in the command-bubble in graphics (i.e., DL1).
  // eslint-disable-next-line
  PropertyViewer = 1 << 2,
  // Controls the visibility of properties in the BACnet configurator (i.e., DL0).
  // eslint-disable-next-line
  Config = 1 << 3

}

export enum PropertyDataType {
  ExtendedBitString = 'ExtendedBitString',
  ExtendedBool = 'ExtendedBool',
  ExtendedDateTime = 'ExtendedDateTime',
  ExtendedEnum = 'ExtendedEnum',
  ExtendedInt = 'ExtendedInt',
  ExtendedInt64 = 'ExtendedInt64',
  ExtendedReal = 'ExtendedReal',
  ExtendedUint = 'ExtendedUint',
  ExtendedUint64 = 'ExtendedUint64',
  BasicBit32 = 'BasicBit32',
  BasicBool = 'BasicBool',
  BasicFloat = 'BasicFloat',
  BasicInt = 'BasicInt',
  BasicInt64 = 'BasicInt64',
  BasicTime = 'BasicTime',
  BasicUint = 'BasicUint',
  BasicUint64 = 'BasicUint64',
  ExtendedDuration = 'ExtendedDuration'
}

export enum TrendActiveView {
  view = 'view',
  edit = 'edit'
}

export enum TrendType {
  TrendLogOnline = 'TLO',
  TrendLogOffline = 'TL'
}

export enum ManagedType {
  TrendLog = 'TrendLog',
  TrendLogOnline = 'TrendLogOnline'
}

export interface RetainTrendSeriesId {
  identifier: string;
  UniqueId: string;
  collectorId?: string;
}

export class TileObject implements BrowserObject {
  public Attributes: ObjectAttributes;
  public Descriptor: string;
  public Designation: string;
  public HasChild: boolean;
  public Name: string;
  public Location: string;
  public ObjectId: string;
  public SystemId: number;
  public ViewId: number;
  public ViewType: number;
  public iconClass: string;
  constructor(public browserObject: BrowserObject) {
    this.Attributes = browserObject.Attributes;
    this.Descriptor = browserObject.Descriptor;
    this.Designation = browserObject.Designation;
    this.HasChild = browserObject.HasChild;
    this.Name = browserObject.Name;
    this.Location = browserObject.Location;
    this.ObjectId = browserObject.ObjectId;
    this.SystemId = browserObject.SystemId;
    this.ViewId = browserObject.ViewId;
    this.ViewType = browserObject.ViewType;
    this.iconClass = 'element-trend-filled';
  }
}

export declare const enum SearchTypes {
  DESCRIPTION = 0,
  NAME = 1,
  ALIAS = 2
}
export class OutOfScopeSubchart {
  public subCharts: SubChartRepresentation;
  public allSeriesOutOfScope: boolean;
}
export interface SearchParameter {
  skip?: number;
  pageSize?: number;
  search?: string;
  filterByName?: boolean;
}
export interface FromToOnInitialFetching {
  from: string;
  to: string;
}
export interface LiveData {
  trendData: any[];
  isOffline: boolean;
  missingData: MissingData[];
  timeShiftData: any[];
  removeOlderData: RemoveOlderDataFromLiveChart;
}

export interface TrendSelectionDetail {
  sourceNodeDetail: BrowserObject;
  action?: string;
}
