import { Component, Input } from '@angular/core';
import {
	Router,
	ActivatedRoute
} from '@angular/router';
import {
	ProfileSummaryType, MemberType
} from "../../models/index";
import {
	Service
} from '../../services/index';
import { Subscription } from 'rxjs/Subscription';
import { ObservableMessageType } from '../../models/observableMessage.type';

@Component({
	selector: 'profile-summary-component',
	templateUrl: './profile-summary.component.html',
	styleUrls: ['./profile-summary.component.scss'],
})
export class ProfileSummaryComponent {
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		public service: Service,
	) {
	}

	avatarSrc: string;
	name: string;
	email: string;

	onProfileUpdated: Subscription;

	ngOnInit() {
		this.startSubscriptions();
		this.init();
	}

	ngOnDestroy() {
		this.endSubscriptions();
	}

	async init(): Promise<void> {
		try {
			let isMember = await this.service.isMember();
			if (isMember) {
				// member
				let profile = this.service.profile;
				if (this.service.isEmpty(profile) === false) {
					this.name = profile.firstName + " " + profile.lastName;
					this.email = profile.email;
					this.avatarSrc = this.service.isEmpty(profile.avatarFileName) ? this.service.defaultAvatar
						: this.service.avatarBaseUrl + profile.avatarFileName + "?" + Date.now().toString();
				}
			}
			else if (this.service.isLoggedIn) {
				// not a member
				let profile = this.service.guestProfile;
				if (this.service.isEmpty(profile) === false) {
					this.name = this.service.isEmpty(profile.name) ? "Anonymous" : profile.name;
					this.email = this.service.isEmpty(profile.email) ? "" : profile.email;
					this.avatarSrc = this.service.isEmpty(profile.avatarDataUri) ? this.service.defaultAvatar
						: profile.avatarDataUri;
				}
			}
			else {
				this.name = "Anonymous";
				this.email = "";
				this.avatarSrc = this.service.defaultAvatar;
			}
		}
		catch (e) {
			this.name = "Anonymous";
			this.email = "";
			this.avatarSrc = this.service.defaultAvatar;
		}
	}

	startSubscriptions(): void {
		this.onProfileUpdated = this.service.onProfileUpdated
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				try {
					let json = message.message;
					if (this.service.isEmpty(json) === false) {
						let member: MemberType = this.service.jsonToObject<MemberType>(json, true);
						if (this.service.isEmpty(member) === false) {
							console.log("profile-summary receive onProfileUpdated: ", member);
							this.name = member.firstName + " " + member.lastName;
							this.email = member.email;
							this.avatarSrc = this.service.isEmpty(member.avatarFileName) ? this.service.defaultAvatar
								: this.service.avatarBaseUrl + member.avatarFileName + "?" + Date.now().toString();
						}
						else {
							throw ("Unable to parse profile-summary memberType");
						}
					}
					else {
						throw ("Received empty profile-summary.")
					}
				}
				catch (e) {
					console.log("Receive profile-summary error: ", e);
				}
			});

		//console.log("starting profile-summary subscriptions");
		//this.service.onProfileUpdated.subscribe((member: MemberType) => {
		//	console.log("profile-summary updating: ", member);
		//	this.name = member.firstName + " " + member.lastName;
		//	this.email = member.email;
		//	this.avatarSrc = this.service.isEmpty(member.avatarFileName) ? this.service.defaultAvatar
		//		: this.service.avatarBaseUrl + member.avatarFileName + "?" + Date.now().toString();
		//});
	}

	endSubscriptions(): void {
		this.onProfileUpdated && this.onProfileUpdated.unsubscribe();
	}
}