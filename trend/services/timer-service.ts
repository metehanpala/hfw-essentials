import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { last } from 'rxjs/operators';

/**
 * Class representing the Window.performance object
 */
export abstract class PerformanceRef {
  public abstract now(): number;
}

@Injectable({
  providedIn: 'root'
})
/**
 * Wrapper of window.performance
 */
export class WindowPerformance extends PerformanceRef {
  public now(): number {
    return window.performance.now();
  }
}

/**
 * The phases of trend loading
 */
export enum TimerPhaseEnum {

  GetTrendTileContent = 'GetTrendTileContent'

}

/**
 * A timer, responsible for tracking 1 phase of the trend
 */
export class TimerPhase {
  private readonly _startTime: number;
  private _endTime: number;
  private _isEnded: boolean;

  public constructor(startTime: number) {
    this._startTime = startTime;
    this._isEnded = false;
  }

  public get IsEnded(): boolean {
    return this._isEnded;
  }

  public stop(stopTime: number): void {
    this._endTime = stopTime;
    this._isEnded = true;
  }

  public getDuration(): number {
    if (!this.IsEnded) {
      return -1;
    }
    return this._endTime - this._startTime;
  }
}

@Injectable()
export class TimerService {
  private readonly _traceModule: string;
  private readonly _timers: Map<TimerPhaseEnum, TimerPhase>;
  private _startTime: number;
  private _endTime: number;

  public constructor(private readonly traceService: TraceService, private readonly performance: PerformanceRef) {
    this._timers = new Map<TimerPhaseEnum, TimerPhase>();
    this._traceModule = 'gmsSnapins_TrendTimings';
  }

  public startPhase(phaseEnum: TimerPhaseEnum): void {
    const curTime: number = this.now();
    if (!this.isStarted()) {
      this._startTime = curTime;
    }
    this._timers.set(phaseEnum, new TimerPhase(curTime));
  }

  public allComplete(): boolean {
    // get list of all trend loading phases
    const allPhases: string[] = Object.keys(TimerPhaseEnum);

    // check timer associated with each phase for IsEnded
    for (const phase of allPhases) {
      if (!this._timers.has(phase as TimerPhaseEnum) || !this._timers.get(phase as TimerPhaseEnum).IsEnded) {
        return false;
      }
    }
    return true;
  }

  public isStarted(): boolean {
    return this._timers.size > 0;
  }

  public isStartedPhase(phaseEnum: TimerPhaseEnum): boolean {
    return this._timers.has(phaseEnum);
  }

  public stopPhase(phaseEnum: TimerPhaseEnum): void {
    if (!this._timers.has(phaseEnum)) { // attempting to stop timer that has not been started
      this.traceService.warn(this._traceModule, `Attempting to stop timer on trend loading phase: ${phaseEnum} that
        has not been started.`);
      return;
    }

    const curTimer: TimerPhase = this._timers.get(phaseEnum);

    if (curTimer.IsEnded) {
      this.traceService.warn(this._traceModule, `Attempting to stop timer on trend loading phase: ${phaseEnum} that has
        already been stopped.`);
      return;
    }

    const curTime: number = this.now();
    curTimer.stop(curTime);
    if (this.allComplete()) {
      this._endTime = curTime;
    }
  }

  /**
   * Get the duration of a phase
   * @return the total duration of a completed phase, or -1 if phase is not completed
   * @param phaseEnum
   */
  public durationPhase(phaseEnum: TimerPhaseEnum): number {
    if (!this.isStartedPhase(phaseEnum)) {
      return -1;
    }
    const curTimer: TimerPhase = this._timers.get(phaseEnum);
    const duration: number = curTimer.getDuration();
    return duration;
  }

  public reset(): void {
    this._timers.clear();
  }

  private now(): number {
    const retVal: number = Math.round(this.performance.now());
    return retVal;
  }
}
