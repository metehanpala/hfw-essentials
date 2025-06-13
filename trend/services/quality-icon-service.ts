import { Injectable } from '@angular/core';
import { IconEnumValue } from '@simpl/trendviewer-ng';

import { TrendDataQuality, TrendQualityGroup } from '../common/interfaces/trend.models';

@Injectable({
  providedIn: 'root'
})
export class QualityIconService {

  private readonly colors: any = {
    yellow100: '#fff1cc',
    yellow300: '#ffb700',
    red300: '#f7323f',
    black700: '#5c6775',
    black200: '#DEE0E7',
    black400: '#a7aeb7'
  };

  private readonly icons: any = {
    InAlarm: 'path://M256.347 386.861c-21.266 0-38.507 17.269-38.507 38.566 0 ' +
      '21.31 17.241 38.572 38.507 38.572 21.271 0 38.51-17.263 38.51-38.572-.001-21' +
      '.297-17.239-38.566-38.51-38.566zM256.357 362.069H464s-50.194-43.393-81.818-179.763c0 ' +
      '0-26.027-133.651-125.837-134.274V48c-.119 0-.228.016-.344.016s-.226-.016-.345-.016v.033c' +
      '-99.807.623-125.832 134.274-125.832 134.274C98.196 318.676 48 362.069 48 362.069h207.647v-.005h.71v.005z',
    InOverridden: 'path://M48 412.766l183.227-183.229c-9.603-17.839-14.22-37.452-14.22-58.041 0-34.297 ' +
      '12.006-63.458 36.015-87.469C277.043 60.017 306.198 48 340.504 48c12.353 0 24.246 1.837 35.677 ' +
      '5.495l-71.358 71.345c-5.021 5.051-7.547 11.433-7.547 19.202 0 7.8 2.525 14.185 7.547 19.227l43.915 ' +
      '43.905c5.031 5.033 11.438 7.534 19.207 7.534 7.781-.001 14.185-2.501 19.218-7.531l71.346-71.361c3.668 ' +
      '11.434 5.49 23.339 5.49 35.682 0 34.293-12.006 63.458-36.017 87.467-24.021 24.012-53.173 36.027-87.478 ' +
      '36.027-20.579 0-40.203-4.606-58.041-14.219L99.232 464 48 412.766z',
    InOutOfService: 'path://M256 64C149.965 64 64 149.965 64 256s85.965 192 192 192 192-85.965 192-192S362.035 ' +
      '64 256 64zm0 341.333c-39.885 0-77.389-15.531-105.592-43.742-28.211-28.203-43.742-65.706-43.742-105.591 ' +
      '0-31.3 9.361-60.817 27.18-85.956l208.111 208.11c-25.141 17.819-54.656 27.179-85.957 27.179zm122.154-63.' +
      '376L170.043 133.845c25.141-17.817 54.656-27.178 85.957-27.178 39.885 0 77.389 15.531 105.592 43.741 28.211 ' +
      '28.204 43.742 65.707 43.742 105.592 0 31.3-9.361 60.816-27.18 85.957z',
    InFailure: 'path://M256 64C149.961 64 64 149.962 64 256s85.961 192 192 192 192-85.962 192-192S362.039 ' +
      '64 256 64zm115.2 280.095L344.095 371.2 256 283.106 167.905 371.2l-27.106-27.106L228.893 256l-88.094-88' +
      '.094 27.106-27.105L256 228.896l88.095-88.095 27.105 27.105-88.095 88.095 88.095 88.094z',
    TimeChange: 'path://M256 48C141.126 48 48 141.125 48 256s93.126 208 208 208 208-93.125 208-208S370.874 48 ' +
      '256 48zm0 382.384c-96.311 0-174.384-78.075-174.384-174.384S159.689 81.616 256 81.616 430.384 159.69 ' +
      '430.384 256 352.311 430.384 256 430.384z M351.09 328.481l-23.03 23.069L239 262.753V101h33v148.247z',
    TrendDisabled: 'path://M349.512 160.946c3.988 3.301 5.99 8.943 5.99 16.928v156.252c0 7.993-2.002 13.627' +
      '-5.99 16.928-3.994 3.301-10.336 4.946-19.01 4.946H180.498c-8.684 0-15.021-1.646-19.01-4.946-3.996-3.' +
      '301-5.99-8.935-5.99-16.928V177.874c0-7.984 1.994-13.627 5.99-16.928 3.988-3.301 10.326-4.946 19.01-4.' +
      '946h150.004c8.674 0 15.016 1.646 19.01 4.946z',
    BufferPurged: 'path://M382.563 173.031c3.121 3.127 4.688 6.797 4.688 11.015 0 4.22-1.566 7.896-4.688 ' +
      '11.017-3.129 3.127-6.722 4.688-10.783 4.688h-9.375v181.406c0 6.877-2.502 12.729-7.499 17.578-5.001 ' +
      '4.84-10.941 7.266-17.81 7.266H174.904c-6.876 0-12.817-2.426-17.81-7.266-5.005-4.85-7.499-10.701-7.499' +
      '-17.578V199.75h-9.375c-4.065 0-7.662-1.561-10.783-4.688-3.129-3.121-4.688-6.797-4.688-11.017 0-4.218 ' +
      '1.559-7.888 4.688-11.015 3.121-3.121 6.718-4.688 10.783-4.688H181v-37.5c0-6.871 2.417-12.73 7.268-17.578 ' +
      '4.838-4.843 10.697-7.266 17.578-7.266h100.309c6.873 0 12.732 2.423 17.578 7.266 4.843 4.848 7.268 10.707 ' +
      '7.268 17.578v37.5h40.779c4.061.002 7.654 1.568 10.783 4.689zM208.657 203.5c-2.507-2.499-5.473-3.75-8.907-' +
      '3.75-3.442 0-6.408 1.251-8.907 3.75-2.502 2.504-3.747 5.471-3.747 8.906v150c0 3.443 1.245 6.328 3.747 ' +
      '8.672 2.499 2.344 5.465 3.516 8.907 3.516 3.435 0 6.4-1.172 8.907-3.516 2.498-2.344 3.747-5.229 3.747' +
      '-8.672v-150c0-3.435-1.249-6.402-3.747-8.906zm90.939-52.501c0-3.749-1.335-6.95-3.988-9.608-2.656-2.651-' +
      '5.859-3.984-9.606-3.984H226c-3.747 0-6.958 1.333-9.606 3.984-2.661 2.658-3.988 5.859-3.988 9.608v17.' +
      '345h87.191v-17.345zM264.907 203.5c-2.507-2.499-5.473-3.75-8.907-3.75-3.442 0-6.408 1.251-8.907 3.75-2.' +
      '502 2.504-3.747 5.471-3.747 8.906v150c0 3.443 1.245 6.328 3.747 8.672 2.499 2.344 5.465 3.516 8.907 3.516 ' +
      '3.435 0 6.4-1.172 8.907-3.516 2.498-2.344 3.747-5.229 3.747-8.672v-150c0-3.435-1.249-6.402-3.747-8.' +
      '906zm56.25 0c-2.507-2.499-5.473-3.75-8.907-3.75-3.442 0-6.408 1.251-8.907 3.75-2.502 2.504-3.747 5.' +
      '471-3.747 8.906v150c0 3.443 1.245 6.328 3.747 8.672 2.499 2.344 5.465 3.516 8.907 3.516 3.435 0 ' +
      '6.4-1.172 8.907-3.516 2.498-2.344 3.747-5.229 3.747-8.672v-150c0-3.435-1.249-6.402-3.747-8.906z',
    Overflow: 'path://M217.69 299.69h-.2l.2.27zM217.69 316v-.27l-.2.27z M217.69 299.69h-.2l.2.27zM217.69 ' +
      '316v-.27l-.2.27z M367.77 413.85V311.37h34.15V448H93.5V311.37h34.08v102.48h240.19zm-206-34.15h171.85v-' +
      '34.18H161.78zm4.15-77.64l167.69 35 7.2-33.12L173.18 269l-7.25 33.12zm21.74-80.88L343 293.66l14.45-' +
      '31.2L202.12 190l-14.45 31zm43.44-76.56L362.58 254.3l21.75-25.92-131.47-109.66-21.6 25.87zM316 ' +
      '64l-27.91 20.71 102.48 137.64 27.93-20.69L316 64z',
    ErrorInLog: 'path://M256 64C149.96 64 64 149.96 64 256s85.96 192 192 192 192-85.96 192-192S362.04 ' +
      '64 256 64zm24 320h-50v-50h50v50zm0-88h-50V136h50v160z',
    LogInterrupted: 'path://M324 160H222v-42.42L148.105 181 222 244.42V200h102c30 0 54.999 24.673 54.999 ' +
      '55S354 310 324 310H189v40h135c52 0 94.999-42.617 94.999-95S376 160 324 160z',
    Reduced: 'path://M133.868 133.869c-46.86 46.86-46.86 122.847 0 169.707 42.044 42.044 107.529 46.364 ' +
      '154.389 12.967l90.977 90.977a19.73 19.73 0 0 0 2.285 1.959c7.756 5.691 18.773 4.984 25.857-2.1 ' +
      '7.086-7.086 7.793-18.102 2.101-25.858a19.726 19.726 0 0 0-1.958-2.284l-90.977-90.977c33.403-46.867 ' +
      '29.076-112.346-12.969-154.39-46.859-46.86-122.838-46.868-169.705-.001zM282.36 282.362c-35.15 ' +
      '35.15-92.129 35.15-127.279 0s-35.15-92.129 0-127.279 92.129-35.15 127.279 0 35.151 92.129 0 ' +
      '127.279z M278 203h-45v-45h-30v45h-45v30h45v45h30v-45h45z',
    DriverFailed: 'path://M344.87,330.73c5.3-5.31,10.52-10.69,15.81-16,8-8,8.23-16.56.09-24.52-5.93-5.' +
      '8-12.51-10.95-20-17.39C353,261,362.43,251.66,372.14,242.57c7.57-7.09,12.86-15,4.17-24-8.54-8.75-' +
      '17.07-4.49-24.2,3.19-9.36,10.09-18.55,20.33-27.28,29.92l-64-64.15c9.94-9.42,20.68-19.36,31.15-29.' +
      '59,7-6.82,9-15,1.5-22.29s-15.33-4.93-22.1,2.25c-9.74,10.34-19.56,20.6-31.8,33.49-6.84-7.91-11.45-' +
      '14-16.82-19.26-9.48-9.32-16.87-9.29-26.41.07q-7.56,7.41-15,14.95l-54-54-14.15,14.15L384.69,398.' +
      '84l14.15-14.15Z M135.38,251.94c-2.58,29.71,5.92,56.14,24.15,82.17-7.75,7.08-15.47,13.74-22.74,20.' +
      '86-6.7,6.56-7.85,14.24-.89,21.16s14.62,5.69,21.16-1c7.11-7.28,13.77-15,20.56-22.44,4,2.4,5.95,3.43,' +
      '7.76,4.6,42.06,27.06,90,26.74,129.49-.26L154.78,196.92C143.51,213.11,137.16,231.47,135.38,251.94Z',
    ManualCorrectionAdd: 'path://M359.48,133.05c-.2-.21-.4-.4-.62-.59A34.44,34.44,0,0,0,335,124.54,36.22,' +
      '36.22,0,0,0,315,132.4a38.74,38.74,0,0,0-17.55-4.52,40.5,40.5,0,0,0-23,7.07c-5.44-4.85-13.29-9.82-23.' +
      '31-11s-19.68,1.61-29.11,8.23c-13.52-9.4-27.29-8.74-45.31,1.56-19.06,10.89-85,53.15-87,54.63-15.18,11-17' +
      '.91,26.33-7.5,42s25.86,18.22,45.79,7.59l.18-.1,57.58-32,.34-.2c3.91-2.34,4.43-2.08,5.83-1.38,6,3,20.8,' +
      '20.07,31.47,34.61,2.28,5.44,3.47,13,1.57,15.12-8.06,8.87-16.2,10.59-17.29,10.79a7.1,7.1,0,0,0-1.38.26l-' +
      '63.05,15.53-.19.05c-10,2.65-27.11,12.23-27.22,31.38-.1,15.65,14.37,22,20.6,24.06A65,65,0,0,0,152,338.' +
      '93h.54c75.92.16,191.19.53,197.58.89,11.51.72,19.4,3.27,24.83,8,3.34,2.92,10.41,9.31,20.44,18.49a12,12,' +
      '0,1,0,16.2-17.71c-10.31-9.43-17.32-15.77-20.83-18.84-9.63-8.42-22.07-12.85-39.14-13.91-8.29-.52-177.87-' +
      '.89-198.73-.94-4.79-.27-10.93-2-12.95-3.5.74-4.77,8.55-7.38,9.32-7.63l62.31-15.35c4-.67,18.14-4,31.21-18.' +
      '33,14.14-15.56,3.24-39.77,1.95-42.48a11.61,11.61,0,0,0-1.12-1.89c-4.3-5.91-26.44-35.75-40.9-43-13.52-6.' +
      '76-24.45-.4-28.73,2.17l-57.31,31.84c-10.77,5.73-12.07,3.77-14.44.23-2-3-2.33-4.68-2.24-5.17s1-1.92,3.73-3' +
      '.95c4.8-3.18,66.73-42.9,85-53.31,6.63-3.79,11.67-5.45,15-5,2.64.39,5.58,2.38,9.84,6.64l52,53a12,12,0,0,0,' +
      '17.14-16.79c-.3-.32-25.2-25.83-42.35-43.2a15.47,15.47,0,0,1,8-1.46c7,.76,13,7.52,14.72,10.08l.11.16a10.12,' +
      '10.12,0,0,0,1.29,1.64l39.29,42a12,12,0,0,0,17.54-16.39l-30.07-32.16a14.34,14.34,0,0,1,8.66-1,17.59,17.59,' +
      '0,0,1,7.72,4l28.29,29.2a12,12,0,0,0,17.23-16.7L334,149a9.07,9.07,0,0,1,8.78,1.31l72.6,74.41A12,12,0,0,0,' +
      '432.59,208Z',
    ManualCorrectionModify: 'path://M359.48,133.05c-.2-.21-.4-.4-.62-.59A34.44,34.44,0,0,0,335,124.54,36.22,36.22,' +
    '0,0,0,315,132.4a38.74,38.74,0,0,0-17.55-4.52,40.5,40.5,0,0,0-23,7.07c-5.44-4.85-13.29-9.82-23.31-11s-19.68,' +
    '1.61-29.11,8.23c-13.52-9.4-27.29-8.74-45.31,1.56-19.06,10.89-85,53.15-87,54.63-15.18,11-17.91,26.33-7.5,' +
    '42s25.86,18.22,45.79,7.59l.18-.1,57.58-32,.34-.2c3.91-2.34,4.43-2.08,5.83-1.38,6,3,20.8,20.07,31.47,34.61,' +
    '2.28,5.44,3.47,13,1.57,15.12-8.06,8.87-16.2,10.59-17.29,10.79a7.1,7.1,0,0,0-1.38.26l-63.05,15.53-.19.' +
    '05c-10,2.65-27.11,12.23-27.22,31.38-.1,15.65,14.37,22,20.6,24.06A65,65,0,0,0,152,338.93h.54c75.92.16,' +
    '191.19.53,197.58.89,11.51.72,19.4,3.27,24.83,8,3.34,2.92,10.41,9.31,20.44,18.49a12,12,0,1,0,16.2-17.' +
    '71c-10.31-9.43-17.32-15.77-20.83-18.84-9.63-8.42-22.07-12.85-39.14-13.91-8.29-.52-177.87-.89-198.73-' +
    '.94-4.79-.27-10.93-2-12.95-3.5.74-4.77,8.55-7.38,9.32-7.63l62.31-15.35c4-.67,18.14-4,31.21-18.33,14.' +
    '14-15.56,3.24-39.77,1.95-42.48a11.61,11.61,0,0,0-1.12-1.89c-4.3-5.91-26.44-35.75-40.9-43-13.52-6.76-' +
    '24.45-.4-28.73,2.17l-57.31,31.84c-10.77,5.73-12.07,3.77-14.44.23-2-3-2.33-4.68-2.24-5.17s1-1.92,3.73' +
    '-3.95c4.8-3.18,66.73-42.9,85-53.31,6.63-3.79,11.67-5.45,15-5,2.64.39,5.58,2.38,9.84,6.64l52,53a12,12,' +
    '0,0,0,17.14-16.79c-.3-.32-25.2-25.83-42.35-43.2a15.47,15.47,0,0,1,8-1.46c7,.76,13,7.52,14.72,10.08l.11' +
    '.16a10.12,10.12,0,0,0,1.29,1.64l39.29,42a12,12,0,0,0,17.54-16.39l-30.07-32.16a14.34,14.34,0,0,1,8.66-1,' +
    '17.59,17.59,0,0,1,7.72,4l28.29,29.2a12,12,0,0,0,17.23-16.7L334,149a9.07,9.07,0,0,1,8.78,1.31l72.6,74.' +
    '41A12,12,0,0,0,432.59,208Z'
  };

