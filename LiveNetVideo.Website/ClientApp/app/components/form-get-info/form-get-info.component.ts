import { Component, Input, Output, EventEmitter, Inject, Optional, NgZone } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,	AbstractControl
} from '@angular/forms';

import {
	MaterialAlertMessageType, FormItemType,
} from "../../models/index";

import { Service } from "../../services/index";

import { optionalEmail } from "../../validators/optionalEmail.validator";

@Component({
	selector: 'form-get-info',
	templateUrl: 'form-get-info.component.html'
})
export class FormGetInfoComponent {
	constructor(
		private ngZone: NgZone,
		private domSanitizer: DomSanitizer,
		private service: Service,
		private fb: FormBuilder,
		private matDialog: MatDialog,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: string

	) {
		this.showProgress = false;
	}

	@Input('showProgress') showProgress: boolean;
	@Input('title') title: string;
	@Input('instructions') instructions: SafeHtml;
	@Input('formItems') formItems: Array<FormItemType>;
	@Output() onSubmit: EventEmitter<Array<FormItemType>> = new EventEmitter<Array<FormItemType>>();
	@Output() onCancel: EventEmitter<void> = new EventEmitter<void>();

	ngOnInit() {
		this.instructions = this.domSanitizer.bypassSecurityTrustHtml(this.data);
		this.createForm();
	}

	formGroup: FormGroup

	createForm() {
		if (this.service.isEmpty(this.formItems) === false) {
			let controls = {};

			this.formItems.forEach((f) => {
				let options = new Array();
				if (this.service.isEmpty(f.required) === false) {
					options.push(Validators.required);
				}
				if (this.service.isEmpty(f.isEmail) === false) {
					options.push(optionalEmail);
				}
				if (this.service.isEmpty(f.maxLength) === false) {
					options.push(Validators.maxLength(f.maxLength));
				}
				if (this.service.isEmpty(f.minLength) === false) {
					options.push(Validators.minLength(f.minLength));
				}

				let control = new FormControl("", options)
				control.setValue(f.value);
				controls[f.key] = control;
			});

			this.formGroup = this.fb.group(controls);
		}
	}

	submit(): void {
		//this.showProgress = true;
		if (this.formGroup.valid) {
			//this.model.companyName = this.formGroup.get('companyName').value;
			this.formItems.forEach((f) => {
				if (this.service.isEmpty(this.formGroup.get(f.key)) === false) {
					f.value = this.formGroup.get(f.key).value;
				}
			});
			this.onSubmit.emit(this.formItems);
			//this.showProgress = false;
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	cancel() {
		//let dialog = this.matDialog.getDialogById(this.id);
		//this.ngZone.run(async () => {
		//	dialog && dialog.close();
		//});

		this.onCancel.emit();
	}
}