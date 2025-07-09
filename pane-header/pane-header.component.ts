import { Component, HostBinding, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { isNullOrUndefined, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { ContentActionBarMainItem } from '@simpl/element-ng';
import { MenuItemAction } from '@simpl/element-ng/menu';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { IObjectSelection } from '../../common/interfaces/iobjectselection';
import { ISnapInActions } from '../../common/interfaces/isnapinactions.service';
import { IStateService } from '../../common/interfaces/istate.service';
import { SnapInActions } from '../../common/interfaces/snapin-actions.model';
import { UnsavedDataReason } from '../../common/unsaved-data';
import { MobileNavigationService } from '../mobile/mobile-service/mobile-navigation.service';
import { PaneTabSelectedComponent } from '../pane-tab';
import { Title } from '../shared/hldl/hldl-data.model';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { SnapInStore } from '../shared/stores/snapin.store';
import { TraceModules } from '../shared/trace/trace-modules';

@Component({
  selector: 'hfw-pane-header',
  templateUrl: './pane-header.component.html',
  styleUrl: './pane-header.component.scss',
  standalone: false
})

/**
 * This class represents the Pane, the container of a group of SNIs in HFW visual tree.
 */
export class PaneHeaderComponent implements OnDestroy, OnInit {

  private static readonly twoPaneLayoutId = '2-pane';

  @HostBinding('class.hfw-flex-container-row') public guardFrame = true;

  @Input() public paneId!: string;

  @Input() public frameId!: string;

  @Input() public headerTitle!: string;

  @Input() public titleVisible!: boolean;

  @Input() public closeButton!: boolean;

  @Input() public snapIns!: SnapInStore[];

  @Input() public hasTab!: boolean;

  @Input() public displayEmpty!: boolean;

  /**
   * Sets if the Header title should be the Pane Name or Snapin Name.
   */
  @Input() public paneTitleOrSnapinTitle!: Title;

  @Input() public displaySelectedObject!: boolean;

  public paneStore!: PaneStore;

  public selectedSnapInTitle!: string;

  public isCloseDisabled!: boolean;

  public selectedNodeInfo!: string;

  public selectedNodeIcon!: string;

  public primaryItems!: ContentActionBarMainItem[];

  public secondaryItems!: ContentActionBarMainItem[];

  public isMobileView: boolean | undefined;

  public isMobileLayout = false;

  public isLastNode = true;

  public collapseActionItemTitle = '';

  public expandActionItemTitle = '';

  public closeActionItemTitle = '';

  public readonly visibleTabsObs: Observable<PaneTabSelectedComponent[]>;

  private isFullScreen = false;

  private expandCollapseActionPosition = 0;

  private readonly visibleTabsSubj: BehaviorSubject<PaneTabSelectedComponent[]> = new BehaviorSubject<PaneTabSelectedComponent[]>([]);

  private readonly subs: Subscription[] = [];

  private headerSub!: Subscription;

  public frameStoreControl(): void {
    const frameStore: FrameStore = this.stateService.currentState.getFrameStoreViaId(this.frameId);
    // to  verify frame store !=null
    if (frameStore != null) {
      this.subs.push(frameStore.isLocked.subscribe(
        res => {
          this.isCloseDisabled = res;
        }));
    }
  }

  public ngOnInit(): void {

    this.translateService.get('HFW_CORE.COLLAPSE_ACTION_ITEM').subscribe((s: string) => this.collapseActionItemTitle = s);
    this.translateService.get('HFW_CORE.EXPAND_ACTION_ITEM').subscribe((s: string) => this.expandActionItemTitle = s);
    this.translateService.get('HFW_CORE.CLOSE_ACTION_ITEM').subscribe((s: string) => this.closeActionItemTitle = s);

    this.paneRefresh();

    this.snapinVisibilityChange();

    this.setupSnapInSubscription();

    this.setupMobileViewSubscriptions();
  }

  public paneRefresh(): void {
    this.frameStoreControl();
    this.paneStore = this.stateService.currentState.getPaneStoreViaIds(this.frameId, this.paneId);
    this.subs.push(this.paneStore.fullScreen.subscribe(
      s => {
        if (!isNullOrUndefined(this.primaryItems)) {
          this.isFullScreen = s;
          const item = this.primaryItems?.[this.expandCollapseActionPosition];
          if (item) {
            item.icon = this.isFullScreen ? 'element-pinch' : 'element-zoom';
          }
        }
      }
    ));
  }

  public ngOnDestroy(): void {
    this.unsubscribeAll();
    this.hfwTrace.debug(TraceModules.paneHeader, 'disconnecting active resize observers for %s', this.paneId);
  }

  public readonly trackByIndex = (index: number): number => index;

  public constructor(private readonly hfwTrace: TraceService,
    @Inject(MobileNavigationService) private readonly mobileNavigationService: MobileNavigationService,
    private readonly stateService: IStateService,
    private readonly snapInActions: ISnapInActions,
    private readonly translateService: TranslateService,
    private readonly settingsService: SettingsServiceBase,
    @Inject(IObjectSelection) private readonly objectSelection: IObjectSelection) {
    this.visibleTabsObs = this.visibleTabsSubj.asObservable();
  }

  public onExpandCollapse(): void {
    if (!isNullOrUndefined(this.primaryItems[this.expandCollapseActionPosition])) {
      if (this.isFullScreen === true) {
        this.paneStore.setFullScreen(false);
        this.primaryItems[this.expandCollapseActionPosition].icon = 'element-zoom';
      } else {
        this.paneStore.setFullScreen(true);
        this.primaryItems[this.expandCollapseActionPosition].icon = 'element-pinch';
      }
    }

    const frameStore: FrameStore = this.stateService.currentState.getFrameStoreViaId(this.frameId);
    this.stateService.currentState.setFrameSettings(frameStore, this.frameId, this.settingsService);
  }

  // Force pane to be fullscreen in mobile view
  public mobileViewFullScreen(isMobile: boolean): void {
    if (isMobile) {
      this.paneStore.setFullScreen(true);
      this.isMobileLayout = true;
    } else {
      if (this.isMobileLayout) {
        this.deactivateMobileLayout();
      }
    }
  }

  public systemBackNavigate(): void {
    this.mobileNavigationService.setbackNavigate();
  }

  public deactivateMobileLayout(): void {
    const frameStore: FrameStore | null = this.stateService.currentState.getFrameStoreViaId(this.frameId);
    if (frameStore?.selectedViewIdValue) {
      const layoutId = PaneHeaderComponent.twoPaneLayoutId;
      this.stateService.navigateToFrameViewLayout(this.frameId, frameStore.selectedViewIdValue, layoutId).subscribe((res: boolean) => {
        this.hfwTrace.debug(TraceModules.paneHeader, 'mobile layout deactivated. result: %s', res);
        if (res) {
          this.isMobileLayout = false;
        }
      });
    }
  }

  public mobileViewSystemBrowserFullScreen(sysBrowActive: boolean): void {
    const paneStores: PaneStore[] = this.stateService.getCurrentPaneStores();
    const systemBrowserPane = paneStores.filter(paneStore => paneStore.fullPaneId.paneId === 'selection-pane');
    if (sysBrowActive) {
      this.paneStore.setFullScreen(false);
      this.paneStore.close();
      systemBrowserPane[0].open();
      systemBrowserPane[0].setFullScreen(true);
    } else {
      systemBrowserPane[0].close();
      systemBrowserPane[0].setFullScreen(false);
      this.paneStore.open();
      this.paneStore.setFullScreen(true);
    }
  }

  public onClickCloseChangeLayout(): void {
    this.hfwTrace.debug(TraceModules.paneHeader, 'close button change layout clicked.');
    const frameStore: FrameStore | null = this.stateService.currentState.getFrameStoreViaId(this.frameId);
    const paneStores: PaneStore[] = this.stateService.getCurrentPaneStores();
    const tmpPane = paneStores.filter(paneStore => paneStore.fullPaneId.paneId === 'comparison-pane');

    this.stateService.checkUnsaved(tmpPane, UnsavedDataReason.LayoutChange).subscribe((res: boolean) => {
      if (res === true) {
        this.hfwTrace.debug(TraceModules.paneHeader, 'unsaved data found.');
        this.switchLayout(frameStore);
      }
    });

  }

  private switchLayout(frameStore: FrameStore): void {
    if (frameStore?.selectedViewIdValue) {
      let layoutId: string | null = this.stateService.getLayoutIdWhenClosed(frameStore, this.paneId);
      if (layoutId == null) {
        // previous layout does not exists.
        layoutId = this.stateService.currentState.getFirsLayoutIdWithoutPane(frameStore, this.paneId);
      }

      this.stateService.navigateToFrameViewLayout(this.frameId, frameStore.selectedViewIdValue, layoutId).subscribe((res: boolean) => {
        this.hfwTrace.debug(TraceModules.paneHeader, 'navigateToFrameViewLayout complete. result: %s', res);
        if (res) {
          // reset visible snapins
          frameStore.resetPaneState(this.paneId);
        }
        // if RES is false, there is no need to reset pane
      });
    }
  }

  private unsubscribeAll(): void {
    if (this.subs != null) {
      this.subs.forEach(subscription => {
        subscription.unsubscribe();
      });
    }
  }

  private setSelctedSnapInTitle(res: string): void {
    const snapInInfo: SnapInStore = this.stateService.currentState.getSnapInStoreViaIds(this.frameId, res)!;
    if (snapInInfo != null && res != null) {
      this.selectedSnapInTitle = (snapInInfo.tabTitle) ? snapInInfo.tabTitle : res;
      this.mobileNavigationService.setSnapinTitle(this.selectedSnapInTitle);
    }
  }

  private setupSnapInSubscription(): void {
    this.subs.push(
      this.paneStore.selectedSnapInId.subscribe(
        res => {
          // this.visibleSnapins = this.snapIns?.filter(s => s.isTabVisible);
          this.snapinVisibilityChange();
          if (!isNullOrUndefined(res)) {
            this.setSelctedSnapInTitle(res!);
            if (!isNullOrUndefined(this.headerSub)) {
              this.headerSub.unsubscribe();
            }

            const fullSnapInId = new FullSnapInId(this.frameId, res!);
            const objObs = this.objectSelection.getSelectedObject(fullSnapInId);
            if (!isNullOrUndefined(objObs)) {
              this.headerSub = objObs
                .pipe(
                  catchError(err => {
                    // Log the error
                    this.hfwTrace.error('Error in selectedSnapInId subscription', err);
                    // Handle error and return an empty observable to prevent further issues
                    return of(null);
                  })
                )
                .subscribe(selObject => {
                  if (selObject) {
                    this.selectedNodeIcon = selObject.icon;
                    this.translateService
                      .get(selObject?.title)
                      .subscribe((s: string) => (this.selectedNodeInfo = s));
                  }
                });
            } else {
              this.hfwTrace.info(
                TraceModules.paneHeader,
                'null or undefined objObs for %s',
                fullSnapInId.fullId()
              );
            }
          }
        },
        error => {
          // Catch and log errors from the observable
          this.hfwTrace.error('Error in selectedSnapInId subscription', error);
        }
      )
    );
  }

  private setupMobileViewSubscriptions(): void {
    this.isMobileView = this.mobileNavigationService.mobileOnlyVisibilityLast;

    this.subs.push(this.mobileNavigationService.mobileOnlyVisibility$.subscribe((isVisible: boolean) => {
      this.isMobileView = isVisible;
      this.mobileViewFullScreen(this.isMobileView);
    }));

    this.subs.push(this.mobileNavigationService.sysBrowActive$.subscribe((sysBrowActive: boolean) => {
      this.mobileViewSystemBrowserFullScreen(sysBrowActive);
    }));

    this.subs.push(this.mobileNavigationService.isLastNode$.subscribe((isLastNode: boolean) => {
      this.isLastNode = isLastNode;
    }));

    this.subs.push(this.paneStore.selectedSnapInId.pipe(
      switchMap(id => {
        const fullSnapInId: FullSnapInId = new FullSnapInId(this.frameId, id);
        return this.snapInActions.getSnapInActions(fullSnapInId);
      })
    ).subscribe((res: SnapInActions) => {
      if (res) {
        this.primaryItems = [];
        this.secondaryItems = [];
        if (res.primaryActions) {
          res.primaryActions.forEach((item: ContentActionBarMainItem) => {
            this.primaryItems.push(item as MenuItemAction);
          });
        }
        if (res.secondaryActions) {
          res.secondaryActions.forEach((item: ContentActionBarMainItem) => {
            this.secondaryItems.push(item);
          });
        }
      } else {
        this.primaryItems = [];
        this.secondaryItems = [];
      }

      // Mobile view content action items
      this.mobileNavigationService.setContentActionItems(this.primaryItems, this.secondaryItems);

      if (this.paneStore.paneConfig?.hasFullScreen != null) {
        if (this.paneStore.paneConfig?.hasFullScreen === true) {
          const menuItem: ContentActionBarMainItem = {
            type: 'action',
            action: (): void => this.onExpandCollapse(),
            icon: this.isFullScreen ? 'element-pinch' : 'element-zoom',
            label: ''
          };
          this.expandCollapseActionPosition = this.primaryItems.push(menuItem) - 1;
        }
      }

      if (this.closeButton === true) {
        const menuItem: ContentActionBarMainItem = {
          type: 'action',
          action: (): void => this.onClickCloseChangeLayout(),
          label: this.closeActionItemTitle
        };
        this.secondaryItems.push(menuItem);
      }

    }));

    // Subscribe to the screen size change event to configure mobile view
    this.isMobileView = this.mobileNavigationService.mobileOnlyVisibilityLast;

    this.subs.push(this.mobileNavigationService.mobileOnlyVisibility$.subscribe((isVisible: boolean) => {
      this.isMobileView = isVisible;
      this.mobileViewFullScreen(this.isMobileView);
    }));

    this.subs.push(this.mobileNavigationService.sysBrowActive$.subscribe((sysBrowActive: boolean) => {
      this.mobileViewSystemBrowserFullScreen(sysBrowActive);
    }));

    this.subs.push(this.mobileNavigationService.isLastNode$.subscribe((isLastNode: boolean) => {
      this.isLastNode = isLastNode;
    }));

  }

  private snapinVisibilityChange(): void {
    const visibleTabs: PaneTabSelectedComponent[] = [];
    this.snapIns?.forEach(sni => {
      if (sni.isTabVisible) {
        const tab: PaneTabSelectedComponent = {
          tabTitle: sni?.tabTitle ? sni.tabTitle : sni.snapInId,
          tabId: sni?.snapInId,
          hidden: sni.isTabVisible,
          active: false,
          isEmptyTabItem: false,
          customClass: ''
        };
        visibleTabs.push(tab);
      }
    });
    this.visibleTabsSubj.next(visibleTabs);
  }
}
