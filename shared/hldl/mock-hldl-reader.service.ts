import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';

import { HLDL_TEST_EXAMPLE } from './hldl-example-data.model';
import { HldlReaderService } from './hldl-reader.service';

/**
 * Service for Reading and Parsing the HLDL file.
 */
@Injectable({
  providedIn: 'root'
})
export class MockHldlReaderService extends HldlReaderService {

  /*
   * The mockvalue for HldlFilePath
   */
  // private _mockHldl: HfwInstance;

  public constructor(private readonly mockHfwTrace: TraceService,
    private readonly mockHttpClient: HttpClient) {
    super(mockHfwTrace, mockHttpClient);
    this.mockHttpClient = mockHttpClient;
    this.mockHfwTrace.debug(MockHldlReaderService.name, 'Service created.');
    this.mockHfwTrace.debug(MockHldlReaderService.name, 'seems not used.', this.mockHttpClient);

  }

  public getHfwInstance(_profileName: string): Observable<any> {
    const hldl: any = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE.hfwInstance));
    return of(hldl)!;
  }

}
