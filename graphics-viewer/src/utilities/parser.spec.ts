import { Parser, SvgUtility } from './parser';

describe('Parser', () => {
  let parser: Parser;
  beforeEach(() => {
    parser = new Parser();
  });

  it('should create a Parser', () => {
    expect(parser instanceof Parser).toBe(true);
  });
});

describe('SvgUtility', () => {
  let svgUtility: SvgUtility;
  beforeEach(() => {
    svgUtility = new SvgUtility();
  });

  it('should create a SvgUtility', () => {
    expect(svgUtility instanceof SvgUtility).toBe(true);
  });
});
