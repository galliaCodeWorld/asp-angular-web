import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,	AbstractControl
} from '@angular/forms';

import {
	CompanyLocationDto,
	CountryDto,
	MaterialActionAlertMessageType,
	MaterialAlertMessageType,
} from "../../models/index";

import { Service } from "../../services/index";

@Component({
	selector: 'form-company-location-add',
	templateUrl: 'form-company-location-add.component.html'
})

export class FormCompanyLocationAddComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder,
	) {
		this.createForm();
		this.showProgress = false;
		this.countries = new Array<CountryDto>();
	}

	@Input('showProgress') showProgress: boolean;
	@Output() onAddCompanyLocation: EventEmitter<CompanyLocationDto> = new EventEmitter<CompanyLocationDto>();
	@Output() onAddCompanyLocationImage: EventEmitter<string> = new EventEmitter<string>();

	ngOnInit() {
		this.model = new CompanyLocationDto();
		this.service.getAccessToken()
			.then((accessToken: string) => {
				return this.service.getCountryIsoCodes(accessToken);
			})
			.then((countryDtos: CountryDto[]) => {
				this.countries = countryDtos;
			});
	}

	countries: Array<CountryDto>;

	defaultAvatar = this.service.defaultAvatar;

	image: string = this.defaultAvatar;

	model: CompanyLocationDto;
	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			address: new FormControl('', [
				Validators.maxLength(300),
				Validators.required

			]),
			city: new FormControl('', [
				Validators.maxLength(300),
				Validators.required

			]),
			region: new FormControl('', [
				Validators.maxLength(300),
				Validators.required

			]),
			countryIsoCode: new FormControl('US', [
				Validators.maxLength(2),
				Validators.required

			]),
		})
	}

	onImageSelected(imageDataUri: string): void {
		//console.log("form-add-contact.component.ts onImageSelected: imageDateUri: ", imageDataUri);
		this.image = imageDataUri;
	}

	removeImage(): void {
		this.image = this.defaultAvatar;
	}

	submit() {
		if (this.formGroup.valid) {
			this.model.address = this.formGroup.get('address').value;
			this.model.city = this.formGroup.get('city').value;
			this.model.region = this.formGroup.get('region').value;
			this.model.countryIsoCode = this.formGroup.get('countryIsoCode').value;
			this.onAddCompanyLocation.emit(this.model);
			if (this.image !== this.defaultAvatar) {
				this.onAddCompanyLocationImage.emit(this.image);
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