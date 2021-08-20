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
	selector: 'meeting-item',
	templateUrl: 'meeting-item.component.html',
	styleUrls: ['./meeting-item.component.scss'],
})
export class MeetingItemComponent {
	// NOTE: this component is ment as a list item for summary information.

	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public route: ActivatedRoute,
		public router: Router,
	) {
		this.canDelete = false;
		this.canEdit = false;
		this.canAttend = false;
		this.attendees = new Array<MeetingAttendeeDto>();
	}

	@Input('meeting') inputMeeting: MeetingDto;
	@Output() onMeetingDeleted: EventEmitter<MeetingDto> = new EventEmitter<MeetingDto>();

	_meeting: MeetingDto;
	get meeting(): MeetingDto {
		return this._meeting;
	}
	set meeting(value: MeetingDto) {
		this._meeting = value;
		if (this.service.isEmpty(value) === false) {
			//console.log("actual: ", moment(value.meetDate).toDate());
			//console.log("early: ", moment(value.meetDate).subtract(15, 'm').toDate());
			//console.log("now: ", new Date());

			//let currentDate: Date = new Date();
			//let meetingMoment: moment.Moment = moment(value.meetDate)
			//if (
			//	meetingMoment.subtract(15, 'm').toDate() <= currentDate
			//	&& currentDate <= meetingMoment.add(value.meetLength + 15, 'm').toDate()
			//) {
			//	this.canAttend = true;
			//}

			this.canAttend = this.service.canEnterMeetingTime(value);

			this.canDelete = value.memberId.toString() === this.service.memberId ? true : false;
			this.canEdit = value.memberId.toString() === this.service.memberId ? true : false;

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

			//console.log("meetDate: " + value.title, value.meetDate);

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
	canAttend: boolean;
	canEdit: boolean;
	canDelete: boolean;

	attendees: Array<MeetingAttendeeDto>;

	ngOnInit() {
		this.meeting = this.inputMeeting;
		this.attendees = this.meeting.meetingAttendees;
	}

	deleteMeeting(): void {
		// confirm before performing delete
		let alert = new MaterialActionAlertMessageType();
		alert.title = "Please Confirm";
		alert.message = '<p>Are you sure you want to delete this meeting?</p>';
		alert.noButton = "Cancel";
		alert.yesButton = "Delete";

		let dialogRef = this.matDialog.open(MaterialActionAlertComponent, {
			width: '80%',
			height: '80%',
			data: alert
		});

		dialogRef.afterClosed().subscribe(() => {
			if (alert.doAction === true) {
				this.service.getAccessToken()
					.then((accessToken: string) => {
						return this.service.deleteMeeting(this.inputMeeting.meetingId, accessToken);
					})
					.then((message: string) => {
						this.onMeetingDeleted.emit(this.inputMeeting);
					})
					.catch((e) => {
						let alert = new MaterialAlertMessageType();
						alert.title = "Error";
						alert.message = "Unable to delete meeting.";
						this.service.openAlert(alert);
					})
			}
		});
	}

	editMeeting() {
		let dialogRef = this.matDialog.open(FormEditMeetingComponent, {
			id: 'form-edit-meeting',
			width: '90%',
			height: '80%',
			data: this.meeting
		});

		dialogRef.componentInstance.onEditMeetingComplete.subscribe((meeting: MeetingDto) => {
			this.meeting = meeting;
			//this.setGui(phoneContact);
			dialogRef.close();
		});

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onEditMeetingComplete.unsubscribe();
		});
	}

	gotoMeeting() {
		this.router.navigate(['/meeting', this.meeting.meetingId], { relativeTo: this.route });
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