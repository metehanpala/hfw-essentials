import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
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

  it(`className has default value`, () => {
    expect(component.className).toEqual(true);
  });

  it(`isVirtual has default value`, () => {
    expect(component.isVirtual).toEqual(false);
  });

  it(`loading has default value`, () => {
    expect(component.loading).toEqual(false);
  });

  it('call tileSize property', () => {
    component.tileSize = 'm';
    expect(component.tilesSettings.tileWidth).toEqual(280);
  });

  it('items getter works', () => {
    expect(component.items.length).toEqual(0);
  });
});
