import { Component, Input, Output, EventEmitter, Inject, ViewChild, Optional } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSelectionList, MatListOption } from '@angular/material';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,
	AbstractControl
} from '@angular/forms';

import {
	PbxLineDto,
	MaterialAlertMessageType,
	CompanyEmployeeDto,
	PbxLineRepDto,
	LongIdDto,
} from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'form-company-pbxline-edit',
	templateUrl: 'form-company-pbxline-edit.component.html'
})
export class FormCompanyPbxlineEditComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		this.showProgress = false;
		this.currentReps = new Array<PbxLineRepDto>();
		this.existingEmployeeReps = new Array<CompanyEmployeeDto>();
	}

	@Input('showProgress') showProgress: boolean;
	@Input('pbxline') pbxline: PbxLineDto;
	@Input('currentReps') currentReps: Array<PbxLineRepDto>;
	@Input('employees') employees: Array<CompanyEmployeeDto>;
	@Output() onEditCompanyPbxline: EventEmitter<PbxLineDto> = new EventEmitter<PbxLineDto>();
	@Output() onUpdateCompanyPbxlineImage: EventEmitter<string> = new EventEmitter<string>();

	@Output() onSelectedReps: EventEmitter<Array<CompanyEmployeeDto>> = new EventEmitter<Array<CompanyEmployeeDto>>();

	ngOnInit() {
		this.model = new PbxLineDto();
		//this.employees = this.service.companyEmployees;

		if (this.service.isEmpty(this.data) === false) {
			this.pbxline = this.data.pbxline;
			this.currentReps = this.data.currentReps;
			this.employees = this.data.employees;
			if (this.service.isEmpty(this.currentReps) === false && this.service.isEmpty(this.employees) === false) {
				this.currentReps.forEach((rep: PbxLineRepDto) => {
					this.employees.forEach((employee) => {
						if (employee.companyEmployeeId == rep.companyEmployeeId) {
							this.existingEmployeeReps.push(employee);
						}
					})
				});
			}
		}

		if (this.service.isEmpty(this.pbxline) === false) {
			this.model.pbxLineId = this.pbxline.pbxLineId;
			this.model.lineName = this.pbxline.lineName;
			this.model.description = this.pbxline.description;
			this.model.isDisabled = this.pbxline.isDisabled;
			this.model.iconFilename = this.pbxline.iconFilename;

			this.originalImage = this.service.isEmpty(this.pbxline.iconFilename) ? "" :
				this.service.pbxContentUrl + this.pbxline.companyProfileId.toString() + "/" + this.service.pbxLineImageFolder + "/" + this.pbxline.iconFilename + "?" + Date.now().toString();
			this.image = this.service.isEmpty(this.pbxline.iconFilename) ? this.service.defaultAvatar : this.originalImage;
		}

		this.createForm();
	}

	ngAfterViewInit() {
	}

	existingEmployeeReps: Array<CompanyEmployeeDto>;

	existingReps: Array<string>;

	defaultAvatar: string = this.service.defaultAvatar;

	image: string = this.defaultAvatar;

	originalImage: string = "";

	model: PbxLineDto;
	formGroup: FormGroup;

	createForm() {
		this.formGroup = this.fb.group({
			lineName: new FormControl(this.model.lineName, [
				Validators.maxLength(300),
				Validators.required

			]),
			description: new FormControl(this.model.description, [
				Validators.maxLength(1000),
				Validators.required

			]),

			isDisabled: new FormControl(this.model.isDisabled, [
				Validators.required
			]),
			selectedEmployees: new FormControl(),
		})
	}

	onImageSelected(imageDataUri: string): void {
		//console.log("image selected: ", imageDataUri);
		this.image = imageDataUri;
	}

	removeImage(): void {
		this.image = this.defaultAvatar;
	}

	submit(): void {
		if (this.formGroup.valid) {
			let selectedEmployees: Array<CompanyEmployeeDto> = this.formGroup.get('selectedEmployees').value;

			this.onSelectedReps.emit(selectedEmployees);
			// only emits new image if its not the original
			// note original can be the defaulAvatar
			if (this.image !== this.originalImage) {
				this.onUpdateCompanyPbxlineImage.emit(this.image);
			}

			this.model.lineName = this.formGroup.get('lineName').value;
			this.model.description = this.formGroup.get('description').value;
			this.model.isDisabled = this.formGroup.get('isDisabled').value;
			setTimeout(() => {
				this.onEditCompanyPbxline.emit(this.model);
			}, 100)
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}
}