import { Component, HostBinding, OnInit } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { isNullOrUndefined } from '@gms-flex/services-common';

import { IStateService } from '../../common/interfaces/istate.service';
import { View } from '../shared/hldl/hldl-data.model';
@Component({
  selector: 'hfw-view',
  templateUrl: './view.component.html',
  standalone: false
})
export class ViewComponent implements OnInit {

  @HostBinding('class.d-flex') public flexCol = true;
  @HostBinding('class.flex-grow-1') public flexGrow = true;
  @HostBinding('style.min-width') public minWidth = '0';
  @HostBinding('style') public style: SafeStyle = '';

  public id: string | undefined;

  public ngOnInit(): void {
    this.style = this.sanitizer.bypassSecurityTrustStyle('max-width: -webkit-fill-available');
    if (!isNullOrUndefined(this.route) &&
    !isNullOrUndefined(this.route.snapshot) &&
      !isNullOrUndefined(this.route.snapshot.data)) {
      this.id = (this.route.snapshot.data as View).id;
    }
  }

  public constructor(private readonly route: ActivatedRoute,
    private readonly stateService: IStateService,
    private readonly sanitizer: DomSanitizer) {
  }

  public onActivate(value: any): void {
    if ((value?.route?.snapshot?.data?.viewId) &&
        (value?.route?.snapshot?.data?.frame?.id) &&
        value?.route?.snapshot?.data?.layoutConfig?.id) {

      // qui update view from ?
      this.stateService.updateLayoutFromExternNavigate(value.route.snapshot.data.frame.id,
        value.route.snapshot.data.viewId, value.route.snapshot.data.layoutConfig.id);
    }
  }
}
