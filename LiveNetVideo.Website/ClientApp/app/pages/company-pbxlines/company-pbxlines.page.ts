import { Component, Input, Output, EventEmitter, Inject, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

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
	PbxLineDto,
	IdDto,
} from "../../models/index";

import { Service } from "../../services/index";

@Component({
	templateUrl: 'company-pbxlines.page.html'
})

export class CompanyPbxlinesPage {
	constructor(
		private service: Service,
		private ngZone: NgZone,
	) {
	}

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();

		this.service.getAccessToken()
			.then((accessToken: string) => {
				this.getPbxlinesFromServer(accessToken);
			})
			.catch((e) => {
				console.log("company-pbxlines.page.ts ngOnInit() error: ", e);
			})
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

	showGettingPbxlines: boolean;

	pbxLines: Array<PbxLineDto>;

	async refresh(): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			await this.getPbxlinesFromServer(accessToken);
		}
		catch (e) {
			console.log("company-pbxlines.page.ts refresh() error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = "Unable to refresh pbx lines.";
			this.service.openAlert(alert);
		}
	}

	getPbxlinesFromServer(accessToken: string): void {
		this.showGettingPbxlines = true;
		let dto = new IdDto();
		dto.id = this.service.companyProfile.companyProfileId;

		this.service.getPbxLinesByCompanyProfileId(dto, accessToken)
			.then((pbxLines: Array<PbxLineDto>) => {
				this.service.pbxLines = pbxLines;
				this.pbxLines = this.service.pbxLines;
			})
			.catch((error) => {
				//console.log("error: ", error);
				let alert = new MaterialAlertMessageType();
				alert.title = 'Warning';
				alert.message = "Unable to retrieve list of Pbx Lines.";
				this.service.openAlert(alert);
			})
			.then(() => {
				this.showGettingPbxlines = false;
			})
	}

	pbxlineDeleted(pbxline: PbxLineDto): void {
		this.pbxLines = this.service.pbxLines;
	}

	pbxlineUpdated(pbxline: PbxLineDto): void {
		this.pbxLines = this.service.pbxLines;
	}

	pbxlineAdded(pbxline: PbxLineDto): void {
		console.log("pbxlineAdded", pbxline);
		this.pbxLines = this.service.pbxLines;
	}
}