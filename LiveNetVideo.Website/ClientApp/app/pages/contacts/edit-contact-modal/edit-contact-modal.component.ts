import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { PhoneContactType } from '../../../models/index'
import {
	Validators,
	FormBuilder,
	FormGroup
} from '@angular/forms';

import {
	FormValidator,
	EmailValidator,
	ConfigService
} from '../../../services/index'

@Component({
	templateUrl: './edit-contact-modal.component.html',
	styleUrls: ['./edit-contact-modal.component.scss'],
	selector: 'edit-contact-modal'
})
export class EditContactModalComponent implements OnInit {
	@Output() close: EventEmitter<any> = new EventEmitter;
	@Input() contact: PhoneContactType;

	editContactForm: FormGroup;
	image: string = 'assets/images/default-avatar.png';
	constructor(formBuilder: FormBuilder,
		private configService: ConfigService) {
		this.editContactForm = formBuilder.group({
			name: ['', Validators.compose([FormValidator.isNameValid])],
			email: ['', Validators.compose([EmailValidator.isValidEmailFormat])]
		})
	}

	ngOnInit() {
		this.editContactForm.get('name').setValue(this.contact.name);
		this.editContactForm.get('email').setValue(this.contact.email);
		if (this.contact.avatarFileName)
			this.image = this.configService.contactAvatarBaseUrl + this.contact.avatarFileName + "?" + Date.now().toString();
	}

	closeClicked(data: any = null) {
		console.log(data)
		this.close.emit(data)
	}

	pictureChanged(img: string) {
		this.image = img;
	}

	save() {
		let contact: PhoneContactType = {
			name: this.editContactForm.get('name').value,
			email: this.editContactForm.get('email').value,
			avatarDataUri: this.image
		}

		this.closeClicked(contact)
	}
}