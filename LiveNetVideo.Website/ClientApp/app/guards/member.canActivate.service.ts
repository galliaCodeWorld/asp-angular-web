import { Injectable } from '@angular/core';
import {
	CanActivate, Router,
	ActivatedRouteSnapshot,
	RouterStateSnapshot
} from '@angular/router';
import {
	Service
} from "../services/index";
import { JwtToken } from '../models';

@Injectable()
export class MemberCanActivate implements CanActivate {
	constructor(
		private service: Service,
		private router: Router
	) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
		// pages that require a memberId
		return new Promise<boolean>(async (resolve) => {
			let canActivatePage: boolean = await this.service.canActivatePage();
			if (canActivatePage) {
				//console.log("member.canActivate getting accessToken")
				//let accessToken: string = await this.service.getAccessToken();
				//console.log("member.canActivate got accessToken: ", accessToken);
				//let jwtToken: JwtToken = this.service.jwtToken;
				//let accessToken: string = this.service.isEmpty(jwtToken) ? "" : jwtToken.access_token;
				//let memberId: string = this.service.getMemberId(accessToken);

				//let isLoggedIn = await this.service.checkIsLoggedIn();

				let isMember: boolean = await this.service.isMember();

				if (this.service.isEmpty(this.service.isLoggedIn) === false && this.service.isEmpty(isMember) === false) {
					resolve(true);
				}
				else {
					// Store the attempted URL for redirecting
					this.service.redirectUrl = state.url;

					// Navigate to the login page with extras
					//this.router.navigate(['/login']);
					resolve(false);
				}
			}
			else {
				// Store the attempted URL for redirecting
				this.service.redirectUrl = state.url;

				// Navigate to the login page with extras
				//this.router.navigate(['/login']);
				resolve(false);
			}
		});

		//let url: string = state.url;

		//return this.checkLogin(url);
	}

	//checkLogin(url: string): boolean {
	//	let jwtToken = this.service.jwtToken;
	//	if (this.service.isEmpty(jwtToken) === false
	//		&& this.service.isEmpty(jwtToken.access_token) === false
	//		&& this.service.isEmpty(this.service.getMemberId(jwtToken.access_token)) === false) {
	//		return true;
	//	}

	//	// Store the attempted URL for redirecting
	//	this.service.redirectUrl = url;

	//	// Navigate to the login page with extras
	//	this.router.navigate(['/login']);
	//	return false;
	//}
}