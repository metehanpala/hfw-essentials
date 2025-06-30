import { Subject } from 'rxjs';

import { GmsAlarm } from '../../elements/gms-alarm';

export interface AlarmsContainer {
    readonly alarms: GmsAlarm[];
    alarmsChanged: Subject<string>;
    AddAlarm(alarmToAdd: GmsAlarm): void;
    RemoveAlarm(alarmToAdd: GmsAlarm): void;
}
