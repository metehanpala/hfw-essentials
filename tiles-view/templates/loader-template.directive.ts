import { Directive, TemplateRef } from '@angular/core';

/**
 * Overrides the default loader content of the TilesView. To define the loader template, nest an `<ng-template>` tag
 * with the `hfwTilesViewLoaderTemplate` directive inside the component tag.
 */
@Directive({
  selector: '[hfwTilesViewLoaderTemplate]',
  standalone: false
})
export class LoaderTemplateDirective {
  constructor(public templateRef: TemplateRef<any>) {
  }
}
