import { Injectable } from '@angular/core';
import { ActivatedRoute, Params, PRIMARY_OUTLET, Route, Router,
  UrlSegment, UrlSegmentGroup, UrlTree } from '@angular/router';
import { isNullOrUndefined, ModeData, TraceService } from '@gms-flex/services-common';
import { BehaviorSubject } from 'rxjs';

import { FullPaneId } from '../../common/fullsnapinid/full-pane-id.model';
import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { FrameComponent } from '../frame/frame.component';
import { LayoutComponent } from '../layout/layout.component';
import { PageNotFoundComponent } from '../page/page-not-found.component';
import * as hldl from '../shared/hldl/hldl-data.model';
import { FrameStore } from '../shared/stores/frame.store';
import { SnapinHostComponent } from '../snapin-host/snapin-host.component';
import { ViewComponent } from '../view';
import { HfwState } from './hfw-state';
import { CanDeactivateFrameGuard } from './routing-guards/can-deactivate-frame.guards';
import { CanDeactivateLayoutGuard } from './routing-guards/can-deactivate-layout.guard';
import { CanDeactivateSnapInHostGuard } from './routing-guards/can-deactivate-snapinhost.guard';

const queryParams = 'queryParams';
const mainProp = 'main';
const verticalBarViews = ['nodemap-view', 'recipient-view', 'group-view', 'template-view'];
/**
 * This service provides utility methods for angular routing configs.
 */
@Injectable({
  providedIn: 'root'
})
export class RoutingHelperService {

  public constructor(private readonly hfwTrace: TraceService,
    private readonly router: Router) {
  }

  public pushConfiguration(frames: hldl.HfwFrame[]): void {
    const pageNode: Route = this.findPageRoute();
    if (pageNode != null) {
      this.fillPageRoute(pageNode, frames);
      this.router.resetConfig(this.router.config);
    } else {
      this.hfwTrace.warn(RoutingHelperService.name, 'No page node found on routing array.');
    }
  }

  public findActivatedRoute(node: ActivatedRoute, id: string): ActivatedRoute | null {
    if (node.outlet === id) {
      return node;
    } else if (node.children.length != null) {
      for (const nodeChild of node.children) {
        const result: ActivatedRoute | null = this.findActivatedRoute(nodeChild, id);
        if (result != null) {
          return result;
        }
      }
    }
    return null;
  }

  public fillPageRoute(pageNode: Route, frames: hldl.HfwFrame[]): void {
    frames.forEach(f => {
      if (pageNode.children == null) {
        pageNode.children = [];
      }
      const frameChildren: Route[] = this.fillFrameRoute(f);

      pageNode.children.push(
        {
          'path': f.id,
          'component': FrameComponent,
          'data': f,
          'outlet': f.outletName,
          'children': frameChildren,
          'canDeactivate': [CanDeactivateFrameGuard]
        });
    });
  }

  public resetWildcardConfig(): void {
    if (this.router?.config != null) {
      for (let i = 0; i < this.router.config.length; i++) {
        if (this.router.config[i].path === '**') {
          this.router.config[i] = { path: '**', component: PageNotFoundComponent };
          this.router.resetConfig(this.router.config);
          break;
        }
      }
    } else {
      this.hfwTrace.warn(RoutingHelperService.name, 'wildcard config not found.');
    }
  }

  public getQueryParametersFromUrl(url: string): Params | null {
    const current: UrlTree = this.router.parseUrl(url);
    if (current?.queryParams != null) {
      return current.queryParams;
    }
    return null;
  }

  public getQueryParameters(selections: Map<string, any>, workAreaMode: ModeData): any {
    const queryParam: any = {};

    if (selections != null) {
      selections.forEach((value, key) => {
        queryParam[key] = value;
      });
    }

    if (workAreaMode?.id != null) {
      queryParam.mode = workAreaMode.id;
      if (workAreaMode.relatedValue != null) {
        queryParam.relatedValue = workAreaMode.relatedValue;
      }
    }
    return queryParam;
  }

