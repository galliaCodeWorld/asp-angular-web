import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators
} from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GuestLoginType, MaterialAlertMessageType } from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'guest-login-form',
	templateUrl: 'guest-login-form.component.html'
})
export class GuestLoginFormComponent {
	constructor(
		private fb: FormBuilder,
		private dialog: MatDialog,
		private service: Service,
	) {
		this.createForm();
	}

	@Input('showProgress') showProgress: boolean;
	@Output() onGuestLoginSuccess: EventEmitter<void> = new EventEmitter<void>();

	ngOnInit() {
		this.model = new GuestLoginType();
	}

	loginForm: FormGroup;

	model: GuestLoginType;

	createForm() {
		this.loginForm = this.fb.group({
			email: new FormControl('',
				[
					Validators.email,
					Validators.required,
					Validators.maxLength(300)
				]
			),
			name: new FormControl('',
				[
					Validators.required,
					Validators.maxLength(50)
				]
			)
		})
	}

	async login(): Promise<void> {
		if (this.loginForm.valid) {
			this.model.email = this.service.sanitizeEmail(this.loginForm.get('email').value);
			this.model.name = this.loginForm.get('name').value;

			try {
				await this.service.guestLogin(this.model);
			}
			catch (e) {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e;
				this.service.openAlert(alert);
			}

			if (this.service.isLoggedIn) {
				this.onGuestLoginSuccess.emit();
			}
			else {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = "Sorry, the login attempt failed."
				this.service.openAlert(alert);
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