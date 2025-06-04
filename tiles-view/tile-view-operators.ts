import { TilesViewComponent } from './tiles-view/tiles-view.component';
import { isPresent } from './utils';

export const processSkipForNewTotal = (
  component: TilesViewComponent,
  skip: number,
  pageSize: number,
  currentTotal: number,
  newTotal: number
): number => {

  if (isPresent(component) &&
      isPresent(skip) &&
      isPresent(pageSize) &&
      isPresent(currentTotal) &&
      isPresent(newTotal)) {
    if (currentTotal < newTotal) {
      if (skip + pageSize === currentTotal) {
        const delta: number = component.itemsPerRow - (currentTotal % component.itemsPerRow);
        const newLast: number = Math.min(newTotal, currentTotal + delta);
        skip = newLast - pageSize;
      }
    } else {
      if (currentTotal > newTotal) {
        if (skip + pageSize > newTotal) {
          skip = Math.max(newTotal - pageSize, 0);
        }
      }
    }
  }

  return skip;
};
