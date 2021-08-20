import { Component, Input, Output, EventEmitter, Inject, AfterViewInit, ViewChild, NgZone } from '@angular/core';
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
	IdDto,
	ListItemType,
} from "../../models/index";

import { Service } from "../../services/index";
import { MaterialAlertComponent } from "../../components/index";

@Component({
	templateUrl: 'my-employers.page.html'
})
export class MyEmployersPage {
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		public service: Service,
		private ngZone: NgZone,
	) {
	}

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		if (this.service.isEmpty(this.service.employers)) {
			this.refresh();
		}
		else {
			this.employers = this.service.employers;
		}
	}

	loading: boolean;

	listItems: Array<ListItemType>;
	_employers: Array<CompanyProfileDto>;
	get employers(): Array<CompanyProfileDto> {
		return this._employers;
	}
	set employers(value: Array<CompanyProfileDto>) {
		this._employers = value;
		if (this.service.isEmpty(value) === false) {
			this.listItems = new Array<ListItemType>();
			value.forEach((item) => {
				let listItem = new ListItemType();
				listItem.imgSrc = this.service.isEmpty(item.logoFilename) ? this.service.defaultAvatar
					: this.service.pbxContentUrl + item.companyProfileId.toString() + "/" + item.logoFilename + "?" + Date.now().toString();
				listItem.title = item.companyName;
				listItem.id = item.companyProfileId.toString();
				this.listItems.push(listItem);
			});
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

	async refresh(): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			this.getEmployersFromServer(accessToken);
		}
		catch (e) {
			console.log("my-employers.page.ts refresh() error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = "<p>Unable to refresh list.</p>";
			this.service.openAlert(alert);
		}
	}

	getEmployersFromServer(accessToken: string): Promise<Array<CompanyProfileDto>> {
		return new Promise<Array<CompanyProfileDto>>((resolve, reject) => {
			this.loading = true;
			let idDto = new IdDto();
			idDto.id = this.service.profile.memberId;
			this.service.getEmployeeCompanies(idDto, accessToken)
				.then((employers: Array<CompanyProfileDto>) => {
					this.service.employers = employers;
					this.employers = employers;
					resolve(employers);
				})
				.catch((error) => {
					reject(error);
				})
				.then(() => {
					this.loading = false;
				})
		})
	}
}