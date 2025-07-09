import * as hldl from '../shared/hldl/hldl-data.model';
import { HLDL_TEST_EXAMPLE } from '../shared/hldl/hldl-example-data.model';
import { UserFramePreferences, UserSettingsHandler } from './user-settings.handler';

describe('UnsavedDataHandler', () => {
  let userSettingsHandler: UserSettingsHandler;
  const hfwInstance: hldl.HfwInstance = JSON.parse(JSON.stringify(HLDL_TEST_EXAMPLE.hfwInstance));

  const stateServiceStub: any = {
  };

  const traceServiceStub: any = {
    debug: (source: string, message?: string, ...optionalParams: any[]) => {},
    info: (source: string, message?: string, ...optionalParams: any[]) => {}
  };

  const settingsServiceStub: any = {
    getSettings: () => {},
    putSettings: () => {},
    deleteSettings: () => {}
  };

  it('should retrieve user settings', () => {
    userSettingsHandler = new UserSettingsHandler(settingsServiceStub, traceServiceStub);
    expect(userSettingsHandler).not.toBeNull();
    // userSettingsHandler.retrieveUserSettings(hfwInstance as hldl.HfwInstance).subscribe((res: UserFramePreferences) => {
    //     expect(res).toBeTruthy();
    // }).unsubscribe();
  });
});
