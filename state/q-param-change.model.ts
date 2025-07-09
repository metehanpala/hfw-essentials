import { FullQParamId } from '../../common/fullsnapinid/full-qparam-id.model';

export interface QParamChange {
  qParamFullId: FullQParamId | undefined;
  value: string | null;
}
