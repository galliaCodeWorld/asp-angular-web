import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialogRef, MatDialog } from '@angular/material';
import {
	Service
} from '../../services/index'
import {
	PhoneContactType,
	MaterialAlertMessageType
} from '../../models/index'
@Component({
	styleUrls: ['contacts.page.scss'],
	templateUrl: 'contacts.page.html'
})
export class ContactsPage {
	//phoneContacts: PhoneContactType[];
	//phoneContactsView: PhoneContactType[];

	//contactEmails: string[];
	//pageLoading: boolean = false;
	//showAddContactModal: boolean = false;
	//showEditContactModal: boolean = false;
	//selectedContact: PhoneContactType;
	//query: string = '';

	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		private service: Service,
		private ngZone: NgZone,
	) {
		//this.phoneContacts = new Array<PhoneContactType>();
	}

	showGettingContacts: boolean;
	contacts: Array<PhoneContactType>;

	ngOnInit() {
		this.service.isCheckedIntoHubConnection()
			.then(() => {
				return this.service.getAccessToken();
			})
			.then((accessToken: string) => {
				this.getContactsFromServer(accessToken);
			})

		//console.log("contacts.component.ts ngOnInit()");
		//this.pageLoading = true;

		//this.localStorageService.getItem(this.configService.contactList)
		//	.then((phoneContacts: PhoneContactType[]) => {
		//		this.setPhoneContacts(phoneContacts)
		//		console.log('from storage', this.phoneContacts)
		//		this.pageLoading = false;
		//	})
		//	.catch(() => {
		//		this.updateContacts()
		//			.catch((error) => {
		//				console.log("contacts.component.ts updateContacts() error")
		//			})
		//			.then(() => { this.pageLoading = false; })
		//	})
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

	ngOnDestroy() {
	}

	async refreshContactList(): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();

			await this.getContactsFromServer(accessToken);
		}
		catch (e) {
			console.log("refreshContactList error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = "<p>Unable to refresh contact list.</p>";
			this.service.openAlert(alert);
		};
	}

	async getContactsFromServer(accessToken: string): Promise<void> {
		try {
			this.showGettingContacts = true;

			let contacts: PhoneContactType[] = await this.service.getContactList(accessToken);
			console.log("contacts: ", contacts);
			if (this.service.isEmpty(contacts) === false) {
				contacts.forEach((c: PhoneContactType) => {
					c.canCall = c.isMember;
				});
			}
			this.contacts = contacts;
		}
		catch (e) {
			console.log("contact.page.ts getContactsFromServer() error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Warning";
			alert.message = "<p>Unable to retrieve contacts at this time. Please try again later.</p>";
			this.service.openAlert(alert);
		}
		finally {
			this.showGettingContacts = false;
		}
	}

	onContactAdded(phoneContact: PhoneContactType): void {
		console.log("contacts.component.ts onContactAdded phoneContact: ", phoneContact);

		this.service.getAccessToken()
			.then((accessToken: string) => {
				this.getContactsFromServer(accessToken);
			})
	}
}