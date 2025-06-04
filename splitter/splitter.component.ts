import { Platform } from '@angular/cdk/platform';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewChild } from '@angular/core';
/* eslint-disable @typescript-eslint/naming-convention */
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';

import { TraceModules } from '../shared/trace-modules';
import { Client, SizeClass } from './size.model';
import { SplitterChanges } from './splitter-changes.model';

enum SplitterPanes {
  First = 0,
  Second = 1
}

enum SplitterOrientation {
  Horizontal = 0,
  Vertical = 1
}

export const VIEW_PORT_MIN_WIDTH = 768;

/**
 * A splitter control imlemented  as angular component.
 * Allows to set various databound properties such as splitter orientation, minimum/maximum splitter position and the the left/right (top/bottom) pane content.
 * It alows to collapse/expand the specified pane.
 */
@Component({
  selector: 'hfw-splitter',
  templateUrl: './splitter.component.html',
  styleUrl: './splitter.component.scss',
  standalone: false
})

export class SplitterComponent {

  private static readonly _defaultOrientation: SplitterOrientation = SplitterOrientation.Vertical;

  private static readonly _defaultCollapsingPane: SplitterPanes = SplitterPanes.First;

  public _beResponsive = false;

  @Input() public hidePane1OnFullScreen = false;
  @Input() public hidePane2OnFullScreen = false;

  /*
   * Fires after a Splitter pane is resized or collapsed.
   * Useful for triggering layout calculations on components which are positioned inside the panes.
   */
  @Output() public readonly splitterChange: EventEmitter<SplitterChanges> = new EventEmitter<SplitterChanges>();

  @ViewChild('splitter', { static: false })
  private readonly splitterDiv!: ElementRef;

  private _previousMouseEvent!: MouseEvent;

  private _previousTouchEvent!: TouchEvent;

  private _hideSplitterBarWhenPaneCollapsed = false;

  private _minSplitterPositionFirstPanePx = 40; // BTQ00322207

  private _minSplitterPositionSecondPanePx = 40; // BTQ00322207

  private _setPaneSizePx!: number | null | undefined;

  private _setPaneSizePrc!: number | null | undefined;

  private _setPaneSizeInitial = '200px';

  private _firstPaneSizeSet = true;

  private _paneSizePercentageSet = false;

  private _splitterDraggingActive = false;

  private _orientation: SplitterOrientation = SplitterComponent._defaultOrientation;

  private _splitterDragBarRelativePosition = 0;

  private _splitterDragBarRelativePositionCalc = 0;

  private _paneCollapsed = false;

  private _collapsingPane: SplitterPanes = SplitterComponent._defaultCollapsingPane;

  private _firstPaneClosed = false;

  private _secondPaneClosed = false;

  private _isLocked = false;

  private mouseMoveHandlerAdded = false;
  private mouseLeaveHandlerAdded = false;

  private isOnTouchStart = false;

  private readonly onTouchMoveBinding: any;
  private readonly onTouchEndBinding: any;
  private readonly disableRubberBandScrollBinding: any;

  public constructor(
    private readonly platform: Platform,
    private readonly traceService: TraceService,
    private readonly element: ElementRef, private readonly cd: ChangeDetectorRef,
    private readonly ngZone: NgZone) {
    this.traceService.info(TraceModules.splitter, 'Splitter Component created.');
    this.disableRubberBandScrollBinding = this.disableRubberBandScroll.bind(this);
    this.onTouchMoveBinding = this.onTouchMove.bind(this);
    this.onTouchEndBinding = this.onTouchEnd.bind(this);
  }

  /**
   * Sets the orientation of the splitter.
   * @param value The orientation of the splitter; either "vertical" or "horizontal".
   */
  @Input()
  public set orientation(value: string) {
    if (!isNullOrUndefined(value)) {
      const orientationTemp: SplitterOrientation = (SplitterOrientation as any)[this.toCamelCase(value.trim())];
      if (orientationTemp !== null) {
        this._orientation = orientationTemp;
      } else {
        this.traceService.error(TraceModules.splitter, 'Splitter orientation value invalid: %s. No change', value);
      }
    }
  }

  /**
   * Gets the orientation of the splitter.
   * @returns The orientation of the splitter; either "vertical" or "horizontal".
   */
  public get orientation(): string {
    return SplitterOrientation[this._orientation];
  }

  /**
   * Checks if the orientation of the splitter is vertical.
   * @returns True if the splitter orientation is vertical".
   */
  public get isOrientationVertical(): boolean {
    return (this._orientation === SplitterOrientation.Vertical) ? true : false;
  }

  /**
   * Checks the style left for dragbar.
   *
   */
  public get styleLeft(): string {
    return (this.isOrientationVertical) ? this.splitterDragBarRelativePosition : 'auto';
  }

