import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, Input,
  OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { IStateService } from '../../common/interfaces/istate.service';
import { MobileNavigationService } from '../mobile/mobile-service/mobile-navigation.service';
import { PaneStore } from '../shared/stores/pane.store';
import { HfwTabsetComponent } from '../tabs/hfw-tabset/hfw-tabset.component';
import { PaneTabSelectedComponent } from './pane-tabselected.component';

@Component({
  selector: 'hfw-pane-tab',
  templateUrl: './pane-tab.component.html',
  standalone: false
})

/**
 * This class represents the Pane's Navigation Tabs to select different snapins.
 */
export class PaneTabComponent implements OnDestroy, AfterContentInit, AfterViewInit {

  /*
   * The list of tab items.
   */

  @ViewChildren('tabset', { read: ElementRef }) public tabsetEl!: QueryList<ElementRef>;
  @ViewChildren('tabset') public tabset!: HfwTabsetComponent;

  @Input() public paneId!: string;

  @Input() public frameId!: string;

  @Input() public mobileNavigate!: boolean;

  @Input() public visibleTabsObs!: Observable<PaneTabSelectedComponent[]>;

  public tabs!: PaneTabSelectedComponent[];

  public loaded = false;

  public selectedTabId!: string;

  public pendingTabSelectionIndex!: number;

  public selectedIndex = 0;

  private backupIndex!: number;

  private paneStore!: PaneStore;

  private sub: Subscription[] = [];

  private tabNavigationInProgress = false;

  private selectedTabToBeNotified!: boolean;

  public readonly trackByIndex = (index: number): number => index;

  public constructor(private readonly stateService: IStateService,
    @Inject(MobileNavigationService) private readonly mobileNavigationService: MobileNavigationService,
    private readonly cdr: ChangeDetectorRef) {
  }

  public ngAfterContentInit(): void {
    this.updateProperties();
  }

  public ngAfterViewInit(): void {
    this.visibleTabsObs.subscribe(values => {
      this.loaded = false;
      this.tabs = values;
      this.selectedIndex = 0;
      this.mobileTabConfig();
      values.forEach((tab, index) => {
        setTimeout(() => {
          if (tab.active) {
            this.selectedIndex = index;
          }
        });
      })
      this.loaded = true;
      // Trigger change detection manually
      this.cdr.detectChanges();
    });
  }

  public ngOnDestroy(): void {
    this.unsubscribe();
  }

  public mobileTabConfig(): void {
    const tabsMobile: PaneTabSelectedComponent[] = this.tabs.filter(tab => !tab.hidden);
    this.mobileNavigationService.setTabs(tabsMobile);
  }

  public tryToSwitch(e: any): void {
    e.preventDefault();
    e.stopPropagation();

    if ((e.target.className.includes('tab-container-control') as boolean) ||
        (e.target.parentElement.className.includes('tab-container-control') as boolean)) {
      return;
    }

    if (!this.tabNavigationInProgress) {
      this.tabNavigationInProgress = true;
      /* TODO: This retrieval of tabs is very brittle. It depends on the classes of si-tabset buttons.
       * In case the classes change, it will not function anymore. We need to find a better way to handle this.
       */
      // get next selected tab index
      const liArr: any[] = Array.from(this.tabsetEl.first.nativeElement.querySelectorAll('.tab-container-buttonbar-list .nav-link'));
      liArr.forEach((li, i) => {
        if (li.contains(e.target)) {
          this.pendingTabSelectionIndex = i;
        }
      });

      const tab: PaneTabSelectedComponent[] = this.tabs.filter((_element, index) => index === this.pendingTabSelectionIndex);
      const id: string | null = tab != null ? tab[0].tabId : null;
      if (id && id !== this.selectedTabId) {
        if (id === 'empty') {
          this.tabNavigationInProgress = false;
          return;
        }
        this.stateService.navigateToSnapId(this.paneStore.fullPaneId, id).subscribe(() => {
          this.tabNavigationInProgress = false;
        });
      } else {
        this.tabNavigationInProgress = false;
      }
    }
  }

  private updatePropertiesForNewSelected(): boolean {
    this.selectedIndex = this.backupIndex;
    this.selectedTabToBeNotified = false;
    this.tabNavigationInProgress = false;
    return true;
  }

  private updatePropertiesForNewSelectedNoTab(): boolean {
    this.selectedIndex = this.backupIndex;
    this.tabNavigationInProgress = false;
    return true;
  }

  private setSelectTabAndTabNavigation(): void {
    this.selectedTabToBeNotified = true;
    this.tabNavigationInProgress = false;
    this.mobileTabConfig();
  }

  private checkSelectedTab(p: PaneTabSelectedComponent, i: number): boolean {
    this.backupIndex = i;
    return p.tabId === this.selectedTabId;
  }

  private setBackUpForTabSelected(p: PaneTabSelectedComponent, i: number): boolean {
    this.backupIndex = i;
    return p.tabId === this.selectedTabId;
  }

  private setLast(): PaneTabSelectedComponent | undefined {
    if (this.selectedTabId != null && this.tabs != null) {
      return this.tabs.find(p => p.tabId === this.selectedTabId)!;
    }
    return undefined;
  }

  private updatePropertiesForPaneStoreNotNull(): void {
    this.sub.push(this.paneStore.selectedSnapInId.subscribe(
      res => {
        const last = this.setLast();
        this.selectedTabId = res;
        if (this.tabs != null && this.selectedTabId != null) {
          const newSelected: PaneTabSelectedComponent = this.tabs.find((p, i): any => {
            return this.setBackUpForTabSelected(p, i);
          })!;
          if (newSelected != null) {
            setTimeout(() => {
              if (last != null) {
                last.active = false;
                this.mobileTabConfig();
              }
              newSelected.active = this.updatePropertiesForNewSelectedNoTab();
            });
          } else {
            this.setSelectTabAndTabNavigation();
          }
        }
      }));
  }

  private updateProperties(): void {
    if (this.frameId != null && this.paneId != null) {
      this.paneStore = this.stateService.currentState.getPaneStoreViaIds(this.frameId, this.paneId);
      this.mobileNavigationService.setPaneStore(this.paneStore);
      if (this.tabs != null) {
        this.sub.push(this.visibleTabsObs.subscribe(values => {
          this.tabs = values;
          if (this.selectedTabToBeNotified === true) {
            const newSelected: PaneTabSelectedComponent = this.tabs.find((p, i): any => {
              return this.checkSelectedTab(p, i);
            })!;
            if (newSelected != null) {
              setTimeout(() => {
                newSelected.active = this.updatePropertiesForNewSelected();
                this.mobileTabConfig();
              });
            }
          }
        }));
      }
      if (this.paneStore != null) {
        this.updatePropertiesForPaneStoreNotNull();
      }
    }
  }

  private unsubscribe(): void {
    if (this.sub != null) {
      this.sub.forEach((sub: Subscription) => sub.unsubscribe());
      this.sub = [];
    }
  }
}
