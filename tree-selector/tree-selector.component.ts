import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { boxClicked } from '@simpl/element-ng';
import { Subject, Subscription } from 'rxjs';

import { CheckboxClickEventArgs, CheckboxState, eTsResetOperation, TreeItem, TsSelectionChangedEventArgs } from './tree-selector.model';

@Component({
  selector: 'hfw-tree-selector',
  templateUrl: './tree-selector.component.html',
  styleUrl: './tree-selector.component.scss',
  standalone: false
})
export class TreeSelectorComponent implements OnInit, OnDestroy {

  public filterPattern = '';
  public selectionTreeFiltered: TreeItem[] = [];
  public selectionTreeChanged = false;
  // Expected to be defined ONLY if accordionGroup === true
  public elementIdParentPanelGroup!: string;
  public elementIdPanelBody = 'selectorPanelBody'; // generic default name

  @Input() public excludeAccordion = false;

  @Input() public isSelectorOpen = false;

  @Input() public destroyTreeOnCollapse = false;

  @Input() public enableItemFilter = false;

  @Input() public itemFilterPlaceholder!: string;

  @Input() public selectionLabel!: string;

  @Output() public readonly selectionChanged: EventEmitter<TsSelectionChangedEventArgs> = new EventEmitter<TsSelectionChangedEventArgs>();

  /**
   * Name attribute applied to 'input' element used for filter string input.
   * This is necessary (per Angular ngModel binding constraint) if this component is used
   * within a form.  Parent component must set this to a unique value if multiple
   * selectors are being used within the same form.
   */
  @Input() public inputElementName = 'selectorInput';

  private _selectionTree: TreeItem[] = [];
  private _resetSubscription!: Subscription | null;

  /**
   * Filter items in the provided tree based on the given label filter pattern.
   */
  private static filterTree(treeItems: TreeItem[] | undefined, filterPattern: string): TreeItem[] | undefined {

    if (!this.filterTreeInitialCheck(treeItems, filterPattern)) {
      return this.filterTreeInitialCheckValue(treeItems, filterPattern);
    }

    const treeItemsFiltered: TreeItem[] = [];
    const f: string = filterPattern.toLocaleLowerCase();
    treeItems!.forEach(ti => {
      if (ti.label?.toLowerCase().includes(f)) {
        treeItemsFiltered.push(ti);
      } else {
        const subItemsFiltered: TreeItem[] | undefined = this.filterTree(ti.children, filterPattern);
        if (subItemsFiltered) {
          this.pushWrapper(subItemsFiltered, ti, treeItemsFiltered);
        }
      }
    });
    return treeItemsFiltered;
  }

  private static filterTreeInitialCheck(treeItems: TreeItem[] | undefined, filterPattern: string): boolean {
    if (treeItems === undefined || treeItems === null) {
      return false;
    }
    if (filterPattern === undefined || filterPattern === null || filterPattern.length === 0) {
      return false;
    }
    return true;
  }

  private static filterTreeInitialCheckValue(treeItems: TreeItem[] | undefined, filterPattern: string): TreeItem[] | undefined {
    if (treeItems === undefined || treeItems === null) {
      return undefined;
    }
    if (filterPattern === undefined || filterPattern === null || filterPattern.length === 0) {
      return treeItems;
    }
    return undefined;
  }

  private static pushWrapper(subItemsFiltered: TreeItem[] | undefined, ti: TreeItem<any>, treeItemsFiltered: TreeItem[]): void {
    if (subItemsFiltered!.length > 0 && TreeSelectorComponent.wrapTreeItem(ti, subItemsFiltered!) !== undefined) {
      const tiWrapped: TreeItem | undefined = TreeSelectorComponent.wrapTreeItem(ti, subItemsFiltered!);
      if (tiWrapped) {
        treeItemsFiltered.push(tiWrapped);
      }
    }
  }

  /**
   * Set the checkbox show state for all TreeItem data bound to the control.
   */
  private static setShowCheckboxRecursive(tiArr: TreeItem[] | undefined): void {
    if (tiArr) {
      tiArr.forEach(ti => {
        if (ti) {
          ti.showCheckbox = true;
          ti.showOptionbox = false;
          TreeSelectorComponent.setShowCheckboxRecursive(ti.children);
        }
      });
    }
  }

  /**
   * Wrap the provided tree-item and set the wrapper children to the provided list.
   * @param ti
   * @param children
   */
  private static wrapTreeItem(ti: TreeItem, tiChildren: TreeItem[]): TreeItem | undefined {
    if (ti === undefined || ti === null) {
      return undefined;
    }
    const tiWrapper: TreeItem = {
      label: ti.label,
      state: ti.state,
      parent: ti.parent,
      children: tiChildren,
      customData: ti, // custom data set to original item
      icon: ti.icon,
      dataField1: ti.dataField1,
      dataField2: ti.dataField2,
      showCheckbox: ti.showCheckbox,
      showOptionbox: ti.showOptionbox
    };
    tiWrapper.checked = ti.checked;

    return tiWrapper;
  }

