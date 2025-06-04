import { RowHeightService } from './row-height.service';

describe('RowHeightService', () => {

  const traceServiceStub: any = {
    debug: (source: string, message?: string, ...optionalParams: any[]) => { },
    info: (source: string, message?: string, ...optionalParams: any[]) => { }
  };

  const rowHeightService = new RowHeightService(100, 5, 10, traceServiceStub);

  it('RowHeightService should be created', () => {
    expect(rowHeightService).not.toBeNull();

  });

  it('Get index position', () => {
    expect(rowHeightService.index(11)).toBe(2);

  });

  it('Get totalRows position', () => {
    expect(rowHeightService.totalRows()).toBe(10);
  });

  it('Get offset position', () => {
    expect(rowHeightService.offset(2)).toBe(10);
  });

  it('Get totalHeight ', () => {
    expect(rowHeightService.totalHeight()).toBe(50);
  });
});
