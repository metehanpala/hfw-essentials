import { Injectable } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isNullOrUndefined, ModeData, TraceService } from '@gms-flex/services-common';
import { Subscription } from 'rxjs';

import { FullQParamId } from '../../common/fullsnapinid/full-qparam-id.model';
import { QParam } from '../../common/interfaces/q-param.model';
import { DEFAULT_MODE_ID } from '../shared/hldl/hldl-data.model';
import { FrameStore } from '../shared/stores/frame.store';
import { QParamStore } from '../shared/stores/qparam-store';
import { TraceModules } from '../shared/trace/trace-modules';
import { AppStatus } from './app-status.model';
import { HfwState } from './hfw-state';
import { IState } from './istate';

export const MODE_QPARAM = 'mode';
export const MODE_RELATED_VALUE_QPARAM = 'relatedValue';

export class QParamScanResults {
  // selectionQParamServices: QParamStore[] = [];
  // selectionQParamServiceFullIds: FullQParamId[] = [];
  // selectionParams: { id: string ; value: string }[] = [];
  // mode: ModeData = { id: DEFAULT_MODE_ID, relatedValue: null };
  public constructor(
    public selectionQParamServices: QParamStore[],
    public selectionQParamServiceFullIds: FullQParamId[],
    public selectionParams: Params[], // { id: string ; value: string }[],
    public mode: ModeData,
    public propertiesCount: number,
    public newParamsTrace: string) {
  }
}

/**
 * This service manage app query parameters.
 */
@Injectable({
  providedIn: 'root'
})
export class QParamsHandler {

  private qParamSub!: Subscription;

  private lastSelectionQParamServiceIds: FullQParamId[] = [];

  public constructor(private readonly state: IState,
    private readonly trace: TraceService) {
  }

  public static scanQParams(params: Params | null, state: HfwState): QParamScanResults {
    let result = new QParamScanResults([], [], [], { id: DEFAULT_MODE_ID, relatedValue: null }, 0, 'New query parameters:\n');
    if (params) {
      for (const key in params) {
        if (params.hasOwnProperty(key)) {
          result.propertiesCount++;
          result.newParamsTrace += key + ':' + params[key] + '\n';
          if (key !== MODE_QPARAM && key !== MODE_RELATED_VALUE_QPARAM) {
            result = QParamsHandler.returnResultforQParamStore(result, state, key, params);
          } else {
            if (key === MODE_QPARAM) {
              result.mode.id = params[key];
            } else {
              result.mode.relatedValue = params[key];
            }
          }
        }
      }
    }
    return result;
  }

  public static returnResultforQParamStore(result: QParamScanResults, state: HfwState, key: string, params: Params): QParamScanResults {
    const fullId: FullQParamId | null = FullQParamId.createFrom(key);
    if (fullId?.frameId) {
      const frame: FrameStore = state.getFrameStoreViaId(fullId.frameId)!;
      if (frame?.qParamStore) {
        return QParamsHandler.setResultforQParamStore(result, fullId, frame, key, params);
      }
    }
    return result;
  }

  public static setResultforQParamStore(result: QParamScanResults, fullId: FullQParamId, frame: FrameStore, key: string, params: Params): QParamScanResults {
    if (!isNullOrUndefined(frame)) {
      result.selectionQParamServiceFullIds.push(fullId);
      result.selectionQParamServices.push(frame.qParamStore!);
      const singleParam: Params = {};
      singleParam[key] = params[key];
      result.selectionParams.push(singleParam);
    }
    return result;
  }

  public activateQParamSubscription(activatedRoute: ActivatedRoute, state: HfwState): void {
    if (activatedRoute != null) {
      if (this.qParamSub != null) {
        this.qParamSub.unsubscribe();
      }
      // subscribe to router event
      this.qParamSub = activatedRoute.queryParams.subscribe((params: Params) => {
        this.trace.debug(TraceModules.qParam, 'queryParams subscription hit!');
        this.onQueryParamChange(params, state);
      });
    }
  }

