import { SplitterChanges } from '@gms-flex/controls';
import { BehaviorSubject, Observable } from 'rxjs';

import { Splitter } from '../hldl/hldl-data.model';

export class SplitterStore {

  private readonly lastSplitterChanges: BehaviorSubject<SplitterChanges> = new BehaviorSubject<SplitterChanges>(null!);

  public static clone(source: SplitterStore): SplitterStore {
    const split = new SplitterStore(source.splitterConfig);
    split.setSplitterChanges(source.getSplitterChangesValue());
    return split;
  }

  public get id(): string {
    return this.splitterConfig.id;
  }

  public constructor(public splitterConfig: Splitter) {
  }

  public setSplitterChanges(change: SplitterChanges): void {
    this.lastSplitterChanges.next(change);
  }

  public getSplitterChanges(): Observable<SplitterChanges> {
    return this.lastSplitterChanges.asObservable();
  }

  public getSplitterChangesValue(): SplitterChanges {
    return this.lastSplitterChanges.value;
  }

  public resetConfig(): void {
    let newPaneSize: string;
    if (this.splitterConfig.firstChildSize) {
      newPaneSize = this.splitterConfig.firstChildSize;
    } else {
      newPaneSize = this.splitterConfig.secondChildSize;
    }
    const defaultSettings: SplitterChanges = {
      newPaneSize,
      isSplitterCollapseChanged: true,
      isCollapsed: false
    };
    this.setSplitterChanges(defaultSettings);
  }

}
