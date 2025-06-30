import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FullQParamId, IHfwMessage, ISnapInConfig, MessageParameters, ParamsSendMessage, QParam, SnapInBase } from '@gms-flex/core';
import { BrowserObject, GmsManagedTypes, GmsMessageData, GmsSelectionType, MultiMonitorServiceBase, ObjectMessageType } from '@gms-flex/services';
import { AppContextService, TraceService } from '@gms-flex/services-common';
import { TimerPhaseEnum, TimerService } from '@gms-flex/snapin-common';
import { TranslateService } from '@ngx-translate/core';
import { animationFrameScheduler, asyncScheduler, Subject, Subscription } from 'rxjs';

import { GraphicSnapinHldlConfig } from '../common/interfaces/GraphicSnapinHldlConfig';
import { GraphicSnapInArgs } from '../common/interfaces/GraphicsSnapinArgs';
import { TraceChannel } from '../common/trace-channel';
import { GraphicsSnapinService } from '../services/graphics-snapin.service';

/**
 * The controller/viewmodel of the graphics viewer snapin.
 */

@Component({
    selector: 'gms-graphics-viewer-snapin',
    templateUrl: './graphics-viewer-snapin.component.html',
    styleUrl: '../gms-graphics-viewer-snapin.scss',
    standalone: false
})

export class GraphicsViewerSnapInComponent extends SnapInBase implements OnInit, OnDestroy {
  @HostBinding('class.hfw-flex-container-column') public guardFrame: boolean = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow: boolean = true;
  @HostBinding('class.panel') public guardPanel: boolean = true;
  @HostBinding('class.snapin-container') public guardSnapIn: boolean = true;

  public _snapinArgs: GraphicSnapInArgs;
  public snapinArgsSubject: Subject<GraphicSnapInArgs> = new Subject<GraphicSnapInArgs>();
  public _hldlConfig: GraphicSnapinHldlConfig;
  public isFolder: boolean = false;
    public searchPlaceHolder: string;

  private messageSubscription: Subscription;
  private readonly subscriptions: Subscription[] = [];
  private readonly traceModule: string;
  private readonly unsubscribe: Subject<void>;

  private isSinglePane: boolean;
  private fullQParamId: FullQParamId;

  // This flag is needed for secondary selection made 2 pane layout.
  // In this scenario we need to send 2 messages instead of one to update contextual and related panes.
  // This code needs to be removed once right-panel feature will be in place.
  private avoidPreselectOnSecondarySelection: boolean;

