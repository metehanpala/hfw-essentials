import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { SearchParameters, TileScrolledEvent, TilesViewComponent, TilesViewDataResult } from '@gms-flex/controls';
import {
  BrowserObject,
  CnsHelperService,
  CnsLabel,
  CnsLabelEn,
  GmsManagedTypes,
  Page,
  SystemBrowserService
} from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { SiSearchBarComponent } from '@simpl/element-ng';
import { asyncScheduler, Observable, of, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { GraphicsSnapinService } from '../services/graphics-snapin.service';
import { TileObject } from '../shared/tileObject';

@Component({
    selector: 'gms-graphics-search-view',
    templateUrl: './search-view.component.html',
    standalone: false
})

export class SearchViewComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public selectedObject: BrowserObject;
  @Input() public searchPlaceHolder: string;

  public selectedBrowserObjectName: string;
  public searchParameters: SearchParameters;
  public cnsLabelObject: CnsLabel = new CnsLabel();

  public view: TilesViewDataResult;
  public pageSize: number = undefined;
  public skip: number = 0;
  public loading = false;
  public sizeModel: string = 'm';
  public onBeforeAttachSub: Subscription;

  @ViewChild('graphicsTilesView') public tilesView: TilesViewComponent;
  @ViewChild('searchBar') public searchBar: SiSearchBarComponent;

  private nodes: TileObject[];
  private fullBackupNodes: any[];

  private searchSubscription: Subscription = new Subscription();
  private searchString: string = 'Graphics*';

  private navigationBrowserObject: TileObject[] = [];
  private readonly subscriptions: Subscription[] = [];

  constructor(private readonly systemBrowserService: SystemBrowserService,
              private readonly cnsHelperService: CnsHelperService,
              private readonly graphicsSnapinService: GraphicsSnapinService
  ) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!isNullOrUndefined(changes.selectedObject)) {
      if (!isNullOrUndefined(changes.selectedObject.currentValue)) {
        this.graphicsSnapinService.setSelectedObject(this.selectedObject);
        this.selectedBrowserObjectName = this.selectedObject.ObjectId;
        this.navigationBrowserObject = [];
        if (!isNullOrUndefined(this?.searchBar?.value)) {
          this.searchBar.value = '';
          this.searchString = this.selectedObject.Designation + '*';
          this.searchAllNodes(this.selectedObject);
        }
      }
    }
  }

  public ngOnInit(): void {
    this.subscriptions.push(
      this.cnsHelperService.activeCnsLabel.subscribe(label => {
        this.cnsLabelObject = label;
      })
    );

    this.onBeforeAttachSub = this.graphicsSnapinService.onBeforeAttachSubject.subscribe(() => this.onBeforeAttach());
    asyncScheduler.schedule(this.restoreSearchString.bind(this), 300);
    this.searchAllNodes(this.selectedObject);
  }

  public ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.onBeforeAttachSub?.unsubscribe();
    this.subscriptions.forEach((subscription: Subscription) => {
        subscription?.unsubscribe();
    });
  }

  public onClickBody(event: any): void {
    // NOTE: Check this function
    if (!isNullOrUndefined(event)) {
      this.selectedObject = event as BrowserObject;
      // NOTE: Check this function
      this.graphicsSnapinService.onTileClick(this.selectedObject);
    }
  }

  public searchChange(searchedString: string): void {
    if (searchedString !== null && searchedString !== undefined) {
      this.skip = 0;
      this.fetchData(searchedString);
      if (searchedString !== undefined && this.graphicsSnapinService !== undefined) {
        this.graphicsSnapinService.SearchString = searchedString;
      }
    }
  }

  public restoreSearchString(): void {
    const searchString: string = this.graphicsSnapinService?.SearchString;
    if (searchString !== undefined && this.searchBar !== undefined) {
      this.searchBar.value = searchString;
      this.graphicsSnapinService.clearSearchString();
    }
  }

  public handlePageChange(event: TileScrolledEvent): void {
    this.skip = event.skip;
    this.pageSize = event.take;

    this.fetchData();
  }

  public fetchData(searchString?: string): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    const searchQuery = searchString;
    this.loading = true;
    const filterByNameValue: boolean = this.cnsLabelObject.cnsLabel === CnsLabelEn.Name;
    this.searchSubscription = this.getNodes({
      skip: this.skip,
      take: this.pageSize,
      search: searchQuery,
      filterByName: filterByNameValue
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe(response => this.view = response);
  }

  public getNodes(options: { skip?: number; take?: number; search?: string; filterByName?: boolean } = {}): Observable<TilesViewDataResult> {
    const skip: number = options.skip || 0;
    const take: number = options.take || this.navigationBrowserObject.length;

    if (options.search !== undefined) {
      // get full dataset
      const stringifiedNodes: string = JSON.stringify(this.fullBackupNodes);
      if (isNullOrUndefined(stringifiedNodes)) {
        this.nodes = [];
      } else {
        this.nodes = JSON.parse(stringifiedNodes);
      }

      let selectedNodeLength: number = 0;
      // filter dataset
      if (options.search !== '') {
        // Filter strategy 'startsWith' should be decided by the consumer. (startsWith, includes etc.)
        if (options.filterByName) {
          selectedNodeLength = this.selectedObject?.Location?.length || 0;
          this.nodes = this.nodes.filter(n => this.matchTextForSearch(n.Name, options.search, n.Location, selectedNodeLength));

        } else {
          this.nodes = this.nodes.filter(n => this.matchTextForSearch(n.Descriptor, options.search, n.Location, selectedNodeLength));
        }
      }
    }

    return of({
      data: this.nodes.slice(skip, skip + take).map(item => ({ ...item })),
      total: this.nodes.length
    });
  }

  public matchTextForSearch(searchString?: string, keyword?: string, tileLocation?: string, subStringStartLength?: number): boolean {
    return (searchString?.toLowerCase().includes(keyword.trim().toLowerCase()))
      || (tileLocation?.toLowerCase()
        .substring(subStringStartLength, tileLocation.length)
        .includes(keyword.trim().toLowerCase()));
  }

  public onBeforeAttach(): void {
    this.tilesView?.onBeforeAttach();
  }

  private searchAllNodes(selectObj: BrowserObject): void {
    // NOTE: Check Search Option
    this.subscriptions.push(this.systemBrowserService.searchNodes(selectObj.SystemId, this.searchString,
        selectObj.ViewId, undefined, false, true, undefined).subscribe((page: Page) => {
        if (page?.Nodes !== undefined) {
          page.Nodes.forEach(node => {
            if (node.Attributes.ManagedType === GmsManagedTypes.GRAPHIC.id
              || node.Attributes.ManagedType === GmsManagedTypes.GRAPHIC_PAGE.id) {
              const currTileObject: TileObject = new TileObject(null, node);
              this.navigationBrowserObject.push(currTileObject);
            }
          });
          this.view = { data: this.navigationBrowserObject, total: this.navigationBrowserObject.length };
          this.nodes = this.navigationBrowserObject;

          this.fullBackupNodes = JSON.parse(JSON.stringify(this.nodes));
          this.fetchData();
        }
      })
    );
  }
}
