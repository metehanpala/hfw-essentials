import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchConfig, TilesViewModule } from '@gms-flex/controls';
import { SystemBrowserService, ValueService } from '@gms-flex/services';
import { GmsSnapInCommonModule, PerformanceRef, TimerService, WindowPerformance } from '@gms-flex/snapin-common';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SiActionDialogService, SiCardModule, SiLoadingSpinnerModule, SiSearchBarModule, SiToastNotificationService } from '@simpl/element-ng';

import { graphicsSnapInRouting } from './gms-graphics-viewer-snapin.routing';
import { SearchViewComponent } from './search/search-view.component';
import { GraphicsSnapinService } from './services/graphics-snapin.service';
import { GraphicsViewerSnapInComponent } from './snapin/graphics-viewer-snapin.component';

export const createTranslateLoader = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './@gms-flex/graphics-viewer/i18n/', '.json');

@NgModule({ declarations: [
        GraphicsViewerSnapInComponent,
        SearchViewComponent
    ],
    exports: [GraphicsViewerSnapInComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
            },
            isolate: true
        }),
        CommonModule,
        FormsModule,
        graphicsSnapInRouting,
        GmsSnapInCommonModule,
        SiCardModule,
        TilesViewModule,
        SiSearchBarModule,
        SiLoadingSpinnerModule], providers: [
        SiToastNotificationService,
        SiActionDialogService,
        TimerService,
        { provide: PerformanceRef, useClass: WindowPerformance },
        SystemBrowserService,
        ValueService,
        GraphicsSnapinService,
        SearchConfig,
        provideHttpClient(withInterceptorsFromDi())
    ] })

export class GmsGraphicsViewerSnapInModule {}
