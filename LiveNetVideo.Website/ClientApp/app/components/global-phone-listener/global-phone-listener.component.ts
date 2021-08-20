import { Component, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';
import {
	CallType, IdCardType,
	ObservableMessageType,
	MaterialActionAlertMessageType,
	PhoneLineConnectionType,
	NotReadyForCallType,
	SdpMessageType,
	IceMessageType,
	SmsMessageType
} from '../../models/index';
import { Service } from '../../services/index';
import { Subscription } from "rxjs/Subscription";
import { Router, ActivatedRoute } from '@angular/router';
import { IncomingPhoneCallComponent } from "../../components/index";
@Component({
	selector: 'global-phone-listener',
	templateUrl: 'global-phone-listener.component.html'
})
export class GlobalPhoneListenerComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public activatedRoute: ActivatedRoute,
		public router: Router,
	) { }

	@Output() onReceiveSDP: EventEmitter<SdpMessageType> = new EventEmitter<SdpMessageType>();
	@Output() onReceiveICE: EventEmitter<IceMessageType> = new EventEmitter<IceMessageType>();
	@Output() onReceiveGroupMessage: EventEmitter<SmsMessageType> = new EventEmitter<SmsMessageType>();
	@Output() onReceivePrivateMesage: EventEmitter<SmsMessageType> = new EventEmitter<SmsMessageType>();
	@Output() onReceivePutOnHold: EventEmitter<string> = new EventEmitter<string>();
	@Output() onReceiveRemoveHold: EventEmitter<string> = new EventEmitter<string>();
	@Output() onReceiveHangUpNotice: EventEmitter<string> = new EventEmitter<string>();
	@Output() onReceiveAreYouReadyForCall: EventEmitter<PhoneLineConnectionType> = new EventEmitter<PhoneLineConnectionType>();
	@Output() onReceiveReadyForCall: EventEmitter<string> = new EventEmitter<string>();

	receiveAreYouReadyForCall: Subscription;
	receiveReadyForCall: Subscription;
	receiveNotReadyForCall: Subscription;
	receiveSDP: Subscription;
	receiveICE: Subscription;
	receivePutOnHold: Subscription;
	receiveRemoveOnHold: Subscription;
	receiveGroupSmsMessage: Subscription;
	receivePrivateSmsMessage: Subscription;
	receiveHangUpNotice: Subscription;

	ngOnInit() {
		this.startListeners();
	}

	ngOnDestroy() {
		this.endListeners();
	}

	startListeners(): void {
		this.receiveAreYouReadyForCall = this.service.receiveAreYouReadyForCall
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let phoneLineConnection: PhoneLineConnectionType = this.service.jsonToObject<PhoneLineConnectionType>(json, true);
					if (this.service.isEmpty(phoneLineConnection) === false) {
						this.onReceiveAreYouReadyForCall.emit(phoneLineConnection);
					}
				}
			});

		this.receiveReadyForCall = this.service.receiveReadyForCall
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					this.onReceiveReadyForCall.emit(remoteGuid);
				}
			});

		// takes a not ready for call signal and adds it to an array or not ready for call
		this.receiveNotReadyForCall = this.service.receiveNotReadyForCall
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let notReadyForCall: NotReadyForCallType = this.service.jsonToObject<NotReadyForCallType>(json);
					if (this.service.isEmpty(this.service.currentCallAttempt) === false) {
						this.service.currentCallAttempt.responses++;
						this.service.currentCallAttempt.notReadyForCalls.push(notReadyForCall);
					}
				}
			});

		this.receiveSDP = this.service.receiveSDP
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let sdpMessage: SdpMessageType = this.service.jsonToObject<SdpMessageType>(json, true);
					if (this.service.isEmpty(sdpMessage) === false && this.service.isEmpty(sdpMessage.sender) === false) {
						this.onReceiveSDP.emit(sdpMessage);
					}
					else {
						//TODO: received SdpMessageType without sender string (remoteGuid), handle this error type
						console.log("received SdpMessageType without sender string");
					}
				}
			});

		this.receiveICE = this.service.receiveICE
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let iceMessage: IceMessageType = this.service.jsonToObject<IceMessageType>(json, true);
					if (this.service.isEmpty(iceMessage) === false && this.service.isEmpty(iceMessage.sender) === false) {
						this.onReceiveICE.emit(iceMessage);
					}
					else {
						// TODO: received IceMessageType without sender string (remoteGuid), handle this error type
						console.log("received IceMessageType without sender string (remoteGuid)");
					}
				}
			});

		this.receiveGroupSmsMessage = this.service.receiveGroupSmsMessage
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					//console.log("receiveGroupSmsMessage: ", json);
					let smsMessage: SmsMessageType = this.service.jsonToObject<SmsMessageType>(json, true);
					if (this.service.isEmpty(smsMessage) === false && this.service.isEmpty(smsMessage.remoteGuid) === false) {
						this.onReceiveGroupMessage.emit(smsMessage);
					}
					else {
						// TODO: received SmsMessageType without sender string (remoteGuid), handle this error type
						console.log("received smsMessage without remoteGuid string (remoteGuid)");
					}
				}
			});

		this.receivePrivateSmsMessage = this.service.receivePrivateSmsMessage
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let smsMessage: SmsMessageType = this.service.jsonToObject<SmsMessageType>(json, true);
					if (this.service.isEmpty(smsMessage.remoteGuid) === false) {
						this.onReceivePrivateMesage.emit(smsMessage);
					}
					else {
						// TODO: received IceMessageType without sender string (remoteGuid), handle this error type
						console.log("received smsMessage without remoteGuid string (remoteGuid)");
					}
				}
			});

		this.receivePutOnHold = this.service.receivePutOnHold
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					this.onReceivePutOnHold.emit(remoteGuid);
				}
			});

		this.receiveRemoveOnHold = this.service.receiveRemoveOnHold
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					this.onReceiveRemoveHold.emit(remoteGuid);
				}
			});

		this.receiveHangUpNotice = this.service.receiveHangUpNotice
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				//NOTE: this method is the sames as this.onEndPhoneCallComponent they both just do cleanup work.
				// if one finishes before the other, they the second option just resolves, this.onEndPhoneCallComponent is a backup to this method
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					this.onReceiveHangUpNotice.emit(remoteGuid);
				}
			});
	}

	endListeners(): void {
	}
}