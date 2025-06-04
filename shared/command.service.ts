import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { CommandClickEvent, CommandItem } from './command.model';

@Injectable({
  providedIn: 'root'
})
export class CommandService {
  public commandItems!: CommandItem[];
  public commandClickEvent: Subject<CommandClickEvent> = new Subject<CommandClickEvent>();
}
