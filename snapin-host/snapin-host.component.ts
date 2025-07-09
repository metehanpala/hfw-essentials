import { Component, HostBinding } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { SnapinInstancesService } from '../state/snapin-instances.service';

@Component({
  selector: 'hfw-snapin-host',
  template: `
  <router-outlet
  (activate)='onActivate($event)'
  (deactivate)='onDeactivate()' />
  `,
  standalone: false
})
export class SnapinHostComponent {

  public fullId!: FullSnapInId;

  @HostBinding('class.hfw-flex-container-column') public guardFlex = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;

  public constructor(public route: ActivatedRoute,
    private readonly instances: SnapinInstancesService) {
    this.getFullSnapInIdFromRoute();
  }

  public onActivate(value: any): void {
    this.instances.registerSnapInBase(this.fullId, value);
  }

  public onDeactivate(): void {
    this.instances.unRegisterSnapInBase(this.fullId);
  }

  private getFullSnapInIdFromRoute(): void {
    this.fullId = new FullSnapInId((this.route.snapshot.data.snapinId as FullSnapInId).frameId,
      (this.route.snapshot.data.snapinId as FullSnapInId).snapInId);
  }

}