  public getIconEnum(): IconEnumValue[] {
    return [
      { icon: this.icons.DriverFailed, text: 'DriverFailed', value: 0, color: this.colors.red300 },
      { icon: this.icons.ErrorInLog, text: 'ErrorInLog', value: 1, color: this.colors.red300 },
      { icon: this.icons.TrendDisabled, text: 'LogDisabled', value: 2, color: this.colors.black200 },
      { icon: this.icons.BufferPurged, text: 'BufferPurged', value: 4, color: this.colors.black200 },
      { icon: this.icons.Overflow, text: 'BufferFull', value: 5, color: this.colors.red300 },
      { icon: this.icons.TimeChange, text: 'TimeChange', value: 6, color: this.colors.black200 },
      { icon: this.icons.LogInterrupted, text: 'LogInterrupted', value: 7, color: this.colors.red300 },
      { icon: this.icons.InOutOfService, text: 'InOutOfService', value: 8, color: this.colors.yellow300 },
      { icon: this.icons.InFailure, text: 'InFailure', value: 9, color: this.colors.red300 },
      { icon: this.icons.InAlarm, text: 'InAlarm', value: 10, color: this.colors.red300 },
      { icon: this.icons.InOverridden, text: 'InOverridden', value: 11, color: this.colors.yellow300 },
      { icon: this.icons.Reduced, text: 'Reduced', value: 22, color: this.colors.black400 },
      { icon: this.icons.TrendDisabled, text: 'TrendDisabled', value: 13, color: this.colors.black200 },
      { icon: this.icons.ManualCorrectionAdd, text: 'ManualCorrectionAdd', value: 25, color: this.colors.black200 },
      { icon: this.icons.ManualCorrectionModify, text: 'ManualCorrectionModify', value: 26, color: this.colors.black200 }
    ];
  }

