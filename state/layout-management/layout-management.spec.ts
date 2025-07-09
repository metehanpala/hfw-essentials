import { FrameStore, HfwFrame } from '../../shared';
import { HLDL_TEST_EXAMPLE } from '../../shared/hldl/hldl-example-data.model';
import { LayoutManagement } from './layout-management';

describe('LayoutManagement', () => {

  const traceServiceStub: any = {
    debug: (source: 'LayoutManagement', message?: string, ...optionalParams: any[]) => { },
    info: (source: 'LayoutManagement', message?: string, ...optionalParams: any[]) => { }
  };

  const frameConfig: HfwFrame = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[4]));
  const frameStore: FrameStore = new FrameStore(frameConfig, null!, null!, null!, null!);

  // it('LayoutManagement should be created', () => {
  //   expect(layoutManagement).not.toBeNull();

  // });

  it('Call checkFrameNeedsNewLayout and test isNumberOfLayoutChanged value ', () => {
    expect(LayoutManagement.checkFrameNeedsNewLayout(frameStore, traceServiceStub).isNumberOfLayoutChanged).toEqual(false);
  });

  it('Call checkFrameNeedsNewLayout and test newLayoutId value ', () => {
    expect(LayoutManagement.checkFrameNeedsNewLayout(frameStore, traceServiceStub).newLayoutId).toBeNull();
  });

  it('Call calculateNextFavoriteLayoutPerRange and test FavoriteLayoutsPerRange ', () => {
    expect(LayoutManagement.calculateNextFavoriteLayoutPerRange(frameStore, '')).not.toBeNull();
  });

  it('Call calculateNextFavoriteLayoutPerRange and test FavoriteLayoutsPerRange.largeLayoutId ', () => {
    expect(LayoutManagement.calculateNextFavoriteLayoutPerRange(frameStore, '').largeLayoutId).toEqual('');
  });

  it('Call calculateNextFavoriteLayoutPerRange and test FavoriteLayoutsPerRange with pane ', () => {
    expect(LayoutManagement.calculateNextFavoriteLayoutPerRange(frameStore, '2-pane').largeLayoutId).toEqual('2-pane');
  });

  // checkFrameNeedsNewLayoutAfterViewChange
  it('Call checkFrameNeedsNewLayoutAfterViewChange and test newLayoutId ', () => {
    expect(LayoutManagement.checkFrameNeedsNewLayoutAfterViewChange(frameStore, '').newLayoutId).toEqual('2-pane');
  });

  it('Call checkFrameNeedsNewLayoutAfterViewChange and test isNumberOfLayoutChanged ', () => {
    expect(LayoutManagement.checkFrameNeedsNewLayoutAfterViewChange(frameStore, '').isNumberOfLayoutChanged).toEqual(false);
  });

  it('Call findNextAvailableLayoutIdOnShrink  ', () => {
    expect(LayoutManagement.findNextAvailableLayoutIdOnShrink(frameConfig.layoutInstances[1], frameStore)).toEqual('2-pane');
  });

  it('Call getMostFittingLayoutId  ', () => {
    expect(LayoutManagement.getMostFittingLayoutId(frameConfig.layoutInstances)).toEqual('2-pane');
  });
});
