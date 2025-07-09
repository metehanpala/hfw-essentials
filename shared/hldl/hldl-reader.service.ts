import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, pipe, throwError } from 'rxjs';
import { catchError, concatMap, map, tap } from 'rxjs/operators';

import { TraceModules } from '../trace/trace-modules';
import { ClientProfilesHandler } from './client-profiles.handler';
import { ExtensionProfilesHandler } from './extension-profiles.handler';
import * as dataModel from './hldl-data.model';
import { HldlMergeManager } from './hldl-merge-manager';

const PROFILES_FOLDER_PATH = 'profiles/';
const EXTENSIONS_FOLDER_PATH = 'extensions/';
const EXTENSIONS_FILE_NAME = 'extension-profiles.json';

/**
 * Service for Reading and Parsing the HLDL file.
 */
@Injectable({
  providedIn: 'root'
})
export class HldlReaderService {

  private baseProfile: any;
  private clientProfileExtensions!: any[];
  private extensionProfiles!: any[];
  private readonly hldlMergeManager: HldlMergeManager;

  private readonly clientProfileHandler: ClientProfilesHandler = new ClientProfilesHandler(this.httpClient,
    PROFILES_FOLDER_PATH, this.traceService);
  private readonly extensionProfileHandler: ExtensionProfilesHandler = new ExtensionProfilesHandler(this.httpClient,
    PROFILES_FOLDER_PATH + EXTENSIONS_FOLDER_PATH, EXTENSIONS_FILE_NAME, 4000, this.traceService);

  public constructor(private readonly traceService: TraceService, private readonly httpClient: HttpClient) {
    this.traceService.debug(TraceModules.hldlReader, 'Hldl Reader Service created.');
    this.hldlMergeManager = new HldlMergeManager(this.traceService);
  }

  public getHfwInstance(profileName: string): Observable<any> {

    return this.httpClient.get(PROFILES_FOLDER_PATH + profileName).pipe(
      this.getProfileAndExtensions(profileName),
      catchError((error: HttpErrorResponse) => {
        return this.handleError(error);
      })
    );
  }

  public hasLoadedProfile(profileFileName: string): boolean {
    if (profileFileName) {
      return this.extensionProfileHandler.extensionFileNamesRead.includes(profileFileName);
    }
    return false;
  }

  private getProfileAndExtensions(profileName: string): any {
    return pipe(tap((rawHldl: any) => this.setInitialFileInfo(rawHldl)),
      concatMap((rawHldl: any) => this.clientProfileHandler.getAllClientProfiles(rawHldl, profileName)),
      tap((clientProfiles: any[]) => this.setClientProfiles(clientProfiles)),
      concatMap(() => this.extensionProfileHandler.getAllExtensionProfiles()),
      tap((extensionProfiles: any[]) => this.setExtensionProfiles(extensionProfiles)),
      map(() => this.hldlMergeManager.mergeProfiles(this.baseProfile, this.clientProfileExtensions, this.extensionProfiles)));
  }

  private setExtensionProfiles(extensionProfiles: any[]): void {
    if (!isNullOrUndefined(extensionProfiles) && extensionProfiles.length > 0) {
      this.extensionProfiles = extensionProfiles;
    } else {
      this.traceService.debug(TraceModules.hldlReader, 'No extension profiles.');
    }
  }

  private setInitialFileInfo(rawHldl: any): void {
    if (!isNullOrUndefined(rawHldl.hfwInstance)) {
      this.traceService.debug(TraceModules.hldlReader, 'Current user configured with a base profile.');
    } else {
      if (!isNullOrUndefined(rawHldl.hfwExtension)) {
        this.traceService.debug(TraceModules.hldlReader, 'Current user configured with a client profile extension.');
      } else {
        this.traceService.warn(TraceModules.hldlReader, 'Current user configured with a not valid profile.');
      }
    }
  }

  private setClientProfiles(clientProfiles: any[]): void {
    if (!isNullOrUndefined(clientProfiles) && clientProfiles.length > 0) {
      if (clientProfiles.length === 1) {
        this.baseProfile = clientProfiles[0];
      } else {
        this.baseProfile = clientProfiles[clientProfiles.length - 1];
        this.clientProfileExtensions = clientProfiles.slice(0, clientProfiles.length - 1);
      }
    } else {
      this.traceService.debug(TraceModules.hldlReader, 'Error reading client profiles.');
    }
  }

  private handleError(httpErrorResponse: HttpErrorResponse): Observable<any> {
    const errMsg: string = (httpErrorResponse.message) ? httpErrorResponse.message :
      httpErrorResponse.status ? `${httpErrorResponse.status} - ${httpErrorResponse.statusText}` : 'Server error';
    this.traceService.error(`${TraceModules.hldlReader}: Error getting HLDL profile: ${errMsg}`);
    this.traceService.warn(TraceModules.hldlReader, 'Unable to fetch  Hldl file, will be used the Default one.');

    return this.httpClient.get(PROFILES_FOLDER_PATH + dataModel._userHldlProfile).
      pipe(
        this.getProfileAndExtensions(dataModel._userHldlProfile),
        catchError((error: HttpErrorResponse) => {
          return throwError(error);
        }));
  }
}
