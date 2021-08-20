import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
	Service
} from '../../services/index'

@Component({
	templateUrl: 'logout.page.html'
})
export class LogoutPage {
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		private service: Service,
	) { }

	ngOnInit() {
		//this.service.doLogout()
		//	.then(() => {
		//		this.service.unsetLocalBlockedEmails();
		//	})
		//	.catch((error) => {
		//		//console.log("app-shell.ts logOut error:", error);
		//	})
		//	.then(() => {
		//		this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
		//	})

		this.service.doLogout()
			.catch((e) => {
				console.log("logout.page.ts ngOnInit() doLogout() error: ", e);
			})
			.then(() => {
				//this.router.navigate(['/login'], { relativeTo: this.activatedRoute });

				// NOTE: whether on php or .net, you need to implement the /Account/LogOff/ controller
				// to do native php/.net logoff and redirect back to phone or native dashboard.
				if (this.service.domainName.toLowerCase() === "livevideomatch.com") {
					window.location.href = this.service.origin + '/Account/LogOff/';
				}
				else {
					this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
				}
			})
	}
}