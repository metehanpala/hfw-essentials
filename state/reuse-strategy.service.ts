import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';

import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { SnapInBase } from '../../common/snapin-base';
import { TraceModules } from '../shared/trace/trace-modules';

@Injectable({
  providedIn: 'root'
})
export class ReuseStrategyService implements RouteReuseStrategy {
  public routerReuseName = '';
  private layoutChangeList: FullSnapInId[] = [];
  private readonly storedRouteHandles: Map<string, DetachedRouteHandle> = new Map<string, DetachedRouteHandle>();
  private readonly neverDestroyList: FullSnapInId[] = [];
  private _layoutChangeRouterReuse = false;
  private readonly primaryOutletName: string = 'primary';

  constructor(private readonly trace: TraceService) {
  }

  public get layoutChangeSnapinList(): readonly FullSnapInId[] {
    return this.layoutChangeList;
  }

  public get neverDestroySnapinList(): readonly FullSnapInId[] {
    return this.neverDestroyList;
  }

  public get countStoredHandles(): number {
    return this.storedRouteHandles.size;
  }

  /**
   * Determines if this route (and its subtree) should be detached to be reused later.
   * If true is returned, the method store() is called afterwards with the same 'ActivatedRouteSnapshot'.
   * => we must then maintain the storage of the handle.
   *
   * @param {ActivatedRouteSnapshot} route
   * @returns {boolean}
   * @memberof ReuseStrategyService
   */
  public shouldDetach(route: ActivatedRouteSnapshot): boolean {
    let msg = `ReuseStrategyService:shouldDetach()
    isLayoutChangeReuseEnabled:${this._layoutChangeRouterReuse}
    isNeverDestroyRouterReuseEnabled:${this.neverDestroyRouterReuse}
    route: ${this.getTrace(route)}`;

    let result = false;
    if (this.isDefaultStrategy()) {
      // default behaviour (as implemented in the default RouteReuseStrategy service from angular)
      result = false;
    } else {
      if (this._layoutChangeRouterReuse === true) {
        const fullSnapin = this.findFullSnapinIdInLayoutChangeList(route);
        if (fullSnapin !== undefined) {
          result = true;
        }
      }

      const fullSnapinNeverDestroy = this.findFullSnapinIdInNeverDestroyList(route);
      if (fullSnapinNeverDestroy !== undefined) {
        result = true;
      }
    }

    msg = msg + `\nreturns: ${result}`;
    if (result) {
      this.trace.info(TraceModules.reuseSnapin, msg);
    } else {
      this.trace.info(TraceModules.reuseSnapin, msg);
    }
    return result;
  }

  /**
   * Store the detached component handle of the respective route
   *
   * @param {ActivatedRouteSnapshot} route
   * @param {(DetachedRouteHandle | null)} handle
   * @returns {void}
   * @memberof ReuseStrategyService
   */
  public store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    let msg = `ReuseStrategyService:store()
    isLayoutChangeReuseEnabled:${this._layoutChangeRouterReuse}
    isNeverDestroyRouterReuseEnabled:${this.neverDestroyRouterReuse}
    route: ${this.getTrace(route)}`;
    if (handle != null) {
      msg = msg + `\nhandle: ${(handle as any).componentRef?.componentType.name}`;
    } else {
      msg = msg + `\nhandle: null`;
    }
    this.trace.info(TraceModules.reuseSnapin, msg);

