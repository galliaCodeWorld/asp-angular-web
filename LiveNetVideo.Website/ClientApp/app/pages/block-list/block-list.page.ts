import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Subscription } from "rxjs/Subscription";
import {
	Service
} from '../../services/index';

import {
	BlockedEmailType,
	CallType,
	IncomingCallResponseEnum,
	ObservableMessageType,
	MaterialAlertMessageType,
	PropertyTrackingEnum
} from '../../models/index';

@Component({
	styleUrls: ['./block-list.page.scss'],
	templateUrl: 'block-list.page.html'
})
export class BlockListPage {
	blockedEmails: BlockedEmailType[];
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		public service: Service,
		private ngZone: NgZone,
	) {
		this.loading = true;
		this.isDisabled = false;
	}

	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;
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

	loading: boolean;
	isDisabled: boolean;

	//receivePhoneLineInvitation: Subscription;
	//receiveRemoteLogout: Subscription;

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		this.loading = true;
		this.service.getAccessToken()
			.then((accessToken) => {
				return this.getBlocklist(accessToken);
			})
			.then((blockedList: Array<BlockedEmailType>) => {
				this.blockedEmails = blockedList;
			})
			.catch((e) => {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e.toString();
				this.service.openAlert(alert);
			})
			.then(() => {
				this.loading = false;
			})

		//console.log("account.ts ionViewWillEnter");
		//this.updateAllBlockEmails()
		//this.flashMessageService.title = "ERROR";
		//this.flashMessageService.message = "Missing authorization. Please log back in to regain authorization.";
	}

	async unblock(blockedEmail: BlockedEmailType, event: Event): Promise<void> {
		let originalContent: string;
		try {
			//console.log("event: ", event);

			if (this.service.isEmpty(event) === false) {
				originalContent = (<Element>event.target).innerHTML;
				(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
				(<Element>event.target).setAttribute("disabled", "true");
			}

			this.isDisabled = true;
			let accessToken: string;

			try {
				accessToken = await this.service.getAccessToken();
			}
			catch (e) {
				throw ("Unable to get access. Please try your request again.");
			}

			if (this.service.isEmpty(accessToken) === false) {
				let result: boolean = false;
				try {
					result = await this.service.unblockEmail(blockedEmail.blockedEmailId, accessToken)
				}
				catch (e) {
					throw ("Request to unblock " + blockedEmail.emailBlocked + " has failed. Please try your request later.");
				}

				if (result === true) {
					// remove the blocked email from the list.
					this.service.trackArrayProperty<BlockedEmailType>(this.blockedEmails, blockedEmail, this.service.nameof<BlockedEmailType>("blockedEmailId"), PropertyTrackingEnum.delete)
				}
			}

			this.isDisabled = false;
		}
		catch (e) {
			if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
				(<Element>event.target).innerHTML = originalContent;
				(<Element>event.target).removeAttribute("disabled");
			}
			this.isDisabled = false;
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	//updateAllBlockEmails() {
	//	let jwtToken = this.signalrService.jwtToken;
	//	if (this.jsHelperService.isEmpty(jwtToken) === false) {
	//		this.blockCallService.getAllBlockedEmails(jwtToken.access_token)
	//			.then((blockedEmails: BlockedEmailType[]) => {
	//				this.blockedEmails = blockedEmails
	//				//console.log(blockedEmails, 'from block list')
	//			})
	//			.catch(error => {
	//				//console.log("something went wrong from block0list", error)
	//			})
	//			.then(() => {
	//				this.showLoadingProgress = false;
	//			})
	//	}
	//	else {
	//		this.service.doLogout()
	//			.catch((error) => {
	//			})
	//			.then(() => {
	//				this.flashMessageService.title = "ERROR";
	//				this.flashMessageService.message = "Missing authorization. Please log back in to regain authorization.";
	//				this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
	//			})
	//	}
	//}

	async getBlocklist(accessToken: string): Promise<Array<BlockedEmailType>> {
		try {
			let blockedEmails: Array<BlockedEmailType> = await this.service.getAllBlockedEmails(accessToken);
			return blockedEmails;
		}
		catch (e) {
			throw (e);
		}
	}
}