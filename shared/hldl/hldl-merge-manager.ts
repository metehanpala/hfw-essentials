import { isNullOrUndefined, ITrace } from '@gms-flex/services-common';

import { TraceModules } from '../trace/trace-modules';
import * as hldl from './hldl-data.model';

export class HldlMergeManager {

  public constructor(private readonly traceService: ITrace) {
  }

  public mergeProfiles(baseHldl: hldl.HfwInstance, profileExstensions: hldl.HfwExtension[], extensionHldl: hldl.HfwExtension[]): hldl.HfwInstance {
    let result: hldl.HfwInstance = Object.assign({}, baseHldl); // deep copy base hldl.

    if (!isNullOrUndefined(extensionHldl) && extensionHldl.length > 0) {
      extensionHldl.forEach((p: hldl.HfwExtension, index: number) => {
        this.traceService.debug(TraceModules.hldlMerge, 'Merging extension profile number: %s.', index);
        result = this.mergeExtension(result, p);
      });
    }

    if (!isNullOrUndefined(profileExstensions) && profileExstensions.length > 0) {
      profileExstensions.forEach((p: hldl.HfwExtension, index: number) => {
        this.traceService.debug(TraceModules.hldlMerge, 'Merging client profile number: %s.', index);
        result = this.mergeExtension(result, p);
      });
    }
    return result;
  }

  private mergeExtension(base: hldl.HfwInstance, extension: hldl.HfwExtension): hldl.HfwInstance {
    base.snapInTypes = this.mergeSnapInTypes(base.snapInTypes, extension.snapInTypes);
    base.hfwFrames = this.mergeHfwFrames(base.hfwFrames, extension.hfwFrames);
    base.startingFrameId = this.mergeStartingFrameId(base.hfwFrames, base.startingFrameId, extension.startingFrameId);
    if (!isNullOrUndefined(extension.primaryBarConfig)) {
      base.primaryBarConfig = this.mergePrimaryBarConfig(base.primaryBarConfig, extension.primaryBarConfig);
    }
    if (!isNullOrUndefined(extension.verticalBarConfigs)) {
      base.verticalBarConfigs = this.mergeVerticalBarConfigs(base.verticalBarConfigs, extension.verticalBarConfigs);
    }
    if (!isNullOrUndefined(extension.modes)) {
      base.modes = this.mergeModes(base.modes, extension.modes);
    }
    return base;
  }

  private mergeStartingFrameId(baseFrames: hldl.HfwFrame[], baseStartingFrameId: string, extStartingFrameId: string): string {
    if (isNullOrUndefined(extStartingFrameId)) {
      return baseStartingFrameId;
    }
    const baseFrameIndex: number = baseFrames.findIndex(f => f.id === extStartingFrameId);
    if (baseFrameIndex >= 0) {
      return extStartingFrameId;
    } else {
      return baseStartingFrameId;
    }
  }

  private mergeHfwFrames(baseFrames: hldl.HfwFrame[], extFrames: hldl.HfwFrame[]): hldl.HfwFrame[] {
    let jointArray: hldl.HfwFrame[] = [];
    jointArray = [...jointArray, ...baseFrames];

    if (!isNullOrUndefined(extFrames)) {
      extFrames.forEach((ext: hldl.HfwFrame) => {
        const baseFrameIndex: number = jointArray.findIndex(f => f.id === ext.id);
        if (baseFrameIndex >= 0) {
          jointArray[baseFrameIndex] = this.mergeHfwFrame(jointArray[baseFrameIndex], ext);
        } else {
          jointArray.push(ext);
        }
      });
    }

    return jointArray;
  }

  private mergeSnapInTypes(baseTypes: hldl.SnapInType[], extTypes: hldl.SnapInType[]): hldl.SnapInType[] {
    let jointArray: hldl.SnapInType[] = [];
    jointArray = [...jointArray, ...baseTypes];

    if (!isNullOrUndefined(extTypes)) {
      extTypes.forEach((ext: hldl.SnapInType) => {
        const baseFrameIndex: number = jointArray.findIndex(f => f.typeId === ext.typeId);
        if (baseFrameIndex >= 0) {
          jointArray[baseFrameIndex] = this.mergeSnapInType(jointArray[baseFrameIndex], ext);
        } else {
          jointArray.push(ext);
        }
      });
    }

    return jointArray;
  }

