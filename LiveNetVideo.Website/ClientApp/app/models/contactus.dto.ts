export class ContactUsDto {
	constructor() {
		this.contactUsId = 0;
		this.created = null;
		this.domain = "";
		this.name = "";
		this.email = "";
		this.phone = "";
		this.subject = "";
		this.message = "";
		this.isResolved = false;
		this.notes = "";
	}
	contactUsId: number;
	created: Date;
	domain: string;
	name: string;
	email: string;
	phone: string;
	subject: string;
	message: string;
	isResolved: boolean;
	notes: string;
}