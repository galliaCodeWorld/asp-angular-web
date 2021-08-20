import { Component, Input, Output, EventEmitter, Optional, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,
	AbstractControl
} from '@angular/forms';

import { Service } from '../../services/index';
import {
	SmsMessageType,
	ObservableMessageType,
	TextMessageType,
	GenericUserType,
	MaterialAlertMessageType,
} from "../../models/index";

@Component({
	selector: 'private-messaging',
	templateUrl: './private-messaging.component.html',
	styleUrls: ['./private-messaging.component.scss']
})
export class PrivateMessagingComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		private dialogRef: MatDialogRef<PrivateMessagingComponent>,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		this.showProgress = false;
		this.existingUsers = new Array<GenericUserType>();
		//this.users = new Array<GenericUserType>();
		this.createForm();
	}

	@Input('currentUser') currentUser: GenericUserType;
	@Input('users') users: Array<GenericUserType>;
	@Output() onSuccessPrivateMessage: EventEmitter<Array<GenericUserType>> = new EventEmitter<Array<GenericUserType>>();
	@Output() onFailedPrivateMessage: EventEmitter<Array<GenericUserType>> = new EventEmitter<Array<GenericUserType>>();
	@Output() onDone: EventEmitter<string> = new EventEmitter<string>();
	//users: Array<GenericUserType>;
	showProgress: boolean;
	existingUsers: Array<GenericUserType>;
	formGroup: FormGroup

	ngOnInit() {
		if (this.service.isEmpty(this.data) === false) {
			if (this.service.isEmpty(this.data.currentUser) === false) {
				// select the current user
				this.existingUsers.push(this.data.currentUser);
			}

			if (this.service.isEmpty(this.data.users) === false) {
				this.users = this.data.users;
			}

			// if no users selected, then select the first user
			if (this.service.isEmpty(this.users) === false && this.service.isEmpty(this.existingUsers)) {
				this.existingUsers.push(this.users[0]);
			}
		}
		else {
			if (this.service.isEmpty(this.currentUser) === false) {
				this.existingUsers.push(this.currentUser);
			}
		}
	}

	createForm() {
		this.formGroup = this.fb.group({
			message: new FormControl('', [
				Validators.maxLength(500),
				Validators.required

			]),
			selectedUsers: new FormControl()
		})
	}

	close(): void {
		this.dialogRef.close();
	}

	async submitWithEnterKey(event: KeyboardEvent): Promise<void> {
		console.log("submitWithEnterKey: ", event);
		if (event.altKey === false && event.shiftKey === false && event.key === "Enter") {
			await this.submit();
		}
	}

	async submit(): Promise<void> {
		if (this.formGroup.valid) {
			let selectedUsers: Array<GenericUserType> = this.formGroup.get('selectedUsers').value;
			let message = this.formGroup.get('message').value;
			if (this.service.isEmpty(selectedUsers) === false) {
				this.showProgress = true;
				let successUsers: Array<GenericUserType> = new Array<GenericUserType>();
				let failedUsers: Array<GenericUserType> = new Array<GenericUserType>();

				for (let user of selectedUsers) {
					try {
						await this.service.sendPrivateSmsMessage(message, user.id);
						successUsers.push(user);
					}
					catch (e) {
						failedUsers.push(user)
					}
				}

				if (this.service.isEmpty(successUsers) === false) {
					this.onSuccessPrivateMessage.emit(successUsers);
				}

				if (this.service.isEmpty(failedUsers) === false) {
					this.onFailedPrivateMessage.emit(failedUsers);
				}

				this.showProgress = false;
				this.onDone.emit(message);
				this.dialogRef.close();
			}
			else {
				let alert = new MaterialAlertMessageType();
				alert.title = "Please Check";
				alert.message = "No users selected to send a private message to.";
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