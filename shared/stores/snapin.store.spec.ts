import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { MessageType } from '../hldl/hldl-data.model';
import { SnapInStore } from './snapin.store';

const msg = 'any message';

describe('SnapinStore', () => {
  let component: SnapInStore;
  const messageTypes: MessageType[] = [
    new MessageType('messageType1'),
    new MessageType('messageType2')
  ];
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
    component = new SnapInStore(messageTypes, 'tabTitleResourceId');
  });

  it('should send message', () => {
    const message: BehaviorSubject<any> = new BehaviorSubject(msg);
    (component as any)._message = message;
    component.sendMessage(msg);
    expect(component.message).toEqual(message.asObservable());
  });

  it('should clear message', () => {
    component.sendMessage('my_message');
    component.clearMessage();
    const y = component.message;
    const expectedMarbles = 'a';
    const expectedValues = {
      a: null
    };
    testScheduler.run(({ expectObservable }) => {
      expectObservable(y).toBe(
        expectedMarbles,
        expectedValues
      );
    });
  });

});
