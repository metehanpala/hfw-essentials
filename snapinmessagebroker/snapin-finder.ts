import { isNullOrUndefined } from '@gms-flex/services-common';

import { FullPaneId } from '../../common/fullsnapinid/full-pane-id.model';
import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { CommunicationRule, SnapInReference } from '../shared/hldl/hldl-data.model';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { SnapInStore } from '../shared/stores/snapin.store';
import { HfwState } from '../state/hfw-state';
import { ComponentMessageParam, HfwMessageParam, QParamServiceMessageParam, SnapinMessageParam } from './message-param.model';
import { MessageTargets } from './message-targets.model';
import { SnapInReferenceIds } from './snap-in-reference-ids.model';

export class MsgReferences {
  public constructor(
    public communicationRules: CommunicationRule[] | null,
    public tempRuleId: string | null) {
  }
}
/**
 * Helper class to find snapins
 *
 * @export
 * @class SnapinFinder
 */
export class SnapinFinder {

  public static groupByFrameAndPane(sniList: SnapInStore[]): Map<string, Map<string, SnapInStore>> {
    const targetMap: Map<string, Map<string, SnapInStore>> = new Map<string, Map<string, SnapInStore>>();
    if (sniList != null) {
      for (const sni of sniList) {

        if (targetMap.get(sni.fullSnapInId.frameId) == null) {
          targetMap.set(sni.fullSnapInId.frameId, new Map<string, SnapInStore>());
        }

        const sniMap: Map<string, SnapInStore> | undefined = targetMap.get(sni.fullSnapInId.frameId);
        if (sniMap && sniMap?.get(sni.fullSnapInId.snapInId) == null) {
          sniMap.set(sni.fullSnapInId.snapInId, sni);
        }
      }
    }
    return targetMap;
  }

  public constructor(private readonly state: HfwState) {
  }

  /**
   * Finds all snapins which are possible targets for a message sent by the sender.
   * Following criterieas have all to be met in order to be a snapin:
   * Comnunication rule id (name) of the sender; a snapin is a target if the parameter 'applyRuleId' matches the ruleName of the communication rule
   * Message type sent by the sender; a snapin is a target if the messageType of the sender matches the messageType of the cummunication rule
   * Communication rules (destination) of the sender; a snapin is a target if it matches the destination of one of the communication rules of the sender.
   * Pinned state of the destination pane and alternate destination pane; to be defined...
   *
   * @param {FullSnapInId} sender Snapin Id of the message sender
   * @param {string} messageType message type
   * @param {string} applyRuleId; name of the rule id, if undefined, the default rule is used
   * @returns {Map<string, any>}
   *
   * @memberOf SnapinFinder
   */
  public findTargetSnapIns(msg: HfwMessageParam): MessageTargets {

    let foundSnapins: SnapInStore[] = [];
    const targetPanes: PaneStore[] = [];
    let canSwitchLayout = false;
    const rightPanelFrames: string[] = [];

    const canSendToSelf = this.setCanSendToSelf(msg);

    const outCommRules = this.setOutCommRulesAndTempRuleId(msg).communicationRules;
    const tempRuleId = this.setOutCommRulesAndTempRuleId(msg).tempRuleId;

    if (outCommRules != null) {
      const senderFrameId = this.getSenderFrameId(msg);
      outCommRules.forEach(rule => {

        const tempRuleName: string = rule.ruleName ?? '';
        if (tempRuleId === tempRuleName) {
          if (this.checkHitRightPanel(rule, tempRuleId, rightPanelFrames, senderFrameId) === true) {
            rightPanelFrames.push(senderFrameId);
          }
          if (rule.destination != null) {
            const filtered = this.setFilterOrSpliceIt(rule, targetPanes, msg, canSendToSelf);
            foundSnapins = this.checkFilterValue(filtered, foundSnapins);
            if (filtered != null && filtered.length > 0 && rule.canSwitchLayout) {
              canSwitchLayout = true;
            }
          }
        }
      });
    }

    return new MessageTargets(foundSnapins, targetPanes, rightPanelFrames, canSwitchLayout);
  }

  private checkFilterValue(filtered: SnapInStore[], foundSnapins: SnapInStore[]): SnapInStore[] {
    if (filtered != null && filtered.length > 0) {
      foundSnapins.push(...filtered);
    }
    return foundSnapins;
  }

