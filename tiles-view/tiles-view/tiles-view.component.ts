/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
import {
  AfterViewInit, Component, ContentChild, ElementRef, EventEmitter, HostBinding,
  Inject,
  InjectionToken,
  Input, NgZone, OnChanges, OnDestroy, OnInit, Output, Renderer2, SimpleChanges, ViewChild
} from '@angular/core';
import { AppSettings, AppSettingsService, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { ResizeObserverService } from '@simpl/element-ng';
import { animationFrameScheduler, fromEvent, Observable, Subject, Subscription } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { TraceModules } from '../../shared/trace-modules';
import { TilesConfig } from '../config/tiles-config';
import { TileScrolledEvent } from '../events/scroll-event-args.model';
import { TilesViewDataResult } from '../models/tilesview-data-result.model';
import { RowHeightService } from '../scrolling/row-height.service';
import { Action, PageAction, ScrollAction, ScrollerService } from '../scrolling/scroller.service';
import { HeaderTemplateDirective } from '../templates/header-template.directive';
import { ItemTemplateDirective } from '../templates/item-template.directive';
import { LoaderTemplateDirective } from '../templates/loader-template.directive';
import { DEBUG_LOG, isChanged, isPresent } from '../utils';
import { DEFAULT_TILES_CONFIG_L, DEFAULT_TILES_CONFIG_M, DEFAULT_TILES_CONFIG_S } from './default-sizes';

export const SCROLLER_FACTORY_TOKEN = new InjectionToken<string>('tiles-scroll-service-factory');

export const defaultScrollerFactory = (observable: Observable<any>): ScrollerService => new ScrollerService(observable);

const translateY = (renderer: any, value: any) => (el: any): any => renderer.setStyle(el, 'transform', `translateY(${value}px)`);
const maybeNativeElement = (el: any): any => el ? el.nativeElement : null;

@Component({
  providers: [
    {
      provide: SCROLLER_FACTORY_TOKEN,
      useValue: defaultScrollerFactory
    }
  ],
  selector: 'hfw-tiles-view',
  templateUrl: './tiles-view.component.html',
  styleUrl: './tiles-view.component.scss',
  standalone: false
})
export class TilesViewComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @HostBinding('class.hfw-tilesview')
  @HostBinding('class.hfw-flex-container-column')
  @HostBinding('class.hfw-flex-item-grow')
  public className = true;

  /**
   *
   */
  @ContentChild(ItemTemplateDirective)
  public itemTemplate!: ItemTemplateDirective;

  /**
   *
   */
  @ContentChild(HeaderTemplateDirective)
  public headerTemplate!: HeaderTemplateDirective;

  /**
   *
   */
  @ContentChild(LoaderTemplateDirective)
  public loaderTemplate!: LoaderTemplateDirective;

  @ViewChild('table') public table!: ElementRef;
  @ViewChild('container', { static: true } as any) public container!: ElementRef;

  /**
   * The data collection that will be used to popuplate the passed item template.
   */
  @Input() public data!: any[] | TilesViewDataResult;

  /**
   * Specifies if the virtualization of the TilesView is active.
   * If yes renders a portion of the data of the same value of the pageSize(optimized rendering) while the user is scrolling the content.
   */
  @Input() public isVirtual = false;

  /**
   * Specifies if the loading indicator of the TilesView will be displayed.
   */
  @Input() public loading = false;

  /**
   * Defines the number of data items per page.
   * This cannot be changed runtime
   */
  @Input() public pageSize = 20;

  /**
   * Defines the number of records to be skipped by the tiles view (the index of the first item virtually loaded).
   */
  @Input() public skip = 0;

  /**
   * Configures tiles item size ('s', 'm', 'l').
   */
  @Input() public set tileSize(size: string) {
    this._tilesConfig =
      size === 's'
        ? DEFAULT_TILES_CONFIG_S
        : size === 'm'
          ? DEFAULT_TILES_CONFIG_M
          : size === 'l'
            ? DEFAULT_TILES_CONFIG_L
            : null!;

    if (this._tilesConfig === null) {
      return;
    }
    this.tilesSettings = Object.assign({}, DEFAULT_TILES_CONFIG_L, this._tilesConfig);
    this.rowHeight = this.tilesSettings.tileHeight + 2 * this.tilesSettings.topBottomMargin;
  }

  public tilesSettings: TilesConfig = Object.assign({}, DEFAULT_TILES_CONFIG_L);

  /**
   * Fires when the page changes due scrolling.
   * You have to handle the event yourself and page the data.
   */
  @Output() public readonly scrollPageChange: EventEmitter<TileScrolledEvent> = new EventEmitter();

  public skipScroll!: boolean;

  /**
   * Gets the data items passed to the TilesView.
   * If a TilesViewDataResult is passed, the data value is used. If an array is passed - it's directly used.
   */
  public get items(): any[] {
    if (!isPresent(this.data)) {
      return [];
    }
    return Array.isArray(this.data) ? this.data : this.data.data;
  }

  /**
   * Gets the total number of records passed to the TilesView.
   * If a TilesViewDataResult is passed, the total value is used. If an array is passed - its length is used.
   */
  public get total(): number {
    if (!isPresent(this.data)) {
      return 0;
    }
    return Array.isArray(this.data) ? this.data.length : this.data.total;
  }

  public totalHeight!: number;
  public placeHolders: number[] = [];

  public itemsPerRow!: number;
  // public translates: string[];

  private scroller!: ScrollerService;
  private subscriptions!: Subscription;
  private scrollerSubscription!: Subscription;

  private rowHeightService!: RowHeightService;

  private readonly dispatcher: Subject<any> = new Subject<any>();
  private rowHeight!: number;

  private lastTotal!: number;
  private lastTake!: number;
  private pendingPageChangeForResize!: boolean;

  private readonly resizeSubject: Subject<any> = new Subject<any>();
  private lastViewableRows!: number;

  private lastFirstIndexInViewport!: number;

  private _tilesConfig!: TilesConfig;

  private isAtBottom = false; // Flag to track if already reached the bottom
  private isAtTop = false; // Flag to track if already reached the top

  private resizeSubs?: Subscription;

  public readonly trackByIndex = (index: number): number => index;

  constructor(@Inject(SCROLLER_FACTORY_TOKEN) private readonly scrollerFactory: any,
    public ngZone: NgZone,
    private readonly resizeObserver: ResizeObserverService,
    private readonly renderer: Renderer2,
    private readonly tileViewContainer: ElementRef,
    private readonly traceService: TraceService,
    private readonly appSettingsService: AppSettingsService) {
    if (DEBUG_LOG) {
      this.traceService.debug(TraceModules.tilesView, 'resizeElement log just to keep the container %s', this.tileViewContainer !== null);
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.isVirtual) {
      if (isChanged('data', changes, false)) {
        if (DEBUG_LOG) {
          this.traceService.debug(TraceModules.tilesView, 'ngOnChanges: data changed.');
        }
        if (this.pendingPageChangeForResize) {
          const firstItem = this.lastFirstIndexInViewport ?? this.skip/* firstItemLoaded*/;
          this.resetScrolling(this.skip, firstItem);
          this.pendingPageChangeForResize = false;
        } else {
          this.notPendingPageChangeForResize();
        }
      } else {
        this.isChangedTileSizeOrSkip(changes);
      }
    }
  }

  public ngOnInit(): void {
    if (this.isVirtual) {
      if (this.scroller === undefined) {
        this.scroller = this.scrollerFactory(this.dispatcher);
        this.initResizeObserver();
      }
      this.init();
    }
  }

  public calculatePlaceholders(): void {
    const delta = (this.skip === 0) ? 0 : this.skip % this.itemsPerRow;
    if (delta !== this.placeHolders.length) {
      if (DEBUG_LOG) {
        this.traceService.debug(TraceModules.tilesView, 'creating placeholder %s', delta);
      }
      this.placeHolders = new Array(delta);
    }
  }

  public ngAfterViewInit(): void {
    if (this.isVirtual) {
      if (this.skip) {
        this.container.nativeElement.scrollTop = this.rowHeightService.offset(this.skip)
          * this.rowHeightService.itemsPerRow;
      }
      this.handleScrollBarPositionOnResize();
    }
  }

  public ngOnDestroy(): void {
    this.resizeSubs?.unsubscribe();
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
    if (this.isVirtual) {
      this.cleanupScroller();
    }
  }

  /**
   * Handles changes in tile size or skip property, triggering relevant actions.
   * @param changes - The `SimpleChanges` object containing information about changes to input properties.
   * @remarks
   * This method is called within the ngOnChanges to handle changes in the 'tileSize' or 'skip' input properties.
   * If the 'tileSize' property has changed, initializes the grid with the first item at the current scroll position,
   * and sets the vertical scroll position to the corresponding offset. If the 'skip' property has changed, it triggers
   * the calculation of placeholders to ensure proper rendering.
   */
  public isChangedTileSizeOrSkip(changes: SimpleChanges): void {
    // Check if the 'tileSize' property has changed
    if (isChanged('tileSize', changes, true)) {
      if (DEBUG_LOG) {
        this.traceService.debug(TraceModules.tilesView, 'ngOnChanges: tileSize changed.');
      }
      // Get the index of the first item at the current scroll position
      const firstItemIndex = this.scroller.getFirstItemIndex(this.container.nativeElement.scrollTop);
      // Initialize the grid with the first item at the current scroll position
      this.init(firstItemIndex);
      // Calculate the index offset of the first item and set the vertical scroll position to the corresponding offset
      const firstItemIndexOffset = Math.floor(firstItemIndex / this.rowHeightService.itemsPerRow);
      this.container.nativeElement.scrollTop = this.rowHeightService.offset(firstItemIndexOffset);
    } else {
      // Check if the 'skip' property has changed
      if (isChanged('skip', changes, true)) {
        // Trigger the calculation of placeholders to ensure proper rendering
        this.calculatePlaceholders();
      }
    }
  }

  /**
   * Handles the scenario when a page change is not pending due to resize, ensuring proper grid initialization.
   * @remarks
   * This method is called to handle the scenario when a page change is not pending due to a resize operation. It checks
   * whether there have been changes in the total number of items or the page size. If changes are detected, it initializes
   * the virtual scroller and the resize observer if they are not already initialized. Additionally, it resets the scrolling
   * to the initial position, ensuring that the correct set of items is displayed. Finally, it updates the last recorded
   * total and page size values for future comparisons.
   * @param lastTotal - The last recorded total number of items in the dataset.
   * @param lastTake - The last recorded page size.
   * @param total - The current total number of items in the dataset.
   * @param pageSize - The current page size.
   * @param skip - The number of items to skip for the current page.
   * @param scroller - The virtual scroller instance.
   * @param scrollerFactory - The factory method for creating a virtual scroller.
   * @param dispatcher - The dispatcher for managing actions in the virtual scroller.
   * @param initResizeObserver - The method to initialize the resize observer.
   * @param resetScrolling - The method to reset the scrolling after changes in the total or page size.
   */
  public notPendingPageChangeForResize(): void {
    // Check if there are changes in the total number of items or the page size
    if (this.lastTotal !== this.total || this.lastTake !== this.pageSize) {
      // Initialize the virtual scroller and the resize observer if not already initialized
      if (this.scroller === undefined) {
        this.scroller = this.scrollerFactory(this.dispatcher);
        this.initResizeObserver();
      }
      // Reset the scrolling to the initial position
      this.resetScrolling(this.skip, this.skip);
    }
    // Update the last recorded total and page size values for future comparisons
    this.lastTotal = this.total;
    this.lastTake = this.pageSize;
  }

  public init(startIndex?: number): void {
    this.itemsPerRow = this.calculateViewableColumns();
    this.calculatePlaceholders();
    this.lastViewableRows = this.calculateViewableRows();
    this.rowHeightService = new RowHeightService(this.total, this.rowHeight, this.itemsPerRow, this.traceService);
    this.totalHeight = this.rowHeightService.totalHeight();

    this.ngZone.runOutsideAngular(this.createScroller.bind(this, startIndex));
  }

  /**
   * Executes necessary operations just before the grid element is attached to the DOM.
   * @remarks
   * This method is called just before the grid element is attached to the DOM. It ensures that the vertical scroll position
   * of the grid is restored to its previous value (if applicable) and triggers any necessary actions related to the element's
   * resizing. The restoration of the scroll position is particularly useful when the grid element is reattached, maintaining
   * a consistent user experience.
   */
  public onBeforeAttach(): void {
    // Restore the vertical scroll position just prior to the attach operation
    this.restoreScrollOnAttach(this.container);

    // Trigger any necessary actions related to the resizing of the element
    this.onElementResize();
  }

  /**
   * Retrieves the current vertical scroll position of the grid element.
   * @returns The current vertical scroll position or null if the grid element is not available.
   * @remarks
   * This method returns the current vertical scroll position of the grid element, or null if the grid element is not available.
   */
  public getScrollTop(): number | null {
    return this.container ? this.container.nativeElement.scrollTop : null;
  }

  /**
   * Scrolls the grid element to the specified vertical scroll position.
   * @param scrollTop - The desired vertical scroll position to which the grid element should be scrolled.
   * @remarks
   * This method scrolls the grid element to the specified vertical scroll position. If the grid element is not available,
   * the method does nothing. This is useful for programmatically controlling the scroll position of the grid.
   */
  public scrollTo(scrollTop: number): void {
    if (this.container) {
      this.container.nativeElement.scrollTop = scrollTop;
    }
  }

  /**
   * Restores the vertical scroll position of a grid element just prior to its reset during the attach operation.
   * @param el - The ElementRef representing the grid element.
   * @remarks
   * This method is called to restore the vertical scroll position of a grid element after it has been attached to the DOM.
   * If the provided element or its native element is not available, the method returns early.
   *
   * The method retrieves the vertical scroll position just before it was reset by the attach operation. If the scroll position
   * is greater than 0, it schedules the scroll position to be restored after the attach operation and just prior to the view rendering,
   * using the `animationFrameScheduler` to optimize performance.
   */
  private restoreScrollOnAttach(el: ElementRef): void {
    // Check if the provided element or its native element is not available
    if (!el || !el.nativeElement) {
      return;
    }
    // Get the grid's vertical scroll position just prior to it being reset by the attach operation
    const top: number = el.nativeElement.scrollTop ?? 0;
    // If the scroll position is greater than 0, schedule its restoration after the attach operation
    if (top > 0) {
      // Schedule scroll position restoration just prior to view rendering
      animationFrameScheduler.schedule(() => {
        el.nativeElement.scrollTop = top;
      });
    }
  }

  /**
   * Calculates the number of viewable columns based on the current width of the container pane.
   *
   * @returns The calculated number of viewable columns.
   *
   * @remarks
   * This method takes into account the tile width and left/right margins of the tiles, using the container's
   * client width. It ensures a minimum of one column if the calculated value is zero.
   */
  private calculateViewableColumns(): number {
    // Get the current width of the container pane
    const width: number = this.container.nativeElement.clientWidth;
    // Calculate the number of items (tiles) that can fit in a row
    const itemsPerRow: number = Math.floor(width / (this.tilesSettings.tileWidth + 2 * this.tilesSettings.leftRightMargin));
    // Ensure a minimum of one column
    return itemsPerRow !== 0 ? itemsPerRow : 1;
  }

  /**
   * Calculates the number of viewable rows based on the current height of the container pane.
   *
   * @returns The calculated number of viewable rows.
   *
   * @remarks
   * This method takes into account the tile height and top/bottom margins of the tiles, using the container's
   * client height. It ensures a minimum of one row if the calculated value is zero.
   */
  private calculateViewableRows(): number {
    // Get the current height of the container pane
    const height: number = this.container.nativeElement.clientHeight;
    // Calculate the number of rows that can fit in the available height
    const rows: number = Math.floor(height / (this.tilesSettings.tileHeight + 2 * this.tilesSettings.topBottomMargin));
    // Ensure a minimum of one row
    return rows !== 0 ? rows : 1;
  }

  /**
   * Handles the adjustment of the scrollbar position upon resizing the container pane containing hfw-tiles.
   *
   * When the column count changes within the container pane, this method is triggered to maintain the
   * scroll position of the hfw-tiles. The goal is to keep the scrollbar at its last position to provide
   * a consistent view for the user after the resize event.
   *
   * @param event - The mock scroll event triggered on the container pane as it seems the functionality was configured this way.
   * @returns The target element of the provided event.
   */
  private handleScrollBarPositionOnResize(): any {
    this.ngZone.runOutsideAngular(() => {
      this.subscriptions = fromEvent(this.container.nativeElement, 'scroll')
        .pipe(
          startWith(null), // This triggers the observable at initialization
          filter(() => {
            const scrollTop = this.container.nativeElement.scrollTop;
            const scrollHeight = this.container.nativeElement.scrollHeight;
            const offsetHeight = this.container.nativeElement.offsetHeight;

            if (this.total < this.pageSize) {
              return false;
            }

            const atBottom = (scrollHeight / this.total) * this.pageSize <= scrollTop;
            const atTop = (scrollHeight / this.total) * (this.total - this.pageSize) >= scrollTop;

            if (atBottom && !this.isAtBottom) {
              this.isAtBottom = true;
              return true;
            }

            if (atTop && !this.isAtTop) {
              this.isAtTop = true;
              return true;
            }

            this.isAtBottom = atBottom ? this.isAtBottom : false;
            this.isAtTop = atTop ? this.isAtTop : false;

            if (DEBUG_LOG) {
              this.traceService.debug(
                TraceModules.tilesView,
                'TilesView.Component scroll event skipped, not at bottom: scrollTop=%s, scrollHeight=%s, offsetHeight=%s',
                scrollTop, scrollHeight, offsetHeight
              );
            }

            return false;
          }),
          map((event: any) => {
            if (DEBUG_LOG) {
              this.traceService.debug(TraceModules.tilesView, 'TilesView firing container scroll event at bottom!');
            }
            if (!this.isAtTop) {
              this.lastFirstIndexInViewport = this.scroller.getFirstItemIndex(this.container.nativeElement.scrollTop);
              return event?.target;
            } else {
              const nonVisibleBuffer = Math.floor(this.pageSize * 0.3);
              this.lastFirstIndexInViewport = this.scroller.getFirstItemIndex(100);
              const firstItem = this.lastFirstIndexInViewport ?? this.skip;
              this.emittingPageChange(firstItem, nonVisibleBuffer);
              return event?.target;
            }
          })
        )
        .subscribe(this.dispatcher);

      if (DEBUG_LOG) {
        this.traceService.debug(
          TraceModules.tilesView,
          'TilesView firing container scroll event handling for bottom detection!'
        );
      }
      // Set the initial scroll position without waiting for a scroll event
      this.lastFirstIndexInViewport = this.scroller.getFirstItemIndex(this.container.nativeElement.scrollTop);
    });
  }

  /**
   * Creates and configures a virtual scroller instance, initiating the handling of scroll and page change events.
   *
   * @param startIndex - Optional index specifying the initial position in the dataset.
   *
   * @remarks
   * This method first performs cleanup by unsubscribing from any existing scroller subscription and destroying
   * the current virtual scroller instance. It then creates a new virtual scroller instance, configures it with
   * necessary parameters, and subscribes to its observable for handling page and scroll actions.
   *
   * @param firstItem - The index of the first item in the viewport, determined by the provided `startIndex` or the current `skip` value.
   * @param observable - The observable stream of actions emitted by the virtual scroller.
   *
   * @see {@link cleanupScroller} for the cleanup operations performed before creating a new scroller instance.
   */
  private createScroller(startIndex?: number): void {
    // Perform cleanup operations before creating a new scroller instance
    this.cleanupScroller();

    // Determine the index of the first item in the viewport
    const firstItem: number = startIndex ?? this.skip;

    // Create an observable stream of actions from the virtual scroller
    const observable: Observable<Action> = this.scroller.create(
      this.rowHeightService,
      this.skip,
      this.pageSize,
      this.total,
      this.traceService,
      firstItem
    );

    // Reset the skipScroll flag to false
    this.skipScroll = false;

    // Subscribe to the observable stream for handling page change events
    this.scrollerSubscription = observable.pipe(
      filter((x: Action) => x instanceof PageAction),
      filter(() => {
        // Check and reset the skipScroll flag to prevent duplicate page change events
        const temp = this.skipScroll;
        this.skipScroll = false;
        return !temp;
      })
    ).subscribe(x => this.ngZone.run(() => {
      // Emit page change event and log debug information if DEBUG_LOG is enabled
      if (DEBUG_LOG) {
        this.traceService.debug(TraceModules!.tilesView, 'tiles-view emitting pageChange.');
      }
      this.scrollPageChange.emit(x as PageAction)!;
    }));

    // Add a subscription for handling scroll actions
    this.scrollerSubscription!.add(
      observable.pipe(
        filter((x: Action) => x instanceof ScrollAction)
      ).subscribe(this.scroll.bind(this) as any)
    );

  }

  /**
   * Performs cleanup operations for the virtual scroller instance and its associated subscription.
   * If a subscription to the virtual scroller or instance exists, they are destroyed.
   *
   * @remarks
   * This method is called during component destruction or when the virtual scroller is no longer needed.
   */
  private cleanupScroller(): void {
    // Unsubscribe from the virtual scroller subscription if it exists
    if (this.scrollerSubscription) {
      this.scrollerSubscription.unsubscribe();
    }

    // Destroy the virtual scroller instance if it exists
    if (this.scroller) {
      this.scroller.destroy();
    }
  }

  /**
   * Handles the scroll action by applying a vertical offset to the grid element.
   * @param offset - The vertical offset value indicating the change in scroll position.
   * @remarks
   * This method is called in response to a scroll action, specifically when the grid is in virtual scrolling mode.
  .* The vertical offset is then applied to the grid element's transform property, causing a visual translation
   * in the vertical direction. This is particularly useful for achieving the appearance of scrolling while
   * efficiently handling a large dataset without rendering all items at once.
   */
  private scroll({ offset = 0 }: ScrollAction): void {
    // Check if the grid is configured for virtual scrolling
    if (this.isVirtual) {
      if (DEBUG_LOG) {
        this.traceService.debug(TraceModules.tilesView, 'tilesView scroll!! offset: %s', offset);
      }
      // Apply the vertical offset to the transform property of the grid element
      [
        maybeNativeElement(this.table)
      ].filter(isPresent).forEach(translateY(this.renderer, offset));
    }
  }

  /**
   * Handles the necessary actions when a resize event occurs on the container pane containing hfw-tiles.
   * If the resize operation results in a change of the column count for the hfw-tiles, the following steps are executed:
   *
   * 1. Calculates the new number of viewable columns and rows after the resize.
   * 2. Compares the new viewable columns and rows with the previous values.
   * 3. If there is a change in either columns or rows:
   *    a. Retrieves the index of the first loaded item and the index of the first item currently in the viewport.
   *    b. Checks if the new viewable columns exceed the current items per row.
   *       i. If exceeded, checks if the buffer is granted for the first visible item.
   *          - If not granted, calculates a page with an adequate buffer and emits a page change event.
   *       ii. If the buffer is granted or the viewable columns are less than or equal to the current items per row,
   *           resets the scrolling to the first loaded item.
   * 4. Ensures that the scrollbar remains at its last position after the resize.
   *
   * @remarks
   * The `calculateViewableColumns`, `calculateViewableRows`, `resetScrolling`, and `handleScrollBarPositionOnResize` methods
   * are utilized in the process.
   */
  private onResize(): void {
    // Calculate new viewable columns and rows after the resize
    const newViewableColumns = this.calculateViewableColumns();
    const newViewableRows = this.calculateViewableRows();
    // Check if there is a change in viewable columns or rows
    if (newViewableColumns !== this.itemsPerRow || newViewableRows !== this.lastViewableRows) {
      // Ensure that the scrollbar remains at its last position after the resize
      this.handleScrollBarPositionOnResize();
      // Retrieve the index of the first loaded item and the index of the first item currently in the viewport
      const firstItemLoaded = this.skip;
      const firstItem = this.lastFirstIndexInViewport ?? firstItemLoaded;
      // Check if the new viewable columns exceed the current items per row
      if (newViewableColumns > this.itemsPerRow) {
        // Check if the buffer is granted for the first visible item
        const isBufferSizeGrant = this.scroller.isBufferGrant(firstItem, newViewableColumns);
        if (!isBufferSizeGrant) {
          // Calculate a page with an adequate buffer and emit a page change event
          let nonVisibleBuffer = Math.floor(this.pageSize * 0.3);
          const remainder = nonVisibleBuffer % newViewableColumns;
          nonVisibleBuffer += (newViewableColumns - remainder);
          this.emittingPageChange(firstItem, nonVisibleBuffer);
        } else {
          // Reset scrolling to the first loaded item
          this.resetScrolling(firstItemLoaded, firstItem);
        }
      } else {
        // Reset scrolling to the first loaded item
        this.resetScrolling(firstItemLoaded, firstItem);
      }
    }
  }

  /**
   * Emits a page change event with adjusted parameters, preparing for virtual scrolling after a resize operation.
   * @param firstItem - The index of the first item currently in the viewport.
   * @param nonVisibleBuffer - The calculated non-visible buffer size for adjusting the first item in the emitted page change event.
   * @remarks
   * This method is called when the buffer size is not granted for the first visible item after a resize operation with
   * an increased number of viewable columns. It calculates the adjusted parameters for the page change event, taking
   * into account the non-visible buffer size. The `pendingPageChangeForResize` flag is set to true to indicate that
   * a page change event is pending due to a resize operation. The actual emission of the page change event is wrapped
   * in an Angular zone run to ensure proper change detection.
   * @param firstItemInPage - The adjusted index of the first item in the emitted page change event.
   * @param DEBUG_LOG - Logs debug information if DEBUG_LOG is enabled.
   * @param traceService - The service for tracing and logging.
   * @param scrollPageChange - The EventEmitter for emitting page change events.
   * @param ngZone - The Angular zone for running code in the context of Angular's change detection.
   * @param pageSize - The size of each page in the virtual scrolling context.
   * @param PageAction - The action representing a page change event in the virtual scroller.
   */
  private emittingPageChange(firstItem: number, nonVisibleBuffer: number): void {
    // Calculate the adjusted index of the first item in the emitted page change event
    const firstItemInPage = Math.max(firstItem - nonVisibleBuffer, 0);
    // Set the flag to indicate a pending page change due to a resize operation
    this.pendingPageChangeForResize = true;
    // Run the emission of the page change event in the Angular zone to ensure proper change detection
    this.ngZone.run(() => {
      if (DEBUG_LOG) {
        this.traceService.debug(TraceModules.tilesView, 'tiles-view emitting pageChange.');
      }
      // Emit the page change event with adjusted parameters
      this.scrollPageChange.emit(new PageAction(firstItemInPage, this.pageSize));
    });
  }

  /**
   * Initializes a resize observer to monitor changes in the size of the tile view container.
   * @remarks
   * This method sets up a resize observer to track changes in the size of the tile view container. It uses the
   * `resizeObserver` service to observe the specified container, with an optional throttle time for efficiency.
   * When a resize event is detected, the `onElementResize` method is invoked. Additionally, the method subscribes
   * to the observable stream of the resize subject to trigger the `onResize` method whenever an element resize is
   * detected. This ensures that components or features responding to the resize events are appropriately notified.
   * @param appSettingsService - The service for retrieving application settings, including the resize throttle time.
   * @param resizeObserver - The service providing the resize observer functionality.
   * @param tileViewContainer - The ElementRef representing the tile view container element.
   * @param resizeSubject - The subject responsible for broadcasting element resize events.
   * @param onElementResize - The method to be triggered when an element resize is detected.
   * @param onResize - The method to be triggered when an element resize is reported through the resize subject.
   * @param resizeSubs - The subscription to the resize observer.
   */
  private initResizeObserver(): void {
    // Retrieve application settings, including the resize throttle time
    const settings: AppSettings = this.appSettingsService.getAppSettingsValue();
    // Set the default resize throttle time if application settings are not available
    let resizeThrottleTime: number;
    if (isNullOrUndefined(settings)) {
      resizeThrottleTime = 100;
    }
    // Observe the tile view container for resize events using the resize observer
    this.resizeSubs = this.resizeObserver
      .observe(this.tileViewContainer.nativeElement, resizeThrottleTime!, true, true)
      .subscribe(() => this.onElementResize());
    // Subscribe to the observable stream of the resize subject to trigger the onResize method
    this.resizeSubject.asObservable().subscribe(() => {
      this.onResize();
    });
  }

  /**
   * Resets the scrolling of the grid after a resize operation, ensuring the correct display of items.
   * @param firstItemLoaded - The index of the first loaded item in the dataset.
   * @param firstItem - The index of the first item currently in the viewport.
   * @remarks
   * This method is called to reset the scrolling of the grid after a resize operation, ensuring that the correct set of
   * items is displayed in the viewport. It initiates the necessary initialization steps, calculates the index offset of
   * the first item in the viewport, and sets the vertical scroll position to the corresponding offset. The operation is
   * wrapped in a zone run to ensure proper change detection and performance improvement.
   *
   * @param firstItemIndexOffset - The calculated index offset of the first item in the viewport.
   */
  private resetScrolling(firstItemLoaded: number, firstItem: number): void {
    // Run the operation in the Angular zone to ensure proper change detection
    this.ngZone.run(() => {
      // Initialize the grid with the first loaded item
      this.init(firstItemLoaded);
      // Calculate the index offset of the first item in the viewport
      const firstItemIndexOffset = Math.floor(firstItem / this.rowHeightService.itemsPerRow);
      if (DEBUG_LOG) {
        this.traceService.debug(
          TraceModules.tilesView,
          'tiles-view: setting scroll top after resize to firstItemIndex:%s firstItemIndexOffset: %s',
          firstItem,
          firstItemIndexOffset
        );
      }
      // Set the vertical scroll position to the calculated offset
      this.container.nativeElement.scrollTop = this.rowHeightService.offset(firstItemIndexOffset);
    });
  }

  /**
   * Triggers the handling of element resize by notifying the resize subject.
   * @param resizeSubject - The subject responsible for broadcasting element resize events.
   */
  private onElementResize(): void {
    this.resizeSubject.next(this.container);
  }

}
