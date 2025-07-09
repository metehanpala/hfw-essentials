/* eslint-disable @typescript-eslint/naming-convention */
export const _userHldlProfile = 'DEFAULT.hldl.json';

export const DEFAULT_MODE_ID = 'default';

export enum Title {
  pane,
  snapin
}

export enum Docked {
  none,
  top
}

export class MessageType {
  public constructor(
    public name: string) {
  }
}

export class SnapInType {
  public constructor(
    public typeId: string,
    public resourceFolder: string,
    public config: any,
    public messageTypes: MessageType[]) {
  }
}

export class AppliesOnLayoutId {
  public constructor(
    public id: string) {
  }
}
export class CommunicationRule {
  public constructor(
    public destination: string | null,
    public ruleName: string | null,
    public fallbackDestination: string | null,
    public canSwitchLayout: boolean,
    public appliesOnLayoutIds: AppliesOnLayoutId[] | null,
    public hitRightPanel: boolean) {
  }
}

export class SnapInReference {
  public constructor(
    public id: string,
    public communicationRules: CommunicationRule[],
    public config: any,
    public canSendToSelf: boolean,
    public order?: number) {
  }
}

export class SnapInInstance {
  public constructor(
    public snapInId: string,
    public typeId: string,
    public canLoseFocusOnPreselection: boolean,
    public tabTitleId?: string,
    public neverDestroy?: boolean) {
  }
}

export class Pane {
  public constructor(
    public snapInReferences: SnapInReference[],
    public id: string,
    public primaryHeader: boolean,
    public closeButton: boolean,
    public startAsClosed: boolean,
    public hasTab: boolean,
    public headerTitle: string,
    public paneTitleOrSnapinTitle: Title,
    public titleVisible: boolean,
    public mobileNavigation: boolean,
    public canStartWithoutSelectedSnapin: boolean,
    public hasFullScreen: boolean,
    public outletName?: string, // this property will be filled by hldl-service
    public displaySelectedObject?: boolean,
    public showSelectedObjectInAppTitle?: boolean
  ) {
  }
}

export class PaneInstance {
  public constructor(
    public id: string,
    public whenClosed: string | null) {
  }
}

export class FirstChild {
  public constructor(
    public paneInstance: PaneInstance,
    public splitter: Splitter) {
  }
}

export class SecondChild {
  public constructor(
    public paneInstance: PaneInstance,
    public splitter: Splitter) {
  }
}

export class Splitter {
  public constructor(
    public firstChild: FirstChild,
    public secondChild: SecondChild,
    public orientation: string,
    public collapsingPane: string,
    public firstChildSize: string,
    public secondChildSize: string,
    public id: string) {
  }
}

export class LayoutInstance {
  public constructor(
    public paneInstance: PaneInstance,
    public splitter: Splitter | null,
    public iconClass: string,
    public mediaQuery: string | null,
    public onShrink: string | null,
    public onGrowth: string | null,
    public onLayoutChange: string | null, // indicates the favorite layout to be selected in case of layout change triggered by communication rules.
    public isDefault: boolean | null, // indicates if can be considered a default for the current screensize.
    public minWidthFromMediaQuery: number | null, // filled by hfw-core
    public id: string) {
  }
}

export class AvailableLayoutId {
  public constructor(
    public id: string) {
  }
}
export class Mode {
  public constructor(
    public id: string,
    public isDefaultMode: boolean) {
  }
}

export class AppRightPanel {
  public constructor(
    public snapInInstances: SnapInInstance[],
    public snapInReferences: SnapInReference[]) {
  }
}

export class HfwInstance {
  public constructor(
    public snapInTypes: SnapInType[],
    public hfwFrames: HfwFrame[],
    public appRightPanel: AppRightPanel,
    public primaryBarConfig: PrimaryBarConfig,
    public verticalBarConfigs: VerticalBarConfig[],
    public modes: Mode[],
    public startingFrameId: string) {
  }
}

export class RightPanelCommunication {
  public constructor(
    public communicationRules: CommunicationRule[],
    public id: string) {
  }
}

export class Channel {
  public constructor(
    public communicationRules: CommunicationRule[],
    public id: string) {
  }
}
export class QParamService {
  public constructor(
    public channels: Channel[],
    public id: string,
    public primaryChannelId: string) {
  }
}

export class PanePreference {
  public constructor(
    public paneId: string,
    public selectedSnapinId: string) {
  }
}

export class ViewLayout {
  public constructor(
    public id: string) {
  }
}

export class PreferredSnapin {
  public constructor(
    public paneId: string,
    public snapinId: string) {
  }
}
export class View {
  public constructor(
    public viewLayouts: ViewLayout[],
    public id: string,
    public preferredSnapin?: PreferredSnapin) {
  }
}

export class HfwFrame {
  public constructor(
    public snapInInstances: SnapInInstance[],
    public panes: Pane[],
    public layoutInstances: LayoutInstance[],
    public rightPanelCommunications: RightPanelCommunication[],
    public qParamServices: QParamService[],
    public views: View[],
    public docked: Docked,
    public id: string,
    public outletName?: string, // this property will be filled by hldl-service
    public iconClass?: string) {
  }
}
export class ChildrenId {
  public constructor(
    public id: string) {
  }
}
export class PrimaryItem {
  public constructor(
    public id: string,
    public childrenIds: ChildrenId[]) {
  }
}

export class PrimaryBarConfig {
  public constructor(
    public primaryItems: PrimaryItem[]) {
  }
}

export class AvailableOnFrame {
  public constructor(
    public id: string) {
  }
}
export class VerticalBarItem {
  public constructor(
    public id: string,
    public targetFrame: string,
    public verticalBarItems: VerticalBarItem[],
    public targetView?: string,
    public icon?: string,
    public hideFolderOnSingleEntry?: boolean) {
  }
}
export class VerticalBarConfig {
  public constructor(
    public id: string,
    public availableOnFrames: AvailableOnFrame[],
    public verticalBarItems: VerticalBarItem[]) {
  }
}
export class HfwExtension {
  public constructor(
    public parentProfile: string,
    public snapInTypes: SnapInType[],
    public hfwFrames: HfwFrame[],
    public appRightPanel: AppRightPanel,
    public primaryBarConfig: PrimaryBarConfig,
    public verticalBarConfigs: VerticalBarConfig[],
    public modes: Mode[],
    public startingFrameId: string) {
  }
}
