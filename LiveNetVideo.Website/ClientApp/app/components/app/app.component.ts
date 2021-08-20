import {
	Component,
	//ElementRef
} from '@angular/core';
import {
	Router,
	ActivatedRoute
} from '@angular/router';

//import { SwPush } from '@angular/service-worker';

//import { JwtToken, IdDto, OrderByDto, PagingDto, GuestProfileType, MemberType } from '../../models/index'
import {
	Service
} from '../../services/index'
import { GuestProfileType } from '../../models';

@Component({
	selector: 'app',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	constructor(
		public service: Service,
		public activatedRoute: ActivatedRoute,
		public router: Router,
		//public elementRef: ElementRef,

	) {
		//this.pbxLineId = this.elementRef.nativeElement.getAttribute('pbx-line-id') as number;
		//this.warnings = new Array<string>();
	}

	//pbxLineId: number;

	ngOnInit() {
		console.log("currentUrl: ", this.router.url);
		console.log("router: ", this.router);
		console.log("app.component.ts ngOnInit() route:", this.router.url);

		//this.service.canActivatePage()
		//	.then((canActivate: boolean) => {
		//		console.log("app.component.ts canActivatePage: ", canActivate);
		//		this.service.startWebRtcHubListeners();
		//	})
		//	.catch((e) => {
		//	})

		this.service.startWebRtcHubListeners();

        /*
		//console.log("app.component.ts ngOnInit() route:", this.router.url);
		let rememberMe: boolean = this.service.rememberMe;
		let isLoggedIn: boolean = this.service.isLoggedIn;
		let guestProfile: GuestProfileType = this.service.guestProfile;
		if (this.service.isEmpty(isLoggedIn)) {
			// both gueest and member logins will have isLoggedIn set to true
			// when the member or guest is logged in (both guest and anonymous)
			this.service.isLoggedIn = false;
			this.service.rememberMe = false;
			this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
		}
		else if (this.service.isEmpty(rememberMe) && this.service.isEmpty(guestProfile)) {
			// bother member remeberMe and guest profile are not available
			this.service.isLoggedIn = false;
			this.service.rememberMe = false;
			this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
		}
		else {
			// nothing to do, the user is loggedin and has rememberme checked
		}
        */
	}

	ngAfterViewInit() {
	}

	ngOnDestroy() {
		//console.log("app.component.ts ngOnDestroy()");
	}
}