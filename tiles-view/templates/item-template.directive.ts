import { Directive, TemplateRef } from '@angular/core';

/**
 * Renders the tile item content. To define the item template, nest an `<ng-template>` tag
 * with the `hfwTilesItemTemplate` directive inside the component tag. The template context is
 * set to the current component. To get a reference to the current data item, use the `let-dataItem` directive.
 */
@Directive({
  selector: '[hfwTilesItemTemplate]',
  standalone: false
})
export class ItemTemplateDirective {
  constructor(public templateRef: TemplateRef<any>) {
  }
}