  private mergePrimaryBarConfig(basePrimaryBarConfig: hldl.PrimaryBarConfig, extPrimaryBarConfig: hldl.PrimaryBarConfig): hldl.PrimaryBarConfig {
    const resType: hldl.PrimaryBarConfig = {
      ...basePrimaryBarConfig,
      ...this.mergeObjectWithoutProperties(basePrimaryBarConfig, extPrimaryBarConfig, ['primaryItems'])
    };

    // merge complex properties.
    if (!isNullOrUndefined(extPrimaryBarConfig.primaryItems)) {
      resType.primaryItems = this.mergePrimaryItems(basePrimaryBarConfig.primaryItems, basePrimaryBarConfig.primaryItems);
    }
    return resType;
  }

  private mergePrimaryItems(basePrimaryItems: hldl.PrimaryItem[], extPrimaryItems: hldl.PrimaryItem[]): hldl.PrimaryItem[] {
    let jointArray: hldl.PrimaryItem[] = [];
    jointArray = [...jointArray, ...basePrimaryItems];

    if (!isNullOrUndefined(extPrimaryItems)) {
      extPrimaryItems.forEach((ext: hldl.PrimaryItem) => {
        const basePrimaryIndex: number = jointArray.findIndex(f => f.id === ext.id);
        if (basePrimaryIndex >= 0) {
          jointArray[basePrimaryIndex] = this.mergePrimaryItem(jointArray[basePrimaryIndex], ext);
        } else {
          jointArray.push(ext);
        }
      });
    }

    return jointArray;
  }

  private mergePrimaryItem(base: hldl.PrimaryItem, ext: hldl.PrimaryItem): hldl.PrimaryItem {
    const resType: hldl.PrimaryItem = {
      ...base,
      ...this.mergeObjectWithoutProperties(base, ext, ['id', 'childrenIds'])
    };

    // merge complex properties.
    if (!isNullOrUndefined(ext.childrenIds)) {
      resType.childrenIds = this.mergeChildrenIds(base.childrenIds, ext.childrenIds);
    }
    return resType;
  }

  private mergeChildrenIds(baseChildrenIds: hldl.ChildrenId[], extChildrenIds: hldl.ChildrenId[]): hldl.ChildrenId[] {
    let jointArray: hldl.ChildrenId[] = [];
    jointArray = [...jointArray, ...baseChildrenIds];

    if (!isNullOrUndefined(extChildrenIds)) {
      extChildrenIds.forEach((ext: hldl.ChildrenId) => {
        const baseIndex: number = jointArray.findIndex(f => f.id === ext.id);
        if (baseIndex >= 0) {
          jointArray[baseIndex] = this.mergeChildrenId(jointArray[baseIndex], ext);
        } else {
          jointArray.push(ext);
        }
      });
    }

    return jointArray;
  }

  private mergeChildrenId(base: hldl.ChildrenId, ext: hldl.ChildrenId): hldl.ChildrenId {
    return {
      ...base,
      ...this.mergeObjectWithoutProperties(base, ext, ['id'])
    };
  }

  private mergeVerticalBarConfigs(baseVerticalBarConfigs: hldl.VerticalBarConfig[], extVerticalBarConfigs: hldl.VerticalBarConfig[]): hldl.VerticalBarConfig[] {
    let jointArray: hldl.VerticalBarConfig[] = [];
    jointArray = [...jointArray, ...baseVerticalBarConfigs];

    if (!isNullOrUndefined(extVerticalBarConfigs)) {
      extVerticalBarConfigs.forEach((ext: hldl.VerticalBarConfig) => {
        const baseConfigIndex: number = jointArray.findIndex(f => f.id === ext.id);
        if (baseConfigIndex >= 0) {
          jointArray[baseConfigIndex] = this.mergeVerticalBarConfig(jointArray[baseConfigIndex], ext);
        } else {
          jointArray.push(ext);
        }
      });
    }

    return jointArray;
  }

