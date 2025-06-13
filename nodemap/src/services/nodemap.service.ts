import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { ConnectionState, EventFilter, EventService, HubProxyEvent, HubProxyShared, SignalRService, SubscribeContextChannelizedSingle,
  SubscriptionUtility, WsiEndpointService, WsiUtilityService } from '@gms-flex/services';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError, Subject, Subscription  } from 'rxjs';
import { catchError, delay, map, takeUntil } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiNodeMapDataChangedEvent, WsiNodeMapItem, WsiNodeMapSubscription, WsiOm } from './data.model';

const nodeMapSubscriptionUrl = '/api/sr/nodemapsubscriptions/';
const nodeMapCommandsUrl = '/api/sr/nodemapcommands/';
const nodeMapExtensionsUrl = '/api/sr/NodeMapExtensions/';

const reconnectTimeout = 5000;

@Injectable({
  providedIn: 'root'
})
export class Services {
public constructor(
  public readonly wsiEndpointService: WsiEndpointService,
  public readonly authenticationServiceBase: AuthenticationServiceBase,
  public readonly wsiUtilityService: WsiUtilityService,
  public readonly signalRService: SignalRService,
  public readonly errorService: ErrorNotificationServiceBase,
  public readonly eventService: EventService) {
  }
}

/**
 * NodeMap service.
 * Provides the functionality to read NodeMap data from WSI.
 *
 * @export
 * @class NodeMapService
 *
 */
@Injectable({
  providedIn: 'root'
})
export class NodeMapService {

  public hubProxyShared: HubProxyShared;
  public hubProxyEventDataChanged: HubProxyEvent<WsiNodeMapDataChangedEvent>;
  public hubProxyEventSubs: HubProxyEvent<WsiNodeMapSubscription>;

  private readonly _subscribeRequestsInvoked: Map<string,
  SubscribeContextChannelizedSingle<boolean>> = new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly _subscribeRequestsPending: Map<string,
  SubscribeContextChannelizedSingle<boolean>> = new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private readonly _connectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _items: Subject<WsiNodeMapItem[]> = new Subject<WsiNodeMapItem[]>();
  private readonly _totalNumberOfItems: Subject<number> = new Subject<number>();
  private readonly _oms: Subject<WsiOm[]> = new Subject<WsiOm[]>();

