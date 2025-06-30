import { FormatDate } from '@gms-flex/controls';

export class DateTimeFormatter {

    private readonly _formatDate: FormatDate;
    private readonly _locale: string;
    public constructor(locale: string) {
        this._formatDate = new FormatDate(locale);
    }

    public formatDate(dtString: any): string {
        const dt: Date = this.decodeDateTime(dtString);

        return this._formatDate.format(dt);
    }

    private decodeDateTime(dtString: string): Date {
        let dt: Date;
        const dtMsec: number = Date.parse(dtString);
        if (!isNaN(dtMsec)) {
            dt = new Date(dtMsec);
        }
        return dt;
    }
}
