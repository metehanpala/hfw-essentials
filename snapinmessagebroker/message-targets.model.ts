import { PaneStore } from '../shared/stores/pane.store';
import { SnapInStore } from '../shared/stores/snapin.store';

export class MessageTargets {
  public constructor(
    public targets: SnapInStore[],
    public targetsPane: PaneStore[],
    public targetRightPanelFrameIds: string[],
    public canSwitchLayout: boolean) {
  }
}
