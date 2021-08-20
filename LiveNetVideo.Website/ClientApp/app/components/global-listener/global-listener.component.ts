import {
	Component, Input, Output, EventEmitter,
} from '@angular/core';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';
import { CallType, IdCardType, ObservableMessageType, MaterialActionAlertMessageType } from '../../models/index';
import { Service } from '../../services/index';
import { Subscription } from "rxjs/Subscription";
import { Router, ActivatedRoute } from '@angular/router';
import { IncomingPhoneCallComponent } from "../index";

@Component({
	selector: 'global-listener',
	templateUrl: 'global-listener.component.html'
})
export class GlobalListenerComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public activatedRoute: ActivatedRoute,
		public router: Router,
	) { }

	ngOnInit() {
		this.startGlobalPhoneListeners();
	}

	ngOnDestroy() {
		this.endGlobalPhoneListeners();
	}

	receivePhoneLineInvitationSubscription: Subscription;
	receiveRemoteLogoutSubscription: Subscription;
	hasIncoming: boolean;
	startGlobalPhoneListeners(): void {
		this.hasIncoming = false;
		this.receivePhoneLineInvitationSubscription = this.service.receivePhoneLineInvitation
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				let call: CallType = this.service.jsonToObject<CallType>(message.message, true);
				//console.log("dashboard.component.ts receivePhoneLineInvitation call:", call);
				if (!this.service.isEmpty(call)) {
					if (this.hasIncoming === false) {
						this.hasIncoming = true;
						let isMember = await this.service.isMember();

						let allowCall: boolean = false;
						let notAcceptedRemoteGuid: string;
						try {
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

		this.receiveRemoteLogoutSubscription = this.service.receiveRemoteLogout
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				let connectionId = message.message;
				if (this.service.isEmpty(connectionId) === false) {
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
			});
	}

	endGlobalPhoneListeners(): void {
		this.receivePhoneLineInvitationSubscription.unsubscribe();
		this.receiveRemoteLogoutSubscription.unsubscribe();
	}

	openIncomingCallDialog(call: CallType): void {
		let dialogRef = this.matDialog.open(IncomingPhoneCallComponent, {
			width: '80%',
			height: '80%'
		});

		dialogRef.componentInstance.call = call;

		dialogRef.componentInstance.onIncomingCallResponse.subscribe((response: boolean) => {
			dialogRef.close();
			this.hasIncoming = false;
			if (response === true) {
				// let the service know the user accepted a phone call so when they navigate to the phone
				// it will know the user accepted a phone call, and initiate the proper methods
				// initCall() -> sendAcceptPhoneLineInvitation(phoneLineGuid, remoteGuid)
				//this.service.phoneServiceSendAcceptPhoneLineInvitation(call.phoneLineGuid, call.remoteGuid);
				this.service.acceptedCall = call;
				// take them to the phone
				this.router.navigate(['/phone'], { relativeTo: this.activatedRoute })
			}
			else {
				this.service.sendNotAcceptCall(call.remoteGuid);
			}
		});

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onIncomingCallResponse.unsubscribe();
		});
	}
}