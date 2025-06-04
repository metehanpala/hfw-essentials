import { Component, OnInit } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ClickListEventArgs, ListItem } from './data.model';
import { ListBoxItemComponent } from './list-box-item.component';
import { ListBoxComponent } from './list-box.component';

// Create a sample list of list items for testing
const listItems: ListItem[] = [];
for (let i = 0; i < 10; i++) {
  listItems.push(new ListItem('Test List Item (non virtualized) ' + i.toString()));
}

// Create a simulated click event for testing
const evt: MouseEvent = document.createEvent('MouseEvent');
const clickListEventArgs = new ClickListEventArgs(listItems[0], evt)!;

// Test host component to test ListBoxComponent in an Angular template
@Component({
  template: `
      <hfw-list-box [listItems]="listItems" />
    `,
  standalone: false
})
class TestHostComponent implements OnInit {
  private readonly listItems: ListItem[] = [];
  public ngOnInit(): void {
    for (let i = 0; i < 10; i++) {
      this.listItems.push(new ListItem('Test List Item (non virtualized) ' + i.toString()));
    }
  }
}

describe('ListBoxComponent Unit Tests', () => {
  let comp: ListBoxComponent;
  let fixture: ComponentFixture<ListBoxComponent>;

  // Configure testing module before each test execution
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ListBoxComponent, ListBoxItemComponent]
    }).compileComponents();
  }));

  // Initialize the component and fixture before each test
  beforeEach(() => {
    fixture = TestBed.createComponent(ListBoxComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Test case: Verify that clicking an item triggers onItemClicked and emits the itemChecked event
  it('should call onItemClicked and emit itemChecked', () => {
    spyOn(comp.itemChecked, 'next'); // Spy on the event emitter
    comp.onItemClicked(clickListEventArgs!);
    expect(comp.itemChecked.next).toHaveBeenCalledWith(clickListEventArgs.target); // Expect event emission
  });

  // Test case: Ensure only the clicked item is selected
  it('should select only the clicked item', () => {
    comp.listItems = [...listItems]; // Copy list items to avoid reference issues
    fixture.detectChanges();

    comp.onItemClicked(clickListEventArgs!);
    fixture.detectChanges();

    expect(comp.listItems.some(item => item.selected)).toBeTrue(); // At least one item should be selected
    expect(comp.listItems.every(item => item.selected)).toBeFalse(); // Ensure not all items are selected
  });

  // Test case: Verify that clicking an item only checks that item if enableCheckbox is true
  it('should check only the clicked item if enableCheckbox is true', () => {
    // Arrange: Enable checkbox functionality and define a list of items
    comp.enableCheckbox = true;
    comp.listItems = [
      { checked: false, selected: false, label: '1' },
      { checked: false, selected: false, label: '2' },
      { checked: false, selected: false, label: '3' }
    ];
    fixture.detectChanges();

    // Act: Trigger click event on the second item
    const listBoxItems = fixture.debugElement.queryAll(By.css('hfw-list-box-item'));
    expect(listBoxItems.length).toBeGreaterThan(0);

    listBoxItems[1].triggerEventHandler('itemClicked', { target: comp.listItems[1] });
    fixture.detectChanges();

    // Assert: Ensure only the clicked item is checked
    expect(comp.listItems[1].checked).toBeTrue();
    expect(comp.listItems[0].checked).toBeFalse();
    expect(comp.listItems[2].checked).toBeFalse();
  });

  // Test case: Ensure clicking an item toggles its checked state
  it('should toggle checked state of an item', () => {
    const item = listItems[0];
    item.checked = false;
    comp.onItemClicked(clickListEventArgs!); // Call the public method to trigger state change
    expect(item.checked).toBeTrue(); // Ensure item is now checked
  });

  // Test case: Verify the trackByIndex function returns the correct index for tracking list items efficiently
  it('should return the correct index for tracking', () => {
    expect(comp.trackByIndex(0)).toEqual(0);
  });
});
