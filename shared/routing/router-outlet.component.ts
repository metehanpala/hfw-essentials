import { Component,
  EventEmitter, Input,
  Output } from '@angular/core';
import { isNullOrUndefined } from '@gms-flex/services-common';

@Component({
  selector: 'hfw-router-outlet',
  templateUrl: './router-outlet.component.html',
  standalone: false
})

export class RouterOutletComponent {

  @Input() public outletName!: string;

  @Output() public readonly routeChanged: EventEmitter<any> = new EventEmitter();

  @Output() public readonly deactivate: EventEmitter<any> = new EventEmitter();

  public onActivate(value: any): void {
    if (!isNullOrUndefined(value) && !isNullOrUndefined(value.fullId)) {
      this.routeChanged.emit({ fullId: value.fullId });
    } else {
      if (!isNullOrUndefined(value)) {
        this.routeChanged.emit(value);
      }
    }
  }

  public onDeActivate(value: any): void {
    this.deactivate.emit(value);
  }
}
