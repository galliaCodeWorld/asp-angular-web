import { Injectable } from '@angular/core';
import {
	CanActivate, Router,
	ActivatedRouteSnapshot,
	RouterStateSnapshot
} from '@angular/router';
import {
	Service
} from "../services/index";
import { Observable } from 'rxjs/Observable';
import { AccessTokenErrorCodeEnum } from '../models';

@Injectable()
export class PageCanActivate implements CanActivate {
	constructor(
		private service: Service,
		private router: Router
	) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
		return new Promise<boolean>(async (resolve) => {
			try {
				let canActivatePage: boolean = await this.service.canActivatePage();
				resolve(canActivatePage);
			}
			catch (e) {
				// if a error is thrown, handle it
				// if the error is an accessToken error, then clear accessToken information
				// and send them to the login page
				// else send them to the error page
				if (e == AccessTokenErrorCodeEnum.getNewGuestTokenError) {
					this.service.flashMessage = "The server did not allow your request at this time. Please try your request later.";
					this.router.navigate(['/error']);
					resolve(false);
				}
				else if (e == AccessTokenErrorCodeEnum.renewTokenError) {
					// prompt the user for login
					let isLoggedIn: boolean = await this.service.promptMemberLogin();
					if (this.service.isEmpty(isLoggedIn)) {
						await this.service.logMemberOut();
						this.service.flashMessage = "Sorry your login credentials were lost. Please log back in to continue.";
						this.router.navigate(['/login']);
						resolve(false);
					}
					else {
						resolve(isLoggedIn);
					}
				}
				else {
					this.service.flashMessage = "A network error occurred. Please try your request later.";
					this.router.navigate(['/error']);
					resolve(false);
				}
			}

			//if (canActivatePage) {
			//	resolve(true);
			//}
			//else {
			//	//this.router.navigate(['/error']);
			//	resolve(false);
			//}
		});
	}
}