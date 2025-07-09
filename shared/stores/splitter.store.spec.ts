import { SplitterChanges } from 'projects/controls/src/controls/splitter/splitter-changes.model';
import { BehaviorSubject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import * as hldl from '../hldl/hldl-data.model';
import { HLDL_TEST_EXAMPLE } from '../hldl/hldl-example-data.model';
import { SplitterStore } from './splitter.store';

describe('SplitterStore', () => {
  let component: SplitterStore;
  const frameConfig: hldl.HfwFrame = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[5]));
  const splitter: hldl.Splitter = frameConfig.layoutInstances[1].splitter!;
  const splitterConfig: hldl.Splitter = new hldl.Splitter(
    splitter.firstChild, splitter.secondChild, splitter.orientation,
    splitter.collapsingPane, splitter.firstChildSize, splitter.secondChildSize, splitter.id
  );
  const settings: SplitterChanges = {
    newPaneSize: '200px',
    isSplitterCollapseChanged: false
  };

  let testScheduler: TestScheduler;
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      return expect(actual).toEqual(expected);
    });
  });

  beforeEach(() => {
    component = new SplitterStore(splitterConfig);
  });

  it('should get correct id', () => {
    expect(component.id).toEqual('selection-pane-splitter');
  });

  it('should set and get splitter changes', () => {
    const lastSplitterChanges = new BehaviorSubject<SplitterChanges>(settings);
    component.setSplitterChanges(settings);
    const y = component.getSplitterChanges();
    const expectedMarbles = 'a';
    const expectedValues = {
      a: settings
    };
    testScheduler.run(({ expectObservable }) => {
      expectObservable(y).toBe(
        expectedMarbles,
        expectedValues
      );
    });
    expect(component.getSplitterChangesValue().newPaneSize).toEqual('200px');
  });

  it('should reset splitter changes', () => {
    component.setSplitterChanges(settings);
    component.resetConfig();
    const defaultSettings = component.getSplitterChangesValue();
    expect(defaultSettings.newPaneSize).toEqual('340px');
  });

});
