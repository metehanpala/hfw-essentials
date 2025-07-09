/* eslint-disable @typescript-eslint/naming-convention */

enum TraceModulesEn {
  hfwCore_automaticFirstSelection,
  hfwCore_changeLayout,
  hfwCore_changeMode,
  hfwCore_ErrorManagerService,
  hfwCore_Frame,
  hfwCore_Guards,
  hfwCore_HldlMergeManager,
  hfwCore_HldlReader,
  hfwCore_HldlService,
  hfwCore_Layout,
  hfwCore_MessageBroker,
  hfwCore_Navigate,
  hfwCore_Page,
  hfwCore_Pane,
  hfwCore_PaneHeader,
  hfwCore_Preselection,
  hfwCore_QParam,
  hfwCore_ReuseSnapin,
  hfwCore_SettingsService,
  hfwCore_State,
  hfwCore_SplitterHost,
  hfwCore_SwitchFrame,
  hfwCore_UnsavedData,
  hfwCore_SnapInBase,
  hfwCore_SnapInActions,
  hfwCore_MobileNavigation,
  hfwCore_MobileService,
  hfwCore_MobileView
}

export class TraceModules {
  public static automaticSelection: string = TraceModulesEn[TraceModulesEn.hfwCore_automaticFirstSelection];
  public static changeLayout: string = TraceModulesEn[TraceModulesEn.hfwCore_changeLayout];
  public static changeMode: string = TraceModulesEn[TraceModulesEn.hfwCore_changeMode];
  public static errorManager: string = TraceModulesEn[TraceModulesEn.hfwCore_ErrorManagerService];
  public static frame: string = TraceModulesEn[TraceModulesEn.hfwCore_Frame];
  public static guards: string = TraceModulesEn[TraceModulesEn.hfwCore_Guards];
  public static hldlMerge: string = TraceModulesEn[TraceModulesEn.hfwCore_HldlMergeManager];
  public static hldlReader: string = TraceModulesEn[TraceModulesEn.hfwCore_HldlReader];
  public static hldlService: string = TraceModulesEn[TraceModulesEn.hfwCore_HldlService];
  public static layout: string = TraceModulesEn[TraceModulesEn.hfwCore_Layout];
  public static msgBroker: string = TraceModulesEn[TraceModulesEn.hfwCore_MessageBroker];
  public static navigate: string = TraceModulesEn[TraceModulesEn.hfwCore_Navigate];
  public static page: string = TraceModulesEn[TraceModulesEn.hfwCore_Page];
  public static pane: string = TraceModulesEn[TraceModulesEn.hfwCore_Pane];
  public static paneHeader: string = TraceModulesEn[TraceModulesEn.hfwCore_PaneHeader];
  public static preselection: string = TraceModulesEn[TraceModulesEn.hfwCore_Preselection];
  public static qParam: string = TraceModulesEn[TraceModulesEn.hfwCore_QParam];
  public static reuseSnapin: string = TraceModulesEn[TraceModulesEn.hfwCore_ReuseSnapin];
  public static settings: string = TraceModulesEn[TraceModulesEn.hfwCore_SettingsService];
  public static state: string = TraceModulesEn[TraceModulesEn.hfwCore_State];
  public static splitterHost: string = TraceModulesEn[TraceModulesEn.hfwCore_SplitterHost];
  public static switchFrame: string = TraceModulesEn[TraceModulesEn.hfwCore_SwitchFrame];
  public static unsavedData: string = TraceModulesEn[TraceModulesEn.hfwCore_UnsavedData];
  public static snapInBase: string = TraceModulesEn[TraceModulesEn.hfwCore_SnapInBase];
  public static snapInActions: string = TraceModulesEn[TraceModulesEn.hfwCore_SnapInActions];
  public static mobileNavigation: string = TraceModulesEn[TraceModulesEn.hfwCore_MobileNavigation];
  public static mobileService: string = TraceModulesEn[TraceModulesEn.hfwCore_MobileService];
  public static mobileView: string = TraceModulesEn[TraceModulesEn.hfwCore_MobileView];
}
