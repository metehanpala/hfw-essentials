import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppSettingsService, MockTraceService, TraceService } from '@gms-flex/services-common';
import { of } from 'rxjs';

import { HldlReaderService } from './hldl-reader.service';

describe('HldlService', () => {
  let service: HldlReaderService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HldlReaderService,
        TraceService,
        AppSettingsService,
        { provide: 'appSettingFilePath', useValue: 'noMatter' },
        { provide: TraceService, useClass: MockTraceService }]
    });
    service = TestBed.inject(HldlReaderService);
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

});
