export interface Command {
  execute(parameter?: any): void;
  canExecute(_parameter?: any): boolean;
}

export class ActionCommand implements Command {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public constructor(public action: (param: any) => void, public _canExecute = true) {
  }

  public setCanExecute(canExecute: boolean): void {
    this._canExecute = canExecute;
  }

  public execute(parameter: any): void {
    this.action(parameter);
  }

  public canExecute(_parameter: any): boolean {
    return this._canExecute;
  }
}

export enum CommandItemType {
  /**
   * The item is a selectable command item
   */
  Item,
  /**
   * The item is a separator line
   */
  Separator,
  /**
   * The item is a header line
   */
  Header
}

export class CommandClickEvent {
  public constructor(
    public target: any,
    public item: CommandItem) {
  }
}

export class CommandItem {
  public constructor(
    public label: string,
    public command?: Command,
    public icon?: string,
    public id?: string,
    public type: CommandItemType = CommandItemType.Item) {
  }

  public get isItem(): boolean {
    return (this.type === CommandItemType.Item) ? true : false;
  }

  public get isSeparator(): boolean {
    return (this.type === CommandItemType.Separator) ? true : false;
  }

  public get isHeader(): boolean {
    return (this.type === CommandItemType.Header) ? true : false;
  }

  public get isIconDefined(): boolean {
    return ((this.icon !== null) && (this.icon !== undefined) && (this.icon !== '')) ? true : false;
  }
}
