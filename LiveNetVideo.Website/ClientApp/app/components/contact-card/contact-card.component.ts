import {
	Component, Input
} from '@angular/core';
import {
	PhoneContactType,
} from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'contact-card',
	templateUrl: 'contact-card.component.html'
})
export class ContactCardComponent {
	constructor(
		private service: Service,
	) { }

	@Input('contact') contact: PhoneContactType;

	email: string;
	imgSrc: string;
	name: string;

	ngOnInit() {
		this.setGui(this.contact);
	}

	setGui(phoneContact: PhoneContactType) {
		this.name = this.service.isEmpty(phoneContact.name) ? "Anonymous" : phoneContact.name;
		this.email = this.service.isEmpty(phoneContact.email) ? "" : phoneContact.email;
		this.imgSrc = this.service.isEmpty(phoneContact.avatarFileName) ? this.service.defaultAvatar : this.service.contactAvatarBaseUrl + phoneContact.avatarFileName + "?" + Date.now().toString();
	}
}