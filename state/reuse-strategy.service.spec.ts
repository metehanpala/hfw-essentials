import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot } from '@angular/router';
import { TraceService } from '@gms-flex/services-common';

import { FullPaneId, FullSnapInId } from '../../common/fullsnapinid';
import { ReuseStrategyService } from './reuse-strategy.service';

describe('ReuseStrategyService', () => {
  let reuseService: ReuseStrategyService;
  const traceServiceStub: any = {
    debug: (source: string, message?: string, ...optionalParams: any[]) => { },
    info: (source: string, message?: string, ...optionalParams: any[]) => { },
    error: (source: string, message?: string, ...optionalParams: any[]) => { }
  };

  const systemManagerFrameName = 'system-manager';
  const sysBrowserSnapin = new FullSnapInId(systemManagerFrameName, 'sys-brow');
  const grapViewerSnapin = new FullSnapInId(systemManagerFrameName, 'graph');
  const selectionPane = new FullPaneId(systemManagerFrameName, 'selection-pane');
  const singlePane = new FullPaneId(systemManagerFrameName, 'single-pane');

  const systemBrowserSnapInComponentName = 'SystemBrowserSnapInComponent';
  const cmpStubSystemBrowser: any = { name: systemBrowserSnapInComponentName };
  const arsSysBrowserSelPane: ActivatedRouteSnapshot = new ActivatedRouteSnapshot();
  arsSysBrowserSelPane.component = cmpStubSystemBrowser;
  arsSysBrowserSelPane.outlet = 'primary';
  arsSysBrowserSelPane.url = [];
  (arsSysBrowserSelPane.routeConfig as any) = { path: '', component: cmpStubSystemBrowser };
  arsSysBrowserSelPane.data = { paneId: selectionPane, snapinId: sysBrowserSnapin };

  const arsSysBrowserSinglePane: ActivatedRouteSnapshot = new ActivatedRouteSnapshot();
  arsSysBrowserSinglePane.component = cmpStubSystemBrowser;
  arsSysBrowserSinglePane.outlet = 'primary';
  arsSysBrowserSinglePane.url = [];
  (arsSysBrowserSinglePane.routeConfig as any) = { path: 'single', component: cmpStubSystemBrowser };
  arsSysBrowserSinglePane.data = { paneId: singlePane, snapinId: sysBrowserSnapin };

  const graphicSnapInComponentName = 'GraphicViewerSnapInComponent';
  const cmpStubGraphicViewer: any = { name: graphicSnapInComponentName };
  const arsGraphSelPane: ActivatedRouteSnapshot = new ActivatedRouteSnapshot();
  arsGraphSelPane.component = cmpStubGraphicViewer;
  arsGraphSelPane.outlet = 'primary';
  arsGraphSelPane.url = [];
  (arsGraphSelPane.routeConfig as any) = { path: '', component: cmpStubGraphicViewer };
  arsGraphSelPane.data = { paneId: selectionPane, snapinId: grapViewerSnapin };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReuseStrategyService,
        { provide: TraceService, useFactory: traceServiceStub }
      ]
    });
    reuseService = new ReuseStrategyService(traceServiceStub);
  });

  it('ReuseStrategyService: Can load instance', () => {
    expect(reuseService).toBeTruthy();
  });

  it(`ReuseStrategyService: layoutChangeRouterReuse has default value`, () => {
    expect(reuseService.layoutChangeRouterReuse).toEqual(false);
  });

  it(`ReuseStrategyService: reusableSnapins has default value`, () => {
    expect(reuseService.layoutChangeSnapinList).toEqual([]);
  });

  it(`ReuseStrategyService: neverDestroyList has default value`, () => {
    expect(reuseService.neverDestroySnapinList).toEqual([]);
  });

  it('ReuseStrategyService: shouldReuseRoute() verify return call true', () => {
    expect(reuseService.shouldReuseRoute(
      arsSysBrowserSelPane,
      arsSysBrowserSelPane
    )).toBe(true);

  });

  it('ReuseStrategyService: shouldReuseRoute() verify return call false', () => {
    expect(reuseService.shouldReuseRoute(
      arsSysBrowserSelPane,
      arsSysBrowserSinglePane
    )).toBe(false);
  });

  it('ReuseStrategyService: shouldReuseRoute() verify return call false', () => {
    expect(reuseService.shouldReuseRoute(
      null as any,
      null as any
    )).toBe(false);
  });

  it('ReuseStrategyService: shouldAttach() verify return call for default strategy', () => {
    expect(reuseService.shouldAttach(arsSysBrowserSelPane)).toBe(false);
  });

  it('ReuseStrategyService: shouldDetach() verify return call for default strategy', () => {
    expect(reuseService.shouldDetach(arsSysBrowserSelPane)).toBe(false);
  });

  it('ReuseStrategyService: retrieve() verify return call for default strategy', () => {
    expect(reuseService.retrieve(arsSysBrowserSelPane)).toBe(null);
  });

  it('ReuseStrategyService: verify never destroy list', () => {
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);
    reuseService.addSnapinToReuse(sysBrowserSnapin);
    expect(reuseService.neverDestroySnapinList.length).toBe(1);
    expect(reuseService.neverDestroySnapinList[0]).toBe(sysBrowserSnapin);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);

    reuseService.addSnapinToReuse(grapViewerSnapin);
    expect(reuseService.neverDestroySnapinList.length).toBe(2);
    expect(reuseService.neverDestroySnapinList[0]).toBe(sysBrowserSnapin);
    expect(reuseService.neverDestroySnapinList[1]).toBe(grapViewerSnapin);

    reuseService.removeSnapinToReuse(sysBrowserSnapin);
    expect(reuseService.neverDestroySnapinList.length).toBe(1);
    expect(reuseService.neverDestroySnapinList[0]).toBe(grapViewerSnapin);

    reuseService.removeSnapinToReuse(grapViewerSnapin);
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
  });

  it('ReuseStrategyService: shouldAttach() verify return call for reuse strategy (never destroy)', () => {
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);
    reuseService.addSnapinToReuse(sysBrowserSnapin);
    expect(reuseService.neverDestroySnapinList.length).toBe(1);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);
    expect(reuseService.shouldAttach(arsSysBrowserSelPane)).toBe(false); // no stored snapshot yet!
  });

  it('ReuseStrategyService: shouldAttach() verify return call for reuse strategy (layout change)', () => {
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);
    reuseService.startLayoutChangeRouterReuse([sysBrowserSnapin, grapViewerSnapin]);
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
    expect(reuseService.layoutChangeSnapinList.length).toBe(2);
    expect(reuseService.shouldAttach(arsGraphSelPane)).toBe(false); // no stored snapshot yet!
    reuseService.stopLayoutChangeRouterReuse();
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);
  });

  it('ReuseStrategyService: shouldDetach() verify return call for reuse strategy', () => {
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);
    expect(reuseService.shouldDetach(arsGraphSelPane)).toBe(false); // no stored snapshot yet!
  });

  it('ReuseStrategyService: verify detach/store/attach workflow for reuse strategy (never destroy)', () => {
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);
    reuseService.addSnapinToReuse(sysBrowserSnapin);
    reuseService.addSnapinToReuse(grapViewerSnapin);
    expect(reuseService.neverDestroySnapinList.length).toBe(2);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);

    // check if detach is possible and store afterwards
    expect(reuseService.shouldDetach(arsSysBrowserSelPane)).toBe(true);
    reuseService.store(arsSysBrowserSelPane, cmpStubSystemBrowser);
    expect(reuseService.countStoredHandles).toBe(1);
    expect(reuseService.shouldDetach(arsGraphSelPane)).toBe(true);
    reuseService.store(arsGraphSelPane, cmpStubGraphicViewer);
    expect(reuseService.countStoredHandles).toBe(2);

    // check that attach is now possible
    expect(reuseService.shouldAttach(arsSysBrowserSelPane)).toBe(true);
    expect(reuseService.shouldAttach(arsGraphSelPane)).toBe(true);
    expect(reuseService.countStoredHandles).toBe(2);

    // check that retrieval of the component is now possible
    expect((reuseService.retrieve(arsSysBrowserSelPane) as any).name).toBe(systemBrowserSnapInComponentName);
    expect((reuseService.retrieve(arsGraphSelPane) as any).name).toBe(graphicSnapInComponentName);
    expect(reuseService.countStoredHandles).toBe(2);

    // do delete the components and do some checks
    reuseService.store(arsSysBrowserSelPane, null);
    expect(reuseService.shouldAttach(arsSysBrowserSelPane)).toBe(false);
    expect(reuseService.shouldAttach(arsGraphSelPane)).toBe(true);
    expect((reuseService.retrieve(arsSysBrowserSelPane) as any)?.name).toBeUndefined();
    expect((reuseService.retrieve(arsGraphSelPane) as any).name).toBe(graphicSnapInComponentName);
    expect(reuseService.countStoredHandles).toBe(1);

    reuseService.store(arsGraphSelPane, null);
    expect(reuseService.shouldAttach(arsSysBrowserSelPane)).toBe(false);
    expect(reuseService.shouldAttach(arsGraphSelPane)).toBe(false);
    expect((reuseService.retrieve(arsSysBrowserSelPane) as any)?.name).toBeUndefined();
    expect((reuseService.retrieve(arsGraphSelPane) as any)?.name).toBeUndefined();
    expect(reuseService.countStoredHandles).toBe(0);
  });

  it('ReuseStrategyService: verify detach/store/attach workflow for reuse strategy (layout change)', () => {
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);
    reuseService.startLayoutChangeRouterReuse([sysBrowserSnapin, grapViewerSnapin]);
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
    expect(reuseService.layoutChangeSnapinList.length).toBe(2);

    // check if detach is possible and store afterwards
    expect(reuseService.shouldDetach(arsSysBrowserSelPane)).toBe(true);
    reuseService.store(arsSysBrowserSelPane, cmpStubSystemBrowser);
    expect(reuseService.countStoredHandles).toBe(1);
    expect(reuseService.shouldDetach(arsGraphSelPane)).toBe(true);
    reuseService.store(arsGraphSelPane, cmpStubGraphicViewer);
    expect(reuseService.countStoredHandles).toBe(2);

    // check that attach is now possible
    expect(reuseService.shouldAttach(arsSysBrowserSelPane)).toBe(true);
    expect(reuseService.shouldAttach(arsGraphSelPane)).toBe(true);
    expect(reuseService.countStoredHandles).toBe(2);

    // check that retrieval of the component is now possible
    expect((reuseService.retrieve(arsSysBrowserSelPane) as any).name).toBe(systemBrowserSnapInComponentName);
    expect((reuseService.retrieve(arsGraphSelPane) as any).name).toBe(graphicSnapInComponentName);
    expect(reuseService.countStoredHandles).toBe(2);

    // do delete the components and do some checks
    reuseService.store(arsSysBrowserSelPane, null);
    expect(reuseService.shouldAttach(arsSysBrowserSelPane)).toBe(false);
    expect(reuseService.shouldAttach(arsGraphSelPane)).toBe(true);
    expect((reuseService.retrieve(arsSysBrowserSelPane) as any)?.name).toBeUndefined();
    expect((reuseService.retrieve(arsGraphSelPane) as any).name).toBe(graphicSnapInComponentName);
    expect(reuseService.countStoredHandles).toBe(1);

    reuseService.store(arsGraphSelPane, null);
    expect(reuseService.shouldAttach(arsSysBrowserSelPane)).toBe(false);
    expect(reuseService.shouldAttach(arsGraphSelPane)).toBe(false);
    expect((reuseService.retrieve(arsSysBrowserSelPane) as any)?.name).toBeUndefined();
    expect((reuseService.retrieve(arsGraphSelPane) as any)?.name).toBeUndefined();
    expect(reuseService.countStoredHandles).toBe(0);

    reuseService.stopLayoutChangeRouterReuse();
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);
  });

  it('ReuseStrategyService: verify detach/store/attach workflow for reuse strategy (layout change) with snapins never destroyed', () => {
    expect(reuseService.neverDestroySnapinList.length).toBe(0);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);
    reuseService.addSnapinToReuse(sysBrowserSnapin);
    reuseService.startLayoutChangeRouterReuse([sysBrowserSnapin, grapViewerSnapin]);
    expect(reuseService.neverDestroySnapinList.length).toBe(1);
    expect(reuseService.layoutChangeSnapinList.length).toBe(2);

    // check if detach is possible and store afterwards
    expect(reuseService.shouldDetach(arsSysBrowserSelPane)).toBe(true);
    reuseService.store(arsSysBrowserSelPane, cmpStubSystemBrowser);
    expect(reuseService.countStoredHandles).toBe(1);
    expect(reuseService.shouldDetach(arsGraphSelPane)).toBe(true);
    reuseService.store(arsGraphSelPane, cmpStubGraphicViewer);
    expect(reuseService.countStoredHandles).toBe(2);

    // check that attach is now possible
    expect(reuseService.shouldAttach(arsSysBrowserSelPane)).toBe(true);
    expect(reuseService.shouldAttach(arsGraphSelPane)).toBe(true);
    expect(reuseService.countStoredHandles).toBe(2);

    // check that retrieval of the component is now possible
    expect((reuseService.retrieve(arsSysBrowserSelPane) as any).name).toBe(systemBrowserSnapInComponentName);
    expect((reuseService.retrieve(arsGraphSelPane) as any).name).toBe(graphicSnapInComponentName);
    expect(reuseService.countStoredHandles).toBe(2);

    // do delete the components and do some checks
    reuseService.store(arsSysBrowserSelPane, null);
    expect(reuseService.shouldAttach(arsSysBrowserSelPane)).toBe(false);
    expect(reuseService.shouldAttach(arsGraphSelPane)).toBe(true);
    expect((reuseService.retrieve(arsSysBrowserSelPane) as any)?.name).toBeUndefined();
    expect((reuseService.retrieve(arsGraphSelPane) as any).name).toBe(graphicSnapInComponentName);
    expect(reuseService.countStoredHandles).toBe(1);

    reuseService.store(arsGraphSelPane, null);
    expect(reuseService.shouldAttach(arsSysBrowserSelPane)).toBe(false);
    expect(reuseService.shouldAttach(arsGraphSelPane)).toBe(false);
    expect((reuseService.retrieve(arsSysBrowserSelPane) as any)?.name).toBeUndefined();
    expect((reuseService.retrieve(arsGraphSelPane) as any)?.name).toBeUndefined();
    expect(reuseService.countStoredHandles).toBe(0);

    reuseService.stopLayoutChangeRouterReuse();
    expect(reuseService.neverDestroySnapinList.length).toBe(1);
    expect(reuseService.layoutChangeSnapinList.length).toBe(0);
  });
});
