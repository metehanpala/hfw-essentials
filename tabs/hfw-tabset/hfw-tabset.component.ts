import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';

import { HfwTabComponent } from '../hfw-tab/hfw-tab.component';

export interface HfwTabDeselectionEvent {
  target: HfwTabComponent;
  tabIndex: number;
  cancel: () => void;
}

@Component({
  selector: 'hfw-tabset',
  templateUrl: './hfw-tabset.component.html',
  styleUrl: './hfw-tabset.component.scss',
  standalone: false
})

export class HfwTabsetComponent implements AfterViewInit {
  private static readonly srollIncrement = 55;

  /**
   * Contains the current tab components.
   */
  public tabs: HfwTabComponent[] = [];

  /**
   * Component variable to indicate if scrolling is necessary or the container is big enough to display all tabs.
   */
  public scrollable = false;

  public xPos = 0;
  public rightArrowDisabled = false;

  @ViewChild('tabContainer', { static: true }) public tabContainer!: ElementRef;
  @ViewChild('innerTabContainer', { static: true }) public innerTabContainer!: ElementRef;

  /**
   * If selectDefaultTab is passed as 'false', this implies no default tab selection
   * i.e. on inital load of tabset component no tab gets selected.
   */
  @Input() public selectDefaultTab = true;

  /**
   * Sets a selected tab index. This will activate the tab of the provided
   * index, activates the tab and fires a notification about the change.
   * If index is passed as -1 i.e. `selectedTabIndex = -1`, this implies to clear all tab selection.
   */
  @Input()
  public set selectedTabIndex(tabIndex: number) {
    // Test if new index is in valid range
    if (tabIndex < -1 || tabIndex > this.tabs.length) {
      return;
    }

    if (tabIndex === -1 && this.tabs) {
      // clear all selection
      this.tabs.forEach(tab => {
        tab.active = false;
      });
    }

    // Test if new index is different from current index
    if (this._selectedTabIndex && this._selectedTabIndex === tabIndex) {
      return;
    } else {
      const currentTab = this.tabs[this._selectedTabIndex];

      if (currentTab) {
        const deselectEvent: HfwTabDeselectionEvent = {
          target: currentTab,
          tabIndex: this._selectedTabIndex,
          cancel: () => currentTab.deselectable = false
        };
        currentTab.deselectable = true;
        this.deselect.emit(deselectEvent);

        if (!currentTab.deselectable) {
          return;
        }
      }
    }

    // Set new index
    this._selectedTabIndex = tabIndex;

    // Activate tab of the new index
    this.tabs.forEach((tab: HfwTabComponent, index: number) => {
      tab.active = this._selectedTabIndex === index;
    });

    // Notify clients of the change
    this.selectedTabIndexChange.emit(this._selectedTabIndex);
  }
  /**
   * Returns the currently selected tab index.
   */
  public get selectedTabIndex(): number {
    return this._selectedTabIndex;
  }

  /**
   * Event emitter to notify about selected tab index changes. You can either
   * use bi-directional binding with [(selectedTabIndex)] or separate both with
   * [selectedTabIndex]=... and (selectedTabIndexChange)=...
   */
  @Output() public readonly selectedTabIndexChange: EventEmitter<number> = new EventEmitter<number>();

  /**
   * Event emitter to notify when a tab became inactive.
   */
  @Output() public readonly deselect: EventEmitter<HfwTabDeselectionEvent> = new EventEmitter<HfwTabDeselectionEvent>();
  private _selectedTabIndex = -2;

  public readonly trackByIndex = (index: number): number => index;

  constructor(private readonly cdRef: ChangeDetectorRef, private readonly renderer: Renderer2) {}

  public ngAfterViewInit(): void {
    const container = this.tabContainer.nativeElement as HTMLElement;

    if (container.addEventListener) {
      container.addEventListener(
        'mousewheel', evt => this.mouseScroll(evt as WheelEvent),
        false
      );
    }
    this.resize();
  }

  public resize(): void {
    const width = this.tabContainer.nativeElement.offsetWidth;
    const newScrollable =
      Math.round(width) < this.innerTabContainer.nativeElement.scrollWidth;
    if (this.scrollable !== newScrollable) {
      this.scrollable = newScrollable;
      this.cdRef.detectChanges();
    }
    this.scroll(0);
  }

  /**
   * Adds a new tab to this container. The new tab will be activated if it is the first one.
   *
   * @param tab The new tab to be added.
   */
  public addTab(tab: HfwTabComponent): void {
    if (this.tabs.length === 0) {
      tab.active = true;
    } else {
      tab.active = false;
    }
    // eslint-disable-next-line no-restricted-syntax
    console.log("pushing tab: " + tab);
    this.tabs.push(tab);
    if (this.tabs.length === 1) {
      this.selectedTabIndex = this.selectDefaultTab ? 0 : -1;
    }
  }

  /**
   * Finds the index of the provided tab and sets the index as new selected tab index
   *
   * @param selectedTab The tab to be selected. This must already be part of the container.
   */
  public selectTab(selectedTab: HfwTabComponent): void {
    const tabIndex = this.tabs.indexOf(selectedTab);
    if (tabIndex >= 0) {
      this.selectedTabIndex = tabIndex;
    }
  }

  /**
   * Scrolls the tab headers to the right.
   */
  public scrollRight(): void {
    this.scroll(HfwTabsetComponent.srollIncrement);
  }

  /**
   * Scrolls the tab headers to the left.
   */
  public scrollLeft(): void {
    this.scroll(-HfwTabsetComponent.srollIncrement);
  }

  public removeTab(tab: HfwTabComponent): void {
    const index = this.tabs.indexOf(tab);
    this.tabs.splice(index, 1);
    if (tab.elementRef.nativeElement.parentNode) {
      this.renderer.removeChild(
        tab.elementRef.nativeElement.parentNode,
        tab.elementRef.nativeElement
      );
    }
  }

  private scroll(inc: number): void {
    this.xPos += inc;
    this.xPos = Math.max(
      0,
      Math.min(
        this.innerTabContainer.nativeElement.scrollWidth -
        this.innerTabContainer.nativeElement.offsetWidth,
        this.xPos
      )
    );

    this.rightArrowDisabled =
      this.xPos + this.tabContainer.nativeElement.offsetWidth >=
      this.innerTabContainer.nativeElement.scrollWidth;

    const transform = `translateX(-${this.xPos}px)`;
    this.innerTabContainer.nativeElement.style.transform = transform;
  }

  private mouseScroll(event: WheelEvent): void {
    if (event.deltaY < 0) {
      this.scroll(-HfwTabsetComponent.srollIncrement);
    } else {
      this.scroll(HfwTabsetComponent.srollIncrement);
    }
  }
}
