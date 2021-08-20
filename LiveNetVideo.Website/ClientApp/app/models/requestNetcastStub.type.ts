export class RequestNetcastStubType {
	constructor() {
		this.requesterGuid = "";
	}

	public static readonly objectName: string = 'RequestNetcastStubType';

	requesterGuid: string; // the original netcast requesters guid
}