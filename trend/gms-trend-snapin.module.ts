import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HfwControlsModule, TilesViewModule } from '@gms-flex/controls';
import { ProductService } from '@gms-flex/services-common';
import { AboutPopoverModule, GmsSnapInCommonModule, ValidationDialogService } from '@gms-flex/snapin-common';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SimplChartsNgModule } from '@simpl/charts-ng';
import { SiContentActionBarModule, SiLoadingSpinnerModule, SiSearchBarModule, SiSliderModule, SiToastNotificationService } from '@simpl/element-ng';
import { SimplTrendviewerNgModule, SiTrendviewerConfigService,
  SiTrendviewerService, TrendConfigurationApi, TrendviewerApi } from '@simpl/trendviewer-ng';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TabsModule } from 'ngx-bootstrap/tabs';

import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { TREND_SNAPIN_ROUTING } from './gms-trend-snapin.routing';
import { SearchViewComponent } from './search/search.component';
import { PerformanceRef, TimerService, WindowPerformance } from './services/timer-service';
import { TrendDefinitionService } from './services/trend-definition-service';
import { TrendSnapinService } from './services/trend-snapin.service';
import { TrendviewerApiService } from './services/trendviewer-api-service';
import { TrendConfigApiService } from './services/trendviewer-config-api-service';
import { TrendValidationHelperService } from './shared/trend-validation-helper.service';
import { TrendSnapInComponent } from './snapin/trend-snapin.component';
import { TrendChartComponent } from './trend-chart/trend-chart.component';
import { TrendLogManager } from './trend-chart/trendLog.manager';
import { TrendDefinitionManager } from './trend-chart/trendViewDefinition.manager';
import { TrendDataHandlerService } from './trend-export/services/trend-data-handler-service';
import { TrendExcelExportService } from './trend-export/services/trend-excel-export-service';
import { TrendExportMapperBaseService } from './trend-export/services/trend-export-mapper-base-service';
import { TrendPdfExportService } from './trend-export/services/trend-pdf-export-service';
import { TrendExportComponent } from './trend-export/trend-export.component';
import { TrendHostComponent } from './trend-host/trend-host.component';
import { TrendThumbnailManagerClientComponent } from './trend-thumbnail-manager/trend-thumnail-manager';

export const createTranslateLoader = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './@gms-flex/trend/i18n/', '.json');

export const TrendApiServiceFactory = (trendDefinitionService: TrendDefinitionService): TrendviewerApiService =>
  new TrendviewerApiService(trendDefinitionService);

export const TrendConfigApiServiceFactory = (trendValidationHelperService: TrendValidationHelperService,
  trendDefinitionService: TrendDefinitionService): TrendConfigApiService =>
  new TrendConfigApiService(trendDefinitionService, trendValidationHelperService);

@NgModule({ declarations: [
  GeneralSettingsComponent,
  SearchViewComponent,
  TrendChartComponent,
  TrendExportComponent,
  TrendHostComponent,
  TrendSnapInComponent,
  TrendThumbnailManagerClientComponent
],
exports: [TrendSnapInComponent],
schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [AboutPopoverModule,
  AccordionModule,
  CommonModule,
  FormsModule,
  GmsSnapInCommonModule,
  HfwControlsModule,
  ModalModule,
  PortalModule,
  SiContentActionBarModule,
  SiLoadingSpinnerModule,
  SimplTrendviewerNgModule.forRoot({
    trendviewerApi: { provide: TrendviewerApi, useFactory: TrendApiServiceFactory, deps: [TrendDefinitionService] },
    trendconfigurationApi: { provide: TrendConfigurationApi, useFactory: TrendConfigApiServiceFactory,
      deps: [TrendValidationHelperService, TrendDefinitionService] }
  }),
  SimplChartsNgModule,
  SiSearchBarModule,
  SiSliderModule,
  TabsModule,
  TranslateModule.forChild({
    loader: {
      provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [HttpClient]
    },
    isolate: true
  }),
  TilesViewModule,
  TREND_SNAPIN_ROUTING], providers: [
  ProductService,
  SiToastNotificationService,
  SiTrendviewerConfigService,
  SiTrendviewerService,
  TimerService,
  TrendDataHandlerService,
  { provide: PerformanceRef, useClass: WindowPerformance },
  TrendDefinitionManager,
  TrendDefinitionService,
  TrendExcelExportService,
  TrendLogManager,
  TrendPdfExportService,
  TrendSnapinService,
  TrendValidationHelperService,
  ValidationDialogService,
  provideHttpClient(withInterceptorsFromDi())
] })
export class GmsTrendSnapInModule { }
