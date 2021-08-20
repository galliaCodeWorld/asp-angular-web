import {
	Component,
	Output,
	Input,
	EventEmitter,
	NgZone
} from '@angular/core';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';

import {
	PbxCustomerType, MaterialAlertMessageType, MemberType, GenericUserType, PbxLineRepDto,
} from '../../models/index'
import { Service } from '../../services/index'
import { OutgoingCallDialogComponent, PbxCustomerDetailsComponent, OtherRepsComponent } from "../index";

@Component({
	selector: 'pbx-customer',
	styleUrls: ['pbx-customer.component.scss'],
	templateUrl: 'pbx-customer.component.html'
})
export class PbxCustomerComponent {
	constructor(
		public ngZone: NgZone,
		public service: Service,
		private matDialog: MatDialog,
	) {
	}

	@Output() onDisconnect: EventEmitter<string> = new EventEmitter<string>();
	@Input('customer') customer: PbxCustomerType;
	@Input('otherReps') otherReps: Array<PbxLineRepDto>;
	@Input('isBusy') isBusy: boolean;
	ngOnInit() {
		this.isBusy = false;
	}

	ngOnDestroy() {
	}

	async disconnect(event: Event): Promise<void> {
		this.onDisconnect.emit(this.customer.id);
	}

	async sendInvite(event: Event): Promise<void> {
		let originalContent: string;
		if (this.service.isEmpty(event) === false) {
			console.log("event: ", event);
			originalContent = (<Element>event.target).innerHTML;
			(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
			(<Element>event.target).setAttribute("disabled", "true");
		}

		try {
			let remoteGuid: string;
			try {
				remoteGuid = await this.service.phoneSendPhoneLineInvitation(this.customer.email);
			}
			catch (e) {
				throw ("Unable to make call at this time. Please try your request again.")
			}

			if (this.service.isEmpty(remoteGuid)) {
				throw (`${this.customer.email} does appear to be online`);
			}
			else {
				await this.displayOutgoingCall(event, originalContent);
			}
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
		}
		//finally {
		//	if (this.service.isEmpty(event) === false && this.service.isEmpty(originalContent) === false) {
		//		(<Element>event.target).innerHTML = originalContent;
		//		(<Element>event.target).removeAttribute("disabled");
		//	}
		//}
	}

	async displayOutgoingCall(event: Event, originalContent: string, duration: number = 60): Promise<void> {
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

					if (this.service.isEmpty(event) === false && this.service.isEmpty(originalContent) === false) {
						(<Element>event.target).innerHTML = originalContent;
						(<Element>event.target).removeAttribute("disabled");
					}
				});
		}
		catch (e) {
			throw (e);
		}
	}

	openDetails(event: Event): void {
		let detailsDialog: MatDialogRef<PbxCustomerDetailsComponent> = this.matDialog.open(PbxCustomerDetailsComponent, {
			id: 'pbx-customer-details-' + this.customer.id,
			width: '80%',
			height: '80%',
			data: this.customer
		})

		detailsDialog.componentInstance.onSendInvite.subscribe((customer: PbxCustomerType) => {
			if (this.customer.email === customer.email) {
				this.sendInvite(null);
			}
		})

		detailsDialog
			.afterClosed()
			.subscribe(() => {
			});
	}

	transfer(event: Event): void {
		try {
			if (this.service.isEmpty(this.otherReps) === false) {
				let dialogRef = this.matDialog.open(OtherRepsComponent, {
					id: 'reps-transfer-list',
					width: '80%',
					height: '80%',
					data: this.otherReps
				});
			}
			else {
				throw ("There are no other reps online to transfer user " + this.customer.name);
			}
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please check";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	async displayOtherReps(): Promise<void> {
		if (this.service.isEmpty(this.otherReps) === false) {
			let dialogRef = this.matDialog.open(OtherRepsComponent, {
				id: 'reps-transfer-list',
				width: '80%',
				height: '80%',
				data: this.otherReps
			});
		}
		else {
			throw ("Unable to find any other representatives.");
		}
	}
}