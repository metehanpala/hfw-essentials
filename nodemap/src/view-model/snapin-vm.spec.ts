import { TraceService } from '@gms-flex/services-common';

import { NodeMapSnapInViewModel } from './snapin-vm';

describe('NodeMapPreselectService', () => {
    let name = '';

    beforeEach(() => {
        name = 'NodeMapPreselectService';
    });

    describe('set name', () => {
        it('name should be set', () => {
            expect(name).toBe('NodeMapPreselectService');
        });
    });
  });

describe('NodeMapSnapInViewModel', () => {
    const sniId = 'snapinTest';
    let sniVm: NodeMapSnapInViewModel;
    let tracer: TraceService;

    it('should be OK: Constructor throw exception if id is null', () => {
        expect(() => new NodeMapSnapInViewModel(null, tracer)).toThrow();
    });

    it('should be OK: Constructor throw exception if id is empty string', () => {
        expect(() => new NodeMapSnapInViewModel('', tracer)).toThrow();
    });

    it('should be OK: Constructor set correct property defaults', () => {
        sniVm = new NodeMapSnapInViewModel(sniId, tracer);
        expect(sniVm.id).toEqual(sniId);
    });
});