  public getUrlFromState(state: HfwState, specificFrameId?: string, skipQParam = false): UrlTree {
    const mainUrlTree: UrlTree | null = this.router.createUrlTree(['main/page']);
    const workAreaFrameId = !isNullOrUndefined(specificFrameId) ? specificFrameId : state.activeWorkAreaIdValue;

    const mode: ModeData | null = state.selectedModeValue;
    const qParams: Map<string, string> = (skipQParam) ? null! : state.getAppQParamAndModeQParam();

    mainUrlTree.queryParams = this.getQueryParameters(qParams, mode!);
    const mainUrlSegmentGroup: UrlSegmentGroup = mainUrlTree?.root?.children[PRIMARY_OUTLET];

    state.frameMap?.forEach((frame: FrameStore, id: string) => {
      if (frame.docked === hldl.Docked.top || (workAreaFrameId === id)) {
        const selectedLayoutVal = frame.frameConfig.views.find(v => v.id === frame.selectedViewIdValue);
        if (frame.selectedViewIdValue && selectedLayoutVal) {
          // fix/2243017-empty-device-view - this changes are needed for choosing in nodemap view the 1-pane instead of 2.pane
          // to be apply EVEN to other views like notification
          // to be improved to avoid such a fix - frame system manager have too many layout, that views are not using
          const layout = verticalBarViews.includes(frame.selectedViewIdValue) ? selectedLayoutVal.viewLayouts[0].id : frame.selectedLayoutIdValue;
          const segments: UrlSegment[] = [new UrlSegment(id, {}),
            new UrlSegment(frame.selectedViewIdValue, {}),
            new UrlSegment(layout, {})];
          let frameChildren: { [key: string]: UrlSegmentGroup } = this.getFrameSegmentGroupChildrenSelected(frame, state);
          // fix/2243017-empty-device-view - in order to avout routing 012 - 013 with textual viewer and NOT 017 for nodemap
          if (verticalBarViews.includes(frame.selectedViewIdValue)) {
            frameChildren = this.getFrameSegmentGroupChildrenSelectedLayout(frame, frame.selectedViewIdValue, selectedLayoutVal.viewLayouts[0].id, state);
          }
          mainUrlSegmentGroup.children[frame.frameConfig.outletName!] = new UrlSegmentGroup(segments, frameChildren);
        }
      }
    });
    return mainUrlTree;
  }

  public getUrlOfCurrentStateAndSpecificLayout(state: HfwState,
    frame: hldl.HfwFrame, viewId: string, layoutId: string | null,
    workAreaMode: ModeData): UrlTree {
    const mainUrlTree: UrlTree = this.router.createUrlTree(['main/page']);
    const qParams = state.getAppQParamAndModeQParam();
    mainUrlTree.queryParams = this.getQueryParameters(qParams, workAreaMode);
    const mainUrlSegmentGroup: UrlSegmentGroup = mainUrlTree.root.children[PRIMARY_OUTLET];

    state.frameMap.forEach((f: FrameStore, id: string) => {
      if (f.docked === hldl.Docked.top || (frame != null && frame.id === id)) {
        const layoutValue: string | null = (id === frame.id) ? layoutId : f.selectedLayoutIdValue;
        const viewValue = (id === frame.id) ? viewId : f.selectedViewIdValue!;
        if (layoutValue !== null) {
          const segments: UrlSegment[] = [new UrlSegment(id, {}),
            new UrlSegment(viewValue, {}),
            new UrlSegment(layoutValue, {})];
          let frameChildren: { [key: string]: UrlSegmentGroup };

          if (id === frame.id) {
            frameChildren = this.getFrameSegmentGroupChildrenSelectedLayout(f, viewId, layoutId, state);
          } else {
            frameChildren = this.getFrameSegmentGroupChildrenSelected(f, state);
          }
          mainUrlSegmentGroup.children[f.frameConfig.outletName!] = new UrlSegmentGroup(segments, frameChildren);
        }
      }
    });
    return mainUrlTree;
  }

  public getRelativeUrlTree(frameOutletId: string, _layoutId: string, paneOutletId: string,
    snapInId: string, selections: Map<string, any>, workAreaMode: ModeData): UrlTree {
    const frameActivatedRoute: ActivatedRoute = this.findActivatedRoute(this.router.routerState.root, frameOutletId)!;

    // routeConfig .path === layoutId
    const layoutActivatedRoute = frameActivatedRoute?.firstChild?.firstChild;
    const navigationResult: any[] = [];
    let outletsContainer: any;
    if (snapInId != null) {
      const outletsObj: any = {};
      outletsContainer = { outlets: outletsObj };
      outletsObj[paneOutletId] = snapInId;
    }
    if (outletsContainer != null) {
      navigationResult.push(outletsContainer);
    }

    const extras: any = { relativeTo: layoutActivatedRoute };
    const qParams: any = this.getQueryParameters(selections, workAreaMode);
    if (qParams != null) {
      extras[queryParams] = qParams;
    }

    return this.router.createUrlTree(navigationResult, extras);
  }

