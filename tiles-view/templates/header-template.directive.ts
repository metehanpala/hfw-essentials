import { Directive, TemplateRef } from '@angular/core';

/**
 * Renders the header content of the TilesView. To define the header template, nest an `<ng-template>` tag
 * with the `hfwTilesViewHeaderTemplate` directive inside the component tag.
 */
@Directive({
  selector: '[hfwTilesViewHeaderTemplate]',
  standalone: false
})
export class HeaderTemplateDirective {
  constructor(public templateRef: TemplateRef<any>) {
  }
}
