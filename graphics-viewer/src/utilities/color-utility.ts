import { Guid } from './guid';

export class ColorUtility {

    public static Interpolate(rgbColor1: RgbColor, rgbColor2: RgbColor, percentage: number): RgbColor {

        // interpolate in the hsv space rather than in the rgb space
        const hsv1: HsvColor = ColorUtility.ConvertColorToHsv(rgbColor1);
        const hsv2: HsvColor = ColorUtility.ConvertColorToHsv(rgbColor2);

        const h: number = ColorUtility.InterpolateNumeric(hsv1.H, hsv2.H, percentage);
        const s: number = ColorUtility.InterpolateNumeric(hsv1.S, hsv2.S, percentage);
        const v: number = ColorUtility.InterpolateNumeric(hsv1.V, hsv2.V, percentage);
        const result: RgbColor = ColorUtility.ConvertHsvToRgb(h, s, v);
        result.A = ColorUtility.InterpolateNumeric(rgbColor1.A, rgbColor2.A, percentage);

        return result;
    }

    public static InterpolateNumeric(value1: number, value2: number, percentage: number): number {
        if (value1 === value2) {
            return value1;
        }
        return value1 + (value2 - value1) * percentage;
    }

    public static GetColorFromString(color: string): RgbColor {
        if (color === undefined) {
            return new RgbColor(0, 0, 0, 0);
        }

        color = color.trim();
        if (color.startsWith('#') && color.length === 9) {

            const alphaChannel: string = color.substring(1, 3);
            const parsedAlpha: number = Math.round(parseInt(alphaChannel, 16));

            const redChannel: string = color.substring(3, 5);
            const parsedRed: number = Math.round(parseInt(redChannel, 16));

            const greenChannel: string = color.substring(5, 7);
            const parsedGreen: number = Math.round(parseInt(greenChannel, 16));

            const blueChannel: string = color.substring(7);
            const parsedBlue: number = Math.round(parseInt(blueChannel, 16));

            if (!isNaN(parsedAlpha) && !isNaN(parsedRed) && !isNaN(parsedGreen) && !isNaN(parsedBlue)) {
                return new RgbColor(parsedAlpha, parsedRed, parsedGreen, parsedBlue);
            }
            else {
                return new RgbColor(0, 0, 0, 0);
            }

        }
        else {
            return new RgbColor(0, 0, 0, 0);
        }
    }

    public static InterpolateBrush(brush1: Color, brush2: Color, percentage: number): Color {
        if (brush1 == null || brush2 == null || brush1.Type !== brush2.Type) {
            return brush1; // no interpolation possible
        }

        if (brush1.Type === BrushType.Solid && brush2.Type === BrushType.Solid) {
            const color1: RgbColor = ColorUtility.GetColorFromString(brush1.ActualColorString);
            const color2: RgbColor = ColorUtility.GetColorFromString(brush2.ActualColorString);
            const resultRgbColor: RgbColor = ColorUtility.Interpolate(color1, color2, percentage);

            const resultColor: Color = new Color(resultRgbColor.ColorString);
            return resultColor;
        }

        const resolvedBrush1: any = brush1.HasResolvedBrush ? brush1.Brush : undefined;
        const resolvedBrush2: any = brush2.HasResolvedBrush ? brush2.Brush : undefined;
        if (resolvedBrush1 === undefined || resolvedBrush2 === undefined) {
            return brush1;
        }

        if (resolvedBrush1 instanceof LinearGradientColor && resolvedBrush2 instanceof LinearGradientColor) {

            const result: LinearGradientColor = ColorUtility.InterpolateGradientStops(resolvedBrush1, resolvedBrush2, percentage);
            result.Start = new Point(ColorUtility.InterpolateNumeric(resolvedBrush1.Start.X, resolvedBrush2.Start.X, percentage),
                ColorUtility.InterpolateNumeric(resolvedBrush1.Start.Y, resolvedBrush2.Start.Y, percentage));
            result.End = new Point(ColorUtility.InterpolateNumeric(resolvedBrush1.End.X, resolvedBrush2.End.X, percentage),
                ColorUtility.InterpolateNumeric(resolvedBrush1.End.Y, resolvedBrush2.End.Y, percentage));

            const resultColor: Color = new Color('LinearGradient');
            resultColor.Brush = result;
            resultColor.HasResolvedBrush = true;
            resultColor.ColorString = result.Url;
            resultColor.Type = BrushType.Compound;

            return resultColor;
        }
        else if (resolvedBrush1 instanceof RadialGradientColor && resolvedBrush2 instanceof RadialGradientColor) {

            const result: RadialGradientColor = ColorUtility.InterpolateGradientStops(resolvedBrush1, resolvedBrush2, percentage);
            result.Origin = new Point(ColorUtility.InterpolateNumeric(resolvedBrush1.Origin.X, resolvedBrush2.Origin.X, percentage),
                ColorUtility.InterpolateNumeric(resolvedBrush1.Origin.Y, resolvedBrush2.Origin.Y, percentage));
            result.RadiusX = ColorUtility.InterpolateNumeric(resolvedBrush1.RadiusX, resolvedBrush2.RadiusX, percentage);
            result.RadiusY = ColorUtility.InterpolateNumeric(resolvedBrush1.RadiusY, resolvedBrush2.RadiusY, percentage);
            result.Center = new Point(ColorUtility.InterpolateNumeric(resolvedBrush1.Center.X, resolvedBrush2.Center.X, percentage),
                ColorUtility.InterpolateNumeric(resolvedBrush1.Center.Y, resolvedBrush2.Center.Y, percentage));

            const resultColor: Color = new Color('RadialGradient');
            resultColor.Brush = result;
            resultColor.HasResolvedBrush = true;
            resultColor.ColorString = result.Url;
            resultColor.Type = BrushType.Compound;

            return resultColor;
        }

        return brush1;
    }

