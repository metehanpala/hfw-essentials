import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, Observer, of } from 'rxjs';

import { FullPaneId } from '../../../common/fullsnapinid/full-pane-id.model';
import { FullSnapInId } from '../../../common/fullsnapinid/fullsnapinid.model';
import { TraceModules } from '../trace/trace-modules';
import * as dataModel from './hldl-data.model';
import { HldlReaderService } from './hldl-reader.service';

const ACTIVATE_VERTICAL_NAVBAR_FOLDER_COMPRESSION = true;
const hldlPropNotDefine = ' is not defined. Please Check Hldl File where you define ';

/**
 * This service provides information retrieved from the parsed hldl file.
 */
@Injectable({
  providedIn: 'root'
})
export class HldlService {
  // The outletmap of working area frames Key<outletName> Value<PaneFullId>.
  public workAreaOutletMap: Map<string, FullPaneId> = new Map<string, FullPaneId>();

  /**
   * Stores the run-time representation of HLDL file basing on our datamodel.
   */
  protected hfwInstance!: dataModel.HfwInstance | null;

  public constructor(private readonly hfwTrace: TraceService,
    private readonly hldlReaderService: HldlReaderService,
    private readonly authenticationServiceBase: AuthenticationServiceBase) {
  }

  /**
   * Returns an Observable with the array of frames of the current HLDL instance.
   */
  public getHfwInstance(): Observable<dataModel.HfwInstance> {
    if (!isNullOrUndefined(this.hfwInstance) && !isNullOrUndefined(this.hfwInstance!.hfwFrames)) {
      return of(this.hfwInstance!);
    } else {
      const instanceObs: Observable<dataModel.HfwInstance> = new Observable((observer: Observer<dataModel.HfwInstance>) => {
        this.onSubscription(observer);
      });
      return instanceObs;
    }
  }

  public cleanDataStructure(): void {
    this.hfwInstance = null;
  }

  public getHfwInstanceValue(): dataModel.HfwInstance | null {
    return this.hfwInstance;
  }
  public getPaneInstance(paneId: string, layout: dataModel.LayoutInstance): dataModel.PaneInstance | null {
    let res: dataModel.PaneInstance | null = null;
    if (!isNullOrUndefined(layout.paneInstance)) {
      if (layout.paneInstance.id === paneId) {
        res = layout.paneInstance;
      }
    } else {
      if (!isNullOrUndefined(layout.splitter)) {
        res = this.getPaneInstanceInSplitter(paneId, layout.splitter!)!;
      }
    }
    return res;
  }

  public getFrameById(frameId: string): dataModel.HfwFrame | null {
    if (this.hfwInstance?.hfwFrames != null) {
      const frame: dataModel.HfwFrame = this.hfwInstance.hfwFrames.find(f => f.id === frameId)!;
      return frame ?? null;
    }
    this.hfwTrace.warn(TraceModules.hldlService, 'getFrameById: \'' + frameId + '\'\' not found.');
    return null;
  }

  public getSnapInReference(fullId: FullSnapInId, location: FullPaneId): dataModel.SnapInReference {
    let sni: dataModel.SnapInReference;
    // check if location is null, the snapin can be in the right panel.
    if (!isNullOrUndefined(location)) {
      const hfwFrame = this.getFrameById(location.frameId);
      const paneConfig = hfwFrame!.panes.find(p => p.id === location.paneId);
      sni = paneConfig!.snapInReferences.find(s => s.id === fullId.snapInId)!;
    }
    return sni!;
  }

  public getFirstWorkAreaFrame(): dataModel.HfwFrame | null {
    let result: dataModel.HfwFrame | null = null;
    if (this.hfwInstance) {
      for (const frame of this.hfwInstance.hfwFrames) {
        if (frame.docked === null || frame.docked !== dataModel.Docked.top) {
          result = frame;
        }
      }
    }
    return result;
  }

  public getModes(): dataModel.Mode[] | null {
    if (this.hfwInstance?.modes != null) {
      return this.hfwInstance?.modes;
    }
    this.hfwTrace.warn(TraceModules.hldlService, 'getModes: hfwInstance.modes not defined.');
    return null;
  }

