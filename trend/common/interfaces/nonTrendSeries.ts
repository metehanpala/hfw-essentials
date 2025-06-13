import { BrowserObject } from '@gms-flex/services';
import { RemoveOlderDataFromLiveChart } from '@simpl/trendviewer-ng';
import { Observable, Subscription } from 'rxjs';

import { seriesProperties, TrendSeriesBase } from '../trendSeriesBase';
import { TQVEngineered } from './trend.models';

export class NonTrendSeries extends TrendSeriesBase {

  public nonTrendedValueBuffer: { Series: TQVEngineered[] } = { Series: [] };
  public historicDataMax: number | undefined;
  private readonly MAX_DATA_TO_SHOW: number = 1000 * 60 * 60 * 24;
  private removedOlderData = false;

  public setIfHistoricHDBDataPresent(isHistoricDatapresent: number): void {
    if (this.historicDataMax === undefined || (this.historicDataMax && !!isHistoricDatapresent)) {
      this.historicDataMax = isHistoricDatapresent;
    }
  }

  public getQuickAnalysisConfiguration(): RemoveOlderDataFromLiveChart {
    if (!!this.historicDataMax) {
      return { isToReplaceData: this.removedOlderData, rangeToRemove: this.MAX_DATA_TO_SHOW, from: this.historicDataMax, isToReduceFullRange: false };
    }
    return { isToReplaceData: this.removedOlderData, rangeToRemove: this.MAX_DATA_TO_SHOW, isToReduceFullRange: true };
  }

  public cacheCov(tqv: TQVEngineered): void {
    this.nonTrendedValueBuffer.Series.push(Object.assign({}, tqv));
  }

  public getSeriesData(from: string, to: string, noOfSamples?: number, isInitialLoad?: boolean): Observable<any> {
    return new Observable(observer => {
      let dataToReturn = { Series: [] };
      let fromDate: Date = new Date(from);
      let toDate: Date = new Date(to);
      this.traceService.info(this.traceModule, 'NonTrendSeries.getSeriesData() fromDate: %s toDate: %s, noOfSamples: %s', fromDate, toDate, noOfSamples);

      // we need to merge HDB + Cache data
      const getDataSub: Subscription = this.trendServiceBase.getTrendData(this.trendObjectInfo.TrendseriesId, from, to, noOfSamples.toString())
        .subscribe(trendDataResult => {
          if (trendDataResult?.Series && trendDataResult?.Series.length > 0) {
            const lastHDBPoint: Date = new Date(trendDataResult.Series[trendDataResult.Series.length - 1].Timestamp);

            // 1. if we have HDB and cache both data, then merge them and send back
            if (lastHDBPoint.getTime() < toDate.getTime()) {
              // I think we can use for loop instead of filter as filter will iterate every item in array where by for loop we can restrict that
              const result: any = this.getReducedCache(lastHDBPoint, toDate, fromDate, noOfSamples);
              dataToReturn.Series.push(...trendDataResult.Series);
              dataToReturn.Series.push(...result.Series);
              // NOTE: trendSeriesMaxTimestamp is set from tsdInfo and also from reduction algorithm.
              // if some issues comes, we need to create another tsdINfo property to maintain original
              // HDB max valueTImestamp and dont change on reduction algorithm.
              this.setIfHistoricHDBDataPresent(new Date(this.trendSeriesMaxTimestamp).getTime());
            } else if (lastHDBPoint.getTime() === toDate.getTime()) {
              // 2. if we have HDB data for full range, then send HDB data back. We dont need to get cache data
              // probably, cache data will not be there in this case
              dataToReturn = trendDataResult;
              this.setIfHistoricHDBDataPresent(new Date(this.trendSeriesMaxTimestamp).getTime());
            }
          } else if (!(trendDataResult?.Series) || (trendDataResult?.Series && trendDataResult?.Series.length === 0)) {
            // 3. If we dont have HDB data, then send cache reduced data back
            dataToReturn = this.getReducedCache(fromDate, toDate, fromDate, noOfSamples);
            this.setIfHistoricHDBDataPresent(undefined);
          }
          if (isInitialLoad) {
            toDate = new Date();
            const tqvTo = new TQVEngineered(toDate.toISOString(), '', '0', true);
            fromDate = new Date(this.trendSnapinService.generateDefaultTimeRangeDifference(toDate));
            let tqvFrom = new TQVEngineered(fromDate.toISOString(), '', '0', true);
            const dataSeriesLength = dataToReturn.Series.length;
            if (dataSeriesLength === 0) {
              dataToReturn.Series = [tqvFrom, tqvTo];
            } else {
              tqvFrom = new TQVEngineered(fromDate.toISOString(), '', '0', true);
              if (dataSeriesLength === 1) {
                if (dataToReturn.Series[0]?.Timestamp &&
                    new Date(dataToReturn.Series[0]?.Timestamp).getTime() < tqvFrom.Timestamp.getTime()) {
                  // If most latest record in `dataToReturn` is older than above constant `tqvFrom`.
                  dataToReturn.Series.push(tqvFrom);
                } else {
                  // If single record and 'tQVFrom' is older timestamp then we add at the start i.e. `tqvFrom`.
                  dataToReturn.Series.splice(0, 0, tqvFrom);
                }
              } else if (dataToReturn.Series[dataSeriesLength - 1]?.Timestamp &&
                  new Date(dataToReturn.Series[dataSeriesLength - 1]?.Timestamp).getTime() < tqvFrom.Timestamp.getTime()) {
                // If most latest record in `dataToReturn` is older than above constant 'tQVFrom'.
                dataToReturn.Series.push(tqvFrom);
              }
            }
          }
          observer.next(dataToReturn);
          observer.complete();
          getDataSub.unsubscribe();
        });
    });
  }

