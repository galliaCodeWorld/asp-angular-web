import {
	Component, Input, Output, EventEmitter,
	ComponentFactory,
	ComponentFactoryResolver,
	ViewContainerRef,
	ComponentRef,
} from '@angular/core';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';
import {
	Router,
	ActivatedRoute
} from '@angular/router';
import {
	MaterialAlertMessageType,	MaterialActionAlertMessageType,
	MeetingDto,
	IdCardType,
	MeetingAttendeeDto,
	LongIdDto,
	MemberType,
} from "../../models/index";
import { Service } from "../../services/index";
import {
	MaterialActionAlertComponent,
	IdCardComponent,
	FormEditMeetingComponent,
	MeetingDetailsComponent,
} from "../index";

import * as moment from 'moment';

@Component({
	selector: 'meeting-invite',
	templateUrl: 'meeting-invite.component.html',
	styleUrls: ['./meeting-invite.component.scss'],
})
export class MeetingInviteComponent {
	// NOTE: this component is ment as a list item for summary information.

	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public route: ActivatedRoute,
		public router: Router,
	) {
	}

	@Input('meeting') inputMeeting: MeetingDto;
	@Input('email') inputEmail: string;
	@Output() onRsvp: EventEmitter<MeetingAttendeeDto> = new EventEmitter<MeetingAttendeeDto>();

	_meeting: MeetingDto;
	get meeting(): MeetingDto {
		return this._meeting;
	}
	set meeting(value: MeetingDto) {
		this._meeting = value;
		if (this.service.isEmpty(value) === false) {
			this.meetingId = value.meetingId;
			this.title = value.title;
			this.description = this.service.isEmpty(value.description) ? "" : value.description.substring(0, 500);
			this.fullDescription = value.description;
			this.isPrivate = this.service.isEmpty(value.isPrivate) ? "Open" : "Private";
			if (value.meetLength < 60) {
				this.duration = value.meetLength.toString() + " Min";
			}
			else {
				let hours = Math.floor(value.meetLength / 60);
				let minutes = value.meetLength % 60;
				this.duration = hours.toString() + " Hr " + minutes.toString() + " Min";
			}

			this.meetDateTime = moment(value.meetDate).format('ddd @ hh:mm A, MM/DD/YY');
		}
	}

	meetingId: number;
	title: string;
	description: string;
	fullDescription: string;
	meetDateTime: string;
	duration: string;
	isPrivate: string;
	email: string;
	attendee: MeetingAttendeeDto;

	ngOnInit() {
		this.meeting = this.inputMeeting;
		this.email = this.inputEmail;
		//console.log("email: ", this.email);
		//console.log("meeting: ", this.meeting);

		if (this.service.isEmpty(this.meeting) === false) {
			this.attendee = this.meeting.meetingAttendees.find((value) => {
				return value.email.toLowerCase() == this.email.toLowerCase();
			});
		}
	}

	async acceptRsvp(): Promise<void> {
		try {
			if (this.service.isEmpty(this.attendee) === false) {
				this.attendee.rsvp = true;
				let accessToken = await this.service.getAccessToken()
				if (this.service.isEmpty(accessToken)) {
					throw ("Access Denied.");
				}

				let updated = await this.service.updateMeetingAttendee(this.attendee, accessToken);
				if (this.service.isEmpty(updated) === false) {
					let alert = new MaterialAlertMessageType();
					alert.title = "SUCCESS";
					alert.message = "Your RSVP was sent. This meeting has been added to your Scheduled Meetings list";
					this.service.openAlert(alert);
					this.onRsvp.emit(updated);
				}
				else {
					throw ("RSVP request failed");
				}
			}
			else {
				throw ("Missing invitation information");
			}
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	async denyRsvp(): Promise<void> {
		try {
			if (this.service.isEmpty(this.attendee) === false) {
				this.attendee.rsvp = false;
				let accessToken = await this.service.getAccessToken()
				if (this.service.isEmpty(accessToken)) {
					throw ("Access Denied.");
				}

				let updated = await this.service.updateMeetingAttendee(this.attendee, accessToken);
				if (this.service.isEmpty(updated) === false) {
					let alert = new MaterialAlertMessageType();
					alert.title = "SUCCESS";
					alert.message = "Your RSVP was sent. All meeting attendees will be notified, you are not attending.";
					this.service.openAlert(alert);
					this.onRsvp.emit(updated);
				}
				else {
					throw ("RSVP request failed");
				}
			}
			else {
				throw ("Missing invitation information");
			}
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	meetingDetails() {
		let dialogRef = this.matDialog.open(MeetingDetailsComponent, {
			id: 'meeting-details-component',
			width: '90%',
			height: '80%',
			data: this.meeting
		});

		dialogRef.afterClosed().subscribe(() => {
		});
	}
}