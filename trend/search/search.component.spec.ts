import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { HfwControlsModule } from '@gms-flex/controls';
import { BrowserObject, CnsHelperService, SystemBrowserServiceBase,
  TrendServiceBase, TrendViewDefinition, TrendViewDefinitionUpdate } from '@gms-flex/services';
import { MockTraceService, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { GmsTrendSnapInModule } from '../gms-trend-snapin.module';
import { TrendSnapinService } from '../services/trend-snapin.service';
import { SearchViewComponent } from './search.component';
export class TranslateServiceStub {
  public get(key: any): Observable<any> {
    return of(key);
  }
}
describe('SearchViewComponent', () => {
  let component: SearchViewComponent;
  let fixture: ComponentFixture<SearchViewComponent>;
  let trendSnapinServiceSpy;
  let cnsHelperServiceSpy;

  beforeEach(waitForAsync(() => {
    trendSnapinServiceSpy = jasmine.createSpyObj('TrendSnapinService', ['GetConfigureRights', 'displayType']);
    cnsHelperServiceSpy = jasmine.createSpyObj('CnsHelperService', ['activeCnsLabel']);
    cnsHelperServiceSpy.activeCnsLabel = of('');
    trendSnapinServiceSpy.displayType = of('');
    TestBed.configureTestingModule({
      declarations: [],
      imports: [GmsTrendSnapInModule],
      providers: [
        { provide: TrendSnapinService, useValue: trendSnapinServiceSpy },
        { provide: CnsHelperService, useValue: cnsHelperServiceSpy },
        { provide: TranslateService, useClass: TranslateServiceStub }
      ]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(SearchViewComponent);
        component = fixture.componentInstance;
        // fixture.detectChanges();
      });
  }));

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