  /**
   * Checks the style top for dragbar.
   *
   */
  public get styleTop(): string {
    return (!this.isOrientationVertical) ? this.splitterDragBarRelativePosition : 'auto';
  }

  /**
   * Sets the size of the first pane. Note that setting this property autmatically sets the second pane reasonably.
   * @param value The size of the first pane. The value must be a proper formatted CSS value with unit; such as 30%, 300px, 40mm, 4vh...
   */
  @Input()
  public set firstPaneSize(value: string) {
    if (!isNullOrUndefined(value)) {
      if (value.endsWith('%') || value.endsWith('vw') || value.endsWith('vh') || value.endsWith('vmin') || value.endsWith('vmax')) {
        this._paneSizePercentageSet = true;
      } else {
        this._paneSizePercentageSet = false;
      }
      this._setPaneSizePx = null;
      this._setPaneSizePrc = null;
      this._setPaneSizeInitial = value;
      this._firstPaneSizeSet = true;
    }
  }

  /**
   * Sets the size of the second pane. Note that setting this property autmatically sets the first pane reasonably.
   * @param value The size of the second pane. The value must be a proper formatted CSS value with unit; such as 30%, 300px, 40mm, 3vh...
   */
  @Input()
  public set secondPaneSize(value: string) {
    if (!isNullOrUndefined(value)) {
      if (value.endsWith('%') || value.endsWith('vw') || value.endsWith('vh') || value.endsWith('vmin') || value.endsWith('vmax')) {
        this._paneSizePercentageSet = true;
      } else {
        this._paneSizePercentageSet = false;
      }
      this._setPaneSizePx = null;
      this._setPaneSizePrc = null;
      this._setPaneSizeInitial = value;
      this._firstPaneSizeSet = false;
    }
  }

  /**
   * Sets the min splitter position of the first pane.
   * @param value Any number with unit; allowed CSS units are: "px" "mm", "pt", "cm" and "in"
   */
  @Input()
  public set minSplitterPositionFirstPane(value: string) {
    if (!isNullOrUndefined(value)) {
      if (value.endsWith('px')) {
        this._minSplitterPositionFirstPanePx = parseInt(value, 10);
      } else if (value.endsWith('mm')) {
        this._minSplitterPositionFirstPanePx = Math.round(this.mmToPx(parseInt(value, 10)));
      } else if (value.endsWith('in')) {
        this._minSplitterPositionFirstPanePx = Math.round(this.inToPx(parseInt(value, 10)));
      } else if (value.endsWith('cm')) {
        this._minSplitterPositionFirstPanePx = Math.round(this.cmToPx(parseInt(value, 10)));
      } else if (value.endsWith('pt')) {
        this._minSplitterPositionFirstPanePx = Math.round(this.ptToPx(parseInt(value, 10)));
      } else {
        this._minSplitterPositionFirstPanePx = parseInt(value, 10);
      }
    } else {
      this.traceService.warn(TraceModules.splitter, 'Min splitter position of first pane not set. No change.');
    }
  }

  /**
   * Sets the min splitter position of the second pane.
   * @param value Any number with unit; allowed CSS units are: "px" "mm", "pt", "cm" and "in"
   */
  @Input()
  public set minSplitterPositionSecondPane(value: string) {
    if (!isNullOrUndefined(value)) {
      if (value.endsWith('px')) {
        this._minSplitterPositionSecondPanePx = parseInt(value, 10);
      } else if (value.endsWith('mm')) {
        this._minSplitterPositionSecondPanePx = Math.round(this.mmToPx(parseInt(value, 10)));
      } else if (value.endsWith('in')) {
        this._minSplitterPositionSecondPanePx = Math.round(this.inToPx(parseInt(value, 10)));
      } else if (value.endsWith('cm')) {
        this._minSplitterPositionSecondPanePx = Math.round(this.cmToPx(parseInt(value, 10)));
      } else if (value.endsWith('pt')) {
        this._minSplitterPositionSecondPanePx = Math.round(this.ptToPx(parseInt(value, 10)));
      } else {
        this._minSplitterPositionSecondPanePx = parseInt(value, 10);
      }
    } else {
      this.traceService.warn(TraceModules.splitter, 'Min splitter position of second pane not set. No change.');
    }
  }

  /**
   * Sets which pane must be closed when the collapse button of the splitter bar is clicked.
   * @param value Set the parameter to "first" or "second".
   */
  @Input()
  public set collapsingPane(value: string) {
    if (!isNullOrUndefined(value) && value != '') {
      const colPane: SplitterPanes = (SplitterPanes as any)[this.toCamelCase(value.trim())];
      if (!isNullOrUndefined(colPane)) {
        this._collapsingPane = colPane;
      } else {
        this.traceService.error(TraceModules.splitter, 'Collapsing pane value invalid: %s. No change.', value);
      }
    }
  }

