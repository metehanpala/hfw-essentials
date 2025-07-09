import { PRIMARY_OUTLET, Router, UrlSegmentGroup, UrlTree } from '@angular/router';

const mainProp = 'main';

export class RoutingUtilities {

  public static getWorkAreaFrameId(router: Router, url: string): string {
    const tree: UrlTree = router.parseUrl(url);
    const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];
    let frameId: string;
    if (g.children?.[mainProp] != null) {
      if (g.children[mainProp].segments != null && g.children[mainProp].segments.length > 0) {
        if (g.children[mainProp].segments[0].path != null) {
          frameId = g.children[mainProp].segments[0].path;
        }
      }
    }
    return frameId!;
  }

  public static getWorkAreaFrameViewId(router: Router, url: string): string {
    const tree: UrlTree = router.parseUrl(url);
    const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];
    let layoutId = '';
    if (g.children?.[mainProp] != null) {
      if (g.children[mainProp].segments != null && g.children[mainProp].segments.length > 0) {
        if (g.children[mainProp].segments[0].path != null) {
          layoutId = g.children[mainProp].segments[1].path;
        }
      }
    }
    return layoutId;
  }

  public static getWorkAreaFrameLayoutId(router: Router, url: string): string {
    const tree: UrlTree = router.parseUrl(url);
    const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];
    let layoutId = '';
    if (g.children?.[mainProp] != null) {
      if (g.children[mainProp].segments != null && g.children[mainProp].segments.length > 0) {
        if (g.children[mainProp].segments[0].path != null) {
          layoutId = g.children[mainProp].segments[2].path;
        }
      }
    }
    return layoutId;
  }
}
