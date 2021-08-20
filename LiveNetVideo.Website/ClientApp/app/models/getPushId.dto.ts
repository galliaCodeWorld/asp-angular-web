export class GetPushIdDto {
	constructor() {
		this.email = "";
		this.serviceProviderName = "";
		this.applicationName = "";
	}
	email: string;
	serviceProviderName: string;
	applicationName: string;
}