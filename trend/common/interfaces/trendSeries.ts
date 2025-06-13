import { BrowserObject } from '@gms-flex/services';
import { RemoveOlderDataFromLiveChart } from '@simpl/trendviewer-ng';
import { Observable, Subscription } from 'rxjs';

import { seriesProperties, TrendSeriesBase } from '../trendSeriesBase';
import { TQVEngineered } from './trend.models';

// The class acts as a viewmodel for trendview definition where it has properties of trend view definition returned from service.
// the methods related to retriving data from wsi, handling COVs,etc shall be addressed in this class itself.
export class TrendSeries extends TrendSeriesBase {

  public setIfHistoricHDBDataPresent(isHistoricDatapresent: number): void {
    // throw new Error('Method not implemented.');
  }

  public getQuickAnalysisConfiguration(): RemoveOlderDataFromLiveChart {
    return { isToReplaceData: false };
  }

  public cacheCov(tqv: TQVEngineered): void {
    //  handling current change of values
  }

  public removeOlderCov(): void {
    // clear old values from nonTrendedValueBuffer
  }

  public getSeriesData(from: string, to: string, noOfSamples?: number): Observable<any> {
    return new Observable(observer => {
      const getDataSub: Subscription = this.trendServiceBase.getTrendData(this.trendObjectInfo.TrendseriesId, from, to, noOfSamples.toString())
        .subscribe(trendDataResult => {
          observer.next(trendDataResult);
          observer.complete();
          getDataSub.unsubscribe();
        });
    });
  }

  public getSeriesProperties(browserObject?: BrowserObject): seriesProperties {
    if (!browserObject) {
      return;
    }
    return super.getSeriesProperties(browserObject);
  }
}
