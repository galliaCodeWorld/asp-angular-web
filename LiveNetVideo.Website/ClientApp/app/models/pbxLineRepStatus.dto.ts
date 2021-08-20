import { PbxLineRepDto } from "./index";

export class PbxLineRepStatusDto {
	constructor() {
		this.pbxLineRepStatusId = 0;
		this.created = null;
		this.pbxLineRepId = 0;
		this.connectionGuid = "";
		this.pbxLineRep = null;
	}
	pbxLineRepStatusId: number;
	created: Date;
	pbxLineRepId: number; //required
	connectionGuid: string; // required, max 300
	pbxLineRep: PbxLineRepDto;
}