  private checkHitRightPanel(rule: CommunicationRule, tempRuleId: string | null, rightPanelFrames: string[], senderFrameId: string): boolean {
    const tempRuleName: string = rule.ruleName ?? '';
    if (tempRuleId === tempRuleName) {
      if (rule.hitRightPanel === true) {
        if (rightPanelFrames.findIndex(f => f === senderFrameId) === -1) {
          return true;
        }
      }
    }
    return false;
  }

  private setFilterOrSpliceIt(rule: CommunicationRule, targetPanes: PaneStore[], msg: HfwMessageParam, canSendToSelf: boolean | undefined): SnapInStore[] {
    const destination = this.setDestination(rule);
    this.callAddDestinationPane(destination!, targetPanes);
    const filtered: SnapInStore[] =
    this.filterSnapIn(destination!, msg.messageTypes);

    if (msg instanceof SnapinMessageParam && (canSendToSelf === false || msg.secondarySelectionInSinglePane)) {
      const senderIndex: number = filtered.findIndex(s => FullSnapInId.areEqual(s.fullSnapInId, msg.fullId));
      if (senderIndex >= 0) {
        filtered.splice(senderIndex, 1);
      }
    }
    return filtered;
  }

  private setOutCommRulesAndTempRuleId(msg: HfwMessageParam): MsgReferences {
    let outCommRules: CommunicationRule[] | null;
    let tempRuleId: string;
    if (msg instanceof SnapinMessageParam) {
      if (!msg.broadcast) {
        outCommRules = this.state.getSnapInCommRules(msg.fullId, msg.location);
        tempRuleId = msg.applyRuleId ?? '';
        return new MsgReferences(outCommRules, tempRuleId);
      } else {
        outCommRules = this.getBroadcastCommRules();
        tempRuleId = '';
        return new MsgReferences(outCommRules, tempRuleId);
      }
    } else {
      if (msg instanceof QParamServiceMessageParam) {
        outCommRules = this.setOutCommRulesForQParamServiceMsg(msg);
        tempRuleId = msg.applyRuleId ?? '';
        return new MsgReferences(outCommRules, tempRuleId);
      } else {
        if (msg instanceof ComponentMessageParam) {
          outCommRules = this.getOutgoingRuleForCompMessage(msg);
          tempRuleId = msg.applyRuleId ?? '';
          return new MsgReferences(outCommRules, tempRuleId);
        } else {
          outCommRules = null;
          return new MsgReferences(outCommRules, null);
        }
      }
    }
  }

  private callAddDestinationPane(destination: string, targetPanes: PaneStore[]): void {
    if (!isNullOrUndefined(destination)) {
      this.addDestinationPane(destination, targetPanes, this.state);
    }
  }

  private setDestination(rule: CommunicationRule): string | null {
    let destination = rule.destination;
    if (rule.fallbackDestination != null) {
      if (!this.destinationPaneIsReachable(destination!, rule.canSwitchLayout)) {
        destination = rule.fallbackDestination;
      }
    }
    return destination;

  }

  private setOutCommRulesForQParamServiceMsg(msg: QParamServiceMessageParam): CommunicationRule[] | null {
    const outCommRules = this.state.getQParamServiceCommRules(msg.sender!);
    // filter rules which applies only on a particular layout id.
    const currentLayoutId = this.state.getFrameStoreViaId(msg.sender!.frameId).selectedLayoutIdValue;
    return outCommRules!.filter(rule => isNullOrUndefined(rule.appliesOnLayoutIds) ||
      rule.appliesOnLayoutIds!.findIndex(layout => layout.id === currentLayoutId) >= 0);
  }

  private setCanSendToSelf(msg: HfwMessageParam): boolean | undefined {
    if (msg instanceof SnapinMessageParam) {
      const senderInstance: SnapInReference | null = this.state.getSnapInReference(msg.fullId, msg.location);
      if (senderInstance != null) {
        return senderInstance.canSendToSelf;
      }
    } else {
      return true;
    }
    return undefined;
  }

  private getOutgoingRuleForCompMessage(msg: ComponentMessageParam): CommunicationRule[] | null {
    const frameStore = this.state.getFrameStoreViaId(msg.senderFrameId);
    if (!isNullOrUndefined(frameStore) && !isNullOrUndefined(frameStore.frameConfig)
      && !isNullOrUndefined(frameStore.frameConfig.rightPanelCommunications)) {
      const channel = frameStore.frameConfig.rightPanelCommunications.find(c => c.id === msg.communicationId);
      if (channel != null) {
        return channel.communicationRules;
      }
    }
    return null;
  }

