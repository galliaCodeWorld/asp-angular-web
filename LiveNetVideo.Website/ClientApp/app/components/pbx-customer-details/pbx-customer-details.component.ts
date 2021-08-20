import {
	Component,
	Output,
	Input,
	EventEmitter,
	NgZone,
	Optional,
	Inject
} from '@angular/core';
import { MatDialogRef, MatDialog, MatCard, MAT_DIALOG_DATA } from '@angular/material';

import {
	PbxCustomerType, MaterialAlertMessageType, MemberType,
} from '../../models/index'
import { Service } from '../../services/index'
import { OutgoingCallDialogComponent } from "../index";

@Component({
	selector: 'pbx-customer-details',
	styleUrls: ['pbx-customer-details.component.scss'],
	templateUrl: 'pbx-customer-details.component.html'
})
export class PbxCustomerDetailsComponent {
	constructor(
		public ngZone: NgZone,
		public service: Service,
		private matDialog: MatDialog,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
	}

	@Input('customer') customer: PbxCustomerType;
	@Output() onSendInvite: EventEmitter<PbxCustomerType> = new EventEmitter<PbxCustomerType>();

	ngOnInit() {
		if (this.service.isEmpty(this.data) === false && ('subject' in this.data)) {
			this.customer = this.data;
		}
	}

	ngOnDestroy() {
	}

	async sendInvite(event: Event): Promise<void> {
		this.onSendInvite.emit(this.customer);
		this.close(null);
	}

	async displayOutgoingCall(duration: number = 60): Promise<void> {
		//console.log("displayingOutgoing");
		try {
			//let callingTimer: NodeJS.Timer;
			let member = new MemberType();
			member.email = this.customer.email;
			member.firstName = this.customer.name;
			member.lastName = "";
			let outgoingCallDialog: MatDialogRef<OutgoingCallDialogComponent> = this.matDialog.open(OutgoingCallDialogComponent, {
				id: 'outgoing-call',
				width: '80%',
				height: '80%',
				data: { member: member, duration: duration }
			})

			outgoingCallDialog
				.afterClosed()
				.subscribe(async (remoteGuid: string) => {
					// NOTE: if remoteGuid is not provided we will run cancelCall
					// this will handle the case when the user clicks outside the dialog box and it closes
					// by itself. If the remoteGuid is provided,
					// this means cancelCall was already called or does not need to be called
					if (this.service.isEmpty(remoteGuid)) {
						try {
							await this.service.cancelCall(this.customer.email);
						}
						catch (e) {
							console.log("Cancel Call error: ", e);
						}
					}
				});
		}
		catch (e) {
			throw (e);
		}
	}

	close(event: Event): void {
		let dialog = this.matDialog.getDialogById('pbx-customer-details-' + this.customer.id)
		dialog && dialog.close();
	}
}