    public static InterpolateGradientStops(resolvedBrush1: any, resolvedBrush2: any, percentage: number): any {
        if (resolvedBrush1.SpreadMethod === resolvedBrush2.SpreadMethod && resolvedBrush1.MappinMode === resolvedBrush2.MappinMode) {
            const resultgradientStops: GradientStop[] = [];
            for (let index: number = 0; index < Math.min(resolvedBrush1.GradientStops.length, resolvedBrush2.GradientStops.length); index++) {
                const gradientStop1: GradientStop = resolvedBrush1.GradientStops[index];
                const gradientStop2: GradientStop = resolvedBrush2.GradientStops[index];
                const gradientColor1: RgbColor = ColorUtility.GetColorFromString(gradientStop1.ActualColorString);
                const gradientColor2: RgbColor = ColorUtility.GetColorFromString(gradientStop2.ActualColorString);

                const rgbColor: RgbColor = ColorUtility.Interpolate(gradientColor1, gradientColor2, percentage);
                const offset: number = ColorUtility.InterpolateNumeric(gradientStop1.OffsetValue, gradientStop2.OffsetValue, percentage);
                resultgradientStops.push(new GradientStop(rgbColor.ColorString, offset));
            }

            const result: any = resolvedBrush1 instanceof LinearGradientColor
                ? new LinearGradientColor(resultgradientStops) : new RadialGradientColor(resultgradientStops);
            result.SpreadMethod = resolvedBrush1.SpreadMethod;
            result.MappinMode = resolvedBrush2.MappinMode;
            return result;
        }
    }

    public static ConvertColorToHsv(color: RgbColor): HsvColor {
        return ColorUtility.ConvertRgbToHsv(color.R, color.B, color.G);
    }

    public static ConvertRgbToHsv(r: number, b: number, g: number): HsvColor {
        const min: number = Math.min(Math.min(r, g), b);
        const v: number = Math.max(Math.max(r, g), b);
        const delta: number = v - min;
        let h: number = 0;
        let s: number;

        if (v === 0.0) {
            s = 0;
        }
        else {
            s = delta / v;
        }

        if (s === 0) {
            h = 0.0;
        }
        else {
            if (r === v) {
                h = (g - b) / delta;
            }
            else if (g === v) {
                h = 2 + (b - r) / delta;
            }
            else if (b === v) {
                h = 4 + (r - g) / delta;
            }

            h *= 60;
            if (h < 0.0) {
                h = h + 360;
            }
        }

        const hsvColor: HsvColor = new HsvColor(h, s, v / 255);

        return hsvColor;
    }

