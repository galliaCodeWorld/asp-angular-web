import { Component, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
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
	FormsErrorMessageType,
	FormErrorTypeEnum,
} from '../../models/index';
import { FormAddAttendeeComponent } from '../../components/index';
import { dateValidator } from "../../validators/date.validator";
@Component({
	templateUrl: './create-meeting.page.html',
	styleUrls: ['./create-meeting.page.scss'],
})

export class CreateMeetingPage {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		private fb: FormBuilder,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,

	) {
		this.loading = true;
		this.createForms();
		this.attendees = new Array<MeetingAttendeeDto>();

		this.meetHourErrorMessage = new FormsErrorMessageType();
		this.meetMinuteErrorMessage = new FormsErrorMessageType();
		this.meetHourErrorMessage.errorTypeName = FormErrorTypeEnum.pattern;
		this.meetHourErrorMessage.displayValue = "Please enter a number between 1 and 12";
		this.meetMinuteErrorMessage.errorTypeName = FormErrorTypeEnum.pattern;
		this.meetMinuteErrorMessage.displayValue = "Please enter a number between 0 and 59";
	}

	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;

	loading: boolean;
	isMember: boolean;
	isLoggedIn: boolean;

	meetHourErrorMessage: FormsErrorMessageType;
	meetMinuteErrorMessage: FormsErrorMessageType;

	formCreateMeeting: FormGroup;
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
		this.service.isCheckedIntoHubConnection();
		this.service.isMember()
			.then((isMember) => {
				this.isMember = isMember;
			})
			.catch((e) => {
				console.log("member check error: ", e);
			})
			.then(() => {
				this.loading = false;
			});
		this.isLoggedIn = this.service.isLoggedIn;

		//// Uncomment for testing with meetingAttendees generated
		//for (let i = 1; i < 10; i++) {
		//	let attendee = new MeetingAttendeeDto();
		//	attendee.name = "Name" + i.toString();
		//	attendee.email = "e" + i.toString() + "@lvc.com";
		//	attendee.memberId = null;
		//	this.attendees.push(attendee);
		//}
	}

	ngAfterViewInit() {
		this.ngZone.run(() => {
			setTimeout(() => {
				if (window.innerWidth < 500) {
					this._container.close();
				}
				else {
					this._container.open();
				}
			}, 250);
		});
	}

	createForms() {
		this.formCreateMeeting = this.fb.group({
			title: new FormControl('', [
				Validators.maxLength(200),
				Validators.minLength(2),
				Validators.required
			]),
			description: new FormControl('', [
				Validators.maxLength(4000)
			]),
			meetDate: new FormControl('', [
				dateValidator,
				Validators.required
			]),
			meetHour: new FormControl('', [
				Validators.required,
				Validators.pattern('^[0-9]{1,2}$'),
				Validators.max(12),
				Validators.min(1)
			]),
			meetMinute: new FormControl('', [
				Validators.required,
				Validators.pattern('^[0-9]{1,2}$'),
				Validators.max(59),
				Validators.min(0)
			]),
			isPrivate: new FormControl(true, [
				Validators.required
			]),
			isPm: new FormControl(true, [
				Validators.required
			]),
			meetLength: new FormControl('', [
				Validators.pattern('^[0-9]{1,3}$'),
				Validators.required
			])
		})
	}

	async submit(event: MouseEvent): Promise<void> {
		let originalContent: string;
		try {
			if (this.formCreateMeeting.valid) {
				let title = this.formCreateMeeting.get('title').value;
				let description = this.formCreateMeeting.get('description').value;
				let meetDateStr = this.formCreateMeeting.get('meetDate').value;
				let meetLength: number = Number(this.formCreateMeeting.get('meetLength').value);
				let isPrivate = this.formCreateMeeting.get('isPrivate').value;
				let meetHour: number = Number(this.formCreateMeeting.get('meetHour').value);
				let meetMinute: number = Number(this.formCreateMeeting.get('meetMinute').value);
				let isPm = this.formCreateMeeting.get('isPm').value;

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
					throw ("Unable to get access at this time, please try again later.")
				}

				let meetingDto = new MeetingDto();
				meetingDto.title = title;
				meetingDto.description = description;
				meetingDto.meetLength = meetLength;
				meetingDto.isPrivate = isPrivate;
				meetingDto.memberId = this.service.profile.memberId;

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

				let meetDate: moment.Moment = moment(meetDateStr).add(minutes, 'm');
				console.log("meetDate: ", meetDate);
				let currentDate: moment.Moment = moment();
				console.log("currentDate: ", currentDate);
				if (currentDate > meetDate) {
					//console.log("in the past");
					throw ("The meeting must be set in the future. Please choose a meeting date and time that is in the future.");
				}

				meetingDto.meetDate = meetDate.toDate();

				if (isPrivate && this.service.isEmpty(this.attendees) === false) {
					// if the meeting is private and we have attendees,
					// add them to the model
					meetingDto.meetingAttendees = this.attendees;
				}

				//submit the the meetingDto
				let meeting: MeetingDto;
				try {
					meeting = await this.service.createMeeting(meetingDto, accessToken)
				}
				catch (e) {
					console.log("e: ", e);
					throw ("An error occured while trying to create your meeting.");
				}

				if (this.service.isEmpty(meeting) === false) {
					this.router.navigate(['/manage-meetings'], { relativeTo: this.activatedRoute });
				}
				else {
					throw ("Error on server. Can not verify the creation of your meeting.")
				}

				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
			}
			else {
				throw ("Please make sure the form is filled out and any error messages are fixed.");
			}
		}
		catch (e) {
			if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
				(<Element>event.target).innerHTML = originalContent;
				(<Element>event.target).removeAttribute("disabled");
			}
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	deleteMeetingAttendee(meetingAttendee: MeetingAttendeeDto) {
		//console.log("deleteMeetingAttendee: ", meetingAttendee);
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