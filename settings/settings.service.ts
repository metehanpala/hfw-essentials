import { Injectable, Optional } from '@angular/core';
import { isNullOrUndefined, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace/trace-modules';
import { FavoriteLayoutsPerRange } from '../state/user-settings.handler';

export const layoutSettingsPrefix = 'Flex_Hfw_LayoutSettings-';
export const splitterSettingsPrefix = 'Flex_HfwCore_SplitterSettings-';
export const fullScreenSettingsPrefix = 'Flex_HfwCore_FullScreenSettings-';
export const selectedViewSettingsPrefix = 'Flex_HfwCore_FullScreenSelectedView-';

/**
 * This service handle the saving/restoring of user settings.
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  public isProvided: boolean;

  public constructor(private readonly trace: TraceService,
    @Optional() private readonly settingsService: SettingsServiceBase) {
    this.isProvided = !isNullOrUndefined(this.settingsService);
    if (this.isProvided) {
      this.trace.info(TraceModules.settings, 'settingsService provided.');
    } else {
      this.trace.info(TraceModules.settings, 'settingsService not provided.');
    }
  }

  public getUserSettingLayoutId(frameId: string, viewId: string | null): Observable<string | null> {
    if (this.isProvided) {
      return this.settingsService.getSettings(layoutSettingsPrefix + frameId + '-' + viewId).pipe(
        map((response: string) => this.onGetLayoutSettings(response, frameId, viewId)));
    } else {
      return observableOf(null);
    }
  }

  public getSplitterSettings(frameId: string): Observable<string | null> {
    if (this.isProvided) {
      return this.settingsService.getSettings(splitterSettingsPrefix + frameId);
    } else {
      return observableOf(null);
    }
  }

  public getFullScreenSettings(frameId: string): Observable<string | null> {
    if (this.isProvided) {
      return this.settingsService.getSettings(fullScreenSettingsPrefix + frameId);
    } else {
      return observableOf(null);
    }
  }

  public getSelectedViewSettings(frameId: string): Observable<string | null> {
    if (this.isProvided) {
      return this.settingsService.getSettings(selectedViewSettingsPrefix + frameId).pipe(
        map((response: string) => this.onGetViewSettings(response, frameId)));
    } else {
      return observableOf(null);
    }
  }

  public saveLayoutSettings(frameId: string, viewId: string, settings: FavoriteLayoutsPerRange): void {
    this.settingsService.putSettings(layoutSettingsPrefix + frameId + '-' + viewId, JSON.stringify(settings).replace(/"/g, '\'')).subscribe(
      val => this.onPutLayoutSettings(val, frameId, viewId, settings),
      err => this.trace.error(TraceModules.settings, 'Error saving frame %s layout settings %s : %s', frameId, JSON.stringify(settings), err)
    );
  }

  public saveSelectedViewSettings(frameId: string, settings: string): Observable<boolean> {
    return this.settingsService.putSettings(selectedViewSettingsPrefix + frameId, settings);
  }

  public deleteSplitterSettings(frameId: string): void {
    this.settingsService.deleteSettings(splitterSettingsPrefix + frameId).subscribe(
      val => this.onDeleteSplitterSettings(val, frameId),
      err => this.trace.error(TraceModules.settings, 'Error deleting splitter settings for frame %s : %s', frameId, err)
    );
  }

  private onDeleteSplitterSettings(isSuccess: boolean, frameId: string): void {
    if (isSuccess) {
      this.trace.info(TraceModules.settings, 'Splitter settings for frame %s deleted.', frameId);
    } else {
      this.trace.warn(TraceModules.settings, 'Splitter settings for frame %s not deleted.', frameId);
    }
  }

  private onGetViewSettings(settings: string, frameId: string): string {
    this.trace.info(TraceModules.settings, 'Reading settings %s succeeds for frame %s', settings, frameId);
    return settings;
  }

  private onGetLayoutSettings(settings: string, frameId: string, viewId: string | null): string {
    this.trace.info(TraceModules.settings, 'Reading settings %s succeeds for frame %s and view %s', settings, frameId, viewId);
    return settings;
  }

  private onPutLayoutSettings(isSuccess: boolean, frameId: string, viewId: string, settings: FavoriteLayoutsPerRange): void {
    if (isSuccess) {
      this.trace.info(TraceModules.settings, 'frame %s view %s layout %s saved.', frameId, viewId, JSON.stringify(settings));
    } else {
      this.trace.warn(TraceModules.settings, 'frame %s view %s layout %s not saved.', frameId, viewId, JSON.stringify(settings));
    }
  }

}
