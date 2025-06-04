import { EventEmitter } from 'stream';

import { ChangeDetectorRef, Component, DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, fakeAsync, flushMicrotasks, inject, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { SizeClass } from './size.model';
import { SplitterComponent } from './splitter.component';

const mmToPx = (value: number): number => (value * 960 / 254);

const cmToPx = (value: number): number => (value * 9600 / 254);

const ptToPx = (value: number): number => (value * 96 / 72);

const inToPx = (value: number): number => (value * 96);

class MockElementRef implements ElementRef {
  public nativeElement: any = {};
}

const cdr: any = {
  detectChanges: () => {
    // to do
  }
};

describe('Splitter component', () => {
  let fixture: ComponentFixture<SplitterComponent>;
  let component: SplitterComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ChangeDetectorRef, useValue: cdr },
        { provide: TraceService, useClass: MockTraceService },
        SplitterComponent,
        { provide: ElementRef, useClass: MockElementRef }]
    }).compileComponents();

    fixture = TestBed.createComponent(SplitterComponent);
    component = fixture.componentInstance;
  });

  it('Check splitterDraggingActive propery', () => {
    component.splitterDraggingActive = true;
    expect(component.splitterDraggingActive).toBeTrue();

    component.splitterDraggingActive = false;
    expect(component.splitterDraggingActive).toBeFalse();
  });

  it('Check onTouchStartSplitterBar propery', () => {
    const tabset = fixture.debugElement.query(By.css('div[name="gms-controls-splitter-bar"]'));
    const touchstart = new MouseEvent('touchstart');
    const spy = spyOn(component as any, 'onStartDraggingSplitterBar');
    tabset.nativeElement.dispatchEvent(touchstart);

    component.onTouchStartSplitterBar(touchstart);
    expect(spy).toHaveBeenCalled();
  });

  it('Check onMouseDownSplitterBar propery', () => {
    const tabset = fixture.debugElement.query(By.css('div[name="gms-controls-splitter-button"]'));
    const touchstart = new MouseEvent('mousedown');
    const spyTry = spyOn(component as any, 'onStartDraggingSplitterBar');
    tabset.nativeElement.dispatchEvent(touchstart);
    component.firstPaneClosed = true;

    component.onMouseDownSplitterBar(touchstart);
    expect(spyTry).not.toHaveBeenCalled();
  });

  // onMouseUp
  it('Check onMouseUp propery', () => {
    const tabset = fixture.debugElement.query(By.css('div[name="gms-controls-splitter-button"]'));
    const mouseup = new MouseEvent('mouseup');
    const mousedown = new MouseEvent('mousedown');
    const spyTry = spyOn(component.splitterChange, 'emit');
    tabset.nativeElement.dispatchEvent(mousedown);

    component.onMouseUp(mouseup);
    expect(spyTry).toHaveBeenCalledTimes(1);
  });

  // onTouchEnd
  it('Check onMouseUp propery', () => {
    const tabset = fixture.debugElement.query(By.css('div[name="gms-controls-splitter-button"]'));
    const mouseup = new MouseEvent('mouseup');
    const mousedown = new MouseEvent('mousedown');
    tabset.nativeElement.dispatchEvent(mousedown);

    component.onTouchEnd(mouseup);
    expect(component.splitterDraggingActive).toBeFalse();
  });

  it('Check secondPaneClosed propery', () => {

    component.secondPaneClosed = true;
    expect(component.secondPaneClosed).toBeTrue();

    component.secondPaneClosed = false;
    expect(component.secondPaneClosed).toBeFalse();
  });

  it('Check hideSplitterBarWhenPaneCollapsed propery', () => {

    component.hideSplitterBarWhenPaneCollapsed = true;
    expect(component.hideSplitterBarWhenPaneCollapsed).toBeTrue();

    component.hideSplitterBarWhenPaneCollapsed = false;
    expect(component.hideSplitterBarWhenPaneCollapsed).toBeFalse();
  });

  it('Check collapsed pane', inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
    expect(splitterComponent.paneCollapsed).toBeFalsy();
    // expect(splitterComponent.firstPaneCollapsed).toBeFalsy();
    // expect(splitterComponent.secondPaneCollapsed).toBeFalsy();
    expect(splitterComponent.collapsingPane).toEqual('First');
    expect(splitterComponent.splitterBarHidden).toBeFalsy();

    splitterComponent.paneCollapsed = true;
    expect(splitterComponent.paneCollapsed).toBeTruthy();
    // expect(splitterComponent.firstPaneCollapsed).toBeTruthy();
    // expect(splitterComponent.secondPaneCollapsed).toBeFalsy();
    expect(splitterComponent.collapsingPane).toEqual('First');
    expect(splitterComponent.splitterBarHidden).toBeFalsy();

    splitterComponent.collapsingPane = 'seconddd';
    expect(splitterComponent.collapsingPane).toEqual('First');
    splitterComponent.collapsingPane = undefined!;
    expect(splitterComponent.collapsingPane).toEqual('First');

    splitterComponent.collapsingPane = 'Second';
    expect(splitterComponent.collapsingPane).toEqual('Second');
    expect(splitterComponent.paneCollapsed).toBeTruthy();
    // expect(splitterComponent.firstPaneCollapsed).toBeFalsy();
    // expect(splitterComponent.secondPaneCollapsed).toBeTruthy();

    splitterComponent.paneCollapsed = false;
    expect(splitterComponent.paneCollapsed).toBeFalsy();
    // expect(splitterComponent.firstPaneCollapsed).toBeFalsy();
    // expect(splitterComponent.secondPaneCollapsed).toBeFalsy();
  }));

  it('Check splitter orientation', inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
    expect(splitterComponent.orientation).toEqual('Vertical');

    splitterComponent.orientation = 'Horizontal';
    splitterComponent.orientation = undefined!; // no influence allowed
    expect(splitterComponent.orientation).toEqual('Horizontal');
    expect(splitterComponent.isOrientationVertical).toBeFalsy();

    splitterComponent.orientation = 'Verticallll';
    expect(splitterComponent.orientation).not.toEqual('Horizontal');
    expect(splitterComponent.isOrientationVertical).toBeFalsy();

    splitterComponent.orientation = 'Vertical';
    expect(splitterComponent.orientation).toEqual('Vertical');
    expect(splitterComponent.isOrientationVertical).toBeTruthy();
  }));

  it('Check hide splitter bar', inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
    expect(splitterComponent.hideSplitterBarWhenPaneCollapsed).toBeFalsy();

    splitterComponent.hideSplitterBarWhenPaneCollapsed = true;
    expect(splitterComponent.hideSplitterBarWhenPaneCollapsed).toBeTruthy();

    splitterComponent.firstPaneClosed = true;
    splitterComponent.secondPaneClosed = true;
    expect(splitterComponent.splitterBarHidden).toBeTruthy();

    splitterComponent.hideSplitterBarWhenPaneCollapsed = false;
    expect(splitterComponent.splitterBarHidden).toBeFalsy();
  }));

  it('Check pane size (vertical splitter)', inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
    const splitterCmp: any = splitterComponent;
    expect(splitterCmp.firstPaneSizeFlex).toEqual('0 0 200px');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('1');

    splitterComponent.paneCollapsed = true;
    expect(splitterCmp.secondPaneSizeFlex).toEqual('0 1 100%');
    // note: next statement does not make sense, however the value has no influence as the pane is collapsed.
    expect(splitterCmp.firstPaneSizeFlex).toEqual('0 1 100%');

    splitterComponent.paneCollapsed = false;
    splitterComponent.firstPaneSize = '300px';
    splitterComponent.firstPaneSize = undefined!; // no influence allowed
    expect(splitterCmp.firstPaneSizeFlex).toEqual('0 0 300px');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('1');

    splitterComponent.secondPaneSize = '400px';
    splitterComponent.secondPaneSize = undefined!; // no influence allowed
    expect(splitterCmp.firstPaneSizeFlex).toEqual('1');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('0 0 400px');

    splitterComponent.firstPaneSize = '30%';
    // we need to simulate a new calculation based on the sizes of both panes and the splitterbar width:
    const testVertical: SizeClass = {
      splitterClientWidth: 1100,
      splitterClientHeight: 600,
      firstPaneWidth: 300,
      firstPaneHeight: 600,
      secondPaneWidth: 700,
      secondPaneHeight: 600,
      splitterBarWidthCurrentPx: 100,
      splitterBarHeightCurrentPx: 600
    };
    splitterCmp.readCurrentPaneSize(testVertical);
    expect(splitterCmp.firstPaneSizeFlex).toEqual('0 1 30%');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('0 1 70%');

    splitterComponent.secondPaneSize = '40%';
    // we need to simulate a new calculation based on the sizes of both panes and the splitterbar width:
    const testVerticalNumberTwo: SizeClass = {
      splitterClientWidth: 1100,
      splitterClientHeight: 700,
      firstPaneWidth: 600,
      firstPaneHeight: 700,
      secondPaneWidth: 400,
      secondPaneHeight: 700,
      splitterBarWidthCurrentPx: 100,
      splitterBarHeightCurrentPx: 700
    };
    splitterCmp.readCurrentPaneSize(testVerticalNumberTwo);
    expect(splitterCmp.firstPaneSizeFlex).toEqual('0 1 60%');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('0 1 40%');

    splitterComponent.firstPaneSize = '500px';
    // we need to simulate a new calculation based on the sizes of both panes and the splitterbar width:
    const testVerticalNumberThree: SizeClass = {
      splitterClientWidth: 1000,
      splitterClientHeight: 700,
      firstPaneWidth: 500,
      firstPaneHeight: 700,
      secondPaneWidth: 450,
      secondPaneHeight: 700,
      splitterBarWidthCurrentPx: 50,
      splitterBarHeightCurrentPx: 700
    };
    splitterCmp.readCurrentPaneSize(testVerticalNumberThree);
    expect(splitterCmp.firstPaneSizeFlex).toEqual('0 0 500px');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('1');

    splitterComponent.secondPaneSize = '200px';
    // we need to simulate a new calculation based on the sizes of both panes and the splitterbar width:
    const testVerticalNumberFour: SizeClass = {
      splitterClientWidth: 1000,
      splitterClientHeight: 700,
      firstPaneWidth: 750,
      firstPaneHeight: 700,
      secondPaneWidth: 200,
      secondPaneHeight: 700,
      splitterBarWidthCurrentPx: 50,
      splitterBarHeightCurrentPx: 700
    };
    splitterCmp.readCurrentPaneSize(testVerticalNumberFour);
    expect(splitterCmp.firstPaneSizeFlex).toEqual('1');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('0 0 200px');
  }));

  it('Check pane size (horizontal splitter)', inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
    splitterComponent.orientation = 'horizontal';
    const splitterCmp: any = splitterComponent;
    expect(splitterCmp.firstPaneSizeFlex).toEqual('0 0 200px');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('1');

    splitterComponent.paneCollapsed = true;
    expect(splitterCmp.secondPaneSizeFlex).toEqual('0 1 100%');
    // note next statement does not make sense, however the value has no influence as the pane is collapsed.
    expect(splitterCmp.secondPaneSizeFlex).toEqual('0 1 100%');

    splitterComponent.paneCollapsed = false;
    splitterComponent.firstPaneSize = '300px';
    expect(splitterCmp.firstPaneSizeFlex).toEqual('0 0 300px');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('1');

    splitterComponent.secondPaneSize = '400px';
    expect(splitterCmp.firstPaneSizeFlex).toEqual('1');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('0 0 400px');

    splitterComponent.firstPaneSize = '30%';
    // we need to simulate a new calculation based on the sizes of both panes and the splitterbar width:
    const test: SizeClass = {
      splitterClientWidth: 1000,
      splitterClientHeight: 550,
      firstPaneWidth: 1000,
      firstPaneHeight: 150,
      secondPaneWidth: 1000,
      secondPaneHeight: 350,
      splitterBarWidthCurrentPx: 1000,
      splitterBarHeightCurrentPx: 50
    };
    splitterCmp.readCurrentPaneSize(test);
    expect(splitterCmp.firstPaneSizeFlex).toEqual('0 1 30%');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('0 1 70%');

    splitterComponent.secondPaneSize = '40%';
    // we need to simulate a new calculation based on the sizes of both panes and the splitterbar width:
    const testNumberTwo: SizeClass = {
      splitterClientWidth: 1000,
      splitterClientHeight: 550,
      firstPaneWidth: 1000,
      firstPaneHeight: 300,
      secondPaneWidth: 1000,
      secondPaneHeight: 200,
      splitterBarWidthCurrentPx: 1000,
      splitterBarHeightCurrentPx: 50
    };
    splitterCmp.readCurrentPaneSize(testNumberTwo);
    expect(splitterCmp.firstPaneSizeFlex).toEqual('0 1 60%');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('0 1 40%');

    splitterComponent.firstPaneSize = '200px';
    // we need to simulate a new calculation based on the sizes of both panes and the splitterbar width:
    const testNumberThree: SizeClass = {
      splitterClientWidth: 1000,
      splitterClientHeight: 550,
      firstPaneWidth: 1000,
      firstPaneHeight: 200,
      secondPaneWidth: 1000,
      secondPaneHeight: 300,
      splitterBarWidthCurrentPx: 1000,
      splitterBarHeightCurrentPx: 50
    };
    splitterCmp.readCurrentPaneSize(testNumberThree);
    expect(splitterCmp.firstPaneSizeFlex).toEqual('0 0 200px');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('1');

    splitterComponent.secondPaneSize = '100px';
    // we need to simulate a new calculation based on the sizes of both panes and the splitterbar width:
    const testNumberFour: SizeClass = {
      splitterClientWidth: 1000,
      splitterClientHeight: 550,
      firstPaneWidth: 1000,
      firstPaneHeight: 400,
      secondPaneWidth: 1000,
      secondPaneHeight: 100,
      splitterBarWidthCurrentPx: 1000,
      splitterBarHeightCurrentPx: 50
    };
    splitterCmp.readCurrentPaneSize(testNumberFour);
    expect(splitterCmp.firstPaneSizeFlex).toEqual('1');
    expect(splitterCmp.secondPaneSizeFlex).toEqual('0 0 100px');
  }));

  it('Check minimum splitter position', inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
    const splitterCmp: any = splitterComponent;
    expect(splitterCmp._minSplitterPositionFirstPanePx).toEqual(40);
    expect(splitterCmp._minSplitterPositionSecondPanePx).toEqual(40);

    splitterComponent.minSplitterPositionFirstPane = '100px';
    splitterComponent.minSplitterPositionFirstPane = undefined!; // no influence allowed
    expect(splitterCmp._minSplitterPositionFirstPanePx).toEqual(100);

    splitterComponent.minSplitterPositionSecondPane = '200px';
    splitterComponent.minSplitterPositionSecondPane = null!; // no influence allowed
    expect(splitterCmp._minSplitterPositionSecondPanePx).toEqual(200);

    splitterComponent.minSplitterPositionFirstPane = '100mm';
    expect(splitterCmp._minSplitterPositionFirstPanePx).toEqual(Math.round(mmToPx(100)));

    splitterComponent.minSplitterPositionSecondPane = '200mm';
    expect(splitterCmp._minSplitterPositionSecondPanePx).toEqual(Math.round(mmToPx(200)));

    splitterComponent.minSplitterPositionFirstPane = '100cm';
    expect(splitterCmp._minSplitterPositionFirstPanePx).toEqual(Math.round(cmToPx(100)));

    splitterComponent.minSplitterPositionSecondPane = '200cm';
    expect(splitterCmp._minSplitterPositionSecondPanePx).toEqual(Math.round(cmToPx(200)));

    splitterComponent.minSplitterPositionFirstPane = '100in';
    expect(splitterCmp._minSplitterPositionFirstPanePx).toEqual(Math.round(inToPx(100)));

    splitterComponent.minSplitterPositionSecondPane = '200in';
    expect(splitterCmp._minSplitterPositionSecondPanePx).toEqual(Math.round(inToPx(200)));

    splitterComponent.minSplitterPositionFirstPane = '100pt';
    expect(splitterCmp._minSplitterPositionFirstPanePx).toEqual(Math.round(ptToPx(100)));

    splitterComponent.minSplitterPositionSecondPane = '200pt';
    expect(splitterCmp._minSplitterPositionSecondPanePx).toEqual(Math.round(ptToPx(200)));

    splitterComponent.minSplitterPositionFirstPane = '100';
    expect(splitterCmp._minSplitterPositionFirstPanePx).toEqual(100);

    splitterComponent.minSplitterPositionSecondPane = '200';
    expect(splitterCmp._minSplitterPositionSecondPanePx).toEqual(200);
  }));

  // it("Check dragging splitter bar (vertical splitter - percentage)", inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
  //   splitterComponent.firstPaneSize = "30%";
  //   let splitterCmp: any = splitterComponent;
  //   let splitterWidth: number = 1100;
  //   let splitterHeight: number = 600;
  //   let paneFirstWidth: number = 300;
  //   let paneFirstHeight: number = splitterHeight;
  //   let paneSecondWidth: number = 700;
  //   let paneSecondHeight: number = splitterHeight;
  //   let splitterBarWidth: number = 100;
  //   let splitterBarHeight: number = splitterHeight;

  //   let eventMouseDown: any = {
  //     currentTarget:
  //     {
  //       parentElement: { clientWidth: splitterWidth, clientHeight: splitterHeight },
  //       previousElementSibling: { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //       nextElementSibling: { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight },
  //       clientWidth: splitterBarWidth,
  //       clientHeight: splitterBarHeight
  //     }
  //   };

  //   splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //   expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //   expect(splitterCmp.splitterDragBarRelativePosition).toEqual("0px");

  //   let eventMouseUp: any = {
  //     currentTarget:
  //     {
  //       clientWidth: splitterWidth,
  //       clientHeight: splitterHeight,
  //       children: [{}, { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight }]
  //     }
  //   };
  //   splitterCmp.onMouseUp(eventMouseUp);
  //   expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //   splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //   expect(splitterCmp.splitterDraggingActive).toBeTruthy();

  //   // check the pane size, must still be the same
  //   expect(splitterCmp.firstPaneSizeFlex).toEqual("0 1 30%");
  //   expect(splitterCmp.secondPaneSizeFlex).toEqual("0 1 70%");

  //   // Note: current target is the splitter!
  //   splitterCmp._previousMouseEvent.clientX = 0;
  //   let eventMouseMouve: any = {
  //     movementX: -100,
  //     clientX: -100,
  //     currentTarget:
  //     {
  //       clientWidth: splitterWidth,
  //       clientHeight: splitterHeight,
  //       children: [
  //         { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //         { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight },
  //         { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight }
  //       ]
  //     }
  //   };

  //   splitterCmp.onMouseMove(eventMouseMouve);
  //   expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //   expect(splitterCmp.splitterDragBarRelativePosition).toEqual("-100px");

  //   splitterCmp.onMouseUp(eventMouseUp);
  //   expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //   expect(splitterCmp.firstPaneSizeFlex).toEqual("0 1 20%");
  //   expect(splitterCmp.secondPaneSizeFlex).toEqual("0 1 80%");
  // }));

  // it("Check dragging splitter bar (horizontal splitter - percentage)",
  //   inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
  //   splitterComponent.orientation = "horizontal";
  //   splitterComponent.firstPaneSize = "30%";
  //   let splitterCmp: any = splitterComponent;
  //   let splitterWidth: number = 1100;
  //   let splitterHeight: number = 550;
  //   let paneFirstWidth: number = splitterWidth;
  //   let paneFirstHeight: number = 150;
  //   let paneSecondWidth: number = splitterWidth;
  //   let paneSecondHeight: number = 350;
  //   let splitterBarWidth: number = splitterWidth;
  //   let splitterBarHeight: number = 50;

  //   let eventMouseDown: any = {
  //     currentTarget:
  //     {
  //       parentElement: { clientWidth: splitterWidth, clientHeight: splitterHeight },
  //       previousElementSibling: { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //       nextElementSibling: { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight },
  //       clientWidth: splitterBarWidth,
  //       clientHeight: splitterBarHeight
  //     }
  //   };
  //   splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //   expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //   expect(splitterCmp.splitterDragBarRelativePosition).toEqual("0px");

  //   let eventMouseUp: any = {
  //     currentTarget:
  //     {
  //       clientWidth: splitterWidth,
  //       clientHeight: splitterHeight,
  //       children: [{}, { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight }]
  //     }
  //   };
  //   splitterCmp.onMouseUp(eventMouseUp);
  //   expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //   splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //   expect(splitterCmp.splitterDraggingActive).toBeTruthy();

  //   // check the pane size, must still be the same
  //   expect(splitterCmp.firstPaneSizeFlex).toEqual("0 1 30%");
  //   expect(splitterCmp.secondPaneSizeFlex).toEqual("0 1 70%");

  //   // Note: current target is the splitter!
  //   splitterCmp._previousMouseEvent.clientY = 0;
  //   let eventMouseMouve: any = {
  //     movementY: 50,
  //     clientY: 50,
  //     currentTarget:
  //     {
  //       clientWidth: splitterWidth,
  //       clientHeight: splitterHeight,
  //       children: [
  //         { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //         { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight },
  //         { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight }
  //       ]
  //     }
  //   };

  //   splitterCmp.onMouseMove(eventMouseMouve);
  //   expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //   expect(splitterCmp.splitterDragBarRelativePosition).toEqual("50px");

  //   splitterCmp.onMouseUp(eventMouseUp);
  //   expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //   expect(splitterCmp.firstPaneSizeFlex).toEqual("0 1 40%");
  //   expect(splitterCmp.secondPaneSizeFlex).toEqual("0 1 60%");
  // }));

  // it("Check dragging splitter bar (vertical splitter - absolute px)",
  //     inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
  //     splitterComponent.firstPaneSize = "300px";
  //     let splitterCmp: any = splitterComponent;
  //     let splitterWidth: number = 1100;
  //     let splitterHeight: number = 600;
  //     let paneFirstWidth: number = 300;
  //     let paneFirstHeight: number = splitterHeight;
  //     let paneSecondWidth: number = 700;
  //     let paneSecondHeight: number = splitterHeight;
  //     let splitterBarWidth: number = 100;
  //     let splitterBarHeight: number = splitterHeight;

  //     let eventMouseDown: any = {
  //         currentTarget:
  //         {
  //             parentElement: { clientWidth: splitterWidth, clientHeight: splitterHeight },
  //             previousElementSibling: { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //             nextElementSibling: { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight },
  //             clientWidth: splitterBarWidth,
  //             clientHeight: splitterBarHeight
  //         }
  //     };
  //     splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //     expect(splitterCmp.splitterDragBarRelativePosition).toEqual("0px");

  //     let eventMouseUp: any = {
  //         currentTarget:
  //         {
  //             clientWidth: splitterWidth,
  //             clientHeight: splitterHeight,
  //             children: [{}, { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight }]
  //         }
  //     };
  //     splitterCmp.onMouseUp(eventMouseUp);
  //     expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //     splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();

  //     // check the pane size, must still be the same
  //     expect(splitterCmp.firstPaneSizeFlex).toEqual("0 0 300px");
  //     expect(splitterCmp.secondPaneSizeFlex).toEqual("1");

  //     // Note: current target is the splitter!
  //     splitterCmp._previousMouseEvent.clientX = 0;
  //     let eventMouseMouve: any = {
  //         movementX: -100,
  //         clientX: -100,
  //         currentTarget:
  //         {
  //             clientWidth: splitterWidth,
  //             clientHeight: splitterHeight,
  //             children: [
  //                 { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //                 { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight },
  //                 { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight }
  //             ]
  //         }
  //     };

  //     splitterCmp.onMouseMove(eventMouseMouve);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //     expect(splitterCmp.splitterDragBarRelativePosition).toEqual("-100px");

  //     splitterCmp.onMouseUp(eventMouseUp);
  //     expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //     expect(splitterCmp.firstPaneSizeFlex).toEqual("0 0 200px");
  //     expect(splitterCmp.secondPaneSizeFlex).toEqual("1");
  // }));

  // it("Check dragging splitter bar (horizontal splitter - absolute px)",
  //     inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
  //     splitterComponent.orientation = "horizontal";
  //     splitterComponent.firstPaneSize = "200px";
  //     let splitterCmp: any = splitterComponent;
  //     let splitterWidth: number = 1000;
  //     let splitterHeight: number = 550;
  //     let paneFirstWidth: number = splitterWidth;
  //     let paneFirstHeight: number = 200;
  //     let paneSecondWidth: number = splitterWidth;
  //     let paneSecondHeight: number = 300;
  //     let splitterBarWidth: number = splitterWidth;
  //     let splitterBarHeight: number = 50;

  //     let eventMouseDown: any = {
  //         currentTarget:
  //         {
  //             parentElement: { clientWidth: splitterWidth, clientHeight: splitterHeight },
  //             previousElementSibling: { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //             nextElementSibling: { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight },
  //             clientWidth: splitterBarWidth,
  //             clientHeight: splitterBarHeight
  //         }
  //     };
  //     splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //     expect(splitterCmp.splitterDragBarRelativePosition).toEqual("0px");

  //     let eventMouseUp: any = {
  //         currentTarget:
  //         {
  //             clientWidth: splitterWidth,
  //             clientHeight: splitterHeight,
  //             children: [{}, { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight }]
  //         }
  //     };
  //     splitterCmp.onMouseUp(eventMouseUp);
  //     expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //     splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();

  //     // check the pane size, must still be the same
  //     expect(splitterCmp.firstPaneSizeFlex).toEqual("0 0 200px");
  //     expect(splitterCmp.secondPaneSizeFlex).toEqual("1");

  //     // Note: current target is the splitter!
  //     splitterCmp._previousMouseEvent.clientY = 0;
  //     let eventMouseMouve: any = {
  //         movementY: 50,
  //         clientY: 50,
  //         currentTarget:
  //         {
  //             clientWidth: splitterWidth,
  //             clientHeight: splitterHeight,
  //             children: [
  //                 { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //                 { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight },
  //                 { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight }
  //             ]
  //         }
  //     };

  //     splitterCmp.onMouseMove(eventMouseMouve);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //     expect(splitterCmp.splitterDragBarRelativePosition).toEqual("50px");

  //     splitterCmp.onMouseUp(eventMouseUp);
  //     expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //     expect(splitterCmp.firstPaneSizeFlex).toEqual("0 0 250px");
  //     expect(splitterCmp.secondPaneSizeFlex).toEqual("1");
  // }));

  // it("Check dragging splitter bar (vertical splitter - absolute px - second pane size set)",
  //     inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
  //     splitterComponent.secondPaneSize = "300px";
  //     let splitterCmp: any = splitterComponent;
  //     let splitterWidth: number = 1100;
  //     let splitterHeight: number = 600;
  //     let paneFirstWidth: number = 700;
  //     let paneFirstHeight: number = splitterHeight;
  //     let paneSecondWidth: number = 300;
  //     let paneSecondHeight: number = splitterHeight;
  //     let splitterBarWidth: number = 100;
  //     let splitterBarHeight: number = splitterHeight;

  //     let eventMouseDown: any = {
  //         currentTarget:
  //         {
  //             parentElement: { clientWidth: splitterWidth, clientHeight: splitterHeight },
  //             previousElementSibling: { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //             nextElementSibling: { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight },
  //             clientWidth: splitterBarWidth,
  //             clientHeight: splitterBarHeight
  //         }
  //     };
  //     splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //     expect(splitterCmp.splitterDragBarRelativePosition).toEqual("0px");

  //     let eventMouseUp: any = {
  //         currentTarget:
  //         {
  //             clientWidth: splitterWidth,
  //             clientHeight: splitterHeight,
  //             children: [{}, { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight }]
  //         }
  //     };
  //     splitterCmp.onMouseUp(eventMouseUp);
  //     expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //     splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();

  //     // check the pane size, must still be the same
  //     expect(splitterCmp.firstPaneSizeFlex).toEqual("1");
  //     expect(splitterCmp.secondPaneSizeFlex).toEqual("0 0 300px");

  //     // Note: current target is the splitter!
  //     splitterCmp._previousMouseEvent.clientX = 0;
  //     let eventMouseMouve: any = {
  //         movementX: -100,
  //         clientX: -100,
  //         currentTarget:
  //         {
  //             clientWidth: splitterWidth,
  //             clientHeight: splitterHeight,
  //             children: [
  //                 { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //                 { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight },
  //                 { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight }
  //             ]
  //         }
  //     };

  //     splitterCmp.onMouseMove(eventMouseMouve);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //     expect(splitterCmp.splitterDragBarRelativePosition).toEqual("-100px");

  //     splitterCmp.onMouseUp(eventMouseUp);
  //     expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //     expect(splitterCmp.firstPaneSizeFlex).toEqual("1");
  //     expect(splitterCmp.secondPaneSizeFlex).toEqual("0 0 400px");
  // }));

  // it("Check dragging splitter bar (horizontal splitter - absolute px - second pane size set)",
  //     inject([SplitterComponent], (splitterComponent: SplitterComponent) => {
  //     splitterComponent.orientation = "horizontal";
  //     splitterComponent.secondPaneSize = "300px";
  //     let splitterCmp: any = splitterComponent;
  //     let splitterWidth: number = 1100;
  //     let splitterHeight: number = 550;
  //     let paneFirstWidth: number = splitterWidth;
  //     let paneFirstHeight: number = 200;
  //     let paneSecondWidth: number = splitterWidth;
  //     let paneSecondHeight: number = 300;
  //     let splitterBarWidth: number = splitterWidth;
  //     let splitterBarHeight: number = 50;

  //     let eventMouseDown: any = {
  //         currentTarget:
  //         {
  //             parentElement: { clientWidth: splitterWidth, clientHeight: splitterHeight },
  //             previousElementSibling: { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //             nextElementSibling: { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight },
  //             clientWidth: splitterBarWidth,
  //             clientHeight: splitterBarHeight
  //         }
  //     };
  //     splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //     expect(splitterCmp.splitterDragBarRelativePosition).toEqual("0px");

  //     let eventMouseUp: any = {
  //         currentTarget:
  //         {
  //             clientWidth: splitterWidth,
  //             clientHeight: splitterHeight,
  //             children: [{}, { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight }]
  //         }
  //     };
  //     splitterCmp.onMouseUp(eventMouseUp);
  //     expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //     splitterCmp.onMouseDownSplitterBar(eventMouseDown);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();

  //     // check the pane size, must still be the same
  //     expect(splitterCmp.firstPaneSizeFlex).toEqual("1");
  //     expect(splitterCmp.secondPaneSizeFlex).toEqual("0 0 300px");

  //     // Note: current target is the splitter!
  //     splitterCmp._previousMouseEvent.clientY = 0;
  //     let eventMouseMouve: any = {
  //         movementY: -100,
  //         clientY: -100,
  //         currentTarget:
  //         {
  //             clientWidth: splitterWidth,
  //             clientHeight: splitterHeight,
  //             children: [
  //                 { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
  //                 { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight },
  //                 { clientWidth: paneSecondWidth, clientHeight: paneSecondHeight }
  //             ]
  //         }
  //     };

  //     splitterCmp.onMouseMove(eventMouseMouve);
  //     expect(splitterCmp.splitterDraggingActive).toBeTruthy();
  //     expect(splitterCmp.splitterDragBarRelativePosition).toEqual("-100px");

  //     splitterCmp.onMouseUp(eventMouseUp);
  //     expect(splitterCmp.splitterDraggingActive).toBeFalsy();

  //     expect(splitterCmp.firstPaneSizeFlex).toEqual("1");
  //     expect(splitterCmp.secondPaneSizeFlex).toEqual("0 0 400px");
  // }));

});

