import { CdkPortal } from '@angular/cdk/portal';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GmsServicesModule } from '@gms-flex/services';
import { AppSettingsService, MockTraceService, TraceService } from '@gms-flex/services-common';
import { TranslateStore } from '@ngx-translate/core';

import { GmsTrendSnapInModule } from '../gms-trend-snapin.module';
import { TrendHostComponent } from './trend-host.component';

describe('TrendHostComponent', () => {
  let component: TrendHostComponent;
  let fixture: ComponentFixture<TrendHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GmsTrendSnapInModule, GmsServicesModule],
      declarations: [TrendHostComponent],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        TranslateStore,
        AppSettingsService,
        { provide: 'appSettingFilePath', useValue: 'noMatter' },
        CdkPortal

      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TrendHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
