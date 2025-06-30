import { GmsDepth } from '../processor/gms-depth';

export class GraphicState {
    public designation: string;
    public scrollLeft: number;
    public scrollTop: number;
    public svgDocumentWidth: number;
    public svgDocumentHeight: number;
    public zoomLevel: number;
    public transformMatrix: string;
    public relatedItemIdx: number;
    public selectedDepth: GmsDepth;
    public selectedDisciplines: Set<string>;
    public visibleLayers: boolean[];
    public isPermScaleToFit: boolean;
    public coverageAreaMode: boolean;
    public searchString: string;

    constructor(designation: string, scrollLeft: number, scrollTop: number, svgDocumentWidth: number,
                svgDocumentHeight: number, zoomLevel: number, transformMatrix: string,
                relatedItemIdx: number, selectedDepth: GmsDepth, selectedDisciplines: Set<string>,
                visibleLayers: boolean[], isPermScaleToFit: boolean, coverageAreaMode: boolean,
                searchString: string) {
        this.designation = designation;
        this.scrollLeft = scrollLeft;
        this.scrollTop = scrollTop;
        this.svgDocumentWidth = svgDocumentWidth;
        this.svgDocumentHeight = svgDocumentHeight;
        this.zoomLevel = zoomLevel;
        this.transformMatrix = transformMatrix;
        this.relatedItemIdx = relatedItemIdx;
        this.selectedDepth = selectedDepth;
        this.selectedDisciplines = selectedDisciplines;
        this.visibleLayers = visibleLayers;
        this.isPermScaleToFit = isPermScaleToFit;
        this.coverageAreaMode = coverageAreaMode;
        this.searchString = searchString;
    }
}
