import { FullPaneId } from '../../common/fullsnapinid/full-pane-id.model';
import { FullQParamId } from '../../common/fullsnapinid/full-qparam-id.model';
import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { QParam } from '../../common/interfaces/q-param.model';

export class HfwMessageParam {
  public constructor(
    public messageTypes: string[],
    public messageBody: any,
    public preselection: boolean,
    public qParam: QParam,
    public broadcast: boolean,
    public applyRuleId: string | null,
    public skipNavigation?: boolean) {
  }
}
export class SnapinMessageParam extends HfwMessageParam {
  public constructor(
    public fullId: FullSnapInId,
    public location: FullPaneId,
    public messageTypes: string[],
    public messageBody: any,
    public preselection: boolean,
    public qParam: QParam,
    public broadcast: boolean,
    public applyRuleId: string | null,
    public secondarySelectionInSinglePane: boolean,
    public skipNavigation?: boolean) {
    super(messageTypes, messageBody, preselection, qParam, broadcast, applyRuleId, skipNavigation);
  }
}

export class ComponentMessageParam extends HfwMessageParam {
  public constructor(
    public senderId: string,
    public senderFrameId: string,
    public communicationId: string,
    public messageTypes: string[],
    public messageBody: any,
    public preselection: boolean,
    public qParam: QParam,
    public broadcast: boolean,
    public applyRuleId: string | null,
    public skipNavigation?: boolean) {
    super(messageTypes, messageBody, preselection, qParam, broadcast, applyRuleId, skipNavigation);
  }
}

export class QParamServiceMessageParam extends HfwMessageParam {
  public constructor(
    public sender: FullQParamId | null,
    public messageTypes: string[],
    public messageBody: any,
    public preselection: boolean,
    public qParam: QParam,
    public broadcast: boolean,
    public applyRuleId: string | null,
    public avoidSelectSnapInOnFocus: boolean,
    public skipNavigation?: boolean) {
    super(messageTypes, messageBody, preselection, qParam, broadcast, applyRuleId, skipNavigation);
  }
}
