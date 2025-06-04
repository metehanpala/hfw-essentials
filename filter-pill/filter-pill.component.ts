import { Component, EventEmitter, Input, Output } from '@angular/core';

import { HfwFilterPillData } from './filter-pill.model';

@Component({
  selector: 'hfw-filter-pill',
  templateUrl: './filter-pill.component.html',
  styleUrl: './filter-pill.component.scss',
  standalone: false
})
export class HfwFilterPillComponent {

  @Input() public pillData!: HfwFilterPillData;
  @Input() public multipleFiltersLabel!: string;
  @Input() public pillDisable!: boolean;
  @Output() public readonly deleteClick: EventEmitter<HfwFilterPillData> = new EventEmitter<HfwFilterPillData>();

  public readonly trackByIndex = (index: number): number => index;

  public get filterTitle(): string {
    return this.pillData ? this.pillData.title : '';
  }

  public get hasMultipleValues(): boolean {
    return this.filterValuesCount > 1;
  }

  public get filterValuesCount(): number {
    return this.pillData ? this.pillData.values.length : 0;
  }

  public get displayIcons(): boolean {
    return this.pillData.icons;
  }

  public get pillDataValues(): readonly string[] {
    return this.pillData.values;
  }

  public get filterValuesString(): string {
    const c: number = this.filterValuesCount;
    if (c > 1) {
      return `${c} ${this.multipleFiltersLabel}`;
    } else if (c > 0) {
      return this.pillData.values[0]; // single filter value
    } else {
      return '';
    }
  }

  public onDeleteClick(): void {
    if (this.pillDisable) {
      return;
    }
    this.deleteClick.emit(this.pillData);
  }
}