  private mergeVerticalBarConfig(base: hldl.VerticalBarConfig, ext: hldl.VerticalBarConfig): hldl.VerticalBarConfig {
    const resType: hldl.VerticalBarConfig = {
      ...base,
      ...this.mergeObjectWithoutProperties(base, ext, ['id', 'verticalBarItems', 'availableOnFrames'])
    };

    // merge complex properties.
    if (!isNullOrUndefined(ext.verticalBarItems)) {
      resType.verticalBarItems = this.mergeVerticalBarItems(base.verticalBarItems, ext.verticalBarItems);
    }
    // merge complex properties.
    if (!isNullOrUndefined(ext.availableOnFrames)) {
      resType.availableOnFrames = this.mergeAvailableOnFrames(base.availableOnFrames, ext.availableOnFrames);
    }

    return resType;
  }

  private mergeAvailableOnFrames(baseAvailableOnFrames: hldl.AvailableOnFrame[], extAvailableOnFrames: hldl.AvailableOnFrame[]): hldl.AvailableOnFrame[] {
    let jointArray: hldl.AvailableOnFrame[] = [];
    jointArray = [...jointArray, ...baseAvailableOnFrames];

    if (!isNullOrUndefined(extAvailableOnFrames)) {
      extAvailableOnFrames.forEach((ext: hldl.AvailableOnFrame) => {
        const baseAvailableOnFrameIndex: number = jointArray.findIndex(f => f.id === ext.id);
        if (baseAvailableOnFrameIndex >= 0) {
          jointArray[baseAvailableOnFrameIndex] = this.mergeAvailableOnFrame(jointArray[baseAvailableOnFrameIndex], ext);
        } else {
          jointArray.push(ext);
        }
      });
    }

    return jointArray;
  }

  private mergeAvailableOnFrame(baseAvailableOnFrame: hldl.AvailableOnFrame, ext: hldl.AvailableOnFrame): hldl.AvailableOnFrame {
    const resView: hldl.AvailableOnFrame = {
      ...baseAvailableOnFrame,
      ...this.mergeObjectWithoutProperties(baseAvailableOnFrame, ext, ['id'])
    };

    // merge complex properties.
    return resView;
  }

  private mergeVerticalBarItems(baseVerticalBarItems: hldl.VerticalBarItem[], extVerticalBarItems: hldl.VerticalBarItem[]): hldl.VerticalBarItem[] {
    let jointArray: hldl.VerticalBarItem[] = [];
    jointArray = [...jointArray, ...baseVerticalBarItems];

    if (!isNullOrUndefined(extVerticalBarItems)) {
      extVerticalBarItems.forEach((ext: hldl.VerticalBarItem) => {
        const baseConfigIndex: number = jointArray.findIndex(f => f.id === ext.id);
        if (baseConfigIndex >= 0) {
          jointArray[baseConfigIndex] = this.mergeVerticalBarItem(jointArray[baseConfigIndex], ext);
        } else {
          jointArray.push(ext);
        }
      });
    }

    return jointArray;
  }

  private mergeVerticalBarItem(base: hldl.VerticalBarItem, ext: hldl.VerticalBarItem): hldl.VerticalBarItem {
    const resType: hldl.VerticalBarItem = {
      ...base,
      ...this.mergeObjectWithoutProperties(base, ext, ['id', 'verticalBarItems'])
    };

    // merge complex properties.
    if (!isNullOrUndefined(ext.verticalBarItems)) {
      resType.verticalBarItems = this.mergeVerticalBarItems(base.verticalBarItems, ext.verticalBarItems);
    }
    return resType;
  }

  private mergeSnapInType(baseSnapInType: hldl.SnapInType, ext: hldl.SnapInType): hldl.SnapInType {
    const resType: hldl.SnapInType = {
      ...baseSnapInType,
      ...this.mergeObjectWithoutProperties(baseSnapInType, ext, ['typeId', 'messageTypes'])
    };

    // merge complex properties.
    if (!isNullOrUndefined(ext.messageTypes)) {
      resType.messageTypes = this.mergeMessageTypes(baseSnapInType.messageTypes, ext.messageTypes);
    }
    return resType;
  }

