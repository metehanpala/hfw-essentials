import { ChartLineStyle, MarkerType, PropertyDetails, TimeRange, TrendSeriesInfo } from '@gms-flex/services';
import {
  DataZoomRange,
  LineType,
  RelativeTimeConfig,
  RelativeTimeRange,
  SiSymbol,
  TrendProperty,
  TrendViewerConfig,
  YAxisPosition
} from '@simpl/trendviewer-ng';

import { EUsage, PropertyDataType, TrendChartConstants } from '../common/interfaces/trend.models';
import { TrendSeries } from '../common/interfaces/trendSeries';
// eslint-disable-next-line no-warning-comments
// TODO: remove SiTrendviewerConfigService import
import { LineTypes, RelativeTimeRanges } from '../shared/trend-searched-item';
import { Guid } from '../utilities/guid';

export class TrendBaseManager {

  public getPropertyList(propertyInfo: PropertyDetails[]): TrendProperty[] {
    const propertyList: TrendProperty[] = [];
    propertyInfo.forEach(property => {
      // filter properties for DL2 or DL3 level
      if ((property.Usage & EUsage.Detail) || (property.Usage & EUsage.General)) {
        // check trendable data types
        switch (property.Type) {
          case PropertyDataType.ExtendedBitString:
          case PropertyDataType.ExtendedBool:
          case PropertyDataType.ExtendedEnum:
          case PropertyDataType.ExtendedInt:
          case PropertyDataType.ExtendedInt64:
          case PropertyDataType.ExtendedReal:
          case PropertyDataType.ExtendedUint:
          case PropertyDataType.ExtendedUint64:
          case PropertyDataType.BasicBit32:
          case PropertyDataType.BasicBool:
          case PropertyDataType.BasicFloat:
          case PropertyDataType.BasicInt:
          case PropertyDataType.BasicInt64:
          case PropertyDataType.BasicTime:
          case PropertyDataType.BasicUint:
          case PropertyDataType.BasicUint64:
          case PropertyDataType.ExtendedDuration:
            const prop: TrendProperty = { propertyName: property.PropertyName, propertyDescription: property.Descriptor };
            propertyList.push(prop);
            break;
          default:
            break;
        }
      }
    });
    return propertyList;
  }

  // Chart title based on display mode
  public getParentLocation(chartPath: string): string {
    // this is not expected code. we should call object manager API and need to get selectedObject parent
    // without WSI call
    let path: string = chartPath.substring(0, chartPath.lastIndexOf('.'));
    path = path.substring(path.lastIndexOf('.') + 1, path.length);
    return path;
  }

  // generate series identifier and cache it to process request by control
  public getSeriesIdentifier(): string {
    return Guid.newGuid().toString();
  }

  // Get the correct subscription id based on trendseries type
  public getSubscriptionId(trendObjectInfo: TrendSeriesInfo, isOffline: boolean): string {
    // For offline series, we watch for change in buffer size. For online series we watch for changes in the actual value
    if (isOffline) {
      return trendObjectInfo?.CollectorObjectOrPropertyId ?
        trendObjectInfo?.CollectorObjectOrPropertyId + TrendChartConstants.SERIES__LAST_SEQ_NUM : undefined;
    } else {
      return trendObjectInfo ? trendObjectInfo.ObjectId + '.' + trendObjectInfo.PropertyName : undefined;
    }
  }

  public createSubscriptionId(subscriptionId: string, trendSeriesId: string): string {
    return subscriptionId + TrendChartConstants.SUB_ID_SEPERATOR + trendSeriesId;
  }

  public MapLinetypeToChartLineStyle(lineType: LineType): ChartLineStyle {
    let chartLineStyle: ChartLineStyle;
    if (lineType === LineTypes.Dashed) {
      chartLineStyle = ChartLineStyle.Dashed;
    } else if (lineType === LineTypes.Dotted) {
      chartLineStyle = ChartLineStyle.Dotted;
    } else {
      chartLineStyle = ChartLineStyle.Full;
    }
    return chartLineStyle;
  }

  public mapMarkerTypeToSymbol(markerType: string, showMarkers: boolean): SiSymbol {
    if (!showMarkers) {
      return SiSymbol.none;
    }

    let symbol: SiSymbol;
    if (markerType === MarkerType[MarkerType.Diamond]) {
      symbol = SiSymbol.diamond;
    } else if (markerType === MarkerType[MarkerType.Circle]) {
      symbol = SiSymbol.circle;
    } else if (markerType === MarkerType[MarkerType.Square]) {
      symbol = SiSymbol.rect;
    } else if (markerType === MarkerType[MarkerType.Cross1]) {
      symbol = SiSymbol.triangle;
    } else {
      symbol = SiSymbol.none;
    }
    return symbol;
  }

