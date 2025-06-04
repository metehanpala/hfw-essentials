export class HfwFilterPillData {

  private readonly valueArr: string[];

  public get values(): readonly string[] {
    return this.valueArr || [];
  }

  public constructor(
    public readonly filterId: number,
    public readonly title: string,
    valueInp: string | string[],
    public readonly icons: boolean = false) {
    if (typeof valueInp === 'string') {
      this.valueArr = [valueInp];
    } else {
      this.valueArr = valueInp;
    }
  }
}