// //// Test Host Component //////

@Component({
  template: `
      <hfw-splitter
      name="nestedSplitter"
      [orientation]="orientation"
      [firstPaneSize]="firstChildSize"
      [secondPaneSize]="secondChildSize"
      [hideSplitterBarWhenPaneCollapsed]="hideSplitterBarWhenPaneCollapsed"
      [firstPaneClosed]="firstPaneClosed"
      [secondPaneClosed]="secondPaneClosed"
      [collapsingPane]="collapsingPane"
      [beResponsive]="true"
      [isLocked]="isLayoutLocked"
      [ngStyle]="{ 'flex-direction':splitterStyleDirection}" />
    `,
  standalone: false
})
class TestHostComponent {

  public orientation = 'vertical';
  public firstChildSize = '60%';
  public secondChildSize = '40%';
  public hideSplitterBarWhenPaneCollapsed = false;
  public firstPaneClosed = false;
  public secondPaneClosed = false;
  public collapsingPane = 'second';
  public isLayoutLocked = false;

}
describe('Splitter component with TestHost', () => {

  let testHost: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let homeInstance: SplitterComponent;

  // async beforeEach
  // async beforeEach
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SplitterComponent, TestHostComponent],
      providers: [{ provide: ChangeDetectorRef, useValue: cdr },
        { provide: TraceService, useClass: MockTraceService },
        { provide: ElementRef, useClass: MockElementRef }] // declare the test component
    })
      .compileComponents(); // compile template and css
  }));

  // synchronous beforeEach
  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;
    fixture.detectChanges(); // trigger initial data binding
    homeInstance = fixture.debugElement.children[0].componentInstance;
  });

  it('should call SplitterComponent with TestHost', fakeAsync(() => {
    flushMicrotasks();

    // const evt: MouseEvent = document.createEvent("MouseEvent");

    // let splitterEl: DebugElement = fixture.debugElement.query(By.css(".hfw-flex-item-grow"));
    // splitterEl.triggerEventHandler("mousemove", {});
    // splitterEl.triggerEventHandler("mouseenter", evt);
    // splitterEl.triggerEventHandler("mousedown", evt);
    // splitterEl.triggerEventHandler("mouseup", evt);

    // const splitterWidth: number = 1100;
    // const splitterHeight: number = 550;
    // const paneFirstWidth: number = splitterWidth;
    // const paneFirstHeight: number = 150;
    // const paneSecondWidth: number = splitterWidth;
    // const paneSecondHeight: number = 350;
    // const splitterBarWidth: number = splitterWidth;
    // const splitterBarHeight: number = 50;

    // const eventMouseLeave: any = {
    //   currentTarget:
    //   {
    //     parentElement: {
    //       clientWidth: splitterWidth,
    //       clientHeight: splitterHeight
    //     },
    //     previousElementSibling: {
    //       clientWidth: paneFirstWidth,
    //       clientHeight: paneFirstHeight
    //     },
    //     nextElementSibling: {
    //       clientWidth: paneSecondWidth,
    //       clientHeight: paneSecondHeight
    //     },
    //     clientWidth: splitterBarWidth,
    //     clientHeight: splitterBarHeight,
    //     children: [
    //           { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
    //           { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight },
    //           { clientWidth: paneSecondWidth, clientHeight: paneSecondWidth }
    //         ]
    //   }
    // };
    // const eventTouchStart: any = {
    //   currentTarget:
    //   {
    //     parentElement: {
    //       clientWidth: splitterWidth,
    //       clientHeight: splitterHeight
    //     },
    //     previousElementSibling: {
    //       clientWidth: paneFirstWidth,
    //       clientHeight: paneFirstHeight
    //     },
    //     nextElementSibling: {
    //       clientWidth: paneSecondWidth,
    //       clientHeight: paneSecondHeight
    //     },
    //     clientWidth: splitterBarWidth,
    //     clientHeight: splitterBarHeight,
    //     children: [
    //           { clientWidth: paneFirstWidth, clientHeight: paneFirstHeight },
    //           { clientWidth: splitterBarWidth, clientHeight: splitterBarHeight },
    //           { clientWidth: paneSecondWidth, clientHeight: paneSecondWidth }
    //         ]
    //   }
    // };
    // splitterEl.triggerEventHandler("mouseleave", eventMouseLeave);

    // let type: string = "start"; // or move, end
    // const event: Event = document.createEvent("Event");
    // event.initEvent("touch" + type, true, true);

    // splitterEl = fixture.debugElement.query(By.css(".hfw-splitter-bar-mobile"));
    // splitterEl.triggerEventHandler("touchstart", eventTouchStart);
    // splitterEl.triggerEventHandler("mouseenter", evt);
    // splitterEl.triggerEventHandler("mousedown", evt);
    // splitterEl.triggerEventHandler("mouseleave", eventMouseLeave);

    // type = "move";
    // event.initEvent("touch" + type, true, true);
    // splitterEl = fixture.debugElement.query(By.css(".hfw-flex-item-grow"));
    // splitterEl.triggerEventHandler("touchmove", event);

    // type = "end";
    // event.initEvent("touch" + type, true, true);

    // splitterEl.triggerEventHandler("touchend", event);

    // splitterEl = fixture.debugElement.query(By.css(".hfw-flex-container-row"));
    // splitterEl.triggerEventHandler("mouseenter", evt);
    // splitterEl.triggerEventHandler("mousedown", evt);
    // splitterEl.triggerEventHandler("mouseleave", eventMouseLeave);

  }));

});
