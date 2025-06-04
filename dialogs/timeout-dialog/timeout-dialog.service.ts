import { Injectable } from '@angular/core';
import { SessionCookieStorage, TraceService } from '@gms-flex/services-common';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CookieService } from 'ngx-cookie-service';
import { interval, Subject, Subscription } from 'rxjs';

import { TraceModules } from '../../shared/trace-modules';
import { TimeoutDialogComponent } from './timeout-dialog.component';
import { TimeoutDialogResult } from './timeout-dialog.model';

@Injectable({
  providedIn: 'root'
})
export class TimeoutDialogService {

  /**
   * An action that notify when timeout is done
   *
   * @returns {Observable<boolean>}
   *
   * @memberOf TimeoutDialogService
   */
  public logOutAction: Subject<boolean> = new Subject();
  public undefinedVar = undefined;

  private userActivity: any;
  private readonly userInactive: Subject<number | undefined> = new Subject();
  private timeoutValue = 0;
  private instances = 0;
  private modalRefShotDown!: BsModalRef;
  private readonly pathName: string;
  private readonly domainName: string;
  private sub!: Subscription;
  private isUL = false;

  constructor(private readonly modalService: BsModalService,
    private readonly cookieService: CookieService,
    private readonly traceService: TraceService) {

    this.pathName = this.cookieService.get(SessionCookieStorage.PathName) === '' ? '/' : this.cookieService.get(SessionCookieStorage.PathName);
    this.domainName = this.cookieService.get(SessionCookieStorage.DomainName);
  }

  public checkSessionCookieStorageRefreshTab(): void {
    const x = (Number(this.cookieService.get(SessionCookieStorage.TabCounter))) + 1;
    this.cookieService.set(SessionCookieStorage.TabCounter, x.toString(), { 'path': this.pathName, 'domain': this.domainName });
    // this RefreshTab is used as guard after refresh to
    // understand that ALL active tabs needs to be refresh
    // in order to do that TabCounter and TabCounterActive will be aligned

    this.cookieService.set(SessionCookieStorage.TabCounterActive, x.toString(), { 'path': this.pathName, 'domain': this.domainName });
    sessionStorage.setItem(SessionCookieStorage.RefreshTab, SessionCookieStorage.False);
    // the REFRESHTAB took care EVEN of set to false the cookies for modal
    if ((this.cookieService.check(SessionCookieStorage.ShowModal) &&
      this.cookieService.get(SessionCookieStorage.ShowModal) === SessionCookieStorage.True)) {
      this.cookieService.set(SessionCookieStorage.ShowModal, SessionCookieStorage.False, { 'path': this.pathName, 'domain': this.domainName });
    }
  }

  public aliveTabFunction(): void {
    // THIS IS the only ALIVE TAB -- counter = 1
    // No need to check EVEN the TabCounterActive Cookies
    // EXpectation is that TabCounterActive and TabCounter are both 1
    if ((sessionStorage.getItem(SessionCookieStorage.ActiveState) === SessionCookieStorage.True)) {
      sessionStorage.setItem(SessionCookieStorage.ActiveState, SessionCookieStorage.False);
    }
    // I m going to use the o modality
    // so far a didn t decrease under 1
    // but in order to properly restore after a timeout, i had to
    // so I can delete the TabCounterActive
    this.cookieService.delete(SessionCookieStorage.TabCounterActive, this.pathName, this.domainName);
    sessionStorage.setItem(SessionCookieStorage.ShowModal, SessionCookieStorage.True);
    // here check If the cookies are already set to show a Modal
    // the case where showModal is already true cannot exist
    // since cannot exist a case where the MODAL is in place
    // with a tab already active
    if ((this.cookieService.check(SessionCookieStorage.ShowModal) &&
     this.cookieService.get(SessionCookieStorage.ShowModal) === SessionCookieStorage.False) ||
     (!this.cookieService.check(SessionCookieStorage.ShowModal))) {
      this.cookieService.set(SessionCookieStorage.ShowModal, SessionCookieStorage.True, { 'path': this.pathName, 'domain': this.domainName });
    }
    this.logout();
  }

