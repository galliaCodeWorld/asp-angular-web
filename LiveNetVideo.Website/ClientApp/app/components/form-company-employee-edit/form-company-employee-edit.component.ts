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
	MaterialActionAlertMessageType,
	MaterialAlertMessageType,
	CompanyEmployeeDto,
} from "../../models/index";

import { Service } from "../../services/index";

@Component({
	selector: 'form-company-employee-edit',
	templateUrl: 'form-company-employee-edit.component.html'
})

export class FormCompanyEmployeeEditComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		this.showProgress = false;
	}

	@Input('showProgress') showProgress: boolean;
	@Input('companyEmployee') companyEmployee: CompanyEmployeeDto;
	@Output() onEditCompanyEmployee: EventEmitter<CompanyEmployeeDto> = new EventEmitter<CompanyEmployeeDto>();
	@Output() onUpdateCompanyEmployeeImage: EventEmitter<string> = new EventEmitter<string>();

	ngOnInit() {
		this.model = new CompanyEmployeeDto();

		if (this.service.isEmpty(this.data) === false && this.data.hasOwnProperty('companyEmployeeId')) {
			this.companyEmployee = this.data;
		}

		if (this.service.isEmpty(this.companyEmployee) === false) {
			this.model.companyEmployeeId = this.companyEmployee.companyEmployeeId;
			this.model.title = this.companyEmployee.title;
			this.model.isSuspended = this.companyEmployee.isSuspended;
			this.model.memberId = this.companyEmployee.memberId;
			this.model.createdDate = this.companyEmployee.createdDate;
			this.model.companyProfileId = this.companyEmployee.companyProfileId;

			this.originalImage = this.service.isEmpty(this.companyEmployee.avatarFilename) ? "" :
				this.service.pbxContentUrl + this.companyEmployee.companyProfileId.toString() + "/" + this.service.employeeImageFolder + "/" +
				this.companyEmployee.avatarFilename + "?" + Date.now().toString();
			this.image = this.service.isEmpty(this.companyEmployee.avatarFilename) ? this.service.defaultAvatar : this.originalImage;

			this.name = this.service.isEmpty(this.companyEmployee.member) ? "" : this.companyEmployee.member.firstName + " " + this.companyEmployee.member.lastName;
			this.email = this.service.isEmpty(this.companyEmployee.member) ? "" : this.companyEmployee.member.email;
		}

		this.createForm();
	}

	defaultAvatar: string = this.service.defaultAvatar;

	image: string = this.defaultAvatar;
	name: string;
	email: string;

	originalImage: string = "";

	model: CompanyEmployeeDto;
	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			title: new FormControl(this.model.title, [
				Validators.maxLength(300),
				Validators.required

			]),
			isSuspended: new FormControl(this.model.isSuspended, [
				Validators.required

			]),
		})
	}

	onImageSelected(imageDataUri: string): void {
		this.image = imageDataUri;
	}

	removeImage(): void {
		this.image = this.defaultAvatar;
	}

	submit(): void {
		if (this.formGroup.valid) {
			if (this.image !== this.originalImage) {
				this.onUpdateCompanyEmployeeImage.emit(this.image);
			}
			this.model.title = this.formGroup.get('title').value;
			this.model.isSuspended = this.formGroup.get('isSuspended').value;
			this.onEditCompanyEmployee.emit(this.model);
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}
}