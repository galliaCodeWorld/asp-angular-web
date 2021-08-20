import { Contact } from './index';

export class BlockedContact {
	isMemberContact: boolean;

	//if not a member contact it should have email data filled otherwise contact field
	email: string;

	contact: Contact;

	blockedID: number;

	constructor(user: string | Contact) {
		if (typeof (user) == "string") {
			this.isMemberContact = false;
			this.email = user as string;
		}
		else {
			this.isMemberContact = true;
			this.contact = user as Contact;
		}
	}
}
