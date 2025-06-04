import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { SiLoadingSpinnerModule } from '@simpl/element-ng';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { UnsavedDialogComponent as TestComponent } from './unsaved-dialog.component';

describe('UnsaveDialogComponent', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SiLoadingSpinnerModule, TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
      })],
      declarations: [TestComponent],
      providers: [BsModalRef]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('check onYes method', () => {
    spyOn(component.action, 'emit');
    component.onYes();
    expect(component.loading).toBe(true);
    expect(component.action.emit).toHaveBeenCalled();
  });

  it('check onCancel method', () => {
    spyOn(component.action, 'emit');
    spyOn(component.bsModalRef, 'hide');
    component.onNo();
    expect(component.action.emit).toHaveBeenCalled();
    expect(component.bsModalRef.hide).toHaveBeenCalled();
  });

  it('check onNo method', () => {
    spyOn(component.action, 'emit');
    spyOn(component.bsModalRef, 'hide');
    component.onCancel();
    expect(component.action.emit).toHaveBeenCalled();
    expect(component.bsModalRef.hide).toHaveBeenCalled();
  });

  it('should have elements', () => {
    component.loading = false;
    fixture.detectChanges();
    const header: HTMLElement = element.querySelector('div.modal-header')!;
    const body: HTMLElement = element.querySelector('div.modal-body')!;
    const footer: HTMLElement = element.querySelector('div.modal-footer')!;
    expect(header).toBeTruthy();
    expect(body).toBeTruthy();
    expect(footer).toBeTruthy();
  });
});
