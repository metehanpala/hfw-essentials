import { AggregatedSeriesResult, TrendQualityValue, ViewNode } from "@gms-flex/services";
import { DataZoomEvent } from "@simpl/trendviewer-ng";

export enum AggregateUnits {
  Month = 2,
  Week = 3,
  Day = 4,
  Hour = 5
}
export interface SeriesInfo {
  name: string;
  description: string;
  designation: string;
  alias?: string;
  unit: string;
  data: TrendQualityValue[] | AggregatedSeriesResult[] | undefined;
  resolution: number;
  enumTexts?: string[];
}
export interface ExportFormatDataMap {
  pointHeaders: string[][];
  tableValues: TableValue[];
  sheetHeaders?: string[];
  sheetValues?: string[];
}
export interface TableValue {
  pointValues: string[];
  dataValues: string[][];
  dataHeaders: string[];
  resolution?: number;
  pointInfo?: string[];
}

export interface ExportFormatOption {
  FileFormat: string;
  ExportOption: string;
  systemId: number;
}
        
export interface SeriesDN { 
  seriesId: string; 
  seriesName: string; 
  seriesDisplayName: string; 
  unit: string;
  noOfSamples: number;
  resolution: number;
  enumTexts?: string[];
  seriesDesignation: string;
  seriesAlias: string;
}

export interface Zoomdata {
  seriesID: string,
  dataZoomEventrequired: DataZoomEvent,
  zoomlevelRange: number
}

export interface ExportDataConfig {
  toDate: string;
  fromDate: string;
  fileType: string;
  desnsityOption: string;
  systemId: number;
}
export interface SystemViewNode {
  views: ViewNode[];
  IsDistributed: boolean;
}