  /**
   * Selection tree items.
   */
  @Input() public set selectionTree(selTree: TreeItem[]) {
    const t: TreeItem[] = selTree || []; // map undefined/null to empty array
    if (this._selectionTree !== t) {
      TreeSelectorComponent.setShowCheckboxRecursive(t);
      this._selectionTree = t;

      // Delay updating the selectionTreeFiltered, which is bound to the internal tree-view,
      // until AFTER other tree view properties have been set through their bindings.
      // This is necessary because setting the tree-view 'enableCheckbox' and 'inheritChecked'
      // properties, has the effect of clearing the checkbox states of ALL bound TreeItems!
      // We want to avoid that in case the client of the tree-selector has preset some items to
      // be in a selected state.
      this.selectionTreeChanged = true;
    }
  }

  /**
   * Called by consumer
   */
  @Input() public set reset(subj: Subject<eTsResetOperation> | null) {
    // Unsubscribe from old
    if (!isNullOrUndefined(this._resetSubscription) && this._resetSubscription) {
      this._resetSubscription.unsubscribe();
    }
    // Subscribe to new, if defined
    if (!isNullOrUndefined(subj) && (subj?.subscribe(op => this.onReset(op) !== undefined))) {
      this._resetSubscription = subj.subscribe(op => this.onReset(op));
    }
  }

  /**
   * Life-cycle hook called on component initialization.
   */
  public ngOnInit(): void {
    if (this.selectionTreeChanged && TreeSelectorComponent.filterTree(this._selectionTree, this.filterPattern) != undefined) {
      this.selectionTreeChanged = false; // reset changed flag

      this.selectionTreeFiltered = TreeSelectorComponent.filterTree(this._selectionTree, this.filterPattern) ?? [];
    }
  }

  /**
   * Life-cycle hook called on component destruction.
   */
  public ngOnDestroy(): void {
    this.reset = null; // force unsubscribe from reset event
  }

  /**
   * Handle selector expander click event.
   */
  public onExpanderClick(): void {
    this.isSelectorOpen = !this.isSelectorOpen;
  }

  /**
   * Handle change in the filter pattern input element.
   */
  public onFilterPatternChange(params?: string): void {
    let pattern: string | null = this.filterPattern;
    if (params) {
      pattern = params;
    }
    if (pattern) {
      this.selectionTreeFiltered = TreeSelectorComponent.filterTree(this._selectionTree, pattern) ?? [];
    }

  }

  /**
   * Handle change to the selection (checkbox click).
   */
  public onSelectionChange(args: CheckboxClickEventArgs): void {
    let ti: TreeItem | undefined = args ? args.target : undefined;
    if (ti === undefined || ti === null) {
      return;
    }

    // If the item clicked is a "wrapper" tree-item, unwrap it and set the original tree-item state.
    // Commented since not able to convert into simpl 35 the next 3 lines
    if (ti.hasOwnProperty('customData')) {
      ti = ti.customData as TreeItem;
      boxClicked(ti, true);
    }

    // Update the check state of all "wrapper" tree-items in the filter tree
    this.updateWrapperCheckboxStates(this.selectionTreeFiltered);

    // Indicate selection change to consumer
    this.selectionChanged.emit(new TsSelectionChangedEventArgs(ti, args.oldState, args.newState));
  }

  /**
   * Propagate check state of wrapped items to their wrappers.
   */
  private updateWrapperCheckboxStates(tiArr: TreeItem[] | undefined): void {
    if (!isNullOrUndefined(tiArr) && tiArr != undefined) {
      tiArr.forEach(ti => {
        if (!isNullOrUndefined(ti?.customData) && ti.customData.hasOwnProperty('checked')) {
          ti.checked = (ti.customData).checked;
          this.updateWrapperCheckboxStates(ti.children);
        }
      });
    }
  }

  /**
   * Handle event requesting reset of the tree selector.
   */
  private onReset(op: eTsResetOperation): void {
    if (this._selectionTree === undefined || this._selectionTree === null) {
      return;
    }

    let notify = true;
    if (op === eTsResetOperation.Clear) {
      this.clearSelection();
    } else {
      notify = false;
    }
    if (notify) {
      this.selectionChanged.emit(undefined); // indicate selection 'reset' (null argument) to consumer
    }
  }

  /**
   * Clear selection.
   */
  private clearSelection(): void {
    this._selectionTree.forEach(i => this.setCheckStateRecursive(i, 'unchecked'));
    this.updateWrapperCheckboxStates(this.selectionTreeFiltered);
  }

  /**
   * Set the check state of an item and all its descendants to a given value.
   */
  private setCheckStateRecursive(ti: TreeItem, state: CheckboxState): void {
    if (!isNullOrUndefined(ti)) {
      ti.checked = state;
      if (!isNullOrUndefined(ti.children)) {
        ti.children?.forEach(child => this.setCheckStateRecursive(child, state));
      }
    }
  }
}
