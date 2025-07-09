import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { concat, Observable, Observer } from 'rxjs';
import { concatMap, map, switchMap, tap } from 'rxjs/operators';

import { SettingsService } from '../settings/settings.service';
import * as hldl from '../shared/hldl/hldl-data.model';
import { TraceModules } from '../shared/trace/trace-modules';
import { LayoutUtilities, ScreenSize } from '../shared/utils/layout-utilities';

export interface FavoriteLayoutsPerRange {
  smallLayoutId?: string;
  largeLayoutId?: string;
}

export interface UserFramePreferences {
  splitterConfiguration: Map<string, any>;
  layoutConfiguration: Map<string, FavoriteLayoutsPerRange>;
  fullScreenStates: Map<string, any>;
  selectedViews?: Map<string, string>;
}

/**
 * Handles the storing and retrieving user settings.
 *
 * @export
 * @class UserSettingsHandler
 */
export class UserSettingsHandler {

  public result!: UserFramePreferences;

  public constructor(
    private readonly settings: SettingsService,
    private readonly trace: TraceService) {
  }

  /**
   * Returns an observable. Subscribing to it invokes the reading of stored user settings.
   *
   * @returns {Observable<Map<string, any>>}
   *
   * @memberOf UserSettingsHandler
   */
  public retrieveUserSettings(hfwInstance: hldl.HfwInstance,
    layoutsPerFrameView: Map<string, string> | undefined,
    saveSelectedLayout: boolean | undefined): Observable<UserFramePreferences> {
    return this.retrieveSplittersPositions(hfwInstance).pipe(
      tap(res => this.result = {
        splitterConfiguration: res,
        layoutConfiguration: null!,
        fullScreenStates: null!
      }),
      concatMap(() => this.retrieveLayoutSettings(hfwInstance, layoutsPerFrameView, saveSelectedLayout)),
      map(data => {
        this.result.layoutConfiguration = data;
        return this.result;
      }),
      concatMap(() => this.retrieveFullScreenSettings(hfwInstance)),
      map(data => {
        this.result.fullScreenStates = data;
        return this.result;
      }),
      concatMap(() => this.retrieveSelectedViewSettings(hfwInstance)),
      map(data => {
        if (data) {
          this.result.selectedViews = data;
        }
        return this.result;
      })
    );
  }

  private retrieveFullScreenSettings(hfwInstance: hldl.HfwInstance): Observable<Map<string, any>> {
    return new Observable((observer: Observer<Map<string, any>>) => {
      this.onRetrieveFullScreenSubscription(observer, hfwInstance);
    });
  }

  private retrieveSplittersPositions(hfwInstance: hldl.HfwInstance): Observable<Map<string, any>> {
    return new Observable((observer: Observer<Map<string, any>>) => {
      this.onRetrieveSplittersSubscription(observer, hfwInstance);
    });
  }

  private retrieveSelectedViewSettings(hfwInstance: hldl.HfwInstance): Observable<Map<string, string>> {
    return new Observable((observer: Observer<Map<string, string>>) => {
      this.onRetrieveViewsSubscription(observer, hfwInstance);
    });
  }

  private retrieveLayoutSettings(hfwInstance: hldl.HfwInstance,
    layoutsPerFrameView: Map<string, string> | undefined, saveSelectedLayout: boolean | undefined): Observable<Map<string, FavoriteLayoutsPerRange>> {
    return new Observable((observer: Observer<Map<string, FavoriteLayoutsPerRange>>) => {
      this.onRetrieveLayoutsSubscription(observer, hfwInstance, layoutsPerFrameView, saveSelectedLayout);
    });
  }

