import { Injectable } from '@angular/core';

import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';

@Injectable({
  providedIn: 'root'
})
export class SnapinInstancesService {

  private readonly instances: Map<string, any> = new Map<string, any>();

  public getSnapInBase(fullId: FullSnapInId): any {
    return this.instances.get(fullId.fullId());
  }

  public registerSnapInBase(fullId: FullSnapInId, value: any): void {
    this.instances.set(fullId.fullId(), value);
  }

  public unRegisterSnapInBase(fullId: FullSnapInId): void {
    this.instances.delete(fullId.fullId());
  }

}
