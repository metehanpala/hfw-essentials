import { SimpleChanges } from '@angular/core';

export const isPresent = (item: any): any => item !== null && item !== undefined;

export const isObject = (item: any): any => isPresent(item) && typeof item === 'object';

export const isChanged = (propertyName: string, changes: SimpleChanges, skipFirstChange = true): any => (
  typeof changes[propertyName] !== 'undefined' &&
  (!changes[propertyName].isFirstChange() || !skipFirstChange) &&
  changes[propertyName].previousValue !== changes[propertyName].currentValue
);

export const DEBUG_LOG = false;
