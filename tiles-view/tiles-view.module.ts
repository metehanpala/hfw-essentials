import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SiLoadingSpinnerModule } from '@simpl/element-ng';

import { HeaderTemplateDirective } from './templates/header-template.directive';
import { ItemTemplateDirective } from './templates/item-template.directive';
import { LoaderTemplateDirective } from './templates/loader-template.directive';
import { TemplateContextDirective } from './templates/template-context.directive';
import { TilesViewComponent } from './tiles-view/tiles-view.component';

export * from './index';

const TEMPLATE_DIRECTIVES: any[] = [
  ItemTemplateDirective,
  HeaderTemplateDirective,
  TemplateContextDirective,
  LoaderTemplateDirective
];

@NgModule({
  declarations: [
    TEMPLATE_DIRECTIVES,
    TilesViewComponent
  ],
  exports: [
    TEMPLATE_DIRECTIVES,
    TilesViewComponent
  ],
  imports: [
    CommonModule,
    SiLoadingSpinnerModule
  ],
  providers: []
})
export class TilesViewModule {
}