  private filterSnapIn(/* destId: FullPaneId, */
    destination: string,
    messageTypes: string[]): SnapInStore[] {

    const destId: SnapInReferenceIds = this.getSnapInReferenceIdsFromDestination(destination);

    if (destId != null) {
      let filtered: SnapInStore[];
      if (destId.snapInId != null) {
        const s: SnapInStore | null = this.state.getSnapInStoreViaIds(destId.frameId, destId.snapInId);
        if (s != null && this.isManagingType(s, messageTypes)) {
          filtered = [s];
        }
      } else {
        const frameStore = this.state.frameMap.get(destId.frameId);
        const snapInStores = Array.from(frameStore!.snapInInstanceMap.values());
        if (destId.paneId != null) {
          filtered = snapInStores.filter(s => (s.fullSnapInId.frameId === destId.frameId &&
                          s.hostingPanesIds.find(p => p === destId.paneId) != null &&
                          this.isManagingType(s, messageTypes)));
        } else {
          filtered = snapInStores.filter(s => (s.fullSnapInId.frameId === destId.frameId &&
                          this.isManagingType(s, messageTypes)));
        }
      }
      return filtered!;
    }
    return [];
  }

  private getSnapInReferenceIdsFromDestination(destination: string): SnapInReferenceIds {
    let id: SnapInReferenceIds;
    if (destination != null) {
      const temp: string[] = destination.split('.', 3);
      id = {
        frameId: temp[0],
        paneId: temp[1],
        snapInId: temp[2]
      };
    }
    return id!;
  }

  private getPaneFullIdFromDestination(destination: string): FullPaneId {
    let id: FullPaneId = new FullPaneId('', '');
    if (destination != null) {
      const temp: string[] = destination.split('.', 3);
      id = new FullPaneId(temp[0], temp[1]);
    }
    return id;
  }

  private isManagingType(s: SnapInStore, messageTypes: string[]): boolean {
    if (s.messageTypes == null) {
      return true;
    } else {
      let foundSni: any;
      let found = false;
      for (const type of messageTypes) {
        foundSni = s.messageTypes.find(mt => mt.name === String(type));
        if (foundSni != null) {
          found = true;
          break;
        }
      }
      return found;
    }
  }

  private getBroadcastCommRules(): CommunicationRule[] {
    const outCommRules: CommunicationRule[] = [];
    const frames: FrameStore[] = this.state.getFramesStore()!;
    frames.forEach(f => {
      const rule: CommunicationRule = new CommunicationRule(f.id,
        null,
        null,
        false,
        null,
        true);
      outCommRules.push(rule);
    });
    return outCommRules;
  }

  private destinationPaneIsReachable(destination: string, canSwitchLayout: boolean): boolean {
    const fullId: FullPaneId = this.getPaneFullIdFromDestination(destination);

    // if destination does not arrive to a pane
    if (fullId.paneId == null || fullId.frameId == null) {
      return true;
    } else {
      if (!canSwitchLayout) {
        return this.state.isPaneVisibleInCurrentLayout(fullId);
      } else {
        return this.state.isPaneReachable(fullId);
      }
    }
  }

  private addDestinationPane(destination: string, targetPanes: PaneStore[], state: HfwState): void {
    const fullId: FullPaneId = this.getPaneFullIdFromDestination(destination);

    if (fullId.paneId == null) { // The destination is a whole frame
      const frame: FrameStore | null = state.getFrameStoreViaId(fullId.frameId);
      if (frame != null) {
        frame.paneMap!.forEach((p: PaneStore) => {
          this.addSingleDestinationPane(targetPanes, p.fullPaneId, state);
        });
      }
    } else { // The destination is a pane.
      this.addSingleDestinationPane(targetPanes, fullId, state);
    }
  }

  private addSingleDestinationPane(targetPanes: PaneStore[], fullId: FullPaneId, state: HfwState): void {
    const target: PaneStore | undefined = targetPanes.find(p => FullPaneId.areEqual(p.fullPaneId, fullId));
    if (target === undefined && state?.getPaneStore(fullId) != null) {
      targetPanes.push(state.getPaneStore(fullId)!);
    }
  }

  private getSenderFrameId(msg: HfwMessageParam): string {
    if (msg instanceof SnapinMessageParam) {
      return msg.fullId.frameId;
    } else {
      if (msg instanceof QParamServiceMessageParam) {
        return msg.sender!.frameId;
      } else {
        if (msg instanceof ComponentMessageParam) {
          return msg.senderFrameId;
        }
      }
    }
    return '';
  }

}
