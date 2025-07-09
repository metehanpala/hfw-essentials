import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { SnapinInstancesService } from '../state/snapin-instances.service';
import { SnapinHostComponent } from './snapin-host.component';

describe('SnapinHostComponent', () => {
  let component: SnapinHostComponent;
  let fixture: ComponentFixture<SnapinHostComponent>;
  let mockSnapinInstancesService: jasmine.SpyObj<SnapinInstancesService>;
  let mockActivatedRoute: ActivatedRoute;

  beforeEach(() => {
    // Create a mock for SnapinInstancesService
    mockSnapinInstancesService = jasmine.createSpyObj('SnapinInstancesService', ['registerSnapInBase', 'unRegisterSnapInBase']);

    // Create a mock for ActivatedRoute with snapshot data
    mockActivatedRoute = {
      snapshot: {
        data: {
          snapinId: {
            frameId: 'frame1',
            snapInId: 'snapin1'
          }
        }
      },
      // Adding additional properties to satisfy the ActivatedRoute type
      url: of([]),
      params: of({}),
      queryParams: of({}),
      fragment: of(''),
      outlet: '',
      component: null,
      title: ''
      // Add other necessary properties as needed
    } as unknown as ActivatedRoute;

    // Configure the TestBed
    TestBed.configureTestingModule({
      declarations: [SnapinHostComponent],
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA
      ],
      providers: [
        { provide: SnapinInstancesService, useValue: mockSnapinInstancesService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    // Create the component instance
    fixture = TestBed.createComponent(SnapinHostComponent);
    component = fixture.componentInstance;
  });

  it('should create the component and initialize fullId', () => {
    // Assert that the component is created
    expect(component).toBeTruthy();
    // Assert that fullId is initialized correctly
    expect(component.fullId).toEqual(new FullSnapInId('frame1', 'snapin1'));
  });

  it('should register snap-in on activation', () => {
    const mockValue = {}; // Mock value to simulate activated component
    component.onActivate(mockValue);
    // Assert that registerSnapInBase is called with the correct parameters
    expect(mockSnapinInstancesService.registerSnapInBase).toHaveBeenCalledWith(component.fullId, mockValue);
  });

  it('should unregister snap-in on deactivation', () => {
    component.onDeactivate();
    // Assert that unRegisterSnapInBase is called with the correct parameters
    expect(mockSnapinInstancesService.unRegisterSnapInBase).toHaveBeenCalledWith(component.fullId);
  });

  it('should set fullId correctly from route data when component initializes', () => {
    // Ensure fullId is set correctly based on mock route data
    expect(component.fullId).toEqual(new FullSnapInId('frame1', 'snapin1'));
  });

  it('should update fullId when route data changes', () => {
    // Change route data
    mockActivatedRoute.snapshot.data.snapinId = { frameId: 'frame2', snapInId: 'snapin2' };

    // Reinitialize the component
    fixture = TestBed.createComponent(SnapinHostComponent);
    component = fixture.componentInstance;

    // Verify the new fullId
    expect(component.fullId).toEqual(new FullSnapInId('frame2', 'snapin2'));
  });

});
