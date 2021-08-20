import { Component, Input, Output, EventEmitter, Optional, Inject, NgZone } from '@angular/core';
//import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,	AbstractControl
} from '@angular/forms';

import { Subscription } from 'rxjs/Subscription';
import { Service } from '../../services/index';
import {
	SmsMessageType,
	ObservableMessageType,
	TextMessageType,
	GenericUserType,
	MaterialAlertMessageType,
	PhoneLineType,
	FormItemType,
	SendCopyOfMessageDto,
} from "../../models/index";
import { PrivateMessagingComponent, FormGetInfoComponent } from "../index";

@Component({
	selector: 'text-messaging',
	templateUrl: './text-messaging.component.html',
	styleUrls: ['./text-messaging.component.scss']
})
export class TextMessagingComponent {
	constructor(
		private ngZone: NgZone,
		private service: Service,
		//private sanitizer: DomSanitizer,
		private matDialog: MatDialog,
		private fb: FormBuilder,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		this.showSmsProgress = false;
		//this.users = new Array<GenericUserType>();
		this.messagingVisible = true;
		this.createForm();
	}

	@Input('users') currentUsers: Array<GenericUserType>;

	messagesValue: Array<TextMessageType>;
	@Output() textMessagesChange: EventEmitter<Array<TextMessageType>> = new EventEmitter<Array<TextMessageType>>();
	@Input()
	get textMessages(): Array<TextMessageType> {
		return this.messagesValue;
	}
	set textMessages(value: Array<TextMessageType>) {
		this.messagesValue = value;
		this.textMessagesChange.emit(this.messagesValue);
	}

	showSmsProgress: boolean;
	messagingVisible: boolean;

	//users: Array<GenericUserType>;
	@Input('currentMessage') currentMessage: TextMessageType;

	ngOnInit() {
		console.log("text-messaging.component.ts ngOnInit()");
		if (this.service.isEmpty(this.textMessages)) {
			this.messagingVisible = false;
			this.textMessages = new Array<TextMessageType>();
		}
		if (this.service.isEmpty(this.currentUsers)) {
			console.log("text-messaging.component.ts ngOnInit this.users is empty: ", this.currentUsers);
			this.currentUsers = new Array<GenericUserType>();
		}
		this.startSubscription();
	}

