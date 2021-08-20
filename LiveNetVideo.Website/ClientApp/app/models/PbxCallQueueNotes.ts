export class PbxCallQueueNotes {
	// NOTE: this model should be used with PbxCallQueueDto.Notes
	// it should serialized as a json string and stored in Notes field when updating the PbxCallQueue
	constructor() {
		this.name = "";
		//this.email = "";
		this.subject = "";
		this.message = "";
	}
	name: string;
	//email: string;
	subject: string;
	message: string;
}