import { Component, AfterViewInit, ViewChild, NgZone, Input, Output, EventEmitter, Inject, Optional } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatListOption, MatList, MatSelectionList } from '@angular/material';
import * as moment from 'moment';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,
	AbstractControl
} from '@angular/forms';

import { Service } from '../../services/index';
import {
	MemberType,
	MeetingDto,
	MeetingAttendeeDto,
	MaterialAlertMessageType,
	KeyValueType,
} from '../../models/index';
import { FormAddAttendeeComponent } from '../../components/index';
import { dateValidator } from "../../validators/date.validator";
@Component({
	templateUrl: './form-edit-meeting.component.html',
	styleUrls: ['./form-edit-meeting.component.scss'],
})

export class FormEditMeetingComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		private fb: FormBuilder,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,

	) {
		this.showProgress = false;
		this.loading = true;
		this.attendees = new Array<MeetingAttendeeDto>();
	}

	@Input('showProgress') showProgress: boolean;
	@Input('meeting') inputMeeting: MeetingDto;

	@Output() onEditMeetingComplete: EventEmitter<MeetingDto> = new EventEmitter<MeetingDto>();

	loading: boolean;

	_meeting: MeetingDto;
	get meeting(): MeetingDto {
		return this._meeting;
	}

	set meeting(value: MeetingDto) {
		this._meeting = value;
	}

	formGroup: FormGroup;

	attendees: Array<MeetingAttendeeDto>;

	lengths: Array<KeyValueType> = [
		{ 'key': '15 Minutes', 'value': 15 },
		{ 'key': '30 Minutes', 'value': 30 },
		{ 'key': '45 Minutes', 'value': 45 },
		{ 'key': '1 Hour', 'value': 60 },
		{ 'key': '1 Hr 15 Min', 'value': 75 },
		{ 'key': '1 Hr 30 Min', 'value': 90 },
		{ 'key': '1 Hr 45 Min', 'value': 105 },
		{ 'key': '2 Hr', 'value': 120 },
		{ 'key': '2 Hr 30 Min', 'value': 150 },
		{ 'key': '3 Hr', 'value': 180 },
		{ 'key': '3 Hr 30 Min', 'value': 210 },
		{ 'key': '4 Hr', 'value': 240 },
		{ 'key': '5 Hr', 'value': 300 },
		{ 'key': '6 Hr', 'value': 360 }
	];

	ngOnInit() {
		// get meetingDto from data object or from input attribute
		if (this.service.isEmpty(this.data) === false && this.data.hasOwnProperty('meetingId')) {
			this.meeting = this.data;
		}
		else {
			this.meeting = this.inputMeeting;
		}

		if (this.service.isEmpty(this.meeting) === false) {
			this.attendees = this.meeting.meetingAttendees;
		}

		//console.log("this.meeting: ", this.meeting);

		this.createForm();
		this.loading = false;
	}

	ngAfterViewInit() {
	}

	createForm() {
		let meetingDateTime = moment(this.meeting.meetDate);
		let meetDate: string = meetingDateTime.format('M/D/YYYY');
		let hours: number = meetingDateTime.hours();
		let meetHour: string = hours > 12 ? (hours - 12).toString() : (hours === 0 ? "12" : hours.toString());
		let meetMinute: string = meetingDateTime.minutes().toString();
		let isPm: boolean = hours >= 12;
		//console.log("dateTime: ", meetingDateTime.toString());
		//console.log("meetDate: ", meetDate);
		//console.log("meetHour: ", meetHour);
		//console.log("meetMinute: ", meetMinute);
		//console.log("isPM: ", isPm);

		// TODO: the meetLength is not being pre selected in the GUI

		this.formGroup = this.fb.group({
			title: new FormControl(this.meeting.title, [
				Validators.maxLength(200),
				Validators.minLength(2),
				Validators.required
			]),
			description: new FormControl(this.meeting.description, [
				Validators.maxLength(4000)
			]),
			meetDate: new FormControl(meetingDateTime, [
				dateValidator,
				Validators.required
			]),
			meetHour: new FormControl(meetHour, [
				Validators.required,
				Validators.pattern('^[0-9]{1,2}$'),
				Validators.max(12),
				Validators.min(1)
			]),
			meetMinute: new FormControl(meetMinute, [
				Validators.required,
				Validators.pattern('^[0-9]{1,2}$'),
				Validators.max(59),
				Validators.min(0)
			]),
			isPrivate: new FormControl(this.meeting.isPrivate, [
				Validators.required
			]),
			isPm: new FormControl(isPm, [
				Validators.required
			]),
			meetLength: new FormControl(this.meeting.meetLength, [
				Validators.pattern('^[0-9]{1,3}$'),
				Validators.required
			])
		})
	}

	cancel(event: MouseEvent): void {
		console.log("cancel event: ", event);
		this.matDialog.getDialogById('form-edit-meeting').close();
	}

	async submit(event: MouseEvent): Promise<void> {
		// TODO: Encapsulate the request here, and emit updated meetingDto to client
		if (this.formGroup.valid) {
			let title = this.formGroup.get('title').value;
			let description = this.formGroup.get('description').value;
			let meetDateStr = this.formGroup.get('meetDate').value;
			let meetLength: number = Number(this.formGroup.get('meetLength').value);
			let isPrivate = this.formGroup.get('isPrivate').value;
			let meetHour: number = Number(this.formGroup.get('meetHour').value);
			let meetMinute: number = Number(this.formGroup.get('meetMinute').value);
			let isPm = this.formGroup.get('isPm').value;

			let originalContent: string;
			try {
				if (this.service.isEmpty(event) === false) {
					originalContent = (<Element>event.target).innerHTML;
					(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i> Please Wait';
					(<Element>event.target).setAttribute("disabled", "true");
				}

				let accessToken: string;
				try {
					accessToken = await this.service.getAccessToken();
				}
				catch (e) {
					throw ("Unable to get access at this time, please try again.")
				}

				try {
					this.meeting.title = title;
					this.meeting.description = description;
					this.meeting.meetLength = meetLength;
					this.meeting.isPrivate = isPrivate;

					let minutes: number;

					if (this.service.isEmpty(isPm) === false) {
						meetHour = meetHour < 12 ? meetHour + 12 : meetHour;
						minutes = (meetHour * 60);
					}
					else if (meetHour < 12) {
						minutes = (meetHour * 60);
					}
					else {
						minutes = 0;
					}

					minutes = minutes + meetMinute;

					let meetDate: Date = moment(meetDateStr).add(minutes, 'm').toDate();
					this.meeting.meetDate = meetDate;

					if (isPrivate && this.service.isEmpty(this.attendees) === false) {
						// if the meeting is private and we have attendees,
						// add them to the model
						this.meeting.meetingAttendees = this.attendees;
					}
					else {
						this.meeting.meetingAttendees = null;
					}

					//console.log("this.meeting: ", this.meeting);

					//submit the the meetingDto
					let meeting: MeetingDto;
					try {
						meeting = await this.service.updateMeeting(this.meeting, accessToken)
						if (this.service.isEmpty(meeting) === false) {
							this.onEditMeetingComplete.emit(meeting);
							let alert = new MaterialAlertMessageType();
							alert.title = "SUCCESS";
							alert.message = "Your meeting has been updated."
							this.service.openAlert(alert);
						}
						else {
							throw ("Unknown error. Failed to update meeting.")
						}
					}
					catch (e) {
						console.log("e: ", e);
						throw ("Error: unable to create meeting. ");
					}

					if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
						(<Element>event.target).innerHTML = originalContent;
						(<Element>event.target).removeAttribute("disabled");
					}
				}
				catch (e) {
					console.log("error: ", e);
					throw ("An error occured while trying to create the meeting.");
				}
			}
			catch (e) {
				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e;
				this.service.openAlert(alert);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
			return;
		}
	}

	deleteMeetingAttendee(meetingAttendee: MeetingAttendeeDto) {
		let index: number = this.attendees.findIndex((value) => {
			// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
			return value.email == meetingAttendee.email;
		})
		if (index > -1) {
			this.attendees.splice(index, 1);
		}
	}

	openFormAddAttendee() {
		this.service.getAccessToken()
			.then((accessToken: string) => {
				let dialogRef = this.matDialog.open(FormAddAttendeeComponent, {
					id: 'form-add-attendee',
					width: '80%',
					height: '80%',
					data: accessToken
				});

				dialogRef.componentInstance.onAddAttendee.subscribe((meetingAttendee: MeetingAttendeeDto) => {
					meetingAttendee.meetingId = this.meeting.meetingId;
					this.attendees.unshift(meetingAttendee);
					dialogRef.close();
				});

				dialogRef.afterClosed().subscribe(() => {
					dialogRef.componentInstance.onAddAttendee.unsubscribe();
				});
			})
	}

	gotoMeetingsDashboardPage() {
		this.router.navigate(['/meetings-dashboard'], { relativeTo: this.activatedRoute });
	}
}