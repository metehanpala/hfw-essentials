/* eslint-disable @typescript-eslint/dot-notation */
import { ElementRef, Renderer2 } from '@angular/core';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { TraceService } from '@gms-flex/services-common';

import { MobileNavigationService } from '../mobile-service/mobile-navigation.service';
import { MobileNavigationDirective } from './mobile-navigation.directive';

describe('MobileNavigationDirective', () => {
  let directive: MobileNavigationDirective; // The directive being tested
  let mockElementRef: ElementRef; // Mock for ElementRef, used to reference DOM elements
  let mockRenderer: Renderer2; // Mock for Renderer2, used to manipulate DOM styles
  let mockMediaQueryList: jasmine.SpyObj<MediaQueryList>; // Spy object for MediaQueryList
  let mockMobileNavigationService: jasmine.SpyObj<MobileNavigationService>; // Spy object for MobileNavigationService
  let mockTraceService: jasmine.SpyObj<TraceService>; // Spy object for TraceService
  let matchMediaSpy: jasmine.Spy; // Spy for the window.matchMedia function

  beforeEach(() => {
    // Initialize mock instances for the required services and objects
    mockElementRef = new ElementRef(document.createElement('div')); // Mock DOM element
    mockRenderer = jasmine.createSpyObj('Renderer2', ['setStyle']); // Mock Renderer2 methods
    mockMobileNavigationService = jasmine.createSpyObj('MobileNavigationService', ['updateMobileOnlyVisibility']); // Mock MobileNavigationService
    mockTraceService = jasmine.createSpyObj('TraceService', ['info']); // Mock TraceService
    mockMediaQueryList = jasmine.createSpyObj('MediaQueryList', ['addEventListener', 'removeEventListener']); // Mock MediaQueryList methods

    // Create an instance of the directive and inject the mocked services
    directive = new MobileNavigationDirective(mockElementRef, mockRenderer, mockMobileNavigationService, mockTraceService);

    // Spy on matchMedia to return a mock MediaQueryList object whenever it's called
    matchMediaSpy = spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
      media: '',
      onchange: null,
      addEventListener: jasmine.createSpy('addEventListener'), // Mock addEventListener
      removeEventListener: jasmine.createSpy('removeEventListener') // Mock removeEventListener
    } as any); // Use `any` to mock the MediaQueryList object

    // Configure the testing module
    TestBed.configureTestingModule({
      providers: [
        MobileNavigationDirective, // Provide the directive for testing
        { provide: MediaQueryList, useValue: mockMediaQueryList } // Use the mocked MediaQueryList
      ]
    });
  });

  // Test to check if the directive initializes correctly and sets up the media query listener
  it('should initialize the directive and set up media query listener', () => {
    directive.ngOnInit(); // Initialize the directive

    // Verify that the directive's mediaQuery matches the expected value
    expect(directive['mediaQuery'].matches).toBeTrue(); // Accessing private member safely
    // Check if the 'setStyle' method was called to set the display style of the element
    expect(mockRenderer.setStyle).toHaveBeenCalledWith(mockElementRef.nativeElement, 'display', 'flex');
    // Verify that the event listener was added to the media query list
    expect(directive['mediaQuery'].addEventListener).toHaveBeenCalledWith('change', directive['handleMediaQueryChange']);
  });

  // Test to check if ngOnDestroy properly cleans up and removes the media query listener
  it('should clean up the directive and remove media query listener', fakeAsync(() => {
    // Set up the media query listener by calling ngOnInit
    directive.ngOnInit();

    // Check if the media query matches the expected value
    expect(directive['mediaQuery'].matches).toBeTrue(); // Accessing private member safely

    // Spy on ngOnDestroy to ensure it is called during cleanup
    spyOn(directive, 'ngOnDestroy').and.callThrough();
    // Call ngOnDestroy to trigger the cleanup process
    directive.ngOnDestroy();
    // Verify that ngOnDestroy was called
    expect(directive.ngOnDestroy).toHaveBeenCalled();
  }));

  // Test to simulate a media query change and ensure the visibility is toggled
  it('should handle media query change and toggle visibility', () => {
    // Spy on the private toggleVisibility method to verify it is called
    spyOn(directive as any, 'toggleVisibility');

    // Simulate a media query change event with a false match
    const event = {
      matches: false, // New match status
      media: '', // Media query string (not used here)
      onchange: null, // Placeholder for the onchange event handler
      addEventListener: jasmine.createSpy('addEventListener'), // Mock addEventListener
      removeEventListener: jasmine.createSpy('removeEventListener') // Mock removeEventListener
    } as unknown as MediaQueryListEvent; // Cast to unknown first for proper type

    // Handle the simulated media query change
    directive['handleMediaQueryChange'](event);

    // Verify that the toggleVisibility method was called with the expected argument (false)
    expect(directive['toggleVisibility']).toHaveBeenCalledWith(false);
  });

  // Test to check if the toggleVisibility method correctly updates the visibility
  it('should toggle visibility based on media query matches', () => {
    // Test when the media query matches and visibility is set to true
    directive['toggleVisibility'](true); // Directly calling the private method for testing
    // Verify that the 'setStyle' method is called to set the display style to 'flex'
    expect(mockRenderer.setStyle).toHaveBeenCalledWith(mockElementRef.nativeElement, 'display', 'flex');
    // Verify that the mobile navigation service is updated with the new visibility status
    expect(mockMobileNavigationService.updateMobileOnlyVisibility).toHaveBeenCalledWith(true);
    // Verify that the trace service logs the visibility change
    expect(mockTraceService.info).toHaveBeenCalledWith(directive['_trModule'], 'Mobile visibility changed: true'); // Access private _trModule safely

    // Test when the media query does not match and visibility is set to false
    directive['toggleVisibility'](false); // Again, testing the other scenario
    // Verify that the 'setStyle' method is called to set the display style to 'none'
    expect(mockRenderer.setStyle).toHaveBeenCalledWith(mockElementRef.nativeElement, 'display', 'none');
    // Verify that the mobile navigation service is updated with the new visibility status
    expect(mockMobileNavigationService.updateMobileOnlyVisibility).toHaveBeenCalledWith(false);
    // Verify that the trace service logs the visibility change
    expect(mockTraceService.info).toHaveBeenCalledWith(directive['_trModule'], 'Mobile visibility changed: false');
  });
});