  /**
   * Gets the collapsing pane ("first" or "second").
   * @returns "first" or "second".
   */
  public get collapsingPane(): string {
    return SplitterPanes[this._collapsingPane];
  }

  @Input()
  public set firstPaneClosed(value: boolean) {
    if (typeof value === 'string') {
      // if the consumer hands over a string, we handle it.
      const bVal: any = value;
      value = (bVal === 'false') ? false : true;
    }
    if (value && this._paneCollapsed && this._collapsingPane === SplitterPanes.Second) {
      this._paneCollapsed = false;
    }
    this._firstPaneClosed = value;
  }
  /**
   * Gets if the first pane is collapsed/hidden or not.
   * @returns True if collapsed/hidden, else false.
   */
  public get firstPaneClosed(): boolean {
    return this._firstPaneClosed;
  }
  @Input()
  public set secondPaneClosed(value: boolean) {
    if (typeof value === 'string') {
      const bVal: any = value;
      value = (bVal === 'false') ? false : true;
    }
    if (value && this._paneCollapsed && this._collapsingPane === SplitterPanes.First) {
      this._paneCollapsed = false;
    }

    this._secondPaneClosed = value;
  }
  /**
   * Gets if the second pane is collapsed/hidden or not.
   * @returns True if collapsed/hidden, else false.
   */
  public get secondPaneClosed(): boolean {
    return this._secondPaneClosed;
  }

  /**
   * Defines if the splitterbar shall be hidden as well, if the pane is collapsed.
   */
  @Input()
  public set hideSplitterBarWhenPaneCollapsed(value: boolean) {
    if (typeof value === 'string') {
      // if the consumer hands over a string, we handle it.
      const bVal: any = value;
      value = (bVal === 'false') ? false : true;
    }
    this._hideSplitterBarWhenPaneCollapsed = value;
  }

  /**
   * Gets if the splitter bar is hidden if a pane is collapsed.
   * @returns True if hidden, else false.
   */
  public get hideSplitterBarWhenPaneCollapsed(): boolean {
    return this._hideSplitterBarWhenPaneCollapsed;
  }

  /**
   * Hides/display the designated pane (collapsingPane). Note that the display is set to "none"/"flex"
   * @param value Set to true, when collapsed/hidden, else to false.
   */
  @Input()
  public set paneCollapsed(value: boolean) {
    if (typeof value === 'string') {
      // if the consumer hands over a string, we handle it.
      const bVal: any = value;
      value = (bVal === 'false') ? false : true;
    }
    this._paneCollapsed = value;
  }

  /**
   * Gets if the designated pane (closingPane) is collapsed/hidden or not.
   * @returns True if collapsed/hidden, else false.
   */
  public get paneCollapsed(): boolean {
    return this._paneCollapsed;
  }

  /**
   * Sets if the capability of be responsive should be used or not.
   * @param value Indicates if need to be responsive.
   */
  @Input()
  public set beResponsive(value: boolean) {
    this._beResponsive = value;
  }

  /**
   * Sets if the splitter is currently locked (no drag, no collapse).
   * @param value Indicates if it is currently locked (no drag, no collapse).
   */
  @Input()
  public set isLocked(value: boolean) {
    this._isLocked = value;
  }

  public get isLocked(): boolean {
    return this._isLocked;
  }

  /**
   * Gets if the first pane is collapsed/hidden or not.
   * @returns True if collapsed/hidden, else false.
   */
  public get firstPaneClosedOrCollapsed(): boolean {
    return (this.firstPaneClosed || (this._collapsingPane === SplitterPanes.First && this._paneCollapsed));
  }

  /**
   * Gets if the second pane is collapsed/hidden or not.
   * @returns True if collapsed/hidden, else false.
   */
  public get secondPaneClosedOrCollapsed(): boolean {
    return (this.secondPaneClosed || (this._collapsingPane === SplitterPanes.Second && this._paneCollapsed));
  }

  /**
   * Gets if the splitter bar is hidden or not.
   * @returns True if hidden, else false.
   */
  public get splitterBarHidden(): boolean {
    return ((this._firstPaneClosed || this._secondPaneClosed) && (this._hideSplitterBarWhenPaneCollapsed));
  }

  public get splitterDraggingActive(): boolean {

    return this._splitterDraggingActive;
  }

  public set splitterDraggingActive(value: boolean) {
    if (typeof value === 'string') {
      // if the consumer hands over a string, we handle it.
      const bVal: any = value;
      value = (bVal === 'false') ? false : true;
    }
    if (value !== this.splitterDraggingActive) {
      this._splitterDraggingActive = value;
      if (value === true) {
        this.addMouseMoveHandler();
        this.addMouseLeaveHandler();
      } else {
        this.removeMouseMoveHandler();
        this.removeMouseLeaveHandler();
      }
    }
  }

