import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
	CompanyPhotoDto,
	MaterialAlertMessageType,
} from "../../models/index";

import { Service } from "../../services/index";

@Component({
	selector: 'form-company-photo-add',
	templateUrl: 'form-company-photo-add.component.html'
})

export class FormCompanyPhotoAddComponent {
	constructor(
		private service: Service,
	) {
		//this.createForm();
		this.showProgress = false;
	}

	@Input('showProgress') showProgress: boolean;
	@Output() onAddPhoto: EventEmitter<string> = new EventEmitter<string>();

	ngOnInit() {
	}

	defaultAvatar: string = this.service.defaultAvatar;

	image: string = this.defaultAvatar;

	onImageSelected(imageDataUri: string): void {
		this.image = imageDataUri;
	}

	save(): void {
		if (this.image !== this.defaultAvatar) {
			this.onAddPhoto.emit(this.image);
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "ERROR";
			alert.message = "Please select a photo or take a picture. The default image can not be used as a photo."
			this.service.openAlert(alert);
		}
	}
}