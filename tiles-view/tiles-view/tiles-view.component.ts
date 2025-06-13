import { AfterViewInit, Component, ContentChild, ElementRef, HostBinding, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { animationFrameScheduler } from 'rxjs';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import { TilesConfig } from '../config/tiles-config';
import { TilesViewDataResult } from '../models/tilesview-data-result.model';
import { HeaderTemplateDirective } from '../templates/header-template.directive';
import { ItemTemplateDirective } from '../templates/item-template.directive';
import { LoaderTemplateDirective } from '../templates/loader-template.directive';
import { DEFAULT_TILES_CONFIG_L, DEFAULT_TILES_CONFIG_M, DEFAULT_TILES_CONFIG_S } from './default-sizes';

@Component({
  selector: 'hfw-tiles-view',
  templateUrl: './tiles-view.component.html',
  styleUrl: './tiles-view.component.scss',
  standalone: false
})
export class TilesViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @HostBinding('class.hfw-tilesview')
  @HostBinding('class.hfw-flex-container-column')
  @HostBinding('class.hfw-flex-item-grow')
  public className = true;

  @ContentChild(ItemTemplateDirective)
  public itemTemplate!: ItemTemplateDirective;

  @ContentChild(HeaderTemplateDirective)
  public headerTemplate!: HeaderTemplateDirective;

  @ContentChild(LoaderTemplateDirective)
  public loaderTemplate!: LoaderTemplateDirective;

  @ViewChild('container', { static: true })
  public container!: ElementRef<HTMLDivElement>;

  @ViewChild(CdkVirtualScrollViewport)
  public viewport!: CdkVirtualScrollViewport;

  /**
   * Data items used to populate the tiles view.
   */
  @Input() public data!: any[] | TilesViewDataResult;

  /**
   * Enables Angular CDK virtualization when true.
   */
  @Input() public isVirtual = false;

  /**
   * Shows a loading indicator overlay.
   */
  @Input() public loading = false;

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
    this.tilesSettings = { ...DEFAULT_TILES_CONFIG_L, ...this._tilesConfig };
    this.rowHeight = this.tilesSettings.tileHeight + 2 * this.tilesSettings.topBottomMargin;
    this.calculateRows();
  }

  public tilesSettings: TilesConfig = { ...DEFAULT_TILES_CONFIG_L };

  /** height of each row used by the viewport */
  public rowHeight = this.tilesSettings.tileHeight + 2 * this.tilesSettings.topBottomMargin;

  public itemsPerRow = 1;

  public rows: any[][] = [];

  private resizeObserver?: ResizeObserver;

  public readonly trackByIndex = (index: number): number => index;

  private _tilesConfig!: TilesConfig;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['tileSize']) {
      this.calculateRows();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calculateRows();
  }

  ngAfterViewInit(): void {
    this.calculateRows();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.calculateRows());
      this.resizeObserver.observe(this.container.nativeElement);
    }
  }

  public get items(): any[] {
    if (!this.data) {
      return [];
    }
    return Array.isArray(this.data) ? this.data : this.data.data;
  }

  private calculateItemsPerRow(): void {
    const width = this.container.nativeElement.clientWidth;
    const itemWidth = this.tilesSettings.tileWidth + 2 * this.tilesSettings.leftRightMargin;
    const cols = Math.floor(width / itemWidth);
    this.itemsPerRow = cols > 0 ? cols : 1;
  }

  public calculateRows(): void {
    this.calculateItemsPerRow();
    const result: any[][] = [];
    const items = this.items;
    for (let i = 0; i < items.length; i += this.itemsPerRow) {
      result.push(items.slice(i, i + this.itemsPerRow));
    }
    this.rows = result;
    if (this.isVirtual && this.viewport) {
      animationFrameScheduler.schedule(() => this.viewport.checkViewportSize());
    }
  }

  /**
   * Called just before the component is reattached to the DOM.
   * Restores the previous scroll position and recalculates rows.
  */
  public onBeforeAttach(): void {
    const top = this.getScrollTop();
    animationFrameScheduler.schedule(() => {
      this.calculateRows();
      if (this.isVirtual && this.viewport) {
        this.viewport.checkViewportSize();
      }
      if (top !== null && top > 0) {
        this.scrollTo(top);
      }
    });
  }

  /**
   * Retrieves the current vertical scroll position of the tiles view.
   * When virtualization is enabled, the scroll offset of the CDK viewport is used.
   */
  public getScrollTop(): number | null {
    if (this.isVirtual && this.viewport) {
      return this.viewport.measureScrollOffset();
    }
    return this.container ? this.container.nativeElement.scrollTop : null;
  }

  /**
   * Programmatically scrolls the tiles view to the provided vertical offset.
   * Uses the CDK viewport when virtualization is active.
   */
  public scrollTo(scrollTop: number): void {
    if (this.isVirtual && this.viewport) {
      this.viewport.scrollToOffset(scrollTop);
    } else if (this.container) {
      this.container.nativeElement.scrollTop = scrollTop;
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}

