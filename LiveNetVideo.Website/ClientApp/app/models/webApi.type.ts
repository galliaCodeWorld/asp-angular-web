export class WebApiType {
	constructor() {
		this.webApiId = 0;
		this.created = null;
		this.name = "";
		this.base64Secret = "";
	}
	webApiId: number;
	created: Date;
	name: string;
	clientId: string;
	base64Secret: string;
}