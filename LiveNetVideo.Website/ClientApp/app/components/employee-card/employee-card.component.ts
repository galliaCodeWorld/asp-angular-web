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

	setGui(employee: CompanyEmployeeDto) {
		//console.log("setting Gui: ", idCard);
		this.title = this.service.isEmpty(employee.title) ? "Anonymous" : employee.title;
		// image source can either be dataUri or http link to resource
		this.imgSrc = this.service.isEmpty(employee.avatarFilename) ? this.service.defaultAvatar :
			this.service.pbxContentUrl + this.service.companyProfile.companyProfileId.toString() + "/" + this.service.employeeImageFolder + "/" + this.employee.avatarFilename + "?" + Date.now().toString();
	}
}