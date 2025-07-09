import { NavigationExtras, UrlTree } from '@angular/router';
import { ModeData } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';

import { FullPaneId } from '../../common/fullsnapinid/full-pane-id.model';
import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { MessageParameters } from '../../common/interfaces/message-parameters.model';
import { SnapInBase } from '../../common/snapin-base/snapin.base';
import { UnsavedDataReason } from '../../common/unsaved-data/unsaved-data.model';
import { HfwFrame, LayoutInstance, Pane } from '../shared/hldl/hldl-data.model';
import { HLDL_TEST_EXAMPLE } from '../shared/hldl/hldl-example-data.model';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { SnapInStore } from '../shared/stores/snapin.store';
import { AppStatus } from './app-status.model';
import { UnsavedDataHandler } from './unsaved-data.handler';

describe('UnsavedDataHandler', () => {
  let unsavedDataHandler: UnsavedDataHandler;

  const frameConfig: HfwFrame = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[4]));
  const frameStore: FrameStore = new FrameStore(frameConfig, null!, null!, null!, null!);

  const paneConfig: Pane = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[4].panes[1]));
  const paneStore: PaneStore = new PaneStore(paneConfig);

  const snapInStore: SnapInStore = new SnapInStore([], 'tabResId');

  const stateServiceStub: any = {
    getFrameStoreViaId: (frameId: string) => frameStore,
    getPaneStoreViaIds: (frameId: string, paneId: string) => paneStore,
    getSnapInStoreViaIds: (frameId: string, sniId: string) => snapInStore,
    // getMostFittingLayoutId: (layouts: LayoutInstance[]) => '3-pane-investigative',
    appStatus: AppStatus.Running,
    selectLayoutAndSaveUserSettings: (frameId: string, layoutId: string) => {}
  };

  const msgBrokerServiceStub: any = {
    sendMessage: (fullId: FullSnapInId, paneId: FullPaneId, types: string[],
      body: any,
      preselection: boolean,
      qParam: any,
      broadcast: boolean,
      ruleId: string,
      skipNavigation: boolean,
      modeId: string) => of(true)
  };

  const routingHelperServiceStub: any = {
    getWorkAreaFrameId: (url: string) => url,
    getWorkAreaFrameLayoutId: (url: string) => url,
    getUrlOfCurrentStateAndSpecificLayout: (frameMap: Map<string, FrameStore>, workAreaFrame: HfwFrame, selections: Map<string, any>,
      frame: HfwFrame, layoutId: string,
      workAreaMode: ModeData) => {
      const tree: UrlTree = {
        toString: () => 'fakeUrl',
        fragment: 'fake',
        queryParams: null!,
        root: null!,
        queryParamMap: null!
      };
      return tree;
    }
  };

  const routerStub: any = {
    navigateByUrl: (urlTree: UrlTree, navigationExtras: NavigationExtras) => Promise.resolve(true)
  };

  const modeServiceStub: any = {
    setMode: (mode: ModeData) => {}
  };

  const traceServiceStub: any = {
    debug: (source: string, message?: string, ...optionalParams: any[]) => {},
    info: (source: string, message?: string, ...optionalParams: any[]) => {},
    isDebugEnabled: (source: string) => {}
  };

  const qParamHandlerStub: any = {
    getFrameQParam: (frameId: string, modeId: string) => new Map<string, string>()
  };

  it('frameChange  should succeed.', () => {
    const modeData: ModeData = { id: 'investigative', relatedValue: 'fakeRelated' };
    const firstSelection: MessageParameters = { messageBody: 'message', types: ['Event'], qParam: null! };
    const frameMap: Map<string, FrameStore> = new Map<string, FrameStore>();
    frameMap.set('event-list', frameStore);
    const sniPerId: { id: string; instance: any }[] = [
      {
        id: 'sys-brow',
        instance: {
          onUnsavedDataCheck: (reason: UnsavedDataReason): Observable<boolean> => of(true)
        }
      }
    ];

    unsavedDataHandler = new UnsavedDataHandler('unsaved-test',
      UnsavedDataReason.FrameChange,
      sniPerId,
      traceServiceStub
    );
    expect(unsavedDataHandler).not.toBeNull();
    unsavedDataHandler.chekUnsavedDataForAllSnapins().subscribe((res: boolean) => {
      expect(res).toBeTruthy();
    }).unsubscribe();
  });
});
