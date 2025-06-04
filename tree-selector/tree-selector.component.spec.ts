import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CheckboxClickEventArgs, CheckboxState, SiSearchBarModule, SiTreeViewModule, TreeItem } from '@simpl/element-ng';
import { AccordionComponent, AccordionModule } from 'ngx-bootstrap/accordion';

import { TreeSelectorComponent as TestComponent } from './tree-selector.component';
import { eTsResetOperation } from './tree-selector.model';

describe('TreeSelectorComponent', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  //   let element: DebugElement;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [AccordionModule.forRoot(), FormsModule, SiTreeViewModule, SiSearchBarModule, BrowserAnimationsModule],
      providers: [AccordionComponent]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('should set input selectionLabel', () => {
    component.selectionLabel = 'selectionLabel';
    component.inputElementName = 'inputElementName';
    fixture.detectChanges();

    const spanEl: HTMLElement | null = element.querySelector('span.hfw-flex-item-grow');
    expect(spanEl!.textContent).toEqual('selectionLabel');
  });

  it('should check method onExpanderClick', () => {
    component.isSelectorOpen = true;
    component.onExpanderClick();

    fixture.detectChanges();
    expect(component.isSelectorOpen).toBeFalsy();
  });

  it('should check filterTree and onFilterPatternChange methods', () => {
    const items: TreeItem[] = [
      {
        label: 'label1',
        state: 'expanded',
        parent: undefined,
        children: undefined,
        customData: undefined,
        icon: 'icon',
        dataField1: 'datafield1',
        dataField2: 'datafield2',
        showCheckbox: true,
        showOptionbox: true
      },
      {
        label: 'label2',
        state: 'collapsed',
        parent: undefined,
        children: undefined,
        customData: undefined,
        icon: 'icon',
        dataField1: 'datafield1',
        dataField2: 'datafield2',
        showCheckbox: true,
        showOptionbox: true
      }
    ];
    const selectionTree: TreeItem[] = [
      {
        label: 'label3',
        state: 'expanded',
        parent: undefined,
        children: undefined,
        customData: undefined,
        icon: 'icon',
        dataField1: 'datafield1',
        dataField2: 'datafield2',
        showCheckbox: true,
        showOptionbox: true
      },
      {
        label: 'label4',
        state: 'collapsed',
        parent: undefined,
        children: undefined,
        customData: undefined,
        icon: 'icon',
        dataField1: 'datafield1',
        dataField2: 'datafield2',
        showCheckbox: true,
        showOptionbox: true
      }
    ];
    const filterPattern = 'label4';
    component.selectionTreeFiltered = items;

    (component as any)._selectionTree = selectionTree;
    component.filterPattern = filterPattern;
    component.onFilterPatternChange();
    expect(component.selectionTreeFiltered.length).toEqual(1);
  });

  it('should check filterTree and onFilterPatternChange methods with undefined treeItems', () => {
    let noItems: TreeItem[] | undefined;
    const filterPattern = 'label';
    component.selectionTreeFiltered = noItems!;
    component.filterPattern = filterPattern;

    (component as any)._selectionTree = noItems;
    component.onFilterPatternChange();
    expect(component.selectionTreeFiltered).toBeDefined();
  });

  it('should check filterTree and onFilterPatternChange methods with undefined filterPattern', () => {
    const items: TreeItem[] = [
      {
        label: 'label1',
        state: 'expanded',
        parent: undefined,
        children: undefined,
        customData: undefined,
        icon: 'icon',
        dataField1: 'datafield1',
        dataField2: 'datafield2',
        showCheckbox: true,
        showOptionbox: true
      }
    ];
    let noPattern: string | undefined;
    component.selectionTreeFiltered = items;

    (component as any)._selectionTree = items;
    component.filterPattern = noPattern!;
    component.onFilterPatternChange();
    expect(component.selectionTreeFiltered).toBe(items);
  });

  it('should emit event - ti is undefined', () => {
    const args: CheckboxClickEventArgs = {
      oldState: null!,
      newState: null!,
      target: null!
    };
    component.onSelectionChange(args);
  });

  it('should emit event - ti is not undefined', () => {
    spyOn(component.selectionChanged, 'emit');
    fixture.detectChanges();
    const customData: TreeItem = {
      label: 'label',
      state: 'expanded',
      parent: undefined,
      children: undefined,
      customData: undefined,
      icon: 'icon',
      dataField1: 'datafield1',
      dataField2: 'datafield2',
      showCheckbox: true,
      showOptionbox: true
    };
    const args: CheckboxClickEventArgs = {
      oldState: 'unchecked',
      newState: 'checked',
      target: {
        label: 'label',
        state: 'expanded',
        parent: undefined,
        children: undefined,
        customData,
        icon: 'icon',
        dataField1: 'datafield1',
        dataField2: 'datafield2',
        showCheckbox: true,
        showOptionbox: true
      }
    };
    component.onSelectionChange(args);
    expect(component.selectionChanged.emit).toHaveBeenCalled();
  });

  it('should check onReset method', () => {
    const customData: TreeItem[] = [
      {
        label: 'customData',
        state: 'expanded',
        parent: undefined,
        children: undefined,
        customData: undefined,
        icon: 'icon',
        dataField1: 'datafield1',
        dataField2: 'datafield2',
        showCheckbox: true,
        showOptionbox: true
      }
    ];
    const items: TreeItem[] = [
      {
        label: 'label1',
        state: 'expanded',
        parent: undefined,
        children: undefined,
        customData,
        icon: 'icon',
        dataField1: 'datafield1',
        dataField2: 'datafield2',
        showCheckbox: true,
        showOptionbox: true
      }
    ];

    (component as any)._selectionTree = items;
    (component as any).onReset(eTsResetOperation.Clear);
  });

});
