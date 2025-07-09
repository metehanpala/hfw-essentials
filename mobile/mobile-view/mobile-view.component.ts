/**
 * MobileViewComponent
 *
 * This component provides a mobile-friendly user interface for navigating and interacting
 * with different panes and snap-ins in flex client. It is designed to work in conjunction
 * with the MobileNavigationService to manage mobile-specific navigation and system-browsing.
 * The MobileViewComponent is responsible for displaying a footer bar with navigation options
 * and content actions. It also provides an action sheet to present additional options to the user.
 *
 * Dependencies:
 * - The MobileViewComponent relies on the MobileNavigationService to manage mobile-specific navigation and
 *   content actions. The StateService is used for handling navigation and actions within the application.
 * - The component makes use of various libraries, such as '@gms-flex/services-common', and '@simpl/element-ng'.
 */

import { AfterViewInit, Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { ContentActionBarMainItem, MenuItemAction } from '@simpl/element-ng';
import { combineLatest, Subscription } from 'rxjs';

import { IStateService, Pane, PaneStore, SnapInStore } from '../../../public-api';
import { TraceModules } from '../../shared/trace/trace-modules';
import { MobileNavigationService } from '../mobile-service/mobile-navigation.service';

@Component({
  selector: 'hfw-mobile-view',
  templateUrl: './mobile-view.component.html',
  styleUrl: './mobile-view.component.scss',
  standalone: false
})

export class MobileViewComponent implements AfterViewInit, OnInit, OnDestroy {
  private static readonly mobileAccountMaxWidth = '100vw';
  private static readonly accountMaxWidth = '50vw';
  private static readonly marginBlockStartCollapseToggleClosed = '5px';
  private static readonly marginBlockStartCollapseToggleClosedEvent = '5px';
  private static readonly marginBlockStartCollapseToggleOpen = '8px';
  private static readonly actionSheetOriginSnapin = 'snapinNavigate';
  private static readonly actionSheetOriginContentActions = 'contentActions';
  private static readonly queryHfwFooterBar = '.footer-bar';
  private static readonly querySnapinsEvents = '.event-list-grid-control-container';
  private static readonly queryPortfolioManager = 'cbms-portfolio-snapin';
  private static readonly querySnapinsTasks = '.operator-task-grid-control-container';
  private static readonly querySnapinsAbout = '.gms-about-snapin-parent';
  private static readonly querySnapinsAccount = '.acct-wrapper';
  private static readonly queryHfwTileContainer = '.tile-view-middle-segment';
  private static readonly queryNotifications = '.component-notification';
  private static readonly queryLayoutSettings = '.gms-layout-container';
  private static readonly queryNotifConfig = 'gms-notifconfig-snapin';
  private static readonly queryNodeMapView = 'gms-nodemap-snapin';
  private static readonly queryNotifRecipentView = 'gms-notification-recipient-snapin';
  private static readonly querySiSidePanel = 'system-right-panel-content';
  private static readonly querySiSidePanelEvent = 'event-right-panel-content';
  private static readonly querySiSidePanelContentHeader = 'rpanel-header';
  private static readonly queryCollapseToggleVerticalPanel = '.navbar-vertical-no-collapse';
  private static readonly queryCollapseToggleRightSidePanel = 'collapse-toggle';
  private static readonly justifyContentMobile = 'center';
  private static readonly justifyContentDesktop = 'unset';
  private static readonly visibilityHide = 'hide';
  private static readonly minLastNode = 2;

  public contentItem: ContentActionBarMainItem[] = [];

  public showSheet = false;

  public selectedSnapInTitle = '';

  public isMobile: boolean | undefined;
  public isRightPanelOpen = false;
  public sysBrowActive = false;

  public primaryItems: ContentActionBarMainItem[] = [];
  public secondaryItems: ContentActionBarMainItem[] = [];
  public hideContentActions = false;

  public snapinTabs: { title: string; active: string }[] = [];
  public snapinTabUnique = true;

  public showSnapinNavigate = false;
  public showContentActions = false;

  public paneConfig!: Pane;
  public paneStore!: PaneStore;
  public snapIns!: SnapInStore[];
  public tabs!: any[];

  private readonly subscriptions: Subscription[] = [];

  private mutationObserver: MutationObserver | null = null;

  private readonly _trModule: string = TraceModules.mobileView;

  constructor(@Inject(MobileNavigationService) private readonly mobileNavigationService: MobileNavigationService,
    private readonly traceService: TraceService,
    private readonly stateService: IStateService,
    private readonly ngZone: NgZone) {
  }
  /**
   * Initializes the component.
   * Subscribes to the mobile navigation service observables for mobile visibility, snapin title,
   * content actions, pane store, pane configuration, available snapins, available pane tabs,
   * and system browser status. Also logs an info message when the mobile view is initialized.
   */
  public ngOnInit(): void {
    // Subscribe to the mobile navigation service observables
    // Mobile Only Visibility
    this.isMobile = this.mobileNavigationService.mobileOnlyVisibilityLast;

    this.subscriptions.push(this.mobileNavigationService.mobileOnlyVisibility$.subscribe((mobileOnlyVisibility: boolean) => {
      this.isMobile = mobileOnlyVisibility;
      this.handleHfwColumnSizing();
    }));

    // Snapin Title
    this.subscriptions.push(this.mobileNavigationService.snapinTitle$.subscribe((snapinTitle: string) => {
      this.selectedSnapInTitle = snapinTitle;
    }));

    // Combine the observables of primaryItems$ and secondaryItems$ for the content actions
    this.subscriptions.push(combineLatest([
      this.mobileNavigationService.primaryItems$,
      this.mobileNavigationService.secondaryItems$
    ]).subscribe(([primaryItems, secondaryItems]) => {
      this.contentItem = []; // Reset content actions for the current snapin
      this.primaryItems = primaryItems;
      this.secondaryItems = secondaryItems;
      setTimeout(() => {
        // Separately populating 'primary' and 'secondary' actions in anticipation of forthcoming content action logic changes from SiMPL.
        this.populateContentActionItems('primary', this.primaryItems);
        this.populateContentActionItems('secondary', this.secondaryItems);
      });
    }));

    // Pane Store
    this.subscriptions.push(this.mobileNavigationService.paneStore$.subscribe((paneStore: PaneStore) => {
      this.paneStore = paneStore;
    }));

    // Pane Configuration
    this.subscriptions.push(this.mobileNavigationService.paneConfig$.subscribe((paneConfig: Pane) => {
      this.paneConfig = paneConfig;
    }));

    // Available SnapIns for the selected pane
    this.subscriptions.push(this.mobileNavigationService.snapIns$.subscribe((snapIns: SnapInStore[]) => {
      this.snapIns = snapIns;
    }));

    // Available Pane tabs for the selected pane
    this.subscriptions.push(this.mobileNavigationService.tabs$.subscribe((tabs: any[]) => {
      this.tabs = tabs;
      setTimeout(() => {
        this.populateSnapinNavigate(this.tabs);
      }, 500); // Half second delay to get active status correctly
      this.contentItem = []; // Reset content actions for the current snapin
    }));

    // Subscribe If system-browser is active
    this.subscriptions.push(this.mobileNavigationService.sysBrowActive$.subscribe((sysBrowActive: boolean) => {
      this.sysBrowActive = sysBrowActive;
    }));

    // Subscribe to the status of the right-panel
    this.subscriptions.push(this.mobileNavigationService.isRightPanelOpen$.subscribe((isOpen: boolean) => {
      this.isRightPanelOpen = isOpen;
      this.configureView();
    }));

    this.traceService.info(this._trModule, 'Mobile view initialized');
  }
  /**
   * The observer is configured to observe the entire DOM, including all child elements. This means that any changes
   * to the DOM hierarchy, such as new elements being added or removed, will trigger the MutationObserver callback.
   */
  public ngAfterViewInit(): void {
    // Configure view initially for refresh cases
    this.configureView();

    // Create a MutationObserver to observe changes in the DOM

    // Create a MutationObserver to observe changes in the DOM
    this.mutationObserver = new MutationObserver(() => {
      // Run the callback within the Angular zone
      this.ngZone.run(() => {
        this.configureView();
      });
    });

    // Start observing the entire DOM, including child elements
    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

  }

  /**
   * Cleans up the component.
   * Unsubscribes from the mobile navigation service observables and logs an info message when
   * the mobile view is destroyed.
   */
  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription != null) {
        subscription.unsubscribe();
      }
    });
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    this.traceService.info(this._trModule, 'Mobile view destroyed');
  }

  /**
   * Configures the view based on the current state and conditions.
   * This method adjusts the layout and visibility of various elements,
   * such as the tile container, snapins, footer bar, and notifications,
   * based on specific criteria like the mobile view status and the state
   * of open snapins. It ensures a responsive and dynamic user interface.
   *
   * Steps:
   * 1. Query and select relevant DOM elements using query selectors.
   * 2. Adjust the alignment (center/left) of the tile-view container based on the mobile view status.
   * 3. Set the maximum width (50%, 100%) for the account snapin depending on the mobile view.
   * 4. Check conditions and update elements and services accordingly:
   *    - If any relevant elements are truthy or the right panel is open:
   *      - Adjust the maxWidth of the account snapin.
   *      - Update mobileNavigationService settings if specific conditions are met.
   *      - Hide the footer bar.
   *    - If no conditions are met:
   *      - Reset mobileNavigationService settings.
   *      - Show the footer bar.
   * 5. Set the lastNode value in the mobileNavigationService based on the browser back button history length.
   */
  public configureView(): void {
    // Select only the required elements to be updated with respect to mobile rules
    const {
      tilesContainer,
      eventList,
      portfolioManager,
      siSidePanelContent,
      accountSnapin,
      footerBar,
      notifConfig,
      aboutSnapin
    } = this.selectElements();

    this.adjustTilesContainerLayout(tilesContainer);

    this.adjustRightPanelToggleMargin(siSidePanelContent, eventList);

    this.updateElements(this.determineUpdateConditions(accountSnapin), accountSnapin, footerBar, notifConfig, aboutSnapin, this.accountSnapinMaxWidthHandler());

    // Toggle this condition for both events and portfolio as it is required to calculate space in the bottom
    this.calculateBottomSpace(eventList ?? portfolioManager);

    this.setLastNodeValue();
  }

  /**
   * Handles the sizing of HFW column containers based on the mobile state.
   * Adjusts the minimum height of the flex containers for investigative treatment resizing.
   * If not in mobile mode, sets a minimum height of 1vh (default in hfw-essentials); otherwise, sets to 1px.
   */
  public handleHfwColumnSizing(): void {
    // Investigative treatment resizing
    const flexContainers = document.querySelectorAll('.hfw-flex-container-column') as NodeListOf<HTMLElement>;

    flexContainers.forEach(flexContainer => {
      if (!this.isMobile) {
        flexContainer.style.minHeight = '1vh';
      } else {
        // Due to unpredictable behavior with hfw-pane scrollbars and overall layout instability, setting minHeight to 'none' is avoided.
        // To maintain stability and prevent layout issues, a minimum height of '1px' is enforced.
        flexContainer.style.minHeight = '1px';
      }
    });
  }

  /**
   * Shows the action sheet based on the source provided.
   * @param source The source of the action sheet (e.g., 'contentActions' or 'snapinNavigate').
   */
  public showActionSheet(source: string): void {
    this.showSnapinNavigate = source === MobileViewComponent.actionSheetOriginSnapin;
    this.showContentActions = source === MobileViewComponent.actionSheetOriginContentActions;
    this.showSheet = true;
    this.traceService.info(this._trModule, `Action sheet displayed for: ${source}`);
  }
  /**
   * Hides the action sheet.
   */
  public hideActionSheet(): void {
    this.showSheet = false;
    this.showSnapinNavigate = false;
    this.showContentActions = false;
    this.traceService.info(this._trModule, 'Action sheet hidden');
  }

  /**
   * Handles the click event on a snapin tab.
   * @param clickedTab The selected snapin tab object.
   */
  public snapinNavigateClick(clickedTab: any): void {
    // Handle option click event based on the selected option
    this.stateService.navigateToSnapId(this.paneStore.fullPaneId, clickedTab.id).subscribe(() => {
    });
    this.traceService.info(this._trModule, `Snapin tab: ${clickedTab.title}`);
    this.hideActionSheet();
  }

  /**
   * Populates the snapin navigation tabs.
   * @param tabs The array of snapin tabs to populate.
   */
  public populateSnapinNavigate(tabs: any): void {
    this.snapinTabs = [];
    tabs.forEach((tab: { tabTitle: any; active: any; tabId: any }) => {
      this.addSnapinTab(tab.tabTitle, tab.active, tab.tabId);
    });
    this.snapinTabUnique = this.snapinTabs.length <= 1;
  }

  /**
   * Adds a new snapin tab.
   * @param tabTitle The title of the snapin tab to add.
   * @param isActive The active status of the snapin tab to add.
   * @param tabId The ID of the snapin tab to add.
   */
  public addSnapinTab(tabTitle: any, isActive: any, tabId: any): void {
    const newSnapinTab = {
      title: tabTitle,
      active: isActive,
      id: tabId
    };
    this.snapinTabs.push(newSnapinTab);
    this.traceService.info(this._trModule, `Added snapin tab: ${tabTitle}`);
  }

  /**
   * Adds a new content action item.
   * @param item MenuItem to be added.
   * @param itemType The type of content items to populate (e.g., 'primary' or 'secondary').
   */
  public addContentActionItem(item: ContentActionBarMainItem, itemType: string): void {
    // ATM we're not verifying itemType as Primary/Secondary as it appears that this distinction may not be necessary in the mobile version.
    this.traceService.info(this._trModule, `Added ${(item as unknown as MenuItemAction).label}
    with action ${(item as unknown as MenuItemAction).action} as ${itemType} action.`);
    (item as unknown as MenuItemAction).icon = ''; // Remove item icon on mobile
    this.contentItem.push(item);
  }
  /**
   * Populates the content action items based on the provided itemType and items array.
   * @param itemType The type of content items to populate (e.g., 'primary' or 'secondary').
   * @param items The array of MenuItem objects representing the content items to populate.
   */
  public populateContentActionItems(itemType: string, items: ContentActionBarMainItem[]): void {
    if (!isNullOrUndefined(items)) {
      items.forEach(item => {
        if ((item as unknown as MenuItemAction).label &&
          !this.contentItem.some(contentItem => (contentItem as unknown as MenuItemAction).label === (item as unknown as MenuItemAction).label) &&
          ((item as unknown as MenuItemAction).label && !(item as unknown as MenuItemAction).action.toString().includes('onExpandCollapse()'))) {
          this.addContentActionItem(item, itemType);
        }
      });
      this.hideContentActions = this.contentItem.length === 0;
    }
  }

  /**
   * Tracks the snapin items by their index and action.
   * @param index The index of the snapin item in the array.
   * @param _action The action to track.
   * @returns The index of the snapin item.
   */
  public trackSnapinsByIndex(index: number, _action: any): any {
    return index;
  }

  /**
   * Tracks the content items by their index and item object.
   * @param index The index of the content item in the array.
   * @param _item The content item to track.
   * @returns The index of the content item.
   */
  public trackContentItemByIndex(index: number, _item: any): any {
    return index;
  }

  /**
   * Handles the click event on a content action item, currently it has no advance however,
   * in anticipation of potential external actions that may need to be invoked, this method shall be utilized
   * and therefore kept for future use.
   */
  public contentActionClick(): void {
    this.traceService.info(this._trModule, `Content action item clicked.`);
    this.hideActionSheet();
  }

  /**
   * Toggles the system browser status and updates the mobileNavigationService accordingly.
   */
  public toggleSystemBrowser(): void {
    this.sysBrowActive = !this.sysBrowActive;
    this.mobileNavigationService.setSysBrowActive(this.sysBrowActive);
    this.traceService.info(this._trModule, `System browser status changed: ${this.sysBrowActive}`);
  }

  /**
   * Selects DOM elements based on their respective query selectors.
   * @returns An object containing selected DOM elements.
   */
  private selectElements(): {
    tilesContainer: HTMLElement | null,
    eventList: HTMLElement | null,
    portfolioManager: HTMLElement | null,
    tasksSnapin: HTMLElement | null,
    aboutSnapin: HTMLElement | null,
    accountSnapin: HTMLElement | null,
    footerBar: HTMLElement | null,
    notification: HTMLElement | null,
    layoutSettings: HTMLElement | null,
    notifConfig: HTMLElement | null,
    nodeMapView: HTMLElement | null,
    notifRecipentView: HTMLElement | null,
    verticalPanel: HTMLElement | null,
    siSidePanelContent: HTMLElement | null
  } {

    // Function to safely query and cast an element by its selector
    const querySelector = (selector: string): HTMLElement | null => document.querySelector(selector) as HTMLElement | null;

    // Select various DOM elements based on their respective query selectors
    const tilesContainer = querySelector(MobileViewComponent.queryHfwTileContainer);
    const eventList = querySelector(MobileViewComponent.querySnapinsEvents);
    const portfolioManager = querySelector(MobileViewComponent.queryPortfolioManager);
    const tasksSnapin = querySelector(MobileViewComponent.querySnapinsTasks);
    const aboutSnapin = querySelector(MobileViewComponent.querySnapinsAbout);
    const accountSnapin = querySelector(MobileViewComponent.querySnapinsAccount);
    const footerBar = querySelector(MobileViewComponent.queryHfwFooterBar);
    const notification = querySelector(MobileViewComponent.queryNotifications);
    const layoutSettings = querySelector(MobileViewComponent.queryLayoutSettings);
    const notifConfig = querySelector(MobileViewComponent.queryNotifConfig);
    const nodeMapView = querySelector(MobileViewComponent.queryNodeMapView);
    const notifRecipentView = querySelector(MobileViewComponent.queryNotifRecipentView);
    const verticalPanel = querySelector(MobileViewComponent.queryCollapseToggleVerticalPanel);

    // Determine siSidePanelContent based on eventList existence
    const siSidePanelContent = !eventList
      ? document.getElementById(MobileViewComponent.querySiSidePanel)
      : document.getElementById(MobileViewComponent.querySiSidePanelEvent);

    return {
      tilesContainer,
      eventList,
      portfolioManager,
      tasksSnapin,
      aboutSnapin,
      accountSnapin,
      footerBar,
      notification,
      layoutSettings,
      notifConfig,
      nodeMapView,
      notifRecipentView,
      verticalPanel,
      siSidePanelContent
    };
  }

  /**
 * Adjusts the layout of the tiles container based on the mobile view status.
 * @param tilesContainer The tiles container element.
 */
  private adjustTilesContainerLayout(tilesContainer: HTMLElement | null): void {
    if (tilesContainer) {
      tilesContainer.style.justifyContent = this.isMobile
        ? MobileViewComponent.justifyContentMobile
        : MobileViewComponent.justifyContentDesktop;
    }
  }

  /**
   * Adjusts the margin of the right-side panel toggle based on its open/close state and mobile view status.
   * @param siSidePanelContent The right-side panel content element.
   * @param eventList The event list element.
   */
  private adjustRightPanelToggleMargin(siSidePanelContent: HTMLElement | null, eventList: HTMLElement | null): void {
    // Assigns the value of MobileViewComponent.marginBlockStartCollapseToggleClosed to
    // marginBlockStartCollapseToggleClosed if eventList is falsy, otherwise assigns the value of
    // MobileViewComponent.marginBlockStartCollapseToggleClosedEvent.
    const marginBlockStartCollapseToggleClosed = !eventList
      ? MobileViewComponent.marginBlockStartCollapseToggleClosed
      : MobileViewComponent.marginBlockStartCollapseToggleClosedEvent;

    // Adjust margin-block-start for the right-side-panel toggle as default value covers the status-bar making it unusable
    if (siSidePanelContent) {
      const siSidePanelContentHeader = siSidePanelContent.querySelector(`.${MobileViewComponent.querySiSidePanelContentHeader}`) as HTMLElement;
      if (siSidePanelContentHeader) {
        const collapseToggleElement = siSidePanelContentHeader.querySelector(`.${MobileViewComponent.queryCollapseToggleRightSidePanel}`) as HTMLElement;
        const marginBlockStart = !this.isRightPanelOpen && this.isMobile ? marginBlockStartCollapseToggleClosed :
          MobileViewComponent.marginBlockStartCollapseToggleOpen;
        collapseToggleElement.style.setProperty('margin-block-start', marginBlockStart, 'important');
      }
    }
  }

  /**
 * Determines if any elements need updating based on certain conditions.
 * @param accountSnapin The account snapin element.
 * @returns A boolean indicating whether elements need updating.
 */
  private determineUpdateConditions(accountSnapin: HTMLElement | null): boolean {
    const elementsToUpdate = [
      accountSnapin,
      document.querySelector(MobileViewComponent.querySnapinsEvents),
      document.querySelector(MobileViewComponent.querySnapinsTasks),
      document.querySelector(MobileViewComponent.querySnapinsAbout),
      document.querySelector(MobileViewComponent.querySnapinsAccount),
      document.querySelector(MobileViewComponent.queryNotifications),
      document.querySelector(MobileViewComponent.queryLayoutSettings),
      document.querySelector(MobileViewComponent.queryNotifConfig),
      document.querySelector(MobileViewComponent.queryNodeMapView),
      document.querySelector(MobileViewComponent.queryNotifRecipentView),
      document.querySelector(MobileViewComponent.queryPortfolioManager)
    ];
    return elementsToUpdate.some(element => element !== null) || this.isRightPanelOpen;
  }

  /**
 * Updates the elements on requirements or resets settings.
 * @param shouldUpdateElements Boolean indicating whether elements need updating.
 * @param accountSnapin The account snapin element.
 * @param footerBar The footer bar element.
 * @param maxWidth The maximum width for the account snapin.
 */
  private updateElements(
    shouldUpdateElements: boolean,
    accountSnapin: HTMLElement | null,
    footerBar: HTMLElement | null,
    notifConfig: HTMLElement | null,
    aboutSnapin: HTMLElement | null,
    maxWidth: string
  ): void {
    if (shouldUpdateElements) {
      if (accountSnapin) {
        accountSnapin.style.maxWidth = maxWidth;
        this.mobileNavigationService.updateAccountSnapinActive(true);
      } else {
        this.mobileNavigationService.updateAccountSnapinActive(false);
        /* This function updateOperatorTasksSnapinActive() serves for managing the activation status of various snapins,
        * including notification-config and about snapin.
        * Since there are no specific requirements for these snapins currently, this function can be utilized for them.
        * However, if additional requirements emerge in the future, the method name should be adjusted accordingly,
        * and a new method should be introduced in the mobile-navigation service. */
        if (!!document.querySelector(MobileViewComponent.querySnapinsTasks) || notifConfig || aboutSnapin) {
          this.mobileNavigationService.updateOperatorTasksSnapinActive(true);
        } else {
          this.mobileNavigationService.updateOperatorTasksSnapinActive(false);
        }
      }
      footerBar!.classList.add(MobileViewComponent.visibilityHide);
    } else {
      if (this.showSnapinNavigate || this.showContentActions) {
        footerBar!.classList.add(MobileViewComponent.visibilityHide);
      } else {
        footerBar!.classList.remove(MobileViewComponent.visibilityHide);
      }
      this.mobileNavigationService.updateOperatorTasksSnapinActive(false);
      this.mobileNavigationService.updateAccountSnapinActive(false);
    }
  }

  /**
   * Sets the lastNode value in the mobileNavigationService based on the history length.
   */
  private setLastNodeValue(): void {
    this.mobileNavigationService.setLastNode(window.history.length <= MobileViewComponent.minLastNode);
  }

  /**
 * Sets If the event snapin is active, margin-bottom value would be changed with respect to that.
  * Updates the flag for bottom space calculation based on changes to the footer bar.
  * This method should be used whenever the footer bar is hidden or made visible again.
  */
  private calculateBottomSpace(calculateBottomSpace: HTMLElement | null): void {
    // Update mobileNavigationService settings if specific conditions are met
    this.mobileNavigationService.updateBottomSpaceCalculationFlag(
      !!((!(this.showContentActions || this.showSnapinNavigate) && calculateBottomSpace))
    );
  }

  /**
 * Sets the max account width according to the mobile rules %50 - %100.
 */
  private accountSnapinMaxWidthHandler(): string {
    return this.isMobile ? MobileViewComponent.mobileAccountMaxWidth : MobileViewComponent.accountMaxWidth;
  }
}