  public ifCounterDoesntExistFunction(): void {
    // this is the case where NO counter exist ....
    // NOT EXPECTED HAPPEN, since I m not DECREASING the counter
    // in case of value 1 fo
    // let s keep a security code
    // delete of cookie counter could happen just in case of KILL
    // or REFRESH
    if ((sessionStorage.getItem(SessionCookieStorage.ActiveState) === SessionCookieStorage.True)) {
      sessionStorage.setItem(SessionCookieStorage.ActiveState, SessionCookieStorage.False);
      this.cookieService.delete(SessionCookieStorage.TabCounterActive, this.pathName, this.domainName);
      sessionStorage.setItem(SessionCookieStorage.ShowModal, SessionCookieStorage.True);
      // here check If the cookies are already set to show a Modal
      // the case where showModal is already true cannot exist
      // since cannot exist a case where the MODAL is in place
      // with a tab already active
      if ((this.cookieService.check(SessionCookieStorage.ShowModal) &&
      this.cookieService.get(SessionCookieStorage.ShowModal) === SessionCookieStorage.False) ||
      (!this.cookieService.check(SessionCookieStorage.ShowModal))) {
        this.cookieService.set(SessionCookieStorage.ShowModal, SessionCookieStorage.True, { 'path': this.pathName, 'domain': this.domainName });
      }
      this.logout();
    }
  }

  public lastTabActiveFunction(): void {
    // I m going to use the o modality
    // so far a didn t decrease under 1
    // but in order to properly restore after a timeout, i had to
    // so I can delete the TabCounterActive
    this.cookieService.delete(SessionCookieStorage.TabCounterActive, this.pathName, this.domainName);
    // this tab was the LAST TAB ACTIVE (ALL the other were INACTIVE) TabCounterActive = 1
    // let s Show the DIalog
    // and SET the Cookie of MODAL to TRUE
    sessionStorage.setItem(SessionCookieStorage.ShowModal, SessionCookieStorage.True);
    // here check If the cookies are already set to show a Modal
    // the case where showModal is already true cannot exist
    // since cannot exist a case where the MODAL is in place
    // with a tab already active
    if ((this.cookieService.check(SessionCookieStorage.ShowModal) &&
         this.cookieService.get(SessionCookieStorage.ShowModal) === SessionCookieStorage.False) ||
         (!this.cookieService.check(SessionCookieStorage.ShowModal))) {
      this.cookieService.set(SessionCookieStorage.ShowModal, SessionCookieStorage.True, { 'path': this.pathName, 'domain': this.domainName });
    }
    this.logout();
  }

  public checkTabIfIsActiveOrNot(): void {
    // this IF is need to understand IF this tab is STILL active or not
    // if not I have to JUST refresh the timeout
    if ((sessionStorage.getItem(SessionCookieStorage.ActiveState) === SessionCookieStorage.True)) {
      sessionStorage.setItem(SessionCookieStorage.ActiveState, SessionCookieStorage.False);
      if (this.cookieService.check(SessionCookieStorage.TabCounterActive)) {
        const y = (Number(this.cookieService.get(SessionCookieStorage.TabCounterActive)));
        // Exist for sure more that a TAB alive ACTIVE
        if (y > 1) {
          this.cookieService.set(SessionCookieStorage.TabCounterActive, (y - 1).toString(), { 'path': this.pathName, 'domain': this.domainName });
        } else {
          this.lastTabActiveFunction();
        }
      }
      // BUT I should keep the timer alive, OTHERWISE, without acting on this tab, I ll be not able
      // to recover it, in case this one will remain the ONLY alive
    }
  }

  /**
   * Initialize the timeout logic and start to count
   *
   * @param User Inactivity value that is in minutes (must be read from authentication service)
   *
   * @memberOf TimeoutDialogService
   */
  public startTimeout(userInactivityTimeout: number, isUL: boolean): void {
    if (userInactivityTimeout && userInactivityTimeout > 0) {
      this.timeoutValue = userInactivityTimeout * 60000; // convert in milliseconds
      // lint don't recognize +=1 or ++
      this.instances = this.instances + 1;
      this.isUL = isUL;
      // start to calculate timeout
      this.logOutAction.next(false);
      // step after refresh for more than 1 counter to increment the counter decreased by refresh
      // Or even the simple creation of new tab
      // or first opening of the first tab
      sessionStorage.setItem(SessionCookieStorage.ActiveState, SessionCookieStorage.True);
      // in order to let the 4 case working on checkForShowDialog()
      sessionStorage.setItem(SessionCookieStorage.ShowModal, SessionCookieStorage.False);

      if (this.cookieService.check(SessionCookieStorage.TabCounter)) {
        this.checkSessionCookieStorageRefreshTab();
      } else {
        this.cookieService.set(SessionCookieStorage.TabCounter, '1', { 'path': this.pathName, 'domain': this.domainName });
        this.cookieService.set(SessionCookieStorage.TabCounterActive, '1', { 'path': this.pathName, 'domain': this.domainName });
      }
      this.setTimeout();
      this.userInactive.subscribe(() => {
        // timeout is expired
        if (this.cookieService.check(SessionCookieStorage.TabCounter)) {
          const x = (Number(this.cookieService.get(SessionCookieStorage.TabCounter)));
          const source = interval(1000);
          this.sub = source.subscribe((_value: any) => this.checkForShowDialog());
          // Exist for sure more that a TAB alive (Active or not)
          if (x > 1) {
            this.checkTabIfIsActiveOrNot();
          } else {
            this.aliveTabFunction();
          }
        } else {
          this.ifCounterDoesntExistFunction();
        }
      });
    }
  }