  public getQualityByGroup(qualityArray: TrendDataQuality[]): TrendDataQuality[] {
    const returnMap: Map<TrendQualityGroup, TrendDataQuality[]> = new Map<TrendQualityGroup, TrendDataQuality[]>();
    const retval: TrendDataQuality[] = [];
    returnMap.set(TrendQualityGroup.HighSeverity, []);
    returnMap.set(TrendQualityGroup.Timeshift, []);
    returnMap.set(TrendQualityGroup.MediumSeverity, []);
    returnMap.set(TrendQualityGroup.AlwaysShowCategory, []);
    returnMap.set(TrendQualityGroup.NoShowCategory, []);
    qualityArray.forEach(quality => {
      returnMap.get(this.getGroupForQuality(quality)).push(quality);
    });

    if (returnMap.get(TrendQualityGroup.HighSeverity).length > 0) {
      returnMap.get(TrendQualityGroup.HighSeverity).forEach(item => { retval.push(item); });
    } else if (returnMap.get(TrendQualityGroup.Timeshift).length > 0) {
      returnMap.get(TrendQualityGroup.Timeshift).forEach(item => { retval.push(item); });
    } else if (returnMap.get(TrendQualityGroup.MediumSeverity).length > 0) {
      returnMap.get(TrendQualityGroup.MediumSeverity).forEach(item => { retval.push(item); });
    }
    if (returnMap.get(TrendQualityGroup.AlwaysShowCategory).length > 0) {
      returnMap.get(TrendQualityGroup.AlwaysShowCategory).forEach(item => { retval.push(item); });
    }
    return retval;
  }

