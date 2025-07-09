import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { FullSnapInId } from '../../common/fullsnapinid';
import { ISnapInActions } from '../../common/interfaces';
import { SnapInActions } from '../../common/interfaces/snapin-actions.model';
import { SnapinActionsService } from './snapinactions.service';

describe('SnapinActionsService', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [SnapinActionsService,
        { provide: TraceService, useClass: MockTraceService }]
    })
      .compileComponents();
  }));

  it('should create SnapinActionsService',
    inject([SnapinActionsService], (snapinActionsService: SnapinActionsService) => {
      expect(snapinActionsService instanceof SnapinActionsService).toBe(true);
    }));

  it('SnapinActionsService call methods for Actions ',
    inject([SnapinActionsService], (snapinActionsService: SnapinActionsService) => {
      const fullSnapInId: FullSnapInId = FullSnapInId.createFrom('system-manager.txt-view')!;
      const snapInActions: SnapInActions = { primaryActions: [], secondaryActions: [], viewType: 'collapsible' };
      snapinActionsService.setSnapInActions(fullSnapInId, snapInActions);
      snapinActionsService.getSnapInActions(fullSnapInId).
        subscribe((value: any) => {
          expect(value).not.toBeNull();
        });
    }));
});
