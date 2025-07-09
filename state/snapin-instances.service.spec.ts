import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { SnapinInstancesService } from './snapin-instances.service';

const SYSTEM_MANAGER = 'system-manager';
const SYS_BROW = 'sys-brow';
const VALUE = 'value';

describe('SnapinInstancesService', () => {
  let sniInstanceService: SnapinInstancesService;

  it('SnapinInstancesService creation and methods check.', () => {
    sniInstanceService = new SnapinInstancesService();

    sniInstanceService.registerSnapInBase(new FullSnapInId(SYSTEM_MANAGER, SYS_BROW), VALUE);
    sniInstanceService.registerSnapInBase(new FullSnapInId(SYSTEM_MANAGER, SYS_BROW), VALUE);

    expect(sniInstanceService.getSnapInBase(new FullSnapInId(SYSTEM_MANAGER, SYS_BROW))).toBe(VALUE);
  });

});
