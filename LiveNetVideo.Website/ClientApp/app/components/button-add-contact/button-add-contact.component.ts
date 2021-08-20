import { Component, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material';
import {
	Service
} from '../../services/index'
import {
	PhoneContactType,
	MaterialAlertMessageType
} from '../../models/index'
import { FormAddContactComponent } from "../index";
@Component({
	selector: 'button-add-contact',
	templateUrl: 'button-add-contact.component.html'
})
export class ButtonAddContactComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
	) {
	}

	@Output() onContactAdded: EventEmitter<PhoneContactType> = new EventEmitter<PhoneContactType>();

	ngOnInit() {
	}

	openAddContactModal(): void {
		let dialogRef = this.matDialog.open(FormAddContactComponent, {
			width: '80%',
			height: '80%'
		});

		//dialogRef.componentInstance.showProgress = this.showProgress;

		dialogRef.componentInstance.onAddContact.subscribe((phoneContact: PhoneContactType) => {
			//console.log("form-add-contact.component.ts submitted phoneContact: ", phoneContact);
			dialogRef.componentInstance.showProgress = true;
			this.addContact(phoneContact)
				.then((phoneContact: PhoneContactType) => {
					this.onContactAdded.emit(phoneContact);

					dialogRef.close();
				})
				.catch((error) => {
					console.log("error: ", error);
					let alert = new MaterialAlertMessageType();
					alert.title = "ERROR";
					alert.message = error;
					this.service.openAlert(alert);
				})
				.then(() => {
					dialogRef.componentInstance.showProgress = false;
				});
		});

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onAddContact.unsubscribe();
		});
	}

	async addContact(phoneContact: PhoneContactType): Promise<PhoneContactType> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let pc: PhoneContactType = await this.service.addContact(phoneContact, accessToken);
			return pc;
		}
		catch (e) {
			throw (e);
		}
	}
}