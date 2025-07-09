import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationExtras, Router, RoutesRecognized, UrlSegmentGroup, UrlTree } from '@angular/router';
import { TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';

import { HLDL_TEST_EXAMPLE } from '../shared/hldl/hldl-example-data.model';
import { HfwState } from './hfw-state';
import { RoutingHelperService } from './routing-helper.service';

// export class RouterStub {
//   public url: string | undefined;

//   public rr: RoutesRecognized = new RoutesRecognized(0, 'http://localhost:4200/login', 'http://localhost:4200/login', null!);
//   public events: Observable<RoutesRecognized> = new Observable<RoutesRecognized>(observer => {
//     observer.next(this.rr);
//     observer.complete();
//   });

//   public navigateByUrl(url: string): Promise<string> {
//     return Promise.resolve(url);
//   }

//   public createUrlTree(commands: any, navExtras: any): UrlTree {
//     const urlTree: UrlTree = new UrlTree();
//     return urlTree;
//   }
// }

describe('RoutingHelperService', () => {
  let service: RoutingHelperService;
  const traceServiceStub: any = {
    debug: (source: string, message?: string, ...optionalParams: any[]) => { },
    warn: (source: string, message?: string, ...optionalParams: any[]) => { },
    info: (source: string, message?: string, ...optionalParams: any[]) => { }
  };
  const activatedRouteSnapshotStub: ActivatedRouteSnapshot = new ActivatedRouteSnapshot();
  activatedRouteSnapshotStub.component = null;
  activatedRouteSnapshotStub.outlet = 'outlet';
  activatedRouteSnapshotStub.data = {};
  activatedRouteSnapshotStub.toString = (): string => { return `activatedRouteSnapshotStub)`; };

  const tree: UrlTree = {
    toString: () => 'fakeUrl',
    fragment: 'fake',
    queryParams: null!,
    root: null!,
    queryParamMap: null!
  };
  const routerStub: any = {
    navigateByUrl: (urlTree: UrlTree, navigationExtras: NavigationExtras) => Promise.resolve(true),
    createUrlTree: (commands: any, navExtras: any): UrlTree => {
      const urlTree: UrlTree = new UrlTree();
      return urlTree;
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RoutingHelperService,
        { provide: Router, useFactory: routerStub },
        { provide: TraceService, useFactory: traceServiceStub }
      ]
    });
    service = new RoutingHelperService(traceServiceStub, routerStub);
  });

  it('can load instance', () => {
    expect(service).toBeTruthy();
  });

  it('call pushConfiguration', () => {
    spyOn(traceServiceStub, 'warn').and.callThrough();
    service.pushConfiguration(HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames);
    expect(traceServiceStub.warn).toHaveBeenCalled();
  });

  it('call resetWildcardConfig', () => {
    spyOn(traceServiceStub, 'warn').and.callThrough();
    service.resetWildcardConfig();
    expect(traceServiceStub.warn).toHaveBeenCalled();
  });

  it('call getUrlFromState', () => {
    spyOn(traceServiceStub, 'warn').and.callThrough();
    const currentState: HfwState = new HfwState();
    expect(service.getUrlFromState(currentState, 'main')).not.toBeNull();
  });
});
