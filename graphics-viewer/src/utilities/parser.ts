// Parser Class
export class Parser {
    // Parses the percentage value.
    public static parsePercentage(percentage: string, whole: number): number {

        if (percentage && percentage.endsWith('%')) {
            return parseFloat(percentage) / 100 * whole;
        }
        return parseFloat(percentage);
    }

    /**
     * Parses pixel count from px, cm, pt, or "in" string values
     * @return integer representing px value (1/96 in)
     */
    public static parseCssSizeToPx(size: string): number {
        const numericPortion: number = parseInt(size, 10);
        let nonNumericPortion: string = '';
        let result: number = 0;

        if (!Number.isNaN(numericPortion)) {
            nonNumericPortion = size.replace(/\d/g, '');
            switch (nonNumericPortion) {
                case 'px':
                    result = numericPortion;
                    break;
                case 'in':
                    result = numericPortion * 96;
                    break;
                case 'pt':
                    result = numericPortion * (96 / 72);
                    break;
                case 'cm':
                    result = numericPortion * (96 / 2.54);
                    break;
                case '':
                    result = numericPortion;
                    break;
                default:
                    break;
            }
        }
        return result;
    }
}

export class SvgUtility {

    public static GetAttributeValue(node: Node, attributeName: any): string {
        let result: string;
        if ((node as Element)?.attributes?.[attributeName] !== undefined) {
            result = (node as Element).attributes[attributeName].nodeValue;
        }
        return result;
    }

    public static SetAttributeValue(node: Node, attribute: string, value: string): void {
        if (node !== undefined) {
            const element: Element = node as Element;
            element.setAttribute(attribute, value);
        }
    }

    public static firstChildNode(node: Node): ChildNode {
        if (node !== undefined && node.childNodes !== undefined && node.childNodes.length !== 0) {
            return node.childNodes[0];
        }

        return undefined;
    }

    /**
     * Calculate fill-opacity and fill values from ARGB color string
     * @param value
     */
    public static ConvertARGB(value: string): [number, string] {
        let result: [number, string];
        if (value.length === 9) {
            // ARGB color string
            // fill-opacity
            const alpha: string = value.substring(1, 3);
            const opacity: number = parseInt(alpha, 16) / 255.0;

            // fill
            const fill: string = '#' + value.substring(3);
            result = [opacity, fill];
        }
        else if (value.length === 7) {
            // RGB color string, no alpha
            result = [1.0, value];
        }
        else { // url cases
            result = [1.0, value];
        }

        // NOTE Need to account for Url references from Defs
        return result;
    }

    public static IsNodeScaleTransformationGroup(node: Node): boolean {
        if (node === undefined || (node as Element).attributes === undefined) {
            return false;
        }

        const classTag: string = 'Class';
        const attrClass: Attr = (node as Element).attributes[classTag];

        if (attrClass === undefined) {
            return false;
        }

        const className: string = attrClass.nodeValue;
        return className === 'ScaleTransformGroup';
    }
}
