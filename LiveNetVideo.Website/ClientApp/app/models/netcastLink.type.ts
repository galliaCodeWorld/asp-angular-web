export class NetcastLinkType {
	constructor() {
		this.name = "NetcastLinkType";
		this.parentGuid = "{}";
		this.selfGuid = "{}";
		this.childrenGuids = new Array<string>();
	}
	name: string;
	parentGuid: string;
	selfGuid: string;
	childrenGuids: string[];
}