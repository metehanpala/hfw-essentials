import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { MinimumSizeDialogComponent as TestComponent } from './minimum-size-dialog.component';

describe('MinimumSizeDialogComponent', () => {
  let debugElement: DebugElement;
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
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
    debugElement = fixture.debugElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have elements', () => {
    fixture.detectChanges();
    const header: HTMLElement = element.querySelector('div.modal-header')!;
    const body: HTMLElement = element.querySelector('div.modal-body')!;
    expect(header).toBeTruthy();
    expect(body).toBeTruthy();
  });
});
