import {
	Component, Input, Output, EventEmitter,
	ComponentFactory,
	ComponentFactoryResolver,
	ViewContainerRef,
	ComponentRef,
} from '@angular/core';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';
import {
	Router,
	ActivatedRoute
} from '@angular/router';
import {
	MaterialAlertMessageType,	MaterialActionAlertMessageType,
	CompanyEmployeeInviteDto,
	IdCardType,
	CompanyEmployeeDto,
	MemberType,
} from "../../models/index";
import { Service } from "../../services/index";
import {
	MaterialActionAlertComponent,
	IdCardComponent,
} from "../index";
@Component({
	selector: 'company-employee-invite',
	templateUrl: 'company-employee-invite.component.html'
})
export class CompanyEmployeeInviteComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public route: ActivatedRoute,
		public router: Router,
	) {
		this.loading = true;
	}

	@Input('companyEmployeeInvite') inputCompanyEmployeeInvite: CompanyEmployeeInviteDto;

	@Output() onDeleted: EventEmitter<CompanyEmployeeInviteDto> = new EventEmitter<CompanyEmployeeInviteDto>();

	ngOnInit() {
		this.loading = true;

		if (this.inputCompanyEmployeeInvite.isAccepted) {
			this.service.getAccessToken()
				.then((accessToken: string) => {
					return this.service.getCompanyEmployeeByEmail(this.inputCompanyEmployeeInvite.email, this.service.companyProfile.companyProfileId, accessToken);
				})
				.then((companyEmployee: CompanyEmployeeDto) => {
					this.companyEmployee = companyEmployee;
				})
				.catch((error) => {
					let alert = new MaterialAlertMessageType();
					alert.title = "Warning";
					alert.message = error;
					this.service.openAlert(alert);
				})
				.then(() => {
					this.companyEmployeeInvite = this.inputCompanyEmployeeInvite;
					this.loading = false;
				})
		}
		else {
			this.companyEmployeeInvite = this.inputCompanyEmployeeInvite;
			this.loading = false;
		}
	}

	imgSrc: string;
	email: string;
	firstName: string;
	lastName: string;
	isAccepted: boolean;
	dateAccepted: string;
	loading: boolean;
	companyEmployee: CompanyEmployeeDto;

	_companyEmployeeInvite: CompanyEmployeeInviteDto;
	get companyEmployeeInvite(): CompanyEmployeeInviteDto {
		return this._companyEmployeeInvite;
	}
	set companyEmployeeInvite(value: CompanyEmployeeInviteDto) {
		this._companyEmployeeInvite = value;
		this.email = value.email;
		this.firstName = value.firstName;
		this.lastName = value.lastName;

		this.isAccepted = value.isAccepted;
		let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
		//this.dateAccepted = this.service.isEmpty(value.dateAccepted) ? "" : value.dateAccepted.toLocaleDateString("en-US", options);
		this.dateAccepted = this.service.isEmpty(value.dateAccepted) ? "" : value.dateAccepted.toString();
		if (this.service.isEmpty(this.companyEmployee) === false) {
			this.imgSrc = this.service.isEmpty(this.companyEmployee.avatarFilename) ? this.service.defaultAvatar
				: this.service.pbxContentUrl + this.service.companyProfile.companyProfileId.toString() + "/" + this.service.employeeImageFolder + "/" + this.companyEmployee.avatarFilename + "?" + Date.now().toString();
		}
	}

	delete(): void {
		// confirm before performing delete
		let alert = new MaterialActionAlertMessageType();
		alert.title = "Please Confirm";
		alert.message = '<p>Are you sure you want to delete your invitation:</p>';
		alert.message += '<p><strong>' + this.companyEmployeeInvite.firstName + ' ' + this.companyEmployeeInvite.lastName + '</strong></p>';
		alert.message += '<p class="text-smaller">' + this.companyEmployeeInvite.email + '</p>';

		alert.noButton = "Cancel";
		alert.yesButton = "Delete";

		let dialogRef = this.matDialog.open(MaterialActionAlertComponent, {
			width: '80%',
			height: '80%',
			data: alert
		});

		dialogRef.afterClosed().subscribe(() => {
			if (alert.doAction === true) {
				this.service.getAccessToken()
					.then((accessToken: string) => {
						return this.performDelete(this.companyEmployeeInvite, accessToken);
					})
					.then((message: string) => {
						this.onDeleted.emit(this.companyEmployeeInvite);
					})
					.catch((error) => {
						let alert = new MaterialAlertMessageType();
						alert.title = "ERROR";
						alert.message = error;
						this.service.openAlert(alert);
					})
			}
		});
	}

	performDelete(invite: CompanyEmployeeInviteDto, accessToken: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			this.service.deleteCompanyEmployeeInvite(invite, accessToken)
				.then((message: string) => {
					resolve(message);
				})
				.catch((error) => {
					reject(error);
				});
		})
	}
}