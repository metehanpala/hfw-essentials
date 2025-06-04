import { TraceService } from '@gms-flex/services-common';

import { TraceModules } from '../../shared/trace-modules';
import { DEBUG_LOG } from '../utils';

/**
 *
 */
export class RowHeightService {
  private readonly offsets: number[];

  constructor(private readonly total: number = 0, public rowHeight: number, public itemsPerRow: number, private readonly traceService: TraceService) {

    this.offsets = [];
    if (DEBUG_LOG) {
      this.traceService.debug(TraceModules.rowHeight, 'RowHeightService created!! itemsPerRow: %s', this.itemsPerRow);
    }
    let agg = 0;
    for (let idx = 0; idx < total; idx = idx + this.itemsPerRow) {
      this.offsets.push(agg);
      if (DEBUG_LOG) {
        this.traceService.debug(TraceModules.rowHeight, 'idx: %s - offset: %s', this.offsets.length - 1, agg);

      }
      agg += rowHeight;
    }
  }

  public index(position: number): number | undefined {
    if (position < 0) {
      return undefined;
    }

    const result: number = this.offsets.reduce((prev, current, idx) => {
      if (prev !== undefined) {
        return prev;
      } else if (current === position) {
        return idx;
      } else if (current > position) {
        return idx - 1;
      }
      return undefined!;
    }, undefined!)!;
    return result ?? (this.total - 1);
  }

  public offset(rowIndex: number): number {
    return this.offsets[rowIndex];
  }

  public totalHeight(): number {
    return this.rowHeight * this.offsets.length;
  }

  public totalRows(): number {
    return this.offsets.length;
  }
}