  public getFirstSnapInId(pane: dataModel.Pane): string {
    return pane.snapInReferences[0].id;
  }

  public hasLoadedProfile(profileFileName: string): boolean {
    if (profileFileName) {
      return this.hldlReaderService.hasLoadedProfile(profileFileName);
    }
    return false;
  }

  public getSnapInTypes(): dataModel.SnapInType[] | null {
    if (!isNullOrUndefined(this.hfwInstance)) {
      return this.hfwInstance!.snapInTypes;
    }
    return null;
  }

  private onSubscription(observer: Observer<dataModel.HfwInstance>): void {
    this.hldlReaderService.getHfwInstance(this.authenticationServiceBase.userProfile + '.hldl.json').
      subscribe((data: any) => this.fillDataModel(data, observer));
  }

  private getPaneInstanceInSplitter(paneId: string, splitter: dataModel.Splitter): dataModel.PaneInstance | null {
    let res: dataModel.PaneInstance | null = null;

    // search left branch
    if (!isNullOrUndefined(splitter.firstChild)) {
      if (!isNullOrUndefined(splitter.firstChild.paneInstance)) {
        if (splitter.firstChild.paneInstance.id === paneId) {
          res = splitter.firstChild.paneInstance;
        }
      } else {
        res = this.getPaneInstanceInSplitter(paneId, splitter.firstChild.splitter);
      }
    }

    // search right branch
    if (isNullOrUndefined(res)) {
      if (!isNullOrUndefined(splitter.secondChild)) {
        if (!isNullOrUndefined(splitter.secondChild.paneInstance)) {
          if (splitter.secondChild.paneInstance.id === paneId) {
            res = splitter.secondChild.paneInstance;
          }
        } else {
          res = this.getPaneInstanceInSplitter(paneId, splitter.secondChild.splitter);
        }
      }
    }
    return res;
  }

  /**
   * Fills the interal structures deserializing the json object recieved as input.
   */
  private fillDataModel(jSon: dataModel.HfwInstance, observer: Observer<dataModel.HfwInstance>): void {
    if (!isNullOrUndefined(jSon)) {
      this.hfwInstance = this.deserialize(jSon, dataModel, dataModel.HfwInstance);
      if (!isNullOrUndefined(this.hfwInstance)) {
        this.postDeserialize(this.hfwInstance!);
        observer.next(this.hfwInstance!);
        observer.complete();
      } else {
        this.hfwTrace.warn(TraceModules.hldlService, 'Hldl Error; Deserialize Failed.');
      }
    } else {
      this.hfwTrace.warn(TraceModules.hldlService, 'Hldl Error; json object undefined.');
    }
    observer.complete();
  }

  /**
   * Convert multiple attributes from string to Enum into HLDL tree.
   */
  private postDeserialize(instance: dataModel.HfwInstance): void {
    if (!isNullOrUndefined(instance.hfwFrames)) {
      let frameOutletNumber = 1;
      for (const frame of instance.hfwFrames) {
        this.convertDockedFromStringToEnum(frame);
        const isWorkAreaFrame: boolean = frame.docked !== dataModel.Docked.top;
        if (!isWorkAreaFrame) {
          frame.outletName = 'o' + frameOutletNumber.toString();
          frameOutletNumber++;
        } else {
          frame.outletName = 'main';
        }

        if (!isNullOrUndefined(frame.panes)) {
          for (const pane of frame.panes) {
            pane.outletName = 'o' + frameOutletNumber.toString();
            this.setWorkAreaOutletMap(isWorkAreaFrame, pane, frame);
            frameOutletNumber++;
            this.convertTitleFromStringToEnum(pane);
          }
        }
        frame.layoutInstances = this.setFramsetFrameInstances(frame);
        frame.views = this.setFrameViews(frame);
      }
      if (ACTIVATE_VERTICAL_NAVBAR_FOLDER_COMPRESSION && !isNullOrUndefined(instance.verticalBarConfigs)) {
        this.cleanVerticalBarEntries(instance.verticalBarConfigs);
      }
    }
  }

  private setWorkAreaOutletMap(isWorkAreaFrame: boolean, pane: dataModel.Pane, frame: dataModel.HfwFrame): void {
    if (isWorkAreaFrame) {
      this.workAreaOutletMap.set(pane.outletName!, new FullPaneId(frame.id, pane.id));
    }
  }

