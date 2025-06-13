import { ChangeDetectorRef } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { Subscription } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';
import { NodeMapSnapInViewModelBase } from './snapin-vm.base';

export class NodeMapSnapInViewModel implements NodeMapSnapInViewModelBase {

    private isDisposed = false;
    private isActivated = false;
    private subscriptions: Subscription[] = [];

    public get id(): string {
        return this.sniId;
    }

    public activate(locale: string, cdf: ChangeDetectorRef): void {
        this.checkDisposed('activate');

        if (!this.isActivated) {
            this.isActivated = true;
        }

        this.traceService.info(TraceModules.nodeMapSnapIn, 'Activate view-model: sniId=%s', this.sniId);
    }

    public deactivate(): void {
        this.checkDisposed('deactivate');

        this.subscriptions.forEach((sub: Subscription) => {
            if (sub != null) {
                sub.unsubscribe();
            }
        });

        this.subscriptions = [];
        this.isActivated = false;
        this.traceService.info(TraceModules.nodeMapSnapIn, 'Deactivate view-model: sniId=%s', this.sniId);
    }

    public dispose(): void {
        if (!this.isDisposed) {
            this.deactivate();
            this.isDisposed = true;
            this.traceService.info(TraceModules.nodeMapSnapIn, 'Disposed view-model: sniId=%s', this.sniId);
        }
    }

    public clear(): void {
        this.checkDisposed('clear');
    }

    /*
     * constructor arguments:
     * sniId - snapin identifier, used by snapin service to uniquely
     *         keep track of this instance of the vm
     * traceService - tracing service, eh?
     */
    constructor(
        private readonly sniId: string,
        private readonly traceService: TraceService) {
        if (!sniId) {
            throw new Error('sniId cannot be undefined or empty');
        }
    }

    private checkDisposed(fcn: string): void {
        if (this.isDisposed) {
            throw new Error(`View model has been disposed: Id=${this.sniId} Function=${fcn}`);
        }
    }

    private checkActivation(fcn: string): void {
        if (!this.isActivated) {
            throw new Error(`View model has not been activated: Id=${this.sniId} Function=${fcn}`);
        }
    }
}
