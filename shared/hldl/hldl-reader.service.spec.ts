import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppSettingsService, MockTraceService, TraceService } from '@gms-flex/services-common';
import { of, throwError } from 'rxjs';

import { TraceModules } from '../trace/trace-modules';
import { HldlReaderService } from './hldl-reader.service';

describe('HldlReaderService', () => {
  let service: HldlReaderService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let traceService: TraceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HldlReaderService,
        AppSettingsService,
        { provide: 'appSettingFilePath', useValue: 'noMatter' },
        { provide: TraceService, useClass: MockTraceService }
      ]
    });
    service = TestBed.inject(HldlReaderService);
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    traceService = TestBed.inject(TraceService)
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get HFW instance', () => {
    const profileName = 'DEFAULT.hldl.json';

    const fakeBaseProfile: any = {
      'hfwInstance': {
        'parentProfile': 'DEFAULT.hldl.json'
      }
    };

    // Subscribe to the request
    service.getHfwInstance(profileName).subscribe(response => {
      // Expect the response for testProfile request
      expect(response).toEqual(fakeBaseProfile);
    });

    // Use match() to handle both requests without specifying the order
    let requests = httpTestingController.match(req => req.url.includes('profiles/DEFAULT.hldl.json') ||
      req.url.includes('profiles/extensions/extension-profiles.json'));
    expect(requests.length).toBe(1); // Expecting request

    requests = []; // Flush the request for testProfile and extension profiles

    httpTestingController.verify(); // Verify that there are no remaining requests
  });

  it('should check if profile is loaded', () => {
    const profileFileName = 'testProfile.json';
    const mockExtensionProfileHandler = {
      extensionFileNamesRead: [profileFileName]
    };

    // Create a spy object for TraceService
    const traceServiceSpy = jasmine.createSpyObj('TraceService', ['debug']);

    // Replace the private extensionProfileHandler and traceService with the mocks
    const serviceWithMocks = new HldlReaderService(traceServiceSpy, httpClient);
    (serviceWithMocks as any).extensionProfileHandler = mockExtensionProfileHandler;

    const result = serviceWithMocks.hasLoadedProfile(profileFileName);

    expect(result).toBe(true);
    expect(traceServiceSpy.debug).toHaveBeenCalledWith(TraceModules.hldlReader, 'Hldl Reader Service created.');
  });

  it('should handle error in getHfwInstance method', () => {
    const profileFile = 'testProfile.json';
    const errorMessage = 'Http failure response for (unknown url): undefined undefined';
    const errorResponse = new HttpErrorResponse({ error: errorMessage }); // Create an error response with the error message

    // Create a spy object for TraceService
    const traceServiceSpy = jasmine.createSpyObj('TraceService', ['error', 'warn', 'debug']);

    // Create a new instance of HldlReaderService with the mock TraceService
    const serviceWithMock = new HldlReaderService(traceServiceSpy, httpClient);

    spyOn(httpClient, 'get').and.returnValue(throwError(errorResponse)); // Mock the HttpClient get method to return the error response

    let receivedError: any; // Variable to capture the received error

    serviceWithMock.getHfwInstance(profileFile).subscribe(
      () => { }, // Success callback
      (error: HttpErrorResponse) => {
        receivedError = error; // Capture the received error
      }
    );

    // Verify that traceService.error and traceService.warn were called
    expect(traceServiceSpy.error).toHaveBeenCalledWith(`${TraceModules.hldlReader}: Error getting HLDL profile: ${errorMessage}`);
    expect(traceServiceSpy.warn).toHaveBeenCalledWith(TraceModules.hldlReader, 'Unable to fetch  Hldl file, will be used the Default one.');

    // Check if the received error matches the expected error message
    expect(receivedError.error).toEqual(errorMessage);
  });

});
