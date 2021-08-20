import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators
} from '@angular/forms';

import {
	MemberLoginType,
	MaterialAlertMessageType,
	RegisterDto,
} from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'register-form',
	templateUrl: 'register-form.component.html'
})
export class RegisterFormComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder
	) {
		this.createForm();
	}

	@Input('showProgress') showProgress: boolean;
	@Output() onRegister: EventEmitter<RegisterDto> = new EventEmitter<RegisterDto>();

	ngOnInit() {
		this.model = new RegisterDto();
	}

	public base64Image: string;

	model: RegisterDto;
	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			firstName: new FormControl('', [
				Validators.maxLength(50),
				Validators.required

			]),
			lastName: new FormControl('', [
				Validators.maxLength(50),
				Validators.required

			]),
			email: new FormControl('',
				[
					Validators.email,
					Validators.required,
					Validators.maxLength(300)
				]
			),
			password: new FormControl('',
				[
					Validators.required,
					Validators.maxLength(100)
				]
			),
			avatarDataUri: new FormControl('')
		})
	}

	submit() {
		if (this.formGroup.valid) {
			this.model.email = this.service.sanitizeEmail(this.formGroup.get('email').value);
			this.model.password = this.formGroup.get('password').value;
			this.model.firstName = this.formGroup.get('firstName').value;
			this.model.lastName = this.formGroup.get('lastName').value;
			this.model.avatarDataUri = this.formGroup.get('avatarDataUri').value;
			this.model.username = this.model.email;
			this.onRegister.emit(this.model);
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}
}