    // Converts an HSV color to an RGB color.
    public static ConvertHsvToRgb(h: number, s: number, v: number): RgbColor {
        let r: number = 0;
        let g: number = 0;
        let b: number = 0;

        if (s === 0) {
            r = v;
            g = v;
            b = v;
        }
        else {
            if (h === 360) {
                h = 0;
            }
            else {
                h = h / 60;
            }

            const i: number = Math.trunc(h);
            const f: number = h - i;

            const p: number = v * (1.0 - s);
            const q: number = v * (1.0 - (s * f));
            const t: number = v * (1.0 - (s * (1.0 - f)));

            switch (i) {
                case 0:
                    r = v;
                    g = t;
                    b = p;
                    break;

                case 1:
                    r = q;
                    g = v;
                    b = p;
                    break;

                case 2:
                    r = p;
                    g = v;
                    b = t;
                    break;

                case 3:
                    r = p;
                    g = q;
                    b = v;
                    break;

                case 4:
                    r = t;
                    g = p;
                    b = v;
                    break;

                default:
                    r = v;
                    g = p;
                    b = q;
                    break;
            }
        }
        return new RgbColor(255, (r * 255), (g * 255), (b * 255));
    }

    public static ParseGradientBrush(str: string): any {
        let brush: any;

        // color string e.g.
        // "L0:#FFFFFFFF;0.18198090948381:#FF00FFFF;1:#FF000000;(0,0)(0.791134826288827,0.486875);PR" for a linear gradient
        // "R0:#FF000000;0.5:#FFFFFFFF;1:#FF000000;(72,60)(72,63.6)(144,60);FA" for a radial gradient
        if (str === undefined || str === '') {
            return undefined;
        }

        str = str.trim();
        if (str.length < 2) {
            return undefined;
        }

        try {

            let sortedStops: GradientStop[] = [];
            const points: Point[] = [];
            let pointIndex: number = 0;

            let pos1: number = 1;
            let pos2: number = 0;
            while (true) {
                pos2 = str.indexOf(';', pos1);
                if (pos2 === -1) {
                    break;
                }

                const posColon: number = str.indexOf(':', pos1);
                sortedStops.push(new GradientStop(str.substring(posColon + 1, pos2),
                    parseFloat(str.substring(pos1, posColon))));
                pos1 = pos2 + 1;

                if (str[pos1] === '(') {
                    pos1++;
                    while (true) {
                        const posComma: number = str.indexOf(',', pos1);
                        const posClose: number = str.indexOf(')', posComma + 1);
                        points[pointIndex++] = new Point(parseFloat(str.substring(pos1, posComma)),
                            parseFloat(str.substring(posComma + 1, posClose)));
                        if (str[posClose + 1] !== '(') {
                            break;
                        }
                        pos1 = posClose + 2;
                    }
                    break;
                }
            }

            if (sortedStops.length === 0) {
                return undefined;
            }

            // Sort the gradient stops for gradient to be correct/work.
            sortedStops = sortedStops.sort((stop1, stop2) => {
                const offset1: number = stop1.OffsetValue;
                const offset2: number = stop2.OffsetValue;
                if (offset1 > offset2) {
                    return 1;
                }
                if (offset1 < offset2) {
                    return -1;
                }
                return 0;
            });

            if (str[0].toLowerCase() === 'l') {

                const linearGradientBrush: LinearGradientColor = new LinearGradientColor(sortedStops);

                linearGradientBrush.Start = points[0];
                linearGradientBrush.End = points[1];

                brush = linearGradientBrush;
            }
            else {

                const radialGradientBrush: RadialGradientColor = new RadialGradientColor(sortedStops);

                radialGradientBrush.Center = points[0];
                radialGradientBrush.RadiusX = points[1].X;
                radialGradientBrush.RadiusY = points[1].Y;
                radialGradientBrush.Origin = points[2];
                brush = radialGradientBrush;
            }

            const mappingMode: string = str[str.length - 1].toLowerCase();
            if (mappingMode === 'a') {
                brush.MappingMode = BrushMappingMode.Absolute;
            }
            else if (mappingMode === 'r') {
                brush.MappingMode = BrushMappingMode.RelativeToBoundingBox;
            }

            const spreadMethod: string = str[str.length - 2].toLowerCase();
            if (spreadMethod === 'p') {
                brush.SpreadMethod = 'pad';
            }
            else if (spreadMethod === 'f') {
                brush.SpreadMethod = 'reflect';
            }
            else if (spreadMethod === 't') {
                brush.SpreadMethod = 'repeat';
            }

            return brush;
        }
        catch (ex) {
            return undefined;
        }
    }

