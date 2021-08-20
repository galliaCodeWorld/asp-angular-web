import { Component, Input, Output, EventEmitter, Inject, ViewChild, QueryList } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatListOption, MatList, MatSelectionList } from '@angular/material';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,	AbstractControl
} from '@angular/forms';

import {
	PbxLineDto,
	MaterialActionAlertMessageType,
	MaterialAlertMessageType,
	CompanyEmployeeDto,
	IdDto,
	PbxLineRepDto,
} from "../../models/index";

import { Service } from "../../services/index";

@Component({
	selector: 'form-company-pbxline-add',
	templateUrl: 'form-company-pbxline-add.component.html'
})

export class FormCompanyPbxlineAddComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder,
	) {
		this.createForm();
		this.showProgress = false;
	}

	@Input('showProgress') showProgress: boolean;
	@Output() onAddCompanyPbxline: EventEmitter<PbxLineDto> = new EventEmitter<PbxLineDto>();
	@Output() onAddCompanyPbxlineImage: EventEmitter<string> = new EventEmitter<string>();
	@Output() onSelectedReps: EventEmitter<Array<CompanyEmployeeDto>> = new EventEmitter<Array<CompanyEmployeeDto>>();
	@Output() onCancel: EventEmitter<void> = new EventEmitter<void>();

	@ViewChild('reps') reps: MatSelectionList;

	ngOnInit() {
		this.model = new PbxLineDto();
		this.employees = this.service.companyEmployees;
	}

	ngAfterViewInit() {
	}

	employees: Array<CompanyEmployeeDto>;

	defaultAvatar = this.service.defaultAvatar;

	image: string = this.defaultAvatar;

	model: PbxLineDto;
	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			lineName: new FormControl('', [
				Validators.maxLength(300),
				Validators.required

			]),
			description: new FormControl('', [
				Validators.maxLength(4000),
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

	async tryGetEmployeesFromServer(): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let companyEmployees: CompanyEmployeeDto[] = await this.sendRequestGetEmployeesFromServer(accessToken);
			this.employees = companyEmployees;
		}
		catch (e) {
			throw (e);
		}
	}

	sendRequestGetEmployeesFromServer(accessToken: string): Promise<Array<CompanyEmployeeDto>> {
		return new Promise<Array<CompanyEmployeeDto>>((resolve, reject) => {
			let dto = new IdDto();
			dto.id = this.service.companyProfile.companyProfileId;
			this.service.getCompanyEmployeesByCompanyProfileId(dto, accessToken)
				.then((companyEmployees: Array<CompanyEmployeeDto>) => {
					resolve(companyEmployees);
				})
				.catch((error) => {
					reject(error);
				})
		})
	}

	submit() {
		if (this.formGroup.valid) {
			this.model.lineName = this.formGroup.get('lineName').value;
			this.model.description = this.formGroup.get('description').value;

			let selected: Array<CompanyEmployeeDto> = new Array<CompanyEmployeeDto>();

			this.reps.selectedOptions.selected.forEach((rep: MatListOption) => {
				this.employees.forEach((employee) => {
					if (employee.companyEmployeeId == rep.value) {
						selected.push(employee);
					}
				});
			})

			if (selected.length > 0) {
				this.onSelectedReps.emit(selected);
			}

			if (this.image !== this.defaultAvatar) {
				this.onAddCompanyPbxlineImage.emit(this.image);
			}

			this.onAddCompanyPbxline.emit(this.model);
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	cancel(): void {
		this.onCancel.emit();
	}
}