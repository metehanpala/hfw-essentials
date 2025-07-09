import { BehaviorSubject, Observable } from 'rxjs';

import { IQParamService } from '../../../common/interfaces';
import { Channel, QParamService } from '../hldl/hldl-data.model';

export class QParamStore {

  public qParamService!: IQParamService | null;

  public frameId!: string;

  private readonly channels: Map<string, BehaviorSubject<string>> = new Map<string, BehaviorSubject<string>>();

  public static clone(source: QParamStore | null): QParamStore | null {
    if (source) {
      const qStore = new QParamStore(source.config);
      source.config.channels.forEach((c: Channel) => {
        qStore.setQParam(c.id, source.getQParamValue(c.id));
      });
      return qStore;
    } else {
      return null;
    }
  }

  public constructor(public config: QParamService) {
    this.config.channels.forEach((c: Channel) => {
      this.channels.set(c.id, new BehaviorSubject<string>(null!));
    });
  }

  public getQParam(channelId: string): Observable<string> {
    if (this.channels.has(channelId)) {
      return this.channels.get(channelId)!.asObservable();
    }
    return null!;
  }

  public getQParamValue(channelId: string): string {
    if (this.channels.has(channelId)) {
      return this.channels.get(channelId)!.value;
    }
    return null!;
  }

  public setQParam(channelId: string, value: string | null): void {
    if (this.channels.has(channelId)) {
      this.channels.get(channelId)!.next(value!);
    }
  }

  public dispose(): void {
    this.channels.forEach((value: BehaviorSubject<string>) => {
      value.complete();
    });
    this.qParamService = null;
  }
}
