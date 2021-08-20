import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,
	AbstractControl
} from '@angular/forms';

import {
	CompanyProfileDto,
	MaterialAlertMessageType,
	CompanyLocationDto,
	MaterialActionAlertMessageType,
} from "../../models/index";
import { Service } from "../../services/index";
import { optionalEmail } from "../../validators/optionalEmail.validator";
import { MaterialActionAlertComponent } from "../index";
@Component({
	selector: 'form-edit-company',
	templateUrl: 'form-edit-company.component.html'
})
export class FormEditCompanyComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		private matDialog: MatDialog,

	) {
		this.showProgress = false;
	}

	@Input('showProgress') showProgress: boolean;
	@Input('companyProfile') companyProfile: CompanyProfileDto;
	//@Input('companyLocations') companyLocations: Array<CompanyLocationDto>;
	@Output() onEditCompany: EventEmitter<CompanyProfileDto> = new EventEmitter<CompanyProfileDto>();
	@Output() onUpdateCompanyLogo: EventEmitter<string> = new EventEmitter<string>();

	ngOnInit() {
		this.model = new CompanyProfileDto();

		//if (this.service.isEmpty(this.data) === false && this.data.hasOwnProperty('companyProfileId')) {
		//	this.companyProfile = this.data;
		//}

		if (this.service.isEmpty(this.companyProfile) === false) {
			this.model.companyProfileId = this.companyProfile.companyProfileId;
			this.model.companyName = this.companyProfile.companyName;
			this.model.memberId = this.companyProfile.memberId;
			this.model.createdDate = this.companyProfile.createdDate;
			this.model.description = this.companyProfile.description;
			this.model.contactEmail = this.companyProfile.contactEmail;
			this.model.logoFilename = this.companyProfile.logoFilename;
			this.model.companyLocationId = this.companyProfile.companyLocationId;
			this.originalLogo = this.service.isEmpty(this.companyProfile.logoFilename) ? "" :
				this.service.pbxContentUrl + this.companyProfile.companyProfileId.toString() + "/" + this.companyProfile.logoFilename + "?" + Date.now().toString();
			this.image = this.service.isEmpty(this.companyProfile.logoFilename) ? this.service.defaultAvatar : this.originalLogo;
		}

		this.createForm();
	}

	defaultAvatar = this.service.defaultAvatar;

	originalLogo: string = "";

	image: string = this.defaultAvatar;

	model: CompanyProfileDto;
	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			companyName: new FormControl(this.model.companyName, [
				Validators.maxLength(300),
				Validators.required

			]),
			description: new FormControl(this.model.description),
			contactEmail: new FormControl(this.model.contactEmail,
				[
					optionalEmail,
					Validators.maxLength(300),
				]
			),
		})
	}

	onImageSelected(imageDataUri: string): void {
		//console.log("form-add-contact.component.ts onImageSelected: imageDateUri: ", imageDataUri);
		this.image = imageDataUri;
	}

	removeAvatar(): void {
		if (this.image === this.originalLogo) {
			let alert = new MaterialActionAlertMessageType();
			alert.title = "Please Confirm";
			alert.message = '<p>Are you sure you want to delete your company logo. A logo helps identify your company to other users. If you remove your company logo, then a generic default logo will be used.</p>';
			alert.message += '<p><img src="' + this.image + '" class="thumbnail_lg"></p>';
			alert.noButton = "Cancel";
			alert.yesButton = "Remove";

			let dialogRef = this.matDialog.open(MaterialActionAlertComponent, {
				width: '80%',
				height: '80%',
				data: alert
			});

			dialogRef.afterClosed().subscribe(() => {
				if (alert.doAction === true) {
					this.image = this.defaultAvatar;
				}
			});
		}
		else {
			this.image = this.service.isEmpty(this.originalLogo) ? this.defaultAvatar : this.originalLogo;
		}
	}

	submit(): void {
		if (this.formGroup.valid) {
			this.model.contactEmail = this.service.sanitizeEmail(this.formGroup.get('contactEmail').value);
			this.model.companyName = this.formGroup.get('companyName').value;
			this.model.description = this.formGroup.get('description').value;
			if (this.image === this.defaultAvatar) {
				this.model.logoFilename = "";
			}
			this.onEditCompany.emit(this.model);
			if (this.image !== this.defaultAvatar && this.image !== this.originalLogo) {
				setTimeout(() => { this.onUpdateCompanyLogo.emit(this.image) }, 250);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}
}