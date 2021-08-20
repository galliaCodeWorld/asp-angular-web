import {
	Component, Input,
} from '@angular/core';
import {
	IdCardType,
} from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'id-card',
	templateUrl: 'id-card.component.html'
})
export class IdCardComponent {
	constructor(
		private service: Service,
	) { }

	@Input('idCard') idCard: IdCardType;

	subtitle: string;
	imgSrc: string;
	title: string;
	content: string;
	ngOnInit() {
		this.setGui(this.idCard);
	}

	//ngOnChanges(changes: SimpleChanges) {
	//	console.log("changes: ", changes);
	//	const idCard: SimpleChange = changes.idCard;
	//	console.log("idCard:", idCard);
	//	console.log("idCard.currentValue: ", idCard.currentValue);
	//	this.setGui(idCard.currentValue);
	//}

	setGui(idCard: IdCardType) {
		//console.log("setting Gui: ", idCard);
		this.title = this.service.isEmpty(idCard.title) ? "" : idCard.title;
		this.subtitle = this.service.isEmpty(idCard.subtitle) ? "" : idCard.subtitle;
		// image source can either be dataUri or http link to resource
		this.imgSrc = this.service.isEmpty(idCard.imgSrc) ? this.service.defaultAvatar : idCard.imgSrc;
		this.content = this.service.isEmpty(idCard.content) ? "" : idCard.content;
	}
}