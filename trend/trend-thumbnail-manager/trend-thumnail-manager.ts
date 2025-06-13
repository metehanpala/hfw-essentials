/* eslint-disable import/order */
/* eslint-disable no-warning-comments */
import { AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { CompleteChartDataSource, ImageDataType, SearchConfig } from '@gms-flex/controls';
import * as echarts from 'echarts';

import { PrintThumbnailData, TrendSnapinService } from '../services/trend-snapin.service';
import { TrendSearchedItem } from '../shared/trend-searched-item';
import ECharts = echarts.ECharts;
import EChartOption = echarts.EChartsOption;

import { Subscription } from 'rxjs';
import { TraceService } from '@gms-flex/services-common';

export class Configuration {
  public height: number;
  public width: number;
}

@Component({
  selector: 'gms-trend-thumbnail-manager-client-selector',
  templateUrl: './trend-thumbnail-manager.html',
  standalone: false
})
export class TrendThumbnailManagerClientComponent implements AfterViewInit, OnDestroy {

  public readonly chartContainerId: string = 'thumbnail-generation-chart-container';

  private chart: ECharts;
  private options: EChartOption;
  private readonly printThumbnailSubscription: Subscription;
  private readonly traceModule = 'gmsSnapins_TrendThumbnailManagerClientComponent';

  constructor(private readonly trendSnapinService: TrendSnapinService, private readonly ngZone: NgZone,
    private readonly serchConfig: SearchConfig, private readonly traceService: TraceService) {
    this.printThumbnailSubscription = this.trendSnapinService.printThumbnail.subscribe(
      (printThumbnailData: PrintThumbnailData) => {
        this.updateCompleteDataSource(printThumbnailData.trendSearchedItem,
          printThumbnailData.completeChartDataSource);
      });
  }

  public ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.chart = echarts.init(document.getElementById(this.chartContainerId));
    });
    this.loadChart(this.getConfiguration());
  }

  public ngOnDestroy(): void {
    this.traceService.debug(this.traceModule, 'TrendThumbnailManagerClientComponent.ngOnDestroy(): unsubscribe all subscriptions');
    this.printThumbnailSubscription.unsubscribe();
    this.chart.dispose();
  }

  private getConfiguration(): Configuration {
    const configuration: Configuration = new Configuration();
    configuration.width = 243;
    configuration.height = 139;
    return configuration;
  }

  private loadChart(config: Configuration): void {
    this.traceService.debug(this.traceModule, 'TrendThumbnailManagerClientComponent.loadChart(): set default chart options for tile image');
    const chartContainerElement: HTMLElement = document.getElementById(this.chartContainerId);
    chartContainerElement.style.width = config.width + 'px';
    chartContainerElement.style.height = config.height + 'px';

    const colors: string[] = ['#66CAEC', '#006486', '#00212D', '#B4D766', '#4E7100', '#FA848C', '#941E26', '#FFD466', '#996E00'];
    this.options = {
      color: colors,
      xAxis: [
        {
          show: true,
          type: 'time',
          axisLine: {
            show: true,
            lineStyle: {
              width: 1,
              color: '#a4a4a4'
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            show: false
          },
          splitLine: {
            show: false
          }
        }
      ],
      yAxis: [
        {
          show: false,
          min: 'dataMin',
          max: 'dataMax'
        }
      ],
      animation: false,
      grid: {
        left: 20,
        right: 20,
        bottom: 40,
        top: 45
      },
      dataZoom: [
        {
          type: 'inside',
          zoomLock: true
        }
      ]
    };
    this.ngZone.runOutsideAngular(() => {
      this.chart.setOption(this.options, true);
    });
  }

  private updateCompleteDataSource(tile: TrendSearchedItem, dataSource: CompleteChartDataSource): void {
    try {
      this.traceService.debug(this.traceModule, 'TrendThumbnailManagerClientComponent.updateCompleteDataSource(): create chart image');
      this.options.series = [];
      tile.imageData = this.serchConfig.get().DefaultLocalStorageID;
      tile.imageDataType = ImageDataType.BASE64;
      tile.thumbnailGenerationCompleted.emit(tile);
    } catch (error) {
      this.traceService.error(this.traceModule, 'TrendThumbnailManagerClientComponent.updateCompleteDataSource() error: ', error);
    }
  }

  private captureChart(): string {
    this.traceService.debug(this.traceModule, 'TrendThumbnailManagerClientComponent.captureChart(): capture chart image');
    const chartContainer: HTMLElement = document.getElementById(this.chartContainerId);
    const canvas: any = chartContainer.getElementsByTagName('canvas')[0];
    return canvas.toDataURL();
  }
}
