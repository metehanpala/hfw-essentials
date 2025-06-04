import { TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable, Observer, Subscription } from 'rxjs';

import { TraceModules } from '../../shared/trace-modules';
import { DEBUG_LOG } from '../utils';
import { RowHeightService } from './row-height.service';
/**
 *
 */
export class ScrollAction {
  constructor(public offset: number) {
  }
}

/**
 *
 */
export class PageAction {
  constructor(public skip: number, public take: number) {
  }
}

/**
 *
 */
export type Action = ScrollAction | PageAction;

/**
 *
 */
export class ScrollerService {
  private firstLoaded = 0;
  private lastLoaded!: number;
  private lastScrollTop!: number;
  private take!: number;
  private total!: number;
  private rowHeightService!: RowHeightService;
  private scrollSubscription!: Subscription;
  private subscription!: Subscription;

  constructor(private readonly scrollObservable: Observable<any>) {
  }

  public create(rowHeightService: RowHeightService, skip: number, take: number, total: number,
    traceService: TraceService, firstItemScroll?: number): Observable<Action> {

    this.rowHeightService = rowHeightService;
    this.firstLoaded = skip;
    this.lastLoaded = skip + take;
    this.take = take;
    this.total = total;
    this.lastScrollTop = 0;

    if (DEBUG_LOG) {
      traceService.debug(TraceModules.scrollService, 'scoller create!\nfirstLoaded: %s\nlastLoaded: %s\ntake:%s\ntotal:%s\nskip:%s',
        this.firstLoaded, this.lastLoaded, this.take, this.total, skip);

    }

    const scrollIndex: number = firstItemScroll ?? skip;
    const scrollRealIndex = Math.floor(scrollIndex / this.rowHeightService.itemsPerRow);
    const scrollOffset = this.rowHeightService.offset(scrollRealIndex);
    if (DEBUG_LOG) {
      traceService.debug(TraceModules.scrollService, 'scroller create BehaviorSubject\nscrollIndex: %s\nscrollRealIndex: %s\nscrollOffset:',
        scrollIndex, scrollRealIndex, scrollOffset);
    }
    const subject: BehaviorSubject<Action> = new BehaviorSubject<Action>(new ScrollAction(scrollOffset));

    this.subscription = new Observable((observer: Observer<Action>) => {
      this.unsubscribe();
      this.scrollSubscription = this.scrollObservable.subscribe(x => this.onScroll(x, observer, traceService));

    }).subscribe(x => subject.next(x));

    return subject;
  }

