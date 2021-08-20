import { Component, Input, Output, EventEmitter, Inject, Optional, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
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
	GuestProfileType,
	MemberType,
	RegisterDto,
	FormItemType,
} from "../../models/index";

import { Service } from "../../services/index";
import { FormGetInfoComponent } from '../../components/index';

@Component({
	styleUrls: ['guest-account.page.scss'],
	templateUrl: 'guest-account.page.html'
})
export class GuestAccountPage {
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		private service: Service,
		private fb: FormBuilder,
		private ngZone: NgZone,
		private matDialog: MatDialog,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		this.showProgress = false;
	}

	ngOnInit() {
		this.service.isCheckedIntoHubConnection()
			.then(() => {
				this.profile = this.service.guestProfile;
				if (this.service.isEmpty(this.profile)) {
					throw ("missing guestProfile");
				}
				else {
					return;
				}
			})
			.then(() => {
				this.createForm();
			})
			.catch((e) => {
				this.service.doLogout();
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

	defaultAvatar: string = this.service.defaultAvatar;
	showProgress: boolean;
	imgSrc: string = this.defaultAvatar;
	formGroup: FormGroup
	originalImage: string = "";
	originalEmail: string = "";

	_profile: GuestProfileType;
	get profile(): GuestProfileType {
		return this._profile;
	}
	set profile(value: GuestProfileType) {
		this._profile = value;
		if (this.service.isEmpty(value) === false) {
			this.originalImage = this.service.isEmpty(value.avatarFilename) ? "" :
				this.service.avatarBaseUrl + value.avatarFilename + "?" + Date.now().toString();
			this.imgSrc = this.service.isEmpty(value.avatarFilename) ? this.service.defaultAvatar : this.originalImage;
			this.originalEmail = value.email;
		}
	}

	createForm() {
		this.formGroup = this.fb.group({
			name: new FormControl(this.profile.name, [
				Validators.maxLength(100),
				Validators.required

			])
		})
	}

	async upgradeAccount(event: MouseEvent): Promise<void> {
		try {
			this.showProgress = true;
			let formId = 'upgrade-account-form';
			let firstName: string;
			let lastName: string;
			let email: string = this.profile.email;
			let names = this.profile.name.split(' ');
			console.log("names: ", names);
			if (this.service.isEmpty(names) === false) {
				if (names.length > 1) {
					lastName = names.pop();
					firstName = names[0];
				}
				else {
					firstName = names[0];
					lastName = "";
				}
			}

			let dialogRef = this.matDialog.open(FormGetInfoComponent, {
				width: '80%',
				height: '80%',
				data: '<p>Please verify or enter your information for your first name, last name, password, and email. All fields are required.</p>'
			});
			let formItems = new Array<FormItemType>();
			let emailItem = new FormItemType();
			emailItem.isEmail = true;
			emailItem.key = "email";
			emailItem.label = "Email [between 5 and 300 characters]";
			emailItem.maxLength = 300;
			emailItem.minLength = 5;
			emailItem.required = true;
			emailItem.value = this.profile.email;
			formItems.push(emailItem);

			let firstNameItem = new FormItemType();
			firstNameItem.isEmail = false;
			firstNameItem.key = "firstName";
			firstNameItem.label = "First Name [between 2 and 50 characters characters]";
			firstNameItem.maxLength = 50;
			firstNameItem.minLength = 2;
			firstNameItem.required = true;
			firstNameItem.value = firstName;
			formItems.push(firstNameItem);

			let lastNameItem = new FormItemType();
			lastNameItem.isEmail = false;
			lastNameItem.key = "lastName";
			lastNameItem.label = "Last Name [between 2 and 50 characters]";
			lastNameItem.maxLength = 50;
			lastNameItem.minLength = 2;
			lastNameItem.required = true;
			lastNameItem.value = this.service.isEmpty(lastName) ? "" : lastName;
			formItems.push(lastNameItem);

			let passwordItem = new FormItemType();
			passwordItem.isEmail = false;
			passwordItem.key = "password";
			passwordItem.label = "Password [between 5 and 25 characters]";
			passwordItem.maxLength = 25;
			passwordItem.minLength = 5;
			passwordItem.required = true;
			formItems.push(passwordItem);

			dialogRef.componentInstance.formItems = formItems;

			dialogRef.componentInstance.onSubmit.subscribe((formItems: Array<FormItemType>) => {
				let model: RegisterDto = new RegisterDto();
				let email = formItems.find((f) => { return f.key == "email"; });
				let firstName = formItems.find((f) => { return f.key == "firstName"; });
				let lastName = formItems.find((f) => { return f.key == "lastName"; });
				let password = formItems.find((f) => { return f.key == "password"; });
				model.username = email.value;
				model.password = password.value;
				model.firstName = firstName.value;
				model.lastName = lastName.value;
				model.email = email.value;

				this.ngZone.run(async () => {
					dialogRef.componentInstance.showProgress = true;
					let accessToken: string = await this.service.getAccessToken();

					if (this.service.isEmpty(accessToken)) {
						throw ("Access denied. Please try again later");
					}

					let member: MemberType;
					try {
						member = await this.service.register(model, accessToken);
					}
					catch (e) {
						console.log("error while upgrading account: ", e);
						throw ("An error occurred while trying to upgrade your account. Please try again later.")
					}

					if (this.service.isEmpty(member)) {
						throw ("Registration error. Unable to verify registration indentity. Please try login with your email and password. If you are unable to login, please contact us for further assistance.");
					}

					if (member.email.toLowerCase() === model.email.toLowerCase()) {
						await this.service.memberLogIn(model.email, model.password, true);
						this.showProgress = false;
						dialogRef.componentInstance.showProgress = false;
						dialogRef.close();
						this.router.navigate(['/account'], { relativeTo: this.activatedRoute });
					}
					else {
						throw ("Upgrade error. Unable to identify user. Please try to login with your email and password. If you are unable to login, please contact us for further assistance.")
					}
				});
			});

			dialogRef.componentInstance.onCancel.subscribe(() => {
				dialogRef.close();
			})

			dialogRef.afterClosed().subscribe(() => {
				dialogRef.componentInstance.onCancel.unsubscribe();
				dialogRef.componentInstance.onSubmit.unsubscribe();
				this.showProgress = false;
			});
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please check";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	async submit(event: MouseEvent): Promise<void> {
		this.showProgress = true;
		if (this.formGroup.valid) {
			let originalContent: string;
			if (this.service.isEmpty(event) === false) {
				originalContent = (<Element>event.target).innerHTML;
				(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
				(<Element>event.target).setAttribute("disabled", "true");
			}
			try {
				//let accessToken: string = this.service.jwtToken.access_token;
				this.profile.name = this.formGroup.get('name').value;
				this.service.guestProfile = this.profile;

				await this.service.webrtcHubCheckOut();

				let localGuid: string;
				try {
					localGuid = await this.service.webrtcHubCheckIn(name);
				}
				catch (e) {
					throw ("Access denied. Unable to request unique identifier for user. ")
				}

				if (this.service.isEmpty(localGuid) === false) {
					this.service.localGuid = localGuid;
				}
				else {
					throw ("Access denied. Unable to get unique identifier for user. If you are a guest user, this could mean someone else is logged in with your guest email.")
				}

				this.showProgress = false;
				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
			}
			catch (e) {
				this.showProgress = false;
				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e;
				this.service.openAlert(alert);
			}
		}
		else {
			this.showProgress = false;
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}
}