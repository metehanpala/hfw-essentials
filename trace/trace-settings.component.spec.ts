import { Type } from '@angular/core';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MockTraceService, TraceService } from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { BsModalRef, ModalModule } from 'ngx-bootstrap/modal';

import { ListItem } from '../list/data.model';
import { ListBoxItemComponent } from '../list/list-box-item.component';
import { ListBoxComponent } from '../list/list-box.component';
import { TraceSettingsComponent } from './trace-settings.component';

const notVirt = 'Test List Item (non virtualized)';
describe('TraceSettingsComponent', () => {

  // //// Testing Vars //////
  let comp: TraceSettingsComponent;
  let fixture: ComponentFixture<TraceSettingsComponent>;

  // async beforeEach
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, ModalModule.forRoot(), TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } })],
      declarations: [TraceSettingsComponent, ListBoxComponent, ListBoxItemComponent],
      providers: [{ provide: TraceService, useClass: MockTraceService }, BsModalRef]
      // declare the test component
    }).compileComponents(); // compile template and css
  }));

  // synchronous beforeEach
  beforeEach(() => {
    fixture = TestBed.createComponent(TraceSettingsComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges(); // trigger initial data binding
  });

  it('should call TraceSettingsComponent', fakeAsync(() => {
    const traceServiceSpy: TraceService = fixture.debugElement.injector.get(TraceService as Type<TraceService>);

    flushMicrotasks();
    comp.infoEnabled = true;
    comp.infoEnabled = false;
    comp.debugEnabled = true;
    comp.debugEnabled = false;
    comp.allModulesEnabled = true;
    comp.allModulesEnabled = false;

    const listItem1: ListItem = new ListItem(notVirt, 'moduleName1');
    const listItem2: ListItem = new ListItem(notVirt, 'moduleName2');

    const listItem3: ListItem = new ListItem(notVirt, 'moduleVendorName1');
    const listItem4: ListItem = new ListItem(notVirt, 'moduleVendorName2');

    listItem1.checked = false;
    comp.onItemChecked(listItem1);
    comp.onClearModules();

    traceServiceSpy.traceSettings.addToVendorModules('moduleVendorName1');
    traceServiceSpy.traceSettings.addToVendorModules('moduleVendorName2');
    traceServiceSpy.traceSettings.addToModules('moduleName1');
    traceServiceSpy.traceSettings.addToModules('moduleName2');
    fixture.detectChanges();

    comp.onItemChecked(listItem1);
    comp.onItemChecked(listItem2);
    comp.onItemChecked(listItem3);
    comp.onItemChecked(listItem4);

  }));

});
