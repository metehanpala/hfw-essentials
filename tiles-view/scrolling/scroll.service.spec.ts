import { BehaviorSubject } from 'rxjs';

import { RowHeightService } from './row-height.service';
import { ScrollerService } from './scroller.service';

// //////  Tests  /////////////
describe('ScrollerService', () => {
  const scrollObserve: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  const scrollerService = new ScrollerService(scrollObserve.asObservable());
  const traceServiceStub: any = {
    debug: (source: string, message?: string, ...optionalParams: any[]) => { },
    info: (source: string, message?: string, ...optionalParams: any[]) => { }
  };

  const rowHeightService = new RowHeightService(100, 5, 10, traceServiceStub);

  it('ScrollerService should be created', () => {
    expect(scrollerService).not.toBeNull();
  });

  it('ScrollerService create method', () => {
    scrollerService.create(rowHeightService, 5, 10, 100, traceServiceStub, 1).subscribe((x: any) => {
      expect(x).not.toBeNull();
    });
  });

  it('ScrollerService getFirstItemIndex method', () => {
    scrollerService.create(rowHeightService, 5, 10, 100, traceServiceStub, 1);
    expect(scrollerService.getFirstItemIndex(1)).toBe(0);
  });

  it('ScrollerService isBufferGrant method', () => {
    scrollerService.create(rowHeightService, 5, 10, 100, traceServiceStub, 1);
    expect(scrollerService.isBufferGrant(1, 2)).toBeFalse();
  });
});
