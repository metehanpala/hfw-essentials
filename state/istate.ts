import { IPreselectionService } from '../../common/interfaces/ipreselection.service';
import { IQParamService } from '../../common/interfaces/iqparam.service';
import { IStorageService } from '../../common/interfaces/istorage.service';
import { QParamChange } from './q-param-change.model';
export abstract class IState {

  public abstract onNewSelectionQParamDetected(change: QParamChange): void;

  public abstract getIPreselectionService(typeId: string): IPreselectionService;

  public abstract getIStorageService(typeId: string): IStorageService;

  public abstract getIQParamService(typeId: string): IQParamService;
}