  public ngOnInit(): void {
    // Initialize the hldlconfig for graphics snapin
    this.getHldlConfigs();

    this.fullQParamId = new FullQParamId(this.fullId.frameId, 'SystemQParamService', 'primary');

    this.subscriptions.push(this.graphicsSnapinService.onTileClickSub.subscribe(tile => {
        this.graphicsSnapinService.GetTargetNavigationBrowserObj(tile).toPromise().then(navigationPage => {
          const navigationBrowserObject: any = navigationPage.Nodes;
          const messageBodyValue: GmsMessageData = new GmsMessageData(navigationBrowserObject, GmsSelectionType.Cns);
          const types: string[] = navigationBrowserObject.map((browserObject: BrowserObject) => browserObject.Attributes.ManagedTypeName);
          const isPreselection: boolean = true;
          const isBroadcast: boolean = false;
          // const qParamValue: string = navigationBrowserObject[0].Designation;
          this.getHldlConfigs();
          const qParamValue: QParam = this.isSinglePane ? {
            name: this.fullQParamId.fullId(),
            value: navigationBrowserObject[0].Designation
          } : undefined;
          const ruleName: string = 'new-primary-selection';
          const messageToSend: ParamsSendMessage = {
            messageBody: messageBodyValue,
            preselection: isPreselection,
            qParam: qParamValue,
            broadcast: isBroadcast,
            applyRuleId: ruleName
          };
          this.sendMessage(types, messageToSend).subscribe((res: boolean) => {
            this.traceService.debug(this.traceModule, 'sendMessage() completed. result: %s', res);
          });
          // unsubscribe after call executes to avoid memory leaks
        });
      })
    );

    this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
      if (userCulture != null) {
        this.translateService.use(userCulture).subscribe((res: any) => {
            this.traceService.info(this.traceModule, 'use  user Culture');

            this.translationErrorHandler();
          },
          (err: any) => {
            this.translationErrorHandler();
          });
      } else {
        this.traceService.warn(this.traceModule, 'No user Culture for appContextService');
      }
    }));

    this.messageSubscription = this.messageBroker.getMessage(this.fullId).subscribe(
      (messageData => {
        if (messageData != null) {
          this.timerService.reset();
          this.timerService.startPhase(TimerPhaseEnum.PreSelection);
          this.traceService.info(this.traceModule, 'Message arrived.', messageData);
          this.receiveMessage(messageData);
        }
      })
    );
    this.traceService.info(this.traceModule, 'guard for styling set to %s, %s and %s, ',
      this.guardFrame, this.guardPanel, this.guardSnapIn);

  }

  public translationErrorHandler(): void {
    this.subscriptions.push(this.appContextService.defaultCulture.subscribe({ next: defaultCulture => {
        if (defaultCulture !== null) {
          // init translate service with defaultCulture of the project
          this.translateService.setDefaultLang(defaultCulture);
        } else {
          this.traceService.warn(this.traceModule,
            `No default culture set on appContextService! Use the culture set by the browser: ${this.translateService.getBrowserLang()}`);
          // No default culture set on appContextService; use the culture set by the browser
          this.translateService.setDefaultLang(this.translateService.getBrowserLang());
        }
        this.getTranslations();
      },
      error: err => {
        this.translateService.setDefaultLang(this.translateService.getBrowserLang());
      }
    }));
  }

  public onBeforeAttach(): void {
    super.onBeforeAttach();
    this?.graphicsSnapinService?.onBeforeAttachSubject?.next();

    // update the hldlconfig for graphics snapin
    // this is not enough in case of reuse. this.location is not updated.
    this.getHldlConfigs();
  }

  /**
   * Executed every time a user makes a selection in System Browser.
   * @param messageType
   * @param messageData
   */
  public receiveMessage(messageBody: GmsMessageData): boolean {

    if (messageBody == null || messageBody.data == null || messageBody.data.length <= 0) {
      return;
    }

    const browserObject: BrowserObject = messageBody.data[0];

    if (browserObject == null || browserObject.Name == null || browserObject.Attributes == null) {
      return;
    }
    const snapinArgs: GraphicSnapInArgs = { SelectionObject: browserObject, CustomDataObject: undefined };

    snapinArgs.SelectionObject = browserObject;

    this.timerService.stopPhase(TimerPhaseEnum.PreSelection);

    // start timer for Selection phase of graphic loading
    this.timerService.startPhase(TimerPhaseEnum.RetrievingGraphicItems);

    // Context for GraphicTemplate, when selection is from related items
    const customDataObject: BrowserObject = messageBody.customData !== undefined
    && messageBody.customData.length > 0 ? messageBody.customData[0] : undefined;
    if (customDataObject !== undefined && customDataObject.Name !== undefined && customDataObject.Attributes !== undefined) {
      snapinArgs.CustomDataObject = customDataObject;
    } else {
      snapinArgs.CustomDataObject = undefined;
    }

    this.updateIsFolder(snapinArgs.SelectionObject);

    this._snapinArgs = snapinArgs; // Provide the snapin args to the graphic view component
    const task: () => void = () => this.snapinArgsSubject?.next?.(this._snapinArgs);
    asyncScheduler.schedule(task, 0);
    return true;
  }

  public updateIsFolder(node: BrowserObject): boolean {
    if (node === undefined || node === null) {
      return false;
    }

    if (node !== undefined && node !== null && node.Attributes !== undefined) {
      const selectedObjectType: string = node.Attributes.ManagedTypeName;
      this.isFolder = selectedObjectType === GmsManagedTypes.PROJECT_GRAPHIC_ROOT_FOLDER.name;
    }
  }

  public ngOnDestroy(): void {
    this.unsubscribe.next();
    this.traceService.info(this.traceModule, 'Component destroyed.');
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription != null) {
        subscription.unsubscribe();
      }
    });

    if (this._snapinArgs !== undefined) {
      this._snapinArgs.CustomDataObject = undefined;
      this._snapinArgs.SelectionObject = undefined;
      this._snapinArgs = undefined;
    }

    if (this._hldlConfig !== undefined) {
      this._hldlConfig = undefined;
    }

    if (this.messageSubscription !== undefined) {
      this.messageSubscription.unsubscribe();
    }
  }

  /**
   * Constructor
   * @param traceService The trace service.
   * @param messageBroker
   * @param activatedRoute
   */
  public constructor(private readonly traceService: TraceService,
                     messageBroker: IHfwMessage,
                     activatedRoute: ActivatedRoute,
                     private readonly translateService: TranslateService,
                     private readonly snapinconfig: ISnapInConfig,
                     private readonly timerService: TimerService,
                     private readonly appContextService: AppContextService,
                     private readonly multiMonitorService: MultiMonitorServiceBase,
                     public readonly graphicsSnapinService: GraphicsSnapinService) {
    super(messageBroker, activatedRoute);
    this.traceModule = TraceChannel.Component;
    this.unsubscribe = new Subject<void>();
  }

  private getTranslations(): void {
    this.translateService.get([
      'SEARCH-PLACEHOLDER'
    ]).toPromise().then(strings => {
      this.searchPlaceHolder = strings['SEARCH-PLACEHOLDER'];
    });
  }

  private getHldlConfigs(): void {
    this._hldlConfig = this.snapinconfig.getSnapInHldlConfig(this.fullId, this.location);
    if (this._hldlConfig === undefined) {
      this.traceService.info(this.traceModule, 'Graphic snapin hldl config not available');
    } else {
      this.traceService.info(this.traceModule, 'Graphic snapin hldl config initialized');
      this.isSinglePane = this._hldlConfig.IsSinglePane;
      this.avoidPreselectOnSecondarySelection = this._hldlConfig.avoidPreselectOnSecondarySelection;
    }
  }

  public onSelectionChanged(selections: BrowserObject[]): void {
    if (!selections || selections.length === 0) {
      return;
    }

    this.traceService.info(this.traceModule, `new selection in graphics snapin`);
    const messageBodyValue: GmsMessageData = new GmsMessageData(selections, GmsSelectionType.Object);
    let types: string[] = [];
    const isPreselection: boolean = !this.avoidPreselectOnSecondarySelection;
    const qParamValue: QParam = undefined;
    const isBroadcast: boolean = false;
    const applyRuleIdValue: string = undefined; // "SecondarySelection";
    types = selections.map((selection: BrowserObject) => selection.Attributes.ManagedTypeName);
    this.getHldlConfigs();
    const secondarySelectionInSinglePaneValue: boolean = this.isSinglePane;
    const messageToSend: ParamsSendMessage = {
      messageBody: messageBodyValue,
      preselection: isPreselection,
      qParam: qParamValue,
      broadcast: isBroadcast,
      applyRuleId: applyRuleIdValue,
      secondarySelectionInSinglePane: secondarySelectionInSinglePaneValue
    };
    this.sendMessage(types, messageToSend).subscribe((res: boolean) => {
      this.traceService.debug(this.traceModule, 'sendMessage() completed. result: %s', res);
    });
  }

  public onNavigation(navigationTargets: BrowserObject[]): void {
    if (!navigationTargets || navigationTargets.length === 0) {
      return;
    }
    this.traceService.info(this.traceModule,
      `navigating to new browser objects: ${navigationTargets.map(
        (targetDesignation: BrowserObject) => targetDesignation.Designation).join('\n')
      }`);

    const messageBodyValue: GmsMessageData = new GmsMessageData(navigationTargets, GmsSelectionType.Cns);
    const types: string[] = navigationTargets.map((browserObject: BrowserObject) => browserObject.Attributes.ManagedTypeName);
    const isPreselection: boolean = true;
    // const qParamValue: string = navigationTargets[0].Designation;
    const isBroadcast: boolean = false;
    this.getHldlConfigs();
    const qParamValue: QParam = this.isSinglePane ? {
      name: this.fullQParamId.fullId(),
      value: navigationTargets[0].Designation
    } : undefined;
    const ruleName: string = 'new-primary-selection';
    const messageToSend: ParamsSendMessage = {
      messageBody: messageBodyValue,
      preselection: isPreselection,
      qParam: qParamValue,
      broadcast: isBroadcast,
      applyRuleId: ruleName
    };
    if (!this.trySendMessageToOtherWindow(navigationTargets, types, messageBodyValue)) {
      // NOTE: update hldl; call SnapInBase.sendMessage() instead of messageBroker.sendMessage()
      this.sendMessage(types, messageToSend).subscribe((res: boolean) => {
        this.traceService.debug(this.traceModule, 'sendMessage() completed. result: %s', res);
      });
    }
  }

  private trySendMessageToOtherWindow(navigationTargets: BrowserObject[], messageTypes: string[], messageBody: GmsMessageData): boolean {
    const webContentsId: number = this.multiMonitorService.matchCommunicationRules(navigationTargets[0]);
    if (webContentsId !== undefined) {
      // multimonitor: send selection to other window due to matching communication rules
      const qParam: QParam = {
        name: this.fullQParamId.fullId(),
        value: navigationTargets[0].Designation
      };
      const message: MessageParameters = {
        messageBody,
        qParam,
        types: messageTypes
      };
      const object = {
        type: ObjectMessageType.SendSelectionMessage,
        data: { message }
      };
      this.multiMonitorService.sendObject(webContentsId, object);
      return true;
    } else {
      return false;
    }
  }
}
