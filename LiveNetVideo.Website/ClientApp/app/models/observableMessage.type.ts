export class ObservableMessageType {
	constructor() {
		this.timestamp = Date.now();
		this.message = "";
	}
	timestamp: number;
	message: string;
}
