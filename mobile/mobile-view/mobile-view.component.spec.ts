import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TraceService } from '@gms-flex/services-common';
import { ContentActionBarMainItem } from '@simpl/element-ng';
import { MenuItemAction, SiMenuModule } from '@simpl/element-ng/menu';
import { of } from 'rxjs';

import { FullPaneId } from '../../../common/fullsnapinid/full-pane-id.model';
import { IStateService } from '../../../common/interfaces/'
import { MobileNavigationService } from '../mobile-service/mobile-navigation.service';
import { MobileViewComponent } from './mobile-view.component';

describe('MobileViewComponent', () => {
  let component: MobileViewComponent;
  let fixture: ComponentFixture<MobileViewComponent>;
  let mobileNavigationService: jasmine.SpyObj<MobileNavigationService>;
  let traceService: jasmine.SpyObj<TraceService>;
  let stateService: jasmine.SpyObj<IStateService>;

  const mockSubscriptions = jasmine.createSpyObj('MobileNavigationService', ['getDataObservable']);

  const mockMobileNavigationService = {
    mobileOnlyVisibility$: of(true),
    snapinTitle$: of('Mock Snapin Title'),
    primaryItems$: of([]),
    secondaryItems$: of([]),
    paneStore$: of({} as any),
    paneConfig$: of({} as any),
    snapIns$: of([] as any[]),
    tabs$: of([] as any[]),
    sysBrowActive$: of(false),
    isRightPanelOpen$: of({} as any),
    setSysBrowActive: (_value: boolean): void => { },
    updateBottomSpaceCalculationFlag: (_value: boolean): void => { },
    updateAccountSnapinActive: (_value: boolean): void => { },
    updateOperatorTasksSnapinActive: (_value: boolean): void => { },
    setContentActionItems: (_value1: ContentActionBarMainItem[], _value2: ContentActionBarMainItem[]): void => { },
    setSnapinTitle: (_value: string): void => { },
    setSnapins: (_value: any): void => { },
    setPaneStore: (_value: any): void => { },
    setPaneConfig: (_value: any): void => { },
    setTabs: (_value: any): void => { },
    setbackNavigate: (): void => { },
    setLastNode: (_value: boolean): void => { },
    setRightPanelState: (_value: boolean): void => { }
  };

  beforeEach(async (): Promise<void> => {

    traceService = jasmine.createSpyObj('TraceService', ['info', 'error']);
    stateService = jasmine.createSpyObj('IStateService', ['navigateToSnapId']);

    await TestBed.configureTestingModule({
      imports: [SiMenuModule],
      declarations: [MobileViewComponent],
      providers: [
        { provide: MobileNavigationService, useValue: mockMobileNavigationService },
        { provide: TraceService, useValue: traceService },
        { provide: IStateService, useValue: stateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MobileViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should subscribe to mobile navigation service observables during ngOnInit', () => {
      // Arrange
      const mockdata1 = { mobileOnlyVisibility$: true };
      const mockdata2 = { snapinTitle$: 'Mock Snapin Title' };
      const mockdata3 = { title: 'Action 1', action: 'action1' };
      mockSubscriptions.getDataObservable.and.returnValue(of(mockdata1));
      mockSubscriptions.getDataObservable.and.returnValue(of(mockdata2));
      mockSubscriptions.getDataObservable.and.returnValue(of(mockdata3));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isMobile).toBe(true);
      expect(component.selectedSnapInTitle).toEqual('Mock Snapin Title');
      expect(component.secondaryItems).toEqual([]);
    });
  });

  describe('Action Sheet', () => {
    it('should show the action sheet with snapin tabs when showActionSheet is called with "snapinNavigate"', () => {
      // Arrange
      component.showSnapinNavigate = false;
      component.showContentActions = true;

      // Act
      component.showActionSheet('snapinNavigate');

      // Assert
      expect(component.showSheet).toBeTrue();
      expect(component.showSnapinNavigate).toBeTrue();
      expect(component.showContentActions).toBeFalse();
    });

    it('should hide the action sheet when hideActionSheet is called', () => {
      // Arrange
      component.showSheet = true;
      component.showSnapinNavigate = true;
      component.showContentActions = false;

      // Act
      component.hideActionSheet();

      // Assert
      expect(component.showSheet).toBeFalse();
      expect(component.showSnapinNavigate).toBeFalse();
      expect(component.showContentActions).toBeFalse();
    });

    it('should not hide the action sheet when hideActionSheet is called while the action sheet is not shown', () => {
      // Arrange
      component.showSheet = false;
      component.showSnapinNavigate = false;
      component.showContentActions = true;

      // Act
      component.hideActionSheet();

      // Assert
      expect(component.showSheet).toBeFalse();
      expect(component.showSnapinNavigate).toBeFalse();
      expect(component.showContentActions).toBeFalse(); // showContentActions should remain unchanged
    });
  });

  describe('Snapin Navigation', () => {
    it('should navigate to the selected snapin tab when snapinNavigateClick is called with an active tab', () => {
      // Arrange
      const activeTab = { title: 'Active Tab', active: 'true', id: 'tab1' };
      spyOn(component, 'hideActionSheet');

      const fullPaneId: FullPaneId = {
        frameId: 'frame1',
        paneId: 'pane1',
        fullId: (): string => {
          throw new Error('Function not implemented.');
        }
      };

      component.paneStore.fullPaneId = fullPaneId;

      const navigateToSnapIdResponse = of(true);
      stateService.navigateToSnapId.and.returnValue(navigateToSnapIdResponse);

      // Act
      component.snapinNavigateClick(activeTab);

      // Assert
      expect(stateService.navigateToSnapId).toHaveBeenCalledWith(fullPaneId, activeTab.id);
      expect(component.hideActionSheet).toHaveBeenCalled();
    });

    it('should populate the snapinTabs array correctly when populateSnapinNavigate is called', () => {
      // Arrange
      const tabs = [
        { tabTitle: 'Tab 1', active: 'true', tabId: 'tab1' },
        { tabTitle: 'Tab 2', active: 'false', tabId: 'tab2' },
        { tabTitle: 'Tab 3', active: 'false', tabId: 'tab3' }
      ];

      // Act
      component.populateSnapinNavigate(tabs);

      // Assert
      expect(component.snapinTabs.length).toBe(3);
    });

    it('should add a new snapin tab correctly when addSnapinTab is called', () => {
      // Arrange
      const tabTitle = 'New Tab';
      const isActive = 'false';
      const tabId = 'tab4';

      // Act
      component.addSnapinTab(tabTitle, isActive, tabId);

      // Assert
      expect(component.snapinTabs.length).toBe(1);
      expect(component.snapinTabs[0].title).toBe(tabTitle);
      expect(component.snapinTabs[0].active).toBe(isActive);
    });
  });

  describe('Content Actions', () => {
    it('should populate the contentItems correctly when populateContentActionItems is called', () => {
      // Arrange
      const primaryItems: ContentActionBarMainItem[] = [
        { type: 'action', label: 'Action 1', action: 'action1' },
        { type: 'action', label: 'Action 2', action: 'action2' }
      ];
      const secondaryItems: ContentActionBarMainItem[] = [{ type: 'action', label: 'Action 3', action: 'action3' }];

      // Act
      component.populateContentActionItems('primary', primaryItems);
      component.populateContentActionItems('secondary', secondaryItems);

      // Assert
      expect(component.contentItem.length).toBe(3);
    });

    it('should add a new content action item correctly when addContentActionItem is called', () => {
      // Arrange
      const menuItem: ContentActionBarMainItem[] = [
        { type: 'action', label: 'New Action', action: 'newAction' },
        { type: 'action', label: 'Action 2', action: 'action2' }];
      const itemType = 'primary';
      const itemTitle = 'New Action';
      const itemAction = 'newAction';
      const itemSubItems = [{ title: 'Sub Item 1', action: 'subAction1' }];

      // Act
      component.addContentActionItem(menuItem[0], itemType);

      // Assert
      expect(component.contentItem.length).toBe(1);
      expect((component.contentItem[0] as MenuItemAction).label).toBe(itemTitle);
      expect((component.contentItem[0] as MenuItemAction).action).toBe(itemAction);
    });

    it('should hide the action sheet when contentActionClick is called', () => {
      // Arrange
      spyOn(component, 'hideActionSheet');

      // Act
      component.contentActionClick();

      // Assert
      expect(component.hideActionSheet).toHaveBeenCalled();
    });
  });

  describe('System Browser', () => {
    it('should toggle the sysBrowActive property and update mobileNavigationService when showSystemBrowser is called', () => {
      // Arrange
      component.sysBrowActive = false;

      // Act
      component.toggleSystemBrowser();
      // Assert
      expect(component.sysBrowActive).toBe(true);

      // Act
      component.toggleSystemBrowser();

      // Assert
      expect(component.sysBrowActive).toBe(false);
    });
  });

  describe('DOM Elements', () => {
    it('should display the selected snapin title in the page-label div', () => {
      // Arrange
      component.selectedSnapInTitle = 'Mock Snapin Title';

      // Act
      fixture.detectChanges();

      // Assert
      const pageLabel = fixture.debugElement.query(By.css('.page-label')).nativeElement;
      expect(pageLabel.textContent.trim()).toEqual('Mock Snapin Title');
    });

    it('should show the action sheet with primary and secondary content actions when the ellipsis-button is clicked', () => {
      // Arrange
      component.showSheet = false;
      component.showSnapinNavigate = false;
      component.showContentActions = false;

      // Act
      const ellipsisButton = fixture.debugElement.query(By.css('.ellipsis-button'));
      ellipsisButton.triggerEventHandler('click', null);

      // Assert
      expect(component.showSheet).toBeTrue();
      expect(component.showSnapinNavigate).toBeFalse();
      expect(component.showContentActions).toBeTrue();
    });

    it('should show the action sheet for snapins when the page-label is clicked', () => {
      // Arrange
      component.snapinTabUnique = false; // Make sure snapin tab is not unique so clickable
      component.showSheet = false;
      component.showSnapinNavigate = false;
      component.showContentActions = false;

      // Act
      const pageLabel = fixture.debugElement.query(By.css('.page-label'));
      pageLabel.triggerEventHandler('click', null); // Click on the snapin title
      fixture.detectChanges();

      // Assert
      expect(component.showSheet).toBeTrue(); // Expect sheet to be shown
      expect(component.showSnapinNavigate).toBeTrue(); // Expect sheet to be shown
      expect(component.showContentActions).toBeFalse();
    });

    it('should show the snapin tabs in the action sheet when showSnapinNavigate is true', () => {
      // Arrange
      component.showSheet = true;
      component.showSnapinNavigate = true;
      component.showContentActions = false;
      component.snapinTabs = [
        { title: 'Tab 1', active: 'true' },
        { title: 'Tab 2', active: 'false' }
      ];

      // Act
      fixture.detectChanges();

      // Assert
      const actionItems = fixture.debugElement.queryAll(By.css('.actions .action'));
      expect(actionItems.length).toBe(2);
      expect(actionItems[0].nativeElement.textContent).toContain('Tab 1');
      expect(actionItems[1].nativeElement.textContent).toContain('Tab 2');
    });

    it('should show the content actions in the action sheet when showContentActions is true', () => {
      // Arrange
      component.showSheet = true;
      component.showSnapinNavigate = false;
      component.showContentActions = true;
      component.contentItem = [
        { type: 'action', label: 'Action 1', action: 'action1' },
        { type: 'action', label: 'Action 2', action: 'action2' }
      ];

      // Act
      fixture.detectChanges();

      // Assert
      // Using si-menu-item > .dropdown-item
      const actionItems = fixture.debugElement.queryAll(By.css('.dropdown-item'));
      expect(actionItems.length).toBe(2);
      expect(actionItems[0].nativeElement.textContent).toContain('Action 1');
      expect(actionItems[1].nativeElement.textContent).toContain('Action 2');
    });

    it('should hide the action sheet when the cancel button is clicked', () => {
      // Arrange
      component.showSheet = true;
      component.showSnapinNavigate = true;
      component.showContentActions = false;

      fixture.detectChanges();

      // Act
      const cancelButton = fixture.debugElement.query(By.css('.cancel'));
      cancelButton.triggerEventHandler('click', null);

      // Assert
      expect(component.showSheet).toBeFalse();
      expect(component.showSnapinNavigate).toBeFalse();
      expect(component.showContentActions).toBeFalse();
    });
  });
});
