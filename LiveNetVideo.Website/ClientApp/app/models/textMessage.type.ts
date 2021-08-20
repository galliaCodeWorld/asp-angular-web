export class TextMessageType {
	constructor() {
		this.imgSrc = "";
		this.name = "";
		this.email = "";
		this.message = "";
		this.isPrivate = false;
		this.isIncoming = true;
		this.id = "";
	}
	imgSrc: string;
	name: string;
	email: string;
	message: string;
	isPrivate: boolean; // else its a group message
	isIncoming: boolean; // else is and outgoing message
	id: string;
}