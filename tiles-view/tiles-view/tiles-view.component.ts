/* eslint-disable @typescript-eslint/member-ordering */
/**
 * TilesViewComponent
 * ------------------
 * A reusable, configurable Angular component for displaying large collections of data as a grid of tiles.
 * Supports Angular CDK virtualization for efficient rendering of thousands of items.
 *
 * Features:
 *  - Dynamically calculates grid layout based on available container width and tile size.
 *  - Supports 'small', 'medium', and 'large' tile configurations.
 *  - Allows custom templates for item, header, and loading states via directives.
 *  - Optionally displays a loading overlay.
 *  - Efficiently manages rows and columns for performant tile rendering, integrating with Angular's CDK Virtual Scroll.
 *
 * Typical usage scenario: presenting many data items (hundreds or thousands) as clickable, customizable tile "cards" in a responsive layout.
 *
 * @input data       Data source for tiles. Can be a flat array or TilesViewDataResult with a 'data' property.
 * @input isVirtual  If true, uses Angular CDK virtualization for performance.
 * @input loading    Shows a loading overlay if true.
 * @input tileSize   Configures tile sizes ('s', 'm', 'l').
 *
 * @contentChild ItemTemplateDirective     Template for rendering each tile item.
 * @contentChild HeaderTemplateDirective   Template for the tiles grid header.
 * @contentChild LoaderTemplateDirective   Template for the loading overlay.
 *
 * @viewChild container  Reference to the tiles container for layout calculations.
 * @viewChild viewport   Reference to the CDK virtual scroll viewport.
 *
 * Responsive to window resize, changes to data, or tile size.
 */

import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges, ViewChild
} from '@angular/core';
import { animationFrameScheduler } from 'rxjs';

import { TilesConfig } from '../config/tiles-config';
import { TilesViewDataResult } from '../models/tilesview-data-result.model';
import { HeaderTemplateDirective } from '../templates/header-template.directive';
import { ItemTemplateDirective } from '../templates/item-template.directive';
import { LoaderTemplateDirective } from '../templates/loader-template.directive';
import {
  DEFAULT_TILES_CONFIG_L,
  DEFAULT_TILES_CONFIG_M,
  DEFAULT_TILES_CONFIG_S
} from './default-sizes';

@Component({
  selector: 'hfw-tiles-view',
  templateUrl: './tiles-view.component.html',
  styleUrl: './tiles-view.component.scss',
  standalone: false
})
export class TilesViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  /**
   * Binds styling classes for flex column layout and tile view container.
   */
  @HostBinding('class.hfw-tilesview')
  @HostBinding('class.hfw-flex-container-column')
  @HostBinding('class.hfw-flex-item-grow')
  public className = true;

  /**
   * ContentChild: Custom item template for each tile (required).
   */
  @ContentChild(ItemTemplateDirective)
  public itemTemplate!: ItemTemplateDirective;

  /**
   * ContentChild: Optional header template for the tiles view.
   */
  @ContentChild(HeaderTemplateDirective)
  public headerTemplate!: HeaderTemplateDirective;

  /**
   * ContentChild: Optional loader template to show when loading.
   */
  @ContentChild(LoaderTemplateDirective)
  public loaderTemplate!: LoaderTemplateDirective;

  /**
   * ViewChild: Reference to the main tiles container <div> (for layout calculations).
   */
  @ViewChild('container', { static: true })
  public container!: ElementRef<HTMLDivElement>;

  /**
   * ViewChild: Reference to the Angular CDK virtual scroll viewport.
   */
  @ViewChild(CdkVirtualScrollViewport)
  public viewport!: CdkVirtualScrollViewport;

  /**
   * @input data - The dataset to render. Can be an array or an object with a 'data' property.
   */
  @Input() public data!: any[] | TilesViewDataResult;

  /**
   * @input isVirtual - Enables Angular CDK virtualization for rendering (default: true).
   */
  @Input() public isVirtual = true;

  /**
   * @input loading - When true, overlays a loading indicator.
   */
  @Input() public loading = false;

  /**
   * @input tileSize - Controls tile size ('s', 'm', 'l'). Updates config and recalculates layout.
   * @param size 's' | 'm' | 'l'
   */
  @Input()
  public set tileSize(size: string) {
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

    // Merge with defaults to allow extensibility.
    this.tilesSettings = { ...DEFAULT_TILES_CONFIG_L, ...this._tilesConfig };
    this.rowHeight =
      this.tilesSettings.tileHeight +
      2 * this.tilesSettings.topBottomMargin;
    this.calculateRows();
  }

  /**
   * Tiles layout configuration (dimensions, margins, etc).
   */
  public tilesSettings: TilesConfig = { ...DEFAULT_TILES_CONFIG_L };

  /**
   * Height of each row, including vertical margins. Used for viewport calculations.
   */
  public rowHeight =
    this.tilesSettings.tileHeight + 2 * this.tilesSettings.topBottomMargin;

  /**
   * Number of tiles per row, calculated dynamically based on container width and tile size.
   */
  public itemsPerRow = 1;

  /**
   * Array of rows, each row is an array of items for rendering the grid.
   */
  public rows: any[][] = [];

  /**
   * Angular trackBy function for efficient rendering in ngFor.
   * @param index Index of item in the array.
   * @returns Index number (unique key).
   */
  public readonly trackByIndex = (index: number): number => index;

  /**
   * Private storage for the selected tiles config.
   */
  private _tilesConfig!: TilesConfig;

  /**
   * Resize observer
   */
  private resizeObserver?: ResizeObserver;

  /**
   * Lifecycle hook: Called when any data-bound property of a directive changes.
   * Triggers row recalculation on data or tile size changes.
   * @param changes Changes object.
   */
  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.data || changes.tileSize) {
      this.calculateRows();
      this.onBeforeAttach();
    }
  }

  /**
   * HostListener: Recalculate layout on window resize for responsive design.
   */
  @HostListener('window:resize')
  public onResize(): void {
    this.calculateRows();
  }

  /**
   * Lifecycle hook: After component's view has been initialized.
   * Ensures the rows are calculated at startup.
   */
  public ngAfterViewInit(): void {
    this.calculateRows();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.calculateRows());
      this.resizeObserver.observe(this.container.nativeElement);
    }
  }

  /**
   * Lifecycle hook: Destroy the component
   */
  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  /**
   * Returns the current data array to display.
   * Handles both raw arrays and objects with a 'data' property.
   */
  public get items(): any[] {
    if (!this.data) {
      return [];
    }
    return Array.isArray(this.data) ? this.data : this.data.data;
  }

  /**
   * Builds the rows for rendering tiles in a grid, based on itemsPerRow.
   * Called when data, tile size, or layout changes.
   */
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
    this.calculateRows();
    animationFrameScheduler.schedule(() => {
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

  /**
   * Determines the number of tiles that fit per row based on container width and tile width.
   * Ensures at least 1 tile per row (fallback).
   */
  private calculateItemsPerRow(): void {
    const width = this.container.nativeElement.clientWidth;
    const itemWidth =
      this.tilesSettings.tileWidth +
      2 * this.tilesSettings.leftRightMargin;
    const cols = Math.floor(width / itemWidth);
    this.itemsPerRow = cols > 0 ? cols : 1;
  }
}
