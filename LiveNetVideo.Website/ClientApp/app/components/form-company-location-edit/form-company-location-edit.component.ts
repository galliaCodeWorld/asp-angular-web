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
	CompanyLocationDto,
	MaterialAlertMessageType,
} from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'form-company-location-edit',
	templateUrl: 'form-company-location-edit.component.html'
})
export class FormCompanyLocationEditComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		this.showProgress = false;
	}

	@Input('showProgress') showProgress: boolean;
	@Input('companyLocation') companyLocation: CompanyLocationDto;
	@Output() onEditCompanyLocation: EventEmitter<CompanyLocationDto> = new EventEmitter<CompanyLocationDto>();
	@Output() onUpdateCompanyLocationImage: EventEmitter<string> = new EventEmitter<string>();

	ngOnInit() {
		this.model = new CompanyLocationDto();

		if (this.service.isEmpty(this.data) === false && this.data.hasOwnProperty('companyLocationId')) {
			this.companyLocation = this.data;
		}

		if (this.service.isEmpty(this.companyLocation) === false) {
			this.model.companyLocationId = this.companyLocation.companyLocationId;
			this.model.address = this.companyLocation.address;
			this.model.city = this.companyLocation.city;
			this.model.region = this.companyLocation.region;
			this.model.countryIsoCode = this.companyLocation.countryIsoCode;

			this.originalImage = this.service.isEmpty(this.companyLocation.locationPhotoFilename) ? "" :
				this.service.pbxContentUrl + this.companyLocation.companyProfileId.toString() + "/" + this.service.companyLocationImageFolder + "/" +
				this.companyLocation.locationPhotoFilename + "?" + Date.now().toString();
			this.image = this.service.isEmpty(this.companyLocation.locationPhotoFilename) ? this.service.defaultAvatar : this.originalImage;
		}

		this.createForm();
	}

	defaultAvatar: string = this.service.defaultAvatar;

	image: string = this.defaultAvatar;

	originalImage: string = "";

	model: CompanyLocationDto;
	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			address: new FormControl(this.model.address, [
				Validators.maxLength(300),
				Validators.required

			]),
			city: new FormControl(this.model.city, [
				Validators.maxLength(300),
				Validators.required

			]),

			region: new FormControl(this.model.region, [
				Validators.maxLength(300),
				Validators.required

			]),

			countryIsoCode: new FormControl(this.model.countryIsoCode, [
				Validators.maxLength(2),
				Validators.required

			])
		})
	}

	onImageSelected(imageDataUri: string): void {
		//console.log("form-add-contact.component.ts onImageSelected: imageDateUri: ", imageDataUri);

		this.image = imageDataUri;
		//this.onUpdateCompanyLocationImage.emit(this.image);
	}

	removeImage(): void {
		this.image = this.defaultAvatar;
	}

	submit(): void {
		if (this.formGroup.valid) {
			if (this.image !== this.originalImage) {
				this.onUpdateCompanyLocationImage.emit(this.image);
			}

			this.model.address = this.formGroup.get('address').value;
			this.model.city = this.formGroup.get('city').value;
			this.model.region = this.formGroup.get('region').value;
			this.model.countryIsoCode = this.formGroup.get('countryIsoCode').value;
			this.onEditCompanyLocation.emit(this.model);
			//if (this.image != this.defaultAvatar && this.image != this.originalImage) {
			//	setTimeout(() => { this.onUpdateCompanyLocationImage.emit(this.image); }, 250);
			//}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}
}