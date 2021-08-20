import { Component, Input, Output, EventEmitter, Optional, Inject, NgZone } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { CallType, IdCardType } from '../../models/index';
import { Service } from '../../services/index';

@Component({
	selector: 'incoming-phone-call',
	templateUrl: 'incoming-phone-call.component.html',
	styleUrls: ['./incoming-phone-call.component.scss']
})
export class IncomingPhoneCallComponent {
	constructor(
		private ngZone: NgZone,
		private service: Service,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		//console.log("incomingPhoneCallComponent this.data: ", this.data);
		////this.call = this.data;
		//this.email = this.data["profile"]["email"];
		//if (this.service.isEmpty(this.data) === false && this.data.hasOwnProperty('profile') && this.service.isEmpty(this.data["profile"]) === false) {
		//	this.call = this.data;
		//}
	}

	@Input('call') inputCall: CallType;
	// false to deny call, true to except call
	@Output() onIncomingCallResponse: EventEmitter<boolean> = new EventEmitter<boolean>();

	_call: CallType;
	get call(): CallType {
		return this._call;
	}
	set call(value: CallType) {
		//console.log("setCall: ", value);
		this._call = value;
		if (this.service.isEmpty(value) === false) {
			this.idCards = new Array<IdCardType>();
			this.setGui(value);
		}
	}

	email: string = "";
	imgSrc: string = this.service.defaultAvatar;
	name: string = "";
	idCards: Array<IdCardType>;
	timer: number; // in seconds
	timerRef: number;

	ngOnInit() {
		//console.log("ngOnInit() this.data: ", this.data);
		if (this.service.isEmpty(this.data) === false && this.data.hasOwnProperty('profile') && this.service.isEmpty(this.data["profile"]) === false) {
			this.call = this.data;
		}
		else {
			this.call = this.inputCall;
		}

		this.timer = 60;
		this.timerRef = window.setInterval(() => this.reduceTime(), 1000);
	}

	ngOnDestroy() {
		window.clearInterval(this.timerRef);
	}

	reduceTime(): void {
		//console.log("reduce time: ", this.timer);

		this.timer--;
		if (this.timer < 1) {
			this.onIncomingCallResponse.emit(false);
			window.clearInterval(this.timerRef);
			this.timer = 60;
		}
	}

	setGui(call: CallType) {
		//console.log("setGui: ", call);
		if (this.service.isEmpty(call) === false) {
			this.name = this.service.isEmpty(call.profile.name) ? "Anonymous" : call.profile.name;
			this.email = this.service.isEmpty(call.profile.email) ? "" : call.profile.email;
			this.imgSrc = this.service.isEmpty(call.profile.avatarFileName) ? this.service.defaultAvatar
				: this.service.avatarBaseUrl + call.profile.avatarFileName + "?" + Date.now().toString();

			if (this.service.isEmpty(call.callers) === false) {
				call.callers.forEach((callType: CallType) => {
					if (this.service.isEmpty(callType) === false && this.service.isEmpty(callType.profile) === false && callType.profile.memberId !== call.profile.memberId) {
						let idCard = new IdCardType();
						idCard.subtitle = callType.profile.email;
						idCard.title = this.service.isEmpty(callType.profile.name) ?
							(this.service.isEmpty(callType.profile.username) === false ? callType.profile.username : 'Anonymous') :
							callType.profile.name;

						this.idCards.push(idCard);
					}
				})
			}
		}
	}

	denyCall(): void {
		this.onIncomingCallResponse.emit(false);
	}

	acceptCall(): void {
		this.onIncomingCallResponse.emit(true);
	}
}