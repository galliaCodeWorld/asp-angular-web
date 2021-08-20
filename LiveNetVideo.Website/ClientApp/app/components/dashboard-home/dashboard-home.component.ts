import { Component, OnInit, Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import {
	JwtToken,
	IdDto,
	OrderByDto,
	PagingDto,
	CompanyProfileDto,
	ObservableMessageType
} from '../../models/index'

import {
	LocalStorageService,
	ConfigService,
	JsHelperService,
	SignalrService,
	UserService,
	FlashMessageService,
	PbxService,
	BlockCallService
} from '../../services/index'
import { Router } from '@angular/router';

@Component({
	selector: 'dashboard-home',
	templateUrl: './dashboard-home.component.html',
	styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit {
	constructor(
		public localStorageService: LocalStorageService,
		public configService: ConfigService,
		public jsHelperService: JsHelperService,
		public signalrService: SignalrService,
		public userService: UserService,
		public flashMessageService: FlashMessageService,
		public pbxService: PbxService,
		public blockCallService: BlockCallService,
		public router: Router
	) { }

	@Input('hasEmployers') hasEmployers: boolean;

	// NOTE: if the number of employers is 0, do not display the pbx icon.
	// if the number of employers is 1, then go directly to the pbx lines for the employer
	// if the more than one employer, then go to paging showing list of employers, then from each link
	// to got the list of assigned pbx lines

	//finishedGettingEmployers: Subscription;

	ngOnInit() {
		console.log("DashboardHomeComponent.ngOnInit()");
		//this.startListeners();
	}

	//endListeners(): void {
	//	this.finishedGettingEmployers && this.finishedGettingEmployers.unsubscribe();
	//}

	ngOnDestroy() {
		console.log("dashboard destroyed");
		//this.endListeners();
	}

	//startListeners() {
	//	console.log('listener started')

	//	this.endListeners();

	//	this.finishedGettingEmployers = this.userService.finishedGettingEmployers.subscribe((message: ObservableMessageType) => {
	//		if (this.jsHelperService.isEmpty(message.message) === false) {
	//			let json = message.message;
	//			if (this.jsHelperService.isEmpty(json) === false) {
	//				let employers: Array<CompanyProfileDto> = this.jsHelperService.jsonToObject<Array<CompanyProfileDto>>(json, true);

	//				if (!this.jsHelperService.isEmpty(employers)) {
	//					if (employers.length > 0) {
	//						this.hasEmployers = true;
	//					}
	//				}
	//			}
	//		}
	//	});
	//}

	//logout(): void {
	//	this.userService.doLogout()
	//		.then(() => {
	//			this.blockCallService.unsetLocalBlockedEmails();
	//		})
	//		.catch((error) => {
	//			console.log("app-shell.ts logOut error:", error);
	//		})
	//		.then(() => {
	//			this.router.navigate(['/login-shell/login']);
	//		})
	//}
}