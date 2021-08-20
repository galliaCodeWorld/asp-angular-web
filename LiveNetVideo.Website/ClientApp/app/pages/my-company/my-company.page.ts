import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { MatDialogRef, MatDialog } from '@angular/material';

import { Router, ActivatedRoute } from '@angular/router';
import {
	Service
} from '../../services/index';

import {
	MaterialAlertMessageType, CompanyProfileDto, CompanyLocationDto,
} from '../../models/index'
import { FormCreateCompanyComponent } from '../../components/index';

@Component({
	templateUrl: 'my-company.page.html'
})
export class MyCompanyPage {
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		public service: Service,
		private matDialog: MatDialog,
		private ngZone: NgZone,
	) {
	}

	companyLogoDataUri: string;

	_companyProfile: CompanyProfileDto;
	get companyProfile(): CompanyProfileDto {
		return this._companyProfile;
	}
	set companyProfile(value: CompanyProfileDto) {
		this._companyProfile = value;
	}
	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		if (this.service.isEmpty(this.service.companyProfile)) {
			let accessToken: string = "";
			this.service.getAccessToken()
				.then((token: string) => {
					accessToken = token;
					return this.retrieveCompanyProfile(accessToken)
				})
				.then(() => {
					if (this.service.isEmpty(this.service.companyProfile) === false) {
						this.companyProfile = this.service.companyProfile;
					}
				})
				.catch((error) => {
					let alert = new MaterialAlertMessageType();
					alert.title = "Warning";
					alert.message = error;
					this.service.openAlert(alert);
				})
		}
		else {
			this.companyProfile = this.service.companyProfile;
		}
	}
	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;
	ngAfterViewInit() {
		this.service.checkAndDisplayFlashMessage();
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

	retrieveCompanyProfile(accessToken: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.service.getMembersCompanyProfile(this.service.profile.memberId, accessToken)
				.then((companyProfile: CompanyProfileDto) => {
					console.log("companyProfile: ", companyProfile);
					if (this.service.isEmpty(companyProfile) === false) {
						return this.service.retrieveAndSetCompanyInformation(this.service.companyProfile, accessToken);
					}
					resolve();
				})
				.catch((error) => {
					reject(error);
				})
				.then(() => {
					resolve();
				})
		})
	}

	async openCreateCompanyModal(): Promise<void> {
		try {
			let accessToken = await this.service.getAccessToken();
			if (this.service.isEmpty(accessToken)) {
				throw ("Request denied, unable to get authorization at this time, please try your request again.");
			}
			let dialogRef = this.matDialog.open(FormCreateCompanyComponent, {
				width: '80%',
				height: '80%'
			});

			dialogRef.componentInstance.onCreateCompany.subscribe(async (company: CompanyProfileDto) => {
				dialogRef.componentInstance.showProgress = true;

				let companyProfileDto: CompanyProfileDto;
				try {
					company.memberId = this.service.profile.memberId;
					companyProfileDto = await this.service.createCompanyProfile(company, accessToken);
				}
				catch (e) {
					console.log("error creating company profile: ", e);
					throw ("Unable to create company profile, please try again later.");
				}

				if (this.service.isEmpty(companyProfileDto)) {
					throw ("Unable to retrieve company profile.");
				}

				let updatedCompanyProfileDto: CompanyProfileDto;
				try {
					if (this.service.isEmpty(this.companyLogoDataUri) === false) {
						updatedCompanyProfileDto = await this.service.addCompanyProfileImage(this.companyLogoDataUri, companyProfileDto.companyProfileId, accessToken);
					}
				}
				catch (e) {
					console.log("error occurred while trying to add logo for company profile: ", e);
				}

				try {
					await this.retrieveCompanyProfile(accessToken);
				}
				catch (e) {
					console.log("Error occured while trying to retrieve company profile");
				}

				this.companyProfile = this.service.companyProfile;
				console.log("done creating company profile: ", this.companyProfile);

				dialogRef.close();
			});

			dialogRef.componentInstance.onAddCompanyLogo.subscribe((dataUri: string) => {
				//console.log("dataUri: ", dataUri);
				//this.image = dataUri;
				this.companyLogoDataUri = dataUri;
			});

			dialogRef.afterClosed().subscribe(() => {
				dialogRef.componentInstance.onCreateCompany.unsubscribe();
				dialogRef.componentInstance.onAddCompanyLogo.unsubscribe();
			});
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}
}