  /**
   * Refresh the timeout
   *
   * @memberOf TimeoutDialogService
   */
  public refreshTimeout(): void {
    clearTimeout(this.userActivity);
    this.setTimeout();
  }

  /**
   * Return the number of service instances
   *
   * @memberOf TimeoutDialogService
   */
  public getInstances(): number {
    return this.instances;
  }

  private setTimeout(): void {
    if (sessionStorage.getItem(SessionCookieStorage.ShowModal) &&
    sessionStorage.getItem(SessionCookieStorage.ShowModal) === SessionCookieStorage.True) {
      return;
    }
    // This is the metod called to RE-ACTIVate the timer
    // basing on the situation we have to, apart restarting the timer
    // change cookies and sessionstorage
    // add a unique flag to set the ACTIVE state of this session/tab
    if (sessionStorage.getItem(SessionCookieStorage.ActiveState)) {
      if ((sessionStorage.getItem(SessionCookieStorage.ActiveState) === SessionCookieStorage.False)) {
        sessionStorage.setItem(SessionCookieStorage.ActiveState, SessionCookieStorage.True);
        // after YES tabcounterActive goes to 2
        // this is due to the fact that, in case of 1 tab, inActive state doesn t decrement
        // the tabcounterActive, but the successive setTimeout did the increment
        // I have to put a check with tabcounterActive and tabcounter
        // in case of TabCounterActive = 1 we cannot have TabCounter = 1
        // So I have to avoid that  TabCounterActive and TabCounter are both 1
        // since in that case I don t want an incremet
        if ((this.cookieService.check(SessionCookieStorage.TabCounterActive))) {
          const x = (Number(this.cookieService.get(SessionCookieStorage.TabCounterActive)) + 1).toString();
          this.cookieService.set(SessionCookieStorage.TabCounterActive, x, { 'path': this.pathName, 'domain': this.domainName });
        } else {
          if (!this.cookieService.check(SessionCookieStorage.TabCounterActive)) {
            // I should be here SINCE I m restoring a TOTAL inactive situation
            this.cookieService.set(SessionCookieStorage.TabCounterActive, '1', { 'path': this.pathName, 'domain': this.domainName });
          }
        }
      }
    }
    this.userActivity = setTimeout(() => {
      this.userInactive.next(this.undefinedVar);
    }, this.timeoutValue);
  }

