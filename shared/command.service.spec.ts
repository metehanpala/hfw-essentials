import { inject, TestBed, waitForAsync } from '@angular/core/testing';

import { CommandService } from './command.service';

// //////  Tests  /////////////
describe('CommandService', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [CommandService]
    })
      .compileComponents();
  }));

  it('should create CommandService',
    inject([CommandService], (commandService: CommandService) => {
      expect(commandService instanceof CommandService).toBe(true);
    }));

});
