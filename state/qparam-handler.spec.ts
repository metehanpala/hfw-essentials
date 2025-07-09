import { Params } from '@angular/router';
import { ModeData } from '@gms-flex/services-common';
import { BehaviorSubject } from 'rxjs';

import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { MessageParameters } from '../../common/interfaces/message-parameters.model';
import { QParam } from '../../common/interfaces/q-param.model';
import { HfwFrame, LayoutInstance, Pane } from '../shared/hldl/hldl-data.model';
import { HLDL_TEST_EXAMPLE } from '../shared/hldl/hldl-example-data.model';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { SnapInStore } from '../shared/stores/snapin.store';
import { AppStatus } from './app-status.model';
import { HfwState } from './hfw-state';
import { QParamsHandler } from './qparams-handler';

const EVENT_LIST = 'event-list';

describe('QParamHandler', () => {
  let qParamHAndler: QParamsHandler;

  const frameConfig: HfwFrame = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[4]));
  const frameStore: FrameStore = new FrameStore(frameConfig, null!, null!, null!, null!);

  const paneConfig: Pane = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[4].panes[1]));
  const paneStore: PaneStore = new PaneStore(paneConfig);

  const snapInStore: SnapInStore = new SnapInStore([], 'tabResId');

  const currentState: HfwState = new HfwState();

  const stateServiceStub: any = {
    getFrameStoreViaId: (frameId: string) => frameStore,
    getPaneStoreViaIds: (frameId: string, paneId: string) => paneStore,
    getSnapInStoreViaIds: (frameId: string, sniId: string) => snapInStore,
    // getMostFittingLayoutId: (layouts: LayoutInstance[]) => '3-pane-investigative',
    appStatus: AppStatus.Running,
    selectLayoutAndSaveUserSettings: (frameId: string, layoutId: string) => {},
    getSnapInStore: (fullId: FullSnapInId) => {
      snapInStore.fullSnapInId = new FullSnapInId(EVENT_LIST, 'sys-brow');
      return snapInStore;
    },
    onNewQParamDetected: (selectionMaster: SnapInStore, selectionParam: string) => {}
  };

  const traceServiceStub: any = {
    debug: (source: string, message?: string, ...optionalParams: any[]) => {},
    info: (source: string, message?: string, ...optionalParams: any[]) => {}
  };

  const paramStub: Params = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'event-list.sys-brow': 'blabla',
    'mode': 'investigative',
    'relatedValue': 'blablablabla'
  };

  const qParamSubject: BehaviorSubject<Params> = new BehaviorSubject<Params>(paramStub);

  const activatedRouteStub: any = {
    queryParams: qParamSubject.asObservable()
  };

  it('activateQParamSubscription and pushNewSelection succeed.', () => {
    const frameMap: Map<string, FrameStore> = new Map<string, FrameStore>();
    frameMap.set(EVENT_LIST, frameStore);
    currentState.frameMap = frameMap;

    qParamHAndler = new QParamsHandler(stateServiceStub, traceServiceStub);

    qParamHAndler.activateQParamSubscription(activatedRouteStub, currentState);
    expect(qParamHAndler).not.toBeNull();

    const qParam: QParam = { name: 'event-list.EventQParamService.primary', value: 'fake2' };
    qParamHAndler.pushNewSelectionQParam(
      qParam,
      currentState);
  });

  it('activateQParamSubscription, pushNewSelection and fire new qParamChange.', () => {
    const modeData: ModeData = { id: 'investigative', relatedValue: 'fakeRelated' };
    const firstSelection: MessageParameters = { messageBody: 'message', types: ['Event'], qParam: null! };
    const frameMap: Map<string, FrameStore> = new Map<string, FrameStore>();
    frameMap.set(EVENT_LIST, frameStore);
    currentState.frameMap = frameMap;

    qParamHAndler = new QParamsHandler(stateServiceStub, traceServiceStub);

    qParamHAndler.activateQParamSubscription(activatedRouteStub, currentState);
    expect(qParamHAndler).not.toBeNull();

    const qParam: QParam = { name: 'event-list.SystemQParamService.primary', value: 'fake2' };
    qParamHAndler.pushNewSelectionQParam(
      qParam,
      currentState);

    qParamSubject.next({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'event-list.sys-brow': 'blablaxxx',
      'mode': 'investigative',
      'relatedValue': 'blablablabla'
    });

  });
});
