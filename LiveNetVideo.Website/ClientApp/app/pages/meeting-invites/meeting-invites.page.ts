import { Component, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatListOption, MatList, MatSelectionList } from '@angular/material';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,
	AbstractControl
} from '@angular/forms';

import { Service } from '../../services/index';
import { MeetingDto, StringIdDto, MeetingAttendeeDto, OrderByDto } from '../../models/index';

@Component({
	templateUrl: './meeting-invites.page.html',
	styleUrls: ['./meeting-invites.page.scss'],
})

export class MeetingInvitesPage {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
	) {
		this.loading = true;
		this.meetings = new Array<MeetingDto>();
	}

	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;

	loading: boolean;
	isMember: boolean;
	isLoggedIn: boolean;
	meetings: Array<MeetingDto>;
	email: string;

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();

		this.email = this.service.email;
		this.service.isMember()
			.then((isMember) => {
				this.isMember = isMember;
			})
			.then(() => {
				return this.service.getAccessToken();
			})
			.then((accessToken: string) => {
				let dto: StringIdDto = new StringIdDto();
				dto.id = this.email;
				let orderBy = new OrderByDto();
				orderBy.column = "MeetDate";
				orderBy.direction = "DESC";
				dto.orderBy = [orderBy];
				// grab all meetings that is user has not rsvp (accept or deny)
				return this.service.getMeetingsByAttendeeEmail(dto, accessToken);
			})
			.then((meetings: Array<MeetingDto>) => {
				this.meetings = meetings;
			})
			.catch((e) => {
				console.log("error while trying to get meeting invites: ", e);
			})
			.then(() => {
				this.loading = false;
				console.log("this.meeting: ", this.meetings);
			});
		this.isLoggedIn = this.service.isLoggedIn;
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

	updateInvites(meetingAttendee: MeetingAttendeeDto): void {
		let index = this.meetings.findIndex((value) => {
			return value.meetingId == meetingAttendee.meetingId;
		})

		if (index > -1) {
			this.ngZone.run(() => {
				this.meetings.splice(index, 1);
			})
		}
	}

	gotoMeetingsDashboardPage() {
		this.router.navigate(['/meetings-dashboard'], { relativeTo: this.activatedRoute });
	}
}