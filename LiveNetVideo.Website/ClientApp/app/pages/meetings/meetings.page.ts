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
import { MeetingDto, IdDto, StringIdDto, OrderByDto } from '../../models/index';

@Component({
	templateUrl: './meetings.page.html',
	styleUrls: ['./meetings.page.scss'],
})

export class MeetingsPage {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
	) {
		this.loading = true;
	}

	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;

	loading: boolean;
	isMember: boolean;
	isLoggedIn: boolean;
	meetings: Array<MeetingDto>;

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();

		let accessToken: string;

		// TODO: Add paging and filtering ability feature

		this.service.isMember()
			.then((isMember) => {
				this.isMember = isMember;
			})
			.then(() => {
				return this.service.getAccessToken();
			})
			.then((token: string) => {
				accessToken = token;
				let dto = new StringIdDto();
				dto.id = this.service.email;
				let orderby = new OrderByDto();
				orderby.column = "MeetDate";
				orderby.direction = "ASC";
				dto.orderBy = [orderby];
				return this.service.getUpcomingMeetings(dto, accessToken);
			})
			.then((meetings: Array<MeetingDto>) => {
				this.meetings = meetings;
				//console.log("this.meetings: ", this.meetings);
			})
			.catch((e) => {
				console.log("error while getting upcoming meetings: ", e);
			})
			.then(() => {
				this.loading = false;
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

	gotoMeetingsDashboardPage() {
		this.router.navigate(['/meetings-dashboard'], { relativeTo: this.activatedRoute });
	}
}