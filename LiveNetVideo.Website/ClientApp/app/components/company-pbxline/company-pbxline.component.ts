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
	MaterialAlertMessageType,	MaterialActionAlertMessageType,
	PbxLineDto,
	IdCardType,
	PbxLineRepDto,
	LongIdDto,
	CompanyEmployeeDto,
} from "../../models/index";
import { Service } from "../../services/index";
import {
	MaterialActionAlertComponent,
	IdCardComponent,
	FormCompanyPbxlineEditComponent,
} from "../index";
@Component({
	selector: 'company-pbxline',
	templateUrl: 'company-pbxline.component.html'
})
export class CompanyPbxlineComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public route: ActivatedRoute,
		public router: Router,
	) { }

	@Input('pbxline') inputPbxline: PbxLineDto;
	@Output() onPbxLineDeleted: EventEmitter<PbxLineDto> = new EventEmitter<PbxLineDto>();
	@Output() onPbxLineUpdated: EventEmitter<PbxLineDto> = new EventEmitter<PbxLineDto>();

	_pbxline: PbxLineDto;
	get pbxline(): PbxLineDto {
		return this._pbxline;
	}
	set pbxline(value: PbxLineDto) {
		this._pbxline = value;
		if (this.service.isEmpty(value) === false) {
			this.lineName = value.lineName;
			this.description = value.description;
			this.status = this.service.isEmpty(value.isDisabled) ? 'Active' : 'Disabled';
			this.imgSrc = this.service.isEmpty(value.iconFilename) ? this.service.defaultAvatar :
				this.service.pbxContentUrl + value.companyProfileId.toString() + "/" + this.service.pbxLineImageFolder + "/" + value.iconFilename + "?" + Date.now().toString();
			this.link = this.service.baseUrl + "Home/Index/" + value.pbxLineId.toString();
		}
	}

	imgSrc: string;
	lineName: string;
	description: string;
	currentReps: Array<PbxLineRepDto>;
	selectedEmployees: Array<CompanyEmployeeDto>;
	newImage: string;
	status: string;
	link: string;

	ngOnInit() {
		//this.setGui(this.pbxline);
		this.pbxline = this.inputPbxline;
	}

	editCompanyPbxline(): void {
		this.tryGetRepsFromServer()
			.then((currentReps: Array<PbxLineRepDto>) => {
				//console.log("currentReps from server: ", currentReps)
				this.currentReps = currentReps;
				let dialogRef = this.matDialog.open(FormCompanyPbxlineEditComponent, {
					width: '80%',
					height: '80%',
					data: {
						pbxline: this.pbxline, currentReps: currentReps, employees: this.service.companyEmployees
					}
				});

				dialogRef.componentInstance.onEditCompanyPbxline.subscribe((pbxline: PbxLineDto) => {
					dialogRef.componentInstance.showProgress = true;

					this.updateCompanyPbxline(pbxline)
						.then((updatedPbxline: PbxLineDto) => {
							this.pbxline = updatedPbxline;
							//this.setGui(this.pbxline);
							dialogRef.close();
						})
						.catch((error) => {
							//console.log("error: ", error);
							let alert = new MaterialAlertMessageType();
							alert.title = "ERROR";
							alert.message = error;
							this.service.openAlert(alert);
						})
						.then(() => {
							dialogRef.componentInstance.showProgress = false;
						});
				});

				dialogRef.componentInstance.onUpdateCompanyPbxlineImage.subscribe((dataUri: string) => {
					//console.log("new image: ", dataUri);
					this.newImage = dataUri;
				});

				dialogRef.componentInstance.onSelectedReps.subscribe((selectedEmployees: Array<CompanyEmployeeDto>) => {
					this.selectedEmployees = selectedEmployees;
				});

				dialogRef.afterClosed().subscribe(() => {
					dialogRef.componentInstance.onEditCompanyPbxline.unsubscribe();
				});
			})
			.catch((error) => {
				//console.log("error: ", error);
				let alert = new MaterialAlertMessageType();
				alert.title = "Warning";
				alert.message = "Sorry, unable to retrieve PBX Line Representatives for this PBX Line";
				this.service.openAlert(alert);
			})
	}

	addCompanyPbxlineImage(dataUri: string, accessToken: string): void {
		this.service.addPbxLineImage(dataUri, this.pbxline.pbxLineId, accessToken)
			.then((updatedPbxline: PbxLineDto) => {
				this.pbxline = updatedPbxline;
			})
			.catch((error) => {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = error;
				this.service.openAlert(alert);
			})
	}

	async updateCompanyPbxline(pbxline: PbxLineDto): Promise<PbxLineDto> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let updatedPbxline: PbxLineDto = await this.service.updatePbxLine(pbxline, accessToken);
			if (this.service.isEmpty(updatedPbxline)) {
				throw ("Company Pbxline update failed. Please try again later.");
			}

			this.pbxline = updatedPbxline;

			await this.processNewImage(this.newImage, accessToken);

			await this.updatePbxlineReps(this.pbxline, accessToken);

			return this.pbxline;
		}
		catch (e) {
			throw (e);
		}
	}

	processNewImage(newImage: string, accessToken: string): Promise<void> {
		//console.log("processing newImage: ", newImage);
		return new Promise<void>((resolve, reject) => {
			if (this.service.isEmpty(newImage) === false) {
				// if the new image is the defaultAvatar and the current image is not the default avatar, then delete the image
				if (newImage === this.service.defaultAvatar && this.imgSrc !== this.service.defaultAvatar) {
					//console.log("start delete image");
					// delete the image
					this.service.deletePbxLineImage(this.pbxline.pbxLineId, accessToken)
						.then((updatedPbxline: PbxLineDto) => {
							this.pbxline = updatedPbxline;
							//console.log("end delete image");
							resolve();
						})
				}
				else if (newImage !== this.service.defaultAvatar && newImage !== this.imgSrc) {
					//console.log("start add image");
					// if the new image is not the defaultAvatar image add it
					this.service.addPbxLineImage(newImage, this.pbxline.pbxLineId, accessToken)
						.then((updatedPbxline: PbxLineDto) => {
							this.pbxline = updatedPbxline;
							//console.log("end add image");
							resolve()
						})
						.catch((error) => {
							reject(error);
						})
				}
				else {
					// nothing to process
					//console.log("nothing to process");
					resolve();
				}
			}
			else {
				// nothing to process
				//console.log("nothing to process empty image");
				resolve();
			}
		})
	}

	updatePbxlineReps(pbxline: PbxLineDto, accessToken: string): Promise<PbxLineDto> {
		return new Promise<PbxLineDto>((resolve, reject) => {
			let promises = [];

			//console.log("selectedEmployees: ", this.selectedEmployees);
			//console.log("update currentReps: ", this.currentReps);

			if (this.service.isEmpty(this.selectedEmployees) && this.service.isEmpty(this.currentReps) === false) {
				// if nothing selected and we have currentReps then delete all currentReps

				// loop backbards
				let index = this.currentReps.length;
				//console.log("delete all index start: ", index);
				while (index--) {
					//console.log("delete all index inloop: ", index);
					// remove from database
					promises.push(this.service.deletePbxLineRep(this.currentReps[index], accessToken));
					// remove from array
					this.currentReps.splice(index, 1);
				}

				Promise.all(promises)
					.then((data: any) => {
						//console.log("delete all data: ", data);
						resolve(pbxline);
					})
					.catch((error) => {
						//console.log("delete all error: ", error);
						reject(error);
					})
			}
			else if (this.service.isEmpty(this.selectedEmployees) === false && this.service.isEmpty(this.currentReps)) {
				// if we have selected Employees and no current reps, add all the newly selected employees as reps
				this.currentReps = new Array<PbxLineRepDto>();
				this.selectedEmployees.forEach((employee) => {
					//console.log("add all employee: ", employee);
					let pbxLineRep = new PbxLineRepDto();
					pbxLineRep.companyEmployeeId = employee.companyEmployeeId;
					pbxLineRep.pbxLineId = pbxline.pbxLineId;
					pbxLineRep.isDisabled = false;
					promises.push(this.service.createPbxLineRep(pbxLineRep, accessToken));
					//this.currentReps.push(pbxLineRep);
					//promise.then((rep: PbxLineRepDto) => {
					//	console.log('add all got new rep: ', rep);
					//	this.currentReps.push(rep);
					//	return;
					//});
				});

				Promise.all(promises)
					.then((data: any) => {
						//console.log("add all data: ", data);
						if (this.service.isEmpty(data) === false && data.length > 0) {
							data.forEach((item) => {
								if (this.service.isEmpty(item) === false && item.hasOwnProperty('pbxLineRepId')) {
									this.currentReps.push(item);
								}
							})
						}
						resolve(pbxline);
					})
					.catch((error) => {
						//console.log("add all error: ", error);
						reject(error);
					})
			}
			else if (this.service.isEmpty(this.selectedEmployees) === false && this.service.isEmpty(this.currentReps) === false) {
				// if we have selected employees and currentReps

				//// don't add any selected employees that are in currentReps list, so remove them from selectedEmployees
				//let empIndex = this.selectedEmployees.length;
				//console.log("empIndex start: ", empIndex);
				//while (empIndex--) {
				//	console.log("empIndex inloop: ", empIndex);
				//	let currentEmployee = this.selectedEmployees[empIndex];
				//	let index = this.currentReps.findIndex((rep) => { return rep.companyEmployeeId == currentEmployee.companyEmployeeId; });
				//	if (index > -1) {
				//		// selected employee already in currentReps list so remove it from selectedEmployees list
				//		this.selectedEmployees.splice(empIndex, 1);
				//	}
				//}

				// remove any current reps not on selected list
				let repIndex = this.currentReps.length;
				//console.log("repIndex start: ", repIndex);
				while (repIndex--) {
					//console.log("repIndex inloop: ", repIndex);
					let currentRep = this.currentReps[repIndex];

					let index = this.selectedEmployees.findIndex((employee) => { return employee.companyEmployeeId == currentRep.companyEmployeeId; });
					if (index < 0) {
						//existing rep not found in new selected list, so deleted it
						promises.push(this.service.deletePbxLineRep(currentRep, accessToken));
						this.currentReps.splice(repIndex, 1);
					}
				}

				// add the selectedEmployees not already in the currentReps list
				this.selectedEmployees.forEach((employee) => {
					let index = this.currentReps.findIndex((rep) => { return rep.companyEmployeeId == employee.companyEmployeeId; });
					if (index < 0) {
						//console.log("add remaining: ", employee)
						let pbxLineRep = new PbxLineRepDto();
						pbxLineRep.companyEmployeeId = employee.companyEmployeeId;
						pbxLineRep.pbxLineId = pbxline.pbxLineId;
						pbxLineRep.isDisabled = false;

						promises.push(this.service.createPbxLineRep(pbxLineRep, accessToken));
						//this.currentReps.push(pbxLineRep);
						//promise.then((rep: PbxLineRepDto) => {
						//	console.log("got new rep", rep);
						//	this.currentReps.push(rep);
						//	return;
						//})
					}
				});

				Promise.all(promises)
					.then((data: any) => {
						//console.log("add some data: ", data);
						if (this.service.isEmpty(data) === false && data.length > 0) {
							data.forEach((item) => {
								if (this.service.isEmpty(item) === false && item.hasOwnProperty('pbxLineRepId')) {
									this.currentReps.push(item);
								}
							})
						}
						resolve(pbxline);
					})
					.catch((error) => {
						//console.log("add some error: ", error);
						reject(error);
					})
			}
			else {
				// there are no selected employeess and there are no currentReps
				resolve(pbxline);
			}
		})
	}

	deleteCompanyPbxline(): void {
		// confirm before performing delete
		let alert = new MaterialActionAlertMessageType();
		alert.title = "Please Confirm";
		alert.message = '<p>Are you sure you want to delete this PBX line.</p>';
		alert.message += '<p class="text-danger"><strong>Any Employees assigned to this PBX Line will no longer have access to this line.</strong></p>';
		//alert.message += `<p>${this.address}</p>`;
		alert.noButton = "Cancel";
		alert.yesButton = "Delete";

		let dialogRef = this.matDialog.open(MaterialActionAlertComponent, {
			width: '80%',
			height: '80%',
			data: alert
		});

		dialogRef.afterClosed().subscribe(() => {
			if (alert.doAction === true) {
				//console.log("aler.doAction: ", this.pbxline);
				this.performDelete(this.pbxline)
					.then((deletedPbxline: PbxLineDto) => {
						this.onPbxLineDeleted.emit(deletedPbxline);
					})
					.catch((error) => {
						let alert = new MaterialAlertMessageType();
						alert.title = "ERROR";
						alert.message = error;
						this.service.openAlert(alert);
					})
			}
		});

		let card = new IdCardType();
		card.imgSrc = this.imgSrc;
		card.title = this.lineName;

		let factory = this.componentFactoryResolver.resolveComponentFactory(IdCardComponent);
		let viewContainerRef: ViewContainerRef = dialogRef.componentInstance.viewContainerRef;
		let componentRef: ComponentRef<IdCardComponent> = viewContainerRef.createComponent(factory);
		let idCard: IdCardComponent = componentRef.instance;
		idCard.idCard = card;
	}

	async performDelete(pbxline: PbxLineDto): Promise<PbxLineDto> {
		try {
			let deletedCompanyPbxline: PbxLineDto = Object.create(pbxline) as PbxLineDto;
			let accessToken: string = await this.service.getAccessToken();
			await this.deleteAssociatedPbxLineReps(pbxline.pbxLineId, accessToken);
			await this.service.deletePbxLine(pbxline, accessToken);
			return deletedCompanyPbxline;
		}
		catch (e) {
			throw (e);
		}
	}

	deleteAssociatedPbxLineReps(pbxLineId: number, accessToken: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let promises = [];
			this.requestRepsFromServer(pbxLineId, accessToken)
				.then((reps: Array<PbxLineRepDto>) => {
					if (this.service.isEmpty(reps) === false) {
						reps.forEach((rep) => {
							promises.push(this.service.deletePbxLineRep(rep, accessToken));
						})
						Promise.all(promises)
							.then((data: any) => {
								resolve();
							})
							.catch((error) => {
								reject(error);
							})
					}
					else {
						resolve();
					}
				})
				.catch((error) => {
					reject(error);
				})
		});
	}

	async tryGetRepsFromServer(): Promise<Array<PbxLineRepDto>> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let pbxLineReps: Array<PbxLineRepDto> = await this.requestRepsFromServer(this.pbxline.pbxLineId, accessToken);
			return pbxLineReps;
		}
		catch (e) {
			throw (e);
		}
	}

	requestRepsFromServer(pbxLineId: number, accessToken: string): Promise<Array<PbxLineRepDto>> {
		return new Promise<Array<PbxLineRepDto>>((resolve, reject) => {
			let dto = new LongIdDto();
			dto.id = pbxLineId;
			this.service.getPbxLineRepsByPbxLineId(dto, accessToken)
				.then((pbxLineReps: Array<PbxLineRepDto>) => {
					resolve(pbxLineReps);
				})
				.catch((error) => {
					reject(error);
				})
		})
	}
}