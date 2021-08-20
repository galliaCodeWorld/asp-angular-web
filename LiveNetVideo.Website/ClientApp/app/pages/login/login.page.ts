import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
//import { ToastrService } from 'ngx-toastr';
import {
	Validators,
	FormBuilder,
	FormGroup
} from '@angular/forms';

import {
	JwtToken,
	GuestLogin,
	login,
	MemberType,
	MaterialAlertMessageType,
	IdDto,
	OrderByDto,
	PagingDto,
	CompanyProfileDto,
	MemberLoginType,
	GuestLoginType,
	PushSubscriptionType,
	CompanyEmployeeDto,
	CompanyPhotoDto,
	CompanyLocationDto,
	CompanyVideoDto
} from '../../models/index'

import {
	Service
} from '../../services/index'

@Component({
	styleUrls: ['login.page.scss'],
	templateUrl: 'login.page.html'
})
export class LoginPage {
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		public service: Service,
	) {
	}

	showInterface: boolean = false;

	ngOnInit() {
		console.log("ngOnInit login page");

		//console.log("setCookie: ", this.service.setCookie("test.txt", "a test cookie", 1));

		//let rememberMe = this.service.getCookie(this.service.keyRememberMe);
		//console.log("rememberMe: ", rememberMe);
		//let cookieJwtToken = this.service.getCookie(this.service.keyJwtToken);
		//console.log("cookieJwtToken: ", cookieJwtToken);
		//if (rememberMe == 'true' && !this.service.isEmpty(cookieJwtToken)) {
		//	console.log("setting jwtToken from cookieJwtToken: ", cookieJwtToken);
		//	this.service.setPermanentItem(this.service.keyRememberMe, rememberMe);
		//	let parsedCookieJwtToken: object = JSON.parse(cookieJwtToken);
		//	let jwtToken: JwtToken = new JwtToken();
		//	jwtToken.access_token = parsedCookieJwtToken["accessToken"];
		//	jwtToken.audience = parsedCookieJwtToken["audience"];
		//	jwtToken[".expires"] = parsedCookieJwtToken["expires"];
		//	jwtToken[".issued"] = parsedCookieJwtToken["issued"];
		//	jwtToken.refresh_token = parsedCookieJwtToken["refreshToken"];
		//	jwtToken.token_type = parsedCookieJwtToken["tokenType"];
		//	jwtToken.expires_in = parsedCookieJwtToken["expiresIn"];

		//	console.log("setting jwtToken from login: ", jwtToken);
		//	this.service.setPermanentItem(this.service.keyJwtToken, jwtToken);

		//	this.service.setCookie(this.service.keyRememberMe, false, -1);
		//	this.service.setCookie(this.service.keyJwtToken, "", -1);
		//}

		this.service.checkMemberCookieLogin()
			.then(() => {
				return this.service.checkIsLoggedIn();
			})
			.then((isLoggedIn: boolean) => {
				console.log("isLoggedIn: ", isLoggedIn);
				if (isLoggedIn) {
					this.router.navigate(['/dashboard'], { relativeTo: this.activatedRoute });
				}
			})
			.catch((e) => {
				console.log("login page error");
			})
			.then(() => {
				this.showInterface = true;
			})
	}

	ngAfterViewInit() {
		this.service.checkAndDisplayFlashMessage();
	}

	siteName: string = this.service.siteName;

	onMemberLoginSuccess(): void {
		console.log("onMemberLoginSuccess");
		this.router.navigate(['/dashboard'], { relativeTo: this.activatedRoute });
	}

	onGuestLoginSuccess(): void {
		//console.log("onGuestLoginSuccess");
		this.router.navigate(['/dashboard'], { relativeTo: this.activatedRoute });
	}
}