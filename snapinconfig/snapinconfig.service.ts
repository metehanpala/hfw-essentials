import { Injectable } from '@angular/core';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';

import { FullPaneId } from '../../common/fullsnapinid/full-pane-id.model';
import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { ISnapInConfig } from '../../common/interfaces/isnapinconfig';
import { IStateService } from '../../common/interfaces/istate.service';
import { RuntimeInfo } from '../../common/interfaces/runtime-info.model';
import { HfwFrame, Mode, PrimaryBarConfig, SnapInReference, SnapInType, VerticalBarConfig } from '../shared/hldl/hldl-data.model';
import { HldlService } from '../shared/hldl/hldl.service';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { SnapInStore } from '../shared/stores/snapin.store';

const desktopViewPortMediaQuery = 'only screen and (min-width:1367px)';
const tabletViewPortMediaQuery = 'only screen and (max-width:1366px)';

/**
 * Provides hldl config data to snap-ins.
 */
@Injectable({
  providedIn: 'root'
})
export class SnapInConfigService implements ISnapInConfig {

  private runtimeInfo!: RuntimeInfo;

  public constructor(private readonly stateService: IStateService,
    private readonly hldlService: HldlService) {
    this.elaborateRuntimeInfo();
  }

  public getLayouts(frameId: string): Observable<any[]> {
    const frame: FrameStore | null = this.stateService.currentState.getFrameStoreViaId(frameId);
    if (frame?.availableLayouts != null) {
      return frame.availableLayouts;
    }
    return null!;
  }

  public getSnapInHldlConfig(fullId: FullSnapInId, location: FullPaneId): any {

    const sni: SnapInReference = this.hldlService.getSnapInReference(fullId, location);

    if (!isNullOrUndefined(sni) && !isNullOrUndefined(sni.config)) { // config at snapin reference level always win.
      return sni.config;
    } else { // if there is no definition at snapin reference level, check at snapin type level.
      const sniStore: SnapInStore | null = this.stateService.currentState.getSnapInStore(fullId);
      if (sniStore != null) {
        return sniStore.typeConfig.config;
      }
    }
    return null;
  }

  public getFrames(): any[] {
    const frames: HfwFrame[] | null = this.stateService.getFrames();
    return frames!;
  }

  public paneCanBeDisplayed(frameId: string, paneId: string): Observable<boolean> {
    const fullId: FullPaneId = new FullPaneId(frameId, paneId);
    const paneStore: PaneStore | null = this.stateService.currentState.getPaneStore(fullId);
    if (paneStore != null) {
      return paneStore.isDisplayable;
    }
    return (of(false));
  }

  public getRuntimeInfo(): RuntimeInfo {
    return this.runtimeInfo;
  }

  public getAvailableModes(): string[] | null {
    const modes: Mode[] | null = this.hldlService.getModes();
    if (modes) {
      return modes.map(i => {
        return i.id;
      });
    }
    return null;
  }

  public getPrimaryBarConfig(): PrimaryBarConfig {
    return this.stateService.getPrimaryBarConfig();
  }

  public getVerticalBarConfig(): VerticalBarConfig[] {
    return this.stateService.getVerticalBarConfig();
  }

  public hasLoadedProfile(profileFileName: string): boolean {
    if (profileFileName) {
      return this.hldlService.hasLoadedProfile(profileFileName);
    }
    return false;
  }

  public getSnapInTypes(): SnapInType[] {
    return this.hldlService.getSnapInTypes()!;
  }

  private elaborateRuntimeInfo(): void {
    this.runtimeInfo = { isDesktopViewport: window.matchMedia(desktopViewPortMediaQuery).matches,
      isTabletViewport: window.matchMedia(tabletViewPortMediaQuery).matches } as RuntimeInfo;
  }
}
