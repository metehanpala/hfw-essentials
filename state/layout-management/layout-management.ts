import { TraceService } from '@gms-flex/services-common';

import { LayoutInstance } from '../../shared/hldl/hldl-data.model';
import { FrameStore } from '../../shared/stores/frame.store';
import { TraceModules } from '../../shared/trace/trace-modules';
import { FavoriteLayoutsPerRange } from '../user-settings.handler';

/**
 * Helper class to manage frame's layouts
 *
 * @export
 * @class LayoutManagement
 */
export class LayoutManagement {

  public static getMostFittingLayoutId(layouts: LayoutInstance[]): string {
    const orderedLayouts: LayoutInstance[] = LayoutManagement.sortLayoutsPerMediaQuery(layouts);
    let fittingIndex: number = orderedLayouts.length - 1;
    if (fittingIndex > 0 && orderedLayouts[fittingIndex].minWidthFromMediaQuery != null) {
      for (let i: number = orderedLayouts.length - 1; i > 0; i--) {
        if (!orderedLayouts[i].isDefault) {
          fittingIndex--;
        } else {
          break;
        }
      }
    }
    return orderedLayouts[fittingIndex].id;
  }

  public static checkFrameNeedsNewLayout(frame: FrameStore, trace: TraceService): { isNumberOfLayoutChanged: boolean; newLayoutId: string | null } {
    const previousAvailableCount: number = frame.availableLayoutsValue.length;
    frame.updateAvailableLayouts();

    let numberOfLayoutChanged: boolean = previousAvailableCount !== frame.availableLayoutsValue.length;
    let candidateLayoutId: string | null = null;
    if (frame.availableLayoutsValue.length <= 0) {
      trace.warn(TraceModules.state, 'Configuration lack. No layout configured for the current window size.');
      numberOfLayoutChanged = false;
    }

    // skip if the number of layout doesn't change.
    if (numberOfLayoutChanged) {
      if (previousAvailableCount < frame.availableLayoutsValue.length) { // onGrowth
        const previousLayout: LayoutInstance | undefined = frame.frameConfig.layoutInstances.find(l => l.id === frame.selectedLayoutIdValue);
        if (previousLayout?.onGrowth != null) {
          const candidate: LayoutInstance | null | undefined = (frame.availableLayoutsValue.find(l => l.id === previousLayout.onGrowth)) != undefined ?
            frame.availableLayoutsValue.find(l => l.id === previousLayout.onGrowth) : null;
          if (candidate != null && candidate !== undefined) {
            candidateLayoutId = candidate.id;
          }
        }
      } else { // onShrink
        const isPreviousAvailable: boolean = frame.availableLayoutsValue.find(l => l.id === frame.selectedLayoutIdValue) != null;
        if (!isPreviousAvailable && frame) {
          const previousLayout: LayoutInstance = frame.frameConfig.layoutInstances.find(l => l.id === frame.selectedLayoutIdValue)!;
          candidateLayoutId = LayoutManagement.findNextAvailableLayoutIdOnShrink(previousLayout, frame);
        }
      }
    }
    return { isNumberOfLayoutChanged: numberOfLayoutChanged, newLayoutId: candidateLayoutId };
  }

  public static checkFrameNeedsNewLayoutAfterViewChange(frame: FrameStore, viewId: string): { isNumberOfLayoutChanged: boolean; newLayoutId: string | null } {
    const previousAvailableCount: number = frame.availableLayoutsValue.length;
    const changedAvailableLayouts = frame.getAvailableLayoutsOnView(viewId);

    const numberOfLayoutChanged: boolean = previousAvailableCount !== changedAvailableLayouts.length;
    let candidateLayoutId: string | null = null;

    const isPreviousAvailable: boolean = changedAvailableLayouts.find(l => l.id === frame.selectedLayoutIdValue) != null;

    // skip if the number of layout doesn't change.
    if (!isPreviousAvailable) {
      candidateLayoutId = LayoutManagement.getMostFittingLayoutId(changedAvailableLayouts);
    }
    return { isNumberOfLayoutChanged: numberOfLayoutChanged, newLayoutId: candidateLayoutId };
  }

  public static findNextAvailableLayoutIdOnShrink(startingLayout: LayoutInstance, frame: FrameStore): string {
    if (startingLayout.onShrink != null) {
      const candidate: LayoutInstance | undefined = frame.availableLayoutsValue.find(l => l.id === startingLayout.onShrink);
      if (candidate != null && candidate != undefined) {
        return candidate.id as string;
      } else {
        const candidateLayout: LayoutInstance = frame.frameConfig.layoutInstances.find(l => l.id === startingLayout.onShrink)!;
        return this.findNextAvailableLayoutIdOnShrink(candidateLayout, frame);
      }
    } else {
      return (frame.availableLayoutsValue[frame.availableLayoutsValue.length - 1].id);
    }
  }

  public static calculateNextFavoriteLayoutPerRange(frameStore: FrameStore, layoutId: string): FavoriteLayoutsPerRange {
    const fitsAllScreens: boolean | undefined = frameStore.layoutFittingMap.get(layoutId);
    const favoriteLayoutsPerRange = frameStore.getFavoriteLayoutsPerRange();
    if (favoriteLayoutsPerRange) {
      if (fitsAllScreens) {
        favoriteLayoutsPerRange.smallLayoutId = layoutId;
        favoriteLayoutsPerRange.largeLayoutId = layoutId;
      } else {
        favoriteLayoutsPerRange.largeLayoutId = layoutId;
      }
    }
    return frameStore.favoriteLayoutsPerRange;
  }

  public static sortLayoutsPerMediaQuery(layouts: LayoutInstance[]): LayoutInstance[] {
    return layouts.concat().sort(this.compareLayoutPerMediaQuery);
  }

  // inverse sorting to have a desc order.
  private static compareLayoutPerMediaQuery(a: LayoutInstance, b: LayoutInstance): number {
    if (a.minWidthFromMediaQuery == null && b.minWidthFromMediaQuery == null) {
      return 0;
    }
    if (a.minWidthFromMediaQuery == null) {
      return -1;
    }
    if (b.minWidthFromMediaQuery == null) {
      return 1;
    }
    if (a.minWidthFromMediaQuery < b.minWidthFromMediaQuery) {
      return -1;
    }
    if (a.minWidthFromMediaQuery > b.minWidthFromMediaQuery) {
      return 1;
    }
    return (0);
  }
}
