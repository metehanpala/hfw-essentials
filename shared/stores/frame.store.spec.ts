import { TestBed } from '@angular/core/testing';
import { RouteReuseStrategy } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SplitterChanges } from '@gms-flex/controls';
import { AppSettingsService, MockTraceService, ModeData, TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable } from 'rxjs';

import { MockStateService } from '../../state';
import { StateDataStructure, StateDataStructureCreator } from '../../state/data-structure-creation/state-data-structure-creator';
import { ReuseStrategyService } from '../../state/reuse-strategy.service';
import { RoutingHelperService } from '../../state/routing-helper.service';
import * as hldl from '../hldl/hldl-data.model';
import { HLDL_TEST_EXAMPLE } from '../hldl/hldl-example-data.model';
import { FrameStore } from './frame.store';
import { PaneStore } from './pane.store';
import { SplitterStore } from './splitter.store';

describe('FrameStore', () => {

  let component: FrameStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        MockStateService,
        RoutingHelperService,
        AppSettingsService,
        { provide: 'appSettingFilePath', useValue: 'noMatter' },
        { provide: TraceService, useClass: MockTraceService },
        { provide: RouteReuseStrategy, useClass: ReuseStrategyService }
      ]
    });
    const svc: MockStateService = TestBed.inject(MockStateService);
    const dataStructure: StateDataStructure = StateDataStructureCreator.createDataStructure(HLDL_TEST_EXAMPLE.hfwInstance, svc);
    component = dataStructure.frameMap.get('event-list')!;
  });

  it('should get properties', () => {
    const frame: hldl.HfwFrame = HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[4];
    component.frameConfig = frame;

    expect(component.id).toEqual('event-list');

    const isLocked: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    (component as any)._isLocked = isLocked;
    expect(component.isLocked).toEqual(isLocked.asObservable());
  });

  it('should select layout', done => {
    component.selectedLayoutId.subscribe(() => {
      expect(component.selectedLayoutIdValue).toEqual('layoutId');
      done();
    });
    component.selectLayout('layoutId');
  });

  it('should toggle lock/unlock', () => {
    const isLocked: BehaviorSubject<true> = new BehaviorSubject(true);
    (component as any)._isLocked = isLocked;
    component.lockUnlock();
    expect(component.isLockedValue).toEqual(false);
  });

  it('should dispose', () => {
    const spy: jasmine.Spy = spyOn(component.paneMap, 'clear');
    component.dispose();
    expect(component.paneMap).toBeNull();
    expect((component as any)._isLocked).toBeNull();
    expect((component as any)._selectedLayoutId).toBeNull();
    expect(component.frameConfig).toBeNull();
    expect(spy).toHaveBeenCalled();

  });

  // it("should update available layouts", () => {
  //     const frame: hldl.HfwFrame = HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[4];
  //     component.areModesDefined = false;
  //     component.frameConfig = frame;
  //     const availableLayouts: hldl.LayoutInstance[] = frame.layoutInstances.slice(0, 1);
  //     // const layouts = new BehaviorSubject(availableLayouts);
  //     // expect(component.availableLayoutsValue).toEqual(availableLayouts);
  // });

  it('should fill layout map', () => {
    const frame: hldl.HfwFrame = HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[5];
    component.frameConfig = frame;
    (component as any).fillLayoutMap();
    const map: any = component.paneIdsPerLayout.get('1-pane');
    expect(map).toEqual(['single-pane']);
  });

});
