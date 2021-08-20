import {
	Component, Input, Output, EventEmitter, ViewChild, ContentChild
} from '@angular/core';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';
import { CallType, IdCardType, ObservableMessageType, MaterialActionAlertMessageType, PhoneLineConnectionType } from '../../models/index';
import { Service } from '../../services/index';
import { Subscription } from "rxjs/Subscription";
import { Router, ActivatedRoute } from '@angular/router';
import { IncomingPhoneCallComponent } from "../index";

@Component({
	selector: 'phone-listener',
	templateUrl: 'phone-listener.component.html'
})
export class PhoneListenerComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public activatedRoute: ActivatedRoute,
		public router: Router,
	) { }

	@Output() onReceiveAcceptPhoneLineInvitation: EventEmitter<string> = new EventEmitter<string>();
	//@ContentChild('phoneListener') globalPhoneListener: GlobalPhoneListenerDirective;
	//@ViewChild(GlobalPhoneListenerDirective) globalPhoneListener: GlobalPhoneListenerDirective;

	ngOnInit() {
		this.startListeners();
	}

	ngOnDestroy() {
		this.endListeners();
	}

	receiveAcceptPhoneLineInvitation: Subscription;

	hasIncoming: boolean;

	startListeners(): void {
		this.hasIncoming = false;
		this.receiveAcceptPhoneLineInvitation = this.service.receiveAcceptPhoneLineInvitation
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					this.onReceiveAcceptPhoneLineInvitation.emit(remoteGuid);
				}
			});
	}

	endListeners(): void {
		this.receiveAcceptPhoneLineInvitation.unsubscribe();
	}
}