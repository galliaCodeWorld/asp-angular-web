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
} from "../index";
@Component({
	selector: 'meeting-attendee',
	templateUrl: 'meeting-attendee.component.html',
	styleUrls: ['./meeting-attendee.component.scss'],
})
export class MeetingAttendeeComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public route: ActivatedRoute,
		public router: Router,
	) {
		this.canDelete = true;
	}

	@Input('meetingAttendee') inputMeetingAttendee: MeetingAttendeeDto;
	@Input('canDelete') inputCanDelete: boolean;
	@Output() onMeetingAttendeeDeleted: EventEmitter<MeetingAttendeeDto> = new EventEmitter<MeetingAttendeeDto>();

	_meetingAttendee: MeetingAttendeeDto;
	get meetingAttendee(): MeetingAttendeeDto {
		return this._meetingAttendee;
	}
	set meetingAttendee(value: MeetingAttendeeDto) {
		this._meetingAttendee = value;
		if (this.service.isEmpty(value) === false) {
			this.name = value.name;
			this.email = value.email;
			if (typeof value.rsvp === "undefined" || value.rsvp === null) {
				this.rsvp = "Waiting On RSVP";
			}
			else if (value.rsvp === false) {
				this.rsvp = "Not Attending";
			}
			else if (value.rsvp === true) {
				this.rsvp = "Attending";
			}
			this.imgSrc = (this.service.isEmpty(value.member) === false && this.service.isEmpty(value.member.avatarFileName) === false) ?
				this.service.avatarBaseUrl + value.member.avatarFileName + "?" + Date.now().toString() : this.service.defaultAvatar;
		}
	}

	imgSrc: string;
	name: string;
	email: string;
	rsvp: string;
	canDelete: boolean;

	ngOnInit() {
		this.meetingAttendee = this.inputMeetingAttendee;
		//console.log("this.inputCanDelete: ", this.inputCanDelete);
		if (this.inputCanDelete === false) {
			this.canDelete = false;
		}
	}

	deleteMeetingAttendee(): void {
		// confirm before performing delete
		let alert = new MaterialActionAlertMessageType();
		alert.title = "Please Confirm";
		alert.message = '<p>Are you sure you want to delete this meeting attendee: ' + this.name + '</p>';
		//alert.message += `<p>${this.address}</p>`;
		alert.noButton = "Cancel";
		alert.yesButton = "Delete";

		let dialogRef = this.matDialog.open(MaterialActionAlertComponent, {
			width: '80%',
			height: '80%',
			data: alert
		});

		dialogRef.afterClosed().subscribe(() => {
			if (alert.doAction === true) {
				this.onMeetingAttendeeDeleted.emit(this.inputMeetingAttendee);
			}
		});
	}
}