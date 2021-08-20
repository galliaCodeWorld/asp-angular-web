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
	CompanyPhotoDto,
	MaterialAlertMessageType,	MaterialActionAlertMessageType
} from "../../models/index";
import { Service } from "../../services/index";
import {
	MaterialActionAlertComponent,
	ContactCardComponent,
} from "../index";
@Component({
	selector: 'company-photo',
	templateUrl: 'company-photo.component.html'
})
export class CompanyPhotoComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public route: ActivatedRoute,
		public router: Router,
	) { }

	@Input('companyPhoto') companyPhoto: CompanyPhotoDto;
	@Output() onDeleted: EventEmitter<CompanyPhotoDto> = new EventEmitter<CompanyPhotoDto>();

	imgSrc: string;

	ngOnInit() {
		this.setGui(this.companyPhoto);
	}

	setGui(companyPhoto: CompanyPhotoDto) {
		this.imgSrc = this.service.isEmpty(companyPhoto.filename) ? this.service.defaultAvatar :
			this.service.pbxContentUrl + companyPhoto.companyProfileId.toString() + "/" + this.service.companyPhotoImageFolder + "/" + companyPhoto.filename + "?" + Date.now().toString();
	}

	delete(): void {
		// confirm before performing delete
		let alert = new MaterialActionAlertMessageType();
		alert.title = "Please Confirm";
		alert.message = '<p>Are you sure you want to delete this photo</p>';
		alert.message += '<p><img src="' + this.imgSrc + '" class="thumbnail_lg"></p>';
		alert.noButton = "Cancel";
		alert.yesButton = "Delete";

		let dialogRef = this.matDialog.open(MaterialActionAlertComponent, {
			width: '80%',
			height: '80%',
			data: alert
		});

		dialogRef.afterClosed().subscribe(() => {
			if (alert.doAction === true) {
				this.performDelete(this.companyPhoto)
					.then((deletedPhoto: CompanyPhotoDto) => {
						this.onDeleted.emit(deletedPhoto);
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

	async performDelete(companyPhoto: CompanyPhotoDto): Promise<CompanyPhotoDto> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let deletedPhoto: CompanyPhotoDto = Object.create(companyPhoto) as CompanyPhotoDto;
			await this.service.deleteCompanyPhoto(companyPhoto, accessToken);
			return deletedPhoto;
		}
		catch (e) {
			throw (e);
		}
	}
}