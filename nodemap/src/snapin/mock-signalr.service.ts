import { Injectable } from '@angular/core';
import { NotifiesPending } from '@gms-flex/services';

import { MockHubConnection } from './mock-hub-connection';
import { MockHubProxyShared } from './mock-hub-proxy-shared';

export const signalRTraceModuleName = 'ms-signalR';

@Injectable({
  providedIn: 'root'
})
export class MockSignalRService {
  private readonly appSettingsService;
  private readonly trace;
  private readonly ngZone;
  private readonly endpoint;
  private readonly errorService;

  private readonly timeMilliSec;
  private readonly _signalRErrorItem;
  private readonly initialConnectionDone;

  private readonly createNorisHubConnection;
  private readonly onSignalRCDTimer;
  private readonly onSignalRConnection;
  private readonly onSignalRConnectionError;

  private readonly proxies: NotifiesPending[] = [];

  private readonly _norisHubConnection: MockHubConnection = new MockHubConnection('TestClientConnection');
  private readonly _norisHubProxy: MockHubProxyShared = new MockHubProxyShared(this._norisHubConnection, 'TestClientHubName');

  public getNorisHubConnection(): MockHubConnection {
    return this._norisHubConnection;
  }

  public getNorisHub(): MockHubProxyShared {
    return this._norisHubProxy;
  }

  public registerProxy(proxy: NotifiesPending): void {
    this.proxies.push(proxy);
  }
}
