import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GraphicsViewerSnapInComponent } from './snapin/graphics-viewer-snapin.component';

const graphicsViewerSnapInRoutes: Routes = [
  {
    path: '',
    component: GraphicsViewerSnapInComponent
  }
];

export const graphicsSnapInRouting: ModuleWithProviders<RouterModule> = RouterModule.forChild(graphicsViewerSnapInRoutes);
