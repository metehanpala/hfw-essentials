import {
  DataZoomEvent,
  MissingData,
  RangeType,
  TrendData,
  TrendLiveRequest,
  TrendLiveSeries,
  TrendviewerApi
} from '@simpl/trendviewer-ng';
import { TrendViewerViewState } from '@simpl/trendviewer-ng/shared/view-state';
import { BehaviorSubject, Observable, Observer } from 'rxjs';

import { TrendDefinitionService } from './trend-definition-service';

export class TrendviewerApiService implements TrendviewerApi {
  private isLive = false;

  private readonly intervals: Map<string, NodeJS.Timeout > = new Map();

  constructor(private readonly trendDefinitionService: TrendDefinitionService) {
    this.trendDefinitionService.clearSeriesInterval .subscribe((seriesId: string) => {
      this.clearSeriesInterval(seriesId);
    });
  }

  public clearSeriesInterval(identifier: string): void {
    const interval = this.intervals.get(identifier);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(identifier);
    }
  }

  // Live update started and control will subscribe to observable below.
  // currently the interval is set to 2 seconds
  public startLiveDataUpdate(instanceId: string, series: TrendLiveRequest): Observable<TrendLiveSeries> {
    this.isLive = true;
    return new Observable<TrendLiveSeries>(observer => {
      if (!this.intervals.get(series.identifier)) {
        const liveInterval = setInterval(() => {
          if (this.isLive) {
            this.getLiveData(series, observer);
          }
        }, 1000);
        this.intervals.set(series.identifier, liveInterval);
      }
    });
  }

  // Live update stopped and contrseriesArrayol unsubscribes to the observable sent while starting live update
  public stopLiveDataUpdate(instanceId: string, series: TrendLiveRequest): void {
    this.isLive = false;
    const interval = this.intervals.get(series.identifier);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(series.identifier);
    }
  }

  public getDebounceTime(): number {
    return 200;
  }

  public getSeriesData(instanceId: string, series: string, zoomLevel: number, range: RangeType): Observable<TrendData> {
    return this.trendDefinitionService.getSeriesDataFromService(series, zoomLevel, range);
  }

  public manageData(obj: TrendData): void {
    // This is intentional
  }

  public getZoomLevel(instanceId: string, series: string, dataZoomEvent: DataZoomEvent): number {
    return this.trendDefinitionService.getZoomLevel(series, dataZoomEvent);
  }

  public getViewState(): Observable<TrendViewerViewState> {
    return new BehaviorSubject<TrendViewerViewState>(this.trendDefinitionService.retainedState).asObservable();
  }

  public viewStateChange(instanceId: string, viewState: TrendViewerViewState): void {
    this.trendDefinitionService.setViewState(viewState);
  }

  public setPropertyDirtyState(instanceId: string, isPropertyChanged: boolean): void {
    this.trendDefinitionService.setDirtyFlag(isPropertyChanged);
  }

  private getLiveData(series: TrendLiveRequest, observer: Observer<any>): void {
    const seriesData: TrendLiveSeries = { chartData: [], missingData: [], identifier: '', zoomLevel: 0, timestamp: '' };
    seriesData.identifier = series.identifier;
    const liveData = this.trendDefinitionService.getLiveData(series.identifier);
    const trendData = liveData.trendData;
    const missingData = liveData.missingData;
    const timeShiftData = liveData.trendData;
    const removeOlderData = liveData.removeOlderData;
    const isOffline = liveData.isOffline;
    seriesData.removeOlderDataFromLiveChart = removeOlderData;

    // Fill data in observer only if data is present with at least a single record
    if (trendData && trendData.length > 0) {
      seriesData.chartData = trendData;
      seriesData.missingData = missingData;
      seriesData.timeShiftData = timeShiftData;
    } else if (!isOffline) { /** For offline trends, there is no need to support contineous straight line when automation is stopped. */
      seriesData.timestamp = new Date();
      seriesData.zoomLevel = series.zoomLevel;
      seriesData.identifier = series.identifier;
    }
    observer.next(seriesData);
  }
}
