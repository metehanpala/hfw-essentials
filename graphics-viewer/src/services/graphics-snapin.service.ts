import { Injectable } from '@angular/core';
import { SearchConfig, SearchParameters, SearchTypes, TileSearchRequest, TileSearchResponse, View } from '@gms-flex/controls';
import { BrowserObject, CnsHelperService, CnsLabel, ObjectAttributes, Page, SearchOption, SystemBrowserServiceBase, ValueServiceBase, ViewNode } from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { SiToastNotificationService } from '@simpl/element-ng';
import { Observable, Subject, Subscription, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export class TileObject implements BrowserObject {
    public Attributes: ObjectAttributes;
    public Descriptor: string;
    public Designation: string;
    public HasChild: boolean;
    public Name: string;
    public Location: string;
    public ObjectId: string;
    public SystemId: number;
    public ViewId: number;
    public ViewType: number;
    constructor(public iconClass: string, public browserObject: BrowserObject) {
        this.Attributes = browserObject.Attributes;
        this.Descriptor = browserObject.Descriptor;
        this.Designation = browserObject.Designation;
        this.HasChild = browserObject.HasChild;
        this.Name = browserObject.Name;
        this.Location = browserObject.Location;
        this.ObjectId = browserObject.ObjectId;
        this.SystemId = browserObject.SystemId;
        this.ViewId = browserObject.ViewId;
        this.ViewType = browserObject.ViewType;
    }
}

@Injectable()
export class GraphicsSnapinService {
    public selectedObject: BrowserObject;
    public graphicTileSelectionSub: Subject<any> = new Subject<any>();
    public onBeforeAttachSubject: Subject<void> = new Subject<void>();
    public cnsValue: CnsLabel;
    public searchSubscription: Subscription;
    // NOTE: Check search type
    public searchType: number;
    public selectedObjectChanged: boolean;
    public onTileClickSub: Subject<TileObject> = new Subject<TileObject>();

    private _searchString: string;
    public get SearchString(): string {
      return this._searchString;
    }

    public set SearchString(value: string) {
      if (this._searchString !== value) {
        this._searchString = value;
      }
    }

    public clearSearchString(): void {
      this._searchString = '';
    }

    constructor(
        private readonly traceService: TraceService,
        public siToastService: SiToastNotificationService,
        private readonly systemBrowserService: SystemBrowserServiceBase,
        private readonly cnsHelperService: CnsHelperService,
        private readonly searchConfig: SearchConfig
    ) {
        // NOTE: check this out for later
        if (this.cnsHelperService) {
            this.cnsHelperService.activeCnsLabel.subscribe(() => {
                if (!isNullOrUndefined(this.cnsHelperService.activeCnsLabelValue)) {
                    this.cnsValue = this.cnsHelperService.activeCnsLabelValue;
                    const searchConfigObj: any = this.searchConfig.get();
                    searchConfigObj.displayType = this.cnsValue.cnsLabel;
                    this.searchConfig.update(searchConfigObj);
                }
            });
        }
    }

    public getSearchParams(): any {
        // this.traceService.debug();
        const searchParams: SearchParameters = new SearchParameters();
        searchParams.currentPage = 1;
        searchParams.systemId = this.selectedObject.SystemId;
        searchParams.viewId = this.selectedObject.ViewId;
        searchParams.designation = this.selectedObject.Designation;
        searchParams.searchString = '';
        searchParams.searchLimit = 100;
        searchParams.searchType = this.searchType;
        return searchParams;
    }

    public updateCnsValue(cnsValue: CnsLabel): void {
         this.cnsValue = cnsValue;
    }

    public onTileClick(tile: any): void {
        // NOTE: Check how this works out
     this.onTileClickSub.next(tile);
    }

    public setSelectedObject(selectedObject: BrowserObject): void {
        this.selectedObject = selectedObject;
    }

    public GetTargetNavigationBrowserObj(tile: TileObject): Observable<Page> {
        const page: Observable<Page> = this.systemBrowserService.searchNodes(tile.SystemId, tile.Designation, tile.ViewId);
        return page;
    }
}