  public get firstPaneSizeFlex(): string {
    const actualWidth: number = window.innerWidth;
    if (!this._beResponsive || actualWidth > VIEW_PORT_MIN_WIDTH) {
      if (this._secondPaneClosed || this._paneCollapsed) {
        return '0 1 100%';
      } else if (this._setPaneSizePrc) {
        return this.setFirstPaneSizePrc();
      } else if (!isNullOrUndefined(this._setPaneSizePx)) {
        return this.setFirstPaneSizePx();
      } else {
        return (this._firstPaneSizeSet) ? ('0 0 ' + this._setPaneSizeInitial) : ('1');
      }
    } else {
      if (this._firstPaneClosed) {
        return '1 1 auto';
      }
      return 'none';
    }
  }

  public get secondPaneSizeFlex(): string {
    const actualWidth: number = window.innerWidth;
    if (!this._beResponsive || actualWidth > VIEW_PORT_MIN_WIDTH) {
      if (this._firstPaneClosed || this._paneCollapsed) {
        return '0 1 100%';
      } else {
        return this.secondPaneSizeFlexControl();
      }
    } else {
      if (this._secondPaneClosed) {
        return '1 1 auto';
      }
      return 'none';
    }
  }

  public secondPaneSizeFlexControl(): string {
    if (this._setPaneSizePrc) {
      return (this._firstPaneSizeSet) ? (`0 1 ${(100 - this._setPaneSizePrc)}%`) : (`0 1 ${this._setPaneSizePrc}%`);
    } else if (this._setPaneSizePx !== null && this._setPaneSizePx !== undefined) {
      return (this._firstPaneSizeSet) ? ('1') : (`0 0 ${this._setPaneSizePx}px`);
    } else {
      return (this._firstPaneSizeSet) ? ('1') : ('0 0 ' + this._setPaneSizeInitial);
    }
  }

  public onTouchStartSplitterBar(event: any): void {
    const sizeParameters: SizeClass = new SizeClass();
    sizeParameters.splitterClientWidth = event.currentTarget?.parentElement?.clientWidth;
    sizeParameters.splitterClientHeight = event.currentTarget?.parentElement?.clientHeight;
    sizeParameters.firstPaneWidth = event.currentTarget?.previousElementSibling?.clientWidth;
    sizeParameters.firstPaneHeight = event.currentTarget?.previousElementSibling?.clientHeight;
    sizeParameters.secondPaneWidth = event.currentTarget?.nextElementSibling?.clientWidth;
    sizeParameters.secondPaneHeight = event.currentTarget?.nextElementSibling?.clientHeight;
    sizeParameters.splitterBarWidthCurrentPx = event.currentTarget?.clientWidth;
    sizeParameters.splitterBarHeightCurrentPx = event.currentTarget?.clientHeight;
    if (this._isLocked || this._paneCollapsed) {
      return;
    }
    this.onTouchStart();
    this.onStartDraggingSplitterBar(sizeParameters);

    this._previousTouchEvent = event;
  }

  public onMouseDownSplitterBar(event: any): void {
    const sizeParameters: SizeClass = new SizeClass();
    sizeParameters.splitterClientWidth = event.currentTarget?.parentElement?.clientWidth;
    sizeParameters.splitterClientHeight = event.currentTarget?.parentElement?.clientHeight;
    sizeParameters.firstPaneWidth = event.currentTarget?.previousElementSibling?.clientWidth;
    sizeParameters.firstPaneHeight = event.currentTarget?.previousElementSibling?.clientHeight;
    sizeParameters.secondPaneWidth = event.currentTarget?.nextElementSibling?.clientWidth;
    sizeParameters.secondPaneHeight = event.currentTarget?.nextElementSibling?.clientHeight;
    sizeParameters.splitterBarWidthCurrentPx = event.currentTarget?.clientWidth;
    sizeParameters.splitterBarHeightCurrentPx = event.currentTarget?.clientHeight;
    if (this._isLocked || this._paneCollapsed) {
      return;
    }
    this.onStartDraggingSplitterBar(sizeParameters);

    this._previousMouseEvent = event;
  }

  public onMouseUp(event: any): void {
    if (this._isLocked) {
      return;
    }

    if (this._splitterDraggingActive) {
      // to be done when dragging the splitter bar away from the collapsed position!
      this._paneCollapsed = false;
      this._firstPaneClosed = false;
      this._secondPaneClosed = false;

      this.splitterDraggingActive = false;
      this.setNewPaneSize(event.currentTarget.clientWidth, event.currentTarget.clientHeight,
        event.currentTarget.children[1].clientWidth, event.currentTarget.children[1].clientHeight);
      this._previousMouseEvent = event;
      const changes: SplitterChanges = { newPaneSize: this.getPaneSizeValue(),
        isSplitterCollapseChanged: false };
      this.splitterChange.emit(changes);

    }
  }

