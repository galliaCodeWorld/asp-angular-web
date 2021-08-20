import { Component, Input, Output, EventEmitter, Inject, Optional, NgZone } from '@angular/core';
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
	PhoneContactType,
	MaterialAlertMessageType,
	MeetingAttendeeDto,
	MemberType,
	MeetingDto,
} from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'form-add-attendee',
	templateUrl: 'form-add-attendee.component.html'
})
export class FormAddAttendeeComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		private fb: FormBuilder,
		private ngZone: NgZone,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		this.createForm();
		this.formGroup.get("name").disable();
		this.showProgress = false;
	}

	@Input('showProgress') showProgress: boolean;
	@Output() onAddAttendee: EventEmitter<MeetingAttendeeDto> = new EventEmitter<MeetingAttendeeDto>();
	accessToken: string;

	ngOnInit() {
		//console.log("ngOnInit: ", this.data);
		this.model = new MeetingAttendeeDto();
		if (this.service.isEmpty(this.data)) {
			this.service.getAccessToken()
				.then((accessToken: string) => {
					this.accessToken = accessToken;
				});
		}
		else {
			//console.log("data: ", this.data);
			this.accessToken = this.data;
		}
	}

	model: MeetingAttendeeDto;
	formGroup: FormGroup
	member: MemberType;

	createForm() {
		this.formGroup = this.fb.group({
			name: new FormControl('', [
				Validators.maxLength(100),
				Validators.required

			]),

			email: new FormControl('',
				[
					Validators.email,
					Validators.required,
					Validators.maxLength(300)
				]
			)
		})
	}

	checkEmail(event: KeyboardEvent) {
		let email = this.formGroup.get('email').value;
		if (this.service.isValidEmail(email)) {
			this.service.getMemberByEmail(email, this.accessToken)
				.then((member: MemberType) => {
					this.member = member;
					this.formGroup.get('name').disable();
					this.formGroup.get('name').setValue(member.firstName + " " + member.lastName.substring(0, 1) + ".");
				})
				.catch((e) => {
					//console.log("error: ", e);
					this.member = null;
					this.formGroup.get('name').setValue("");
					this.formGroup.get('name').enable();
				});
		}
	}

	submit() {
		if (this.formGroup.valid) {
			this.model.email = this.service.sanitizeEmail(this.formGroup.get('email').value);
			this.model.name = this.formGroup.get('name').value;
			if (this.service.isEmpty(this.member) === false) {
				this.model.member = this.member;
				this.model.memberId = this.member.memberId;
			}

			this.onAddAttendee.emit(this.model);
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	cancel() {
		let dialog = this.matDialog.getDialogById('form-add-attendee');
		this.ngZone.run(async () => {
			dialog && dialog.close();
		});
	}
}