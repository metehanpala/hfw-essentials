import { PlatformModule } from '@angular/cdk/platform';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HFW_TRANSLATION_FILE_TOKEN } from '@gms-flex/services-common';
import { TranslateModule } from '@ngx-translate/core';
import { SiLoadingSpinnerModule, SiPasswordStrengthModule, SiPromptDialogButtonsModule,
  SiSearchBarModule, SiTreeViewModule } from '@simpl/element-ng';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';

import { TimeoutDialogComponent } from './dialogs/timeout-dialog/timeout-dialog.component';
import { UnsavedDialogComponent } from './dialogs/unsaved-dialog/unsaved-dialog.component';
import { HfwFilterPillComponent } from './filter-pill/filter-pill.component';
import { ListBoxItemComponent } from './list/list-box-item.component';
import { ListBoxComponent } from './list/list-box.component';
import { PanelNavigationComponent } from './panel-navigation/panel-navigation.component';
import { SplitterComponent } from './splitter/splitter.component';
import { TraceSettingsComponent } from './trace/trace-settings.component';
import { TreeSelectorComponent } from './tree-selector/tree-selector.component';
@NgModule({
  imports: [CommonModule, FormsModule, PlatformModule, RouterModule,
    SiLoadingSpinnerModule, SiPasswordStrengthModule, SiPromptDialogButtonsModule, SiSearchBarModule,
    BsDropdownModule.forRoot(), ModalModule.forRoot(), AccordionModule.forRoot(), SiTreeViewModule, TranslateModule],
  providers: [
    { provide: HFW_TRANSLATION_FILE_TOKEN, useValue: './@gms-flex/controls/i18n/', multi: true }
  ],
  declarations: [
    HfwFilterPillComponent,
    ListBoxComponent,
    ListBoxItemComponent,
    PanelNavigationComponent,
    SplitterComponent,
    TimeoutDialogComponent,
    TraceSettingsComponent,
    TreeSelectorComponent,
    UnsavedDialogComponent
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  exports: [
    HfwFilterPillComponent,
    ListBoxComponent,
    ListBoxItemComponent,
    PanelNavigationComponent,
    SplitterComponent,
    TimeoutDialogComponent,
    TraceSettingsComponent,
    TreeSelectorComponent,
    UnsavedDialogComponent]
})
export class HfwControlsModule {}
