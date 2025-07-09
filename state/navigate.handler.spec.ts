import { NavigationExtras, UrlTree } from '@angular/router';

import { AppStatus } from './app-status.model';
import { NavigateHandler } from './navigate.handler';

describe('NavigateHandler', () => {

  const traceServiceStub: any = {
    debug: (source: string, message?: string, ...optionalParams: any[]) => {},
    info: (source: string, message?: string, ...optionalParams: any[]) => {}
  };

  const tree: UrlTree = {
    toString: () => 'fakeUrl',
    fragment: 'fake',
    queryParams: null!,
    root: null!,
    queryParamMap: null!
  };
  const routerStub: any = {
    navigateByUrl: (urlTree: UrlTree, navigationExtras: NavigationExtras) => Promise.resolve(true)
  };

  let navigateHandler: NavigateHandler;

  it('should retrieve NavigateHandler', () => {
    navigateHandler = new NavigateHandler('', tree, AppStatus.Running, routerStub, traceServiceStub);
    expect(navigateHandler).not.toBeNull();
  });

  it('NavigateHandler call method navigate', () => {
    navigateHandler = new NavigateHandler('', tree, AppStatus.Running, routerStub, traceServiceStub);
    navigateHandler.navigate().subscribe((result: boolean) => {
      expect(result).toBeTruthy();
    }).unsubscribe();
  });
});
