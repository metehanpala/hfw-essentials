import { Component, HostBinding, OnInit } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { isNullOrUndefined } from '@gms-flex/services-common';

import { IStateService } from '../../common/interfaces/istate.service';
import { Docked, HfwFrame } from '../shared/hldl/hldl-data.model';
@Component({
  selector: 'hfw-frame',
  templateUrl: './frame.component.html',
  standalone: false
})
export class FrameComponent implements OnInit {

  @HostBinding('class.d-flex') public get dflex(): boolean { return !this.isDocked; }
  @HostBinding('class.flex-grow-1') public get flexgrow1(): boolean { return !this.isDocked; }

  @HostBinding('style') public style: SafeStyle = '';

  public isDocked = false;

  public id!: string;

  public ngOnInit(): void {
    if (!isNullOrUndefined(this.route) &&
    !isNullOrUndefined(this.route.snapshot) &&
      !isNullOrUndefined(this.route.snapshot.data)) {
      this.id = (this.route.snapshot.data as HfwFrame).id;
      this.isDocked = (this.route.snapshot.data as HfwFrame).docked === Docked.top ? true : false;
      this.style = this.isDocked ? this.sanitizer.bypassSecurityTrustStyle('max-height: 100%') :
        this.sanitizer.bypassSecurityTrustStyle('max-height: -webkit-fill-available');
    }
  }

  public constructor(private readonly route: ActivatedRoute,
    private readonly stateService: IStateService,
    private readonly sanitizer: DomSanitizer) {
  }

  public onActivate(value: any): void {
    if ((value?.route?.snapshot?.data?.viewConfig?.id) &&
        (value?.route?.snapshot?.data?.frameId)) {
      this.stateService.updateViewFromExternNavigate(value.route.snapshot.data.frameId, value.route.snapshot.data.viewConfig.id);
    }
  }
}
