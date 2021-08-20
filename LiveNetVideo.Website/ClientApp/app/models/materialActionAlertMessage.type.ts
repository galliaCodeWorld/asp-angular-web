export class MaterialActionAlertMessageType {
	constructor() {
		this.doAction = false;
		this.yesButton = "Yes";
		this.noButton = "No";
		this.title = "Confirmation Required";
		this.message = "Please confirm you wish to perform the action.";
	}
	title: string;
	message: string;
	yesButton: string;
	noButton: string;
	doAction: boolean;
}