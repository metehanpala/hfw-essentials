// //// Test Host Component //////
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ListItem } from './data.model';
import { ListBoxItemComponent } from './list-box-item.component';

describe('ListBoxItemComponent', () => {

  let comp: ListBoxItemComponent;
  let fixture: ComponentFixture<ListBoxItemComponent>;

  // async beforeEach
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ListBoxItemComponent],
      imports: [
        FormsModule
      ] })
      .compileComponents(); // compile template and css
  }));

  // synchronous beforeEach
  beforeEach(() => {
    fixture = TestBed.createComponent(ListBoxItemComponent);
    comp = fixture.componentInstance;
  });

  it('should call ListBoxItemComponent', () => {
    comp.listItem = new ListItem('Test List Item (non virtualized) 1', 1);
    spyOn(comp.itemClicked, 'next');
    comp.onItemClicked();
    expect(comp.itemClicked.next).toHaveBeenCalled();
  });

});
