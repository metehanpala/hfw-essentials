import { Type } from '@angular/core';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';

import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { ReuseStrategyLayoutChange } from './reuse-strategy-layout-change';

// //////  Tests  /////////////
describe('ReuseStrategyLayoutChange', () => {

  const currentFrameId = 'frame-1';
  const currentSnapinsPerPane: Map<string, { snapinId: string; handled: boolean }> = new Map<string, { snapinId: string; handled: boolean }>();
  const futureSnapinsPerPane: Map<string, { snapinId: string; handled: boolean }> = new Map<string, { snapinId: string; handled: boolean }>();
  const futurePanesPerSnapin: Map<string, { paneId: string; occupied: boolean }[]> = new Map<string, { paneId: string; occupied: boolean }[]>();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: []
    })
      .compileComponents();

    currentSnapinsPerPane.clear();
    futureSnapinsPerPane.clear();
    futurePanesPerSnapin.clear();
  }));

  const convertFutureSnapinsPerPane = (): void => {
    futureSnapinsPerPane.forEach((snapin, pane) => {
      if (futurePanesPerSnapin.has(snapin.snapinId) === false) {
        futurePanesPerSnapin.set(snapin.snapinId, [{ paneId: pane, occupied: false }]);
      } else {
        futurePanesPerSnapin.get(snapin.snapinId)!.push({ paneId: pane, occupied: false });
      }
    });
  };

  const init5Pane = (): void => {
    currentSnapinsPerPane.set('selection', { snapinId: 'snapin1', handled: false });
    currentSnapinsPerPane.set('primary', { snapinId: 'snapin2', handled: false });
    currentSnapinsPerPane.set('context', { snapinId: 'snapin3', handled: false });
    currentSnapinsPerPane.set('related', { snapinId: 'snapin4', handled: false });
    currentSnapinsPerPane.set('comparison', { snapinId: 'snapin5', handled: false });
  };

  const init3Pane = (): void => {
    currentSnapinsPerPane.set('selection', { snapinId: 'snapin1', handled: false });
    currentSnapinsPerPane.set('primary', { snapinId: 'snapin2', handled: false });
    currentSnapinsPerPane.set('context', { snapinId: 'snapin3', handled: false });
  };

  const init5PaneSameSnapins = (): void => {
    currentSnapinsPerPane.set('selection', { snapinId: 'snapin1', handled: false });
    currentSnapinsPerPane.set('primary', { snapinId: 'snapin2', handled: false });
    currentSnapinsPerPane.set('context', { snapinId: 'snapin3', handled: false });
    currentSnapinsPerPane.set('related', { snapinId: 'snapin4', handled: false });
    currentSnapinsPerPane.set('comparison', { snapinId: 'snapin2', handled: false });
  };

  it('ReuseStrategyLayoutChange: Switch from 5 to 4 pane',
    () => {

      init5Pane();
      futureSnapinsPerPane.set('selection', { snapinId: 'snapin1', handled: false });
      futureSnapinsPerPane.set('primary', { snapinId: 'snapin2', handled: false });
      futureSnapinsPerPane.set('context', { snapinId: 'snapin3', handled: false });
      futureSnapinsPerPane.set('related', { snapinId: 'snapin4', handled: false });
      convertFutureSnapinsPerPane();
      const snapinsToReuse: FullSnapInId[] =
    ReuseStrategyLayoutChange.evaluateSnapinsToReuse(currentFrameId, currentSnapinsPerPane, futurePanesPerSnapin);

      expect(snapinsToReuse.length).toBe(4);

      let found: FullSnapInId = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin1');
      })!;
      expect(found.snapInId).toEqual('snapin1');
      expect(found.frameId).toEqual('frame-1');

      found = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin2');
      })!;
      expect(found.snapInId).toEqual('snapin2');
      expect(found.frameId).toEqual('frame-1');

      found = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin3');
      })!;
      expect(found.snapInId).toEqual('snapin3');
      expect(found.frameId).toEqual('frame-1');

      found = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin4');
      })!;
      expect(found.snapInId).toEqual('snapin4');
      expect(found.frameId).toEqual('frame-1');
    });

  it('ReuseStrategyLayoutChange: Switch from 5 to 3 panes and different pane names',
    () => {

      init5Pane();
      futureSnapinsPerPane.set('selection', { snapinId: 'snapin1', handled: false });
      futureSnapinsPerPane.set('primary-2', { snapinId: 'snapin2', handled: false });
      futureSnapinsPerPane.set('context-2', { snapinId: 'snapin3', handled: false });
      convertFutureSnapinsPerPane();
      const snapinsToReuse: FullSnapInId[] =
    ReuseStrategyLayoutChange.evaluateSnapinsToReuse(currentFrameId, currentSnapinsPerPane, futurePanesPerSnapin);

      expect(snapinsToReuse.length).toBe(3);

      let found: FullSnapInId = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin1');
      })!;
      expect(found.snapInId).toEqual('snapin1');

      found = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin2');
      })!;
      expect(found.snapInId).toEqual('snapin2');

      found = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin3');
      })!;
      expect(found.snapInId).toEqual('snapin3');
    });

  it('ReuseStrategyLayoutChange: Switch from 3 to 5 pane with different pane names',
    () => {

      init3Pane();
      futureSnapinsPerPane.set('selection', { snapinId: 'snapin1', handled: false });
      futureSnapinsPerPane.set('primary-2', { snapinId: 'snapin2', handled: false });
      futureSnapinsPerPane.set('context-2', { snapinId: 'snapin3', handled: false });
      futureSnapinsPerPane.set('related', { snapinId: 'snapin4', handled: false });
      futureSnapinsPerPane.set('comparison', { snapinId: 'snapin5', handled: false });
      convertFutureSnapinsPerPane();
      const snapinsToReuse: FullSnapInId[] =
    ReuseStrategyLayoutChange.evaluateSnapinsToReuse(currentFrameId, currentSnapinsPerPane, futurePanesPerSnapin);

      expect(snapinsToReuse.length).toBe(3);

      let found: FullSnapInId = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin1');
      })!;
      expect(found.snapInId).toEqual('snapin1');

      found = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin2');
      })!;
      expect(found.snapInId).toEqual('snapin2');

      found = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin3');
      })!;
      expect(found.snapInId).toEqual('snapin3');
    });

  it('ReuseStrategyLayoutChange: Switch from 5 pane with same snapins to 3 panes with different names',
    () => {

      init5PaneSameSnapins();
      futureSnapinsPerPane.set('primary-2', { snapinId: 'snapin2', handled: false });
      futureSnapinsPerPane.set('context-2', { snapinId: 'snapin3', handled: false });
      futureSnapinsPerPane.set('comparison', { snapinId: 'snapin2', handled: false });
      convertFutureSnapinsPerPane();
      const snapinsToReuse: FullSnapInId[] =
    ReuseStrategyLayoutChange.evaluateSnapinsToReuse(currentFrameId, currentSnapinsPerPane, futurePanesPerSnapin);

      expect(snapinsToReuse.length).toBe(3);

      let found: FullSnapInId = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin2');
      })!;
      expect(found.snapInId).toEqual('snapin2');

      found = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin2');
      })!;
      expect(found.snapInId).toEqual('snapin2');

      found = snapinsToReuse.find(item => {
        return (item.snapInId === 'snapin3');
      })!;
      expect(found.snapInId).toEqual('snapin3');
    });
});