  public onTouchEnd(event: any): void {
    if (this._isLocked) {
      return;
    }

    if (this._splitterDraggingActive) {
      // to be done when dragging the splitter bar away from the collapsed position!
      this._paneCollapsed = false;
      this._firstPaneClosed = false;
      this._secondPaneClosed = false;

      this.splitterDraggingActive = false;
      this.setNewPaneSize(event.currentTarget.clientWidth, event.currentTarget.clientHeight,
        event.currentTarget.children[1].clientWidth, event.currentTarget.children[1].clientHeight);
      this._previousTouchEvent = event;
      const changes: SplitterChanges = { newPaneSize: this.getPaneSizeValue(), isSplitterCollapseChanged: false };
      this.splitterChange.emit(changes);
      if (this.isOnTouchStart) {
        this.ngZone.runOutsideAngular(() => {
          this.splitterDiv.nativeElement.removeEventListener('touchmove', this.onTouchMoveBinding, { passive: true, capture: false });
          this.splitterDiv.nativeElement.removeEventListener('touchend', this.onTouchEndBinding, { passive: true });
          if (this.isSafari()) {
            window.removeEventListener('touchmove', this.disableRubberBandScrollBinding, { capture: true });
          }
        });

        this.isOnTouchStart = false;
      }
      this.cd.detectChanges();
    }
  }

  public onMouseDownSplitterBarButton(event: any): void {
    if (this._isLocked) {
      return;
    }

    this._paneCollapsed = !this._paneCollapsed;
    this._splitterDragBarRelativePosition = 0;
    this._splitterDragBarRelativePositionCalc = 0;
    if (event.stopPropagation) {
      event.stopPropagation();
    } else {
      event.cancelBubble = true;
    }

    const changes: SplitterChanges = { isSplitterCollapseChanged: true,
      isCollapsed: this._paneCollapsed };
    this.splitterChange.emit(changes);
    this._previousMouseEvent = event;
  }

  public onTouchstartSplitterBarButton(event: any): void {
    if (this._isLocked) {
      return;
    }
    this.onTouchStartForButton();
    this._paneCollapsed = !this._paneCollapsed;
    this._splitterDragBarRelativePosition = 0;
    this._splitterDragBarRelativePositionCalc = 0;
    if (event.stopPropagation) {
      event.stopPropagation();
    } else {
      event.cancelBubble = true;
    }

    const changes: SplitterChanges = { isSplitterCollapseChanged: true,
      isCollapsed: this._paneCollapsed };
    this.splitterChange.emit(changes);
    this._previousTouchEvent = event;
  }

  public async onMouseLeave(event: any): Promise<any> {
    this.splitterDraggingActive = false;
    this.setNewPaneSize(event.currentTarget.clientWidth, event.currentTarget.clientHeight,
      event.currentTarget.children[1].clientWidth, event.currentTarget.children[1].clientHeight);
    this._previousMouseEvent = event;
    this.cd.detectChanges();
  }

  public async onTouchStart(): Promise<any> {
    if (this._isLocked) {
      return;
    }
    if (!this.isOnTouchStart) {
      this.ngZone.runOutsideAngular(() => {
        if (this.isSafari()) {
          window.addEventListener('touchmove', this.disableRubberBandScrollBinding, { passive: false, capture: true });
        }
        this.splitterDiv?.nativeElement?.addEventListener('touchmove', this.onTouchMoveBinding, { passive: true, capture: false });
        this.splitterDiv?.nativeElement?.addEventListener('touchend', this.onTouchEndBinding, { passive: true });
      });
      this.traceService.debug('this.isOnTouchStart = true;');
      this.isOnTouchStart = true;
    }

  }

  public async onTouchStartForButton(): Promise<any> {
    if (this._isLocked) {
      return;
    }
    if (!this.isOnTouchStart) {
      this.ngZone.runOutsideAngular(() => {
        this.splitterDiv.nativeElement.addEventListener('touchmove', this.onTouchMoveBinding, { passive: true, capture: false });
        this.splitterDiv.nativeElement.addEventListener('touchend', this.onTouchEndBinding, { passive: true });
      });
      this.traceService.debug('this.isOnTouchStart = true;');
      this.isOnTouchStart = true;
    }

  }

