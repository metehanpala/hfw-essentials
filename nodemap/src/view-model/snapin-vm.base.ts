import { ChangeDetectorRef } from '@angular/core';

/**
 * SnapIn view-model interface definition.
 */
export interface NodeMapSnapInViewModelBase {

  /**
   * Id of the VM (typically the snapId of the associated snapin).
   */
  readonly id: string;

  /**
   * Called by client to dispose of internal resources before view-model is destructed.
   */
  dispose(): void;

  /**
   * This method can be called by the view-model client to disable any
   * resourses the view-model is managing that can be regained through a
   * call to activate.
   *
   * The main scenario is the snap-in view ngComponent is destroyed
   * (taken out of view) and later re-created and initialized.
   * During the time it is 'away' the subscriptions it has open should
   * be closed.  They will be re-opened on a call to 'activate' when
   * the snap-in re-registers for the view-model instance.
   */
  deactivate(): void;

  /**
   * Called to resurrect a dormant vm
   */
  activate(locale: string, cdf: ChangeDetectorRef): void;

  /**
   * Closes any subscriptions, clears out all information.
   */
  clear(): void;
}
