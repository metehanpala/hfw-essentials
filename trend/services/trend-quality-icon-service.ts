import { Injectable } from '@angular/core';
import { fromString } from 'long';

import { eQuality, TrendDataQuality, TrendQualityInfo } from '../common/interfaces/trend.models';
import { QualityIconService } from './quality-icon-service';

@Injectable({
  providedIn: 'root'
})
export class QualityIconProvider {

  constructor(private readonly qualityIconService: QualityIconService) { }

  public qualityIconPath: string;

  private readonly QF_DRIVER_FAILED: Long = fromString('0x40', true, 16); // statusbit 6
  private readonly QF_BASE: Long = fromString('0x100000000', true, 16); // base: PVSS _userbit9, statusbit 32
  private readonly QF_OUTOFSERVICE: Long = this.QF_BASE; // PVSS _userbit9, statusbit 32
  private readonly QF_INALARM: Long = this.QF_BASE.shiftLeft(1); // PVSS _userbit10, statusbit 33
  private readonly QF_FAULT: Long = this.QF_BASE.shiftLeft(2); // PVSS _userbit11, statusbit 34
  private readonly QF_OVERRIDEN: Long = this.QF_BASE.shiftLeft(3); // PVSS _userbit12, statusbit 35
  private readonly QF_TIMESHIFTED: Long = this.QF_BASE.shiftLeft(8); // PVSS _userbit17, statusbit 40
  private readonly QF_LOGENABLED: Long = this.QF_BASE.shiftLeft(9); // PVSS _userbit18, statusbit 41
  private readonly QF_ERRORINLOG: Long = this.QF_BASE.shiftLeft(10); // PVSS _userbit19, statusbit 42
  private readonly QF_BUFFERPURGED: Long = this.QF_BASE.shiftLeft(11); // PVSS _userbit20, statusbit 43
  private readonly QF_OVERFLOW: Long = this.QF_BASE.shiftLeft(12); // PVSS _userbit21, statusbit 44
  private readonly QF_LOGINTERRUPTED: Long = this.QF_BASE.shiftLeft(14); // PVSS _userbit23, statusbit 46
  private readonly QF_STARTLOGGING: Long = this.QF_BASE.shiftLeft(16); // PVSS _userbit25, statusbit 48
  private readonly QF_REDUCED: Long = this.QF_BASE.shiftLeft(17); // PVSS _userbit26, statusbit 49
  private readonly QF_MANUAL_CORRECTION_ADD: Long = fromString('0x9000', true, 16);
  private readonly QF_MANUAL_CORRECTION_EDIT: Long = fromString('0x1000', true, 16);

  // private QM_PriorityValue: Long = fromString("0x1C000000000000", true, 16); // PVSS _userbits27..29, statusbits 50..52

  public getIconConverted(quality: string, value: any): TrendQualityInfo {
    const qualityValue: Long = fromString(quality, true, 10);
    const equalityGot: TrendQualityInfo = this.convertQuality(qualityValue, value);
    return equalityGot;
  }

