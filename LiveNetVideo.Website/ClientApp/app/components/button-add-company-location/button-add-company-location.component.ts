import { Component, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material';
import {
	Service
} from '../../services/index'
import {
	MaterialAlertMessageType, CompanyLocationDto
} from '../../models/index'
import {
	FormCompanyLocationAddComponent
} from "../index";
@Component({
	selector: 'button-add-company-location',
	templateUrl: 'button-add-company-location.component.html'
})
export class ButtonAddCompanyLocationComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
	) {
	}

	@Output() onCompanyLocationAdded: EventEmitter<CompanyLocationDto> = new EventEmitter<CompanyLocationDto>();

	ngOnInit() {
	}

	image: string;

	openModalForm(): void {
		let dialogRef = this.matDialog.open(FormCompanyLocationAddComponent, {
			width: '80%',
			height: '80%'
		});

		dialogRef.componentInstance.onAddCompanyLocation.subscribe((companyLocation: CompanyLocationDto) => {
			dialogRef.componentInstance.showProgress = true;
			this.addLocation(companyLocation)
				.then((newCompanyLocation: CompanyLocationDto) => {
					this.onCompanyLocationAdded.emit(newCompanyLocation);
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

		dialogRef.componentInstance.onAddCompanyLocationImage.subscribe((dataUri: string) => {
			this.image = dataUri;
		});

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onAddCompanyLocation.unsubscribe();
			dialogRef.componentInstance.onAddCompanyLocationImage.unsubscribe();
		});
	}

	async addLocation(companyLocation: CompanyLocationDto): Promise<CompanyLocationDto> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let newCompanyLocation: CompanyLocationDto = await this.sendAddLocationRequest(companyLocation, accessToken);
			return newCompanyLocation;
		}
		catch (e) {
			throw (e);
		}
	}

	sendAddLocationRequest(companyLocation: CompanyLocationDto, accessToken: string): Promise<CompanyLocationDto> {
		return new Promise<CompanyLocationDto>((resolve, reject) => {
			companyLocation.companyProfileId = this.service.companyProfile.companyProfileId;
			this.service.createCompanyLocation(companyLocation, accessToken)
				.then((newCompanyLocation: CompanyLocationDto) => {
					console.log("newCompanyLocation: ", newCompanyLocation);
					if (this.service.isEmpty(this.image) === false) {
						return this.service.addCompanyLocationImage(this.image, newCompanyLocation.companyLocationId, accessToken);
					}
					else {
						setTimeout(() => {
							// wait half a second then check again
							if (this.service.isEmpty(this.image) === false) {
								return this.service.addCompanyLocationImage(this.image, newCompanyLocation.companyLocationId, accessToken);
							}
							else {
								return newCompanyLocation;
							}
						}, 500)
					}
				})
				.then((newCompanyLocation: CompanyLocationDto) => {
					resolve(newCompanyLocation);
				})
				.catch((error) => {
					reject(error);
				});
		})
	}
}