import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialogRef, MatDialog } from '@angular/material';

import {
	Service
} from '../../services/index'
import {
	NetcastDto,
	NetcastGenreDto,
	MaterialAlertMessageType,
	IdDto,
	MaterialActionAlertMessageType
} from '../../models/index'
import { NetcastViewModel } from '../../models/view-models/netcast.viewmodel';
import { MaterialActionAlertComponent, FormNetcastEditComponent } from '../../components';
@Component({
	styleUrls: ['netcast-list.page.scss'],
	templateUrl: 'netcast-list.page.html'
})
export class NetcastListPage {
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		private service: Service,
		private ngZone: NgZone,
		private matDialog: MatDialog,
	) {
		//this.phoneContacts = new Array<PhoneContactType>();
	}

	showGettingNetcasts: boolean;
	//netcasts: Array<NetcastDto>;
	netcastVMs: NetcastViewModel[];

	netcasteeBaseUrl: string = this.service.netcasteeBaseUrl;

	ngOnInit() {
		//console.log("activatedRoute: ", this.activatedRoute);
		//console.log("router: ", this.router);

		this.service.isCheckedIntoHubConnection()
			.then(() => {
				return this.service.getAccessToken();
			})
			.then((accessToken: string) => {
				this.getNetcastsFromServer(accessToken);
			})
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

	async refreshNetcastList(): Promise<void> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			await this.getNetcastsFromServer(accessToken);
		}
		catch (e) {
			console.log("refreshContactList error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = "<p>Unable to refresh netcast list.</p>";
			this.service.openAlert(alert);
		};
	}

	async getNetcastsFromServer(accessToken: string): Promise<void> {
		try {
			this.showGettingNetcasts = true;
			let idDto: IdDto = new IdDto();
			idDto.id = this.service.profile.memberId;
			let netcasts: NetcastDto[] = await this.service.getNetcastsByMemberId(idDto, accessToken);
			this.netcastVMs = new Array<NetcastViewModel>();
			if (!this.service.isEmpty(netcasts)) {
				netcasts.forEach((n: NetcastDto) => {
					try {
						let vm: NetcastViewModel = this.service.mapToNetcastViewModel(n);
						this.netcastVMs.push(vm);
					}
					catch (e) {
						// NOTE: console log for debugging
						console.log("netcast-list.page getNetcastsFromServer caught error trying to map netcastDto to netcastViewModel: ", e);
					}
				})
			}

			//console.log("netcasts: ", netcasts);

			//this.netcasts = netcasts;
		}
		catch (e) {
			console.log("netcast-list.page.ts getNetcastsFromServer() error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Warning";
			alert.message = "<p>Unable to retrieve netcasts at this time. Please try again later.</p>";
			this.service.openAlert(alert);
		}
		finally {
			this.showGettingNetcasts = false;
		}

		//setTimeout(() => {
		//	this.service.getContactList(accessToken)
		//		.then((contacts: Array<PhoneContactType>) => {
		//			this.contacts = contacts;
		//		})
		//		.then(() => {
		//			this.showGettingContacts = false;
		//		})
		//}, 1000)
	}

	onNetcastAdded(netcast: NetcastDto): void {
		console.log("netcast-list.page.ts onNetcastAdded netcast: ", netcast);
		//if (this.service.isEmpty(this.contacts)) {
		//	this.contacts = new Array<PhoneContactType>();
		//}
		//this.contacts.unshift(phoneContact);
		//let contacts = this.contacts.slice();
		//this.contacts = contacts;

		//console.log("this.contacts: ", this.contacts);
		this.service.getAccessToken()
			.then((accessToken: string) => {
				this.getNetcastsFromServer(accessToken);
			})
	}

	async delete(netcastId: number): Promise<void> {
		console.log("delete: ", netcastId);
		let alert = new MaterialActionAlertMessageType();
		alert.title = "Please Confirm";
		alert.message = '<p>Are you sure you want to delete your netcast</p>';
		alert.noButton = "Cancel";
		alert.yesButton = "Delete";

		let dialogRef = this.matDialog.open(MaterialActionAlertComponent, {
			width: '80%',
			height: '80%',
			data: alert
		});

		dialogRef.afterClosed().subscribe(async () => {
			if (alert.doAction === true) {
				try {
					let accessToken: string = await this.service.getAccessToken();
					let netcastDto: NetcastDto = await this.service.getNetcastById(netcastId, accessToken);
					let result: string = await this.service.deleteNetcast(netcastDto, accessToken);
					// NOTE: console log for debugging only
					console.log("netcast-list.page dialog delete netcast results: ", result);
					await this.getNetcastsFromServer(accessToken);
				}
				catch (e) {
					let alert = new MaterialAlertMessageType();
					alert.title = "ERROR";
					alert.message = "The delete request failed. Please try again later";
					this.service.openAlert(alert);
				}
			}
		});
	}

	async edit(netcastId: number): Promise<void> {
		console.log("edit: ", netcastId);
		let accessToken: string = await this.service.getAccessToken();
		let netcast: NetcastDto = await this.service.getNetcastById(netcastId, accessToken);

		let dialogRef = this.matDialog.open(FormNetcastEditComponent, {
			width: '80%',
			height: '100%',
			data: netcast
		});

		dialogRef.componentInstance.onEditNetcastComplete.subscribe((netcast: NetcastDto) => {
			console.log("onEditNetcastComplete: ", netcast);
			this.getNetcastsFromServer(accessToken);
			dialogRef.close();
		});

		dialogRef.componentInstance.onEditNetcastCancel.subscribe(() => {
			dialogRef.close();
		});

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onEditNetcastComplete.unsubscribe();
			dialogRef.componentInstance.onEditNetcastCancel.unsubscribe();
		});
	}

	async details(netcastId: number): Promise<void> {
		this.router.navigate(['/netcast-details', netcastId], { relativeTo: this.activatedRoute });
	}

	async startNetcast(netcastId: number): Promise<void> {
		console.log("startNetcast: ", netcastId);
		this.router.navigate(['/netcaster', netcastId], { relativeTo: this.activatedRoute });
	}
}