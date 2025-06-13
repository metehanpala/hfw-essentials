export interface ISingleInstanceStoreMap {
  [name: string]: SingleInstanceStore;
}

export class SingleInstanceStore {
  public lastMessage: any;

  public appendMessage(messageData: any): void {
    this.lastMessage = messageData;
  }
}
