import { Component, Input, Output, EventEmitter, Inject, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import {
	MaterialActionAlertMessageType,
	MaterialAlertMessageType,
	CompanyProfileDto,
	PbxLineDto,
	IdDto,
	ListItemType,
	PbxLineRepDto,
	CompanyEmployeeDto,
} from "../../models/index";

import { Service } from "../../services/index";

@Component({
	templateUrl: 'employer-assigned-pbxlines.page.html'
})

export class EmployerAssignedPbxlinesPage {
	constructor(
		private service: Service,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private sanitizer: DomSanitizer,
		private ngZone: NgZone,
	) {
		this.loading = true;
		this.activatedRoute.paramMap.subscribe((params) => {
			this.companyProfileId = Number(params.get('companyProfileId'));
		});
	}

	loading: boolean;
	companyProfileId: number;

	employerImgSrc: string;
	employerName: string;

	listItems: Array<ListItemType>;

	_companyProfile: CompanyProfileDto;
	get companyProfile(): CompanyProfileDto {
		return this._companyProfile;
	}
	set companyProfile(value: CompanyProfileDto) {
		this._companyProfile = value;
		if (this.service.isEmpty(value) === false) {
			this.employerName = value.companyName;
			this.employerImgSrc = this.service.isEmpty(value.logoFilename) ? this.service.defaultAvatar
				: this.service.pbxContentUrl + value.companyProfileId.toString() + "/" + value.logoFilename + "?" + Date.now().toString();
		}
	}
	_pbxlines: Array<PbxLineDto>;
	get pbxlines(): Array<PbxLineDto> {
		return this._pbxlines;
	}
	set pbxlines(value: Array<PbxLineDto>) {
		this._pbxlines = value;
		if (this.service.isEmpty(value) === false) {
			this.listItems = new Array<ListItemType>();
			value.forEach((item) => {
				let listItem = new ListItemType();
				listItem.id = item.pbxLineId.toString();
				listItem.title = item.lineName;
				listItem.imgSrc = this.service.isEmpty(item.iconFilename) ? this.service.defaultAvatar
					: this.service.pbxContentUrl + item.companyProfileId.toString() + "/" + this.service.pbxLineImageFolder + "/" + item.iconFilename + "?" + Date.now().toString();
				this.listItems.push(listItem);
			})
		}
	}

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		this.refresh();
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

	async refresh(): Promise<void> {
		try {
			this.loading = true;
			let accessToken: string = await this.service.getAccessToken();
			let idDto = new IdDto();
			idDto.id = this.companyProfileId;
			let pbxlines: Array<PbxLineDto> = await this.service.getEmployeePbxLines(idDto, this.service.profile.memberId, accessToken)
			this.pbxlines = pbxlines;

			let company: CompanyProfileDto = await this.service.getCompanyProfileById(this.companyProfileId, accessToken);
			this.companyProfile = company;

			this.loading = false;
		}
		catch (e) {
			console.log("employer-assigned-pbxlines.page.ts refresh() error: ", e);
			this.loading = false;
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = "<p>Unable to refresh list.</p>";
			this.service.openAlert(alert);
		}
	}

	async gotoPbxline(pbxlineId: string, event: Event): Promise<void> {
		let originalContent: string;
		try {
			//console.log("event: ", event);

			if (this.service.isEmpty(event) === false) {
				originalContent = (<Element>event.target).innerHTML;
				(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
				(<Element>event.target).setAttribute("disabled", "true");
			}

			//console.log("pbxlineId: ", pbxlineId);

			let pbxline = this.pbxlines.find((p) => {
				return p.pbxLineId.toString() == pbxlineId;
			});

			if (this.service.isEmpty(pbxline) === false) {
				let accessToken: string;
				try {
					accessToken = await this.service.getAccessToken();
				}
				catch (e) {
					throw ("Unable to get access at this time. Please try again later.")
				}

				let employee: CompanyEmployeeDto;
				try {
					employee = await this.service.getCompanyEmployeeByMemberId(this.companyProfile.companyProfileId, this.service.profile.memberId, accessToken);
				}
				catch (e) {
					throw ("Unable to request your employee information for access.");
				}

				if (this.service.isEmpty(employee)) {
					throw ("Unable to get your employee information for access.");
				}

				let pbxlineRep: PbxLineRepDto;
				try {
					pbxlineRep = await this.service.getPbxLineRepByEmployeeId(employee.companyEmployeeId, pbxline.pbxLineId, accessToken);
				}
				catch (e) {
					throw ("Unable to get your Representative information");
				}

				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
				//console.log("pbxlineRep: ", pbxlineRep);

				this.router.navigate(['/rep-pbx', pbxlineRep.pbxLineRepId], { relativeTo: this.activatedRoute });
			}
			else {
				throw ("Unable to get line information.");
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
}