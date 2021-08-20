import {
	HubConnection
} from './index';

export class PhoneLineConnectionType {
	constructor() {
		this.phoneLineConnectionId = 0;
		this.created = null;
		this.phoneLineId = 0;
		this.hubConnectionId = 0;
		this.isDeleted = false;
		this.hubConnection = null;
	}
	phoneLineConnectionId: number;
	created: Date;
	phoneLineId: number;
	hubConnectionId: number;
	isDeleted: boolean;
	hubConnection: HubConnection;
}