    public static GetBrushType(color: string): BrushType {
        // Solid color - #00000000
        // Compound - BlinkColors, RadialGradient, LinearGradient
        return color.startsWith('#') && color.length === 9 ? BrushType.Solid : BrushType.Compound;
    }
}
export class ColorWrap {

    private _current: Color = undefined;
    public get Current(): Color {
        return this._current;
    }

    private _hasBlinkColor: boolean = false;
    public get HasBlinkColor(): boolean {
        return this._hasBlinkColor;
    }

    private _first: Color = undefined;
    public get First(): Color {
        return this._first;
    }

    private _second: Color = undefined;
    public get Second(): Color {
        return this._second;
    }

    private _actualColorString: string = undefined;
    public get ActualColorString(): string {
        if (this.HasBlinkColor) { // For compound brushes resolved urls will replace the actual color string
            const first: string = this._first.HasResolvedBrush ? this._first.ColorString : this._first.ActualColorString;
            const second: string = this._second.HasResolvedBrush ? this._second.ColorString : this._second.ActualColorString;
            this._actualColorString = first + '/' + second;
        }

        return this._actualColorString;
    }

    public Next(): Color {
        if (!this._hasBlinkColor) {
            return this._current;
        }

        this._current = this._current === this._first ? this._second : this._first;
        return this._current;
    }

    public constructor(colorString: string) {
        if (colorString === undefined && colorString === '') {
            throw Error('Color string cannot be empty!!');
        }

        this._actualColorString = colorString;

        this.CreateColor(colorString);
    }

    public SetColor(colorString: string): void {
        if (colorString === undefined && colorString === '') {
            throw Error('Color string cannot be empty!!');
        }

        this._actualColorString = colorString;

        this.Clear();
        this.CreateColor(colorString);
    }

    public Clear(): void {
        this._hasBlinkColor = false;
        this._first = undefined;
        this._second = undefined;
        this._current = undefined;
    }

    private CreateColor(colorString: string): void {
        if (colorString.includes('/')) {
            const colors: string[] = colorString.split('/');

            this._first = new Color(colors[0]);
            this._second = new Color(colors[1]);
            this._hasBlinkColor = true;
        }
        else {
            this._first = new Color(colorString);
        }

        this._current = this._first;
    }
}

export class Color {
    private readonly _opacity: number;
    public get Opacity(): number {
        return this._opacity;
    }

    // RGB color string
    private _colorString: string = undefined;
    public get ColorString(): string {
        return this._colorString;
    }
    public set ColorString(value: string) {
        if (this._colorString !== value) {
            this._colorString = value;
        }
    }

    private readonly _actualColorString: string = undefined;
    public get ActualColorString(): string {
        return this._actualColorString;
    }

    private _type: BrushType = BrushType.Solid;
    public get Type(): BrushType {
        return this._type;
    }
    public set Type(value: BrushType) {
        if (this._type !== value) {
            this._type = value;
        }
    }

    private _brush: any = undefined;
    public get Brush(): any {
        return this._brush;
    }
    public set Brush(value: any) {
        if (this._brush !== value) {
            this._brush = value;
        }
    }

    private _hasResolvedBrush: any = false;
    public get HasResolvedBrush(): boolean {
        return this._hasResolvedBrush;
    }
    public set HasResolvedBrush(value: boolean) {
        if (this._hasResolvedBrush !== value) {
            this._hasResolvedBrush = value;
        }
    }

    public HasUrl(): boolean {
        return this._colorString.startsWith('url(#') && this.ColorString.endsWith(')');
    }

    constructor(value: string) {
        this._actualColorString = value;

        if (value.length === 9) {
            // ARGB color string
            // fill-opacity
            const alpha: string = value.substring(1, 3);
            const opacity: number = parseInt(alpha, 16) / 255.0;

            // fill
            const fill: string = '#' + value.substring(3);
            this._opacity = opacity;
            this._colorString = fill;
        }
        else if (value.startsWith('url')) {
            this._opacity = 1;
            this._colorString = value;
            this._type = BrushType.Compound;
        }
        else {
            this._opacity = 1;
            this._colorString = value;
            if (value.startsWith('L') || value.startsWith('R')) {
                this._brush = ColorUtility.ParseGradientBrush(value);
                if (this._brush !== undefined) {
                    this._hasResolvedBrush = true;
                    this._colorString = this._brush.Url;
                    this._type = BrushType.Compound;
                }
            }
        }
    }
}

