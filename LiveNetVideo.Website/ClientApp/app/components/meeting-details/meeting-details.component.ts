import {
	Component, AfterViewInit, ViewChild, NgZone, Input, Output, EventEmitter, Inject, Optional
} from '@angular/core';
import * as moment from 'moment';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatListOption, MatList, MatSelectionList } from '@angular/material';
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
	selector: 'meeting-details',
	templateUrl: 'meeting-details.component.html',
	styleUrls: ['./meeting-details.component.scss'],
})
export class MeetingDetailsComponent {
	// NOTE: this component is ment as a list item for summary information.

	constructor(
		private service: Service,
		private matDialog: MatDialog,

		public route: ActivatedRoute,
		public router: Router,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		this.allowAttend = false;
	}

	@Input('meeting') inputMeeting: MeetingDto;

	_meeting: MeetingDto;
	get meeting(): MeetingDto {
		return this._meeting;
	}
	set meeting(value: MeetingDto) {
		this._meeting = value;
		if (this.service.isEmpty(value) === false) {
			this.allowAttend = this.service.canEnterMeetingTime(value);

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
			this.link = this.service.baseUrl + "dist/#/meeting/" + value.meetingId.toString()
		}
	}

	meetingId: number;
	title: string;
	description: string;
	fullDescription: string;
	meetDateTime: string;
	duration: string;
	isPrivate: string;
	allowAttend: boolean;
	link: string;
	attendees: Array<MeetingAttendeeDto>;

	ngOnInit() {
		if (this.service.isEmpty(this.data) === false && this.data.hasOwnProperty('meetingId')) {
			this.meeting = this.data;
		}
		else {
			this.meeting = this.inputMeeting;
		}

		if (this.service.isEmpty(this.meeting) === false) {
			this.attendees = this.meeting.meetingAttendees;
		}
	}

	close() {
		let dialog = this.matDialog.getDialogById('meeting-details-component');
		dialog.close();
	}

	//deleteMeeting(): void {
	//    // confirm before performing delete
	//    let alert = new MaterialActionAlertMessageType();
	//    alert.title = "Please Confirm";
	//    alert.message = '<p>Are you sure you want to delete this meeting?</p>';
	//    alert.noButton = "Cancel";
	//    alert.yesButton = "Delete";

	//    let dialogRef = this.matDialog.open(MaterialActionAlertComponent, {
	//        width: '80%',
	//        height: '80%',
	//        data: alert
	//    });

	//    dialogRef.afterClosed().subscribe(() => {
	//        if (alert.doAction === true) {
	//            this.onMeetingDeleted.emit(this.inputMeeting);
	//        }
	//    });
	//}
}