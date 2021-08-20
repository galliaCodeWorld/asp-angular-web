import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import {
	Service
} from '../../services/index';

import {
	MaterialAlertMessageType,
} from '../../models/index'

@Component({
	styleUrls: ['./dashboard.page.scss'],
	templateUrl: './dashboard.page.html'
})
export class DashboardPage {
	constructor(
		private activatedRoute: ActivatedRoute,
		private router: Router,
		private service: Service,
		private ngZone: NgZone,
	) {
		this.phoneOnly = true;
	}

	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;

	// TODO: get count of number of contacts, count of block emails, count of employers
	// TODO: add messaging

	isMember: boolean;
	isLoggedIn: boolean;
	phoneOnly: boolean;

	ngOnInit() {
		this.phoneOnly = this.service.phoneOnly;
		console.log("dashboard.page ngOnInit");
		this.service.isCheckedIntoHubConnection()
			.then(() => {
				return this.service.isMember();
			})
			.then((isMember) => {
				this.isMember = isMember;
			});
		this.isLoggedIn = this.service.isLoggedIn;

		//console.log("jwtToken: ", this.service.jwtToken);
		//console.log("memberId: ", this.service.getMemberId(this.service.jwtToken.access_token));
	}

	ngOnDestroy() {
	}

	ngAfterViewInit() {
		//console.log("dashboard.page ngAfterViewInit");

		this.service.checkAndDisplayFlashMessage();
		// need this to open the side nav menu so it doesn't overlap the sidecontent
		this.ngZone.run(() => {
			setTimeout(() => {
				//console.log("window Width: ", window.innerWidth);
				if (window.innerWidth < 500) {
					this._container.close();
				}
				else {
					this._container.open();
				}
			}, 250);
		});

		//this.service.doPageRefreshCheck();
		//this.service.getAccessToken()
		//	.then((accessToken: string) => {
		//		console.log("accessToken: ", accessToken);
		//		return this.service.getHubConnectionEmailByGuid(this.service.localGuid, accessToken);
		//	})
		//	.then((email: string) => {
		//		console.log("email: ", email);
		//	})
		//	.catch((e) => {
		//		console.log("dashboard ngAfterViewInit error: ", e);
		//	});
	}

	// for testing only
	async testRenewToken(): Promise<void> {
		let jwtToken = this.service.jwtToken;
		console.log("oldToken: ", jwtToken);

		let newToken = await this.service.renewToken(jwtToken);

		console.log("newToken: ", newToken);

		this.service.setAccessToken(newToken);

		let setToken = this.service.jwtToken;

		console.log("setToken: ", setToken);

		return;
	}
}