export class RadialGradientColor {

    private _id: string = undefined;
    public get Id(): string {
        if (this._id === undefined) {
            this._id = Guid.newGuid();
        }
        return this._id;
    }

    private _url: string = undefined;
    public get Url(): string {
        if (this._url === undefined) {
            this._url = 'url(#' + this.Id + ')';
        }
        return this._url;
    }

    private _center: Point = undefined;
    public get Center(): Point {
        return this._center;
    }
    public set Center(value: Point) {
        if (this._center !== value) {
            this._center = value;
        }
    }

    private _origin: Point = undefined;
    public get Origin(): Point {
        return this._origin;
    }
    public set Origin(value: Point) {
        if (this._origin !== value) {
            this._origin = value;
        }
    }

    private _radiusX: number = undefined;
    public get RadiusX(): number {
        return this._radiusX;
    }
    public set RadiusX(value: number) {
        if (this._radiusX !== value) {
            this._radiusX = Math.abs(value);
        }
    }

    private _radiusY: number = undefined;
    public get RadiusY(): number {
        return this._radiusY;
    }
    public set RadiusY(value: number) {
        if (this._radiusY !== value) {
            this._radiusY = Math.abs(value);
        }
    }

    private _gradientTransform: string = undefined;
    public get GradientTransform(): string {
        if (this._radiusX !== this._radiusY) {
            this._gradientTransform = 'translate(0 ' + this._origin.Y
                + ')scale(1 ' + (this._radiusY / this._radiusX) + ')translate(0 ' + (-this._origin.Y) + ')';
        }
        return this._gradientTransform;
    }

    public get GradientUnits(): string {
        if (this.MappinMode === BrushMappingMode.Absolute) {
            return 'userSpaceOnUse';
        }
    }

    private _mappingMode: number = BrushMappingMode.RelativeToBoundingBox;
    public get MappinMode(): number {
        return this._mappingMode;
    }
    public set MappinMode(value: number) {
        if (this._mappingMode !== value) {
            this._mappingMode = value;
        }
    }

    private readonly _gradientStops: GradientStop[] = undefined;
    public get GradientStops(): GradientStop[] {
        return this._gradientStops;
    }

    // At the end of the compound brush color string
    // P - Padded, F- Reflect, T- Repeat
    private _spreadMethod: string = 'pad';
    public get SpreadMethod(): string {
        return this._spreadMethod;
    }
    public set SpreadMethod(value: string) {
        if (this._spreadMethod !== value) {
            this._spreadMethod = value;
        }
    }

    public get Type(): GradientBrushType {
        return GradientBrushType.Radial;
    }

    constructor(gradientStops: GradientStop[]) {
        this._gradientStops = gradientStops;
    }
}

export class LinearGradientColor {

    private _id: string = undefined;
    public get Id(): string {
        if (this._id === undefined) {
            this._id = Guid.newGuid();
        }
        return this._id;
    }

    private _url: string = undefined;
    public get Url(): string {
        if (this._url === undefined) {
            this._url = 'url(#' + this.Id + ')';
        }
        return this._url;
    }

    private _start: Point = undefined;
    public get Start(): Point {
        return this._start;
    }
    public set Start(value: Point) {
        if (this._start !== value) {
            this._start = value;
        }
    }

    private _end: Point = undefined;
    public get End(): Point {
        return this._end;
    }
    public set End(value: Point) {
        if (this._end !== value) {
            this._end = value;
        }
    }

    private _mappingMode: number = BrushMappingMode.RelativeToBoundingBox;
    public get MappinMode(): number {
        return this._mappingMode;
    }
    public set MappinMode(value: number) {
        if (this._mappingMode !== value) {
            this._mappingMode = value;
        }
    }

    private readonly _gradientStops: GradientStop[] = undefined;
    public get GradientStops(): GradientStop[] {
        return this._gradientStops;
    }

    // At the end of the compound brush color string
    // P - Padded, F- Reflect, T- Repeat
    private _spreadMethod: string = 'pad';
    public get SpreadMethod(): string {
        return this._spreadMethod;
    }
    public set SpreadMethod(value: string) {
        if (this._spreadMethod !== value) {
            this._spreadMethod = value;
        }
    }

