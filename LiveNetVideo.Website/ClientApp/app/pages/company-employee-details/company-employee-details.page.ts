import { Component, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Service } from '../../services/index';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import {
	CompanyEmployeeDto,
	MaterialAlertMessageType,
	CompanyProfileDto,
	PbxLineDto,
	IdDto,
} from "../../models/index";

// NOTE: this page is for the public to see an employees information
// TODO: show some company information and hide the email, put list of pbx lines

@Component({
	templateUrl: 'company-employee-details.page.html',
})
export class CompanyEmployeeDetailsPage {
	constructor(
		private service: Service,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
	) {
		this.loading = true;
		this.activatedRoute.paramMap.subscribe((params) => {
			this.companyEmployeeId = Number(params.get('companyEmployeeId'));
		});
	}

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		this.loading = true;
		if (this.service.isEmpty(this.companyEmployeeId) === false) {
			this.service.getAccessToken()
				.then((accessToken: string) => {
					return this.service.getCompanyEmployeeById(this.companyEmployeeId, accessToken);
				})
				.then((employee: CompanyEmployeeDto) => {
					this.companyEmployee = employee;
				})
				.catch((error) => {
					let alert = new MaterialAlertMessageType();
					alert.title = "Error";
					alert.message = "Unable to retrieve employee information";
					setTimeout(() => {
						this.service.openAlert(alert);
					})
				})
				.then(() => {
					this.loading = false;
				})
		}
		else {
			this.loading = false;
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

	imgSrc: string;
	title: string;
	firstName: string;
	lastName: string;
	email: string;
	memberId: number;
	status: string;

	companyImgSrc: string;
	companyName: string;
	companyDescription: string;
	companyProfileId: number;

	companyProfile: CompanyProfileDto;
	pbxlines: Array<PbxLineDto>;
	loading: boolean;
	companyEmployeeId: number;
	_companyEmployee: CompanyEmployeeDto;
	get companyEmployee(): CompanyEmployeeDto {
		return this._companyEmployee;
	}
	set companyEmployee(value: CompanyEmployeeDto) {
		this._companyEmployee = value;
		if (this.service.isEmpty(value) === false) {
			this.title = value.title;
			this.firstName = this.service.isEmpty(value.member) ? "" : value.member.firstName;
			this.lastName = this.service.isEmpty(value.member) ? "" : value.member.lastName;
			this.email = this.service.isEmpty(value.member) ? "" : value.member.email;
			this.memberId = value.memberId;
			this.companyEmployeeId = value.companyEmployeeId;
			this.status = this.service.isEmpty(value.isSuspended) ? 'Active' : 'Suspended';
			this.imgSrc = this.service.isEmpty(value.avatarFilename) ? this.service.defaultAvatar
				: this.service.pbxContentUrl + value.companyProfileId.toString() + '/' + this.service.employeeImageFolder + '/' + value.avatarFilename + "?" + Date.now().toString();

			let accessToken: string;
			this.service.getAccessToken()
				.then((token: string) => {
					accessToken = token;
					return this.service.getCompanyProfileById(this.companyEmployee.companyProfileId, accessToken);
				})
				.then((company) => {
					this.companyProfile = company;
					if (this.service.isEmpty(company) === false) {
						this.companyName = company.companyName;
						this.companyDescription = company.description;
						this.companyImgSrc = this.service.isEmpty(company.logoFilename) ? this.service.defaultAvatar
							: this.service.pbxContentUrl + company.companyProfileId.toString() + "/" + company.logoFilename + "?" + Date.now().toString();
						this.companyProfileId = company.companyProfileId;
					}
					return;
				})
				.then(() => {
					let dto = new IdDto();
					dto.id = this.companyEmployee.companyProfileId;
					return this.service.getEmployeePbxLines(dto, this.companyEmployee.memberId, accessToken);
				})
				.then((pbxlines: Array<PbxLineDto>) => {
					//console.log("pbxlines: ", pbxlines);
					this.pbxlines = pbxlines;
					return;
				})
				.catch((error) => {
					// TODO: log the error for debugging, for now fail silently
				})
				.then(() => {
					this.loading = false;
				})
		}
	}
}