  private mergeMessageTypes(base: hldl.MessageType[], ext: hldl.MessageType[]): hldl.MessageType[] {
    let jointArray: hldl.MessageType[] = [];
    jointArray = [...jointArray, ...base];

    if (!isNullOrUndefined(ext)) {
      jointArray = [...jointArray, ...ext];
      return jointArray.filter((item, index) => jointArray.findIndex(x => x.name === item.name) === index);
    } else {
      return jointArray;
    }
  }

  private mergeHfwFrame(baseFrame: hldl.HfwFrame, ext: hldl.HfwFrame): hldl.HfwFrame {
    const resFrame: hldl.HfwFrame = {
      ...baseFrame,
      ...this.mergeObjectWithoutProperties(baseFrame, ext,
        ['id', 'layoutInstances', 'outletName', 'rightPanelCommunications', 'panes', 'snapInInstances', 'qParamServices', 'views'])
    };

    // merge complex properties.
    if (!isNullOrUndefined(ext.snapInInstances)) {
      resFrame.snapInInstances = this.mergeSnapInInstances(baseFrame.snapInInstances, ext.snapInInstances);
    }
    if (!isNullOrUndefined(ext.panes)) {
      resFrame.panes = this.mergePanes(baseFrame.panes, ext.panes);
    }
    if (!isNullOrUndefined(ext.layoutInstances)) {
      if (JSON.stringify(baseFrame.layoutInstances) !== JSON.stringify(ext.layoutInstances)) {
        resFrame.layoutInstances = this.mergeLayoutInstances(baseFrame.layoutInstances, ext.layoutInstances);
      }
    }
    if (!isNullOrUndefined(ext.qParamServices)) {
      resFrame.qParamServices = this.mergeQParamServices(baseFrame.qParamServices, ext.qParamServices);
    }
    if (!isNullOrUndefined(ext.rightPanelCommunications)) {
      resFrame.rightPanelCommunications = this.mergeChannels(baseFrame.rightPanelCommunications, ext.rightPanelCommunications);
    }
    if (!isNullOrUndefined(ext.views)) {
      resFrame.views = this.mergeViews(baseFrame.views, ext.views);
    }

    return resFrame;
  }

  private mergeViews(base: hldl.View[], ext: hldl.View[]): hldl.View[] {
    let jointArray: hldl.View[] = [];
    jointArray = [...jointArray, ...base];

    ext.forEach((extView: hldl.View) => {
      const baseViewIndex: number = jointArray.findIndex(s => s.id === extView.id);
      if (baseViewIndex >= 0) {
        jointArray[baseViewIndex] = this.mergeView(jointArray[baseViewIndex], extView);
      } else {
        jointArray.push(extView);
      }
    });

    return jointArray;
  }

  private mergeView(baseView: hldl.View, ext: hldl.View): hldl.View {
    const resView: hldl.View = {
      ...baseView,
      ...this.mergeObjectWithoutProperties(baseView, ext, ['id', 'viewLayouts'])
    };

    // merge complex properties.
    if (!isNullOrUndefined(ext.viewLayouts)) {
      resView.viewLayouts = this.mergeViewLayouts(baseView.viewLayouts, ext.viewLayouts);
    }
    return resView;
  }

  private mergeViewLayouts(base: hldl.ViewLayout[], ext: hldl.ViewLayout[]): hldl.ViewLayout[] {
    let jointArray: hldl.ViewLayout[] = [];
    jointArray = [...jointArray, ...base];

    ext.forEach((extViewLayout: hldl.ViewLayout) => {
      const baseViewLayoutIndex: number = jointArray.findIndex(s => s.id === extViewLayout.id);
      if (baseViewLayoutIndex >= 0) {
        jointArray[baseViewLayoutIndex] = this.mergeViewLayout(jointArray[baseViewLayoutIndex], extViewLayout);
      } else {
        jointArray.push(extViewLayout);
      }
    });

    return jointArray;
  }

