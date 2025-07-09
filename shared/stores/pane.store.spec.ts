import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestScheduler } from 'rxjs/testing';

import { Pane, SnapInReference } from '../hldl/hldl-data.model';
import { PaneStore } from './pane.store';

describe('PaneStore', () => {
  let component: PaneStore;
  let fixture: ComponentFixture<PaneStore>;
  const snapInReferencesOne: SnapInReference[] = [
    new SnapInReference('fakeOne', undefined!, 'configOne', false), new SnapInReference('fakeTwo', undefined!, 'configTwo', false)
  ];
  const pane: Pane = new Pane(snapInReferencesOne, 'fake', undefined!, undefined!, true, undefined!,
    undefined!, 0, undefined!, undefined!, undefined!, undefined!, 'o2');

  let testScheduler: TestScheduler;
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      return expect(actual).toEqual(expected);
    });
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    component = new PaneStore(pane);
  });

  it('should open and close pane store', () => {
    component.open();
    const y = component.isVisible;
    const expectedMarbles = 'a';
    let expectedValues = {
      a: true
    };
    testScheduler.run(({ expectObservable }) => {
      expectObservable(y).toBe(
        expectedMarbles,
        expectedValues
      );
    });
    component.close();
    expectedValues = {
      a: false
    };
    testScheduler.run(({ expectObservable }) => {
      expectObservable(y).toBe(
        expectedMarbles,
        expectedValues
      );
    });
  });

  it('should make expected assignments on dispose', () => {
    component.dispose();
    expect((component as any)._isVisible).toBeNull();
    expect((component as any)._selectedSnapInId).toBeNull();
    expect(component.paneConfig).toBeNull();
  });

  it('should select snapin', () => {
    component.selectSnapIn('snapinId');
    const y = component.selectedSnapInId;
    const expectedMarbles = 'a';
    const expectedValues = {
      a: 'snapinId'
    };
    testScheduler.run(({ expectObservable }) => {
      expectObservable(y).toBe(
        expectedMarbles,
        expectedValues
      );
    });
  });

  it('should set displayable property', () => {
    component.setIsDisplayable(true);
    const y = component.isDisplayable;
    const expectedMarbles = 'a';
    const expectedValues = {
      a: true
    };
    testScheduler.run(({ expectObservable }) => {
      expectObservable(y).toBe(
        expectedMarbles,
        expectedValues
      );
    });
  });
});
