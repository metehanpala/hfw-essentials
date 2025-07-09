/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/member-ordering */
/**
 * MobileNavigationService
 *
 * This service is responsible for managing the mobile navigation functionality,
 * particularly for the footer-bar which can be found in mobile/mobile-view/.
 */

import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { ContentActionBarMainItem } from '@simpl/element-ng';
import { Subject } from 'rxjs';

import { TraceModules } from '../../shared/trace/trace-modules';

export enum DeviceType {
  Iphone = 'iPhone',
  Android = 'Android',
  Ipad = 'iPad',
  MacOS = 'MacOS',
  Windows = 'Windows',
  Unknown = 'Unknown'
}

@Injectable({
  providedIn: 'root'
})
export class MobileNavigationService {

  private readonly _trModule: string = TraceModules.mobileService;

  private readonly mobileOnlyVisibilitySubject = new Subject<boolean>();
  private readonly primaryItemsSubject = new Subject<ContentActionBarMainItem[]>();
  private readonly secondaryItemsSubject = new Subject<ContentActionBarMainItem[]>();
  private readonly snapinTitleSubject = new Subject<string>();
  private readonly headerTitleSubject = new Subject<string>();
  private readonly paneStoreSubject = new Subject<any>();
  private readonly paneConfigSubject = new Subject<any>();
  private readonly snapInsSubject = new Subject<any>();
  private readonly tabsSubject = new Subject<any>();
  private readonly sysBrowActiveSubject = new Subject<any>();
  private readonly backNavigateSubject = new Subject<any>();
  private readonly isLastNodeSubject = new Subject<any>();
  private readonly isRightPanelOpenSubject = new Subject<any>();
  private readonly handleSummaryBarSubject = new Subject<any>();
  private readonly calculateBottomSpaceSubject = new Subject<any>();
  private readonly portfolioManagerSubject = new Subject<any>();

  // Device Information
  private deviceType: DeviceType = DeviceType.Unknown;

  /**
   * Temp holder for the latest visibility value of the mobile view
   */
  public mobileOnlyVisibilityLast: boolean | undefined;
  /**
   * Observable that emits the visibility of the mobile view.
   */
  public readonly mobileOnlyVisibility$ = this.mobileOnlyVisibilitySubject.asObservable();
  /**
   * Observable that emits the primary menu items for the content-action.
   */
  public readonly primaryItems$ = this.primaryItemsSubject.asObservable();
  /**
   *  Observable that emits the secondary menu items for the content-action.
   */
  public readonly secondaryItems$ = this.secondaryItemsSubject.asObservable();
  /**
   * Observable that emits the title for the selected snapin.
   */
  public readonly snapinTitle$ = this.snapinTitleSubject.asObservable();
  /**
   * Observable that emits the title for the header section for the selected snapin.
   */
  public readonly headerTitle$ = this.headerTitleSubject.asObservable();
  /**
   * Observable that emits the paneStore.
   */
  public readonly paneStore$ = this.paneStoreSubject.asObservable();
  /**
   * Observable that emits the pane configuration.
   */
  public readonly paneConfig$ = this.paneConfigSubject.asObservable();
  /**
   * Observable that emits snapins for the current pane.
   */
  public readonly snapIns$ = this.snapInsSubject.asObservable();
  /**
   * Observable that emits tabs of the current pane.
   */
  public readonly tabs$ = this.tabsSubject.asObservable();
  /**
   * Observable that emits If the system browser is active or not.
   */
  public readonly sysBrowActive$ = this.sysBrowActiveSubject.asObservable();
  /**
   * Observable that emits If the back button is clicked (pane tab) to navigate to the latest selected node
   */
  public readonly backNavigate$ = this.backNavigateSubject.asObservable();
  /**
   * Observable that emits If system browser is at last node
   */
  public readonly isLastNode$ = this.isLastNodeSubject.asObservable();
  /**
   * Observable that emits If bottom space shall be recalculated
   */
  public readonly calculateBottomSpace$ = this.calculateBottomSpaceSubject.asObservable();
  /**
   * Observable that emits the value to determine If summary bar should be handled
   */
  public readonly handleSummaryBar$ = this.handleSummaryBarSubject.asObservable();
  /**
   * Observable that emits the status of the right-panel
   */
  public readonly isRightPanelOpen$ = this.isRightPanelOpenSubject.asObservable();
  /**
  * Observable that emits If Portfolio Manager is active or not
  */
  public readonly isPortfolio$ = this.portfolioManagerSubject.asObservable();