  private setFramsetFrameInstances(_frame: dataModel.HfwFrame): dataModel.LayoutInstance[] {
    if (isNullOrUndefined(_frame.layoutInstances)) {
      _frame.layoutInstances = this.createDefaultLayout(_frame);
    } else {
      this.calculateMinWidthFromMediaQuery(_frame.layoutInstances);
    }
    return _frame.layoutInstances;
  }
  private setFrameViews(_frame: dataModel.HfwFrame): dataModel.View[] {
    if (isNullOrUndefined(_frame.views)) {
      _frame.views = this.createDefaultView(_frame);
    }
    return _frame.views;
  }

  private cleanVerticalBarEntries(verticalBarConfigs: dataModel.VerticalBarConfig[]): void {
    verticalBarConfigs.forEach((config: dataModel.VerticalBarConfig) => {

      config.verticalBarItems.forEach((item: dataModel.VerticalBarItem) => {
        if (!isNullOrUndefined(item.verticalBarItems) && isNullOrUndefined(item.targetFrame)) {
          // remove navbar with no frame configured.
          item.verticalBarItems = this.removeUnexistingFrame(item.verticalBarItems);
          item.verticalBarItems.forEach((vi: dataModel.VerticalBarItem) => {
            if (!isNullOrUndefined(vi.verticalBarItems)) {
              vi.verticalBarItems = this.removeUnexistingFrame(vi.verticalBarItems);
            }
          });
        }
      });

      // compress navbarfolder with one or zero elements
      config.verticalBarItems = this.compressFolders(config.verticalBarItems);
    });
  }

  private compressFolders(verticalBarItems: dataModel.VerticalBarItem[]): dataModel.VerticalBarItem[] {
    const replacers: { index: number; item: dataModel.VerticalBarItem }[] = [];
    const res: dataModel.VerticalBarItem[] = verticalBarItems.filter((item: dataModel.VerticalBarItem) => {
      if (!isNullOrUndefined(item.verticalBarItems)) {
        return (item.verticalBarItems.length > 0);
      }
      return true;
    });
    res.forEach((vi: dataModel.VerticalBarItem, i: number) => {
      if (!isNullOrUndefined(vi.verticalBarItems) && vi.verticalBarItems.length === 1 && vi.hideFolderOnSingleEntry) {
        if (!isNullOrUndefined(vi.icon) && isNullOrUndefined(vi.verticalBarItems[0].icon)) { // inherit the icon from the folder.
          vi.verticalBarItems[0].icon = vi.icon;
        }
        replacers.push({ index: i, item: vi.verticalBarItems[0] });
      }
    });
    replacers.forEach((replacer: { index: number; item: dataModel.VerticalBarItem }) => {
      res[replacer.index] = replacer.item;
    });
    return res;
  }

  private removeUnexistingFrame(verticalBarItems: dataModel.VerticalBarItem[]): dataModel.VerticalBarItem[] {
    return verticalBarItems.filter((item: dataModel.VerticalBarItem) => {
      if (!isNullOrUndefined(item.targetFrame) && isNullOrUndefined(item.targetView)) {
        return (this.hfwInstance!.hfwFrames.find(f => f.id === item.targetFrame) !== undefined);
      }
      return true;
    });
  }

  /**
   * Convert from string to Docked enum.
   */
  private convertDockedFromStringToEnum(frame: dataModel.HfwFrame): void {
    if (!isNullOrUndefined(frame)) {
      frame.docked = (dataModel.Docked as any)[frame.docked];
      if (isNullOrUndefined(frame.docked)) {
        frame.docked = dataModel.Docked.none;
      }
    }
  }
  /**
   * Convert from string to Title enum.
   */
  private convertTitleFromStringToEnum(pane: dataModel.Pane): void {
    pane.paneTitleOrSnapinTitle = (dataModel.Title as any)[pane.paneTitleOrSnapinTitle];
    if (isNullOrUndefined(pane.paneTitleOrSnapinTitle)) {
      pane.paneTitleOrSnapinTitle = dataModel.Title.pane;
    }
  }

