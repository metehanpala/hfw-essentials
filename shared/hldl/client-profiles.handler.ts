import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isNullOrUndefined, ITrace } from '@gms-flex/services-common';
import { Observable, Observer, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { TraceModules } from '../trace/trace-modules';

/**
 * Handles the reading of client profile hldl files.
 *
 * @export
 * @class ClientProfilesHandler
 */
export class ClientProfilesHandler {

  private clientProfiles!: any[];

  public constructor(
    private readonly httpClient: HttpClient,
    private readonly profilesFolderPath: string,
    private readonly trace: ITrace) {
  }

  /**
   * Returns an observable. Subscribing to it invokes the reading in chain of all client profiles.
   *
   * @returns {Observable<any[]>}
   *
   * @memberOf ClientProfilesHandler
   */
  public getAllClientProfiles(initialHldl: any, initialHldlFileName: string): Observable<any[]> {
    return new Observable((observer: Observer<any[]>) => {
      this.onSubscription(initialHldl, initialHldlFileName, observer);
      return (): any => this.teardownLogic();
    });
  }

  private onSubscription(initialHldl: any, previousHldlFileName: string, observer: Observer<any[]>): void {
    if (!isNullOrUndefined(initialHldl.hfwInstance)) { // this is a base profile.
      this.trace.debug(TraceModules.hldlReader, ': %s profile is a base file. getAllClientProfiles completed.', previousHldlFileName);
      this.pushProfile(initialHldl, true);
      this.pushToClientAndDispose(observer, this.clientProfiles);
    } else {
      if (!isNullOrUndefined(initialHldl.hfwExtension) && !isNullOrUndefined(initialHldl.hfwExtension.parentProfile)) { // this is a client profile.
        this.pushProfile(initialHldl, false);
        this.trace.debug(TraceModules.hldlReader, ': %s profile is an extension. Getting %s...', previousHldlFileName, initialHldl.hfwExtension.parentProfile);
        this.httpClient.get(this.profilesFolderPath + initialHldl.hfwExtension.parentProfile).pipe(
          catchError((error: HttpErrorResponse) => {
            return this.handleError(error, observer);
          })
        ).subscribe((rawHldl: any) => {
          this.trace.debug(TraceModules.hldlReader, ': %s profile retrieved.', initialHldl.hfwExtension.parentProfile);
          this.onSubscription(rawHldl, initialHldl.hfwExtension.parentProfile, observer);
        });
      } else {
        this.pushToClientAndDispose(observer, this.clientProfiles);
      }
    }
  }

  private pushProfile(initialHldl: any, isBase: boolean): void {
    if (isNullOrUndefined(this.clientProfiles)) {
      this.clientProfiles = [];
    }
    if (isBase) {
      this.clientProfiles.push(initialHldl.hfwInstance);
    } else {
      this.clientProfiles.push(initialHldl.hfwExtension);
    }
  }

  private pushToClientAndDispose(observer: Observer<any[]>, result: any[] | null): void {
    observer.next(result as any[]);
    observer.complete();
  }

  private teardownLogic(): void {
    this.trace.info(TraceModules.hldlReader, 'teardownLogic() called for for ClientProfileHandler...');
    this.dispose();
  }

  private dispose(): void {
  }

  private handleError(httpErrorResponse: HttpErrorResponse, observer: Observer<any[]>): Observable<any> {
    const errMsg: string = (httpErrorResponse.message) ? httpErrorResponse.message :
      httpErrorResponse.status ? `${httpErrorResponse.status} - ${httpErrorResponse.statusText}` : 'Server error';
    this.trace.error(TraceModules.hldlReader, ': Error getting HLDL profile: ' + errMsg);
    this.pushToClientAndDispose(observer, null);
    return throwError(httpErrorResponse);
  }
}
