import {
	Component, Input, Output, EventEmitter,
	ComponentFactory,
	ComponentFactoryResolver,
	ViewContainerRef,
	ComponentRef,
	NgZone,
} from '@angular/core';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';
import {
	Router,
	ActivatedRoute
} from '@angular/router';
import {
	PhoneContactType,
	MaterialAlertMessageType,
	MaterialActionAlertMessageType,
	PbxLineRepDto,
	MemberType
} from "../../models/index";
import { Service } from "../../services/index";
import {
	FormEditContactComponent,
	MaterialActionAlertComponent,
	ContactCardComponent,
	OutgoingCallDialogComponent,
} from "../index";
@Component({
	selector: 'other-rep',
	templateUrl: 'other-rep.component.html'
})
export class OtherRepComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public route: ActivatedRoute,
		public router: Router,
		private ngZone: NgZone,
	) { }

	@Input('otherRep') inputOtherRep: PbxLineRepDto;
	//@Output() onContactDeleted: EventEmitter<PhoneContactType> = new EventEmitter<PhoneContactType>();

	email: string;
	imgSrc: string;
	name: string;
	title: string;
	pbxLineName: string;

	_otherRep: PbxLineRepDto;
	get otherRep(): PbxLineRepDto {
		return this._otherRep;
	}
	set otherRep(value: PbxLineRepDto) {
		this._otherRep = value;
		if (this.service.isEmpty(value) === false) {
			this.name = this.service.isEmpty(value.companyEmployee.member.firstName) ? "Unknown" : value.companyEmployee.member.firstName + " " + value.companyEmployee.member.lastName;
			this.email = this.service.isEmpty(value.companyEmployee.member.email) ? "" : value.companyEmployee.member.email;
			this.imgSrc = this.service.isEmpty(value.companyEmployee.avatarFilename) ? this.service.defaultAvatar
				: this.service.pbxContentUrl + value.companyEmployee.companyProfileId.toString() + "/" + this.service.employeeImageFolder + "/" + value.companyEmployee.avatarFilename + "?" + Date.now().toString();
			this.title = this.service.isEmpty(value.companyEmployee.title) ? "" : value.companyEmployee.title;
			this.pbxLineName = this.service.isEmpty(value.pbxLine) === false ? value.pbxLine.lineName : "";
		}
	}

	ngOnInit() {
		this.otherRep = this.inputOtherRep;
	}

	async sendPage(event: Event): Promise<void> {
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
				remoteGuid = await this.service.phoneSendPbxPhoneLineInvitation(this.otherRep.companyEmployee.member.email, this.otherRep.pbxLineRepId);
			}
			catch (e) {
				throw (e)
			}

			if (this.service.isEmpty(remoteGuid)) {
				throw (`${this.name} does appear to be online`);
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
			let member = this.otherRep.companyEmployee.member;
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
							await this.service.cancelCall(this.otherRep.companyEmployee.member.email);
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
}