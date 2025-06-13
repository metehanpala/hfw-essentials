import { HubProxyEvent } from '@gms-flex/services';

import { MockHubConnection } from './mock-hub-connection';

export class MockHubProxyShared {
  public proxies: HubProxyEvent<any>[] = [];

  constructor(public hubConnection: MockHubConnection, private readonly hubName?: string) {
  }

  public registerEventHandler(eventHandler: HubProxyEvent<any>): void {
    this.proxies.push(eventHandler);
  }

  public get connectionId(): string {
    return this.hubConnection.connectionId;
  }
}
