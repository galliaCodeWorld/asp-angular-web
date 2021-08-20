import { Component, Inject, Optional } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { SignalrService, PbxService, JsHelperService, FormValidator, EmailValidator } from '../../services/index';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
	styleUrls: ['./invite-employee.component.scss'],
	templateUrl: './invite-employee.component.html'
})
export class InviteEmployeeComponent {
	companyId: any;
	employeeInviteForm: FormGroup;

	constructor(
		private dialogRef: MatDialogRef<InviteEmployeeComponent>,
		private pbxService: PbxService,
		private jsHelperService: JsHelperService,
		private signalrService: SignalrService,
		private formBuilder: FormBuilder,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		this.companyId = data.id;
		this.employeeInviteForm = this.formBuilder.group({
			firstName: ['', Validators.compose([Validators.required, Validators.maxLength(50)])],
			lastName: ['', Validators.compose([Validators.required, Validators.maxLength(50)])],
			email: ['', Validators.compose([EmailValidator.isValidEmailFormat, Validators.maxLength(300)])]
		})

		this.employeeInviteForm.valueChanges.subscribe(value => {
			//     console.log(this.employeeInviteForm.controls.email.errors, this.employeeInviteForm.controls.email.value)
		})
	}

	cancel() {
		this.dialogRef.close();
	}

	inviteEmployee() {
		let jwt = this.signalrService.jwtToken;
		if (!this.jsHelperService.isEmpty(jwt)) {
			this.pbxService.createCompanyEmployeeInvite({
				companyProfileId: this.companyId,
				firstName: this.employeeInviteForm.get('firstName').value,
				lastName: this.employeeInviteForm.get('lastName').value,
				email: this.employeeInviteForm.get('email').value
			}, jwt.access_token)
				.then((data) => {
					console.log(data)
					this.dialogRef.close();
				})
				.catch(error => {
					console.log(error); this.dialogRef.close()
				})
		}
	}
}