import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, Observer, of, Subscription, throwError } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';

import { TraceModules } from '../trace/trace-modules';
import { ExtensionListItem } from './extension-list-item.model';

interface ExtensionStore {
  extensionDataPerName: Map<string, any>;
  // preselectedSniPerId: Map<string, any>;
  subscriptions: Subscription[];
}

/**
 * Handles the reading of client profile hldl files.
 *
 * @export
 * @class ExtensionProfilesHandler
 */
export class ExtensionProfilesHandler {

  public extensionFileNamesRead: string[] = [];

  private extensionList!: ExtensionListItem[];

  public constructor(
    // private id: string, // operation id
    private readonly httpClient: HttpClient,
    private readonly extensionsFolder: string,
    private readonly extensionsListFileName: string,
    private readonly timeout: number,
    private readonly trace: TraceService) {
  }

  /**
   * Returns an observable. Subscribing to it invokes the reading in chain of all client profiles.
   *
   * @returns {Observable<any[]>}
   *
   * @memberOf ExtensionProfilesHandler
   */
  public getAllExtensionProfiles(): Observable<any[]> {
    const extensionStore: ExtensionStore = {
      extensionDataPerName: new Map<string, any>(),
      subscriptions: []
    };
    return new Observable((observer: Observer<any[]>) => {
      this.onSubscription(extensionStore, observer);
      return (): any => this.teardownLogic(extensionStore);
    });
  }

  private onSubscription(extensionStore: ExtensionStore, observer: Observer<any[]>): void {
    this.trace.debug(TraceModules.hldlReader, ': Getting extension profile list...');
    this.httpClient.get(this.extensionsFolder + this.extensionsListFileName)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error, observer);
        })
      )
      .subscribe((extList: ExtensionListItem[]) => {
        const fullList: string = this.calculateFullList(extList);
        this.trace.debug(TraceModules.hldlReader, 'Extension profile list retrieved:\n %s', fullList);

        if (isNullOrUndefined(extList) || extList.length === 0) {
          this.pushToClientAndDispose(observer, null);
        } else {
          this.extensionList = extList;
          this.fetchAllExtensions(extensionStore, extList, observer);
        }
      });
  }

  private fetchAllExtensions(extensionStore: ExtensionStore, extList: ExtensionListItem[], observer: Observer<any[]>): void {
    extensionStore.subscriptions.push(of(true).pipe(delay(this.timeout)).subscribe(() => this.onTimeout(observer, extensionStore)));

    extList.forEach((ext: ExtensionListItem) => {
      extensionStore.subscriptions.push(this.httpClient.get(this.extensionsFolder + ext.profile).subscribe(
        (result => this.onExtensionFeteched(ext, result, extensionStore, observer))
      ));
    });
  }

  private onExtensionFeteched(ext: ExtensionListItem, result: any, extensionStore: ExtensionStore, observer: Observer<any[]>): void {
    this.trace.info(TraceModules.hldlReader, 'onExtensionFeteched() %s file for %s extension fetched.',
      ext.profile, ext.name);

    extensionStore.extensionDataPerName.set(ext.name, result.hfwExtension);
    this.extensionFileNamesRead.push(ext.profile);

    if (this.checkDone(extensionStore.extensionDataPerName) === true) {
      this.trace.info(TraceModules.hldlReader,
        'onExtensionFeteched(): all calls returned for getAllExtensionProfiles(), pushing received replies to client, disposing all calls, deleting state...');
      this.pushToClientAndDispose(observer, extensionStore);
    }
  }

  private calculateFullList(extList: ExtensionListItem[]): string {
    if (isNullOrUndefined(extList) || extList.length === 0) {
      return 'empty list.';
    } else {
      let result = '';
      extList.forEach((item: ExtensionListItem) => {
        result += `${item.name} - ${item.profile}\n`;
      });
      return result;
    }
  }

  private onTimeout(observer: Observer<any[]>, extensionStore: ExtensionStore): void {
    // the available results are pushed to the client, the call is intentionally marked as completed (and not as an error)
    this.trace.error(TraceModules.hldlReader,
      'onTimeout() called for getAllExtensionProfiles(), pushing received replies to client, disposing all calls, deleting state...');
    this.pushToClientAndDispose(observer, extensionStore);
  }

  private pushToClientAndDispose(observer: Observer<any[]>, extensionStore: ExtensionStore | null): void {
    const extensions: any[] = [];
    if (!isNullOrUndefined(extensionStore)) {
      extensionStore!.extensionDataPerName.forEach(ext => {
        extensions.push(ext);
      });
    }
    observer.next(extensions);
    observer.complete();
  }

  private teardownLogic(extensionStore: ExtensionStore): void {
    this.trace.info(TraceModules.hldlReader, 'teardownLogic() called for ExtensionProfilesHandler, disposing all calls, deleting state...');
    this.dispose(extensionStore);
  }

  private dispose(extensionStore: ExtensionStore): void {
    extensionStore.extensionDataPerName.clear();
    extensionStore.subscriptions.forEach(sub => {
      if (sub !== undefined) {
        sub.unsubscribe();
      }
    });
    extensionStore.subscriptions = [];
  }

  private checkDone(extensionDataPerName: Map<string, any>): boolean {
    return (extensionDataPerName.size === this.extensionList.length) ? true : false;
  }

  private handleError(httpErrorResponse: HttpErrorResponse, observer: Observer<any[]>): Observable<any> {
    const errMsg: string = (httpErrorResponse.message) ? httpErrorResponse.message :
      httpErrorResponse.status ? `${httpErrorResponse.status} - ${httpErrorResponse.statusText}` : 'Server error';
    this.trace.error(TraceModules.hldlReader, ': Error getting HLDL profile: ' + errMsg);
    this.pushToClientAndDispose(observer, null);
    return throwError(httpErrorResponse);
  }
}
