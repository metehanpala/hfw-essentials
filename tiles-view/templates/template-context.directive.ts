/* eslint-disable @angular-eslint/directive-selector */
import { Directive, Input, ViewContainerRef, ViewRef } from '@angular/core';

/**
 *
 */
@Directive({
  selector: '[templateContext]',
  standalone: false
})
export class TemplateContextDirective {
  private insertedViewRef!: ViewRef | undefined;
  private readonly viewContainerRef: ViewContainerRef;

  constructor(viewContainerRef: ViewContainerRef) {
    this.viewContainerRef = viewContainerRef;
  }

  @Input() public set templateContext(context: any) {
    if (this.insertedViewRef) {
      this.viewContainerRef.remove(this.viewContainerRef.indexOf(this.insertedViewRef));
      this.insertedViewRef = undefined;
    }

    if (context.templateRef) {
      this.insertedViewRef = this.viewContainerRef.createEmbeddedView(context.templateRef, context);
    }
  }
}
