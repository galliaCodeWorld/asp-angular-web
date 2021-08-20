import { Component, AfterViewInit, ViewChild, NgZone } from '@angular/core';

import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

import { Service } from '../../services/index';
import { NetcastDto, MaterialAlertMessageType } from '../../models';
import { NetcastViewModel } from '../../models/view-models/netcast.viewmodel';
import { NetcastGenreViewModel } from "../../models/view-models/netcastGenre.viewmodel";

@Component({
	templateUrl: './netcast-details.page.html',
	styleUrls: ['./netcast-details.page.scss'],
})

export class NetcastDetailsPage {
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
	netcast: NetcastViewModel;
	netcastGenre: NetcastGenreViewModel;
	ngOnInit() {
		this.loading = true;
		this.service.isCheckedIntoHubConnection();
		this.service.isMember()
			.then((isMember) => {
				this.isMember = isMember;
			})

		this.isLoggedIn = this.service.isLoggedIn;
		this.activatedRoute.paramMap.subscribe((params) => {
			let netcastId: number = Number(params.get('netcastId'));
			this.initViewModel(netcastId)
				.catch((e) => {
					// NOTE: console log for debugging
					console.log("netcast-details.page initViewModel() error: ", e);
					let alert = new MaterialAlertMessageType();
					alert.title = "Error";
					alert.message = "Unable to retrieve Netcast details.";
					this.service.openAlert(alert);
				})
				.then(() => { this.loading = false; });
		});
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

	async initViewModel(netcastId: number): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken()
			let dto: NetcastDto = await this.service.getNetcastById(netcastId, accessToken);
			if (this.service.isEmpty(dto)) {
				throw ("Unable to retrieve netcast information.");
			}
			else {
				this.netcast = this.service.mapToNetcastViewModel(dto);
				if (this.service.isEmpty(this.netcast)) {
					throw ("Unable to map netcast dto to viewmodel");
				}
			}
		}
		catch (e) {
			throw (e);
		}
	}

	gotoNetcast(netcastId: string) {
		this.router.navigate(['/netcastee', netcastId], { relativeTo: this.activatedRoute });
	}
}