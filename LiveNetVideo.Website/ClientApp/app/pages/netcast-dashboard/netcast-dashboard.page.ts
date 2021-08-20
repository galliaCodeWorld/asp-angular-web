import { Component, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

import { Service } from '../../services/index';

@Component({
	templateUrl: './netcast-dashboard.page.html',
	styleUrls: ['./netcast-dashboard.page.scss'],
})

export class NetcastDashboardPage {
	constructor(
		private service: Service,

		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
	) {
	}

	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;

	loading: boolean;
	isMember: boolean;
	isLoggedIn: boolean;

	ngOnInit() {
		this.loading = true;
		this.service.isCheckedIntoHubConnection();
		this.service.isMember()
			.then((isMember) => {
				this.isMember = isMember;
			});
		this.isLoggedIn = this.service.isLoggedIn;
	}

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

	gotoNetcastList() {
		this.router.navigate(['/netcast-list'], { relativeTo: this.activatedRoute });
	}

	gotoNetcastSearch() {
		this.router.navigate(['/netcast-search'], { relativeTo: this.activatedRoute });
	}
}