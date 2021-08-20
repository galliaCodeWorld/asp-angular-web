import { Component, Input, Output, EventEmitter, Inject, Optional } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,
	AbstractControl
} from '@angular/forms';

import {
	PhoneContactType,
	MaterialAlertMessageType,
} from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'form-edit-contact',
	templateUrl: 'form-edit-contact.component.html'
})
export class FormEditContactComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		this.showProgress = false;
	}

	@Input('showProgress') showProgress: boolean;
	@Input('contact') inputContact: PhoneContactType;
	@Output() onEditContactComplete: EventEmitter<PhoneContactType> = new EventEmitter<PhoneContactType>();

	ngOnInit() {
		this.contact = this.inputContact;

		if (this.service.isEmpty(this.data) === false && this.data.hasOwnProperty('phoneContactId')) {
			this.contact = this.data;
		}

		this.createForm();
	}

	_contact: PhoneContactType;
	get contact(): PhoneContactType {
		return this._contact;
	}
	set contact(value: PhoneContactType) {
		this._contact = value;
		if (this.service.isEmpty(value) === false) {
			this.image = this.service.isEmpty(value.avatarFileName) ? this.service.defaultAvatar
				: this.service.contactAvatarBaseUrl + value.avatarFileName + "?" + Date.now().toString();
		}
	}
	defaultAvatar = this.service.defaultAvatar;

	image: string = this.defaultAvatar;

	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			name: new FormControl(this.contact.name, [
				Validators.maxLength(100),
				Validators.required

			]),

			email: new FormControl(this.contact.email,
				[
					Validators.email,
					Validators.required,
					Validators.maxLength(300)
				]
			),
			avatarDataUri: new FormControl(this.image)
		})
	}

	onImageSelected(imageDataUri: string): void {
		//console.log("form-add-contact.component.ts onImageSelected: imageDateUri: ", imageDataUri);
		this.image = imageDataUri;
		this.contact.avatarDataUri = imageDataUri;
	}

	removeAvatar(): void {
		this.image = this.defaultAvatar;
		this.contact.avatarDataUri = "";
	}

	async submit(): Promise<void> {
		if (this.formGroup.valid) {
			try {
				this.showProgress = true;
				this.contact.email = this.service.sanitizeEmail(this.formGroup.get('email').value);
				this.contact.name = this.formGroup.get('name').value;
				//this.contact.avatarDataUri = this.image != this.defaultAvatar ? this.image : "";

				try {
					let accessToken = await this.service.getAccessToken();
					let updatedPhoneContact: PhoneContactType = await this.service.updateContact(this.contact, accessToken);
					this.contact = updatedPhoneContact;
					this.onEditContactComplete.emit(updatedPhoneContact);
				}
				catch (e) {
					let alert = new MaterialAlertMessageType();
					alert.title = "Error";
					alert.message = e.toString();
					this.service.openAlert(alert);
				}
				finally {
					this.showProgress = false;
				}
			}
			catch (e) {
				console.log("submit error: ", e);
				throw (e);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}
}