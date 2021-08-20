export class UnsubscribePushNotificationDto {
	constructor() {
		this.email = "";
		this.token = "";
		this.serviceProviderName = "";
		this.applicationName = "";
	}
	email: string;
	token: string;
	serviceProviderName: string;
	applicationName: string;
}