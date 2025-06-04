import { CheckboxState, TreeItem } from '@simpl/element-ng';

// Re-export imported types that are used publicly
export { TreeItem, TreeItemFolderState, CheckboxClickEventArgs, CheckboxState } from '@simpl/element-ng';

/**
 * Types of reset operations.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export enum eTsResetOperation {
  /**
   * Clear all selections in the selection tree.
   */
  Clear = 0

  /**
   * This reset command should be used when the consumer intends to restore the selection
   * tree to some saved state.
   * NOTE: At present, this is not needed but may be if push notification is enabled for
   * the tree-selector component.
   */
  // Resync = 1
}

/**
 * Arguments sent with TreeSelectorComponent selectionChanged event.
 */
export class TsSelectionChangedEventArgs {
  public constructor(
    private readonly _target: TreeItem,
    private readonly _oldState: CheckboxState,
    private readonly _newState: CheckboxState) {
  }

  /**
   * Item that changes state through user selection.
   */
  public get target(): TreeItem {
    return this._target;
  }

  /**
   * Old selection state.
   */
  public get oldState(): CheckboxState {
    return this._oldState;
  }

  /**
   * New selection state.
   */
  public get newState(): CheckboxState {
    return this._newState;
  }
}
