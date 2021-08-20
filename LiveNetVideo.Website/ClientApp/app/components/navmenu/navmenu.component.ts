import { Component, Input } from '@angular/core';
import {
	Router,
	ActivatedRoute
} from '@angular/router';
import {
	MaterialAlertMessageType,
	MemberType,
	ProfileSummaryType,
	ObservableMessageType
} from "../../models/index";
import {
	Service
} from '../../services/index';

import { Subscription } from 'rxjs/Subscription';

@Component({
	selector: 'navmenu-component',
	templateUrl: './navmenu.component.html',
	styleUrls: ['./navmenu.component.scss']
})
export class NavMenuComponent {
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		public service: Service,
	) {
		this.hasMainSite = false;
		this.isLoggedIn = false;
		this.isMember = false;
		this.phoneOnly = true;
		this.logo = "assets/images/lnv_logo_blue.png";
	}

	hasMainSite: boolean;

	isMember: boolean;
	isLoggedIn: boolean;
	phoneOnly: boolean;
	logo: string;
	onLoginUpdated: Subscription;

	ngOnInit() {
		this.hasMainSite = this.service.domainName.toLocaleUpperCase() === "livevideomatch.com" ? true : false;

		this.phoneOnly = this.service.phoneOnly;
		if (this.phoneOnly) {
			// NOTE: the phonelogo.png should be located in a /Content/img/ folder
			// for app that only uses phone
			this.logo = this.service.origin + "/Content/img/phonelogo.png";
		}
		this.startSubscriptions();
		this.init();
		//.then((isMember: boolean) => {
		//	this.isMember = isMember;
		//	//console.log("isMember: ", isMember);
		//	if (isMember) {
		//		// member
		//		//console.log("this.service.profile: ", this.service.profile);
		//		let profile = this.service.profile;
		//		if (this.service.isEmpty(profile) === false) {
		//			this.profileSummary.name = profile.firstName + " " + profile.lastName;
		//			this.profileSummary.email = profile.email;
		//			this.profileSummary.avatarSrc = this.service.isEmpty(profile.avatarFileName) ? this.service.defaultAvatar
		//				: this.service.avatarBaseUrl + profile.avatarFileName;

		//			console.log("navmenu this.profileSummary: ", this.profileSummary);
		//		}
		//	}
		//	else {
		//		// not a member
		//		let profile = this.service.guestProfile;
		//		if (this.service.isEmpty(profile) === false) {
		//			this.profileSummary.name = profile.name;
		//			this.profileSummary.email = profile.email;
		//			this.profileSummary.avatarSrc = this.service.isEmpty(profile.avatarDataUri) ? this.service.defaultAvatar
		//				: profile.avatarDataUri;
		//		}
		//	}
		//})
		//this.hasEmployers = this.service.isEmpty(this.service.employers) && this.service.employers.length < 1 ? false : true;
	}

	async init(): Promise<void> {
		this.isLoggedIn = this.service.isLoggedIn;
		try {
			this.isMember = await this.service.isMember();
		}
		catch (e) {
			// TODO: handle case when unable to determin if user is member
		}
	}

	startSubscriptions(): void {
		this.onLoginUpdated = this.service.onLoginUpdated
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				//console.log("navmenu.component login updated: ", message);
				try {
					this.isLoggedIn = this.service.isLoggedIn;
					this.isMember = await this.service.isMember();
				}
				catch (e) {
					console.log("Receive profile-summary error: ", e);
				}
			});
	}

	endSubscriptions(): void {
		this.onLoginUpdated && this.onLoginUpdated.unsubscribe();
	}

	gotoMainSiteDashboard(): void {
		window.location.href = this.service.origin + '/Member/Dashboard/';
	}
}