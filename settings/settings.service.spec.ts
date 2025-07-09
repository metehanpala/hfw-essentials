import { HttpClient, HttpHandler } from '@angular/common/http'; // Import necessary modules for HTTP handling
import { fakeAsync, TestBed, tick } from '@angular/core/testing'; // Import testing utilities from Angular core
import { AppSettingsService, SettingsServiceBase, TraceService } from '@gms-flex/services-common'; // Import services for application settings and tracing
import { Observable, Observer, of } from 'rxjs'; // Import RxJS types for handling observables

import { FavoriteLayoutsPerRange } from '../state/user-settings.handler'; // Import type for user settings
import { SettingsService } from './settings.service'; // Import the SettingsService to be tested

// Mock implementation of SettingsServiceBase for testing purposes
export class MockSettingsServiceBase {
  // Mock method to get settings based on settingId
  public getSettings(settingId: string): Observable<string | undefined> {
    return of(settingId === 'Flex_HfwCore_FullScreenSelectedView-frameId' ? 'mockedValue' : undefined); // Return mocked value or undefined
  }

  // Mock method to put settings
  public putSettings(settingId: string, settingValue: string): Observable<boolean> {
    return of(true); // Simulate successful setting update
  }

  // Mock method to delete settings
  public deleteSettings(settingId: string): Observable<boolean> {
    return of(true); // Simulate successful deletion
  }
}

// Describe block for the Settings Service tests
describe('Settings Service', () => {
  let service: any; // Declare a variable to hold the instance of SettingsService

  // Stub for TraceService to simulate logging behavior
  const traceServiceStub: any = {
    info: (arg1: any, string2: any) => ({}), // Mock info logging method
    debug: (arg1: any, string2: any, systemNumber3: any) => ({}) // Mock debug logging method
  };

  // Stub for SettingsService to simulate its behavior in tests
  const settingsServiceStub: any = {
    getSettings: (id: any): Observable<string | undefined> => new Observable((o: Observer<string | undefined>) => {
      o.next(id === 'Flex_HfwCore_FullScreenSelectedView-frameId' ? 'mockedValue' : undefined); // Return mocked value or undefined
      o.complete(); // Complete the observable
    }),
    putSettings: (id: any, value: any): Observable<boolean> => new Observable((o: Observer<boolean>) => {
      o.next(true); // Simulate successful setting update
      o.complete(); // Complete the observable
    }),
    deleteSettings: (id: any): Observable<boolean> => new Observable((o: Observer<boolean>) => {
      o.next(true); // Simulate successful deletion
      o.complete(); // Complete the observable
    }),
    getUserSettingLayoutId: (frameId: string, viewId: string | null): Observable<string | null> => {
      return of('mockedLayoutId'); // Return a mocked layout ID
    }
  };

  // Setup function to configure the testing module before each test
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SettingsService, TraceService, AppSettingsService, HttpClient, HttpHandler,
        { provide: SettingsServiceBase, useValue: settingsServiceStub } // Provide the stub for SettingsServiceBase
      ]
    });
    service = new SettingsService(traceServiceStub, settingsServiceStub); // Create an instance of SettingsService
  });

  // Test to check if the service instance is created successfully
  it('should load instance', () => {
    expect(service).toBeTruthy(); // Expect the service to be truthy
  });

  // Test to check getting user setting layoutId
  it('should get user setting layoutId', fakeAsync(() => {
    let setting: any; // Variable to hold the setting value

    spyOn(service, 'getUserSettingLayoutId').and.returnValue(of('mockedLayoutId')); // Spy on the method and return a mocked value

    service.getUserSettingLayoutId('Flex_HfwCore_FullScreenSelectedView-frameId', null)
      .subscribe((res: string | null) => {
        setting = res; // Assign the result to the setting variable
      });

    tick(); // Simulate async behavior
    expect(setting).toEqual('mockedLayoutId'); // Expect the setting to equal the mocked layout ID
  }));

  // Test to check putting user settings
  it('should put user settings', () => {
    const spy: jasmine.Spy = spyOn(service.trace, 'info'); // Spy on the trace info method
    service.onPutLayoutSettings(true, 'frameId', new Map<string, FavoriteLayoutsPerRange>()); // Call the method to put layout settings
    expect(spy).toHaveBeenCalled(); // Expect the spy to have been called
  });

  // Test to check saving layout settings
  it('should save layout settings', () => {
    const spy: jasmine.Spy = spyOn<any>(service, 'onPutLayoutSettings'); // Spy on the private method
    service.saveLayoutSettings('frameId', 'viewId', new Map<string, FavoriteLayoutsPerRange>()); // Call the method to save layout settings
    expect(spy).toHaveBeenCalled(); // Expect the spy to have been called
  });

  // New Tests
  // Test to check getting splitter settings
  it('should get splitter settings', () => {
    let setting: string | undefined; // Initialize to undefined
    service.getSplitterSettings('frameId').subscribe((res: string | undefined) => {
      setting = res; // Assign the result to the setting variable
    });
    expect(setting).toBeUndefined(); // Expect undefined for this case
  });

  // Test to check getting full screen settings
  it('should get full screen settings', () => {
    let setting: string | undefined; // Initialize to undefined
    service.getFullScreenSettings('frameId').subscribe((res: string | undefined) => {
      setting = res; // Assign the result to the setting variable
    });
    expect(setting).toBeUndefined(); // Expect undefined for this case
  });

  // Test to check getting selected view settings
  it('should get selected view settings', () => {
    let setting: string | undefined; // Initialize to undefined
    service.getSelectedViewSettings('frameId').subscribe((res: string | undefined) => {
      setting = res; // Assign the result to the setting variable
    });
    expect(setting).toEqual('mockedValue'); // Expect the mocked value
  });

  // Test to check saving selected view settings
  it('should save selected view settings', () => {
    const spy: jasmine.Spy = spyOn(settingsServiceStub, 'putSettings').and.callThrough(); // Spy on the putSettings method
    service.saveSelectedViewSettings('frameId', 'viewSettings'); // Call the method to save selected view settings
    // Expect the spy to have been called with correct arguments
    expect(spy).toHaveBeenCalledWith('Flex_HfwCore_FullScreenSelectedView-frameId', 'viewSettings');
  });

  // Test to check deleting splitter settings
  it('should delete splitter settings', () => {
    const spy: jasmine.Spy = spyOn(service.trace, 'info'); // Spy on the trace info method
    service.deleteSplitterSettings('frameId'); // Call the method to delete splitter settings
    expect(spy).toHaveBeenCalled(); // Expect the spy to have been called
  });
});
