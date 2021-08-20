import { Component, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material';
import {
	Service
} from '../../services/index'
import {
	MaterialAlertMessageType, CompanyPhotoDto
} from '../../models/index'
import { FormCompanyPhotoAddComponent } from "../index";
@Component({
	selector: 'button-add-company-photo',
	templateUrl: 'button-add-company-photo.component.html'
})
export class ButtonAddCompanyPhotoComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
	) {
	}

	@Output() onPhotoAdded: EventEmitter<CompanyPhotoDto> = new EventEmitter<CompanyPhotoDto>();

	ngOnInit() {
	}

	openAddCompanyPhotoModal(): void {
		let dialogRef = this.matDialog.open(FormCompanyPhotoAddComponent, {
			width: '80%',
			height: '80%'
		});

		dialogRef.componentInstance.onAddPhoto.subscribe((dataUri: string) => {
			dialogRef.componentInstance.showProgress = true;
			this.addPhoto(dataUri)
				.then((companyPhoto: CompanyPhotoDto) => {
					this.onPhotoAdded.emit(companyPhoto);
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

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onAddPhoto.unsubscribe();
		});
	}

	async addPhoto(dataUri: string): Promise<CompanyPhotoDto> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let companyPhoto: CompanyPhotoDto = await this.sendAddPhotoRequest(dataUri, accessToken);
			return companyPhoto;
		}
		catch (e) {
			throw (e);
		}
	}

	sendAddPhotoRequest(dataUri: string, accessToken: string): Promise<CompanyPhotoDto> {
		return new Promise<CompanyPhotoDto>((resolve, reject) => {
			let post = new CompanyPhotoDto();
			post.companyProfileId = this.service.companyProfile.companyProfileId;
			this.service.createCompanyPhoto(post, accessToken)
				.then((companyPhoto: CompanyPhotoDto) => {
					return this.service.addCompanyPhoto(dataUri, companyPhoto.companyPhotoId, accessToken);
				})
				.then((companyPhoto: CompanyPhotoDto) => {
					resolve(companyPhoto);
				})
				.catch((error) => {
					reject(error);
				});
		})
	}
}