	ngOnDestroy() {
		this.endSubscription();
	}

	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			message: new FormControl('', [
				Validators.maxLength(500),
				Validators.required

			]),
		})
	}

	// #region signalr Subscriptions
	receiveGroupSmsMessage: Subscription;
	receivePrivateSmsMessage: Subscription;
	// #endregion

	startSubscription(): void {
		this.receiveGroupSmsMessage = this.service.receiveGroupSmsMessage
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				// TODO: handle group message
				console.log("receiveGroupSmsMessage message: ", message);
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					//console.log("receiveGroupSmsMessage: ", json);
					// NOTE: all 3 properties of smsMessage are required
					//&& smsMessage.remoteGuid !== this.service.localGuid
					let smsMessage: SmsMessageType = this.service.jsonToObject<SmsMessageType>(json, true, this.service.toLocalTimeReviver);
					console.log("smsMessage: ", smsMessage);
					if (this.service.isEmpty(smsMessage) === false
						&& this.service.isEmpty(smsMessage.remoteGuid) === false
						&& this.service.isEmpty(smsMessage.sender) === false

					) {
						let remoteGuid = smsMessage.remoteGuid;
						let email = smsMessage.sender;
						let user: GenericUserType = this.currentUsers.find((user: GenericUserType) => {
							return user.id === remoteGuid;
						});

						console.log("currentUsers:", this.currentUsers);
						console.log("user: ", user);
						if (this.service.isEmpty(user) === false) {
							//console.log("smsMessage.remoteGuid: ", smsMessage.remoteGuid);
							//console.log("this.service.localGuid", this.service.localGuid);

							// existing user, generate message from existing user
							let newMessage = new TextMessageType();
							newMessage.id = remoteGuid;
							newMessage.email = user.email;
							newMessage.name = user.name;
							newMessage.imgSrc = user.imgSrc;
							newMessage.isPrivate = false;
							// NOTE: false means this group message received is the message the user sent out to everyone, including themself
							newMessage.isIncoming = (smsMessage.remoteGuid === this.service.localGuid) ? false : true;
							newMessage.message = smsMessage.message;
							console.log("incoming newMessage: ", newMessage);
							this.ngZone.run(() => {
								this.textMessages.unshift(newMessage);
								this.currentMessage = newMessage;
							})
						}
					}
				}
			});

		this.receivePrivateSmsMessage = this.service.receivePrivateSmsMessage
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				console.log("receivePrivateSmsMessage message: ", message);
				console.log("text-messaging.component.ts this.users: ", this.currentUsers);
				// TODO: handle sms message
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let smsMessage: SmsMessageType = this.service.jsonToObject<SmsMessageType>(json, true);
					if (this.service.isEmpty(smsMessage) === false
						&& this.service.isEmpty(smsMessage.remoteGuid) === false
						&& this.service.isEmpty(smsMessage.sender) === false
					) {
						let remoteGuid = smsMessage.remoteGuid;
						let email = smsMessage.sender;
						let user: GenericUserType = this.currentUsers.find((user: GenericUserType) => {
							return user.id === remoteGuid;
						});

						console.log("user: ", user);

						if (this.service.isEmpty(user) === false) {
							//console.log("smsMessage.remoteGuid: ", smsMessage.remoteGuid);
							//console.log("this.service.localGuid", this.service.localGuid);

							// existing user, generate message from existing user
							let newMessage = new TextMessageType();
							newMessage.id = remoteGuid;
							newMessage.email = user.email;
							newMessage.name = user.name;
							newMessage.imgSrc = user.imgSrc;
							newMessage.isPrivate = true;
							// NOTE: false means this group message received is the message the user sent out to everyone, including themself
							newMessage.isIncoming = (smsMessage.remoteGuid === this.service.localGuid) ? false : true;
							newMessage.message = smsMessage.message;
							//console.log("incoming newMessage: ", newMessage);
							this.ngZone.run(() => {
								this.textMessages.unshift(newMessage);
								this.currentMessage = newMessage;
								console.log("this.textMessages: ", this.textMessages);
								console.log("this.currentMessage: ", this.currentMessage);
							})
						}
					}
					else {
						// TODO: received IceMessageType without sender string (remoteGuid), handle this error type
						console.log("received smsMessage without remoteGuid string (remoteGuid)");
					}
				}
			});
	}

	endSubscription(): void {
		this.receiveGroupSmsMessage && this.receiveGroupSmsMessage.unsubscribe();
		this.receivePrivateSmsMessage && this.receivePrivateSmsMessage.unsubscribe();
	}

	async sendGroupMessageWithEnterKey(event): Promise<void> {
		console.log("sendGroupMessageWithEnterKey: ", event);
		if (event.altKey === false && event.shiftKey === false && event.key === "Enter") {
			await this.sendGroupMessage();
		}
	}

	async sendGroupMessage(): Promise<void> {
		if (this.formGroup.valid) {
			this.showSmsProgress = true;
			let message = this.formGroup.get('message').value;
			//console.log("message: ", message);
			//await this.service.delay(1000);
			this.showSmsProgress = false;
			//console.log("PhoneLine: ", this.service.phoneLine);
			if (this.service.isEmpty(this.service.phoneLine) === false && this.service.phoneLine.phoneLineConnections.length > 0) {
				let result: string;
				try {
					result = await this.service.sendGroupSmsMessage(message, this.service.phoneLine.phoneLineGuid);
				}
				catch (e) {
					let alert = new MaterialAlertMessageType();
					alert.title = "Error";
					alert.message = "Sorry unable to send the message.";
					this.service.openAlert(alert);
				}
				if (this.service.isEmpty(result) === false) {
					this.formGroup.reset();
				}
				//console.log("result: ", result);
			}
			else {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = "Unable to send message, there is no one to send a message to.";
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

	async openPrivateSmsInterface(remoteGuid?: string): Promise<void> {
		console.log("openPrivateSmsInterface remoteGuid: ", remoteGuid);
		console.log("openPrivateSmsInterface this.users: ", this.currentUsers);
		if (!this.service.isEmpty(this.currentUsers) && this.currentUsers.length > 1) {
			if (remoteGuid !== this.service.localGuid) {
				let user: GenericUserType = null
				let filteredUsers: Array<GenericUserType> = this.currentUsers.slice();

				if (this.service.isEmpty(remoteGuid) === false) {
					//search for the default selected user
					user = filteredUsers.find((user) => {
						return user.id == remoteGuid;
					});
				}

				// search for sender
				let index = filteredUsers.findIndex((user: GenericUserType) => {
					return user.id == this.service.localGuid;
				});
				let localUser = filteredUsers[index];
				if (index > -1) {
					// remove the sender, because sender can not send a message to self
					filteredUsers.splice(index, 1);
				}

				let newMessage: string;
				try {
					newMessage = await this.service.openPrivateSmsInterface(filteredUsers, user);
				}
				catch (e) {
					//console.log("e: ", e);
					let alert = new MaterialAlertMessageType();
					alert.title = "Error";
					alert.message = "Unable to send message";
					this.service.openAlert(alert);
				}
				//console.log("phone.page newMessage: ", newMessage);

				//console.log("before this.textMessages: ", this.textMessages);

				if (this.service.isEmpty(newMessage) === false && this.service.isEmpty(localUser) === false) {
					let message = new TextMessageType();
					message.id = localUser.id;
					message.email = localUser.email;
					message.name = localUser.name;
					message.message = newMessage;
					message.isIncoming = false;
					message.isPrivate = true;
					message.imgSrc = localUser.imgSrc;
					this.currentMessage = message;
					this.textMessages.unshift(message);
					//console.log("after this.textMessages: ", this.textMessages);
				}
			}
			else {
				// do nothing, the user can not send him/herself a private message
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "You must be connected to atleast one other user to send a private message";
			this.service.openAlert(alert);
		}
	}

	openMessaging(): void {
		// this will show the box for entering text messages
		this.messagingVisible = true;
	}

	closeMessaging(): void {
		// this will hide the box for entering text messages
		this.messagingVisible = false;
	}

	clearMessages(): void {
		this.textMessages = new Array<TextMessageType>();
		this.currentMessage = null;
	}

	// for testing only
	addMessage(): void {
		let message = new TextMessageType();
		let id = Date.now().toString();
		message.imgSrc = this.service.defaultAvatar;
		message.name = "name: " + id;
		message.message = "New Message. this is a new message to display: " + id;
		message.email = id + "@email.com";
		this.textMessages.unshift(message);
		this.currentMessage = message;
	}

	async saveMessages(): Promise<void> {
		//console.log("save messages: ", this.textMessages);
		try {
			if (this.service.isEmpty(this.textMessages) === false) {
				let dialogRef = this.matDialog.open(FormGetInfoComponent, {
					id: 'get-info-dialog',
					width: '80%',
					height: '80%',
					data: '<p>Please enter your email. We will send a copy of your text conversion to the email provided.</p>'
				});
				let formItems = new Array<FormItemType>();
				let formItem = new FormItemType();
				formItem.isEmail = true;
				formItem.key = "email";
				formItem.label = "Email";
				formItem.maxLength = 300;
				formItem.minLength = 5;
				formItem.required = true;
				formItems.push(formItem);
				dialogRef.componentInstance.formItems = formItems;

				dialogRef.componentInstance.onSubmit.subscribe((formItems: Array<FormItemType>) => {
					let email = "";
					for (let i = 0; i < formItems.length; i++) {
						if (formItems[i].key === "email") {
							email = formItems[i].value;
						}
					}

					this.ngZone.run(async () => {
						dialogRef.componentInstance.showProgress = true;
						let accessToken = await this.service.getAccessToken();
						let message = "";

						this.textMessages.forEach((m) => {
							message += '<p><strong>' + m.name + ': </strong>' + m.message + '</p>';
						})

						let dto = new SendCopyOfMessageDto();
						dto.email = email;
						dto.message = message;
						await this.service.SendCopyOfMessage(dto, accessToken);

						let alert = new MaterialAlertMessageType();
						alert.title = "Success";
						alert.message = "Current messages were sent to your email: " + email;
						this.service.openAlert(alert);
						dialogRef.componentInstance.showProgress = false;
						dialogRef.close();
					});
				});

				dialogRef.afterClosed().subscribe(() => {
					dialogRef.componentInstance.onSubmit.unsubscribe();
				});
			}
			else {
				throw ("There are no messages to save.")
			}
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please check";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	async testShowUsers(): Promise<void> {
		console.log("this.currentUsers: ", this.currentUsers);
	}
}