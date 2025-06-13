import { Component, HostListener, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { TileScrolledEvent, TilesViewComponent, TilesViewDataResult } from '@gms-flex/controls';
import { BrowserObject, CnsHelperService, CnsLabel, CnsLabelEn } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { NavbarItem, SiSearchBarComponent } from '@simpl/element-ng';
import { Observable, of, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { SearchParameter, TileObject } from '../common/interfaces/trend.models';
import { TrendSnapinService } from '../services/trend-snapin.service';

@Component({
  selector: 'gms-search-view',
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  standalone: false
})

export class SearchViewComponent implements OnInit, OnDestroy, OnChanges {

  public view: TilesViewDataResult;
  public loading = false;
  public skip = 0;
  public pageSize = 5000;
  public sizeModel = 'm';
  public secondaryActions: NavbarItem[] = [];
  public primaryActions: NavbarItem[] = [];
  public cnsLabelObject: CnsLabel = new CnsLabel();

  @Input() public selectedObject: BrowserObject[];
  @Input() public placeholder: string;

  private restoredScrollTop: number;
  private scrollHasBeenRestored = false;
  private trendsSubscription = new Subscription();
  private readonly subscriptions: Subscription[] = [];
  private search: string = undefined;

  @ViewChild('tilesView') private readonly tilesView: TilesViewComponent;
  @ViewChild('SiSearchBar') private readonly siSearchBarComponent: SiSearchBarComponent;

  public constructor(
    private readonly trendSearchService: TrendSnapinService,
    private readonly cnsHelperService: CnsHelperService,
    private readonly ngZone: NgZone) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const storageData = this.getRetainedData(changes);
    // Defect 1286871 - reset skip property to 0 when new node is selected
    // Defect 1292971 - position of scroll bar is not consistent on different folder selection
    if (storageData === undefined) {
      this.skip = 0;
      this.restoredScrollTop = 0;
      this.scrollHasBeenRestored = false;
      if (this.siSearchBarComponent) {
        this.siSearchBarComponent.value = undefined;
      }
    }
    if (this.selectedObject && this.selectedObject.length > 0) {
      this.trendSearchService.setSelectedObject(this.selectedObject[0]);
    }

    if (changes?.selectedObject?.currentValue) {
      if (this.trendsSubscription) {
        this.trendsSubscription.unsubscribe();
      }
      this.trendsSubscription = this.fetchData().pipe(finalize(() => this.loading = false)).subscribe(response => {
        this.view = response;
        if (storageData !== undefined) {
          const search = storageData.searchKey;
          if (!!search && search !== '') {
            this.search = search;
            if (this.siSearchBarComponent) {
              setTimeout(() => {
                this.siSearchBarComponent.value = this.search;
              });
            }
          }
        }
        this.restoreScroll();
      });
    }
  }

  public ngOnInit(): void {
    this.subscriptions.push(this.cnsHelperService.activeCnsLabel.subscribe(label => {
      this.cnsLabelObject = label;
    }));
  }

  public ngOnDestroy(): void {
    this.setDataToRetain();
    if (this.trendsSubscription) {
      this.trendsSubscription.unsubscribe();
    }
    this.subscriptions.forEach((subscription: Subscription) => { if (!isNullOrUndefined(subscription)) { subscription.unsubscribe(); } });
  }
  // To restrict the below two special characters from the Ui input.
  public onKeyPress(event: KeyboardEvent): void {
    const forbiddenChars = ['?', '*'];
    if (forbiddenChars.includes(event.key)) {
      event.preventDefault();
    }
  }

  // to restrict copy past the below two special characters in the Ui input.
  @HostListener('paste', ['$event'])
  public onPaste(event: ClipboardEvent): void {
    const pastedInput: string = event.clipboardData?.getData('text/plain') || '';
    if (pastedInput.includes('?') && pastedInput.includes('*')) {
      event.preventDefault();
    }
  }

  public searchChange(searchKeyword: string): void {
    this.search = searchKeyword;
    if (!!this.search && this.search !== '') {
      this.filteredData(searchKeyword);
    } else {
      if (searchKeyword !== null) {
        this.skip = 0;
        this.filteredData(searchKeyword);
      }
    }
  }

  public handlePageChange(event: TileScrolledEvent): void {
    this.skip = event.skip;
    this.pageSize = event.take;
    this.filteredData();
  }

  public onClickBody(event: any): void {

    if (!isNullOrUndefined(event)) {
      this.selectedObject[0] = event as BrowserObject;
      this.trendSearchService.setSelectedObject(this.selectedObject[0]);
      this.trendSearchService.onTileClick(this.selectedObject[0]);
    }
  }

  public onBeforeAttach(): void {
    this.tilesView.onBeforeAttach();
  }

  private fetchData(): Observable<TilesViewDataResult> {
    this.loading = true;
    return this.trendSearchService.trendTileSearch({ skip: this.skip, pageSize: this.pageSize });
  }

  private filteredData(searchedString?: string): void {
    this.loading = true;
    const filterByName: boolean = this.cnsLabelObject.cnsLabel === CnsLabelEn.Name ||
      this.cnsLabelObject.cnsLabel === CnsLabelEn.NameAndDescription ||
      this.cnsLabelObject.cnsLabel === CnsLabelEn.NameAndAlias;
    this.subscriptions.push(this.getPageData({ skip: this.skip, pageSize: this.pageSize, search: searchedString, filterByName })
      .pipe(finalize(() => this.loading = false))
      .subscribe(res => {
        this.view = res;
        this.restoreScroll();
      }));
  }

  private getPageData(options: SearchParameter = {}): Observable<TilesViewDataResult> {
    const skip: number = options.skip || 0;
    const pageSize: number = options.pageSize || this.trendSearchService.fullBackupData.length;

    if (options.search !== undefined) {
      // get full dataset
      if (this.trendSearchService?.fullBackupData) {
        this.trendSearchService.fullData = JSON.parse(JSON.stringify(this.trendSearchService.fullBackupData));
      }
      // filter dataset
      if (options.search !== '') {
        let filteredData: TileObject[] = [];
        let length = 0;
        if (options.filterByName) {
          length = this.selectedObject && this.selectedObject.length > 0 ? this.selectedObject[0].Designation.length + 1 : 0;
          filteredData = this.trendSearchService.fullData.filter(n => (n.Name as string).toLowerCase().includes(options.search.trim().toLowerCase())
            || (n.Designation as string).toLowerCase()
              .substring(length, n.Designation.length) // exclude the selected node and its parent hirarchy
              .includes(options.search.trim().toLowerCase()));
        } else {
          length = this.selectedObject && this.selectedObject.length > 0 ? this.selectedObject[0].Location.length + 1 : 0;
          filteredData = this.trendSearchService.fullData.filter(n => (n.Descriptor as string).toLowerCase().includes(options.search.trim().toLowerCase())
            || (n.Location as string).toLowerCase()
              .substring(length, n.Location.length) // exclude the selected node and its parent hirarchy
              .includes(options.search.trim().toLowerCase()));
        }
        this.trendSearchService.fullData = filteredData;
      }
    }

    return of({
      data: this.trendSearchService.fullData ? this.trendSearchService.fullData.slice(skip, skip + pageSize).map(item => ({ ...item })) : [],
      total: this.trendSearchService.fullData ? this.trendSearchService.fullData.length : 0
    });
  }

  private setDataToRetain(): void {
    const data: any = {
      skip: this.skip,
      tilesScrollTop: this.tilesView.getScrollTop(),
      searchKey: this.search
    };
    if (data) {
      this.trendSearchService.storage.setState(this.trendSearchService.snapId, data);
    }
  }

  private getRetainedData(changes: SimpleChanges): any {
    if (changes.selectedObject && changes.selectedObject.previousValue !== changes.selectedObject.currentValue) {
      if (changes.selectedObject.isFirstChange()) {
        const storageData: any = this.trendSearchService.storage.getState(this.trendSearchService.snapId);
        if (storageData) {
          this.skip = storageData.skip ?? 0;
          this.restoredScrollTop = storageData.tilesScrollTop;
          this.search = storageData.searchKey;
        }
        return storageData;
      }
    }
  }

  private restoreScroll(): void {
    if (!isNullOrUndefined(this.restoredScrollTop) && this.scrollHasBeenRestored === false) {
      setTimeout(() => {
        this.tilesView.scrollTo(this.restoredScrollTop);
        this.scrollHasBeenRestored = true;
      }, 100);
    }
  }
}

export class MockTrendSnapinService extends TrendSnapinService {

}
