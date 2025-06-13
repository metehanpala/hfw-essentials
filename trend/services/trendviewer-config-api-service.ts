import { FullSnapInId } from '@gms-flex/core';
import { ValidationInput } from '@gms-flex/services';
import {
  ChartDefinition, clone, TrendConfigurationApi, TrendSeries, TrendSeriesDetails
} from '@simpl/trendviewer-ng';
import { mergeMap, Observable, Subscription, switchMap, throwError } from 'rxjs';

import { NonTrendSeries } from '../common/interfaces/nonTrendSeries';
import { TrendSeries as TrendSeriesSnapin } from '../common/interfaces/trendSeries';
import { TrendValidationHelperService } from '../shared/trend-validation-helper.service';
import { TrendDefinitionService } from './trend-definition-service';

export class TrendConfigApiService implements TrendConfigurationApi {
  public snapId: FullSnapInId;

  constructor(
    private readonly trendDefinitionService: TrendDefinitionService,
    private readonly trendValidationHelperService: TrendValidationHelperService) {
  }

  public selectLocation(): void {
    this.trendDefinitionService.selectDataPoints();
  }

  public addDataPoint(instanceId: string, gridIndex: number = 0): void {
    this.trendDefinitionService.addDataPoint(gridIndex);
  }

  public deleteTrend(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      const subscription: Subscription = this.trendDefinitionService.deleteTrend().subscribe(res => {
        observer.next(res);
        observer.complete();
        subscription.unsubscribe();
      }, error => { observer.error(error); observer.complete(); });
    });
  }

  public saveAsTrendDefinition(chartDefinition: ChartDefinition): Observable<boolean> {
    return this.trendDefinitionService.saveAsTrendDefinition(chartDefinition);
  }

  public saveConfiguration(instanceId: string, chartDefinition: ChartDefinition, isSaveAs: boolean): Observable<any> {
    if (isSaveAs) {
      return this.trendDefinitionService.saveAsTrendDefinition(chartDefinition);
    } else {
      const observable: Observable<ValidationInput> = new Observable<any>(observer => {
        const validationSubscription = this.trendValidationHelperService.
          trendValidationService([this.trendDefinitionService.tvdObjectId], 'TrendViewer-Config-ApiService')
          .subscribe({ next: (validationInput: ValidationInput) => {
            if (validationInput) {
              const subscription: Subscription = this.trendDefinitionService.saveTvdConfiguration(chartDefinition, validationInput).subscribe(res => {
                observer.next(true);
                observer.complete();
                subscription.unsubscribe();
              }, error => {
                observer.next(false);
                observer.complete();
              });
            } else if (validationInput !== null) {
              observer.next(false);
            }
          }, error: error => {
            observer.next(error);
          } });
      });
      return observable;
    }
  }

  public discardConfiguration(instanceId: string, chartDefinition: ChartDefinition): void {
    this.discardNonTrendedSeries(instanceId, chartDefinition);
    this.updateManualUploadContentActions(instanceId, chartDefinition.chartSeriesCollection);
    this.updateTrendSeriesCollectionForDiscardedSeries(instanceId, chartDefinition.chartSeriesCollection);
  }

  public closeConfiguration(): void {
    // close the edit mode
  }

  public seriesPropertyChange(instanceId: string, trendSeries: TrendSeries): Observable<boolean> {
    return new Observable<boolean>(observer => {
      setTimeout(() => {
        this.trendDefinitionService.seriesPropertyChanged(trendSeries);
        observer.next(true);
      });
    });
  }

  public okClicked(instanceId: string, seriesIdentifiers: string[] = []): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.trendDefinitionService.unsubscribeRemovedSeriesCOVs(seriesIdentifiers);
      setTimeout(() => {
        observer.next(false);
      });
    });
  }

  public seriesRemoved(instanceId: string, trendSeriesId: string): void {
    this.trendDefinitionService.clearSeriesInterval.next(trendSeriesId);
    this.trendDefinitionService.handleNonTrendSeriesCollection(trendSeriesId);
    // Defect 1314267: In a TVD if we remove an offline TL and discard the changes,
    // Manual Upload option is  getting disabled.
    const trendSeriesCol = new Map(this.trendDefinitionService.getTrendSeriesCollection());
    if (trendSeriesCol.has(trendSeriesId)) {
      trendSeriesCol.delete(trendSeriesId);
    }
    this.trendDefinitionService.removeSeriesFromOfflineSeriesCollection(trendSeriesId);
  }

  public seriesInformation(instanceId: string, rowDetails: TrendSeriesDetails): void {
    this.trendDefinitionService.getSeriesInformationDetails(rowDetails);
  }

  private discardNonTrendedSeries(instanceId: string, chartDefinition): void {
    chartDefinition.chartSeriesCollection.forEach(chartSeries => {
      this.trendDefinitionService
        .removeUnusedNonTrendedSeries(chartSeries.identifier, chartSeries?.properties?.selectedProperty);
    });
  }

  private updateManualUploadContentActions(instanceId: string, trendSeriesCollection: TrendSeries[]): void {
    const trendSeriesAfterDiscard = [];
    const snapinTrendSeriesCol: (TrendSeriesSnapin | NonTrendSeries)[] = Array.from(this.trendDefinitionService.getTrendSeriesCollection().values());
    // Defect 1314267 - on discard, check series collection from TV
    trendSeriesCollection?.forEach(fe => {
      trendSeriesAfterDiscard.push(snapinTrendSeriesCol?.find(fi => fi.seriesIdentifier === fe.identifier));
    });
    if (trendSeriesAfterDiscard.length > 0) {
      if (trendSeriesAfterDiscard.some(tsd => tsd.isOfflineTsd) && this.trendDefinitionService.getPropertyStatus()) {
        this.trendDefinitionService.manualUploadContentActions(false);
      } else {
        this.trendDefinitionService.manualUploadContentActions(true);
      }
    } else {
      this.trendDefinitionService.manualUploadContentActions(true);
    }
  }

  private updateTrendSeriesCollectionForDiscardedSeries(instanceId: string, updatedTrendSeriesAfterDiscard: TrendSeries[]): void {
    updatedTrendSeriesAfterDiscard.forEach(updatedTrendSeries => {
      const series = this.trendDefinitionService.getTrendSeriesCollection().get(updatedTrendSeries.identifier);
      if (series && series.trendObjectInfo.PropertyName !== updatedTrendSeries.properties.selectedProperty) {
        this.trendDefinitionService.updateTrendSeriesCollectionForDiscardedSeries(updatedTrendSeries.identifier);
      }
    });
  }

}
