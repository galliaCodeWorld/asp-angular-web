import {
	Component, Input, Output, EventEmitter, NgZone,
} from '@angular/core';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';
import { CallType, IdCardType, ObservableMessageType, MaterialActionAlertMessageType, MaterialAlertMessageType } from '../../models/index';
import { Service } from '../../services/index';
import { Subscription } from "rxjs/Subscription";
import { Router, ActivatedRoute } from '@angular/router';
import { IncomingPhoneCallComponent } from "../index";

@Component({
	selector: 'phone-ringer',
	templateUrl: 'phone-ringer.component.html'
})
export class PhoneRingerComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public activatedRoute: ActivatedRoute,
		public router: Router,
		private ngZone: NgZone,

	) { }

	ngOnInit() {
		this.startGlobalPhoneListeners();
	}

	ngOnDestroy() {
		//console.log("phone-ringer.component destroy");
		this.endGlobalPhoneListeners();
	}

	receivePhoneLineInvitation: Subscription;
	receiveRemoteLogout: Subscription;
	receiveCancelInvitation: Subscription;
	//receiveAreYouOnline: Subscription;

	hasIncoming: boolean;
	startGlobalPhoneListeners(): void {
		this.hasIncoming = false;

		this.receiveCancelInvitation = this.service.receiveCancelInvitation
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			//.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.distinctUntilChanged()
			.subscribe((message: ObservableMessageType) => {
				console.log("receiveCancelInvitation message: ", message);
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					// the caller received acceptance, so go ahead and close the outgoingCallDialog
					// and wait for AreYouReadyForCall Signal
					let dialog = this.matDialog.getDialogById('incoming-call-dialog')
					this.ngZone.run(() => {
						dialog && dialog.close();
						let alert = new MaterialAlertMessageType();
						alert.title = "Call Ended";
						alert.message = "The other user has cancelled the call.";
					})
				}
			});

		this.receivePhoneLineInvitation = this.service.receivePhoneLineInvitation
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			//.distinctUntilChanged()
			.subscribe(async (message: ObservableMessageType) => {
				console.log("phone-ringer receivePhoneLineInvitation message:", message);

				let call: CallType = this.service.jsonToObject<CallType>(message.message, true);

				if (!this.service.isEmpty(call)) {
					if (this.hasIncoming === false) {
						this.hasIncoming = true;
						let isMember = await this.service.isMember();

						let allowCall: boolean = false;
						let notAcceptedRemoteGuid: string;
						try {
							// initCall will check to see if the call is not on the block list for members
							allowCall = await this.service.initCall(isMember, call);
						}
						catch (e) {
							console.log("initCall threw an error: ", e);
						}

						if (allowCall) {
							this.openIncomingCallDialog(call);
						}
						else {
							this.hasIncoming = false;
							this.service.sendNotAcceptCall(call.remoteGuid);
						}
					}
					else {
						// only one incoming call at a time
						this.service.sendBusyResponse(call.remoteGuid);
					}
				}
				else {
					// received empty call, nothing to do
				}
			});

		this.receiveRemoteLogout = this.service.receiveRemoteLogout
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				this.ngZone.run(async () => {
					let connectionId = message.message;

					if (this.service.isEmpty(connectionId) === false) {
						console.log("phone-ringer.component.ts receiveRemoteLogout: ", connectionId)

						// NOTE: check the connectionId from the signalr server with the current users signalr connetionId to make sure they
						// match before, logging the app out.
						// NOTE: This is a system message
						if (connectionId === this.service.webRtcHub.connection.id) {
							// TODO: do your app logout routine here.
							try {
								await this.service.doLogout()
							}
							catch (e) {
								// TODO: handle this.service.doLogout() throw error
								console.log("service.service.ts receiveRemoteLogoutSubscription error:", e);
							}
							finally {
								this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
							}
						}
						else {
							// invalid connectionId, so nothing to do
						}
					}
					else {
						// no connectionId is message, so nothing to do
					}
				})
			});

		//this.receiveAreYouOnline = this.service.receiveAreYouOnline
		//	.asObservable()
		//	.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
		//	.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
		//	.subscribe((message: ObservableMessageType) => {
		//		this.ngZone.run(async () => {
		//			let remoteGuid: string = message.message;

		//			if (!this.service.isEmpty(remoteGuid)) {
		//				this.service.
		//			}
		//			else {
		//				// no remoteGuid to respond to, so nothing to do
		//			}
		//		})
		//	});
	}

	endGlobalPhoneListeners(): void {
		this.receivePhoneLineInvitation && this.receivePhoneLineInvitation.unsubscribe();
		this.receiveRemoteLogout && this.receiveRemoteLogout.unsubscribe();
		this.receiveCancelInvitation && this.receiveCancelInvitation.unsubscribe();
	}

	openIncomingCallDialog(call: CallType): void {
		this.ngZone.run(() => {
			//console.log("openIncomingCallDialog call: ", call);
			let dialogRef = this.matDialog.open(IncomingPhoneCallComponent, {
				id: 'incoming-call-dialog',
				width: '80%',
				height: '80%',
				data: call
			});

			//dialogRef.componentInstance.call = call;

			dialogRef.componentInstance.onIncomingCallResponse.subscribe(async (response: boolean) => {
				this.hasIncoming = false;
				if (response === true) {
					// let the service know the user accepted a phone call so when they navigate to the phone
					// it will know the user accepted a phone call, and initiate the proper methods
					// initCall() -> sendAcceptPhoneLineInvitation(phoneLineGuid, remoteGuid)
					//this.service.phoneServiceSendAcceptPhoneLineInvitation(call.phoneLineGuid, call.remoteGuid);
					//console.log("url: ", this.router.url);
					//console.log("response: ", response);
					if (this.service.isEmpty(this.router.url.match('^/phone.*$')) === false) {
						let phoneLineGuid = call.phoneLineGuid;
						let remoteGuid = call.remoteGuid;
						this.service.acceptedCall = null;
						// if already at phone, send accept
						await this.service.acceptPhoneLineInvitation(phoneLineGuid, remoteGuid);
					}
					else {
						this.service.acceptedCall = call;
						// not in phone page so take them to the phone page and then accept
						this.router.navigate(['/phone', ''], { relativeTo: this.activatedRoute })
					}
				}
				else {
					this.service.sendNotAcceptCall(call.remoteGuid);
				}

				dialogRef.close();
			});

			dialogRef.afterClosed().subscribe(() => {
				dialogRef.componentInstance.onIncomingCallResponse.unsubscribe();
			});
		})
	}
}