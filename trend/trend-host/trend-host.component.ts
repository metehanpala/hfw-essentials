import { CdkPortal } from '@angular/cdk/portal';
import { Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FullSnapInId } from '@gms-flex/core';
import { BrowserObject, CnsHelperService, SiIconMapperService, SystemBrowserServiceBase, TablesEx } from '@gms-flex/services';
import { SiTrendviewerService } from '@simpl/trendviewer-ng';
import { Observable, Subscription } from 'rxjs';

import { TrendSnapinService } from '../services/trend-snapin.service';

@Component({
  selector: 'gms-trend-host',
  templateUrl: './trend-host.component.html',
  styleUrl: './trend-host.component.scss',
  standalone: false
})
export class TrendHostComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public fullId: FullSnapInId;
  @Input() public clientZone: NgZone;
  @ViewChild('propertyContent', { read: CdkPortal, static: true }) public propertyContent!: CdkPortal;
  @ViewChild('informationContent', { read: CdkPortal, static: true }) public informationContent!: CdkPortal;
  @ViewChild('aboutPopover') public aboutPopover: any;
  public snapInId = '';
  public propertyDisplayName: string;
  public propertyName: string;
  public propertyIcon$: Observable<string>;
  public objectList = new Array<BrowserObject>();
  private subs: Subscription[];

  constructor(public trendSnapinService: TrendSnapinService,
    private readonly trendviewerService: SiTrendviewerService,
    private readonly siIconMapperService: SiIconMapperService,
    private readonly systemBrowserService: SystemBrowserServiceBase) { }

  public ngOnChanges(): void {
    this.snapInId = this.fullId.fullId();
  }
  
  public ngOnInit(): void {
    this.subs = [];
    this.renderPropertySeriesInfo();
    this.renderInformationDetails();
  }

  public ngOnDestroy(): void {
    this.subs.forEach(f => f.unsubscribe());
  }

  public renderPropertySeriesInfo(): void {
    this.subs.push(this.trendSnapinService.trendSeriesInfoSub.subscribe(seriesInfo => {

      this.propertyIcon$ = this.siIconMapperService.getGlobalIcon(TablesEx.ObjectSubTypes,
        seriesInfo?.trendSeries?.seriesCNSInfo?.subType, seriesInfo?.trendSeries?.seriesCNSInfo?.type);

      this.propertyDisplayName = seriesInfo?.trendSeries?.seriesCNSInfo?.seriesDisplayName.split('.')[0];
      this.propertyName = seriesInfo?.trendSeries?.seriesCNSInfo?.seriesName.split('.')[0];
      this.trendviewerService.showPropertiesOfSeries(this.snapInId, { content: this.propertyContent, rowDetails: seriesInfo.rowDetails });
    }));
  }

  public renderInformationDetails(): void {
    this.subs.push(this.trendSnapinService.trendSeriesInformationDetailsSub.subscribe(seriesInfo => {
      if (seriesInfo?.snapinSeriesDetails !== undefined) {
        // Defect: 1369936, seriesInfo?.snapinSeriesDetails?.ObjectIdOfTrendedObject will suppress multi-select issue
        // it will provide list of node which need to be priorities using compareBrowserObjects,
        // this is to keep it aligned with event-notification information popup
        this.systemBrowserService.searchNodeMultiple(seriesInfo?.snapinSeriesDetails?.systemId,
          [seriesInfo?.snapinSeriesDetails?.ObjectIdOfTrendedObject], true).subscribe(s => {
          this.objectList = new Array<BrowserObject>();
          if (s[0]?.Nodes) {
            s[0].Nodes.sort(CnsHelperService.compareBrowserObjects);
            this.objectList.push(s[0].Nodes[0]);
          }
          this.trendviewerService.showInformationOfSeries(this.snapInId, { content: this.informationContent, seriesDetails: seriesInfo.selectedSeriesDetails });
        });
      }
    }));
  }
}
