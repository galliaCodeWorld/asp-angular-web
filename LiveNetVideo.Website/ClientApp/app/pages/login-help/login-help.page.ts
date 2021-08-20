import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import {
	Validators,
	FormBuilder,
	FormGroup,
	FormControl,
} from '@angular/forms';

import { MaterialAlertMessageType } from '../../models/index';

import {
	Service
} from '../../services/index'

@Component({
	templateUrl: 'login-help.page.html',
	styleUrls: ['./login-help.page.scss']
})
export class LoginHelpPage {
	fgEmail: FormGroup;
	fgAltEmail: FormGroup;
	fgPhone: FormGroup;

	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		private fb: FormBuilder,
		private service: Service
	) {
		this.createForms();
	}

	showEmailProgress: boolean;
	showAltEmailProgress: boolean;
	showPhoneProgress: boolean;

	ngOnInit() {
		this.showEmailProgress = false;
		this.showAltEmailProgress = false;
		this.showPhoneProgress = false;
	}

	createForms() {
		this.fgEmail = this.fb.group({
			email: new FormControl('',
				[
					Validators.email,
					Validators.required,
					Validators.maxLength(300)
				]
			)
		});
		this.fgAltEmail = this.fb.group({
			email: new FormControl('',
				[
					Validators.email,
					Validators.required,
					Validators.maxLength(300)
				]
			)
		});

		this.fgPhone = this.fb.group({
			phone: new FormControl('',
				[
					Validators.required,
					Validators.maxLength(15)
				]
			)
		});
	}

	async onPasswordResetWithEmail(): Promise<void> {
		let email: string = this.service.sanitizeEmail(this.fgEmail.get('email').value);

		let accessToken: string = await this.service.getAccessToken();

		this.showEmailProgress = true;
		try {
			await this.service.sendPasswordResetRequest(email, accessToken);
			let alert = new MaterialAlertMessageType();
			alert.title = "SUCCESS";
			alert.message = "An email has been send to " + email + ". Please check this email account for the password reset email to finish resetting your password.";
			this.service.openAlert(alert);
		}
		catch (e) {
			console.log("password Reset request failed error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "FAILED";
			alert.message = "Sorry, we were unable to complete your request to reset your password. Please try again later.";
			this.service.openAlert(alert);
		}

		this.showEmailProgress = false;
	}

	cancel(): void {
		this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
	}

	onPasswordResetWithAltEmail(): void {
		// TODO: reset password with alternative email on file
	}

	onPasswordResetWithPhoneNumber(): void {
		// TODO: reset password with phone number on file
	}
}