import { Component, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material';
import {
	Service
} from '../../services/index'
import {
	MaterialAlertMessageType,
	CompanyEmployeeInviteDto,
	CompanyEmployeeDto,
} from '../../models/index'
import { FormCompanyEmployeeInviteAddComponent } from "../index";
@Component({
	selector: 'button-add-employee-invite',
	templateUrl: 'button-add-employee-invite.component.html'
})
export class ButtonAddEmployeeInviteComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
	) {
	}

	@Output() onCompanyEmployeeInviteAdded: EventEmitter<CompanyEmployeeInviteDto> = new EventEmitter<CompanyEmployeeInviteDto>();

	ngOnInit() {
	}

	reps: Array<CompanyEmployeeDto>;

	openModalForm(): void {
		let dialogRef = this.matDialog.open(FormCompanyEmployeeInviteAddComponent, {
			width: '80%',
			height: '80%'
		});

		dialogRef.componentInstance.onAdd.subscribe((companyEmployeeInvite: CompanyEmployeeInviteDto) => {
			dialogRef.componentInstance.showProgress = true;
			this.addCompanyEmployeeInvite(companyEmployeeInvite)
				.then((newCompanyEmployeeInvite: CompanyEmployeeInviteDto) => {
					this.onCompanyEmployeeInviteAdded.emit(newCompanyEmployeeInvite);
					dialogRef.close();
				})
				.catch((error) => {
					let alert = new MaterialAlertMessageType();
					alert.title = "ERROR";
					alert.message = error;
					this.service.openAlert(alert);
				})
				.then(() => {
					dialogRef.componentInstance.showProgress = false;
				});
		});

		dialogRef.componentInstance.onCancel.subscribe(() => {
			dialogRef.close();
		})

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onCancel.unsubscribe();
			dialogRef.componentInstance.onAdd.unsubscribe();
		});
	}

	async addCompanyEmployeeInvite(companyEmployeeInvite: CompanyEmployeeInviteDto): Promise<CompanyEmployeeInviteDto> {
		try {
			let accessToken: string = await this.service.getAccessToken();

			let newCompanyEmployeeInvite: CompanyEmployeeInviteDto = await this.sendRequest(companyEmployeeInvite, accessToken)
			return newCompanyEmployeeInvite;
		}
		catch (e) {
			throw (e);
		}
	}

	async sendRequest(companyEmployeeInvite: CompanyEmployeeInviteDto, accessToken: string): Promise<CompanyEmployeeInviteDto> {
		try {
			companyEmployeeInvite.companyProfileId = this.service.companyProfile.companyProfileId;
			let newCompanyEmployeeInvite: CompanyEmployeeInviteDto = await this.service.createCompanyEmployeeInvite(companyEmployeeInvite, accessToken)
			return newCompanyEmployeeInvite;
		}
		catch (e) {
			throw (e);
		}
		return new Promise<CompanyEmployeeInviteDto>((resolve, reject) => {
		})
	}
}