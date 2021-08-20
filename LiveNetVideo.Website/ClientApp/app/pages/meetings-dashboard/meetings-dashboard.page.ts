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
import {
} from '../../models/index';

@Component({
	templateUrl: './meetings-dashboard.page.html',
	styleUrls: ['./meetings-dashboard.page.scss'],
})

export class MeetingsDashboardPage {
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

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		this.service.isMember()
			.then((isMember) => {
				this.isMember = isMember;
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

	gotoMeetingsPage() {
		this.router.navigate(['/meetings'], { relativeTo: this.activatedRoute });
	}

	gotoManageMeetingsPage() {
		this.router.navigate(['/manage-meetings'], { relativeTo: this.activatedRoute });
	}

	gotoMeetingInvitesPage() {
		this.router.navigate(['/meeting-invites'], { relativeTo: this.activatedRoute });
	}

	gotoCreateMeetingPage() {
		this.router.navigate(['/create-meeting'], { relativeTo: this.activatedRoute });
	}

	gotoPastMeetingsPage() {
		this.router.navigate(['/past-meetings'], { relativeTo: this.activatedRoute });
	}
}