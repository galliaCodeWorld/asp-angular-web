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
	SearchTermDto,
	CountryDto,
	MaterialAlertMessageType,
	CompanyProfileDto,
	ListItemType,
	LocationSearchDto,
} from '../../models/index';

@Component({
	templateUrl: 'company-search.page.html',
	styleUrls: ['./company-search.page.scss'],
})

export class CompanySearchPage {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
	) {
		this.showResults = false;
		this.loading = true;
		this.createForms();
		this.showSearchForm = true;
	}

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		try {
			(async () => {
				this.loading = true;
				let accessToken: string;
				try {
					accessToken = await this.service.getAccessToken();
				}
				catch (e) {
					throw ("Unable to get access at this time, please try again later.")
				}

				this.countries = await this.service.getCountryIsoCodes(accessToken);
				//console.log("countries: ", this.countries);

				this.loading = false;
			}).bind(this)();
		}
		catch (e) {
			this.loading = false;
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
		}
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

	showResults: boolean;
	showSearchForm: boolean;

	loading: boolean;

	countries: Array<CountryDto>;

	profiles: Array<ListItemType>;

	set companyProfiles(value: Array<CompanyProfileDto>) {
		if (this.service.isEmpty(value)) {
			this.profiles = null;
		}
		else {
			this.profiles = new Array<ListItemType>();
			value.forEach((v) => {
				let item = new ListItemType();
				item.id = v.companyProfileId.toString();
				item.imgSrc = this.service.isEmpty(v.logoFilename) ? this.service.defaultAvatar
					: this.service.pbxContentUrl + v.companyProfileId.toString() + "/" + v.logoFilename + "?" + Date.now().toString();
				item.title = v.companyName;
				item.content = v.description;
				this.profiles.push(item);
			});
		}
	}
	nameSearchForm: FormGroup;
	locationSearchForm: FormGroup;

	createForms() {
		this.nameSearchForm = this.fb.group({
			name: new FormControl('', [
				Validators.maxLength(300),
				Validators.required
			])
		});

		this.locationSearchForm = this.fb.group({
			address: new FormControl('', [
				Validators.maxLength(300)
			]),
			city: new FormControl('', [
				Validators.maxLength(300)
			]),
			region: new FormControl('', [
				Validators.maxLength(300)
			]),
			countryIsoCode: new FormControl('US', [
				Validators.maxLength(2)
			])
		})
	}

	async searchByName(event: MouseEvent): Promise<void> {
		if (this.nameSearchForm.valid) {
			let originalContent: string;
			try {
				if (this.service.isEmpty(event) === false) {
					originalContent = (<Element>event.target).innerHTML;
					(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i> Searching';
					(<Element>event.target).setAttribute("disabled", "true");
				}

				let name = this.nameSearchForm.get('name').value;
				let accessToken: string;
				try {
					accessToken = await this.service.getAccessToken();
				}
				catch (e) {
					throw ("Unable to get access at this time, please try again.")
				}

				try {
					let search = new SearchTermDto();
					search.term = name;
					this.companyProfiles = await this.service.searchCompanyProfilesByName(search, accessToken);
					if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
						(<Element>event.target).innerHTML = originalContent;
						(<Element>event.target).removeAttribute("disabled");
					}
					this.showResults = true;
					this.showSearchForm = false;
				}
				catch (e) {
					console.log("error:", e);
					throw ("An error occured while trying to search companies");
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

	async searchByLocation(event: MouseEvent): Promise<void> {
		if (this.locationSearchForm.valid) {
			let originalContent: string;
			try {
				if (this.service.isEmpty(event) === false) {
					originalContent = (<Element>event.target).innerHTML;
					(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i> Searching';
					(<Element>event.target).setAttribute("disabled", "true");
				}

				let address = this.locationSearchForm.get('address').value;
				let city = this.locationSearchForm.get('city').value;
				let region = this.locationSearchForm.get('region').value;
				let countryCode = this.locationSearchForm.get('countryIsoCode').value;
				let accessToken: string;
				try {
					accessToken = await this.service.getAccessToken();
				}
				catch (e) {
					throw ("Unable to get access at this time, please try again.")
				}

				try {
					let search = new LocationSearchDto();
					search.address = address;
					search.city = city;
					search.region = region;
					search.countryIsoCode = countryCode;
					this.companyProfiles = await this.service.searchCompanyProfilesByLocation(search, accessToken);
					if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
						(<Element>event.target).innerHTML = originalContent;
						(<Element>event.target).removeAttribute("disabled");
					}
					this.showResults = true;
					this.showSearchForm = false;
				}
				catch (e) {
					console.log("error:", e);
					throw ("An error occured while trying to search companies");
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

	gotoCompanyProfile(companyProfileId: number): void {
		//console.log("id: ", companyProfileId);
		this.router.navigate(['/company-profile', companyProfileId], { relativeTo: this.activatedRoute });
	}
}