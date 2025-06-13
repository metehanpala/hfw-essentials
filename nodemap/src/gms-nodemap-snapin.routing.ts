import { NgModule } from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';

import { NodeMapSnapInComponent } from './snapin/nodemap-snapin.component';

const routes: Routes = [
  {
    path: '',
    component: NodeMapSnapInComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NodeMapSnapInRoutingModule { }
