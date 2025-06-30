import { BrowserObject, ObjectAttributes } from '@gms-flex/services';

export class TileObject implements BrowserObject {
    public Attributes: ObjectAttributes;
    public Descriptor: string;
    public Designation: string;
    public HasChild: boolean;
    public Name: string;
    public Location: string;
    public ObjectId: string;
    public SystemId: number;
    public ViewId: number;
    public ViewType: number;
    constructor(public iconClass: string, public browserObject: BrowserObject) {
      this.Attributes = browserObject.Attributes;
      this.Descriptor = browserObject.Descriptor;
      this.Designation = browserObject.Designation;
      this.HasChild = browserObject.HasChild;
      this.Name = browserObject.Name;
      this.Location = browserObject.Location;
      this.ObjectId = browserObject.ObjectId;
      this.SystemId = browserObject.SystemId;
      this.ViewId = browserObject.ViewId;
      this.ViewType = browserObject.ViewType;
      this.iconClass = 'element-image-filled';
  }
}
