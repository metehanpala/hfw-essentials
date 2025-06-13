/**
 * TraceModulesEn
 *
 * @enum {number}
 */
 enum TraceModulesEn {
    gmsSnapins_NodeMapSnapIn,
    gmsSnapins_NodeMapSnapInService,
    gmsSnapins_NodeMapService,
    gmsSnapins_NodeMapObjectManager
}

/**
 * TraceModules
 *
 * @export
 * @class TraceModules
 */
export class TraceModules {
    public static nodeMapSnapIn: string = TraceModulesEn[TraceModulesEn.gmsSnapins_NodeMapSnapIn];
    public static nodeMapSnapInService: string = TraceModulesEn[TraceModulesEn.gmsSnapins_NodeMapSnapInService];
    public static nodeMapService: string = TraceModulesEn[TraceModulesEn.gmsSnapins_NodeMapService];
    public static nodeMapObjectManager: string = TraceModulesEn[TraceModulesEn.gmsSnapins_NodeMapObjectManager];
}
