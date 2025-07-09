/* eslint-disable @typescript-eslint/dot-notation */
// Disables ESLint rule for dot notation to allow access to private properties in tests

import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { MockTraceService } from '@gms-flex/services-common';

import { ClientProfilesHandler } from './client-profiles.handler';

// Test suite for ClientProfilesHandler
describe('ClientProfilesHandler', () => {
  let cliHandler: ClientProfilesHandler; // Instance of ClientProfilesHandler to be tested
  let httpMock: HttpTestingController; // Mock for HTTP requests
  let mockTrace: MockTraceService; // Mock for tracing service

  beforeEach(waitForAsync(() => {
    // Configuring the test module
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withInterceptorsFromDi()), // Provides HttpClient with dependency injection interceptors
        provideHttpClientTesting() // Provides mock HttpClient for testing HTTP requests
      ]
    }).compileComponents();

    // Initializing dependencies
    httpMock = TestBed.inject(HttpTestingController);
    mockTrace = new MockTraceService();
    cliHandler = new ClientProfilesHandler(TestBed.inject(HttpClient), '/profiles/', mockTrace);
  }));

  // Test for getAllClientProfiles method
  it('ClientProfilesHandler: Get Profile Extensions.',
    inject([HttpTestingController, HttpClient], (httpClient: HttpClient) => {
      const initialProfileExt: any = {
        'hfwExtension': { 'parentProfile': 'DEFAULT.hldl.json' }
      };

      const fakeBaseProfile: any = {
        'hfwInstance': { 'parentProfile': 'DEFAULT.hldl.json' }
      };

      // Calling method to fetch client profiles
      cliHandler.getAllClientProfiles(initialProfileExt, 'ba_na.hldl.json').subscribe((res: any[]) => {
        expect(res.length).toBe(2); // Verifying the response length
      });

      // Expecting an HTTP GET request and returning a mock response
      const request: TestRequest = httpMock.expectOne(`/profiles/DEFAULT.hldl.json`);
      expect(request.request.method).toBe('GET');
      request.flush(fakeBaseProfile);

      httpMock.verify(); // Ensures no unexpected HTTP requests are pending
    })
  );

  // Test for pushProfile method when isBase is true
  it('should push profile to clientProfiles when isBase is true', () => {
    const initialHldl = { hfwInstance: 'instance' };
    cliHandler['pushProfile'](initialHldl, true);
    expect(cliHandler['clientProfiles']).toContain('instance'); // Verifies that instance is added to clientProfiles
  });

  // Test for pushProfile method when isBase is false
  it('should push profile to clientProfiles when isBase is false', () => {
    const initialHldl = { hfwExtension: 'extension' };
    cliHandler['pushProfile'](initialHldl, false);
    expect(cliHandler['clientProfiles']).toContain('extension'); // Verifies that extension is added to clientProfiles
  });

  // Test for pushToClientAndDispose method
  it('should call observer.next and observer.complete', () => {
    const observer = {
      next: jasmine.createSpy('next'),
      complete: jasmine.createSpy('complete'),
      error: jasmine.createSpy('error') // Mock observer error method
    };

    // Calling pushToClientAndDispose with a sample array
    cliHandler['pushToClientAndDispose'](observer, [1, 2, 3]);
    expect(observer.next).toHaveBeenCalledWith([1, 2, 3]); // Verifies that next was called with expected values
    expect(observer.complete).toHaveBeenCalled(); // Verifies that complete was called
  });

  // Test for teardownLogic method
  it('should call dispose method', () => {
    spyOn(cliHandler as any, 'dispose'); // Spy on private dispose method
    cliHandler['teardownLogic']();
    expect((cliHandler as any).dispose).toHaveBeenCalled(); // Ensures dispose method was called
  });

  // Test for handleError method
  it('should handle error and call observer.next with null', () => {
    const observer = {
      next: jasmine.createSpy('next'),
      complete: jasmine.createSpy('complete'),
      error: jasmine.createSpy('error') // Mock observer error method
    };

    // Simulating an HTTP error response
    const httpErrorResponse = new HttpErrorResponse({
      error: 'Error',
      status: 500,
      statusText: 'Server Error'
    });

    // Calling handleError method
    cliHandler['handleError'](httpErrorResponse, observer);
    expect(observer.next).toHaveBeenCalledWith(null); // Ensures observer.next was called with null
  });
});
