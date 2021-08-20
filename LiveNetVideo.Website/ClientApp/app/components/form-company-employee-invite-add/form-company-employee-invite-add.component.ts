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
	MaterialActionAlertMessageType,
	MaterialAlertMessageType,
	CompanyEmployeeInviteDto,
} from "../../models/index";

import { Service } from "../../services/index";

@Component({
	selector: 'form-company-employee-invite-add',
	templateUrl: 'form-company-employee-invite-add.component.html'
})

export class FormCompanyEmployeeInviteAddComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder,
	) {
		this.createForm();
		this.showProgress = false;
	}

	@Input('showProgress') showProgress: boolean;
	@Output() onAdd: EventEmitter<CompanyEmployeeInviteDto> = new EventEmitter<CompanyEmployeeInviteDto>();
	@Output() onCancel: EventEmitter<void> = new EventEmitter<void>();

	ngOnInit() {
		this.model = new CompanyEmployeeInviteDto();
	}

	model: CompanyEmployeeInviteDto;
	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			email: new FormControl('', [
				Validators.email,
				Validators.maxLength(300),
				Validators.required

			]),
			firstName: new FormControl('', [
				Validators.maxLength(50),
				Validators.required

			]),
			lastName: new FormControl('', [
				Validators.maxLength(50),
				Validators.required

			]),
		})
	}

	submit() {
		if (this.formGroup.valid) {
			// TODO: check to make sure the email isn't already an employee and make sure the email isn't already an invite
			this.model.email = this.service.sanitizeEmail(this.formGroup.get('email').value);
			this.model.firstName = this.formGroup.get('firstName').value;
			this.model.lastName = this.formGroup.get('lastName').value;

			this.onAdd.emit(this.model);
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	cancel(): void {
		this.onCancel.emit();
	}
}