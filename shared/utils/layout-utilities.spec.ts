import { HLDL_TEST_EXAMPLE } from '../../shared/hldl/hldl-example-data.model';
import { HfwFrame } from '../hldl/hldl-data.model';
import { LayoutUtilities } from './layout-utilities';

describe('LayoutUtilities', () => {

  const frameConfig: HfwFrame = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE.hfwInstance.hfwFrames[5]));
  frameConfig.layoutInstances[1].minWidthFromMediaQuery = 360;
  frameConfig.layoutInstances[2].minWidthFromMediaQuery = 1075;

  it('should get breakpoints', () => {
    const breakpoints: number[] = LayoutUtilities.getBreakpoints(frameConfig);
    expect(breakpoints.length).toEqual(1);
    expect(breakpoints).toEqual([1075]);
  });

  it('should create layout map', () => {
    const layoutMap = LayoutUtilities.layoutMapCreator(frameConfig);
    expect(layoutMap.get('2-pane')).toEqual(true);
  });

});
