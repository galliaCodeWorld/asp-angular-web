import { Component, Input, Output, EventEmitter, Inject, NgZone, AfterViewInit, ViewChild } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

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
	CompanyProfileDto,
	PbxLineDto,
	IdDto,
} from "../../models/index";

import { Service } from "../../services/index";

@Component({
	templateUrl: 'company-profile.page.html'
})

export class CompanyProfilePage {
	constructor(
		private service: Service,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
	) {
	}

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		this.activatedRoute.paramMap.subscribe((params) => {
			let companyProfileId = Number(params.get('companyProfileId'));
			if (this.service.isEmpty(companyProfileId) === false) {
				(async () => {
					await this.init(companyProfileId);
				}).bind(this)();
			}
			else {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = "Unable to load company profile. Missing the companies id."
				this.service.openAlert(alert);
			}
		});
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

	companyImgSrc: string;
	companyName: string;
	companyDescription: string;
	companyProfileId: number;

	loading: boolean;

	set companyProfile(value: CompanyProfileDto) {
		if (this.service.isEmpty(value) === false) {
			this.companyName = value.companyName;
			this.companyDescription = value.description;
			this.companyImgSrc = this.service.isEmpty(value.logoFilename) ? this.service.defaultAvatar
				: this.service.pbxContentUrl + value.companyProfileId.toString() + "/" + value.logoFilename + "?" + Date.now().toString();
			this.companyProfileId = value.companyProfileId;
		}
	}

	pbxlines: Array<PbxLineDto>;

	async init(companyProfileId: number): Promise<void> {
		try {
			this.loading = true;
			let accessToken = await this.service.getAccessToken();
			if (this.service.isEmpty(accessToken)) {
				throw ("Unable to request access. Please try again later.")
			}

			let companyProfile: CompanyProfileDto;
			try {
				companyProfile = await this.service.getCompanyProfileById(companyProfileId, accessToken);
				this.companyProfile = companyProfile;
			}
			catch (e) {
				throw ("Unable to request profile. Please try again later.")
			}

			if (this.service.isEmpty(companyProfile)) {
				throw ("Unable to retrieve profile.")
			}

			let idDto = new IdDto();
			idDto.id = companyProfile.companyProfileId;
			let pbxlines: Array<PbxLineDto>;
			try {
				pbxlines = await this.service.getPbxLinesByCompanyProfileId(idDto, accessToken);
				this.pbxlines = pbxlines;
				//console.log("pbxlines: ", this.pbxlines);
			}
			catch (e) {
				let alert = new MaterialAlertMessageType();
				alert.title = "Notice:";
				alert.message = "Sorry, unable to grab the Pbx Lines for this company";
				setTimeout(() => { this.service.openAlert(alert); });
			}

			this.loading = false;
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			setTimeout(() => { this.service.openAlert(alert); });
		}

		return;
	}
}