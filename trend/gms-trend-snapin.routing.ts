import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TrendSnapInComponent } from './snapin/trend-snapin.component';
import { TrendChartComponent } from './trend-chart/trend-chart.component';

const TREND_SNAPIN_ROUTES: Routes = [
  {
    path: '',
    component: TrendSnapInComponent
  }
];

export const TREND_SNAPIN_ROUTING: ModuleWithProviders<RouterModule> = RouterModule.forChild(TREND_SNAPIN_ROUTES);