  private mergeViewLayout(baseViewLayout: hldl.ViewLayout, ext: hldl.ViewLayout): hldl.ViewLayout {
    const res: hldl.ViewLayout = {
      ...baseViewLayout,
      ...this.mergeObjectWithoutProperties(baseViewLayout, ext, ['id'])
    };
    // merge complex properties.
    // ..
    return res;
  }

  private mergeQParamServices(base: hldl.QParamService[], ext: hldl.QParamService[]): hldl.QParamService[] {
    let jointArray: hldl.QParamService[] = [];
    jointArray = [...jointArray, ...base];

    ext.forEach((extQ: hldl.QParamService) => {
      const baseQIndex: number = jointArray.findIndex(s => s.id === extQ.id);
      if (baseQIndex >= 0) {
        jointArray[baseQIndex] = this.mergeQParamService(jointArray[baseQIndex], extQ);
      } else {
        jointArray.push(extQ);
      }
    });

    return jointArray;
  }

  private mergeSnapInInstances(base: hldl.SnapInInstance[], ext: hldl.SnapInInstance[]): hldl.SnapInInstance[] {
    let jointArray: hldl.SnapInInstance[] = [];
    jointArray = [...jointArray, ...base];

    ext.forEach((extSni: hldl.SnapInInstance) => {
      const baseSniIndex: number = jointArray.findIndex(s => s.snapInId === extSni.snapInId);
      if (baseSniIndex >= 0) {
        jointArray[baseSniIndex] = { ...jointArray[baseSniIndex], ...extSni };
      } else {
        jointArray.push(extSni);
      }
    });

    return jointArray;
  }

  private mergePanes(base: hldl.Pane[], ext: hldl.Pane[]): hldl.Pane[] {
    let jointArray: hldl.Pane[] = [];
    jointArray = [...jointArray, ...base];

    ext.forEach((extPane: hldl.Pane) => {
      const basePaneIndex: number = jointArray.findIndex(s => s.id === extPane.id);
      if (basePaneIndex >= 0) {
        jointArray[basePaneIndex] = this.mergePane(jointArray[basePaneIndex], extPane);
      } else {
        jointArray.push(extPane);
      }
    });

    return jointArray;
  }

  private mergePane(basePane: hldl.Pane, ext: hldl.Pane): hldl.Pane {
    const resPane: hldl.Pane = {
      ...basePane,
      ...this.mergeObjectWithoutProperties(basePane, ext, ['id', 'outletName', 'snapInReferences'])
    };

    // merge complex properties.
    if (!isNullOrUndefined(ext.snapInReferences)) {
      resPane.snapInReferences = this.mergeSnapInReferences(basePane.snapInReferences, ext.snapInReferences);
    }
    return resPane;
  }

  private mergeQParamService(base: hldl.QParamService, ext: hldl.QParamService): hldl.QParamService {
    const resQ: hldl.QParamService = {
      ...base,
      ...this.mergeObjectWithoutProperties(base, ext, ['id', 'channels'])
    };

    // merge complex properties.
    if (!isNullOrUndefined(ext.channels)) {
      resQ.channels = this.mergeChannels(base.channels, ext.channels);
    }
    return resQ;
  }

  private mergeChannels(base: hldl.Channel[], ext: hldl.Channel[]): hldl.Channel[] {
    let jointArray: hldl.Channel[] = [];
    jointArray = [...jointArray, ...base];

    ext.forEach((extChannel: hldl.Channel) => {
      const baseChannelIndex: number = jointArray.findIndex(s => s.id === extChannel.id);
      if (baseChannelIndex >= 0) {
        jointArray[baseChannelIndex] = this.mergeChannel(jointArray[baseChannelIndex], extChannel);
      } else {
        jointArray.push(extChannel);
      }
    });

    return jointArray;
  }

  private mergeChannel(base: hldl.Channel, ext: hldl.Channel): hldl.Channel {
    const resQ: hldl.Channel = {
      ...base,
      ...this.mergeObjectWithoutProperties(base, ext, ['id', 'communicationRules'])
    };

    // merge complex properties.
    if (!isNullOrUndefined(ext.communicationRules)) {
      resQ.communicationRules = this.mergeCommunicationRules(base.communicationRules, ext.communicationRules);
    }
    return resQ;
  }