  public getPaneOutletSnapInId(frameOutletId: string, paneOutletId: string): string {
    let res = '';

    const frameActivatedRoute: ActivatedRoute | null = this.findActivatedRoute(this.router.routerState.root, frameOutletId);
    const layoutActivatedRoute: ActivatedRoute | null | undefined = frameActivatedRoute?.firstChild?.firstChild;
    const paneActivatedRoute: ActivatedRoute | undefined = layoutActivatedRoute!.children.find(r => r.outlet === paneOutletId);

    if (paneActivatedRoute != null) {
      const segments: UrlSegment[] = (paneActivatedRoute.url as BehaviorSubject<UrlSegment[]>).getValue();
      res = segments[0].path;
    }
    return res;
  }

  public getWorkAreaOutletName(url: string, frames: hldl.HfwFrame[]): string | null {
    const tree: UrlTree = this.router.parseUrl(url);
    const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];

    if (g.children != null) {
      for (const segmentIndex in g.children) {
        if (g.children.hasOwnProperty(segmentIndex)) {
          const hfwFrame: hldl.HfwFrame | undefined = frames?.find(f => f.outletName === segmentIndex);
          if (hfwFrame != null) {
            if (hfwFrame.docked !== hldl.Docked.top || (hfwFrame.docked === null)) {
              return segmentIndex;
            }
          } else {
            return null;
          }
        }
      }
    } else {
      return null;
    }
    return 'o6';
  }

  public getModeIdFromUrl(url: string): string | null {
    const tree: UrlTree = this.router.parseUrl(url);
    if (tree.queryParamMap?.has('mode')) {
      return tree.queryParamMap.get('mode')!;
    }
    return null;
  }

  public getWorkAreaOutletIds(url: string): { outlet: string; snapinId: string }[] {
    const res: { outlet: string; snapinId: string }[] = [];
    const tree: UrlTree = this.router.parseUrl(url);
    const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];

    if (g.children?.[mainProp]?.children != null) {
      const mainOutletChildren: UrlSegmentGroup = g.children[mainProp];
      for (const key in mainOutletChildren.children) {
        if (mainOutletChildren.children.hasOwnProperty(key)) {
          res.push({ outlet: key, snapinId: mainOutletChildren.children[key].segments[0].path });
        }
      }
    }
    return res;
  }

  public getSelectedSnapInId(url: string, frame: hldl.HfwFrame, pane: hldl.Pane): string {
    const tree: UrlTree = this.router.parseUrl(url);
    const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];
    let res: string;

    if (g.children != null) {
      //    if (g.children != null && frame?.outletName) {
      const frameSegment: UrlSegmentGroup = g.children[frame.outletName!];

      if (frameSegment?.children != null) {
        //    if (frameSegment?.children != null && pane?.outletName != undefined) {
        const paneSegment: UrlSegmentGroup = frameSegment.children[pane.outletName!];
        if (paneSegment?.segments != null
            && paneSegment.segments.length > 0) {
          res = paneSegment.segments[0].path;
        }
      }

    }
    return res!;
  }

  private fillFrameRoute(frameConfig: hldl.HfwFrame): Route[] {
    const frameChildren: Route[] = [];

    for (const view of frameConfig.views) {
      const viewChildren: Route[] = this.fillViewRoute(frameConfig, view.id);

      frameChildren.push(
        {
          'path': view.id,
          'component': ViewComponent,
          'data': { viewConfig: view, frameId: frameConfig.id },
          // "outlet": f.outletName,
          'children': viewChildren
        });
    }

    return frameChildren;
  }

  private fillViewRoute(frameConfig: hldl.HfwFrame, _viewId: string): Route[] {
    const viewChildren: Route[] = [];
    const view: hldl.View | undefined = frameConfig.views.find(v => v.id === _viewId);

    if (view) {
      const viewLayouts = frameConfig.layoutInstances.filter(l =>
        !isNullOrUndefined(view.viewLayouts.find(vl => vl.id === l.id)));
      for (const layout of viewLayouts) {
        const layoutChildren: Route[] = this.fillLayoutRoute(frameConfig);
        viewChildren.push(
          {
            'path': layout.id,
            'component': LayoutComponent,
            'data': { layoutConfig: layout, viewId: _viewId, frame: frameConfig, pane: layout.paneInstance ?? null },
            // "outlet": f.outletName,
            'children': layoutChildren,
            'canDeactivate': [CanDeactivateLayoutGuard]
          });
      }
    }

    return viewChildren;
  }

  private fillLayoutRoute(frameConfig: hldl.HfwFrame): Route[] {
    const layoutChildren: Route[] = [];

    for (const pane of frameConfig.panes) {

      for (const sni of pane.snapInReferences) {
        const fullId: FullSnapInId = new FullSnapInId(frameConfig.id, sni.id);
        const snapInInstance = frameConfig.snapInInstances.find(s => s.snapInId === sni.id);
        layoutChildren.push({
          'path': sni.id,
          'outlet': pane.outletName,
          'data': { snapinId: fullId, paneId: new FullPaneId(frameConfig.id, pane.id) },
          'component': SnapinHostComponent,
          'loadChildren': this.findLoadChildrenPath(snapInInstance!.typeId),
          // "children" : frameChildren
          'canDeactivate': [CanDeactivateSnapInHostGuard]
        });
      }
    }
    return layoutChildren;
  }

  private findLoadChildrenPath(typeId: string): any {
    const foundSni: any = this.router.config.find((r: any) => typeId === r.path);
    if (foundSni != null) {
      return foundSni.loadChildren;
    } else {
      return null;
    }
  }

  private findPageRoute(): any {
    if (this.router?.config != null) {
      // if (this.router?.config != null && this.router.config.find(r => r.path === 'main') != undefined) {
      const main: Route = this.router.config.find(r => r.path === 'main')!;
      if (!isNullOrUndefined(main) && !isNullOrUndefined(main.children) && main!.children!.length > 0) {
        return main.children!.find(r => r.path === 'page')!;
      }
    } else {
      this.hfwTrace.warn(RoutingHelperService.name, 'No router config array found.');
    }
    return null;
  }

  private getFrameSegmentGroupChildrenSelected(frame: FrameStore, state: HfwState): { [key: string]: UrlSegmentGroup } {
    const result: { [key: string]: UrlSegmentGroup } = {};
    // if (frame.paneMap){
    frame.paneMap!.forEach((pane, key) => {
      if (state.paneIsInLayout(frame, key, frame.selectedLayoutIdValue)) {
        //     if (state.paneIsInLayout(frame, key, frame.selectedLayoutIdValue) && pane?.paneConfig?.outletName) {

        const paneOutletName: string = pane.paneConfig!.outletName!;
        const selectedSnapIn: string = pane.selectedSnapInIdValue;
        if (selectedSnapIn != null) {
          const segments: UrlSegment[] = [new UrlSegment(selectedSnapIn, {})];
          result[paneOutletName] = new UrlSegmentGroup(segments, {});
        }
      }
    });
    return result;
  }

  private getFrameSegmentGroupChildrenSelectedLayout(frame: FrameStore,
    viewId: string, layout: string | null, state: HfwState): { [key: string]: UrlSegmentGroup } {
    const result: { [key: string]: UrlSegmentGroup } = {};
    const preferred = this.getViewPreferredSnapIn(frame, viewId);

    frame.paneMap.forEach((pane, paneKey) => {
      if (state.paneIsInLayout(frame, paneKey, layout) && pane.paneConfig) {
        const paneOutletName: string | null = pane.paneConfig.outletName!;
        const selectedSnapIn: string = (preferred?.paneId === pane.paneConfig.id && preferred?.snapinId) ? preferred.snapinId : pane.selectedSnapInIdValue;
        if (selectedSnapIn != null && paneOutletName != null) {
          const segments: UrlSegment[] = [new UrlSegment(selectedSnapIn, {})];
          result[paneOutletName] = new UrlSegmentGroup(segments, {});
        }
      }
    });
    return result;
  }

  private getViewPreferredSnapIn(frame: FrameStore, viewId: string): hldl.PreferredSnapin | undefined {
    if (frame.frameConfig.views) {
      const view = frame.frameConfig.views.find(v => v.id === viewId);
      if (view?.preferredSnapin) {
        return view.preferredSnapin;
      }
    }
    return undefined;
  }
}
