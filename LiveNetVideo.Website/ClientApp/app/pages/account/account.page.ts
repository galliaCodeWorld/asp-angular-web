import { Component, Input, Output, EventEmitter, Inject, AfterViewInit, ViewChild, NgZone } from '@angular/core';
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
	MemberType,
} from "../../models/index";

import { Service } from "../../services/index";
import { MaterialActionAlertComponent } from "../../components/index";

@Component({
	styleUrls: ['account.page.scss'],
	templateUrl: 'account.page.html'
})
export class AccountPage {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		private matDialog: MatDialog,
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
	) {
		this.showProgress = false;

		//this.initializeForms();

		//if (this.userService.isMember) {
		//	this.pageLoading = true;
		//	let jwtToken = this.signalrService.jwtToken;
		//	if (this.jsHelperService.isEmpty(jwtToken) === false) {
		//		this.userService.getMyProfile(jwtToken.access_token)
		//			.then((userProfile: MemberType) => {
		//				this.userProfile = userProfile;
		//				this.nameForm.controls['firstName'].setValue(this.userProfile.firstName)
		//				this.nameForm.controls['lastName'].setValue(this.userProfile.lastName)
		//				//this.originalProfileAvatar = this.userProfile.avatarDataUri.replace(/\s/g, "+");
		//				this.originalProfileAvatar = this.configService.avatarBaseUrl + this.userProfile.avatarFileName;
		//				this.pageLoading = false;
		//			})
		//			.catch((error) => {
		//				console.log("account.ts this.userService.getMyProvile() error: ", error);
		//			})
		//	}
		//	else {
		//		this.userService.doLogout()
		//			.catch((error) => {
		//			})
		//			.then(() => {
		//				this.flashMessageService.title = "ERROR";
		//				this.flashMessageService.message = "Missing authorization. Please log back in to regain authorization.";
		//				this.flashMessageService.type = 'error'
		//				this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
		//			})
		//	}
		//}
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

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		this.model = this.service.profile;

		this.createForm();
	}

	defaultAvatar: string = this.service.defaultAvatar;
	showProgress: boolean;
	imgSrc: string = this.defaultAvatar;
	formGroup: FormGroup
	originalImage: string = "";
	originalEmail: string = "";

	_model: MemberType;
	get model(): MemberType {
		return this._model;
	}
	set model(value: MemberType) {
		this._model = value;
		if (this.service.isEmpty(value) === false) {
			this.originalImage = this.service.isEmpty(value.avatarFileName) ? "" :
				this.service.avatarBaseUrl + value.avatarFileName + "?" + Date.now().toString();
			this.imgSrc = this.service.isEmpty(value.avatarFileName) ? this.service.defaultAvatar : this.originalImage;
			this.originalEmail = value.email;
		}
	}

	createForm() {
		this.formGroup = this.fb.group({
			firstName: new FormControl(this.model.firstName, [
				Validators.maxLength(100),
				Validators.required

			]),
			lastName: new FormControl(this.model.lastName, [
				Validators.maxLength(50),
				Validators.required

			]),
			password: new FormControl('', [
				Validators.maxLength(50)

			]),
			confirmPassword: new FormControl('', [
				Validators.maxLength(50)

			]),
			email: new FormControl(this.model.email, [
				Validators.maxLength(300),
				Validators.required,
				Validators.email

			]),
		})
	}

	onImageSelected(imageDataUri: string): void {
		this.imgSrc = imageDataUri;
	}

	removeImage(): void {
		this.imgSrc = this.defaultAvatar;
	}

	cancel(): void {
		this.router.navigate(['/dashboard'], { relativeTo: this.activatedRoute });
	}

	async submit(event: Event): Promise<void> {
		let warnings: Array<string> = new Array<string>();
		let originalContent: string;
		if (this.service.isEmpty(event) === false) {
			originalContent = (<Element>event.target).innerHTML;
			(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
			(<Element>event.target).setAttribute("disabled", "true");
		}
		this.showProgress = true;
		try {
			if (this.formGroup.valid) {
				let accessToken: string;
				try {
					accessToken = await this.service.getAccessToken();
				}
				catch (e) {
					throw ("Unable to request access.");
				}

				if (this.service.isEmpty(accessToken)) {
					throw ("Access denied. Please try again later.")
				}

				let member: MemberType;

				let firstName: string = this.formGroup.get('firstName').value;
				let lastName: string = this.formGroup.get('lastName').value;

				if (firstName !== this.model.firstName || lastName !== this.model.lastName) {
					try {
						member = await this.service.updateMyProfile(this.model, accessToken)
						await this.service.webrtcHubCheckOut();
						let localGuid: string;
						try {
							localGuid = await this.service.webrtcHubCheckIn(firstName + " " + lastName);
							this.service.localGuid = localGuid;
							this.model = member;
						}
						catch (e) {
							throw ("Changing your name requires getting a new identifier, but the request to get a new identifier failed.");
						}
					}
					catch (e) {
						throw ("Request to update member profile failed");
					}
				}

				if (this.imgSrc === this.defaultAvatar) {
					// delete image
					try {
						member = await this.service.deleteMemberProfileImage(accessToken);
						this.model = member;
					}
					catch (e) {
						warnings.push("Unable to remove profile image");
					}
				}
				else if (this.imgSrc !== this.originalImage) {
					// add new image
					try {
						member = await this.service.addMemberProfileImage(this.imgSrc, accessToken);
						this.model = member;
					}
					catch (e) {
						warnings.push("Unable to add/update profile image");
					}
				}

				let password = this.formGroup.get('password').value;
				if (this.service.isEmpty(password) === false && this.formGroup.get('password').value === this.formGroup.get('confirmPassword').value) {
					try {
						member = await this.service.changePassword(password, accessToken);
					}
					catch (e) {
						warnings.push("Unable to change password.");
					}
				}

				this.showProgress = false;
				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}

				if (this.formGroup.get('email').value !== this.originalEmail) {
					try {
						// confirm before performing delete
						let alert = new MaterialActionAlertMessageType();
						alert.title = "Please Confirm";
						alert.message = '<p>Changing your email will require the system to log you out. You will have to log back in with your new email. Do you wish to change your email?</p>';
						alert.noButton = "No";
						alert.yesButton = "Yes";

						let dialogRef = this.matDialog.open(MaterialActionAlertComponent, {
							width: '80%',
							height: '80%',
							data: alert
						});

						dialogRef.afterClosed().subscribe(async () => {
							if (alert.doAction === true) {
								member = await this.processEmail(this.formGroup.get('email').value, accessToken);
								if (this.service.isEmpty(member) === false) {
									// log the userout
									this.router.navigate(['/logout'], { relativeTo: this.activatedRoute });
								}
								else {
									let alert = new MaterialAlertMessageType();
									alert.title = "Error";
									alert.message = "Email update failed";
									setTimeout(() => { this.service.openAlert(alert); })
								}
							}
						});

						// log the member out and back in
					}
					catch (e) {
						warnings.push(e);
					}
				}

				if (this.service.isEmpty(warnings) === false) {
					let alert = new MaterialAlertMessageType();
					alert.title = "Warning: Please check, ";
					alert.message = this.service.implode("<br />", warnings);
					this.service.openAlert(alert);
				}
			}
			else {
				this.showProgress = false;
				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
				let alert = new MaterialAlertMessageType();
				alert.title = "Please Check";
				alert.message = "Please make sure the form is filled out and any error messages are fixed."
				this.service.openAlert(alert);
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

	async processImage(dataUri: string, accessToken): Promise<MemberType> {
		try {
			let member = await this.service.addMemberProfileImage(dataUri, accessToken)
			return member;
		}
		catch (e) {
			throw (e);
		}
	}

	async processEmail(email: string, accessToken): Promise<MemberType> {
		try {
			let responseEmail = await this.service.isEmailUnique(email, accessToken)
			if (this.service.isEmpty(responseEmail)) {
				// empty responseEmail means the email is unique
				try {
					let member = await this.service.updateEmail(email, accessToken);
					return member;
				}
				catch (e) {
					throw ("Request to update email failed");
				}
			}
			else if (email === this.originalEmail) {
				throw ("The email provided is the same as the original email.")
			}
		}
		catch (e) {
			throw (e);
		}
	}

	//_originalProfileAvatar: string;
	//get originalProfileAvatar(): string {
	//	return this._originalProfileAvatar;
	//}
	//set originalProfileAvatar(value: string) {
	//	this._originalProfileAvatar = value;
	//}

	//initializeForms() {
	//	this.emailForm = this.formBuilder.group({
	//		email: ['', Validators.compose([EmailValidator.isValidEmailFormat]),
	//			this.validateEmailNotTaken.bind(this)]
	//	})

	//	this.nameForm = this.formBuilder.group({
	//		firstName: ['', Validators.compose([Validators.required])],
	//		lastName: ['', Validators.compose([Validators.required])]
	//	})

	//	this.passwordForm = this.formBuilder.group({
	//		currentPassword: ['', Validators.compose([Validators.required]),
	//			this.validatePassword.bind(this)],
	//		newPassword: ['', Validators.compose([Validators.required, Validators.minLength(7), Validators.maxLength(25)])],
	//		confirmNewPassword: ['', Validators.compose([Validators.required])]
	//	}, {
	//			validator: this.matchPassword
	//		})
	//}

	//validateEmailNotTaken(control: AbstractControl) {
	//	let jwtToken = this.signalrService.jwtToken;
	//	if (this.jsHelperService.isEmpty(jwtToken) === false) {
	//		return this.userService.isEmailUnique((control.value), jwtToken.access_token)
	//			.then(isUnique => {
	//				return isUnique ? null : { emailTaken: true }
	//			})
	//			.catch((err) => {
	//				return { emailTaken: true }
	//			})
	//	}
	//	else {
	//		this.userService.doLogout()
	//			.catch((error) => {
	//			})
	//			.then(() => {
	//				this.flashMessageService.title = "ERROR";
	//				this.flashMessageService.message = "Missing authorization. Please log back in to regain authorization.";
	//				this.flashMessageService.type = 'error'
	//				this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
	//			})
	//	}
	//}

	//validatePassword(control: AbstractControl) {
	//	let jwtToken = this.signalrService.jwtToken;
	//	if (this.jsHelperService.isEmpty(jwtToken) === false) {
	//		return this.userService.verifyPassword((control.value), jwtToken.access_token)
	//			.then(res => {
	//				return res ? null : { invalidPassword: true }
	//			})
	//			.catch((err) => {
	//				return { invalidPassword: true }
	//			})
	//	}
	//	else {
	//		this.userService.doLogout()
	//			.catch((error) => {
	//			})
	//			.then(() => {
	//				this.flashMessageService.title = "ERROR";
	//				this.flashMessageService.message = "Missing authorization. Please log back in to regain authorization.";
	//				this.flashMessageService.type = 'error'
	//				this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
	//			})
	//	}
	//}

	//matchPassword(control: AbstractControl) {
	//	let password = control.get('newPassword').value; // to get value in input tag
	//	let confirmPassword = control.get('confirmNewPassword').value; // to get value in input tag
	//	if (password != confirmPassword) {
	//		console.log('false');
	//		control.get('confirmNewPassword').setErrors({ unMatchedPassword: true })
	//	} else {
	//		console.log('true');
	//		return null
	//	}
	//}

	//updateNameAndAvatar() {
	//	this.saveNameLoading = true;
	//	this.userProfile.firstName = this.nameForm.get('firstName').value;
	//	this.userProfile.lastName = this.nameForm.get('lastName').value;
	//	this.userProfile.avatarDataUri = this.originalProfileAvatar;

	//	let jwtToken = this.signalrService.jwtToken;
	//	if (this.jsHelperService.isEmpty(jwtToken) === false) {
	//		this.userService.updateMyProfile(this.userProfile, jwtToken.access_token)
	//			.then((userProfile: MemberType) => {
	//				this.userProfile = userProfile;
	//				this.nameForm.controls['firstName'].setValue(this.userProfile.firstName)
	//				this.nameForm.controls['lastName'].setValue(this.userProfile.lastName)
	//				this.toastr.success('NAME UPDATED', 'SUCCESS')
	//			})
	//			.catch((error) => {
	//				console.log('failed to update name', error)
	//			})
	//			.then(() => {
	//				this.saveNameLoading = false;
	//			})
	//	}
	//	else {
	//		this.userService.doLogout()
	//			.catch((error) => {
	//			})
	//			.then(() => {
	//				this.flashMessageService.title = "ERROR";
	//				this.flashMessageService.message = "Missing authorization. Please log back in to regain authorization.";
	//				this.flashMessageService.type = 'error'
	//				this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
	//			})
	//	}
	//}

	//updateEmail() {
	//	this.saveEmailLoading = true;
	//	let newEmail = this.emailForm.get('email').value;
	//	let jwtToken = this.signalrService.jwtToken;
	//	if (this.jsHelperService.isEmpty(jwtToken) === false) {
	//		this.userService.updateEmail(newEmail, jwtToken.access_token)
	//			.then(() => {
	//				return this.userService.updateUsername(newEmail, jwtToken.access_token)
	//			})
	//			.then((userProfile: MemberType) => {
	//				this.userProfile = userProfile;
	//				this.emailForm.controls['email'].setValue(this.userProfile.email)
	//				this.toastr.success('Email updated', 'SUCCESS')
	//				this.emailForm.get('email').markAsUntouched();
	//			})
	//			.catch(error => {
	//				console.log('failed to update email && username', error)
	//			})
	//			.then(() => {
	//				this.saveEmailLoading = false;
	//			})
	//	}
	//	else {
	//		this.userService.doLogout()
	//			.catch((error) => {
	//			})
	//			.then(() => {
	//				this.flashMessageService.title = "ERROR";
	//				this.flashMessageService.message = "Missing authorization. Please log back in to regain authorization.";
	//				this.flashMessageService.type = 'error'
	//				this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
	//			})
	//	}
	//}

	//updatePassword() {
	//	let newPassword = this.passwordForm.get('newPassword').value
	//	this.savePasswordLoading = true;
	//	let jwtToken = this.signalrService.jwtToken;
	//	if (this.jsHelperService.isEmpty(jwtToken) === false) {
	//		this.userService.changePassword(newPassword, jwtToken.access_token)
	//			.then((userProfile: MemberType) => {
	//				this.userProfile = userProfile;
	//				this.toastr.success('Password update request sent.', 'SUCCESS')
	//			})
	//			.catch()
	//			.then(() => {
	//				this.savePasswordLoading = false;
	//			})
	//	}
	//	else {
	//		this.userService.doLogout()
	//			.catch((error) => {
	//			})
	//			.then(() => {
	//				this.flashMessageService.title = "ERROR";
	//				this.flashMessageService.message = "Missing authorization. Please log back in to regain authorization.";
	//				this.flashMessageService.type = 'error'
	//				this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
	//			})
	//	}
	//}
	//pictureChanged(img: string) {
	//	this.originalProfileAvatar = img;
	//}
}