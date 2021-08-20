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
	CompanyLocationDto,
	IdCardType,
} from "../../models/index";
import { Service } from "../../services/index";
import {
	FormCompanyLocationEditComponent,
	MaterialActionAlertComponent,
	IdCardComponent,
} from "../index";
@Component({
	selector: 'company-location',
	templateUrl: 'company-location.component.html'
})
export class CompanyLocationComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public route: ActivatedRoute,
		public router: Router,
	) { }

	@Input('companyLocation') inputCompanyLocation: CompanyLocationDto;
	@Output() onCompanyLocationDeleted: EventEmitter<CompanyLocationDto> = new EventEmitter<CompanyLocationDto>();

	ngOnInit() {
		//this.setGui(this.companyLocation);
		this.companyLocation = this.inputCompanyLocation;
	}

	newImage: string;
	imgSrc: string;
	address: string;
	_companyLocation: CompanyLocationDto;
	get companyLocation(): CompanyLocationDto {
		return this._companyLocation;
	}
	set companyLocation(value: CompanyLocationDto) {
		this._companyLocation = value;
		if (this.service.isEmpty(value) === false) {
			let addressArray = new Array<string>();
			if (this.service.isEmpty(value.address) === false) {
				addressArray.push(value.address);
			}
			if (this.service.isEmpty(value.city) === false) {
				addressArray.push(value.city);
			}
			if (this.service.isEmpty(value.region) === false) {
				addressArray.push(value.region);
			}
			if (this.service.isEmpty(value.countryIsoCode) === false) {
				addressArray.push(value.countryIsoCode);
			}

			this.address = this.service.implode(", ", addressArray);

			this.imgSrc = this.service.isEmpty(value.locationPhotoFilename) ? this.service.defaultAvatar :
				this.service.pbxContentUrl + value.companyProfileId.toString() + "/" + this.service.companyLocationImageFolder + "/"
				+ value.locationPhotoFilename + "?" + Date.now().toString();
		}
	}

	editCompanyLocation(): void {
		let dialogRef = this.matDialog.open(FormCompanyLocationEditComponent, {
			width: '80%',
			height: '80%',
			data: this.companyLocation
		});

		dialogRef.componentInstance.onEditCompanyLocation.subscribe((companyLocation: CompanyLocationDto) => {
			dialogRef.componentInstance.showProgress = true;
			this.updateCompanyLocation(companyLocation)
				.then(() => {
					return this.service.getAccessToken();
				})
				.then((accessToken: string) => {
					return this.processNewImage(this.newImage, accessToken);
				})
				.catch((error) => {
					console.log("error: ", error);
					let alert = new MaterialAlertMessageType();
					alert.title = "ERROR";
					alert.message = error;
					this.service.openAlert(alert);
				})
				.then(() => {
					dialogRef.close();
					dialogRef.componentInstance.showProgress = false;
				});
		});

		dialogRef.componentInstance.onUpdateCompanyLocationImage.subscribe((dataUri: string) => {
			this.newImage = dataUri;
		});

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onEditCompanyLocation.unsubscribe();
		});
	}

	processNewImage(newImage: string, accessToken: string): Promise<void> {
		//console.log("processing newImage: ", newImage);
		return new Promise<void>((resolve, reject) => {
			if (this.service.isEmpty(newImage) === false) {
				// if the new image is the defaultAvatar and the current image is not the default avatar, then delete the image
				if (newImage === this.service.defaultAvatar && this.imgSrc !== this.service.defaultAvatar) {
					console.log("start delete image");
					// delete the image
					this.service.deleteCompanyLocationImage(this.companyLocation.companyLocationId, accessToken)
						.then((updatedCompanyLocation: CompanyLocationDto) => {
							this.companyLocation = updatedCompanyLocation;
							console.log("end delete image");

							resolve();
						})
				}
				else if (newImage !== this.service.defaultAvatar && newImage !== this.imgSrc) {
					console.log("start add image");
					// if the new image is not the defaultAvatar image add it
					this.service.addCompanyLocationImage(newImage, this.companyLocation.companyLocationId, accessToken)
						.then((updatedCompanyLocation: CompanyLocationDto) => {
							console.log("updatedCompanyLocation: ", updatedCompanyLocation);
							this.companyLocation = updatedCompanyLocation;
							console.log("end add image");
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

	async updateCompanyLocation(companyLocation: CompanyLocationDto): Promise<CompanyLocationDto> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let updatedCompanyLocation: CompanyLocationDto = await this.service.updateCompanyLocation(companyLocation, accessToken);
			return updatedCompanyLocation;
		}
		catch (e) {
			throw (e);
		}
	}

	deleteCompanyLocation(): void {
		// confirm before performing delete
		let alert = new MaterialActionAlertMessageType();
		alert.title = "Please Confirm";
		alert.message = '<p>Are you sure you want to delete your company location</p>';
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
				this.performCompanyLocationDelete(this.companyLocation)
					.then((deletedCompanyLocation: CompanyLocationDto) => {
						this.onCompanyLocationDeleted.emit(deletedCompanyLocation);
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
		card.subtitle = this.address;

		let factory = this.componentFactoryResolver.resolveComponentFactory(IdCardComponent);
		let viewContainerRef: ViewContainerRef = dialogRef.componentInstance.viewContainerRef;
		let componentRef: ComponentRef<IdCardComponent> = viewContainerRef.createComponent(factory);
		let idCard: IdCardComponent = componentRef.instance;
		idCard.idCard = card;
	}

	async performCompanyLocationDelete(companyLocation: CompanyLocationDto): Promise<CompanyLocationDto> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let deletedCompanyLocation: CompanyLocationDto = Object.create(companyLocation) as CompanyLocationDto;
			await this.service.deleteCompanyLocation(companyLocation, accessToken);
			return deletedCompanyLocation;
		}
		catch (e) {
			throw (e);
		}
	}
}