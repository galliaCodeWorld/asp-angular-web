export class HubConnection {
	constructor() {
		this.hubConnectionid = 0;
		this.email = "";
		this.connectionGuid = "";
		this.createdDate = null;
		this.isConnected = false;
		this.ip = "";
		this.headerInfo = "";
		this.isDeleted = false;
		this.name = "";
	}
	hubConnectionid: number;
	email: string;
	//connectionId: string;
	connectionGuid: string;
	createdDate: Date;
	isConnected: boolean;
	ip: string;
	headerInfo: string;
	isDeleted: boolean;
	name: string;
}