import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';
import { Service } from "../../services/index";
import { CompanyEmployeeDto, MaterialAlertMessageType } from "../../models/index";
import { FormCompanyEmployeeEditComponent } from "../index";

@Component({
	selector: 'company-employee',
	templateUrl: 'company-employee.component.html'
})
export class CompanyEmployeeComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
	) { }

	@Input('companyEmployee') inputCompanyEmployee: CompanyEmployeeDto;
	@Output() onDelete: EventEmitter<CompanyEmployeeDto> = new EventEmitter<CompanyEmployeeDto>();

	_companyEmployee: CompanyEmployeeDto;
	get companyEmployee(): CompanyEmployeeDto {
		return this._companyEmployee;
	}
	set companyEmployee(value: CompanyEmployeeDto) {
		this._companyEmployee = value;
		if (this.service.isEmpty(value) === false) {
			this.title = value.title;
			this.firstName = this.service.isEmpty(value.member) ? "" : value.member.firstName;
			this.lastName = this.service.isEmpty(value.member) ? "" : value.member.lastName;
			this.email = this.service.isEmpty(value.member) ? "" : value.member.email;
			this.memberId = value.memberId;
			this.companyEmployeeId = value.companyEmployeeId;
			this.status = this.service.isEmpty(value.isSuspended) ? 'Active' : 'Suspended';
			this.imgSrc = this.service.isEmpty(value.avatarFilename) ? this.service.defaultAvatar
				: this.service.pbxContentUrl + value.companyProfileId.toString() + '/' + this.service.employeeImageFolder + '/' + value.avatarFilename + "?" + Date.now().toString();
		}
	}
	ngOnInit() {
		this.companyEmployee = this.inputCompanyEmployee;
	}

	imgSrc: string;
	title: string;
	firstName: string;
	lastName: string;
	email: string;
	memberId: number;
	companyEmployeeId: number;
	status: string;

	newImage: string;

	async delete(): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			await this.service.deleteCompanyEmployee(this.companyEmployee, accessToken);
			this.onDelete.emit(this.companyEmployee);
		}
		catch (e) {
			console.log("company-employee.component.ts delete() error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = "Unable to delete item. Please try again later";
			this.service.openAlert(alert);
		}
	}

	async edit(): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let dialogRef = this.matDialog.open(FormCompanyEmployeeEditComponent, {
				width: '80%',
				height: '80%',
				data: this.companyEmployee
			});

			dialogRef.componentInstance.onEditCompanyEmployee.subscribe((companyEmployee: CompanyEmployeeDto) => {
				dialogRef.componentInstance.showProgress = true;
				this.updateCompanyEmployee(companyEmployee, accessToken)
					.then(() => {
						return this.processNewImage(this.newImage, accessToken);
					})
					.then(() => {
						dialogRef.close();
					})
					.catch((error) => {
						console.log("error: ", error);
						let alert = new MaterialAlertMessageType();
						alert.title = "ERROR";
						alert.message = error;
						this.service.openAlert(alert);
					})
					.then(() => {
						dialogRef.componentInstance.showProgress = false;
					});
			});

			dialogRef.componentInstance.onUpdateCompanyEmployeeImage.subscribe((dataUri: string) => {
				this.newImage = dataUri;
			});

			dialogRef.afterClosed().subscribe(() => {
				dialogRef.componentInstance.onEditCompanyEmployee.unsubscribe();
				dialogRef.componentInstance.onUpdateCompanyEmployeeImage.unsubscribe();
			});
		}
		catch (e) {
			console.log("company-employee.component.ts edit() error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = "Unable to update item. Please try again later";
			this.service.openAlert(alert);
		}
	}

	processNewImage(newImage: string, accessToken: string): Promise<void> {
		//console.log("processing newImage: ", newImage);
		return new Promise<void>((resolve, reject) => {
			if (this.service.isEmpty(newImage) === false) {
				// if the new image is the defaultAvatar and the current image is not the default avatar, then delete the image
				if (newImage === this.service.defaultAvatar && this.imgSrc !== this.service.defaultAvatar) {
					// delete the image
					this.service.deleteCompanyEmployeeImage(this.companyEmployee.companyEmployeeId, accessToken)
						.then((updatedCompanyEmployee: CompanyEmployeeDto) => {
							this.companyEmployee = updatedCompanyEmployee;

							resolve();
						})
				}
				else if (newImage !== this.service.defaultAvatar && newImage !== this.imgSrc) {
					// if the new image is not the defaultAvatar image add it
					this.service.addCompanyEmployeeImage(newImage, this.companyEmployee.companyEmployeeId, accessToken)
						.then((updatedCompanyEmployee: CompanyEmployeeDto) => {
							this.companyEmployee = updatedCompanyEmployee;
							resolve()
						})
						.catch((error) => {
							reject(error);
						})
				}
				else {
					// nothing to process
					console.log("nothing to process");
					resolve();
				}
			}
			else {
				// nothing to process
				console.log("nothing to process empty image");
				resolve();
			}
		})
	}

	updateCompanyEmployee(companyEmployee: CompanyEmployeeDto, accessToken: string): Promise<CompanyEmployeeDto> {
		return new Promise<CompanyEmployeeDto>((resolve, reject) => {
			this.service.updateCompanyEmployee(companyEmployee, accessToken)
				.then((updatedCompanyEmployee: CompanyEmployeeDto) => {
					this.companyEmployee = updatedCompanyEmployee;
					resolve(updatedCompanyEmployee);
				})
				.catch((error) => {
					reject(error);
				});
		});
	}
}