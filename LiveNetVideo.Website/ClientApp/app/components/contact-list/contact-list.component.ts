import { Component, Input, Output, EventEmitter, Inject, Optional } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
	PhoneContactType, GenericUserType
} from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'contact-list',
	templateUrl: 'contact-list.component.html'
})
export class ContactListComponent {
	constructor(
		private service: Service,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) { }

	@Input('contacts') inputContacts: Array<PhoneContactType>;

	@Input('currentUsers') currentUsers: Array<PhoneContactType>;

	_contacts: Array<PhoneContactType>;
	get contacts(): Array<PhoneContactType> {
		return this._contacts;
	}
	set contacts(value: Array<PhoneContactType>) {
		this._contacts = value;
	}

	ngOnInit() {
		this.contacts = this.inputContacts;

		if (this.service.isEmpty(this.data) === false && this.service.isEmpty(this.data.contacts) === false) {
			this.contacts = this.data.contacts;
		}

		if (this.service.isEmpty(this.data) === false && this.service.isEmpty(this.data.currentUsers) === false) {
			this.currentUsers = this.data.currentUsers;
		}

		if (this.service.isEmpty(this.currentUsers) === false) {
			this.contacts.forEach((c: PhoneContactType) => {
				let index: number = this.currentUsers.findIndex((u: GenericUserType) => {
					return u.email.toLowerCase() == c.email.toLowerCase();
				});
				c.canCall = index < 0 && c.isMember ? true : false;
			});
		}

		//console.log("this.contacts: ", this.contacts);
		//console.log("this.currentUsers: ", this.currentUsers);
	}

	onContactDeleted(contact: PhoneContactType): void {
		//console.log("contact deleted: ", contact);
		this.contacts = this.service.contacts;
		//console.log('updated contacts list: ', this.contacts);
	}
}