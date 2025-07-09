import { TestBed, waitForAsync } from '@angular/core/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { AppRightPanel, HfwInstance, PrimaryBarConfig } from './hldl-data.model';
import {
  HLDL_CLIENT_PROFILE_EXT_TEST_EXAMPLE, HLDL_EXTENSION_TEST_EXAMPLE,
  HLDL_EXTENSION_TEST_EXAMPLE_2, HLDL_TEST_EXAMPLE
} from './hldl-example-data.model';
import { HldlMergeManager } from './hldl-merge-manager';

/**
 * Test suite for the HldlMergeManager class.
 * This suite contains tests for merging profiles, including base profiles,
 * client profiles, and extension profiles.
 */
describe('HldlMergeManager', () => {
  /**
   * Test suite for the HldlMergeManager class.
   * This suite contains tests for merging profiles, including base profiles,
   * client profiles, and extension profiles.
   */

  // Mock service for tracing during tests
  let mockTrace: MockTraceService;

  // Variable to hold the current base profile for merging
  let currentBaseProfile: any;

  // Array to hold current extension client profiles for merging
  const currentExtensionClientProfiles: any[] = [];

  // Array to hold current extension profiles for merging
  const currentExtensionProfiles: any[] = [];

  let hfwInstance: HfwInstance;
  let hfwExt: HfwInstance;
  let hfwExt2: HfwInstance;
  let hfwClientExt: HfwInstance;

  // Setup before each test case
  beforeEach(waitForAsync(() => {

    // Initialize the mock trace service
    mockTrace = new MockTraceService();

    TestBed.configureTestingModule({
      imports: [],
      providers: []
    })
      .compileComponents();
  }));

  /**
   * Initialize the full extension with example data for testing.
   */
  const initFullExtension = (): void => {

    hfwInstance = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE.hfwInstance));
    hfwExt = JSON.parse(JSON.stringify(HLDL_EXTENSION_TEST_EXAMPLE.hfwExtension));
    hfwClientExt = JSON.parse(JSON.stringify(HLDL_CLIENT_PROFILE_EXT_TEST_EXAMPLE.hfwExtension));

    currentBaseProfile = hfwInstance;
    currentExtensionClientProfiles.push(hfwClientExt);
    currentExtensionProfiles.push(hfwExt);
  };

  /**
   * Initialize the full extension with additional example data for testing.
   */
  const initFullExtensionB = (): void => {

    hfwInstance = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE.hfwInstance));
    hfwExt = JSON.parse(JSON.stringify(HLDL_EXTENSION_TEST_EXAMPLE.hfwExtension));
    hfwExt2 = JSON.parse(JSON.stringify(HLDL_EXTENSION_TEST_EXAMPLE_2.hfwExtension));
    hfwClientExt = JSON.parse(JSON.stringify(HLDL_CLIENT_PROFILE_EXT_TEST_EXAMPLE.hfwExtension));

    currentBaseProfile = hfwInstance;
    currentExtensionClientProfiles.push(hfwClientExt);
    currentExtensionProfiles.push(hfwExt);
    currentExtensionProfiles.push(hfwExt2);
  };

  /**
   * Test case to merge one client profile with one extension.
   */
  it('HldlMergeManager: Merge 1 client profile and 1 extension.', () => {

    initFullExtension();
    const merger: HldlMergeManager = new HldlMergeManager(mockTrace as TraceService);
    const res: HfwInstance = merger.mergeProfiles(currentBaseProfile, currentExtensionClientProfiles, currentExtensionProfiles);
    expect(res).not.toBeNull();
  });

  /**
   * Test case to merge one client profile with two extensions.
   */
  it('HldlMergeManager: Merge 1 client profile and 2 extensions.', () => {

    initFullExtensionB();
    const merger: HldlMergeManager = new HldlMergeManager(mockTrace as TraceService);
    const res: HfwInstance = merger.mergeProfiles(currentBaseProfile, currentExtensionClientProfiles, currentExtensionProfiles);
    expect(res).not.toBeNull();
  });

  // New test cases
  /**
   * Test case to merge with no profiles provided.
   */
  it('HldlMergeManager: Merge with no profiles.', () => {

    const merger: HldlMergeManager = new HldlMergeManager(mockTrace as TraceService);
    const res: HfwInstance = merger.mergeProfiles(new HfwInstance([], [], new AppRightPanel([], []), new PrimaryBarConfig([]), [], [], 'default'), [], []);

    // Check that the returned instance has the expected structure
    expect(res.snapInTypes).toEqual([]);
    expect(res.hfwFrames).toEqual([]);
    expect(res.appRightPanel).toEqual(new AppRightPanel([], []));
    expect(res.primaryBarConfig).toEqual(new PrimaryBarConfig([]));
    expect(res.verticalBarConfigs).toEqual([]);
    expect(res.modes).toEqual([]);
    expect(res.startingFrameId).toEqual('default');
  });

  /**
   * Test case to merge multiple client profiles with extensions.
   */
  it('HldlMergeManager: Merge with multiple client profiles.', () => {

    initFullExtension();
    const secondClientExt = JSON.parse(JSON.stringify(HLDL_CLIENT_PROFILE_EXT_TEST_EXAMPLE.hfwExtension));
    currentExtensionClientProfiles.push(secondClientExt);
    const merger: HldlMergeManager = new HldlMergeManager(mockTrace as TraceService);
    const res: HfwInstance = merger.mergeProfiles(currentBaseProfile, currentExtensionClientProfiles, currentExtensionProfiles);
    expect(res).not.toBeNull();
  });

  /**
   * Test case to merge multiple extensions without any client profiles.
   */
  it('HldlMergeManager: Merge with multiple extensions but no client profiles.', () => {

    initFullExtensionB();
    currentExtensionClientProfiles.length = 0; // Clear client profiles
    const merger: HldlMergeManager = new HldlMergeManager(mockTrace as TraceService);
    const res: HfwInstance = merger.mergeProfiles(currentBaseProfile, currentExtensionClientProfiles, currentExtensionProfiles);
    expect(res).not.toBeNull();
  });

  /**
   * Test case to handle conflicting data in profiles during merging.
   */
  it('HldlMergeManager: Handle conflicting data in profiles.', () => {
    initFullExtension();
    initFullExtensionB();

    // Setup conflicting data in profiles
    hfwExt.snapInTypes.push({
      typeId: 'mockTypeId',
      resourceFolder: 'mockResourceFolder',
      config: {},
      messageTypes: []
    }); // Adding a valid mock snap-in type to simulate a conflict

    const merger: HldlMergeManager = new HldlMergeManager(mockTrace as TraceService);
    const res: HfwInstance = merger.mergeProfiles(currentBaseProfile, currentExtensionClientProfiles, currentExtensionProfiles);
    expect(res).not.toBeNull(); // Ensure the result is not null after merging

    // Add more specific assertions based on expected behavior
  });

});