  private readonly _ngUnsubscribe: Subject<void> = new Subject<void>();

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly ngZone: NgZone,
    private readonly services: Services) {

    this.createHubProxies();
    this.hubProxyShared.hubConnection.connectionState.subscribe(value => this.onSignalRConnectionState(value));
    const disconnectedObservable: Observable<boolean> = this.hubProxyShared.hubConnection.disconnected;
    if (disconnectedObservable !== undefined) {
      disconnectedObservable.pipe(delay(reconnectTimeout)).subscribe(
          value => this.onSignalRDisconnected(value), error => this.onSignalRDisconnectedError(error));
    }
    this.traceService.info(TraceModules.nodeMapService, 'NodeMapService created.');
  }

  public subscribe(startPos: number, count: number, sorting: number, ascendingOrder: boolean, searchText: string, deviceGroupId: string): Observable<boolean> {
    this.traceService.info(TraceModules.nodeMapService, 'NodeMapService.subscribe() called.');

    const headers: HttpHeaders = this.services.wsiUtilityService.httpPostDefaultHeader(this.services.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();
    const ctx: SubscribeContextChannelizedSingle<boolean> = new SubscribeContextChannelizedSingle<boolean>(httpPostProxy);

    // subscription POST body hosts the VideoSettings values
    const body: any = JSON.stringify({ 'StartPos': startPos, 'Count': count, 'Sorting': sorting,
    'AscendingOrder': ascendingOrder, 'SearchText': searchText,
    'DeviceGroupId': deviceGroupId });

    if (this.hubProxyShared.hubConnection.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.nodeMapService,
        'NodeMapService.subscribe(): signalr connection not established;' +
        ' need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.nodeMapService, 'NodeMapService.subscribe(): connection is now established.');
          // connection ID is available now, we can setup the 'post observable' now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as 'concat'!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.nodeMapService, 'NodeMapService.subscribe(); Implementation error, we should not reach this!');
          }
          this.postSubscription(ctx, headers, body, httpPostProxy);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.postSubscription(ctx, headers, body, httpPostProxy);
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
    }
    return httpPostProxy.asObservable();
  }

  public unsubscribe(): Observable<boolean> {
    this.traceService.info(TraceModules.nodeMapService, 'NodeMapService.unsubscribe() called');

    const headers: HttpHeaders = this.services.wsiUtilityService.httpDeleteDefaultHeader(this.services.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    if (this.hubProxyShared.hubConnection.isConnected === false) {
      this.traceService.debug(TraceModules.nodeMapService,
        'NodeMapService.unsubscribe(): signalr connection not established;' +
        ' need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.nodeMapService,
            'NodeMapService.unsubscribe(): connection is now established.');
          // connection ID is available now, we can setup the 'post observable' now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as 'concat'!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.nodeMapService, 'NodeMapService.unsubscribe(); Implementation error, we should not reach this!');
          }
          this.deleteSubscription(headers, httpPostProxy);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.deleteSubscription(headers, httpPostProxy);
    }
    return httpPostProxy.asObservable();
  }

  public cancelHttpPendingRequests(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  public createDeviceGroup(name: string, items: string[]): void {
    const body: any = JSON.stringify({ 'CommandId': 0, 'DeviceGroupDisplayName': name, 'DeviceGroupItems': items });
    this.executeCommand(body);
  }

  public editDeviceGroupDisplayName(deviceGroupId: string, displayName: string): void {
    const body: any = JSON.stringify({ 'CommandId': 1, 'DeviceGroupId': deviceGroupId, 'DeviceGroupDisplayName': displayName });
    this.executeCommand(body);
  }

  public XnetConnect(targets: string[]): void {
    const body: any = JSON.stringify({ 'CommandId': 5, 'Targets': targets });
    this.executeCommand(body);
  }

  public eventSelect(target: string[], addFilter: boolean): void {

  let eventFilterConfig: EventFilter = null;

  if (addFilter) {
      eventFilterConfig =  {
        empty: false,
        srcName: target[0]
      };
    } else {
      eventFilterConfig =  {
        empty: true,
        srcDesignations: []
      };
    }

    this.services.eventService.setEventsFilter(eventFilterConfig, 0, true);
  }

  public XnetDisconnect(targets: string[]): void {
    const body: any = JSON.stringify({ 'CommandId': 6, 'Targets': targets });
    this.executeCommand(body);
  }

  public RequestOwnership(targets: string[]): void {
    const body: any = JSON.stringify({ 'CommandId': 7, 'Targets': targets });
    this.executeCommand(body);
  }

  public modifyDeviceGroupItems(removeItems: boolean, deviceGroupId: string, items: string[]): void {
    let commandId = 2;
    if (removeItems) {
      commandId = 3;
    }
    const body: any = JSON.stringify({ 'CommandId': commandId, 'DeviceGroupId': deviceGroupId, 'DeviceGroupItems': items });
    this.executeCommand(body);
  }

  public deleteDeviceGroup(deviceGroupId: string): void {
    const body: any = JSON.stringify({ 'CommandId': 4, 'DeviceGroupId': deviceGroupId });
    this.executeCommand(body);
  }

  public GetDeviceGroupItems(deviceGroupId: string): Observable<WsiNodeMapItem[]>  {
    this.traceService.info(TraceModules.nodeMapService, 'NodeMapService.GetDeviceGroupItems() called.');

    if (deviceGroupId === undefined) {
      return observableThrowError(new Error('Invalid arguments!'));
    }

    const headers: HttpHeaders = this.services.wsiUtilityService.httpGetDefaultHeader(this.services.authenticationServiceBase.userToken);
    const url = `${this.services.wsiEndpointService.entryPoint}${nodeMapExtensionsUrl}${encodeURIComponent(deviceGroupId)}`;

    return this.httpClient.get(url,  { headers, observe: 'response' }).
      pipe(takeUntil(this._ngUnsubscribe),
        map((response: HttpResponse<any>) => this.extractDataItems(response)),
        catchError((response: HttpResponse<any>) =>
          this.manageErrorexecuteCommandGetDeviceGroupItems(response)));
  }

  // US2053493
  public GetDeviceGroups(): Observable<WsiNodeMapItem[]>  {
    this.traceService.info(TraceModules.nodeMapService, 'NodeMapService.GetDeviceGroups() called.');

    const headers: HttpHeaders = this.services.wsiUtilityService.httpGetDefaultHeader(this.services.authenticationServiceBase.userToken);
    const url = `${this.services.wsiEndpointService.entryPoint}${nodeMapExtensionsUrl}${encodeURIComponent('XxXxXGetDeviceGroupsXxXxX')}`;

    return this.httpClient.get(url,  { headers, observe: 'response' }).
      pipe(takeUntil(this._ngUnsubscribe),
        map((response: HttpResponse<any>) => this.extractDataItems(response)),
        catchError((response: HttpResponse<any>) =>
          this.manageErrorexecuteCommandGetDeviceGroupItems(response)));
  }
  // US2053493

  public items(): Observable<WsiNodeMapItem[]> {
    return this._items.asObservable();
  }

  public oms(): Observable<WsiOm[]> {
    return this._oms.asObservable();
  }

  public totalNumberOfItems(): Observable<number> {
    return this._totalNumberOfItems.asObservable();
  }

  public connectionState(): Observable<ConnectionState> {
    return this._connectionState.asObservable();
  }

  private createHubProxies(): void {
    this.hubProxyShared = this.services.signalRService.getNorisHub();

    this.hubProxyEventDataChanged = new HubProxyEvent<WsiNodeMapDataChangedEvent>(this.traceService, this.hubProxyShared, 'notifyDataChanged',
      this.ngZone, this.services.signalRService);
    this.hubProxyEventDataChanged.eventChanged.subscribe(data => this.onDataChanged(data));

    this.hubProxyEventSubs = new HubProxyEvent<WsiNodeMapSubscription>(this.traceService, this.hubProxyShared, 'notifySubscriptionStatus',
      this.ngZone, this.services.signalRService, 'notifyDataChanged');
    this.hubProxyEventSubs.eventChanged.subscribe(subscription => this.onSubscriptionStatusChanged(subscription));
  }

  private postSubscription(ctx: SubscribeContextChannelizedSingle<boolean>, headers: HttpHeaders, body: any, httpPostProxy: Subject<boolean>): void  {
    const url = `${this.services.wsiEndpointService.entryPoint}${nodeMapSubscriptionUrl}${ctx.id}/${this.hubProxyShared.connectionId}`;
    const httpPost: Observable<boolean> = this.httpClient.post(url,  body, { headers }).
      pipe(takeUntil(this._ngUnsubscribe),
        map((response: HttpResponse<any>) => this.extractData(response)),
        catchError((response: HttpResponse<any>) =>
          this.services.wsiUtilityService.handleError(response, TraceModules.nodeMapService, 'NodeMapService.postSubscription()', this.services.errorService)));
    this.traceService.debug(TraceModules.nodeMapService, 'NodeMapService.postSubscription(); http post can be issued now (after connecting)...');
    httpPost.subscribe(value => this.onSubscribeNext(value, httpPostProxy), error => this.onSubscribeError(error, ctx, httpPostProxy));
    this._subscribeRequestsInvoked.set(ctx.id, ctx);
  }

  private deleteSubscription(headers: HttpHeaders, httpPostProxy: Subject<boolean>): void  {
    this.traceService.debug(TraceModules.nodeMapService, 'NodeMapService.deleteSubscription(); http delete');
    const url: string = this.services.wsiEndpointService.entryPoint + nodeMapSubscriptionUrl + this.hubProxyShared.connectionId;
    const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).
         pipe(takeUntil(this._ngUnsubscribe),
            map((response: HttpResponse<any>) =>
              this.services.wsiUtilityService.extractData(response, TraceModules.nodeMapService, 'NodeMapService.deleteSubscription()')),
            catchError((response: HttpResponse<any>) =>
              this.services.wsiUtilityService.handleError(response, TraceModules.nodeMapService, 'NodeMapService.deleteSubscription()',
              this.services.errorService)));
    httpPost.subscribe(value => this.onUnsubscribeNext(value, httpPostProxy),
      error => this.onUnsubscribeError(error, httpPostProxy));
  }

  private executeCommand(body: any) {
    this.traceService.info(TraceModules.nodeMapService, 'NodeMapService.executeCommand() called.');

    const headers: HttpHeaders = this.services.wsiUtilityService.httpPostDefaultHeader(this.services.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();
    const url = `${this.services.wsiEndpointService.entryPoint}${nodeMapCommandsUrl}`;
    const httpPost: Observable<boolean> = this.httpClient.post(url,  body, { headers }).pipe(
        map((response: HttpResponse<any>) => this.extractData(response)),
        catchError((response: HttpResponse<any>) =>
          this.services.wsiUtilityService.handleError(response, TraceModules.nodeMapService, 'NodeMapService.executeCommand()', this.services.errorService)));
    httpPost.subscribe(value => this.onSubscribeNext(value, httpPostProxy), error => this.onSubscribeError(error, null, httpPostProxy));
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.nodeMapService, 'NodeMapService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared.hubConnection.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.nodeMapService, 'NodeMapService.onSignalRDisconnected(): starting again the connection');
        this.hubProxyShared.hubConnection.startHubConnection();
      }
    }
  }

  private onSignalRConnectionState(value: SignalR.ConnectionState): void {
    if (value === SignalR.ConnectionState.Disconnected) {
      this._subscribeRequestsInvoked.forEach(ctx => {
        ctx.postSubject.error('Notification channel disconnected.');
      });
      this._subscribeRequestsInvoked.clear();
    }
    this._connectionState.next(SubscriptionUtility.convert(value));
  }

  private onSubscribeNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.nodeMapService, 'NodeMapService.onSubscribeNext()');
  }

  private onSubscribeError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.nodeMapService, 'NodeMapService.onSubscribeError(): http post returned an error; %s',  error);
    if (ctx !== null) {
      this._subscribeRequestsInvoked.delete(ctx.id);
    }
    httpPostProxy.error(error);
  }

  private onUnsubscribeNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.nodeMapService, 'NodeMapService.onUnsubscribeNext()');
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.nodeMapService, 'NodeMapService.onUnsubscribeError(): http post returned an error; %s',  error);
    httpPostProxy.error(error);
  }

  private onDataChanged(eventData: WsiNodeMapDataChangedEvent): void {
    if (eventData === undefined) {
        return;
    }
    this._totalNumberOfItems.next(eventData.TotalNumberOfItems);
    this._items.next(eventData.Items);
    this._oms.next(eventData.Oms);
  }

    /**
     * manageErrorexecuteCommandGetDeviceGroupItems
     *
     * @private
     * @param {*} response
     * @returns {Observable<any>}
     * @memberof VMSDataService
     */
     private manageErrorexecuteCommandGetDeviceGroupItems(response: any): Observable<any> {
      return  this.services.wsiUtilityService.handleError(response, TraceModules.nodeMapService, 'NodeMapService.executeCommand()', this.services.errorService);
    }

  private extractDataItems(response: HttpResponse<any>): WsiNodeMapItem[] {
    if (response.ok) {
      return JSON.parse(String(response.body));
    } else {
      // no data
      return undefined;
    }
  }

  private extractData(response: HttpResponse<any>): boolean {
    // Note: subscribe call just returns Status Code 200 if okay
    return true;
  }

  private onSubscriptionStatusChanged(subscription: WsiNodeMapSubscription): void {
    const foundCtx: SubscribeContextChannelizedSingle<boolean> = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx !== undefined) {
      const isSucceeded: boolean = subscription.ErrorCode === 0;
      foundCtx.setReply(isSucceeded);
      foundCtx.postSubject.next(isSucceeded);
      if (foundCtx.checkAllRepliesDone() === true) {
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.nodeMapService, 'NodeMapService.onSubscriptionStatusChanged(), invalid context (requestId): %s, requestFor: %s;',
        subscription.RequestId, subscription.RequestFor);
    }
  }
}
