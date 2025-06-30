export class StreamReader {
    public index: number;
    private readonly data: Uint8Array;

    constructor(arrayBuffer: ArrayBuffer) {
        this.data = new Uint8Array(arrayBuffer);
        this.index = 0;
    }

    public finished(): boolean {
        return this.index >= this.data.length;
    }

    public readByte(): number {
        return this.data[this.index++];
    }

    public peekByte(): number {
        return this.data[this.index];
    }

    public skipBytes(n: number): void {
        this.index += n;
    }

    public peekBit(i: number): boolean {
        // eslint-disable-next-line no-bitwise
        return !!(this.peekByte() & (1 << 8 - i));
    }

    public readAscii(n: number): string {
        let s: string = '';
        for (let i: number = 0; i < n; i++) {
            s += String.fromCharCode(this.readByte());
        }
        return s;
    }

    public isNext(array: any): boolean {
        for (let i: number = 0; i < array.length; i++) {
            if (array[i] !== this.data[this.index + i]) {
                return false;
            }
        }
        return true;
    }
    public log(message: string): void {
        // TBD
    }

}
