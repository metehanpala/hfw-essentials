import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { HfwFrame, LayoutInstance } from '../shared/hldl/hldl-data.model';

@Component({
  selector: 'hfw-layout',
  templateUrl: './layout.component.html',
  standalone: false
})
/**
 * This class represents a Layout of a frame, it define how to display Pane,Splitters SNIs in visual tree.
 */
export class LayoutComponent implements OnInit, OnDestroy {

  @HostBinding('class.d-flex') public flexCol = true;
  @HostBinding('class.flex-grow-1') public flexGrow = true;
  @HostBinding('style.min-width') public minWidth = '0';
  @HostBinding('style') public style: SafeStyle = '';

  public layoutConfig!: LayoutInstance;

  public frameId!: string;

  private readonly sub!: Subscription;

  public ngOnInit(): void {
    this.style = this.sanitizer.bypassSecurityTrustStyle('max-width: -webkit-fill-available');
    if (this.route?.snapshot?.data != null) {
      this.layoutConfig = this.route.snapshot.data.layoutConfig as LayoutInstance;
      const frame: HfwFrame = this.route.snapshot.data.frame as HfwFrame;
      this.frameId = frame.id;
    }
  }

  public ngOnDestroy(): void {
    if (this.sub != null) {
      this.sub.unsubscribe();
    }
  }

  public constructor(private readonly route: ActivatedRoute,
    private readonly sanitizer: DomSanitizer) {
  }

}