  public destroy(): void {
    this.unsubscribe();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public getFirstItemIndex(scrollTop: number): number {
    return this.rowHeightService.index(scrollTop)!
               * this.rowHeightService.itemsPerRow;
  }

  public isBufferGrant(firstItem: number, numberOfColumn: number): boolean {
    const firstItemRow: number = Math.floor(firstItem / numberOfColumn);
    const firstLoadedRow: number = Math.floor(this.firstLoaded / numberOfColumn);

    if (firstLoadedRow > firstItemRow) {
      return false;
    }
    if (firstLoadedRow === firstItemRow &&
          (this.firstLoaded % numberOfColumn) !== 0) {
      return false;
    }

    return true;
  }

  protected onScroll({ scrollTop, offsetHeight, scrollHeight, clientHeight }: any,
    observer: Observer<Action>, traceService: TraceService): void {
    if (this.lastScrollTop === scrollTop) {
      return;
    }

    const up = this.lastScrollTop >= scrollTop;
    this.lastScrollTop = scrollTop;
    let firstItemIndex = this.rowHeightService.index(scrollTop)!
      * this.rowHeightService.itemsPerRow;

    let firstItemRealOffset;
    if (firstItemIndex) {
      firstItemRealOffset = firstItemIndex / this.rowHeightService.itemsPerRow;
    }
    let firstItemOffset: number;

    if (firstItemRealOffset) {
      firstItemOffset = this.rowHeightService.offset(firstItemRealOffset);
    }

    let lastItemIndex: number;
    if ((this.rowHeightService?.index(scrollTop + offsetHeight)) != undefined) {
      lastItemIndex = this.setLastItemIndex(scrollTop, offsetHeight);
    }

    if (DEBUG_LOG) {
      traceService.debug(TraceModules.scrollService, 'ScrollerService. onScroll\nscrollTop: %s\noffsetHeight: %s\nfirstItem: %s\n' +
      ' firstItemOffset:%s\nlastItem:%s\nscrollHeight: %s\nclientHeight: %s\n' +
      'firstLoaded: %s\nlastLoaded: %s\n',
      scrollTop, offsetHeight, firstItemIndex, firstItemOffset!, lastItemIndex!,
      scrollHeight, clientHeight, this.firstLoaded, this.lastLoaded);
    }
    const overflow = (firstItemIndex + this.take) - this.total;
    if (!up && lastItemIndex! >= this.lastLoaded && this.lastLoaded < this.total && DEBUG_LOG) {
      traceService.debug(TraceModules.scrollService, 'lastLoaded: %s\n overflow: %s',
        this.lastLoaded, overflow);
    }
    if (!up && lastItemIndex! >= this.lastLoaded && this.lastLoaded < this.total && overflow > 0) {
      firstItemIndex = firstItemIndex - overflow;
      if (DEBUG_LOG) {
        const prevFirstItemIndex = JSON.parse(JSON.stringify(firstItemIndex)); // only for log
        traceService.debug(TraceModules.scrollService, 'new firstItemIndex:%s (%s - %s)',
          firstItemIndex, prevFirstItemIndex, overflow);
      }
      firstItemRealOffset = Math.floor(firstItemIndex / this.rowHeightService.itemsPerRow);
      if (DEBUG_LOG) {
        traceService.debug(TraceModules.scrollService, 'firstItemRealOffset:%s', firstItemRealOffset);
      }
      firstItemOffset = this.rowHeightService.offset(firstItemRealOffset);
    }
    if (!up && lastItemIndex! >= this.lastLoaded && this.lastLoaded < this.total && DEBUG_LOG) {
      traceService.debug(TraceModules.scrollService, 'firing firstItemOffset:%s', firstItemOffset!);
    }
    this.firstLoaded = firstItemIndex;
    observer.next(new ScrollAction(firstItemOffset!));
    const nextTake = this.firstLoaded + this.take > this.total ? this.total - this.firstLoaded : this.take;
    this.lastLoaded = Math.min(nextTake, this.total);
    if (!up && lastItemIndex! >= this.lastLoaded && this.lastLoaded < this.total && DEBUG_LOG) {
      traceService.debug(TraceModules.scrollService, 'nextTake:%s\nlastLoaded: %s', nextTake, this.lastLoaded);
    }
    observer.next(new PageAction(this.firstLoaded, this.take));

    if (firstItemIndex && up && firstItemIndex < this.firstLoaded) {
      let nonVisibleBuffer = Math.floor(this.take * 0.3);
      if (DEBUG_LOG) {
        traceService.debug(TraceModules.scrollService, 'up!:\n nonVisibleBuffer:%s\nfirstLoaded:%s', nonVisibleBuffer, this.firstLoaded);

      }
      // adjust nonVisibleBuffer to be divisible per number of columns
      const remainder = nonVisibleBuffer % this.rowHeightService.itemsPerRow;
      nonVisibleBuffer = nonVisibleBuffer + (this.rowHeightService.itemsPerRow - remainder);
      if (DEBUG_LOG) {
        traceService.debug(TraceModules.scrollService, 'adjusted nonVisibleBuffer:%s', nonVisibleBuffer);

      }

      this.firstLoaded = Math.max(firstItemIndex - nonVisibleBuffer, 0);

      const firstLoadedRealOffset = this.firstLoaded / this.rowHeightService.itemsPerRow;
      const firstLoadedOffset = this.rowHeightService.offset(firstLoadedRealOffset);

      this.traceDebugScrollAction(traceService, firstLoadedRealOffset, firstLoadedOffset);
      this.setLastLoadedAndFireScrollAction(firstLoadedOffset, observer, traceService);
    }
  }

  private traceDebugScrollAction(traceService: TraceService, firstLoadedRealOffset: number, firstLoadedOffset: number): void {
    if (DEBUG_LOG) {
      traceService.debug(TraceModules.scrollService, 'new firstLoaded:%s\nfirstLoadedRealOffset:%s\nfirstLoadedOffset:%s',
        this.firstLoaded, firstLoadedRealOffset, firstLoadedOffset);
      traceService.debug(TraceModules.scrollService, 'firing new ScrollAction(%s).', firstLoadedOffset);
    }
  }

  private setLastLoadedAndFireScrollAction(firstLoadedOffset: number, observer: Observer<Action>, traceService: TraceService): void {
    observer.next(new ScrollAction(firstLoadedOffset));
    this.lastLoaded = Math.min(this.firstLoaded + this.take, this.total);
    if (DEBUG_LOG) {
      traceService.debug(TraceModules.scrollService, 'firing new Page action().');
    }
    observer.next(new PageAction(this.firstLoaded, this.take));
  }

  private setLastItemIndex(scrollTop: any, offsetHeight: any): number {
    return (this.rowHeightService.index(scrollTop + offsetHeight)!
    * this.rowHeightService.itemsPerRow) +
    (this.rowHeightService.itemsPerRow - 1);
  }

  private unsubscribe(): void {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
      this.scrollSubscription = undefined!;
    }
  }
}
