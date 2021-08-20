import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Service } from "../../services/index";
import {
	CompanyProfileDto
} from "../../models/index";

@Component({
	selector: 'employee-companies-component',
	templateUrl: './employee-companies.component.html',
	styleUrls: ['./employee-companies.component.scss']
})
export class EmployeeCompaniesComponent {
	constructor(
		public service: Service,
		public router: Router,
		public route: ActivatedRoute,
	) { }

	public companyProfiles: Array<CompanyProfileDto>;

	ngOninit() {
		this.route.data['companyProfiles'].subscribe((data: Array<CompanyProfileDto>) => {
			this.companyProfiles = data;
			for (let i = 0; i < this.companyProfiles.length; i++) {
				this.companyProfiles[i]["src"] = this.service.defaultAvatar;
				if (this.service.isEmpty(this.companyProfiles[i].logoFilename) === false) {
					this.companyProfiles[i]["src"] = this.service.pbxContentUrl + this.companyProfiles[i].companyProfileId + "/" + this.companyProfiles[i].logoFilename + "?" + Date.now().toString();
				}
			}
		});
	}
}