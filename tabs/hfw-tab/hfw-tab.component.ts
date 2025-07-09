import { Component, ElementRef, EventEmitter, HostBinding, Input, OnDestroy, Output, Renderer2 } from '@angular/core';

import { HfwTabsetComponent } from '../hfw-tabset/hfw-tabset.component';

@Component({
  selector: 'hfw-tab',
  template: '<ng-content />',
  standalone: false
})
export class HfwTabComponent implements OnDestroy {

  constructor(tabset: HfwTabsetComponent, public renderer: Renderer2, public elementRef: ElementRef) {
    this.tabset = tabset;
    tabset.addTab(this);
  }
  @Input() public heading?: string;
  @Input() public icon?: string;
  @Input() public badgeContent?: string;
  @Input() public badgeColor?: string;

  @Output() public readonly selectTab: EventEmitter<HfwTabComponent> = new EventEmitter();

  public active = false;

  @Input() public isEmptyTabItem = false;

  @Input()
  public get customClass(): string | null {
    return this._customClass;
  }

  public set customClass(customClass: string | null) {
    if (this.customClass) {
      this.customClass.split(' ').forEach((cssClass: string) => {
        this.renderer.removeClass(this.elementRef.nativeElement, cssClass);
      });
    }

    this._customClass = customClass ? customClass.trim() : null;

    if (this.customClass) {
      this.customClass.split(' ').forEach((cssClass: string) => {
        this.renderer.addClass(this.elementRef.nativeElement, cssClass);
      });
    }
  }

  @HostBinding('attr.hidden') public get hidden(): boolean | null { return this.active ? null : true; }

  public deselectable = true;

  private _customClass!: string | null;
  private readonly tabset: HfwTabsetComponent;

  public ngOnDestroy(): void {
    this.tabset.removeTab(this);
  }

}
