import { FormatDuration } from '@gms-flex/controls';

export enum DurationDisplay {
    None = 0,
    Day,
    DayHour,
    DayHourMin,
    DayHourMinSec,
    DayHourMinSecMs,
    Hour,
    HourMin,
    HourMinSec,
    HourMinSecMs,
    Min,
    MinSec,
    MinSecMs,
    Sec,
    SecMs
}

export enum DurationUnits {
    Day = 0,
    Hour,
    Min,
    Sec,
    Dsec,
    Csec,
    Msec
}

export class DurationFormatter {
    private _formatDuration: FormatDuration;
    private readonly _locale: string;
    private readonly _durationDisplayFormat: number;
    private readonly _durationValueUnits: number;
    private readonly _unitDescriptor: string;

    public constructor(locale: string, durationValueUnits: number, durationDisplayFormat: number, unitDescriptor: string) {
        this._locale = locale;
        this._durationDisplayFormat = durationDisplayFormat;
        this._durationValueUnits = durationValueUnits;
        this._unitDescriptor = unitDescriptor;
    }

    public formatDuration(value: number): string {
        if (value !== undefined) {
            const dvu: number = this._durationValueUnits;
            const units: string = this.mapDurationUnits(dvu);
            const ddf: number = this._durationDisplayFormat;
            const fmt: string = this.mapDurationtoFormatSpecifier(ddf);

            if (this._formatDuration === undefined) {
                this._formatDuration = new FormatDuration(this._locale, units, fmt);
            }
            let duration: string = this._formatDuration.format(value);

            if (duration !== undefined && this._unitDescriptor !== undefined) {
                duration += ' ' + this._unitDescriptor;
            }
            return duration;
        }
        else {
            return undefined;
        }
    }

    private mapDurationUnits(n: number): string {
        let units: string = '';
        switch (n) {
            case 1: // day
                units = 'd';
                break;
            case 2: // hour
                units = 'h';
                break;
            case 3: // minutes
                units = 'm';
                break;
            case 4: // seconds
                units = 's';
                break;
            case 5: // deciseconds (“tenths of a second”)
                units = 'ts';
                break;
            case 6: // centiseconds (“hundredths of a second”)
                units = 'hs';
                break;
            case 7: // milliseconds
                units = 'ms';
                break;
            default:
                break;
        }
        return units;
    }

    private mapDurationtoFormatSpecifier(n: number): string {
        let fmt: string = '';
        switch (n) {
            case 0: // none
                break;
            case 1: // day
                fmt = 'D.FFF';
                break;
            case 2: // day + hr
                fmt = 'D:h.FFF';
                break;
            case 3: // day + hr + min
                fmt = 'D:hh:mm.FFF';
                break;
            case 4: // day + hr + min + sec
                fmt = 'D:hh:mm:ss.FFF';
                break;
            case 5: // day + hr + min + sec + milliseconds
                fmt = 'D:hh:mm:ss.fff';
                break;
            case 6: // hour
                fmt = 'H.FFF';
                break;
            case 7: // hr + min
                fmt = 'H:mm.FFF';
                break;
            case 8: // hr + min + sec
                fmt = 'H:mm:ss.FFF';
                break;
            case 9: // hr + min + sec + ms
                fmt = 'H:mm:ss.fff';
                break;
            case 10: // min
                fmt = 'M.FFF';
                break;
            case 11: // min + sec
                fmt = 'M:ss.FFF';
                break;
            case 12: // min + sec + milliseconds
                fmt = 'M:ss.fff';
                break;
            case 13: // sec
                fmt = 'S.FFF';
                break;
            case 14: // sec + milliseconds
                fmt = 'S.fff';
                break;
            default:
                break;
        }
        return fmt;
    }

}
