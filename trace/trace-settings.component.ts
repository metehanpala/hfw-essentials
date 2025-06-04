import { Component, Input, OnInit } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { ListItem } from '../list/data.model';

@Component({
  selector: 'hfw-trace-settings',
  templateUrl: './trace-settings.component.html',
  styleUrl: './trace-settings.component.scss',
  standalone: false
})
export class TraceSettingsComponent implements OnInit {

  @Input() public allModules: ListItem[] = [];

  public errorEnabled = true;

  public warnEnabled = true;

  public readonly trackByIndex = (index: number): number => index;

  public constructor(
    private readonly traceService: TraceService,
    public bsModalRef: BsModalRef) {
  }

  public ngOnInit(): void {
    this.traceService.traceSettings.modules.forEach(item => {
      const newItem: ListItem = new ListItem(item.label, item.label);
      newItem.checked = (item.enabled === true) ? true : false;
      this.allModules.push(newItem);
    });

    this.traceService.traceSettings.vendorModules.forEach(item => {
      const newItem: ListItem = new ListItem(`vendor_${item.label} (restart to activate channel)`, item.label);
      newItem.checked = (item.enabled === true) ? true : false;
      this.allModules.push(newItem);
    });

    this.allModules.sort((a, b) => {
      if (a.label < b.label) {
        return -1;
      }
      if (a.label > b.label) {
        return 1;
      }
      return 0;
    });
  }

  public get infoEnabled(): boolean {
    return this.traceService.traceSettings.infoEnabled;
  }

  public set infoEnabled(value: boolean) {
    this.traceService.traceSettings.infoEnabled = value;
    this.traceService.traceSettings.storeTraceSettingsToLocStore();
  }

  public set debugEnabled(value: boolean) {
    this.traceService.traceSettings.debugEnabled = value;
    this.traceService.traceSettings.storeTraceSettingsToLocStore();
  }

  public get debugEnabled(): boolean {
    return this.traceService.traceSettings.debugEnabled;
  }

  public set allModulesEnabled(value: boolean) {
    this.traceService.traceSettings.allModulesEnabled = value;
    this.traceService?.traceSettings.storeTraceSettingsToLocStore();
  }

  public get allModulesEnabled(): boolean {
    return this.traceService.traceSettings.allModulesEnabled;
  }

  public onItemChecked(item: ListItem): void {
    const { customData, checked } = item;
    const updateModuleStatus = (modules: Map<string, any>, key: string, isChecked: boolean): void => {
      if (modules.has(key) && modules.get(key) !== undefined) {
        // Here I inverted isChecked, false means it is checked, true means toggle is off (not checked) otherwise
        // it fails to save the selected states.
        // this seems to be changed after Angular 17 update, IDK why tho, seems weird. Should be checked in the future.
        modules.get(key)!.enabled = !isChecked; // Update the enabled status based on the checked property
        this.traceService.traceSettings.storeTraceSettingsToLocStore(); // Persist the updated trace settings
      }
    };
    // Update the status for standard modules
    updateModuleStatus(this.traceService.traceSettings.modules, customData as string, checked);
    // Update the status for vendor modules
    updateModuleStatus(this.traceService.traceSettings.vendorModules, customData as string, checked);
  }

  public onClearModules(): void {
    this.traceService?.traceSettings?.modules.forEach(value =>
      value.enabled = false);
    this.allModules.forEach(value => {
      value.checked = false;
    });
    this.traceService.traceSettings.storeTraceSettingsToLocStore();

  }
}
