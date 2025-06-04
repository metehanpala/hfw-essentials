/**
 * Represents possible result of unaved data dialog.
 */
export enum UnsavedDataDialogResult {
  Yes,
  No,
  Cancel
}

export interface Config {
  backdrop: boolean;
  ignoreBackdropClick: boolean;
  keyboard: boolean;
}
