import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
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
	CompanyProfileDto,
	MaterialAlertMessageType,
} from "../../models/index";
import { Service } from "../../services/index";
import { optionalEmail } from "../../validators/optionalEmail.validator";
@Component({
	selector: 'form-create-company',
	templateUrl: 'form-create-company.component.html'
})
export class FormCreateCompanyComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder
	) {
		this.createForm();
		this.showProgress = false;
	}

	@Input('showProgress') showProgress: boolean;
	@Output() onCreateCompany: EventEmitter<CompanyProfileDto> = new EventEmitter<CompanyProfileDto>();
	@Output() onAddCompanyLogo: EventEmitter<string> = new EventEmitter<string>();

	ngOnInit() {
		this.model = new CompanyProfileDto();
	}

	defaultAvatar = this.service.defaultAvatar;

	image: string = this.defaultAvatar;

	model: CompanyProfileDto;
	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			companyName: new FormControl('', [
				Validators.maxLength(300),
				Validators.required

			]),
			description: new FormControl(''),
			contactEmail: new FormControl('',
				[
					optionalEmail,
					Validators.maxLength(300)
				]
			)
		})
	}

	onImageSelected(imageDataUri: string): void {
		//console.log("form-add-contact.component.ts onImageSelected: imageDateUri: ", imageDataUri);
		this.image = imageDataUri;
		if (this.image != this.defaultAvatar) {
			this.onAddCompanyLogo.emit(this.image);
		}
	}

	removeAvatar(): void {
		this.image = this.defaultAvatar;
	}

	submit() {
		if (this.formGroup.valid) {
			this.model.contactEmail = this.service.sanitizeEmail(this.formGroup.get('contactEmail').value);
			this.model.companyName = this.formGroup.get('companyName').value;
			this.model.description = this.formGroup.get('description').value;
			this.onCreateCompany.emit(this.model);
			if (this.image != this.defaultAvatar) {
				this.onAddCompanyLogo.emit(this.image);
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