  constructor(private readonly traceService: TraceService) {
  }
  /**
   * Update the visibility of the mobile view.
   * @param isVisible A boolean indicating the visibility of the mobile view.
   * Sets also the mobileOnlyVisibilityLast, for some required cases.
   */
  public updateMobileOnlyVisibility(isVisible: boolean): void {
    this.mobileOnlyVisibilitySubject.next(isVisible);
    this.mobileOnlyVisibilityLast = isVisible;
    this.traceService.info(this._trModule, 'mobile view=%s', isVisible);
  }

  /**
    * Update the flag for bottom space calculation when the footer bar is absent.
    * When the footer bar is hidden, an extra space remains at the bottom, which could be utilized by the snap-in to maximize available space.
    * This flag is necessary to ensure that the extra space is effectively used when the footer bar is hidden.
    * @param calculateBottomSpace A boolean indicating the flag for the bottom space calculation.
    */
  public updateBottomSpaceCalculationFlag(calculateBottomSpace: boolean): void {
    this.calculateBottomSpaceSubject.next(calculateBottomSpace);
    this.traceService.info(this._trModule, 'bottom space should be re-calculated =%s', calculateBottomSpace);
  }

  /**
 * Update the If the operator-tasks-snapin is active
 * @param isTasksActive A boolean indicating the visibility of the operator tasks snapin.
 */
  public updateOperatorTasksSnapinActive(isTasksActive: boolean): void {
    this.handleSummaryBarWidth(isTasksActive);
    this.traceService.info(this._trModule, 'operator tasks snapin is active =%s', isTasksActive);
  }

  /**
* Update the If the Account snapin is active
* @param isAccountActive A boolean indicating the visibility of the account snapin.
*/
  public updateAccountSnapinActive(isAccountActive: boolean): void {
    this.handleSummaryBarWidth(isAccountActive);
    this.traceService.info(this._trModule, 'Account snapin is active =%s', isAccountActive);
  }

  /**
 * Determine If Summary Bar shall be shrunk or not. This method could be used for the cases where summary-bar shall be
 * enlarged or shrunk depending on the right-side panel collapsible button.
 * @param handleFlag A boolean indicating If the summary-bar shall be handled.
 */
  public handleSummaryBarWidth(handleFlag: boolean): void {
    this.handleSummaryBarSubject.next(handleFlag);
    this.traceService.info(this._trModule, 'Summary bar should be handled for this snapin =%s', handleFlag);
  }

  /**
   * Set the primary and secondary menu items for the content-action ellipsis in the footer.
   * @param primaryItems An array of primary menu items for the content-action.
   * @param secondaryItems An array of secondary menu items for the content-action.
   */
  public setContentActionItems(primaryItems: ContentActionBarMainItem[], secondaryItems: ContentActionBarMainItem[]): void {
    this.primaryItemsSubject.next(primaryItems);
    this.secondaryItemsSubject.next(secondaryItems);
    this.traceService.info(this._trModule, 'content action items are updated.');
  }
  /**
   * Set the device information available for the consumers (iPad/iPhone/Android/Windows/MacOS/Unknown).
   * @param deviceType The device type enum.
   */
  public getDeviceInfo(): DeviceType {
    const touchSupport: boolean = !!navigator.maxTouchPoints && navigator.maxTouchPoints > 2;
    if (/iPhone/i.test(navigator.userAgent)) {
      this.deviceType = DeviceType.Iphone;
    } else if (/Android/i.test(navigator.userAgent)) {
      this.deviceType = DeviceType.Android;
    } else if (/iPad/i.test(navigator.userAgent)) {
      this.deviceType = DeviceType.Ipad;
    } else if (/Mac/i.test(navigator.userAgent)) {
      // In some cases iPad userAgent is returned as MacOS, touch points are checked to ensure correct device info
      this.deviceType = touchSupport ? DeviceType.Ipad : DeviceType.MacOS;
    } else {
      // Assume it's Windows if it's not iPhone, Android, iPad, or macOS
      this.deviceType = DeviceType.Windows;
    }
    return this.deviceType;
  }