  public async onTouchMove(event: any): Promise<any> {
    event.preventDefault();
    if (this._isLocked) {
      return;
    }

    if (this.splitterDraggingActive === true) {
      const touch: any = event.changedTouches[0];
      const paramClient: Client = new Client();
      paramClient.clientX = touch.clientX;
      paramClient.clientY = touch.clientY;
      paramClient.previousClientX = this._previousTouchEvent.changedTouches[0].clientX;
      paramClient.previousClientY = this._previousTouchEvent.changedTouches[0].clientY;
      paramClient.splitterClientWidth = event.currentTarget.clientWidth;
      paramClient.splitterClientHeight = event.currentTarget.clientHeight;
      paramClient.firstPaneWidth = event.currentTarget.children[0].clientWidth;
      paramClient.firstPaneHeight = event.currentTarget.children[0].clientHeight;
      paramClient.secondPaneWidth = event.currentTarget.children[2].clientWidth;
      paramClient.secondPaneHeight = event.currentTarget.children[2].clientHeight;
      paramClient.splitterBarWidthCurrentPx = event.currentTarget.children[1].clientWidth;
      paramClient.splitterBarHeightCurrentPx = event.currentTarget.children[1].clientHeight;
      this.onDraggingSplitterBar(paramClient);
      if (event.stopPropagation) {
        event.stopPropagation();
      } else {
        event.cancelBubble = true;
      }
      this._previousTouchEvent = event;
      this.cd.detectChanges();
    }
  }

  public async onMouseMove(event: any): Promise<any> {
    if (this._isLocked) {
      return;
    }

    if (this.splitterDraggingActive === true) {
      const paramClient: Client = new Client();
      paramClient.clientX = event.clientX;
      paramClient.clientY = event.clientY;
      paramClient.previousClientX = this._previousMouseEvent.clientX;
      paramClient.previousClientY = this._previousMouseEvent.clientY;
      paramClient.splitterClientWidth = event.currentTarget.clientWidth;
      paramClient.splitterClientHeight = event.currentTarget.clientHeight;
      paramClient.firstPaneWidth = event.currentTarget.children[0].clientWidth;
      paramClient.firstPaneHeight = event.currentTarget.children[0].clientHeight;
      paramClient.secondPaneWidth = event.currentTarget.children[2].clientWidth;
      paramClient.secondPaneHeight = event.currentTarget.children[2].clientHeight;
      paramClient.splitterBarWidthCurrentPx = event.currentTarget.children[1].clientWidth;
      paramClient.splitterBarHeightCurrentPx = event.currentTarget.children[1].clientHeight;
      this.onDraggingSplitterBar(paramClient);
      event.stopPropagation();
      event.preventDefault();
      this._previousMouseEvent = event;
      this.cd.detectChanges();
    }
  }

  private toCamelCase(str: string): string {
    return str.replace(/\w+/g,
      w => w[0].toUpperCase() + w.slice(1).toLowerCase()
    );
  }

  private getPaneSizeValue(): string {
    if (this._setPaneSizePrc) {
      return this._setPaneSizePrc + '%';
    } else if (!isNullOrUndefined(this._setPaneSizePx)) {
      return this._setPaneSizePx + 'px';
    } else {
      return this._setPaneSizeInitial;
    }
  }

  private readonly mousemoveFunction: (event: UIEvent) => void = (event: UIEvent) => this.onMouseMove(event);

  private readonly mouseLeaveFunction: (event: UIEvent) => void = (event: UIEvent) => this.onMouseLeave(event);

  private addMouseMoveHandler(): void {
    if (this.mouseMoveHandlerAdded === false) {
      this.ngZone.runOutsideAngular(() => {
        this.getTreeListElement().addEventListener('mousemove', this.mousemoveFunction as EventListenerOrEventListenerObject, false);
      });
      this.mouseMoveHandlerAdded = true;
    }
  }

  private removeMouseMoveHandler(): void {
    if (this.mouseMoveHandlerAdded) {
      this.ngZone.runOutsideAngular(() => {
        this.getTreeListElement().removeEventListener('mousemove', this.mousemoveFunction as EventListenerOrEventListenerObject, false);
      });
      this.mouseMoveHandlerAdded = false;
    }
  }

  private addMouseLeaveHandler(): void {
    if (this.mouseLeaveHandlerAdded === false) {
      this.ngZone.runOutsideAngular(() => {
        this.getTreeListElement().addEventListener('mouseleave', this.mouseLeaveFunction as EventListenerOrEventListenerObject, false);
      });
      this.mouseLeaveHandlerAdded = true;
    }
  }

  private removeMouseLeaveHandler(): void {
    if (this.mouseLeaveHandlerAdded) {
      this.ngZone.runOutsideAngular(() => {
        this.getTreeListElement().removeEventListener('mouseleave', this.mouseLeaveFunction as EventListenerOrEventListenerObject, false);
      });
      this.mouseLeaveHandlerAdded = false;
    }
  }

  private getTreeListElement(): Element {
    return this.element.nativeElement.children[0];
  }

  private onStartDraggingSplitterBar(sizeParams: SizeClass): void {
    if (this._isLocked) {
      return;
    }
    this.readCurrentPaneSize(sizeParams);
    this.splitterDraggingActive = true;
  }

