import { Component, Input, Output, EventEmitter, Optional, Inject, NgZone } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { Service } from '../../services/index';
import { LoginOptionsEnum } from '../../models/index';

@Component({
	selector: 'login-options',
	templateUrl: 'login-options.component.html',
	styleUrls: ['./login-options.component.scss']
})
export class LoginOptionsComponent {
	constructor(
		private service: Service
	) {
	}

	@Output() onContinue: EventEmitter<LoginOptionsEnum> = new EventEmitter<LoginOptionsEnum>();

	allowsGuest: boolean = true;

	ngOnInit() {
	}

	ngOnDestroy() {
	}

	openLogin(): void {
		//this.onIncomingCallResponse.emit(false);
		// TODO: open member login, wait for login, then proceed
		this.onContinue.emit(LoginOptionsEnum.memberLogin);
	}

	instantGuestLogin(): void {
		//this.onIncomingCallResponse.emit(true);
		// TODO: do instantGuestLogin and proceed
		this.onContinue.emit(LoginOptionsEnum.instantGuestLogin);
	}

	leave(): void {
		// TODO: leave
		this.onContinue.emit(LoginOptionsEnum.cancelLogin);
	}
}