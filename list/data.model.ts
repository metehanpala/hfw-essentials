// Re-export imported types that are used publicly
export class ListItem {

  /**
   * The state of the switch
   *
   * @type {boolean}
   * @memberOf TreeItem
   */
  public checked = false;

  /**
   * If the item is selected (note that the list component supports single and multiple selection)
   *
   * @type {boolean}
   * @memberOf TreeItem
   */
  public selected = false;

  public constructor(public label: string,
    public customData?: any) {
  }
}

export class ClickListEventArgs {
  public constructor(public target: ListItem,
    public event: MouseEvent | null) {
  }
}