    public get GradientUnits(): string {
        if (this.MappinMode === BrushMappingMode.Absolute) {
            return 'userSpaceOnUse';
        }
    }

    public get Type(): GradientBrushType {
        return GradientBrushType.Linear;
    }

    constructor(gradientStops: GradientStop[]) {
        this._gradientStops = gradientStops;
    }
}

export class Point {
    public _x: number = undefined;
    public get X(): number {
        return this._x;
    }
    public set X(value: number) {
        if (this._x !== value) {
            this._x = value;
        }
    }

    public _y: number = undefined;
    public get Y(): number {
        return this._y;
    }
    public set Y(value: number) {
        if (this._y !== value) {
            this._y = value;
        }
    }

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }
}

export class GradientStop {
    private _colorString: string;
    public get ColorString(): string {
        return this._colorString;
    }
    public set ColorString(value: string) {
        if (this._colorString !== value) {
            this._colorString = value;
        }
    }

    private _actualColorString: string;
    public get ActualColorString(): string {
        return this._actualColorString;
    }
    public set ActualColorString(value: string) {
        if (this._actualColorString !== value) {
            this._actualColorString = value;
        }
    }

    private readonly _opacity: number;
    public get Opacity(): number {
        return this._opacity;
    }

    public get Offset(): string {
        return (this._offsetValue * 100) + '%';
    }

    private _offsetValue: number;
    public get OffsetValue(): number {
        return this._offsetValue;
    }
    public set OffsetValue(value: number) {
        if (this._offsetValue !== value) {
            this._offsetValue = value;
        }
    }

    constructor(colorString: string, offset: number) {

        this._actualColorString = colorString;

        // ARGB color string
        // fill-opacity
        const alpha: string = colorString.substring(1, 3);
        const opacity: number = parseInt(alpha, 16) / 255.0;

        const rgbColor: string = '#' + colorString.substring(3);
        this._opacity = opacity;
        this._colorString = rgbColor;
        this._offsetValue = offset;
    }
}

export enum GradientBrushType {
    Linear,
    Radial
}

export enum BrushType {
    Solid,
    Compound
}

export enum BrushMappingMode {
    Absolute,
    RelativeToBoundingBox
}

export class RgbColor {
    private _a: number;
    public get A(): number {
        return this._a;
    }
    public set A(value: number) {
        if (this._a !== value) {
            this._a = value;
        }
    }

    private _r: number;
    public get R(): number {
        return this._r;
    }
    public set R(value: number) {
        if (this._r !== value) {
            this._r = value;
        }
    }

    private _g: number;
    public get G(): number {
        return this._g;
    }
    public set G(value: number) {
        if (this._g !== value) {
            this._g = value;
        }
    }

    private _b: number;
    public get B(): number {
        return this._b;
    }
    public set B(value: number) {
        if (this._b !== value) {
            this._b = value;
        }
    }

    public get ColorString(): string {
        return '#' + this.channelToHex(Math.round(this._a)) + this.channelToHex(Math.round(this._r))
            + this.channelToHex(Math.round(this._g)) + this.channelToHex(Math.round(this._b));
    }

    public get Opacity(): number {
        return this._a / 255;
    }

    constructor(alpha: number, red: number, green: number, blue: number) {
        this._a = alpha;
        this._r = red;
        this._g = green;
        this._b = blue;
    }

    private channelToHex(channel: number): string {
        const hex: string = channel.toString(16).toUpperCase();
        return hex.length === 1 ? '0' + hex : hex; // Pad zero to single hex digit.
    }
}

export class HsvColor {
    private _h: number;
    public get H(): number {
        return this._h;
    }
    public set H(value: number) {
        if (this._h !== value) {
            this._h = value;
        }
    }

    private _s: number;
    public get S(): number {
        return this._s;
    }
    public set S(value: number) {
        if (this._s !== value) {
            this._s = value;
        }
    }

    private _v: number;
    public get V(): number {
        return this._v;
    }
    public set V(value: number) {
        if (this._v !== value) {
            this._v = value;
        }
    }

    constructor(hue: number, saturation: number, value: number) {
        this._h = hue;
        this._s = saturation;
        this._v = value;
    }
}
