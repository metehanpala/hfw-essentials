import { ElementRef, Renderer2 } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SiResizeObserverModule } from '@simpl/element-ng';

import { HfwTabComponent } from '../hfw-tab/hfw-tab.component';
import { HfwTabsetComponent } from './hfw-tabset.component';

describe('HfwTabContainer', () => {
  let fixture: ComponentFixture<HfwTabsetComponent>;
  let component: HfwTabsetComponent;
  const renderer: Renderer2 | null = null;
  const elementRef: ElementRef | null = null;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HfwTabsetComponent],
      imports: [TranslateModule, SiResizeObserverModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HfwTabsetComponent);
    component = fixture.componentInstance;
  }));

  describe('#TabContainer', () => {
    it('should test', waitForAsync(() => {
      expect(component).toBeTruthy();
      fixture.detectChanges();
      expect(component).toBeTruthy();
    }));
  });

  //   describe('#Tab', () => {
  //     it('should be possible to create a tabComponent instance', () => {
  //       expect(component.tabs.length).toEqual(0);

  //       const tab = new HfwTabComponent(component, renderer, elementRef);
  //       tab.heading = 'test';

  //       expect(tab).toBeDefined();
  //       expect(component.tabs.length).toEqual(1);
  //       expect(component.tabs[0]).toBe(tab);
  //       expect(component.tabs[0].active).toBe(true);
  //     });

  //     it('should be possible to add a few tabs to the tabComponent', () => {
  //       expect(component.tabs.length).toEqual(0);

  //       const tabs: HfwTabComponent[] = [
  //         new HfwTabComponent(component, renderer, elementRef),
  //         new HfwTabComponent(component, renderer, elementRef),
  //         new HfwTabComponent(component, renderer, elementRef)
  //       ];

  //       for (const tab of tabs) {
  //         expect(tab).toBeDefined();
  //         if (tab === component.tabs[0]) {
  //           expect(tab.active).toBe(true);
  //         } else {
  //           expect(tab.active).toBe(false);
  //         }
  //       }
  //       expect(component.tabs.length).toEqual(tabs.length);
  //     });

  //     it('should be possible to select a tab', () => {
  //       expect(component.tabs.length).toEqual(0);

  //       const tabs: HfwTabComponent[] = [
  //         new HfwTabComponent(component, renderer, elementRef),
  //         new HfwTabComponent(component, renderer, elementRef),
  //         new HfwTabComponent(component, renderer, elementRef)
  //       ];

  //       expect(component.tabs.length).toEqual(tabs.length);

  //       expect(component.tabs[0].active).toEqual(true);
  //       expect(component.tabs[1].active).toEqual(false);

  //       component.selectTab(tabs[1]);
  //       expect(component.tabs[0].active).toEqual(false);
  //       expect(component.tabs[1].active).toEqual(true);
  //     });

  //     it('should contain set selected tab index', () => {
  //       component.selectedTabIndex = component.tabs.length;
  //       fixture.detectChanges();
  //       expect(component.selectedTabIndex).toBe(component.tabs.length);
  //     });

  //     it('should trigger scrollfunctions', () => {
  //       component.scrollLeft();
  //       component.scrollRight();
  //       fixture.detectChanges();
  //       expect(component).toBeTruthy();
  //     });
  //   });

  it('should ignore tab selection with wrong input', () => {

    const tabs: HfwTabComponent[] = [
      new HfwTabComponent(component, renderer!, elementRef!),
      new HfwTabComponent(component, renderer!, elementRef!),
      new HfwTabComponent(component, renderer!, elementRef!)
    ];
    expect(component.tabs.length).toEqual(tabs.length);

    // expect(component.tabs[0].active).toEqual(true);
    expect(component.selectedTabIndex).toEqual(0);
    component.selectedTabIndex = 2;
    expect(component.selectedTabIndex).toEqual(2);
    component.selectedTabIndex = -2;
    expect(component.selectedTabIndex).toEqual(2);
    component.selectedTabIndex = 5;
    expect(component.selectedTabIndex).toEqual(2);
    component.selectedTabIndex = component.selectedTabIndex;
    expect(component.selectedTabIndex).toEqual(2);
  });

  it('should scroll to right', () => {
    const tabs: HfwTabComponent[] = [
      new HfwTabComponent(component, renderer!, elementRef!),
      new HfwTabComponent(component, renderer!, elementRef!),
      new HfwTabComponent(component, renderer!, elementRef!)
    ];
    expect(component.tabs.length).toEqual(tabs.length);
    const spy = spyOn(component, 'scrollRight').and.callThrough();
    component.scrollRight();
    expect(spy).toHaveBeenCalled();
  });

  it('should scroll to left', () => {
    const tabs: HfwTabComponent[] = [
      new HfwTabComponent(component, renderer!, elementRef!),
      new HfwTabComponent(component, renderer!, elementRef!),
      new HfwTabComponent(component, renderer!, elementRef!)
    ];
    expect(component.tabs.length).toEqual(tabs.length);

    const spy = spyOn(component, 'scrollLeft').and.callThrough();
    component.scrollLeft();
    expect(spy).toHaveBeenCalled();
  });
});
