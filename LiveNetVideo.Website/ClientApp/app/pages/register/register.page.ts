import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import {
	RegisterDto, MemberType, MaterialAlertMessageType,
} from '../../models/index'

import {
	Validators,
	FormBuilder,
	FormGroup
} from '@angular/forms';

import {
	Service
} from '../../services/index'

@Component({
	styleUrls: ['register.page.scss'],
	templateUrl: 'register.page.html'
})
export class RegisterPage {
	public base64Image: string;

	imageSrc: string;

	regForm: FormGroup;

	profilePicture: any = "/images/default-avatar.png";

	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		public service: Service

	) {
		////Custom validation methods can be updated in respective files
		////Formvalidator,EmailValidator,PasswordValidator
		//this.regForm = this.formBuilder.group({
		//    firstname: ['', Validators.compose([FormValidator.isNameValid])],
		//    lastname: ['', Validators.compose([FormValidator.isNameValid])],
		//    email: ['', Validators.compose([EmailValidator.isValidEmailFormat])],
		//    password: ['', Validators.compose([Validators.required, Validators.minLength(7), Validators.maxLength(25)])],
		//    avatar: ['']
		//});

		//this.showRegisterProgress = false;
	}

	showRegisterProgress: boolean;

	ngOnInit() {
		this.showRegisterProgress = false;
	}

	ngAfterViewInit() {
		this.service.checkAndDisplayFlashMessage();
	}

	async onRegister(model: RegisterDto): Promise<void> {
		try {
			this.showRegisterProgress = true;
			let accessToken: string = await this.service.getAccessToken();

			if (this.service.isEmpty(accessToken)) {
				throw ("Access denied. Please try again later");
			}

			let member: MemberType;
			try {
				member = await this.service.register(model, accessToken);
			}
			catch (e) {
				console.log("error while registering: ", e);
				throw ("An error occurred while trying to register. Please try again later.")
			}

			if (this.service.isEmpty(member)) {
				throw ("Registration error. Unable to verify registration indentity. Please try login with your email and password. If you are unable to login, please contact us for further assistance.");
			}

			if (member.email.toLowerCase() === model.email.toLowerCase()) {
				await this.service.memberLogIn(model.email, model.password, true);
				this.showRegisterProgress = false;
				this.router.navigate(['/dashboard'], { relativeTo: this.activatedRoute });
			}
			else {
				throw ("Registration error. Unable to identify user. Please try to login with your email and password. If you are unable to login, please contact us for further assistance.")
			}
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please check";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	//register() {
	//    this.showRegisterProgress = true;

	//    //Fill details from form into register class object
	//    let registerData: RegisterDto = new RegisterDto();
	//    registerData.username = this.regForm.get('email').value;
	//    registerData.firstName = this.regForm.get('firstname').value;
	//    registerData.lastName = this.regForm.get('lastname').value;
	//    registerData.email = this.regForm.get('email').value;
	//    registerData.password = this.regForm.get('password').value;
	//    registerData.avatarDataUri = this.base64Image;

	//    let jwtToken = this.signalrService.jwtToken;
	//    if (this.jsHelperService.isEmpty(jwtToken) === false) {
	//        this.userService.register(registerData, jwtToken.access_token)
	//            .then(() => {
	//                //After success/failure dismiss loading controller
	//                this.userService.memberLogIn(registerData.email, registerData.password, false)
	//                    .then(() => {
	//                        this.showRegisterProgress = false;
	//                        this.router.navigate(['/dashboard'], { relativeTo: this.activatedRoute });
	//                    })
	//                    .catch((error) => {
	//                        this.showRegisterProgress = false;
	//                        // let alertMessage = new MaterialAlertMessageType();
	//                        // alertMessage.title = "Error while trying to login after registration.";
	//                        // alertMessage.message = error;
	//                        // this.materialHelperService.openAlert(alertMessage);
	//                    });
	//            })
	//            .catch((error) => {
	//                this.showRegisterProgress = false;
	//                // let alertMessage = new MaterialAlertMessageType();
	//                // alertMessage.title = "ERROR";
	//                // alertMessage.message = error;
	//                // this.materialHelperService.openAlert(alertMessage);
	//            });
	//    }
	//    else {
	//        this.showRegisterProgress = false;

	//        // let actionAlertMessage = new MaterialActionAlertMessageType();
	//        // actionAlertMessage.title = "Error";
	//        // actionAlertMessage.message = "Sorry it appears your session credentials has been lost. Please click the reset button to try to reset your session or cancel to go back.";
	//        // this.materialHelperService.openActionAlert(actionAlertMessage)
	//        //     .then((doAction) => {
	//        //         if (doAction) {
	//        //             this.signalrService.init()
	//        //                 .then(() => {
	//        //                     let alertMessage = new MaterialAlertMessageType();
	//        //                     alertMessage.title = "SUCCESS";
	//        //                     alertMessage.message = "Your credentials have been reset. Please try your request again.";
	//        //                     this.materialHelperService.openAlert(alertMessage);
	//        //                 })
	//        //                 .catch((error) => {
	//        //                     console.log("login.component.ts login() signalrService.init() error: ", error);
	//        //                     let alertMessage = new MaterialAlertMessageType();
	//        //                     alertMessage.title = "Error";
	//        //                     alertMessage.message = "Sorry we were unable to reset your credentials. This could be due to network errors. Please try again a little later.";
	//        //                     this.materialHelperService.openAlert(alertMessage);
	//        //                 });
	//        //         }
	//        //         else {
	//        //             this.flashMessageService.title = "ERROR";
	//        //             this.flashMessageService.message = "To protect your privacy and the privacy of other users, this app requires your permission to run. Restart the app to give it permission to run.";
	//        //             this.router.navigate(['/error'], { relativeTo: this.activatedRoute });
	//        //         }
	//        //     })
	//        //     .catch((error) => {
	//        //         console.log("login.component.ts login() materialHelperService.openActionAlert() error: ", error);
	//        //     });
	//    }
	//}

	pictureChanged(img: any) {
		this.base64Image = img;
	}
}