  public removeOlderCov(): void {
    if (this.nonTrendedValueBuffer.Series.length > 0) {
      // If data is older than a day, then only we should iterrate through the items
      if (this.nonTrendedValueBuffer.Series[0].Timestamp.getTime() < (Date.now() - this.MAX_DATA_TO_SHOW)) {
        this.removedOlderData = true;
        // clear old values from nonTrendedValueBuffer (older than 24 hours)
        this.nonTrendedValueBuffer.Series = this.nonTrendedValueBuffer.Series.filter(data => (Date.now() - this.MAX_DATA_TO_SHOW) < data.Timestamp.getTime());
      }
    }
  }

  public getSeriesProperties(browserObject?: BrowserObject): seriesProperties {
    if (!browserObject) {
      return {
        seriesName: this.seriesCNSInfo.seriesName,
        seriesDisplayName: this.seriesCNSInfo.seriesDisplayName,
        seriesAlias: this.seriesCNSInfo.seriesAlias,
        seriesDesignation: this.seriesCNSInfo.seriesDesignation,
        seriesLocation: this.seriesCNSInfo.seriesLocation,
        type: this.seriesCNSInfo.type,
        subType: this.seriesCNSInfo.subType
      };
    }
    return super.getSeriesProperties(browserObject);
  }

  private filterData(fromDate: Date, toDate: Date, dataToReturn: { Series: any[] }): void {
    const bufferArray: TQVEngineered[] = this.nonTrendedValueBuffer.Series.filter(tqv => fromDate <= tqv.Timestamp && tqv.Timestamp <= toDate);
    bufferArray.forEach(tqv => dataToReturn.Series.push(Object.assign({}, tqv)));
  }

  private getReducedCache(fromDate: Date, toDate: Date, visibleLeftBorder: Date, noOfSamples: number): { Series: any[] } {
    const dataToReturn = { Series: [] };
    this.filterData(fromDate, toDate, dataToReturn);
    // }
    if (dataToReturn.Series && dataToReturn.Series.length > 0) {
      // here we need to identify whether slider is on right most position or it is at middle. If it is on right moset
      // position then it should be 3/2 and if it is at middle it should be /2
      const NO_OF_SLICES: number = noOfSamples;
      // the calculated interval is same as in the standard client.
      const sliceDuration: number = (toDate.getTime() - visibleLeftBorder.getTime()) / NO_OF_SLICES;
      const reducedDataProperties = this.getReducedData(dataToReturn.Series,
        fromDate.getTime(), fromDate.getTime() + sliceDuration, sliceDuration, toDate.toISOString());
      dataToReturn.Series = reducedDataProperties.reducedData;
    }
    return dataToReturn;
  }

}
