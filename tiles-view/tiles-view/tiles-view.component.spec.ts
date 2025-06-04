import { HttpClient, HttpHandler } from '@angular/common/http';
import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AppSettingsService, MockAppSettingsService, TraceService } from '@gms-flex/services-common';
import { SiLoadingSpinnerModule } from '@simpl/element-ng';

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
    info: (arg1: any, string2: any) => ({}),
    debug: (arg1: any, string2: any, systemNumber3: any) => ({})
  };
  const simpleChangesStub: any = new SimpleChange(1, 2, true);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TEMPLATE_DIRECTIVES,
        TilesViewComponent],
      imports: [
        // CommonModule,
        SiLoadingSpinnerModule
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

  // it('call init method', () => {
  //   component.init(0);
  //   expect(component.totalHeight).toEqual(0);
  // });

  it(`className has default value`, () => {
    expect(component.className).toEqual(true);
  });

  it(`isVirtual has default value`, () => {
    expect(component.isVirtual).toEqual(false);
  });

  it(`loading has default value`, () => {
    expect(component.loading).toEqual(false);
  });

  it(`pageSize has default value`, () => {
    expect(component.pageSize).toEqual(20);
  });

  it(`skip has default value`, () => {
    expect(component.skip).toEqual(0);
  });

  it(`placeHolders has default value`, () => {
    expect(component.placeHolders).toEqual([]);
  });

  it('call tileSize property', () => {
    component.tileSize = 'm';
    expect(component.tilesSettings.tileWidth).toEqual(280);
  });

  it('call tileSize property with empty value', () => {
    component.tileSize = '';
    expect(component.tilesSettings.tileWidth).toEqual(320);
  });

  it('call total property', () => {
    expect(component.total).toEqual(0);
  });

  it('call items property', () => {
    expect(component.items.length).toEqual(0);
  });

  it('call calculatePlaceholders method', () => {
    component.calculatePlaceholders();
    expect(component.placeHolders.length).toEqual(0);
  });

  it('call calculatePlaceholders method with initiale value', () => {
    component.itemsPerRow = 5;
    component.skip = 2;
    component.calculatePlaceholders();
    expect(component.placeHolders.length).toEqual(2);
  });

  it('call notPendingPageChangeForResize method', () => {
    component.notPendingPageChangeForResize();
    expect(component.total).toEqual(0);
  });

  it('call getScrollTop method', () => {
    expect(component.getScrollTop()).toEqual(0);
  });

  it('call isChangedTileSizeOrSkip method', () => {
    component.isVirtual = true;
    component.isChangedTileSizeOrSkip(simpleChangesStub);
    expect(component.container.nativeElement.scrollTop).toEqual(0);
  });

  it('call ngOnChanges method', () => {
    component.isVirtual = true;
    component.ngOnChanges(simpleChangesStub);
    expect(component.container.nativeElement.scrollTop).toEqual(0);
  });

});