  /**
   * Filters available layout basing on mediaQuery and creates singlepane-layout if not defined.
   */
  private createDefaultLayout(frame: dataModel.HfwFrame): dataModel.LayoutInstance[] {
    let layouts: dataModel.LayoutInstance[] = [];
    if (isNullOrUndefined(frame.layoutInstances)) {
      // create default Layout with single pane.
      let paneInstance: dataModel.PaneInstance;
      if (!isNullOrUndefined(frame.panes) &&
          frame.panes.length > 0 &&
          !isNullOrUndefined(frame.panes[0])) {
        paneInstance = new dataModel.PaneInstance(frame.panes[0].id, null);
      } else {
        paneInstance = new dataModel.PaneInstance('empty', null);
      }

      layouts = [];
      layouts.push(new dataModel.LayoutInstance(paneInstance, null, 'element-layout-pane-1', null, null, null, null, true, null, 'l'));
    }
    return layouts;
  }

  private createDefaultView(frame: dataModel.HfwFrame): dataModel.View[] {
    let views: dataModel.View[] = [];
    if (isNullOrUndefined(frame.views)) {
      // create default view with all layouts.
      const viewLayouts: dataModel.ViewLayout[] = [];
      frame.layoutInstances.forEach(l => viewLayouts.push({ id: l.id }));

      views = [new dataModel.View(viewLayouts, 'v')];
    }
    return views;
  }

  private calculateMinWidthFromMediaQuery(layouts: dataModel.LayoutInstance[]): void {
    layouts.forEach((l: dataModel.LayoutInstance) => {
      if (!isNullOrUndefined(l.mediaQuery)) {
        const startingIndex: number = l.mediaQuery!.indexOf('min-width:');
        if (startingIndex >= 0) {
          const endIndex: number = l.mediaQuery!.indexOf('px', startingIndex);
          if (endIndex >= 0) {
            l.minWidthFromMediaQuery = parseInt(l.mediaQuery!.substring(startingIndex + 10, endIndex), 10);
          }
        }
      }
    });
  }

  /**
   * since our Class use Capital First letter, their properties should be converted
   */
  private capitalizeFirstLetter(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  /**
   * This recoursive method takes as input a json object, the enviroment in which the class is defined and the
   * class type and it returns the corresponding deserialized object, deserializing also its children on the tree.
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  private deserialize(json: any, environment: any, classRef: any): any {

    if (classRef !== undefined) {
      const instance: any = new classRef();
      let prop: any;

      try {
        for (prop in json) {
          if (!json.hasOwnProperty(prop)) {
            continue;
          }
          if (typeof json[prop] === 'object') {
            if (json[prop].length !== undefined) {
              const vector: any[] = [];
              let res: string;
              for (const j of json[prop]) {
                res = prop.substring(0, (prop.length - 1));
                res = this.capitalizeFirstLetter(res);
                vector.push(this.deserialize(j, environment, environment[res]));
              }
              if (!instance.hasOwnProperty(prop)) {
                this.hfwTrace.error(TraceModules.hldlService, prop + hldlPropNotDefine + prop);
                continue;
              }
              instance[prop] = vector;
            } else {
              if (!instance.hasOwnProperty(prop)) {
                this.hfwTrace.error(TraceModules.hldlService, prop + hldlPropNotDefine + prop);
                continue;
              } else {
                const res: string = this.capitalizeFirstLetter(prop);
                if (environment[res] === undefined) {
                  // the object is not part, so it can be an any property like the snapininstance config
                  instance[prop] = json[prop];
                } else {
                  instance[prop] = this.deserialize(json[prop], environment, environment[res]);
                }
              }
            }
          } else {
            if (!instance.hasOwnProperty(prop)) {
              this.hfwTrace.error(TraceModules.hldlService, prop + hldlPropNotDefine + prop + '.');
              continue;
            }
            instance[prop] = json[prop];
          }
        }
        return instance;
      } catch (error) {
        this.hfwTrace.error(TraceModules.hldlService, prop + hldlPropNotDefine + prop + '.');
      }
    } else {
      this.hfwTrace.error(TraceModules.hldlService, 'classRef is not defined. Please Check Hldl File.');
    }
  }

}
