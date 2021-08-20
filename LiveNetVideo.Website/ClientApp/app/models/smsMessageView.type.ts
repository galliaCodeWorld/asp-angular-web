export class SmsMessageViewType {
	constructor() {
		this.from = "";
		this.email = "";
		this.position = "";
		this.content = "";
		this.positionRight = true;
	}
	from: string;
	email: string;
	position?: string; //left or right
	content: string;
	positionRight: boolean;
}