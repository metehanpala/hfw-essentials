import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SiTrendviewerConfigService } from '@simpl/trendviewer-ng';

import { TrendDefinitionService } from '../services/trend-definition-service';
import { TrendExportComponent } from './trend-export.component';

describe('TrendExportComponent', () => {
  let component: TrendExportComponent;
  let fixture: ComponentFixture<TrendExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrendExportComponent],
      providers: [
        TrendDefinitionService,
        SiTrendviewerConfigService
      ], 
      imports: [HttpClientModule]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TrendExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
