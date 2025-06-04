import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { TimeoutDialogComponent as TestComponent } from './timeout-dialog.component';

describe('TimeoutDialogComponent', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let element: HTMLElement;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
      })],
      declarations: [TestComponent],
      providers: [BsModalRef]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have elements', () => {
    fixture.detectChanges();
    const header: HTMLElement = element.querySelector('div.modal-header')!;
    const body: HTMLElement = element.querySelector('div.modal-body')!;
    const footer: HTMLElement = element.querySelector('div.modal-footer')!;
    expect(header).toBeTruthy();
    expect(body).toBeTruthy();
    expect(footer).toBeTruthy();
  });

  it('check Stayin method', () => {
    component.ngOnInit();
    spyOn(component.action, 'emit');
    spyOn(component.bsModalRef, 'hide');
    component.onYes();
    expect(component.action.emit).toHaveBeenCalled();
    expect(component.bsModalRef.hide).toHaveBeenCalled();
    expect(component.timeLeft).toBeGreaterThan(0);
  });

  it('check Logout method', () => {
    component.ngOnInit();
    spyOn(component.action, 'emit');
    spyOn(component.bsModalRef, 'hide');
    component.onNo();
    expect(component.action.emit).toHaveBeenCalled();
    expect(component.bsModalRef.hide).toHaveBeenCalled();
  });
});
