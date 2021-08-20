import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators
} from '@angular/forms';

import {
	MaterialAlertMessageType,
	ContactUsDto,
} from "../../models/index";
import { Service, ConfigService } from "../../services/index";
@Component({
	selector: 'contactus-form',
	templateUrl: 'contactus-form.component.html'
})
export class ContactUsFormComponent {
	constructor(
		private service: Service,
		private configService: ConfigService,
		private fb: FormBuilder
	) {
	}

	@Input('showProgress') showProgress: boolean;
	@Output() onContactUsComplete: EventEmitter<ContactUsDto> = new EventEmitter<ContactUsDto>();
	@Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
	ngOnInit() {
		this.createForm();
		//this.model = new ContactUsDto();
	}

	//model: ContactUsDto;
	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			name: new FormControl('', [
				Validators.maxLength(200),
				Validators.required

			]),
			phone: new FormControl('', [
				Validators.maxLength(15)
			]),
			email: new FormControl('',
				[
					Validators.email,
					Validators.required,
					Validators.maxLength(300)
				]
			),
			subject: new FormControl('', [
				Validators.maxLength(200),
				Validators.required

			]),
			message: new FormControl('', [
				Validators.maxLength(4000),
				Validators.required
			]),
		})
	}

	async submit(): Promise<void> {
		try {
			if (this.formGroup.valid) {
				this.showProgress = true;
				let model: ContactUsDto = new ContactUsDto();
				model.email = this.service.sanitizeEmail(this.formGroup.get('email').value);
				model.name = this.formGroup.get('name').value;
				model.phone = this.formGroup.get('phone').value;
				model.subject = this.formGroup.get('subject').value;
				model.message = this.formGroup.get('message').value;
				model.domain = this.configService.domainName;
				model.isResolved = false;
				model.notes = "";
				let dto: ContactUsDto;
				try {
					dto = await this.service.createContactUs(model);
					this.onContactUsComplete.emit(dto);
					this.formGroup.reset();
				}
				catch (e) {
					console.log("create contactus failed: ", e);
					let alert = new MaterialAlertMessageType();
					alert.title = "Sorry your request failed: ";
					alert.message = "Unable to send request at this time.";
					setTimeout(() => { this.service.openAlert(alert); });
				}
				finally {
					this.showProgress = false;
				}
			}
			else {
				let alert = new MaterialAlertMessageType();
				alert.title = "Please Check";
				alert.message = "Please make sure the form is filled out and any error messages are fixed."
				setTimeout(() => { this.service.openAlert(alert); });
			}
		}
		catch (e) {
			throw (e);
		}
	}

	cancel(): void {
		this.onCancel.emit();
	}
}