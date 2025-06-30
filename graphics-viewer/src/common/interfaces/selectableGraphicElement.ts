/*
 * Interface to expose methods related to selecting and unselecting graphics elements
 */
export interface SelectableGraphicElement {
    IsSelected: boolean;
    unSelect(): void;
}
