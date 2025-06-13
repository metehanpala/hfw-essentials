import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MockTraceService, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { TranslateService, TranslateStore } from '@ngx-translate/core';
import { TranslateServiceStub } from 'projects/trend/src/search/search.component.spec';
import { of } from 'rxjs';

import { GmsTrendSnapInModule } from '../gms-trend-snapin.module';
import { TrendSnapinService } from '../services/trend-snapin.service';
import { GeneralSettingsComponent as TestComponent } from './general-settings.component';

describe('GeneralSettingsComponent', () => {

  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let trendSnapinServiceSpy = jasmine.createSpyObj('TrendSnapinService', ['getGenSettings']);
  trendSnapinServiceSpy.getGenSettings = of('');
  beforeEach(waitForAsync(() => {
    trendSnapinServiceSpy = jasmine.createSpyObj('TrendSnapinService', ['getGenSettings']);
    TestBed.configureTestingModule({
      declarations: [],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      imports: [GmsTrendSnapInModule],
      providers: [
        { provide: TranslateService, useClass: TranslateServiceStub },
        { provide: TraceService, useValue: MockTraceService },
        { provide: TrendSnapinService, useValue: trendSnapinServiceSpy }
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        // fixture.detectChanges();
      });

  }));

  it('should create', () => {
    // expect(component).toBeTruthy();
  });
});