  private onDraggingSplitterBar(paramClient: Client): void {
    if (this._isLocked) {
      return;
    }
    if (this._orientation === SplitterOrientation.Vertical) {
      this._splitterDragBarRelativePositionCalc += paramClient.clientX! - paramClient.previousClientX!;
      const newAbsolutePosition: number = paramClient.firstPaneWidth! + this._splitterDragBarRelativePositionCalc;
      if (newAbsolutePosition < this._minSplitterPositionFirstPanePx) {
        this._splitterDragBarRelativePosition = this._minSplitterPositionFirstPanePx - paramClient.firstPaneWidth!;
      } else if ((paramClient.splitterClientWidth! - (newAbsolutePosition + paramClient.splitterBarWidthCurrentPx!)) < this._minSplitterPositionSecondPanePx) {
        this._splitterDragBarRelativePosition = paramClient.secondPaneWidth! - this._minSplitterPositionSecondPanePx;
      } else {
        this._splitterDragBarRelativePosition = this._splitterDragBarRelativePositionCalc;
      }
    } else {
      this._splitterDragBarRelativePositionCalc += paramClient.clientY! - paramClient.previousClientY!;
      const newAbsolutePosition: number = paramClient.firstPaneHeight! + this._splitterDragBarRelativePositionCalc;
      if (newAbsolutePosition < this._minSplitterPositionFirstPanePx) {
        this._splitterDragBarRelativePosition = this._minSplitterPositionFirstPanePx - paramClient.firstPaneHeight!;
      } else if ((paramClient.splitterClientHeight! - (newAbsolutePosition + paramClient.splitterBarHeightCurrentPx!))
      < this._minSplitterPositionSecondPanePx) {
        this._splitterDragBarRelativePosition = paramClient.secondPaneHeight! - this._minSplitterPositionSecondPanePx;
      } else {
        this._splitterDragBarRelativePosition = this._splitterDragBarRelativePositionCalc;
      }
    }
  }

  /**
   * Sets the the size (height or width) of the designated pane and resets the relative position of the splitterdragbar.
   * @param splitterClientWidth The total width of the splitter component.
   * @param splitterClientHeight The total height of the splitter component.
   * @param splitterBarWidthCurrentPx The total width of the splitter bar component.
   * @param splitterBarHeightCurrentPx The total height of the splitter bar component.
   */
  private setNewPaneSize(splitterClientWidth: number, splitterClientHeight: number,
    splitterBarWidthCurrentPx: number, splitterBarHeightCurrentPx: number): void {
    if (this._orientation === SplitterOrientation.Vertical) {
      this.compare(splitterClientWidth, splitterBarWidthCurrentPx);
    } else {
      this.compare(splitterClientHeight, splitterBarHeightCurrentPx);
    }
  }

  private compare(x: number, y: number): void {
    if (x - y > 0) {
      if (this._firstPaneSizeSet && this._paneSizePercentageSet) {
		    this.compareBothExists(x, y);
      } else if (this._firstPaneSizeSet && !this._paneSizePercentageSet) {
		    this.comparePercentageNotExist();
      } else if (!this._firstPaneSizeSet && this._paneSizePercentageSet) {
		    this.compareSetSizeNotExist(x, y);
      } else {
		    if (this._setPaneSizePx) {
			    this._setPaneSizePx -= this._splitterDragBarRelativePosition;
			    this._setPaneSizePrc = undefined;
		    }
      }
      this._splitterDragBarRelativePosition = 0;
      this._splitterDragBarRelativePositionCalc = 0;
    } else {
      this._setPaneSizePrc = undefined;
      this._setPaneSizePx = undefined;
    }
  }

  private compareBothExists(x: number, y: number): void {
    if (this._setPaneSizePrc) {
      this._setPaneSizePrc += (100 * this._splitterDragBarRelativePosition / (x - y));
      this._setPaneSizePx = undefined;
    }
  }

  private comparePercentageNotExist(): void {
    if (this._setPaneSizePx) {
      this._setPaneSizePx += this._splitterDragBarRelativePosition;
      this._setPaneSizePrc = undefined;
    }
  }

  private compareSetSizeNotExist(x: number, y: number): void {
    if (this._setPaneSizePrc) {
      this._setPaneSizePrc -= (100 * this._splitterDragBarRelativePosition / (x - y));
      this._setPaneSizePx = undefined;
    }
  }

