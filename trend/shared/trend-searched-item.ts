import { EventEmitter } from '@angular/core';
import { ImageDataType, SearchedItem } from '@gms-flex/controls';
import { Observable } from 'rxjs';

import { Line } from '../common/interfaces/trend.models';
import { TrendSnapinService } from '../services/trend-snapin.service';

export enum AxisTypes {
  Value = 'value',
  Category = 'category',
  Time = 'time',
  Log = 'log'
}

export enum YAxisPositions {
  Left = 'left',
  Right = 'right'
}

export enum InterpolationOptions {
  Start = 'start',
  End = 'end',
  linear = 'linear '
}

export enum LineTypes {
  Solid = 'solid',
  Dashed = 'dashed',
  Dotted = 'dotted'
}

export enum RelativeTimeRanges {
  Default = 'default',
  Year = 'year',
  Month = 'month',
  Week = 'week',
  Day = 'day',
  Hour = 'hour',
  Minute = 'minute',
  All = 'all',
  Select = 'select'
}

export enum TrendActiveViews {
  View = 'view',
  Edit = 'edit'
}
export class TrendSearchedItem implements SearchedItem {
  public initCompleted: EventEmitter<SearchedItem> = new EventEmitter<SearchedItem>();
  public thumbnailGenerationCompleted: EventEmitter<SearchedItem>;
  public localStorageId: string;
  public content: string;
  public imageData: string;
  public objectID: string;
  public path: string;
  public viewID: number;
  public designation: string;
  public systemID: number;
  public lines: Line[];
  public name: string;
  public description: string;
  public trendSeriesIDs: string[];
  public axisAttachment: string[];
  public imageDataType: ImageDataType;
  public locationPath: string;
  public designationPath: string;
  public selectedNodeDesignation: string;
  public selectedNodeLocation: string;
  public location: string;

  public onInit(): void {
    this.imageDataType = ImageDataType.ICON;
    this.imageData = 'element-trend-filled';
    this.localStorageId = 'TrendIcon';
    this.initCompleted.emit(this);
  }

  constructor(private readonly searchService: TrendSnapinService) {
    this.trendSeriesIDs = new Array<string>();
    this.axisAttachment = new Array<string>();
    this.lines = new Array<Line>();
  }

  public generateThumbnail(): Observable<void> {
    this.thumbnailGenerationCompleted.emit(this);
    return new Observable<void>();
  }

  public clone(): SearchedItem {
    const copy: TrendSearchedItem = new TrendSearchedItem(this.searchService);
    copy.name = this.name;
    copy.objectID = this.objectID;
    copy.description = this.description;
    copy.viewID = this.viewID;
    copy.systemID = this.systemID;
    copy.imageData = this.imageData;
    copy.path = this.path;
    copy.localStorageId = this.localStorageId;
    copy.designation = this.designation;
    copy.selectedNodeDesignation = this.selectedNodeDesignation;
    copy.selectedNodeLocation = this.selectedNodeLocation;
    copy.designationPath = this.designationPath;
    copy.locationPath = this.locationPath;
    copy.location = this.location;
    copy.initCompleted = new EventEmitter<TrendSearchedItem>();
    copy.thumbnailGenerationCompleted = new EventEmitter<TrendSearchedItem>();
    return copy;
  }

  public onTileClick(): void {
    // sends selection message
  }
}
