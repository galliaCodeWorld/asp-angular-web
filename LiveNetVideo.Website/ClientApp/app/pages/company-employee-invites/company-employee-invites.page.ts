import { Component, Input, Output, EventEmitter, Inject, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
	Router,
	ActivatedRoute
} from '@angular/router';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,

	AbstractControl
} from '@angular/forms';

import {
	MaterialActionAlertMessageType,
	MaterialAlertMessageType,
	IdDto,
	CompanyEmployeeInviteDto,
} from "../../models/index";

import { Service } from "../../services/index";

@Component({
	templateUrl: 'company-employee-invites.page.html'
})

export class CompanyEmployeeInvitesPage {
	constructor(
		public route: ActivatedRoute,
		public router: Router,
		private service: Service,
		private ngZone: NgZone,
	) {
	}

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		this.companyEmployeeInvites = this.service.companyEmployeeInvites;
		//console.log("invites: ", this.companyEmployeeInvites);
	}

	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;
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

	loading: boolean;
	companyEmployeeInvites: Array<CompanyEmployeeInviteDto>;

	async refresh(): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			await this.getCompanyEmployeeInvitesFromServer(accessToken);
		}
		catch (e) {
			console.log("company-employee-invites.page.ts refresh() error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Warning";
			alert.message = "<p>Unable to refresh invites.</p>";
			this.service.openAlert(alert);
		}
	}

	getCompanyEmployeeInvitesFromServer(accessToken: string): void {
		this.loading = true;
		let dto = new IdDto();
		dto.id = this.service.companyProfile.companyProfileId;

		this.service.getCompanyEmployeeInvitesByCompanyProfileId(dto, accessToken)
			.then((companyEmployeeInvites: Array<CompanyEmployeeInviteDto>) => {
				this.service.companyEmployeeInvites = companyEmployeeInvites;
				this.companyEmployeeInvites = this.service.companyEmployeeInvites;
			})
			.catch((error) => {
				//console.log("error: ", error);
				let alert = new MaterialAlertMessageType();
				alert.title = 'Warning';
				alert.message = "Unable to retrieve list of Pbx Lines.";
				setTimeout(() => { this.service.openAlert(alert) });
			})
			.then(() => {
				this.loading = false;
			})
	}

	companyEmployeeInviteDeleted(companyEmployeeInvite: CompanyEmployeeInviteDto): void {
		this.companyEmployeeInvites = this.service.companyEmployeeInvites;
	}

	companyEmployeeInviteUpdated(companyEmployeeInvite: CompanyEmployeeInviteDto): void {
		this.companyEmployeeInvites = this.service.companyEmployeeInvites;
	}

	companyEmployeeInviteAdded(companyEmployeeInvite: CompanyEmployeeInviteDto): void {
		this.companyEmployeeInvites = this.service.companyEmployeeInvites;
	}

	gotoCompanyEmployees(): void {
		if (this.service.isEmpty(this.service.companyProfile) === false) {
			this.router.navigate(["/company-employees", this.service.companyProfile.companyProfileId]);
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = 'Navigation Error';
			alert.message = "Unable to find your company profile.";
			setTimeout(() => { this.service.openAlert(alert) });
		}
	}
}