  /**
   * Set the title for the snap-in section of the footer in the mobile navigation.
   * @param snapinTitle The title of the selected snapin.
   */
  public setSnapinTitle(snapinTitle: string): void {
    this.snapinTitleSubject.next(snapinTitle);
    this.traceService.info(this._trModule, 'snapinTitle has value change.');
  }

  /**
* Sets the Portfolio Manager open property.
*
* @param isPortfolio- A boolean indicating whether the current frame is Portfolio Manager.
*/
  public setPortfolioManagerStatus(isPortfolio: boolean): void {
    this.portfolioManagerSubject.next(isPortfolio);
    this.traceService.info(this._trModule, 'isLastNodeSubject has a value change.');
  }

  /**
   * Set the snap-ins for the content-action ellipsis in the footer.
   * @param snapins An array of snapins available for the selected pane.
   */
  public setSnapIns(snapins: any): void {
    this.snapInsSubject.next(snapins);
    this.traceService.info(this._trModule, 'snapInsSubject has a value change.');
  }

  /**
   * Sets the value of the pane store by publishing the new pane store to the subject.
   * @param {any} paneStore - The paneStore for the selected pane.
   * @returns {void}
   */
  public setPaneStore(paneStore: any): void {
    this.paneStoreSubject.next(paneStore);
    this.traceService.info(this._trModule, 'paneStoreSubject has a value change.');
  }

  /**
   * Sets the value of the pane configuration by publishing the new pane configuration to the subject.
   * @param {any} paneConfig - The pane configuration for the selected pane.
   * @returns {void}
   */
  public setPaneConfig(paneConfig: any): void {
    this.paneConfigSubject.next(paneConfig);
    this.traceService.info(this._trModule, 'paneConfigSubject has a value change.');
  }

  /**
   * Sets the tabs data and notifies observers.
   * @param tabs - The new tabs data to be set.
   */
  public setTabs(tabs: any): void {
    this.tabsSubject.next(tabs);
    this.traceService.info(this._trModule, 'tabsSubject has a value change.');
  }

  /**
   * Sets the system browser's active state and notifies observers.
   *
   * @param isActive - A boolean indicating whether the system browser is active or not.
   */
  public setSysBrowActive(isActive: boolean): void {
    this.sysBrowActiveSubject.next(isActive);
    this.traceService.info(this._trModule, 'sysBrowActiveSubject has a value change.');
  }

  /**
   * Sets the back navigation state and notifies observers.
   * This method typically indicates whether a back navigation action is triggered.
   */
  public setbackNavigate(): void {
    this.backNavigateSubject.next(true);
    this.traceService.info(this._trModule, 'backNavigateSubject has a value change.');
  }

  /**
   * Sets the last node state and notifies observers.
   *
   * @param isLastNode - A boolean indicating whether the current node is the last node.
   */
  public setLastNode(isLastNode: boolean): void {
    this.isLastNodeSubject.next(isLastNode);
    this.traceService.info(this._trModule, 'isLastNodeSubject has a value change.');
  }

  /**
   * Sets the status of right-panel.
   *
   * @param isOpen - A boolean indicating whether the right-panel is open or not.
   */
  public setRightPanelState(isOpen: boolean): void {
    this.isRightPanelOpenSubject.next(isOpen);
    this.traceService.info(this._trModule, 'isRightPanelOpen has a value change.');
  }
}