  public generateMissingDataFrom(missingData: any[], dateToPush: Date, qualityColor: string): void {
    if (missingData.length > 0) {
      if (missingData[missingData.length - 1].data.length >= 2) {
        missingData.push({ data: [(dateToPush)], color: qualityColor });
      }
    } else {
      missingData.push({ data: [(dateToPush)], color: qualityColor });
    }
  }
  // convertQuality converts PVSS status64 to eQuality
  private convertQuality(status64: Long, value: any): TrendQualityInfo /* , double value)*/ {
    let quality: eQuality = eQuality.Value_Ok;
    const qualityArray: TrendDataQuality[] = [];
    const qualityInfo: TrendQualityInfo = new TrendQualityInfo();

    if (status64.and(this.QF_OUTOFSERVICE).comp(0)) { // OutOfService
      qualityArray.push(TrendDataQuality.InOutOfService);
      quality = quality | eQuality.Value_OutOfService;
    }
    if ((status64.and(this.QF_INALARM)).comp(0)) { // Alarm
      qualityArray.push(TrendDataQuality.InAlarm);
      quality = quality | eQuality.Value_InAlarm;
    }
    if ((status64.and(this.QF_FAULT)).comp(0)) { // Fault
      qualityArray.push(TrendDataQuality.InFailure);
      quality = quality | eQuality.Value_Fault;
    }
    if ((status64.and(this.QF_OVERRIDEN)).comp(0)) { // Overridden
      qualityArray.push(TrendDataQuality.InOverridden);
      quality = quality | eQuality.Value_Overriden;
    }
    if ((status64.and(this.QF_REDUCED)).comp(0)) { // Reduced
      qualityArray.push(TrendDataQuality.Reduced);
      quality = quality | eQuality.Value_Reduced;
    }
    if ((status64.and(this.QF_STARTLOGGING)).comp(0)) { // StartLogging
      qualityArray.push(TrendDataQuality.StartLogging);
      quality = quality | eQuality.Value_StartLogging;
    }
    if ((status64.and(this.QF_TIMESHIFTED)).comp(0)) { // Time Shifted
      qualityArray.push(TrendDataQuality.TimeChange);
      quality = quality | eQuality.NoValue_TimeShifted;
    }
    if (status64.and(this.QF_LOGENABLED).comp(0)) { // LogEnable/Disable
      if (value === 0) {
        qualityArray.push(TrendDataQuality.LogDisabled);
        quality = quality | eQuality.NoValue_LogDisabled;
      } else {
        qualityArray.push(TrendDataQuality.LogEnabled);
        quality = quality | eQuality.NoValue_LogEnabled;
      }
    }
    if ((status64.and(this.QF_BUFFERPURGED)).comp(0)) { // BufferPurged
      qualityArray.push(TrendDataQuality.BufferPurged);
      quality = quality | eQuality.NoValue_BufferPurged;
    }
    if ((status64.and(this.QF_OVERFLOW)).comp(0)) { // Overflow
      qualityArray.push(TrendDataQuality.Overflow);
      quality = quality | eQuality.NoValue_Overflow;
    }
    if ((status64.and(this.QF_DRIVER_FAILED)).comp(0)) { // #COM
      qualityArray.push(TrendDataQuality.DriverFailed);
      quality = quality | eQuality.NoValue_Driver_Failed;
    }
    if ((status64.and(this.QF_ERRORINLOG)).comp(0)) { // log error
      qualityArray.push(TrendDataQuality.ErrorInLog);
      quality = quality | eQuality.NoValue_ErrorInLog;
    }
    if ((status64.and(this.QF_LOGINTERRUPTED)).comp(0)) { // log interupted
      qualityArray.push(TrendDataQuality.LogInterrupted);
      quality = quality | eQuality.NoValue_LogInterrupted;
    }
    if ((status64.and(this.QF_MANUAL_CORRECTION_ADD)) === this.QF_MANUAL_CORRECTION_ADD) { // Manual Correction Value added
      qualityArray.push(TrendDataQuality.ManualCorrectionAdd);
      quality = quality | eQuality.Value_Added;
    }
    if ((status64.and(this.QF_MANUAL_CORRECTION_EDIT)).comp(0)) { // Manual Correction Value modified
      qualityArray.push(TrendDataQuality.ManualCorrectionModify);
      quality = quality | eQuality.Value_Edited;
    }
    // if (status64.and(this.QM_PriorityValue).comp(0)) // Valid priority given
    // {
    //     quality = quality | ((status64.and(this.QM_PriorityValue)).shiftRightUnsigned(50)).multiply
    //             (fromNumber(eQuality.PriorityValueBase)));
    // }
    // let qualityIcon = this.setQualityIcons(quality);
    qualityInfo.qualityArray = this.qualityIconService.getQualityByGroup(qualityArray);
    qualityInfo.qualityValue = quality;
    return qualityInfo;
  }
}
