import {
	Component, Input,
} from '@angular/core';
import {
	CompanyEmployeeDto,
} from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'employee-card',
	templateUrl: 'employee-card.component.html'
})
export class EmployeeCardComponent {
	constructor(
		private service: Service,
	) { }

	@Input('employee') employee: CompanyEmployeeDto;

	imgSrc: string;
	title: string;
	ngOnInit() {
		this.setGui(this.employee);
	}

	//ngOnChanges(changes: SimpleChanges) {
	//	console.log("changes: ", changes);
	//	const idCard: SimpleChange = changes.idCard;
	//	console.log("idCard:", idCard);
	//	console.log("idCard.currentValue: ", idCard.currentValue);
	//	this.setGui(idCard.currentValue);
	//}

	setGui(employee: CompanyEmployeeDto) {
		//console.log("setting Gui: ", idCard);
		this.title = this.service.isEmpty(employee.title) ? "Anonymous" : employee.title;
		this.imgSrc = this.service.isEmpty(employee.avatarFilename) ? this.service.defaultAvatar :
			this.service.pbxContentUrl + this.service.companyProfile.companyProfileId.toString() + "/" + this.service.employeeImageFolder + "/" + employee.avatarFilename + "?" + Date.now().toString();
	}
}