  private onRetrieveSplittersSubscription(observer: Observer<Map<string, any>>, hfwInstance: hldl.HfwInstance): void {
    this.trace.info(TraceModules.settings, 'Getting splitter settings for frames...');
    const frames: hldl.HfwFrame[] = hfwInstance.hfwFrames.filter(frame => frame.layoutInstances.some(layoutIns => !isNullOrUndefined(layoutIns.splitter)));
    const obs: Observable<{ frameId: string; splittersObj: any }>[] = [];

    let currentEvaluatedSettings = 0;
    const resultMap: Map<string, any> = new Map<string, any>();

    frames.forEach(frame => {
      obs.push(this.settings.getSplitterSettings(frame.id).pipe(
        map(settings => {
          let splitters: any;
          if (!isNullOrUndefined(settings)) {
            const settingsUpdated: any = settings!.replace(/'/g, '"');
            splitters = JSON.parse(settingsUpdated);
          } else {
            splitters = null;
          }
          return {
            frameId: frame.id,
            splittersObj: splitters
          };
        })
      ));
    });

    concat(...obs).subscribe((res: { frameId: string; splittersObj: any }) => {
      this.trace.info(TraceModules.settings, 'Splitter settings retrieved...');
      this.onSplitterSettingsCheckResult(res, observer, currentEvaluatedSettings, frames.length, resultMap);
      currentEvaluatedSettings++;
    });
  }

  private onRetrieveFullScreenSubscription(observer: Observer<Map<string, any>>, hfwInstance: hldl.HfwInstance): void {
    this.trace.info(TraceModules.settings, 'Getting full screen state for frames...');
    const frames: hldl.HfwFrame[] = hfwInstance.hfwFrames.filter(frame => frame.panes.some(pane => !isNullOrUndefined(pane.hasFullScreen)));
    const obs: Observable<{ frameId: string; fullScreenObj: any }>[] = [];

    let currentEvaluatedSettings = 0;
    const resultMap: Map<string, any> = new Map<string, any>();

    frames.forEach(frame => {
      obs.push(this.settings.getFullScreenSettings(frame.id).pipe(
        map(settings => {
          let states: any;
          if (!isNullOrUndefined(settings)) {
            const settingsUpdated: any = settings!.replace(/'/g, '"');
            states = JSON.parse(settingsUpdated);
          } else {
            states = null;
          }
          return {
            frameId: frame.id,
            fullScreenObj: states
          };
        })
      ));
    });

    concat(...obs).subscribe((res: { frameId: string; fullScreenObj: any }) => {
      this.trace.info(TraceModules.settings, 'Full Screen settings retrieved...');
      this.onFullScreenSettingsCheckResult(res, observer, currentEvaluatedSettings, frames.length, resultMap);
      currentEvaluatedSettings++;
    });
  }

  private onRetrieveViewsSubscription(observer: Observer<Map<string, string>>, hfwInstance: hldl.HfwInstance): void {
    this.trace.info(TraceModules.settings, 'Getting selected view for frames...');
    const frames: hldl.HfwFrame[] = hfwInstance.hfwFrames.filter(frame => !isNullOrUndefined(frame.views));
    const obs: Observable<{ frameId: string; selectedView: string }>[] = [];

    let currentEvaluatedSettings = 0;
    const resultMap: Map<string, string> = new Map<string, string>();

    frames.forEach(frame => {
      obs.push(this.settings.getSelectedViewSettings(frame.id).pipe(
        map(settings => {
          let states: any;
          if (!isNullOrUndefined(settings)) {
            states = settings;
          } else {
            states = null;
          }
          return {
            frameId: frame.id,
            selectedView: states
          };
        })
      ));
    });

    concat(...obs).subscribe((res: { frameId: string; selectedView: string }) => {
      this.trace.info(TraceModules.settings, 'Selected view settings retrieved...');
      this.onViewSettingsCheckResult(res, observer, currentEvaluatedSettings, frames.length, resultMap);
      currentEvaluatedSettings++;
    });
  }

  private onRetrieveLayoutsSubscription(observer: Observer<Map<string, FavoriteLayoutsPerRange>>, hfwInstance: hldl.HfwInstance,
    layoutsPerFrameView: Map<string, string> | undefined, saveSelectedLayout: boolean | undefined): void {
    this.trace.info(TraceModules.settings, 'Getting layout settings for frames...');
    const frames: hldl.HfwFrame[] = hfwInstance.hfwFrames.filter(frame => frame.layoutInstances.some(layoutIns => !isNullOrUndefined(layoutIns.splitter)));
    const obs: Observable<{ frameId: string; viewId: string | null; layout: FavoriteLayoutsPerRange }>[] = [];

    let currentEvaluatedSettings = 0;
    const resultMap: Map<string, FavoriteLayoutsPerRange> = new Map<string, FavoriteLayoutsPerRange>();

    frames.forEach(frame => {
      obs.push(
        this.settings.getSelectedViewSettings(frame.id).pipe(
          switchMap(viewId => {
            return this.settings.getUserSettingLayoutId(frame.id, viewId).pipe(
              map(settings => {
                return { viewId, settings };
              })
            );
          }),
          map(({ viewId, settings }) => {
            let layout: FavoriteLayoutsPerRange = {};
            if (layoutsPerFrameView != undefined && saveSelectedLayout === true) { // runsInElectron && synchronizeWithUserSettings
              // TODO: need to setActiveLayout
              layout = this.retreiveLayoutFromRawString(settings);
            } else if (layoutsPerFrameView != undefined) { // runsInElectron
              const foundLayout = layoutsPerFrameView.get(frame.id + '.' + viewId);
              if (foundLayout) {
                const isJson = this.isJson(foundLayout);
                if (settings && settings.length > 0 && isJson) {
                  const settingsUpdated: any = settings.replace(/'/g, '"');
                  const parsedSettings = JSON.parse(settingsUpdated);
                  Object.keys(parsedSettings).forEach((key: any) => {
                    parsedSettings[key] = foundLayout;
                  });
                  layout = parsedSettings;
                } else {
                  const size = LayoutUtilities.getScreenSize();
                  if (size === ScreenSize.Small) {
                    layout = { smallLayoutId: foundLayout, largeLayoutId: foundLayout };
                  } else {
                    layout = { largeLayoutId: foundLayout };
                  }
                }
              }
            } else {
              layout = this.retreiveLayoutFromRawString(settings);
            }
            return {
              frameId: frame.id,
              viewId,
              layout
            };
          })
        )
      );
    });

    concat(...obs).subscribe((res: { frameId: string; viewId: string | null; layout: FavoriteLayoutsPerRange }) => {
      this.trace.info(TraceModules.settings, 'Layout settings retrieved...');
      this.onLayoutSettingsCheckResult(res, observer, currentEvaluatedSettings, frames.length, resultMap);
      currentEvaluatedSettings++;
    });
  }

  private onSplitterSettingsCheckResult(
    data: { frameId: string; splittersObj: any },
    observer: Observer<Map<string, any>>,
    currentEvaluatedSettings: number,
    framesLength: number,
    resultMap: Map<string, any>): void {
    if (!isNullOrUndefined(data.splittersObj)) {
      this.trace.info(TraceModules.settings, 'Setting splitter settings for frame: %s.', data.frameId);
      resultMap.set(data.frameId, data.splittersObj);
    } else {
      this.trace.info(TraceModules.settings, 'Splitter settings are null for frame: %s. Skipping...', data.frameId);
    }
    if (currentEvaluatedSettings === framesLength - 1) {
      observer.next(resultMap);
      observer.complete();
    }
  }

  private onFullScreenSettingsCheckResult(
    data: { frameId: string; fullScreenObj: any },
    observer: Observer<Map<string, any>>,
    currentEvaluatedSettings: number,
    framesLength: number,
    resultMap: Map<string, any>): void {
    if (!isNullOrUndefined(data.fullScreenObj)) {
      this.trace.info(TraceModules.settings, 'Full Screen settings for frame: %s.', data.frameId);
      resultMap.set(data.frameId, data.fullScreenObj);
    } else {
      this.trace.info(TraceModules.settings, 'Full Screen settings are null for frame: %s. Skipping...', data.frameId);
    }
    if (currentEvaluatedSettings === framesLength - 1) {
      observer.next(resultMap);
      observer.complete();
    }
  }

  private onViewSettingsCheckResult(
    data: { frameId: string; selectedView: string },
    observer: Observer<Map<string, any>>,
    currentEvaluatedSettings: number,
    framesLength: number,
    resultMap: Map<string, any>): void {
    if (!isNullOrUndefined(data.selectedView)) {
      this.trace.info(TraceModules.settings, 'View settings for frame: %s.', data.frameId);
      resultMap.set(data.frameId, data.selectedView);
    } else {
      this.trace.info(TraceModules.settings, 'View settings are null for frame: %s. Skipping...', data.frameId);
    }
    if (currentEvaluatedSettings === framesLength - 1) {
      observer.next(resultMap);
      observer.complete();
    }
  }

  private onLayoutSettingsCheckResult(
    data: { frameId: string; viewId: string | null; layout: FavoriteLayoutsPerRange },
    observer: Observer<Map<string, FavoriteLayoutsPerRange>>,
    currentEvaluatedSettings: number,
    framesLength: number,
    resultMap: Map<string, FavoriteLayoutsPerRange>): void {
    if (!isNullOrUndefined(data.layout)) {
      this.trace.info(TraceModules.settings, 'Setting layout settings for frame: %s and view: %s.', data.frameId, data.viewId);
      resultMap.set(data.frameId + '.' + data.viewId, data.layout);
    } else {
      this.trace.info(TraceModules.settings, 'Layout settings are null for frame: %s and view: %s. Setting default layout...', data.frameId, data.viewId);
    }
    if (currentEvaluatedSettings === framesLength - 1) {
      observer.next(resultMap);
      observer.complete();
    }
  }

  private retreiveLayoutFromRawString(settings: string | null): FavoriteLayoutsPerRange {
    let layout: FavoriteLayoutsPerRange;
    const isJson = this.isJson(settings);
    if (settings && settings.length > 0) {
      if (isJson) {
        const settingsUpdated: any = settings.replace(/'/g, '"');
        const parsedSettings = JSON.parse(settingsUpdated);
        layout = parsedSettings;
      } else {
        const size = LayoutUtilities.getScreenSize();
        if (size === ScreenSize.Small) {
          layout = { smallLayoutId: settings, largeLayoutId: settings };
        } else {
          layout = { largeLayoutId: settings };
        }
      }
    } else {
      layout = null!;
    }
    return layout;
  }

  private isJson(settings: string | null): boolean {
    if (!settings || !settings.trim()) { // add check for empty or whitespace-only string
      return false;
    }
    try {
      const settingsUpdated: any = settings.replace(/'/g, '"');
      JSON.parse(settingsUpdated);
      return true;
    } catch (e) {
      this.trace.error(TraceModules.settings, 'Retrieved settings object is not a valid json format.');
      return false;
    }
  }

}
