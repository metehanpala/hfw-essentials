import { Component, HostBinding, Inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { isNullOrUndefined } from '@gms-flex/services-common';

import { IStateService } from '../../common/interfaces/istate.service';
import { MobileNavigationService } from '../mobile/mobile-service/mobile-navigation.service';
import { HldlService, PaneStore } from '../shared';
import { Pane } from '../shared/hldl/hldl-data.model';
import { SnapInStore } from '../shared/stores/snapin.store';
import { SnapinHostComponent } from '../snapin-host';

@Component({
  selector: 'hfw-pane',
  templateUrl: './pane.component.html',
  styleUrl: './pane.component.scss',
  standalone: false
})
/**
 * This class represents the Pane, the container of a group of SNIs in HFW visual tree.
 */
export class PaneComponent implements OnChanges {

  /*
   * The pane id.
   */
  @Input() public paneId!: string;

  /*
   * Stores the parent frame id.
   */
  @Input() public frameId!: string;

  @HostBinding('class.hfw-pane-area') public get isNotDockedFrame(): boolean { return !this.hldlService.getFrameById(this.frameId)!.docked; }
  @HostBinding('class.hfw-no-border') public get noBorder(): boolean {
    return this.frameId === 'account-frame-id' || this.frameId === 'notifconfig-frame-id' || this.paneId === 'el-pane';
  }
  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;

  public paneConfig!: Pane;

  public paneStore!: PaneStore;

  public animationState!: string;

  public snapIns!: SnapInStore[];

  public readonly trackByIndex = (index: number): number => index;

  public constructor(private readonly hldlService: HldlService,
    private readonly stateService: IStateService,
    @Inject(MobileNavigationService) private readonly mobileNavigationService: MobileNavigationService) {
  }

  public ngOnChanges(_changes: SimpleChanges): void {
    this.updateProperties();
  }

  public onRouteChanged(newSnapIn: any): void {
    if (newSnapIn?.fullId != null) {
      this.stateService.updatePaneFromExternNavigate(this.frameId, this.paneId, newSnapIn.fullId);
    }
  }

  public onDeactivated(event: SnapinHostComponent): void {
    if (this.paneConfig.canStartWithoutSelectedSnapin) {
      const hostingLayoutId: string | undefined = event.route?.parent?.routeConfig?.path;
      if (hostingLayoutId) {
        this.stateService.updatePaneDeactivatedFromNavigate(this.frameId, this.paneId, hostingLayoutId!);
      }
    }
  }

  private updateProperties(): void {
    if (!isNullOrUndefined(this.paneId) && !isNullOrUndefined(this.frameId)) {
      this.paneStore = this.stateService.currentState.getPaneStoreViaIds(this.frameId, this.paneId);
      this.paneConfig = this.stateService.getPaneById(this.paneId, this.frameId)!;
      this.snapIns = this.stateService.currentState.getSnapInsFromPaneId(this.frameId, this.paneId)!;
      if (!isNullOrUndefined(this.paneStore)) {
        this.mobileNavigationService.setPaneStore(this.paneStore);
        this.mobileNavigationService.setPaneConfig(this.paneConfig);
      }
    }
  }
}
