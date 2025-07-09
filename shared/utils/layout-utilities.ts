import { SplitterChanges } from '@gms-flex/controls';
import { isNullOrUndefined } from '@gms-flex/services-common';

import { HfwFrame } from '../hldl/hldl-data.model';
import { SplitterStore } from '../stores/splitter.store';

export enum ScreenSize {
  Small,
  Large,
  Mobile
}

export const VERTICAL_BAR_SIZE = 240;
export const RIGHT_PANEL_SIZE = 290;
export const PAGE_PADDING = 64;
export const SMALL_SCREEN_MAX_WIDTH = 1360;
export const MOBILE_SCREEN_MAX_WIDTH = 576;

export class LayoutUtilities {

  public static checkSplitterChanges(splitStore: SplitterStore, changes: SplitterChanges): boolean {
    if (!changes.isSplitterCollapseChanged && changes.newPaneSize && changes.newPaneSize.endsWith('px')) {
      if (splitStore.splitterConfig.orientation === 'vertical') {
        const splitterSize: number = +changes.newPaneSize.substring(0, changes.newPaneSize.lastIndexOf('px'));
        return (splitterSize < (window.innerWidth - PAGE_PADDING));
      }
    }
    return true;
  }

  public static getBreakpoints(frame: HfwFrame): number[] {
    if (isNullOrUndefined(frame.layoutInstances)) {
      return [];
    }
    const breakpoints: number[] = [];
    frame.layoutInstances.forEach(ins => {
      if (ins.mediaQuery) {
        if (ins?.minWidthFromMediaQuery && !breakpoints.includes(ins.minWidthFromMediaQuery)) {
          breakpoints.push(ins.minWidthFromMediaQuery);
        }
      }
    });
    return breakpoints.sort((a, b) => a - b);
  }

  /**
   * Gets the current screen size based on window width.
   * @returns The ScreenSize enum value indicating the current screen size.
   * Small = 0,
   * Large = 1,
   * Mobile = 2
   */
  public static getScreenSize(): ScreenSize {
    // Get the window width
    const windowSize: number = window.innerWidth;

    // Determine if the window width qualifies as small or mobile
    const isSmall: boolean = windowSize < SMALL_SCREEN_MAX_WIDTH;
    const isMobile: boolean = windowSize < MOBILE_SCREEN_MAX_WIDTH;

    // Return the appropriate ScreenSize enum value based on window width
    return isSmall ? (isMobile ? ScreenSize.Mobile : ScreenSize.Small) : ScreenSize.Large;
  }

  public static layoutMapCreator(frame: HfwFrame): Map<string, boolean> {
    const resultMap = new Map<string, boolean>();
    frame.layoutInstances?.forEach(ins => {
      const fitsAllScreens = isNullOrUndefined(ins.mediaQuery);
      resultMap.set(ins.id, fitsAllScreens);
    });

    return resultMap;
  }
}