  private mergeSnapInReferences(base: hldl.SnapInReference[], ext: hldl.SnapInReference[]): hldl.SnapInReference[] {
    let jointArray: hldl.SnapInReference[] = [];
    jointArray = [...jointArray, ...base];

    ext.forEach((extSni: hldl.SnapInReference) => {
      const baseSniIndex: number = jointArray.findIndex(s => s.id === extSni.id);
      if (baseSniIndex >= 0) {
        jointArray[baseSniIndex] = this.mergeSnapInReference(jointArray[baseSniIndex], extSni);
      } else {
        if (!isNullOrUndefined(extSni.order) && extSni.order! >= 0 && extSni.order! < jointArray.length) {
          jointArray.splice(extSni.order!, 0, extSni);
        } else {
          jointArray.push(extSni);
        }
      }
    });

    return jointArray;
  }

  private mergeSnapInReference(baseSniRef: hldl.SnapInReference, ext: hldl.SnapInReference): hldl.SnapInReference {
    const resBaseSniRef: hldl.SnapInReference = {
      ...baseSniRef,
      ...this.mergeObjectWithoutProperties(baseSniRef, ext, ['id', 'communicationRules'])
    };
    // merge complex properties.
    if (!isNullOrUndefined(ext.communicationRules)) {
      baseSniRef.communicationRules = this.mergeCommunicationRules(baseSniRef.communicationRules, ext.communicationRules);
    }
    return resBaseSniRef;
  }

  private mergeCommunicationRules(communicationRules: hldl.CommunicationRule[], extRules: hldl.CommunicationRule[]): hldl.CommunicationRule[] {
    let jointArray: hldl.CommunicationRule[] = [];
    jointArray = [...jointArray, ...communicationRules];

    jointArray = [...jointArray, ...extRules];
    return jointArray.filter((item, index) => jointArray.findIndex(x => x.destination === item.destination) === index);
  }

  private mergeLayoutInstances(base: hldl.LayoutInstance[], ext: hldl.LayoutInstance[]): hldl.LayoutInstance[] {
    let jointArray: hldl.LayoutInstance[] = [];
    jointArray = [...jointArray, ...base];

    ext.forEach((extLayout: hldl.LayoutInstance) => {
      const baseLayoutIndex: number = jointArray.findIndex(s => s.id === extLayout.id);
      if (baseLayoutIndex >= 0) {
        jointArray[baseLayoutIndex] = this.mergeObjectWithoutProperties(jointArray[baseLayoutIndex], ext, ['id']);
      } else {
        jointArray.push(extLayout);
      }
    });

    return jointArray;
  }

  private mergeModes(base: hldl.Mode[], ext: hldl.Mode[]): hldl.Mode[] {
    let jointArray: hldl.Mode[] = [];
    if (!isNullOrUndefined(base)) {
      jointArray = [...jointArray, ...base];
    }

    if (isNullOrUndefined(jointArray)) {
      jointArray = [];
    }
    ext.forEach((extMode: hldl.Mode) => {
      const baseModeIndex: number = jointArray.findIndex(s => !isNullOrUndefined(s) && s.id === extMode.id);
      if (baseModeIndex >= 0) {
        jointArray[baseModeIndex] = this.mergeMode(jointArray[baseModeIndex], extMode);
      } else {
        jointArray.push(extMode);
      }
    });

    return jointArray;
  }

  private mergeMode(baseMode: hldl.Mode, ext: hldl.Mode): hldl.Mode {
    const resbaseMode: hldl.Mode = {
      ...baseMode,
      ...this.mergeObjectWithoutProperties(baseMode, ext, ['id', 'availableLayoutIds', 'deeplinkSubscribers'])
    };
    // merge complex properties.
    // ..
    return resbaseMode;
  }

  private mergeObjectWithoutProperties(base: any, obj: any, keys: string[]): any {
    const target: any = { ...base };
    for (const i in obj) {
      if (keys.includes(i)) {
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(obj, i)) {
        continue;
      }
      target[i] = obj[i];
    }
    return target;
  }

}
