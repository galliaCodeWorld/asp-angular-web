// DataChannel General Purpose Data Type
export class DcJsonType {
	constructor() {
		this.remoteGuid = "";
		this.json = "";
		this.objectType = "any";
	}

	// the senders singlar connection guid
	remoteGuid: string;
	// data is a json string, which the receiver will convert to
	// the expected datatype
	json: string;
	// the expected model type name, case sensitive
	objectType: string;
}