export class KeyValuePair<TKey, TValue> {
    private _key: TKey = undefined;
    public get Key(): TKey {
        return this._key;
    }
    public set Key(value: TKey) {
        if (this._key !== value) {
            this._key = value;
        }
    }

    private _value: TValue = undefined;
    public get Value(): TValue {
        return this._value;
    }
    public set Value(value: TValue) {
        if (this._value !== value) {
            this._value = value;
        }
    }

    constructor(key: TKey, value: TValue) {
        this._key = key;
        this._value = value;
    }
}

export class Dictionary<TKey, TValue> {

    public get Count(): number {
        return this._dictionaryEnrties.size;
    }

    private readonly _dictionaryEnrties: Map<TKey, TValue> = new Map<TKey, TValue>();
    private readonly _values: TValue[] = new Array<TValue>();

    public get Values(): TValue[] {
        this._values.length = 0;
        this._dictionaryEnrties.forEach(value => {
            this._values.push(value);
        });
        return this._values;
    }

    public Add(key: TKey, value: TValue): void {
        if (!this.ContainsKey(key)) {
            this._dictionaryEnrties.set(key, value);
        }
        else {
            throw Error('Key Exists Already:' + key);
        }
    }

    public Remove(key: TKey): boolean {
        return this._dictionaryEnrties.delete(key);
    }

    public ContainsKey(key: TKey): boolean {

        return this._dictionaryEnrties.has(key);
    }

    public GetValue(key: TKey): TValue {
        let value: TValue;

        if (this._dictionaryEnrties.has(key)) {
            value = this._dictionaryEnrties.get(key);
        }

        return value;
    }

    public First(): KeyValuePair<TKey, TValue> {
        let first: KeyValuePair<TKey, TValue>;
        if (this._dictionaryEnrties.size > 0) {
            const keys: IterableIterator<TKey> = this._dictionaryEnrties.keys();
            const values: IterableIterator<TValue> = this._dictionaryEnrties.values();
            first = new KeyValuePair<TKey, TValue>(keys.next().value, values.next().value);
        }

        return first;
    }

    public Clear(): void {
        this._dictionaryEnrties.clear();
    }
}
