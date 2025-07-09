import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { ExtensionProfilesHandler } from './extension-profiles.handler';

// //////  Tests  /////////////
describe('ExtensionProfilesHandler', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    })
      .compileComponents();
  }));

  it('ExtensionProfilesHandler: Get Extensions.',
    inject([HttpTestingController, HttpClient],
      (httpMock: HttpTestingController, httpClient: HttpClient) => {
        const mockTrace: MockTraceService = new MockTraceService();
        const extHandler: ExtensionProfilesHandler = new ExtensionProfilesHandler(httpClient,
          '/profiles/extension/', 'extension-profiles.json', 4000, mockTrace as TraceService);

        const dummyPosts: any[] = [{
          'name': 'video',
          'profile': 'video.ext.hldl.json'
        },
        {
          'name': 'mns',
          'profile': 'mns.ext.hldl.json'
        }];

        const fakeFirstExt: any = {};
        const fakeSecondExt: any = {};

        extHandler.getAllExtensionProfiles().subscribe((res: any[]) => {
          expect(res.length).toBe(2);
        });

        const request: TestRequest = httpMock.expectOne(`/profiles/extension/extension-profiles.json`);
        expect(request.request.method).toBe('GET');
        request.flush(dummyPosts);

        const firstExtRequest: TestRequest = httpMock.expectOne(`/profiles/extension/video.ext.hldl.json`);
        expect(firstExtRequest.request.method).toBe('GET');
        firstExtRequest.flush(fakeFirstExt);

        const secondExtRequest: TestRequest = httpMock.expectOne(`/profiles/extension/mns.ext.hldl.json`);
        expect(secondExtRequest.request.method).toBe('GET');
        secondExtRequest.flush(fakeSecondExt);

        httpMock.verify();
      }));

  // New Test Case 1: Verify behavior when the extension list is empty
  it('ExtensionProfilesHandler: Get Extensions - Empty List',
    inject([HttpTestingController, HttpClient],
      (httpMock: HttpTestingController, httpClient: HttpClient) => {
        const mockTrace: MockTraceService = new MockTraceService();
        const extHandler: ExtensionProfilesHandler = new ExtensionProfilesHandler(httpClient,
          '/profiles/extension/', 'extension-profiles.json', 4000, mockTrace as TraceService);

        extHandler.getAllExtensionProfiles().subscribe((res: any[]) => {
          expect(res.length).toBe(0);
        });

        const request: TestRequest = httpMock.expectOne(`/profiles/extension/extension-profiles.json`);
        expect(request.request.method).toBe('GET');
        request.flush([]); // Simulate empty list

        httpMock.verify();
      }));

  // New Test Case 3: Test the timeout scenario
  it('ExtensionProfilesHandler: Get Extensions - Timeout',
    inject([HttpTestingController, HttpClient],
      (httpMock: HttpTestingController, httpClient: HttpClient) => {
        const mockTrace: MockTraceService = new MockTraceService();
        const extHandler: ExtensionProfilesHandler = new ExtensionProfilesHandler(httpClient,
          '/profiles/extension/', 'extension-profiles.json', 4000, mockTrace as TraceService);

        extHandler.getAllExtensionProfiles().subscribe((res: any[]) => {
          expect(res.length).toBe(0); // Expect no extensions due to timeout
        });

        const request: TestRequest = httpMock.expectOne(`/profiles/extension/extension-profiles.json`);
        expect(request.request.method).toBe('GET');
        request.flush([]); // Simulate empty list

        // Simulate timeout
        setTimeout(() => {
          expect(mockTrace.error).toHaveBeenCalled(); // Check if error was logged
        }, 4000);

        httpMock.verify();
      }));

});
