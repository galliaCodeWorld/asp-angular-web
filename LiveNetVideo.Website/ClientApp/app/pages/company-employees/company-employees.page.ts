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
	CompanyEmployeeDto,
	IdDto,
	CompanyEmployeeInviteDto,
} from "../../models/index";

import { Service } from "../../services/index";
import { MaterialAlertComponent } from "../../components/index";

@Component({
	templateUrl: 'company-employees.page.html'
})

export class CompanyEmployeesPage {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		private dialog: MatDialog,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
	) {
		this.loading = true;
		this.activatedRoute.paramMap.subscribe((params) => {
			this.companyProfileId = Number(params.get('companyProfileId'));
		});
	}

	loading: boolean;
	companyProfileId: number;

	_companyEmployees: Array<CompanyEmployeeDto>;
	get companyEmployees(): Array<CompanyEmployeeDto> {
		return this._companyEmployees;
	}
	set companyEmployees(value: Array<CompanyEmployeeDto>) {
		this._companyEmployees = value;
	}

	ngOnInit() {
		//console.log("ngOnInit");
		this.service.isCheckedIntoHubConnection();

		this.service.getAccessToken()
			.then((accessToken: string) => {
				return this.getCompanyEmployeesFromServer(accessToken);
			})
			.then((companyEmployees: CompanyEmployeeDto[]) => {
				this.companyEmployees = companyEmployees;
			})
			.catch((e) => {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e;
				this.service.openAlert(alert);
			})
			.then(() => {
				this.loading = false;
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

	async refresh(): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let companyEmployees: CompanyEmployeeDto[] = await this.getCompanyEmployeesFromServer(accessToken);
			this.companyEmployees = companyEmployees;
		}
		catch (e) {
			console.log("company-employee.page.ts refresh() error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Warning";
			alert.message = "<p>Unable to refresh employees list.</p>";
			this.service.openAlert(alert);
		}
	}

	getCompanyEmployeesFromServer(accessToken: string): Promise<Array<CompanyEmployeeDto>> {
		return new Promise<Array<CompanyEmployeeDto>>((resolve, reject) => {
			this.loading = true;
			//console.log("accessToken: ", accessToken);
			//console.log("this.service.companyProfile: ", this.service.companyProfile);

			let idDto = new IdDto();
			idDto.id = this.companyProfileId;
			//console.log("idDto: ", idDto);
			this.service.getCompanyEmployeesByCompanyProfileId(idDto, accessToken)
				.then((companyEmployees: Array<CompanyEmployeeDto>) => {
					resolve(companyEmployees);
				})
				.catch((error) => {
					reject(error);
				})
				.then(() => {
					this.loading = false;
				})
		})
	}

	companyEmployeeInviteAdded(companyEmployeeInvite: CompanyEmployeeInviteDto): void {
		let alert = new MaterialAlertMessageType();
		alert.title = "Success";
		alert.message = "<p>An invitation has been sent to: " + companyEmployeeInvite.email + "</p>";
		alert.message += '<p>You can check the status of your invitation from the Employee Invite list</p>'
		this.service.openAlert(alert);
	}

	companyEmployeeDeleted(companyEmployee: CompanyEmployeeDto): void {
		this.companyEmployees = this.service.companyEmployees;
	}
}