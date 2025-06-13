import { Injectable, OnDestroy } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';

import { TraceModules } from '../shared/trace-modules';
import { NodeMapSnapInViewModel } from '../view-model/snapin-vm';
import { NodeMapSnapInViewModelBase } from '../view-model/snapin-vm.base';

@Injectable({
  providedIn: 'root'
})
export class NodeMapSnapInService implements OnDestroy {

  private sniVmMap: Map<string, NodeMapSnapInViewModel>;

  constructor(
    private readonly traceService: TraceService) {

    this.sniVmMap = new Map<string, NodeMapSnapInViewModel>();
  }

  public ngOnDestroy(): void {
    if (this.sniVmMap) {
      this.sniVmMap.forEach(vm => {
        try {
          vm.dispose();
        } catch (err) {
          this.traceService.error(TraceModules.nodeMapSnapInService, 'ngOnDestroy: caught error');
        }
      });
      this.sniVmMap.clear();
      this.sniVmMap = undefined;
    }
  }

  public registerViewModel(sniId: string): NodeMapSnapInViewModelBase {
    if (sniId === undefined || sniId === null || sniId.length <= 0) {
      throw new Error('sniId argument cannot be undefined or empty');
    }

    let vm: NodeMapSnapInViewModel = this.sniVmMap.get(sniId);

    if (!vm) {
      this.traceService.info(TraceModules.nodeMapSnapInService, `Create new view-model: sniId=[${sniId}]`);

      vm = new NodeMapSnapInViewModel(
        sniId,
        this.traceService);

      this.sniVmMap.set(sniId, vm);
    }

    return vm;
  }

  /**
   * Remove and dispose of snap-in view-model.
   */
  public unregisterViewModel(sniId: string): void {
    const vm: NodeMapSnapInViewModel = this.sniVmMap.get(sniId);
    if (vm !== undefined) {
      this.traceService.info(TraceModules.nodeMapSnapInService, `Destroy view-model: sniId=[${sniId}]`);
      vm.dispose();
      this.sniVmMap.delete(vm.id);
    }
  }
}