  public mapSymbolToMarkerType(symbol: SiSymbol): string {
    if (!symbol || symbol === SiSymbol[SiSymbol.none]) {
      return undefined;
    }

    let marker: string;
    if (symbol === SiSymbol[SiSymbol.diamond]) {
      marker = MarkerType[MarkerType.Diamond];
    } else if (symbol === SiSymbol[SiSymbol.circle]) {
      marker = MarkerType[MarkerType.Circle];
    } else if (symbol === SiSymbol[SiSymbol.rect]) {
      marker = MarkerType[MarkerType.Square];
    } else if (symbol === SiSymbol[SiSymbol.triangle]) {
      marker = MarkerType[MarkerType.Cross1];
    } else {
      marker = undefined;
    }
    return marker.toString();
  }

  public getMarkerVisibilityFromSymbol(symbol: SiSymbol, showMarkers: boolean): boolean {
    if (showMarkers === false || symbol === SiSymbol[SiSymbol.none]) {
      return false;
    } else {
      return true;
    }
  }

  public mapYAxisIndexToAxisAttachment(position: YAxisPosition): string {
    if (position === 'right') {
      return TrendChartConstants.SERIES_AXIS_ATTACHMENT_RIGHT.toString();
    }
    return TrendChartConstants.SERIES_AXIS_ATTACHMENT_LEFT.toString();
  }

  public setLineColor(colorStr: string): string {
    let color: string;
    if (colorStr && colorStr.length !== 0) {
      // Convert format of Echarts, RGB, to wsi format ARGB
      const transperrancyStr = 'ff';
      color = transperrancyStr + colorStr.substr(1);
    }
    return color;
  }

  // Get the line type based on configuration
  public getLineType(linestyle: string): LineType {
    if (linestyle === ChartLineStyle[ChartLineStyle.Dashed] ||
            linestyle === ChartLineStyle[ChartLineStyle.DotDashed]) {
      return LineTypes.Dashed;
    } else if (linestyle === ChartLineStyle[ChartLineStyle.Dotted]) {
      return LineTypes.Dotted;
    } else {
      return LineTypes.Solid;
    }
  }

  // Get the line color based on configuration
  public getLineColor(colorStr: string): string {
    let color: string;
    if (colorStr !== null && colorStr.length !== 0) {
      // Received color string from wsi is of format ARGB and expected format of Echarts is RGBA
      color = '#' + colorStr.slice(2);
    }
    return color;
  }

  public getZoomRange(relativeTimeConfig: RelativeTimeConfig): DataZoomRange {
    const endDate: Date = new Date();
    const timeRange: TimeRange = {
      timeRangeUnit: relativeTimeConfig.relativeTimeRange,
      timeRangeValue: relativeTimeConfig.unitValue
    };
    const startDate: Date = this.getStartDate(timeRange, new Date());
    let zoomRange: DataZoomRange;
    if (startDate.getTime() < endDate.getTime()) {
      const timeDiff: number = endDate.getTime() - startDate.getTime();
      zoomRange = { visibleWidth: timeDiff, end: 100 };
    } else {
      zoomRange = { startValue: 0, endValue: 100 };
    }
    return zoomRange;
  }

  public getStartDate(relativeTimeConfig: TimeRange, endDate: Date): Date {
    const startDate: Date = endDate;
    if (relativeTimeConfig.timeRangeValue !== 0 || relativeTimeConfig.timeRangeUnit !== RelativeTimeRanges.All) {
      const unitValue: number = relativeTimeConfig.timeRangeValue;
      switch (relativeTimeConfig.timeRangeUnit) {
        case RelativeTimeRanges.Year:
          startDate.setDate(endDate.getDate() - unitValue * 365);
          break;
        case RelativeTimeRanges.Month:
          startDate.setMonth(endDate.getMonth() - unitValue);
          break;
        case RelativeTimeRanges.Week:
          startDate.setDate(endDate.getDate() - (unitValue * 7));
          break;
        case RelativeTimeRanges.Day:
          startDate.setDate(endDate.getDate() - unitValue);
          break;
        case RelativeTimeRanges.Hour:
          startDate.setHours(endDate.getHours() - unitValue);
          break;
        case RelativeTimeRanges.Minute:
          startDate.setMinutes(endDate.getMinutes() - unitValue);
          break;
        default:
          break;
      }
    }
    return startDate;
  }
}
