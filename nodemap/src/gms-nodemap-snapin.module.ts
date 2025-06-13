import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HfwControlsModule, TilesViewModule } from '@gms-flex/controls';
import { TraceService } from '@gms-flex/services-common';
import { ButtonPopoverModule, EventsModule, GmsSnapInCommonModule } from '@gms-flex/snapin-common';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SiAccordionModule, SiCardModule, SiContentActionBarModule, SiEmptyStateModule, SiFilteredSearchModule, SiFormModule,
  SiIconModule,
SiModalModule, SiSearchBarModule, SiSortBarModule, SiTypeaheadModule } from '@simpl/element-ng';
import { PaginationModule } from 'ngx-bootstrap/pagination';

import { NodeMapSnapInRoutingModule } from './gms-nodemap-snapin.routing';
import { NodeMapSnapInService } from './services/nodemap-snapin.service';
import { NodeMapService } from './services/nodemap.service';
import { NodeMapSnapInComponent } from './snapin/nodemap-snapin.component';

export const createTranslateLoader = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http,  './@gms-flex/nodemap/i18n/', '.json');

@NgModule({ declarations: [NodeMapSnapInComponent],
    exports: [NodeMapSnapInComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [ButtonPopoverModule, CommonModule, EventsModule, FormsModule, GmsSnapInCommonModule, HfwControlsModule,
        NodeMapSnapInRoutingModule, PaginationModule.forRoot(),
        ReactiveFormsModule, SiAccordionModule, SiCardModule, SiContentActionBarModule, SiEmptyStateModule,
        SiFilteredSearchModule, SiFormModule, SiIconModule, SiModalModule, SiSearchBarModule, SiSortBarModule, SiTypeaheadModule, TilesViewModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient, TraceService]
            },
            isolate: true
        })], providers: [GmsSnapInCommonModule, NodeMapService, NodeMapSnapInService, provideHttpClient(withInterceptorsFromDi())] })
export class GmsNodeMapSnapInModule {
  public static forRoot(): ModuleWithProviders<RouterModule> {
    return {
      ngModule: GmsNodeMapSnapInModule
    };
  }
}
