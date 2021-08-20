import { Component, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material';
import {
	Service
} from '../../services/index'
import {
	MaterialAlertMessageType,
	PbxLineDto,
	PbxLineRepDto,
	CompanyEmployeeDto,
} from '../../models/index'
import {
	FormCompanyPbxlineAddComponent
} from "../index";
@Component({
	selector: 'button-add-pbxline',
	templateUrl: 'button-add-pbxline.component.html'
})
export class ButtonAddPbxlineComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
	) {
	}

	@Output() onCompanyPbxlineAdded: EventEmitter<PbxLineDto> = new EventEmitter<PbxLineDto>();

	ngOnInit() {
	}

	image: string;
	reps: Array<CompanyEmployeeDto>;

	openModalForm(): void {
		let dialogRef = this.matDialog.open(FormCompanyPbxlineAddComponent, {
			width: '80%',
			height: '80%'
		});

		dialogRef.componentInstance.onAddCompanyPbxline.subscribe(async (pbxline: PbxLineDto) => {
			try {
				dialogRef.componentInstance.showProgress = true;
				let newPbxline: PbxLineDto = await this.addPbxline(pbxline);

				this.onCompanyPbxlineAdded.emit(newPbxline);
				dialogRef.componentInstance.showProgress = false;
				dialogRef.close();
			}
			catch (e) {
				console.log("error while trying to create new pbxline: ", e);
				let alert = new MaterialAlertMessageType();
				alert.title = "ERROR";
				alert.message = "An error occurred while trying to create a new Pbx Line.";
				this.service.openAlert(alert);
			}
		});

		dialogRef.componentInstance.onAddCompanyPbxlineImage.subscribe((dataUri: string) => {
			this.image = dataUri;
		});

		dialogRef.componentInstance.onSelectedReps.subscribe((reps: Array<CompanyEmployeeDto>) => {
			this.reps = reps;
		});

		dialogRef.componentInstance.onCancel.subscribe(() => {
			dialogRef.close();
		});

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onCancel.unsubscribe();
			dialogRef.componentInstance.onSelectedReps.unsubscribe();
			dialogRef.componentInstance.onAddCompanyPbxline.unsubscribe();
			dialogRef.componentInstance.onAddCompanyPbxlineImage.unsubscribe();
		});
	}

	async addPbxline(pbxline: PbxLineDto): Promise<PbxLineDto> {
		try {
			let accessToken = await this.service.getAccessToken();
			let newPbxLine: PbxLineDto = await this.sendAddPbxlineRequest(pbxline, accessToken);
			return newPbxLine;
		}
		catch (e) {
			throw (e);
		}
	}

	async sendAddPbxlineRequest(pbxline: PbxLineDto, accessToken: string): Promise<PbxLineDto> {
		try {
			pbxline.companyProfileId = this.service.companyProfile.companyProfileId;
			let newPbxline: PbxLineDto = await this.service.createPbxLine(pbxline, accessToken);

			//console.log("newCompanyLocation: ", newCompanyLocation);
			if (this.service.isEmpty(this.image) === false) {
				await this.service.addPbxLineImage(this.image, newPbxline.pbxLineId, accessToken);
			}
			else {
				await this.service.delay(500);

				// wait half a second then check again
				if (this.service.isEmpty(this.image) === false) {
					return this.service.addPbxLineImage(this.image, newPbxline.pbxLineId, accessToken);
				}
			}

			let promises = [];

			if (this.reps.length > 0) {
				this.reps.forEach((rep) => {
					let pbxLineRep = new PbxLineRepDto();
					pbxLineRep.companyEmployeeId = rep.companyEmployeeId;
					pbxLineRep.pbxLineId = newPbxline.pbxLineId;
					pbxLineRep.isDisabled = false;
					promises.push(this.service.createPbxLineRep(pbxLineRep, accessToken));
				})
			}

			await Promise.all(promises);

			return newPbxline;
		}
		catch (e) {
			throw (e);
		}
	}
}