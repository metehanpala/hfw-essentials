import { Component, HostBinding, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isNullOrUndefined, SessionCookieStorage } from '@gms-flex/services-common';
import { CookieService } from 'ngx-cookie-service';
import { combineLatest } from 'rxjs';

import { IStateService } from '../../common/interfaces/istate.service';
import { MobileNavigationService } from '../mobile/mobile-service/mobile-navigation.service';
import { HfwFrame } from '../shared/hldl/hldl-data.model';
import { FrameStore } from '../shared/stores/frame.store';
import { SnapInStore } from '../shared/stores/snapin.store';

const returnForUnsaveData = 'continue without pop-up';

@Component({
  selector: 'hfw-page',
  templateUrl: './page.component.html',
  standalone: false
})

export class PageComponent implements OnInit {

  // @HostBinding('class') public classAttribute = 'px-9 pt-6 pb-6'
  // @HostBinding('class') public classAttribute = 'si-layout-fixed-height mb-6 si-layout-main-padding';
  public dynamicClass = 'si-layout-fixed-height mb-6 si-layout-main-padding';

  @HostBinding('class')
  public get classAttribute(): string {
    return this.dynamicClass;
  }

  public frames: HfwFrame[] | null = null;
  private readonly availableSnapIns: SnapInStore[] = [];
  private pathName = '';
  private domainName = '';

  /*
   * Handles initialization after directive's data-bound properties have been initialized.
   */
  public ngOnInit(): void {
    this.frames = this.stateService.getFrames();
    this.pathName = this.cookieService.get(SessionCookieStorage.PathName) === '' ? '/' : this.cookieService.get(SessionCookieStorage.PathName);
    this.domainName = this.cookieService.get(SessionCookieStorage.DomainName);

    // Subscribe to the screen size change event to configure mobile view and If the event snapin is active
    combineLatest([
      this.mobileNavigationService.mobileOnlyVisibility$,
      this.mobileNavigationService.calculateBottomSpace$
    ]).subscribe(([isVisible, isBottomSpaceCalculation]) => {
      if (isNullOrUndefined(isBottomSpaceCalculation)) {
        isBottomSpaceCalculation = false;
      }

      if (isVisible) {
        this.dynamicClass = !isBottomSpaceCalculation
          ? 'si-layout-fixed-height mb-mobile-view si-layout-main-padding'
          : 'si-layout-fixed-height mb-mobile-view-event mb-6 si-layout-main-padding';
      } else {
        this.dynamicClass = 'si-layout-fixed-height mb-6 si-layout-main-padding';
      }
    });
  }

  public readonly trackByIndex = (index: number): number => index;

  public constructor(
    private readonly mobileNavigationService: MobileNavigationService,
    private readonly stateService: IStateService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly cookieService: CookieService
  ) {
    this.stateService.activateQParamSubscription(this.activatedRoute);
  }

  public checkFunction(): void {
    const x = (Number(this.cookieService.get(SessionCookieStorage.TabCounter)));
    if (x > 1) {
      this.cookieService.set(SessionCookieStorage.TabCounter, (x - 1).toString(), { 'path': this.pathName, 'domain': this.domainName });
      // I m goign to decrease the TabCounterActive JUSt if I m active
      // Im not going to change TabCounterActive IF I m not Active
      if (this.cookieService.check(SessionCookieStorage.TabCounterActive)) {
        const y = (Number(this.cookieService.get(SessionCookieStorage.TabCounterActive)));
        if (y > 1) {
          if ((sessionStorage.getItem(SessionCookieStorage.ActiveState) === SessionCookieStorage.True)) {
            this.cookieService.set(SessionCookieStorage.TabCounterActive, (y - 1).toString(), { 'path': this.pathName, 'domain': this.domainName });
          }
        } else {
          // this tab was the last active one
          if ((sessionStorage.getItem(SessionCookieStorage.ActiveState) === SessionCookieStorage.True)) {
            this.cookieService.delete(SessionCookieStorage.TabCounterActive, this.pathName, this.domainName);
          }
          sessionStorage.removeItem(SessionCookieStorage.ActiveState);
        }
      }
    } else {
      // here THERE is JUST one existing tab
      // I m going to delete EVERY cookies or sesionstorage
      this.cookieService.delete(SessionCookieStorage.TabCounter, this.pathName, this.domainName);
      if (this.cookieService.check(SessionCookieStorage.ShowModal)) {
        this.cookieService.delete(SessionCookieStorage.ShowModal, this.pathName, this.domainName);
      }
      if (this.cookieService.check(SessionCookieStorage.TabCounterActive)) {
        this.cookieService.delete(SessionCookieStorage.TabCounterActive, this.pathName, this.domainName);
      }
      sessionStorage.removeItem(SessionCookieStorage.ActiveState);
    }
    // --- I cannot start with an Inactivity Dialog in place
    // so, IF is a closure tab, OR, if is a refresh, I have to set my showModal to false
    sessionStorage.removeItem(SessionCookieStorage.ShowModal);
    // same for ActiveState refresh make me start from scratch
    sessionStorage.removeItem(SessionCookieStorage.ActiveState);
    sessionStorage.setItem(SessionCookieStorage.RefreshTab, SessionCookieStorage.True);
  }

  @HostListener('window:beforeunload')
  public unloadHandler(): any {
    if (this.cookieService.check(SessionCookieStorage.TabCounter)) {
      this.checkFunction();
    }
    const currentFrameId: string = this.stateService.currentState.activeWorkAreaIdValue;
    const frame: FrameStore | null = this.stateService.currentState.getFrameStoreViaId(currentFrameId);
    frame?.snapInInstanceMap?.forEach(store => {
      if (store.isTabVisible) {
        this.availableSnapIns.push(store);
      }
    });
    if (sessionStorage.getItem(SessionCookieStorage.TimerLogOff) &&
      sessionStorage.getItem(SessionCookieStorage.TimerLogOff) === SessionCookieStorage.True) {
      sessionStorage.removeItem(SessionCookieStorage.TimerLogOff);
      return returnForUnsaveData;
    } else if (sessionStorage.getItem(SessionCookieStorage.UserRoles) &&
      sessionStorage.getItem(SessionCookieStorage.UserRoles) === SessionCookieStorage.True) {
      return returnForUnsaveData;
    } else {
      if (this.availableSnapIns.some(store => store.storageService && store.storageService.getDirtyState(store.fullSnapInId) === true)) {
        return false;
      }
      return returnForUnsaveData;
    }
  }

  public onRouteChanged(value: any): void {
    if (value?.route?.snapshot?.data?.id != null) {
      this.stateService.updateStateAfterFrameChange(value.route.snapshot.data.id);
    }
  }
}