  private controlFunctionForWidth(splitterClientWidth: number, firstPaneWidth: number, secondPaneWidth: number, splitterBarWidthCurrentPx: number): void {
    const totalWidth: number = splitterClientWidth - splitterBarWidthCurrentPx;
    if (totalWidth > 0) {
      if (this._firstPaneSizeSet && this._paneSizePercentageSet) {
        this._setPaneSizePrc =
        100 * firstPaneWidth / totalWidth;
        this._setPaneSizePx = undefined;
      } else if (this._firstPaneSizeSet && !this._paneSizePercentageSet) {
        this._setPaneSizePx = firstPaneWidth;
        this._setPaneSizePrc = undefined;
      } else if (!this._firstPaneSizeSet && this._paneSizePercentageSet) {
        this._setPaneSizePrc =
        100 * secondPaneWidth / totalWidth;
        this._setPaneSizePx = undefined;
      } else {
        this._setPaneSizePx = secondPaneWidth;
        this._setPaneSizePrc = undefined;
      }
      this._splitterDragBarRelativePosition = 0;
      this._splitterDragBarRelativePositionCalc = 0;
    } else {
      this._setPaneSizePrc = undefined;
      this._setPaneSizePx = undefined;
    }
  }

  private controlFunctionForHeight(splitterClientHeight: number, firstPaneHeight: number, secondPaneHeight: number, splitterBarHeightCurrentPx: number): void {
    const totalHeight: number = splitterClientHeight - splitterBarHeightCurrentPx;
    if (totalHeight > 0) {
      if (this._firstPaneSizeSet && this._paneSizePercentageSet) {
        this._setPaneSizePrc =
        100 * firstPaneHeight / totalHeight;
        this._setPaneSizePx = undefined;
      } else if (this._firstPaneSizeSet && !this._paneSizePercentageSet) {
        this._setPaneSizePx = firstPaneHeight;
        this._setPaneSizePrc = undefined;
      } else if (!this._firstPaneSizeSet && this._paneSizePercentageSet) {
        this._setPaneSizePrc =
        100 * secondPaneHeight / totalHeight;
        this._setPaneSizePx = undefined;
      } else {
        this._setPaneSizePx = secondPaneHeight;
        this._setPaneSizePrc = undefined;
      }
      this._splitterDragBarRelativePosition = 0;
      this._splitterDragBarRelativePositionCalc = 0;
    } else {
      this._setPaneSizePrc = undefined;
      this._setPaneSizePx = undefined;
    }
  }

  private readCurrentPaneSize(sizeParameters: SizeClass): void {
    this.traceService.info(TraceModules.splitter, 'readCurrentPaneSize method enter: _setPaneSizePx = %d', this._setPaneSizePx);
    if (this._orientation === SplitterOrientation.Vertical) {
      this.controlFunctionForWidth(sizeParameters.splitterClientWidth!, sizeParameters.firstPaneWidth!,
        sizeParameters.secondPaneWidth!, sizeParameters.splitterBarWidthCurrentPx!);
    } else {
      this.controlFunctionForHeight(sizeParameters.splitterClientHeight!, sizeParameters.firstPaneHeight!,
        sizeParameters.secondPaneHeight!, sizeParameters.splitterBarHeightCurrentPx!);
    }
    if (this._setPaneSizePx === 0) {
      this.traceService.error(TraceModules.splitter, 'readCurrentPaneSize method exit: _setPaneSizePx = %d', this._setPaneSizePx);
    }
  }

  private mmToPx(value: number): number {
    return (value * 960 / 254);
  }

  private cmToPx(value: number): number {
    return (value * 9600 / 254);
  }

  private ptToPx(value: number): number {
    return (value * 96 / 72);
  }

  private inToPx(value: number): number {
    return (value * 96);
  }

  protected get splitterDragBarRelativePosition(): string {
    return this._splitterDragBarRelativePosition.toString() + 'px';
  }

  // Solution
  // https://stackoverflow.com/questions/49926360/prevent-ios-11-3-overflow-bouncing
  // normally, attaching "touchmove" to document.body should have worked. But there were some strange behaviours.
  // Links mentioned below have discussions regarding this issue.

  // https://stackoverflow.com/questions/20461485/ios-disable-bounce-scroll-but-allow-normal-scrolling/20477023#20477023
  // discussion https://bugs.webkit.org/show_bug.cgi?id=126786
  // https://bugs.webkit.org/show_bug.cgi?id=182521
  // https://stackoverflow.com/questions/7768269/ipad-safari-disable-scrolling-and-bounce-effect
  // https://stackoverflow.com/questions/29894997/prevent-ios-bounce-without-disabling-scroll-ability
  // https://stackoverflow.com/questions/20461485/ios-disable-bounce-scroll-but-allow-normal-scrolling/20477023#20477023
  private disableRubberBandScroll(event: TouchEvent): void {
    event.preventDefault();
  }

  private isSafari(): boolean {
    return this.platform.SAFARI;
  }

  private setFirstPaneSizePrc(): string {
    return (this._firstPaneSizeSet) ? (`0 1 ${this. _setPaneSizePrc}%`) : (`0 1 ${100 - this._setPaneSizePrc!}%`);
  }

  private setFirstPaneSizePx(): string {
    return (this._firstPaneSizeSet) ? (`0 0 ${this._setPaneSizePx}px`) : ('1');
  }
}
