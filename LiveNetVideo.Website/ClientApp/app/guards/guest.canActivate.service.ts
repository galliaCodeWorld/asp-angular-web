import { Injectable } from '@angular/core';
import {
	CanActivate, Router,
	ActivatedRouteSnapshot,
	RouterStateSnapshot
} from '@angular/router';
import {
	Service
} from "../services/index";

@Injectable()
export class GuestCanActivate implements CanActivate {
	constructor(
		private service: Service,
		private router: Router
	) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
		// pages that only require a login but does not require a memberId
		return new Promise<boolean>(async (resolve) => {
			let canActivatePage: boolean = await this.service.canActivatePage();
			if (canActivatePage) {
				//let isLoggedIn = await this.service.checkIsLoggedIn();
				//let guestProfile = this.service.guestProfile;
				//&& this.service.isEmpty(guestProfile) === false
				if (this.service.isEmpty(this.service.isLoggedIn) === false) {
					resolve(true);
				}
				else {
					this.service.redirectUrl = state.url;
					// Navigate to the login page
					//this.router.navigate(['/login']);
					resolve(false);
				}
			}
			else {
				this.service.redirectUrl = state.url;
				// Navigate to the login page
				//this.router.navigate(['/login']);
				resolve(false);
			}
		})
	}

	checkLogin(url: string): boolean {
		if (this.service.isLoggedIn) {
			return true;
		}
		else {
			return false;
		}
	}
}