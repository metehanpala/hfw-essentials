import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouteReuseStrategy } from '@angular/router';
import { HfwControlsModule } from '@gms-flex/controls';
import { MockTraceService, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { SiContentActionBarModule, SiEmptyStateModule, SiResizeObserverModule } from '@simpl/element-ng';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { Subscription } from 'rxjs';

import { routing } from '../../testing/test.routing';
import { PageComponent } from '../page/page.component';
import { PaneHeaderComponent } from '../pane-header';
import { PaneTabComponent, PaneTabSelectedComponent } from '../pane-tab';
import { PaneComponent } from '../pane/pane.component';
import { Docked } from '../shared/hldl/hldl-data.model';
import { HldlService } from '../shared/hldl/hldl.service';
import { RouterOutletComponent } from '../shared/routing/router-outlet.component';
import { FrameStore } from '../shared/stores/frame.store';
import { PaneStore } from '../shared/stores/pane.store';
import { SplitterHostComponent } from '../splitterhost/splitterhost.component';
import { AppStatus } from '../state/app-status.model';
import { StateService } from '../state/state.service';
import { HfwTabComponent, HfwTabsetComponent } from '../tabs';
import { LayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  const obj: any = {
    'docked': Docked.none
  };

  const stateStub: any = {
    getPaneStoreViaIds: () => {},
    getSnapInsFromPaneId: () => {},
    getFrameStoreViaId: (): FrameStore => null!
  };

  const stateServiceStub: any = {
    currentState: stateStub,
    appStatus: AppStatus.ProcessingNewSelection,
    updatePaneFromExternNavigate: () => {},
    getPaneById: () => {},
    getPaneStoreViaIds: (): PaneStore => null!
  };

  const hldlServiceStub: any = {
    getFrameById: () => obj
  };

  const activatedRouteStub: any = {
    'snapshot': {
      'data': {
        'frame':
          {
            'panes': [
              {},
              {}
            ],
            'layoutInstances': [
              {},
              {}
            ],
            'docked': Docked.none,
            'id': 'summary-bar'
          },
        'layoutConfig': {}
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        PageComponent, RouterOutletComponent, SplitterHostComponent,
        PaneComponent, PaneHeaderComponent, PaneTabComponent,
        PaneTabSelectedComponent, LayoutComponent, HfwTabsetComponent, HfwTabComponent
      ],
      imports: [HfwControlsModule, SiEmptyStateModule, SiContentActionBarModule, SiResizeObserverModule,
        TabsModule.forRoot(), routing, TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: StateService, useValue: stateServiceStub },
        { provide: HldlService, useValue: hldlServiceStub },
        SettingsServiceBase,
        provideHttpClient(withInterceptorsFromDi())
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create a layout component', () => {
    expect(component).toBeTruthy();
  });

  it('should make the assignments on initialize', () => {
    expect(component.frameId).toBe('summary-bar');
  });

  it('should unsubscribe on destroy', () => {
    (component as any).sub = new Subscription();
    const spySub: jasmine.Spy = spyOn<any>((component as any).sub, 'unsubscribe');
    component.ngOnDestroy();
    expect(spySub).toHaveBeenCalled();
  });

});
