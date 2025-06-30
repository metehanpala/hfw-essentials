import { GmsSubscription, ObjectAttributes, PropertyInfo, ValueDetails } from '@gms-flex/services';
import { Subscription } from 'rxjs';

export interface SubscriptionData {
    objectId: string;
    valueSubscription: GmsSubscription<ValueDetails>;
    subscription: Subscription;
}

/**
 * Refer Defect 967987
 * For function based designation syntax like,
 * Example : "w310.LogicalView:LogicalView.TRA116.B_1.Flr_1.R_Fcu1.[l].@Fcu01[0];@FanSpdVal"
 * ObjectFunctionAttribute - WSI response has this additional attribute in PropertyInfo
 * Only to satisfy graphics need to retrieve correct object model name.
 */
export interface PropertyInfoFunction<T> extends PropertyInfo<T>
{
    ObjectFunctionAttribute: ObjectAttributes;
}