    if (this.isDefaultStrategy()) {
      // default behaviour (as implemented in the default RouteReuseStrategy service from angular)
      return;
    } else {
      this.storeInternal(route, handle);
    }
    this.traceStoredHandles();
  }

  /**
   * Determines if this route (and its subtree) should be reattached.
   * If true is returned, the method retrieve() is called (by angular) afterwards with the same 'ActivatedRouteSnapshot'.
   * => we must then return the stored handle.
   * Afterwards angular calls the method store() with a null handle -> This will delete the handle
   *
   * @param {ActivatedRouteSnapshot} route
   * @returns {boolean}
   * @memberof ReuseStrategyService
   */
  public shouldAttach(route: ActivatedRouteSnapshot): boolean {
    let msg = `ReuseStrategyService:shouldAttach()
    isLayoutChangeReuseEnabled:${this._layoutChangeRouterReuse}
    isNeverDestroyRouterReuseEnabled:${this.neverDestroyRouterReuse}
    route: ${this.getTrace(route)}`;

    let result = false;
    if (this.isDefaultStrategy()) {
      // default behaviour (as implemented in the default RouteReuseStrategy service from angular)
      result = false;
    } else {
      if (this._layoutChangeRouterReuse === true) {
        const fullSnapin = this.findFullSnapinIdInLayoutChangeList(route);
        if (fullSnapin !== undefined) {
          result = ((route.routeConfig != null) && this.hasStoredRouteHandle(fullSnapin.fullId(), route.outlet));
        }
      }

      if (result === false) {
        const fullSnapinNeverDestroy = this.findFullSnapinIdInNeverDestroyList(route);
        if (fullSnapinNeverDestroy !== undefined) {
          result = ((route.routeConfig != null) && this.hasStoredRouteHandle(fullSnapinNeverDestroy.fullId(), route.outlet));
        }
      }
    }

    msg = msg + `\nreturns: ${result}`;
    if (result) {
      this.trace.info(TraceModules.reuseSnapin, msg);
    } else {
      this.trace.info(TraceModules.reuseSnapin, msg);
    }

    return result;
  }

  /**
   * Retrieve the previously stored component handle of the respective route
   *
   * @param {ActivatedRouteSnapshot} route
   * @returns {(DetachedRouteHandle | null)}
   * @memberof ReuseStrategyService
   */
  public retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    let msg = `ReuseStrategyService:retrieve()
    isLayoutChangeReuseEnabled:${this._layoutChangeRouterReuse}
    isNeverDestroyRouterReuseEnabled:${this.neverDestroyRouterReuse}
    route: ${this.getTrace(route)}`;

    let result: DetachedRouteHandle | null = null;
    if (this.isDefaultStrategy()) {
      // default behaviour (as implemented in the default RouteReuseStrategy service from angular)
      result = null;
    } else {
      if (!route.routeConfig) {
        result = null;
      }
      result = this.retrieveInternal(route);
    }

    if (result != null) {
      msg = msg + `\nreturns: ${(result as any).componentRef?.componentType.name}`;
      this.trace.info(TraceModules.reuseSnapin, msg);
    } else {
      msg = msg + `\nreturns: ${result}`;
      this.trace.info(TraceModules.reuseSnapin, msg);
    }
    return result;
  }

  /**
   * Determines if a route should be reused.
   * This implementation is the same as the implementation of angular default RouteReuseStrategyService.
   * If true is returned, angular maintains the reuse of the view by himself.
   *
   * @param {ActivatedRouteSnapshot} future
   * @param {ActivatedRouteSnapshot} curr
   * @returns {boolean}
   * @memberof ReuseStrategyService
   */
  public shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    let msg = `ReuseStrategyService:shouldReuseRoute();
    isLayoutChangeReuseEnabled:${this._layoutChangeRouterReuse}
    isNeverDestroyRouterReuseEnabled:${this.neverDestroyRouterReuse}
    future: ${this.getTrace(future)};
    curr: ${this.getTrace(curr)}\n`;

    // default behaviour (as implemented in the default RoutReuseStrategy service from angular)
    let result = false;
    if ((future == null) || (curr == null)) {
      this.trace.error(TraceModules.reuseSnapin, 'Severe strategy error, angular should not call this method with undefined routes.');
      // this happens whenever a component is dettached/reattached which has child routers.
      result = false;
    } else {
      result = future.routeConfig === curr.routeConfig;
    }

    msg = msg + `returns: ${result}`;
    this.trace.debug(TraceModules.reuseSnapin, msg);
    return result;
  }

  public traceStoredHandles(): void {
    let msg = `ReuseStrategyService:traceStoredHandles()
    isLayoutChangeReuseEnabled:${this._layoutChangeRouterReuse}
    isNeverDestroyRouterReuseEnabled:${this.neverDestroyRouterReuse}
    Number of current stored handles: ${this.storedRouteHandles.size}`;

    this.storedRouteHandles.forEach((value, _key) => {
      msg = msg + `\n${(value as any).componentRef?.componentType.name}\n${this.getTrace((value as any).route?.value)}`;
    });
    this.trace.info(TraceModules.reuseSnapin, msg);
  }

  public get neverDestroyRouterReuse(): boolean {
    return (this.neverDestroyList.length !== 0);
  }

  public get layoutChangeRouterReuse(): boolean {
    return this._layoutChangeRouterReuse;
  }

  public isDefaultStrategy(): boolean {
    return ((this._layoutChangeRouterReuse === false) && this.neverDestroyList.length === 0);
  }

  public startLayoutChangeRouterReuse(reusableSnapins: FullSnapInId[] | undefined): void {
    this.trace.info(TraceModules.reuseSnapin, `ReuseStrategyService:startLayoutChangeRouterReuse()`);

    this._layoutChangeRouterReuse = true;
    this.layoutChangeList = [];
    if (reusableSnapins !== undefined) {
      this.layoutChangeList = reusableSnapins;
    }
  }

  public stopLayoutChangeRouterReuse(): void {
    this.trace.info(TraceModules.reuseSnapin, `ReuseStrategyService:stopLayoutChangeRouterReuse()`);

    this._layoutChangeRouterReuse = false;
    this.layoutChangeList = [];
  }

  public addSnapinToReuse(snapInId: FullSnapInId): void {
    this.trace.info(TraceModules.reuseSnapin, `ReuseStrategyService:addSnapinToReuse(): ${snapInId.fullId()}`);

    if (this.neverDestroyList.findIndex(el => el.fullId() === snapInId.fullId()) === -1) {
      this.neverDestroyList.push(snapInId);
    }
  }

  public removeSnapinToReuse(snapInId: FullSnapInId): void {
    this.trace.info(TraceModules.reuseSnapin, `ReuseStrategyService:removeSnapinToReuse(): ${snapInId.fullId()}`);

    const sn = this.neverDestroyList.findIndex(x => x.fullId() === snapInId.fullId());
    if (sn != -1) {
      this.neverDestroyList.splice(sn, 1);
    }
  }

  private getSnapinIdFromRoute(route: ActivatedRouteSnapshot): FullSnapInId | undefined {
    const data: FullSnapInId = (route.data.snapinId) as FullSnapInId;
    if (isNullOrUndefined(data)) {
      return undefined;
    }
    return data;
  }

  private findFullSnapinIdInLayoutChangeList(route: ActivatedRouteSnapshot): FullSnapInId | undefined {
    return this.layoutChangeList!.find(item => {
      const data = this.getSnapinIdFromRoute(route);
      if (data === undefined) {
        return false;
      }
      return (FullSnapInId.areEqual(item, data) && (route.outlet === this.primaryOutletName));
    })!;
  }

  private findFullSnapinIdInNeverDestroyList(route: ActivatedRouteSnapshot): FullSnapInId | undefined {
    const fullSnapin = this.getSnapinIdFromRoute(route);
    const foundSnapin = this.neverDestroyList.find(sn => {
      if ((!isNullOrUndefined(fullSnapin) && fullSnapin?.fullId() === sn.fullId()) && (route.outlet === this.primaryOutletName)) {
        return true;
      }
      return false;
    });
    return foundSnapin;
  }

  private retrieveInternal(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    let result: DetachedRouteHandle | null | undefined = null;
    let handleHandled = false;
    if (this._layoutChangeRouterReuse === true) {
      const fullSnapinLayoutList = this.findFullSnapinIdInLayoutChangeList(route);
      if (fullSnapinLayoutList !== undefined) {
        result = this.getStoredRouteHandle(fullSnapinLayoutList.fullId(), route.outlet);
        if (result !== undefined) {
          handleHandled = true;
        } else {
          this.trace.error(TraceModules.reuseSnapin, `ReuseStrategyService:retrieve(): Handle not found for: ${fullSnapinLayoutList.fullId()}`);
        }
      }
    }

    if (!handleHandled) {
      // check the neverDestroy List
      const fullSnapinDestroyList = this.findFullSnapinIdInNeverDestroyList(route);
      if (fullSnapinDestroyList !== undefined) {
        result = this.getStoredRouteHandle(fullSnapinDestroyList.fullId(), route.outlet);
      }
    }

    if (result === undefined) {
      result = null;
    }
    return result;
  }

  private storeInternal(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): boolean {
    let handleHandledInLayoutChange = false;
    if (this._layoutChangeRouterReuse === true) {
      handleHandledInLayoutChange = this.storeInternalLayoutChange(route, handle);
    }

    if (handleHandledInLayoutChange) {
      return true;
    } else {
      this.storeInternalDestroyList(route, handle);
      return false;
    }
  }

  private storeInternalLayoutChange(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): boolean {
    let handleHandled = false;
    const fullSnapinLayoutList = this.findFullSnapinIdInLayoutChangeList(route);
    if (fullSnapinLayoutList !== undefined) {
      if (handle === null) {
        // we must deleted the handle
        this.notifyBeforeAttachToSnapin(fullSnapinLayoutList.fullId(), route.outlet);
        this.deleteStoredRouteHandle(fullSnapinLayoutList.fullId(), route.outlet);
        handleHandled = true;
      } else {
        // we must store the handle
        this.setStoredRouteHandle(fullSnapinLayoutList.fullId(), route.outlet, handle);
        this.notifyAfterDetachToSnapin(handle);
        handleHandled = true;
      }
    } else {
      this.trace.info(TraceModules.reuseSnapin, `Snapin not found in layout change list, snapin=${this.getSnapinIdFromRoute(route)?.fullId()}`);
    }
    return handleHandled;
  }

  private storeInternalDestroyList(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const fullSnapinDestroyList = this.findFullSnapinIdInNeverDestroyList(route);
    if (fullSnapinDestroyList !== undefined) {
      if (handle === null) {
        // we must deleted the handle
        this.notifyBeforeAttachToSnapin(fullSnapinDestroyList.fullId(), route.outlet);
        this.deleteStoredRouteHandle(fullSnapinDestroyList.fullId(), route.outlet);
      } else {
        // we must store the handle
        this.setStoredRouteHandle(fullSnapinDestroyList.fullId(), route.outlet, handle);
        this.notifyAfterDetachToSnapin(handle);
      }
    } else {
      this.trace.error(TraceModules.reuseSnapin, `Snapin not found in destroy list, snapin=${this.getSnapinIdFromRoute(route)?.fullId()}`);
    }
  }

  private setStoredRouteHandle(fullId: string, outletName: string, handle: DetachedRouteHandle): void {
    this.storedRouteHandles.set((`${fullId}.${outletName}`), handle);
  }

  private getStoredRouteHandle(fullId: string, outletName: string): DetachedRouteHandle | undefined | null {
    return this.storedRouteHandles.get(`${fullId}.${outletName}`);
  }

  private deleteStoredRouteHandle(fullId: string, outletName: string): void {
    this.storedRouteHandles.delete(`${fullId}.${outletName}`);
  }

  private hasStoredRouteHandle(fullId: string, outletName: string): boolean {
    return this.storedRouteHandles.has(`${fullId}.${outletName}`);
  }

  private notifyBeforeAttachToSnapin(fullId: string, ouletName: string): void {
    if (this.hasStoredRouteHandle(fullId, ouletName)) {
      const storedHandle: any = this.getStoredRouteHandle(fullId, ouletName);
      const snapinCmp: SnapInBase = (storedHandle).componentRef?.instance;
      if ((snapinCmp !== undefined) && (typeof (snapinCmp.onBeforeAttach) === 'function')) {
        snapinCmp.onBeforeAttach();
      }
    }
  }

  private notifyAfterDetachToSnapin(handle: any): void {
    const snapinCmp: SnapInBase = (handle as any).componentRef?.instance;
    if ((snapinCmp !== undefined) && (typeof (snapinCmp.onAfterDettach) === 'function')) {
      snapinCmp.onAfterDettach();
    }
  }

  private getTrace(route: ActivatedRouteSnapshot): string {
    let msg: string;
    if (route != null) {
      if (route.component != null) {
        msg = `Outlet: ${route.outlet}; Component: ${((route.component) as any).name}; route: ${route.toString()}`;
      } else {
        msg = `Outlet: ${route.outlet}; route: ${route.toString()}`;
      }
      const id = this.getSnapinIdFromRoute(route);
      if (id !== undefined) {
        msg = msg + `\nroute data: frame: ${id.frameId}, snapin: ${id.snapInId}`;
      }
    } else {
      msg = `Route: undefined`;
    }

    return msg;
  }
}
