export class MathUtils {

    public static readonly factor: number = Math.PI / 180;

  /**
   * whether a set is a superset
   * @param set the reference set
   * @param subset the comparison set
   */
  public static isSuperset(set: Set<any>, subset: Set<any>): boolean {
    let ret: boolean = true;
    subset.forEach((sel: any) => {
      if (!set.has(sel)) {
        ret = false;
      }
    });
    return ret;
  }

  /**
   * union of 2 sets
   * @param setA
   * @param setB
   */
  public static union(setA: Set<any>, setB: Set<any>): Set<any> {
    const _union: Set<any> = new Set(setA);
    setB.forEach((elem: any) => {
      _union.add(elem);
    });
    return _union;
  }

  /**
   * difference between 2 sets
   * @param setA
   * @param setB
   */
  public static difference(setA: Set<any>, setB: Set<any>): Set<any> {
    const _difference: Set<any> = new Set(setA);
    setB.forEach((elem: any) => {
      _difference.delete(elem);
    });
    return _difference;
  }

  public static DegreesToRadians(degrees: number): number {
    return degrees * MathUtils.factor;
  }

  public static RadiansToDegrees(radians: number): number {
    return radians / MathUtils.factor;
  }

  public static ToUint32(x: number): number {
    return MathUtils.modulo(MathUtils.ToInteger(x), Math.pow(2, 32));
  }

  public static sum(): number {

    let sum: number = 0;
    for (let i: number = 0; i < arguments.length; i++) {
      /* eslint-disable-next-line prefer-rest-params*/
      sum += arguments[i];
    }

    return sum;
  }

  public static average(): number {
    if (arguments.length === 0) {
      return 0;
    }

    let sum: number = 0;
    for (let i: number = 0; i < arguments.length; i++) {
      /* eslint-disable-next-line prefer-rest-params*/
      sum += arguments[i];
    }
    return sum / arguments.length;
  }

  private static ToInteger(x: number): number {
    x = Number(x);
    return x < 0 ? Math.ceil(x) : Math.floor(x);
  }

  private static modulo(a: number, b: number): number {
    return a - Math.floor(a / b) * b;
  }
}
