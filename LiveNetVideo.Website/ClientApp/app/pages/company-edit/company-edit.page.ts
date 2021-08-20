import {
	Component,
	Input,
	Output,
	EventEmitter,
	Inject,
	ViewChild,
	ViewContainerRef,
	ComponentFactoryResolver,
	AfterViewInit,
	NgZone,
} from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
	Router,
	ActivatedRoute
} from '@angular/router';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,

	AbstractControl
} from '@angular/forms';

import {
	MaterialActionAlertMessageType,
	MaterialAlertMessageType,
	CompanyProfileDto,
	IdCardType,
	IdDto,
	CompanyVideoDto,
	CompanyPhotoDto,
	CompanyLocationDto,
	CompanyEmployeeDto,
} from "../../models/index";

import { Service } from "../../services/index";
import { FormCompanyPhotoAddComponent } from "../../components/index";

@Component({
	templateUrl: 'company-edit.page.html'
})

export class CompanyEditPage {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		private matDialog: MatDialog,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public route: ActivatedRoute,
		public router: Router,
		private ngZone: NgZone,
	) {
		this.donePageLoading = false;
		this.showProfileUpdateProgress = false;
	}

	showProfileUpdateProgress: boolean;
	donePageLoading: boolean;
	companyProfile: CompanyProfileDto;
	employees: Array<CompanyEmployeeDto>;
	photos: Array<CompanyPhotoDto>;
	locations: Array<CompanyLocationDto>;
	videos: Array<CompanyVideoDto>;

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		this.loadModels()
			.then(() => {
				this.donePageLoading = true;
			});
	}

	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;
	ngAfterViewInit() {
		this.ngZone.run(() => {
			setTimeout(() => {
				if (window.innerWidth < 500) {
					this._container.close();
				}
				else {
					this._container.open();
				}
			}, 250);
		});
	}

	loadModels(): Promise<void> {
		return new Promise<void>((resolve) => {
			if (this.service.isEmpty(this.service.companyProfile)) {
				this.retrieveCompanyProfile()
					.then(() => {
						this.companyProfile = this.service.companyProfile;
						this.employees = this.service.companyEmployees;
						this.photos = this.service.companyPhotos;
						this.videos = this.service.companyVideos;
						this.locations = this.service.companyLocations;
					})
					.then(() => {
						resolve();
					})
			}
			else {
				this.companyProfile = this.service.companyProfile;
				this.employees = this.service.companyEmployees;
				this.photos = this.service.companyPhotos;
				this.videos = this.service.companyVideos;
				this.locations = this.service.companyLocations;
				resolve();
			}
		})
	}

	refreshCompanyProfile(): void {
		this.retrieveCompanyProfile()
			.then(() => {
				this.companyProfile = this.service.companyProfile;
				this.employees = this.service.companyEmployees;
				this.photos = this.service.companyPhotos;
				this.videos = this.service.companyVideos;
				this.locations = this.service.companyLocations;
			})
			.catch((error) => {
				let alert = new MaterialAlertMessageType();
				alert.title = "ERROR";
				alert.message = "Sorry unable to retrieve updated company information at this time. Please try again later.";
				this.service.openAlert(alert);
			})
	}

	async retrieveCompanyProfile(): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let companyProfile: CompanyProfileDto = await this.service.getMembersCompanyProfile(this.service.profile.memberId, accessToken);
			try {
				await this.service.retrieveAndSetCompanyInformation(this.service.companyProfile, accessToken);
			}
			catch (e) {
				if (this.service.isEmpty(e) === false) {
					let errorMessages: Array<string> = e.split("|");
					if (errorMessages.length > 0) {
						errorMessages.forEach((errorMessage: string) => {
							let alert = new MaterialAlertMessageType();
							alert.title = "Warning";
							alert.message = errorMessage;
							this.service.openAlert(alert);
						})
					}
				}
				else {
					let alert = new MaterialAlertMessageType();
					alert.title = "Warning";
					alert.message = e;
					this.service.openAlert(alert);
				}
			}
		}
		catch (e) {
			throw (e);
		}
	}

	async updateCompanyProfile(companyProfile: CompanyProfileDto): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			await this.doCompanyProfileUpdate(companyProfile, accessToken);
		}
		catch (e) {
			throw (e);
		}
	}

	doCompanyProfileUpdate(companyProfile: CompanyProfileDto, accessToken: string): void {
		this.showProfileUpdateProgress = true;
		this.service.updateCompanyProfile(companyProfile, accessToken)
			.then((updatedProfile: CompanyProfileDto) => {
				this.loadModels();
			})
			.catch((error) => {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = error;
				this.service.openAlert(alert);
			})
			.then(() => {
				this.showProfileUpdateProgress = false;
			});
	}

	async updateCompanyLogo(dataUri: string): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			await this.addCompanyProfileImage(dataUri, accessToken);
		}
		catch (e) {
			throw (e);
		}
	}

	addCompanyProfileImage(dataUri: string, accessToken: string): void {
		this.service.addCompanyProfileImage(dataUri, this.companyProfile.companyProfileId, accessToken)
			.then((companyProfile: CompanyProfileDto) => {
				this.companyProfile = companyProfile;
			})
			.catch((error) => {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = error;
				this.service.openAlert(alert);
			})
	}

	companyPhotoDeleted(companyPhoto: CompanyPhotoDto): void {
		this.photos = this.service.companyPhotos;
	}

	companyPhotoAdded(companyPhoto: CompanyPhotoDto): void {
		this.photos = this.service.companyPhotos;
	}

	companyLocationAdded(companyLocation: CompanyLocationDto): void {
		this.locations = this.service.companyLocations;
	}
}