  private getGroupForQuality(quality: TrendDataQuality): TrendQualityGroup {
    let retVal: TrendQualityGroup = TrendQualityGroup.NoShowCategory;
    switch (quality) {
      case TrendDataQuality.LogDisabled:
      case TrendDataQuality.LogInterrupted:
      case TrendDataQuality.BufferPurged:
      case TrendDataQuality.Overflow:
      case TrendDataQuality.DriverFailed: // this is Disconnected
      case TrendDataQuality.ErrorInLog:
        // High severity quality issues
        retVal = TrendQualityGroup.HighSeverity;
        break;
      case TrendDataQuality.TimeChange:
        // Time shift
        retVal = TrendQualityGroup.Timeshift;
        break;
      case TrendDataQuality.Reduced:
        retVal = TrendQualityGroup.AlwaysShowCategory;
        break;
      case TrendDataQuality.InFailure:
      case TrendDataQuality.InAlarm:
      case TrendDataQuality.InOverridden:
      case TrendDataQuality.InOutOfService:
      case TrendDataQuality.ManualCorrectionAdd:
      case TrendDataQuality.ManualCorrectionModify:
        retVal = TrendQualityGroup.MediumSeverity;
        break;
      case TrendDataQuality.NormalizedWithQualityItem:
      case TrendDataQuality.TrendDisabled:
      case TrendDataQuality.LogEnabled:
      case TrendDataQuality.NoIcon:
      case TrendDataQuality.OutOfAlarm:
      case TrendDataQuality.OutOfOverridden:
      case TrendDataQuality.OutOfOutOfService:
      case TrendDataQuality.OutOfFailure:
      case TrendDataQuality.TrendEnabled:
      case TrendDataQuality.HashCom:
      case TrendDataQuality.StartLogging:
      case TrendDataQuality.BufferFull:
      case TrendDataQuality.Unknown:
      default:
        retVal = TrendQualityGroup.NoShowCategory;
        break;
    }
    return retVal;
  }
}
