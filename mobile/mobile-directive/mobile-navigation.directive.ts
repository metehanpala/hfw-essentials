/**
 * MobileNavigationDirective
 *
 * This directive is responsible for controlling the visibility of DOM elements based on screen size changes,
 * specifically for mobile navigation purposes.
 *
 * It listens for screen size changes and emits an event and updates the MobileNavigationService accordingly.
 *
 * Usage:
 * - Apply the "hfwMobileOnly" directive to the desired element(s) in the template.
 * - The directive will toggle the visibility of the element(s) based on the screen size.
 * - The visibility change event and the updated visibility value will be emitted through the "mobileOnlyVisibilityChange"
 * - event and the MobileNavigationService respectively. For additional requirements, the MobileNavigationService can be
 * - injected into the desired component to be used as needed.
 */
import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';

import { TraceModules } from '../../shared/trace/trace-modules';
import { MobileNavigationService } from '../mobile-service/mobile-navigation.service';

@Directive({
  selector: '[hfwMobileOnly]',
  standalone: false
})

export class MobileNavigationDirective implements OnInit, OnDestroy {
  private static readonly mobileScreenSize = '(max-width: 576px)';
  @Output() public readonly mobileOnlyVisibilityChange = new EventEmitter<boolean>();
  private mediaQuery!: MediaQueryList;
  private readonly _trModule: string = TraceModules.mobileNavigation;

  constructor(
    private readonly elementRef: ElementRef,
    private readonly renderer: Renderer2,
    private readonly mobileNavigationService: MobileNavigationService,
    private readonly traceService: TraceService // Inject TraceService
  ) { }

  /**
   * Initializes the directive.
   * Listens for screen size changes and toggles the visibility of the element(s) accordingly.
   */
  public ngOnInit(): void {
    // Define the media query for screen size change detection
    this.mediaQuery = window.matchMedia(MobileNavigationDirective.mobileScreenSize);

    // Toggle the initial visibility based on the current media query match
    this.toggleVisibility(this.mediaQuery.matches);

    // Use addEventListener for changes in the media query and toggle visibility accordingly
    this.mediaQuery.addEventListener('change', this.handleMediaQueryChange);
  }

  /**
   * Cleans up the directive.
   * Removes the event listener for media query changes.
   */
  public ngOnDestroy(): void {
    // Remove the event listener for media query changes
    this.mediaQuery.removeEventListener('change', this.handleMediaQueryChange);
  }

  /**
   * Handles the change event of the media query.
   *
   * @param event - The MediaQueryListEvent representing the change event of the media query.
   *                It contains information about the current state of the media query If it matches the mobile screen size.
   */
  private readonly handleMediaQueryChange = (event: MediaQueryListEvent): void => {
    this.toggleVisibility(event.matches);
  };

  /**
   * Toggles the visibility of the element(s) based on the given matches value.
   * @param matches A boolean indicating whether the media query matches.
   */
  private toggleVisibility(matches: boolean): void {
    if (matches) {
      // Set the element display style to "flex" if the media query matches
      this.renderer.setStyle(this.elementRef.nativeElement, 'display', 'flex');
    } else {
      // Set the element display style to "none" if the media query does not match
      this.renderer.setStyle(this.elementRef.nativeElement, 'display', 'none');
    }

    // Emit the visibility change event for hiding/showing the elements in mobile navigation
    this.mobileOnlyVisibilityChange.emit(matches);

    // Update the visibility value in the MobileNavigationService
    this.mobileNavigationService.updateMobileOnlyVisibility(matches);

    // Log the visibility change using TraceService
    this.traceService.info(this._trModule, `Mobile visibility changed: ${matches}`);
  }

}