  private logout(): void {
    if (this.isUL) {
      this.cookieService.set(SessionCookieStorage.ShowModal, SessionCookieStorage.False, { 'path': this.pathName, 'domain': this.domainName });
      sessionStorage.setItem(SessionCookieStorage.ShowModal, SessionCookieStorage.False);
      this.logOutAction.next(true);
      this.refreshTimeout();
      return;
    }
    this.modalRefShotDown = this.modalService.show(TimeoutDialogComponent, { ignoreBackdropClick: true });
    if (this.modalRefShotDown) {
      this.modalRefShotDown.content.action.subscribe((result: TimeoutDialogResult) => {
        this.traceService.info(TraceModules.timeoutDialog, 'TimeoutDialog showDialog replying %s.', result);

        if (result === TimeoutDialogResult.Yes) {
          // keep working
          // ad stopping to listening the other
          this.sub.unsubscribe();
          this.cookieService.set(SessionCookieStorage.ShowModal, SessionCookieStorage.False, { 'path': this.pathName, 'domain': this.domainName });
          sessionStorage.setItem(SessionCookieStorage.ShowModal, SessionCookieStorage.False);
          // for sure I have to re activate my self
          this.refreshTimeout();
        } else if (result === TimeoutDialogResult.No) {
          // force log OFF with NO
          // same behavior as YES in order to manage the Unsave Date
          // since there is a change to keep the flex client alive
          // so, we don t want to DISCARD the actual session cookies state
          this.sub.unsubscribe();
          this.cookieService.set(SessionCookieStorage.ShowModal, SessionCookieStorage.False, { 'path': this.pathName, 'domain': this.domainName });
          sessionStorage.setItem(SessionCookieStorage.ShowModal, SessionCookieStorage.False);
          this.logOutAction.next(false);
        } else {
          // let log off without clicking
          this.sub.unsubscribe();
          this.cookieService.set(SessionCookieStorage.ShowModal, SessionCookieStorage.False, { 'path': this.pathName, 'domain': this.domainName });
          this.cookieService.set(SessionCookieStorage.TabCounter, '1', { 'path': this.pathName, 'domain': this.domainName });
          sessionStorage.setItem(SessionCookieStorage.ShowModal, SessionCookieStorage.False);
          sessionStorage.setItem(SessionCookieStorage.ActiveState, SessionCookieStorage.False);
          sessionStorage.setItem(SessionCookieStorage.TimerLogOff, SessionCookieStorage.True);
          this.logOutAction.next(true);
          this.logOutAction.complete();
        }
      }, (error: Error) => {
        this.traceService.info(TraceModules.timeoutDialog, 'TimeoutDialog showDialog error %s. Replying TimeoutDialog logout.', error);
        this.logOutAction.next(true);
        this.logOutAction.complete();
      });

    }
  }

  private checkForShowDialog(): void {
    // first case
    // a refresh is in place
    // ALL tabs are again ACTIVE
    if (this.cookieService.check(SessionCookieStorage.TabCounter) &&
      this.cookieService.check(SessionCookieStorage.TabCounterActive) &&
      this.cookieService.get(SessionCookieStorage.TabCounter) === this.cookieService.get(SessionCookieStorage.TabCounterActive)) {
      // in order to not ENTER every time here
      // let s add a guard for inactive
      if (sessionStorage.getItem(SessionCookieStorage.ActiveState) === SessionCookieStorage.False) {
        sessionStorage.setItem(SessionCookieStorage.ActiveState, SessionCookieStorage.True);
        if (sessionStorage.getItem(SessionCookieStorage.ShowModal) &&
        sessionStorage.getItem(SessionCookieStorage.ShowModal) === SessionCookieStorage.True) {
          if (this.modalRefShotDown) {
            this.modalRefShotDown.content.onYes();
          }
        }
        this.userActivity = setTimeout(() => {
          this.userInactive.next(undefined);
        }, this.timeoutValue);
      }
    } else {
      this.elsePathForCheckForShowDialog();
    }
  }

  private elsePathForCheckForShowDialog(): void {
    // second case
    // I m Active, so IM NOT LISTENING
    // for now let s entrust in normal round
    // same for the third
    // I m INActive, I receive the Log OUT (should we do something )
    // but even here we entrust in normal loop
    // so the forth
    // Im inactive, ALL the other became inactive, I have to show the dialog
    if (this.cookieService.check(SessionCookieStorage.ShowModal) &&
    this.cookieService.get(SessionCookieStorage.ShowModal) === SessionCookieStorage.True &&
    sessionStorage.getItem(SessionCookieStorage.ShowModal) &&
    sessionStorage.getItem(SessionCookieStorage.ShowModal) === SessionCookieStorage.False) {
      sessionStorage.setItem(SessionCookieStorage.ShowModal, SessionCookieStorage.True);
      this.logout();
    } else {
      // fifth case
      // Im inactive, I m showing dialog, the other click YES
      if (this.cookieService.check(SessionCookieStorage.ShowModal) &&
      this.cookieService.get(SessionCookieStorage.ShowModal) === SessionCookieStorage.False &&
      sessionStorage.getItem(SessionCookieStorage.ShowModal) &&
      sessionStorage.getItem(SessionCookieStorage.ShowModal) === SessionCookieStorage.True) {
        // we continue working restearting time and activation
        if (this.modalRefShotDown) {
          this.modalRefShotDown.content.onYes();
        }
      }
    }
  }
}