  public pushNewSelectionQParam(newValue: QParam | null, state: HfwState): void {
    if (state.qParams) {
    // setting the value
      if (newValue?.value != null) {
        state.qParams.set(newValue.name, newValue.value);
      } else {
        state.qParams.delete(newValue!.name);
      }
    }
  }

  public handleQParamFromDeeplink(params: Params, state: HfwState): void {
    this.onQueryParamChange(params, state);
  }

  private onQueryParamChange(params: Params, state: HfwState): void {
    if (!params) {
      return;
    }
    const qParamResult = QParamsHandler.scanQParams(params, state);
    if (qParamResult.propertiesCount > 0) {
      this.trace.debug(TraceModules.qParam, qParamResult.newParamsTrace);
    } else {
      this.checkUnselectForLastSelectionMaster(state);
      return;
    }

    if (qParamResult.selectionQParamServices.length > 0) {
      this.lastSelectionQParamServiceIds = qParamResult.selectionQParamServiceFullIds;
      const currentQParam: Map<string, string> | null = state.getAppQParamAndModeQParam();
      // if (currentQParam == null || currentQParam.size === 0 && selectionParam?.value != null) { // this is the first selection.
      if (currentQParam == null || currentQParam.size === 0 && qParamResult.selectionParams.length > 0) { // this is the first selection.
        qParamResult.selectionParams.forEach((selectionParam, index) => {
          const paramName = Object.keys(selectionParam)[0];
          const paramValue = selectionParam[paramName];
          this.trace.debug(TraceModules.qParam, 'New query parameter set: value=%s', paramValue);
          // if (selectionMaster.qParamService != null) {
          //   this.state.onNewSelectionQParamDetected(selectionMaster, selectionParam.value);
          // }
          this.state.onNewSelectionQParamDetected({ qParamFullId: qParamResult.selectionQParamServiceFullIds[index], value: paramValue });
          this.trace.debug(TraceModules.qParam, 'Updating qParam behaviorsubject: value=%s', paramValue);
          qParamResult.selectionQParamServices[index].setQParam(qParamResult.selectionQParamServiceFullIds[index].channelId, paramValue);
        });
      } else { // handle the standard case.
        qParamResult.selectionParams.forEach((selectionParam, index) => {
          const paramName = Object.keys(selectionParam)[0];
          const paramValue = selectionParam[paramName];
          if (currentQParam?.has(paramName)) {
            this.trace.debug(TraceModules.qParam, 'Detected query parameter change: value=%s', paramValue);
            if (paramValue !== currentQParam.get(paramName)) {
              this.state.onNewSelectionQParamDetected({ qParamFullId: qParamResult.selectionQParamServiceFullIds[index], value: paramValue });
            }
            this.trace.debug(TraceModules.qParam, 'Updating qParam behaviorsubject: value=%s', paramValue);
            qParamResult.selectionQParamServices[index].setQParam(qParamResult.selectionQParamServiceFullIds[index].channelId, paramValue);
          }
        });
      }
    } else {
      this.checkUnselectForLastSelectionMaster(state);
    }
  }

  private checkUnselectForLastSelectionMaster(state: HfwState): void {
    if (this.lastSelectionQParamServiceIds != null && this.lastSelectionQParamServiceIds.length > 0) {
      this.lastSelectionQParamServiceIds.forEach(lastSelectionQParamServiceId => {
        const frameIdToBeCompared = (state.appStatus !== AppStatus.SwitchingFrame) ? state.activeWorkAreaIdValue : state.switchingFrameId;
        if (frameIdToBeCompared === lastSelectionQParamServiceId.frameId) {
          const frame: FrameStore | null = state.getFrameStoreViaId(lastSelectionQParamServiceId.frameId);
          if (frame?.qParamStore) {
            frame.qParamStore!.setQParam(lastSelectionQParamServiceId.channelId, null);
          }
          if (state.qParams != null) {
            state.qParams.delete(lastSelectionQParamServiceId.fullId());
          }
        }
      });
    }
  }
}
