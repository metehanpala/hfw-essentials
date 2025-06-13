import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { animationFrameScheduler } from 'rxjs';
import { SiLoadingSpinnerModule } from '@simpl/element-ng';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AppSettingsService, MockAppSettingsService, TraceService } from '@gms-flex/services-common';

import { HeaderTemplateDirective } from '../templates/header-template.directive';
import { ItemTemplateDirective } from '../templates/item-template.directive';
import { LoaderTemplateDirective } from '../templates/loader-template.directive';
import { TemplateContextDirective } from '../templates/template-context.directive';
import { TilesViewComponent } from './tiles-view.component';

const TEMPLATE_DIRECTIVES: any[] = [
  ItemTemplateDirective,
  HeaderTemplateDirective,
  TemplateContextDirective,
  LoaderTemplateDirective
];

describe('TilesViewComponent', () => {
  let component: TilesViewComponent;
  let fixture: ComponentFixture<TilesViewComponent>;
  const traceServiceStub: any = {
    info: () => ({}),
    debug: () => ({})
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TEMPLATE_DIRECTIVES,
        TilesViewComponent
      ],
      imports: [
        SiLoadingSpinnerModule,
        ScrollingModule
      ],
      providers: [HttpClient, HttpHandler, { provide: TraceService, useValue: traceServiceStub },
        { provide: AppSettingsService, useClass: MockAppSettingsService },
        { provide: 'appSettingFilePath', useValue: 'noMatter' }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TilesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('default values are set', () => {
    expect(component.className).toBeTrue();
    expect(component.isVirtual).toBeFalse();
    expect(component.loading).toBeFalse();
    // default tile width from large config
    expect(component.tilesSettings.tileWidth).toBe(320);
  });

  it('applies tileSize changes', () => {
    component.tileSize = 's';
    expect(component.tilesSettings.tileWidth).toBe(240);
    expect(component.rowHeight).toBe(component.tilesSettings.tileHeight + 2 * component.tilesSettings.topBottomMargin);
  });

  it('ignores invalid tileSize', () => {
    component.tileSize = 'x' as any;
    expect(component.tilesSettings.tileWidth).toBe(320);
    expect(component.rowHeight).toBe(216);
  });

  it('items getter returns correct values', () => {
    component.data = [1, 2, 3];
    expect(component.items.length).toBe(3);
    component.data = { data: [1], total: 1 };
    expect(component.items.length).toBe(1);
  });

  it('calculateRows builds rows according to container width', () => {
    component.container = { nativeElement: { clientWidth: 960 } } as any;
    component.data = [1,2,3,4,5,6,7,8,9,10];
    component.tileSize = 's';
    expect(component.itemsPerRow).toBe(3);
    expect(component.rows.length).toBe(4);
    expect(component.rows[0].length).toBe(3);
    expect(component.rows[3].length).toBe(1);
  });

  it('ngOnChanges recalculates rows when data changes', () => {
    const spy = spyOn(component, 'calculateRows');
    component.ngOnChanges({ data: new SimpleChange([], [1], false) });
    expect(spy).toHaveBeenCalled();
  });

  it('onResize triggers calculation', () => {
    const spy = spyOn(component, 'calculateRows');
    component.onResize();
    expect(spy).toHaveBeenCalled();
  });

  it('trackByIndex returns the index', () => {
    expect(component.trackByIndex(5)).toBe(5);
  });

  it('getScrollTop returns container scroll when not virtual', () => {
    component.container = { nativeElement: { scrollTop: 42 } } as any;
    component.isVirtual = false;
    expect(component.getScrollTop()).toBe(42);
  });

  it('getScrollTop returns viewport scroll when virtual', () => {
    component.isVirtual = true;
    component.viewport = { measureScrollOffset: () => 99 } as any;
    expect(component.getScrollTop()).toBe(99);
  });

  it('scrollTo uses viewport when virtual', () => {
    const spy = jasmine.createSpy('scrollTo');
    component.isVirtual = true;
    component.viewport = { scrollToOffset: spy } as any;
    component.scrollTo(120);
    expect(spy).toHaveBeenCalledWith(120);
  });

  it('scrollTo uses container when not virtual', () => {
    const el = { scrollTop: 0 };
    component.isVirtual = false;
    component.container = { nativeElement: el } as any;
    component.scrollTo(55);
    expect(el.scrollTop).toBe(55);
  });

  it('onBeforeAttach restores container scroll and recalculates rows', () => {
    const el = { scrollTop: 40 };
    component.isVirtual = false;
    component.container = { nativeElement: el } as any;
    const calcSpy = spyOn(component, 'calculateRows');
    spyOn(animationFrameScheduler, 'schedule').and.callFake((cb: any) => cb());
    component.onBeforeAttach();
    expect(calcSpy).toHaveBeenCalled();
    expect(el.scrollTop).toBe(40);
  });

  it('onBeforeAttach restores viewport scroll when virtual', () => {
    const scrollSpy = jasmine.createSpy('scrollToOffset');
    const checkSpy = jasmine.createSpy('checkViewportSize');
    component.isVirtual = true;
    component.viewport = {
      measureScrollOffset: () => 75,
      scrollToOffset: scrollSpy,
      checkViewportSize: checkSpy
    } as any;
    const calcSpy = spyOn(component, 'calculateRows');
    spyOn(animationFrameScheduler, 'schedule').and.callFake((cb: any) => cb());
    component.onBeforeAttach();
    expect(scrollSpy).toHaveBeenCalledWith(75);
    expect(checkSpy).toHaveBeenCalled();
    expect(calcSpy).toHaveBeenCalled();
  });

  it('renders virtual scroll viewport when enabled', () => {
    component.isVirtual = true;
    component.data = [1, 2, 3];
    component.container = { nativeElement: { clientWidth: 500 } } as any;
    component.calculateRows();
    fixture.detectChanges();
    const viewport = fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport');
    expect(viewport).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.hfw-tile-row').length).toBeGreaterThan(0);
  });

  it('does not render virtual scroll viewport when disabled', () => {
    component.isVirtual = false;
    fixture.detectChanges();
    const viewport = fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport');
    expect(viewport).toBeNull();
  });

  it('calculateRows checks viewport size when virtual', () => {
    const checkSpy = jasmine.createSpy('checkViewportSize');
    component.isVirtual = true;
    component.viewport = { checkViewportSize: checkSpy } as any;
    component.container = { nativeElement: { clientWidth: 500 } } as any;
    component.data = [1, 2, 3];
    spyOn(animationFrameScheduler, 'schedule').and.callFake((cb: any) => cb());
    component.calculateRows();
    expect(checkSpy).toHaveBeenCalled();
  });

  it('initializes ResizeObserver in ngAfterViewInit', () => {
    let callback: () => void;
    const observeSpy = jasmine.createSpy('observe');
    const MockResizeObserver = class {
      constructor(cb: () => void) { callback = cb; }
      observe = observeSpy;
      disconnect() {}
    };
    (window as any).ResizeObserver = MockResizeObserver as any;
    fixture = TestBed.createComponent(TilesViewComponent);
    component = fixture.componentInstance;
    const calcSpy = spyOn(component, 'calculateRows');
    fixture.detectChanges();
    expect(observeSpy).toHaveBeenCalled();
    callback!();
    expect(calcSpy).toHaveBeenCalledTimes(2); // initial + observer callback
    delete (window as any).ResizeObserver;
  });
});
