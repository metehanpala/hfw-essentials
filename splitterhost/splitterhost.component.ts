import {
  Component, ElementRef, EventEmitter, HostBinding, Input, OnChanges,
  OnDestroy, OnInit, Output, QueryList, SimpleChanges, ViewChildren
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { SplitterChanges } from '@gms-flex/controls';
import { SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { Subscription } from 'rxjs';

import { IStateService } from '../../common/interfaces/istate.service';
import { MobileNavigationService } from '../mobile/mobile-service/mobile-navigation.service';
import { splitterSettingsPrefix } from '../settings/settings.service';
import { FrameStore, PaneStore, SplitterStore } from '../shared';
import { Splitter } from '../shared/hldl/hldl-data.model';
import { TraceModules } from '../shared/trace/trace-modules';

@Component({
  selector: 'hfw-splitterhost',
  templateUrl: './splitterhost.component.html',
  styleUrl: './splitterhost.component.scss',
  standalone: false
})
/*
 * This class represents the void container of a splitter in HFW visual tree.
 */
export class SplitterHostComponent implements OnInit, OnChanges, OnDestroy {

  @HostBinding('style') public style: SafeStyle = '';

  /*
   * Stores the HLDL configuration of the splitter.
   */
  @Input() public splitterConfig!: Splitter;

  /*
   * Stores ID of the hosting frame.
   */
  @Input() public frameId!: string;

  /*
    * Events Fired to the parent to inform that the whole splitterhost becomes opened or closed.
    */
  @Output() public readonly splitterStateChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChildren('hfwSplitter') public hfwSplitter!: QueryList<any>;
  @ViewChildren('pane2Splitter', { read: ElementRef }) public pane2Splitter!: QueryList<ElementRef>;
  @ViewChildren('pane1Splitter', { read: ElementRef }) public pane1Splitter!: QueryList<ElementRef>;

  /*
    * Events Fired to the parent to inform this splitter is full screen
    */
  @Output() public readonly hasFullScreenChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  /*
   * Indicates wheter the first child is a Pane or a Splitter.
   */
  public isFirstChildAPane!: boolean;

  /*
   * Indicates wheter the second child is a Pane or a Splitter.
   */
  public isSecondChildAPane!: boolean;

  public hideSplitterBarWhenPaneCollapsed = false;

  public firstPaneClosed!: boolean;

  public secondPaneClosed!: boolean;

  public isLayoutLocked!: boolean;

  /*
   * The configuration of the first child of the splitter.
   */
  public firstChildConfig: any = null;

  /*
   * The configuration of the second child of the splitter.
   */
  public secondChildConfig: any = null;

  public firstChildSize: string | undefined;

  public secondChildSize!: string;

  public paneProgammaticallyCollapsed!: boolean;

  public firstChildHiddenOnFullScreen = false;
  public secondChildHiddenOnFullScreen = false;

  public isMobileView!: boolean;
  public sysBrowActive!: boolean;

  private readonly subscriptions: Subscription[] = [];

  private frameStore: FrameStore | undefined;

  private splitterStore: SplitterStore | undefined;

  public checkChangesFunction(changes: SplitterChanges): void {
    if (changes !== null) {
      if (changes.newPaneSize !== null && changes.newPaneSize !== undefined) {
        if (this.firstChildSize !== null && this.firstChildSize !== undefined) {
          this.firstChildSize = changes.newPaneSize;
        } else {
          this.secondChildSize = changes.newPaneSize;
        }
      }
      if (changes.isCollapsed !== null && changes.isCollapsed !== undefined) {
        if (changes.isSplitterCollapseChanged) {
          this.paneProgammaticallyCollapsed = changes.isCollapsed;
        }
      }
    }
  }

  public ngOnChanges(_changes: SimpleChanges): void {
    this.updateProperties();
  }

  public ngOnInit(): void {
    this.style = this.sanitizer.bypassSecurityTrustStyle('max-width: -webkit-fill-available; -webkit-flex-basis: 100%');
    if (this.frameId != null) {
      this.frameStore = this.stateService.currentState.getFrameStoreViaId(this.frameId);
      if (this.splitterConfig != null) {
        this.firstChildSize = this.splitterConfig.firstChildSize;
        this.secondChildSize = this.splitterConfig.secondChildSize;
        if (this.splitterConfig.id != null && this.splitterConfig.id !== undefined) {
          this.splitterStore = this.frameStore?.splitterStoreMap.get(this.splitterConfig.id);
          if (this.splitterStore) {
            this.subscriptions.push(this.splitterStore.getSplitterChanges().subscribe((changes: SplitterChanges) => {
              this.checkChangesFunction(changes);
            }));
          }
        }
      }
      if (this.frameStore != null) {
        this.subscriptions.push(this.frameStore.isLocked.subscribe(
          res => {
            this.isLayoutLocked = res;
          }));
      }
    }
    // Subscribe to the screen size change event to configure mobile view
    this.subscriptions.push(this.mobileNavigationService.mobileOnlyVisibility$.subscribe((isVisible: boolean) => {
      this.isMobileView = isVisible;
    }));

    // Subscribe If system-browser is active
    this.subscriptions.push(this.mobileNavigationService.sysBrowActive$.subscribe((sysBrowActive: boolean) => {
      this.sysBrowActive = sysBrowActive;
    }));

  }

  public ngOnDestroy(): void {
    this.unsubscribe();
  }

  /*
   *  Gets the splitter orientantion for styling (column or row).
   */
  public get splitterStyleDirection(): string {
    if (this.splitterConfig != null && this.splitterConfig.orientation === 'Vertical') {
      return 'column';
    } else {
      return 'row';
    }
  }

  public constructor(private readonly hfwTrace: TraceService,
    private readonly stateService: IStateService,
    private readonly settingsService: SettingsServiceBase,
    private readonly sanitizer: DomSanitizer,
    private readonly mobileNavigationService: MobileNavigationService) {
  }

  public onChildrenStateChanged(isOpened: boolean, isFirstChild: boolean): void {
    if (isFirstChild) {
      if (isOpened) {
        this.openFirstChildPane();
      } else {
        this.closeFirstChildPane();
      }
    } else {
      if (isOpened) {
        this.openSecondChildPane();
      } else {
        this.closeSecondChildPane();
      }
    }
  }

  public onSplitterChange(changes: any): void {
    if (this.splitterConfig?.id != null && this.splitterStore && this.frameStore) {
      this.splitterStore.setSplitterChanges(changes as SplitterChanges);
      const splitterSettings: string = this.frameStore.getSplitterSettings();
      this.subscriptions.push(this.settingsService.putSettings(splitterSettingsPrefix + this.frameId, splitterSettings).subscribe());
    }
  }

  public onUpdateFullScreenClasses(isFirstPane: boolean, isFullScreen: any): void {
    if (isFullScreen) {
      // exclude the other
      if (isFirstPane) {
        this.secondChildHiddenOnFullScreen = true;
        if (this.sysBrowActive && this.isMobileView) {
          this.firstChildHiddenOnFullScreen = false;
        }
      } else {
        this.firstChildHiddenOnFullScreen = true;
      }
    } else {
      // re-include the other
      if (isFirstPane) {
        this.secondChildHiddenOnFullScreen = false;
      } else {
        this.firstChildHiddenOnFullScreen = false;
      }
    }
    if ((this.firstChildHiddenOnFullScreen || this.secondChildHiddenOnFullScreen) || this.isMobileView) {
      this.hasFullScreenChanged.emit(true);
    } else {
      this.hasFullScreenChanged.emit(false);
    }
  }

  public splitterConfigFirstChildCheck(): void {
    if (this.splitterConfig.firstChild.paneInstance != null) {
      this.isFirstChildAPane = true;
      this.firstChildConfig = this.splitterConfig.firstChild.paneInstance.id;
      const paneStore: PaneStore = this.stateService.currentState.getPaneStoreViaIds(this.frameId, this.splitterConfig.firstChild.paneInstance.id);
      this.subscriptions.push(paneStore.isVisible.subscribe(res => {
        return (res) ? this.openFirstChildPane() : this.closeFirstChildPane();
      }));
      this.subscriptions.push(paneStore.fullScreen.subscribe(res => {
        this.onUpdateFullScreenClasses(true, res);
      }));
    } else if (this.splitterConfig.firstChild.splitter != null) {
      this.isFirstChildAPane = false;
      this.firstChildConfig = this.splitterConfig.firstChild.splitter;
    } else {
      this.hfwTrace.warn(TraceModules.splitterHost, this.splitterConfig.id + ': Wrong splitter configuration. Splitter first child will be empty.');
    }
  }

  public splitterConfigSecondChildCheck(): void {
    if (this.splitterConfig.secondChild.paneInstance != null) {
      this.isSecondChildAPane = true;
      this.secondChildConfig = this.splitterConfig.secondChild.paneInstance.id;
      const paneStore: PaneStore = this.stateService.currentState.getPaneStoreViaIds(this.frameId, this.splitterConfig.secondChild.paneInstance.id);
      this.subscriptions.push(paneStore.isVisible.subscribe(res => {
        return (res) ? this.openSecondChildPane() : this.closeSecondChildPane();
      }));
      this.subscriptions.push(paneStore.fullScreen.subscribe(res => {
        this.onUpdateFullScreenClasses(false, res);
      }));
    } else if (this.splitterConfig.secondChild.splitter != null) {
      this.isSecondChildAPane = false;
      this.secondChildConfig = this.splitterConfig.secondChild.splitter;
    } else {
      this.hfwTrace.warn(TraceModules.splitterHost, this.splitterConfig.id + ': Wrong splitter configuration. Splitter second child will be empty.');
    }
  }

  private updateProperties(): void {
    if (this.splitterConfig != null) {
      if (this.splitterConfig?.firstChild === null || this.splitterConfig?.secondChild != null) {
        this.unsubscribe();
      }
      if (this.splitterConfig?.firstChild != null) {
        this.splitterConfigFirstChildCheck();
      } else {
        this.hfwTrace.warn(TraceModules.splitterHost, this.splitterConfig.id + ': Wrong splitter configuration. Splitter first child is empty.');
      }
      if (this.splitterConfig?.secondChild != null) {
        this.splitterConfigSecondChildCheck();
      } else {
        this.hfwTrace.warn(TraceModules.splitterHost, this.splitterConfig.id + ': Wrong splitter configuration. Splitter second child is empty.');
      }
    }
  }

  private unsubscribe(): void {
    if (this.subscriptions != null) {
      this.subscriptions.forEach(s => {
        s.unsubscribe();
      });
    }
  }

  private closeFirstChildPane(): void {
    this.hideSplitterBarWhenPaneCollapsed = true;

    this.firstPaneClosed = true;

    if (this.secondPaneClosed) {
      // the second pane is already closed -> inform the parent
      this.splitterStateChanged.emit(false);
    }
  }

  private openFirstChildPane(): void {
    if (this.secondPaneClosed) {
      // the second pane is already closed -> inform the parent
      this.splitterStateChanged.emit(true);
    } else {
      this.hideSplitterBarWhenPaneCollapsed = false;
    }
    this.firstPaneClosed = false;
  }

  private closeSecondChildPane(): void {
    this.hideSplitterBarWhenPaneCollapsed = true;

    this.secondPaneClosed = true;

    if (this.firstPaneClosed) {
      // the first pane is already closed -> inform the parent
      this.splitterStateChanged.emit(false);
    }
  }

  private openSecondChildPane(): void {
    if (this.firstPaneClosed) {
      // the first pane is already closed -> inform the parent
      this.splitterStateChanged.emit(true);
    } else {
      this.hideSplitterBarWhenPaneCollapsed = false;
    }
    // the first pane is fullScreen -> make it collapsed so secondary pane can come in
    const paneStore: PaneStore = this.stateService.currentState.getPaneStoreViaIds(this.frameId, this.splitterConfig.firstChild.paneInstance.id);
    paneStore.setFullScreen(false);
    this.secondPaneClosed = false;
  }
}
