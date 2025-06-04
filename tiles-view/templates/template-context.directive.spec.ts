import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TemplateContextDirective } from './template-context.directive';

@Component({
  template: `
    <div>Without Directive</div>
    <div templateContext>Default</div>
  `,
  standalone: false
})
class TestComponent {}

describe('TemplateContextDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let elementsWithDirective: DebugElement[];
  let bareElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TemplateContextDirective, TestComponent]
    });
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    elementsWithDirective = fixture.debugElement.queryAll(
      By.directive(TemplateContextDirective)
    );
    bareElement = fixture.debugElement.query(By.css(':not([templateContext])'));
  });

  it('should have bare element', () => {
    expect(bareElement).toBeTruthy();
  });

  it('should have 1 element(s) with directive', () => {
    expect(elementsWithDirective.length).toBe(1);
  });
});
