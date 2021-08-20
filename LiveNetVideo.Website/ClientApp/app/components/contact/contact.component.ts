import {
	Component, Input, Output, EventEmitter,
	ComponentFactory,
	ComponentFactoryResolver,
	ViewContainerRef,
	ComponentRef,
	NgZone,
} from '@angular/core';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';
import {
	Router,
	ActivatedRoute
} from '@angular/router';
import {
	PhoneContactType,
	MaterialAlertMessageType,
	MaterialActionAlertMessageType
} from "../../models/index";
import { Service } from "../../services/index";
import {
	FormEditContactComponent,
	MaterialActionAlertComponent,
	ContactCardComponent,
} from "../index";
@Component({
	selector: 'contact',
	templateUrl: 'contact.component.html'
})
export class ContactComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public route: ActivatedRoute,
		public router: Router,
		private ngZone: NgZone,
	) { }

	@Input('contact') contact: PhoneContactType;
	@Output() onContactDeleted: EventEmitter<PhoneContactType> = new EventEmitter<PhoneContactType>();

	@Input('canCall') canCall: boolean;

	email: string;
	imgSrc: string;
	name: string;

	ngOnInit() {
		this.canCall = true;
		this.setGui(this.contact);
	}

	setGui(phoneContact: PhoneContactType) {
		this.name = this.service.isEmpty(phoneContact.name) ? "Anonymous" : phoneContact.name;
		this.email = this.service.isEmpty(phoneContact.email) ? "" : phoneContact.email;
		this.imgSrc = this.service.isEmpty(phoneContact.avatarFileName) ? this.service.defaultAvatar
			: this.service.contactAvatarBaseUrl + phoneContact.avatarFileName + "?" + Date.now().toString();
		this.canCall = phoneContact.canCall;
	}

	editContact(): void {
		let dialogRef = this.matDialog.open(FormEditContactComponent, {
			width: '80%',
			height: '80%',
			data: this.contact
		});

		dialogRef.componentInstance.onEditContactComplete.subscribe((phoneContact: PhoneContactType) => {
			this.contact = phoneContact;
			this.setGui(phoneContact);
			dialogRef.close();

			//dialogRef.componentInstance.showProgress = true;
			//this.updateContact(phoneContact)
			//	.then((phoneContact: PhoneContactType) => {
			//		this.contact = phoneContact;
			//		this.setGui(this.contact);
			//		dialogRef.close();
			//	})
			//	.catch((error) => {
			//		console.log("error: ", error);
			//		let alert = new MaterialAlertMessageType();
			//		alert.title = "ERROR";
			//		alert.message = error;
			//		this.service.openAlert(alert);
			//	})
			//	.then(() => {
			//		dialogRef.componentInstance.showProgress = false;
			//	});
		});

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onEditContactComplete.unsubscribe();
		});
	}

	//async updateContact(phoneContact: PhoneContactType): Promise<PhoneContactType> {
	//	try {
	//		// TODO: got the submitted phoneContact from modal, submit it to the webapi server to create phoneContact record
	//		// if successful it will receive the phoneContact back with a phoneContactId and other information such as memberId, isMember
	//		// emit this to the client component
	//		// this.onAddedContact.emit(phoneContactRecordFromServer);
	//		let accessToken = await this.service.getAccessToken();

	//		let updatedPhoneContact: PhoneContactType = await this.service.updateContact(phoneContact, accessToken);
	//		return updatedPhoneContact;
	//	}
	//	catch (e) {
	//		throw (e);
	//	}
	//}

	deleteContact(): void {
		// confirm before performing delete
		let alert = new MaterialActionAlertMessageType();
		alert.title = "Please Confirm";
		alert.message = '<p>Are you sure you want to delete your contact</p>';
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
					let deletedContact: PhoneContactType = await this.performContactDelete(this.contact);
					this.onContactDeleted.emit(deletedContact);
				}
				catch (e) {
					let alert = new MaterialAlertMessageType();
					alert.title = "ERROR";
					alert.message = "The delete request failed. Please try again later";
					this.service.openAlert(alert);
				}
			}
		});

		let factory = this.componentFactoryResolver.resolveComponentFactory(ContactCardComponent);
		let viewContainerRef: ViewContainerRef = dialogRef.componentInstance.viewContainerRef;
		let componentRef: ComponentRef<ContactCardComponent> = viewContainerRef.createComponent(factory);
		let contactCard: ContactCardComponent = componentRef.instance;
		contactCard.contact = this.contact;
	}

	async performContactDelete(contact: PhoneContactType): Promise<PhoneContactType> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let deletedContact = contact;
			await this.service.deleteContact(this.contact, accessToken);
			return deletedContact;
		}
		catch (e) {
			throw (e);
		}
	}

	async makePhoneCall(): Promise<void> {
		//this.service.emailToCall = this.contact.email;
		//console.log("makePhoneCall() url", this.router.url);

		if (this.service.isEmpty(this.router.url.match('^/phone.*$')) === false) {
			try {
				let contactList = this.matDialog.getDialogById('contact-list')
				this.ngZone.run(async () => {
					contactList && contactList.close();
					await this.service.callContact(this.contact.email)
				})
			}
			catch (e) {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e;
				this.service.openAlert(alert);
			}
		}
		else {
			this.router.navigate(["/phone", this.contact.email]);
		}
	}
}