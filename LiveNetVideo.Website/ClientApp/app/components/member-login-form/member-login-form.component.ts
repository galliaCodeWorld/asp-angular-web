import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MemberLoginType, MaterialAlertMessageType, IdDto, CompanyProfileDto } from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'member-login-form',
	templateUrl: 'member-login-form.component.html'
})
export class MemberLoginFormComponent {
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		private fb: FormBuilder,
		private service: Service
	) {
		this.createForm();
	}

	@Input('showProgress') showProgress: boolean;
	@Output() onMemberLoginSuccess: EventEmitter<void> = new EventEmitter<void>();
	@Output() onMemberLoginCancel: EventEmitter<void> = new EventEmitter<void>();

	ngOnInit() {
	}

	loginForm: FormGroup;

	createForm() {
		this.loginForm = this.fb.group({
			email: new FormControl('',
				[
					Validators.email,
					Validators.required,
					Validators.maxLength(30)
				]
			),
			password: new FormControl('',
				[
					Validators.required
				]
			),
			rememberMe: new FormControl(true)
		})
	}

	async login(): Promise<void> {
		if (this.loginForm.valid) {
			if (this.service.isSignalrConnected() === false) {
				await this.service.startConnection();
			}

			this.showProgress = true;
			let email: string = this.service.sanitizeEmail(this.loginForm.get('email').value);
			let password: string = this.loginForm.get('password').value;
			let remember: boolean = this.loginForm.get('rememberMe').value;

			try {
				await this.service.memberLogIn(email, password, remember);
				console.log("login success emitting event onMemberLoginSuccess.emit()");
				this.onMemberLoginSuccess.emit();
			}
			catch (e) {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error: Please Check";
				alert.message = e;
				setTimeout(() => { this.service.openAlert(alert) });
			}
			finally {
				console.log("login compelete at finally");
				this.showProgress = false;
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	cancel(): void {
		this.onMemberLoginCancel.emit();
	}
}