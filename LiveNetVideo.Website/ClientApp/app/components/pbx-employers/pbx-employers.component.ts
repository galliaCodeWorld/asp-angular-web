import { Component, OnInit } from '@angular/core';
import { Service } from '../../services/index';
import { CompanyProfileDto, CompanyEmployeeDto } from '../../models/index';
import { ActivatedRoute, Router } from '@angular/router'
@Component({
	selector: 'pbx-employers-component',
	templateUrl: 'pbx-employers.component.html',
	styleUrls: ['pbx-employers.component.scss']
})
export class PbxEmployersComponent implements OnInit {
	//if emplyers count is greater than 1
	companies: Array<CompanyProfileDto>
	isLoading: boolean = false;

	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		private service: Service,
	) {
	}

	ngOnInit() {
		this.companies = this.service.employers;
		//if company is zero they should not have a link to this page
		//so there should be atleast 1
		//if there is only one compony, take them directly to pbx lines
		if (this.companies.length < 2) {
			this.navigateToRepLines()
		}
	}

	companyClicked(index: number) {
		this.navigateToRepLines(index);
	}

	navigateToRepLines(companyIndex: number = 0) {
		this.router.navigate(
			[
				'dashboard/pbx-rep-shell/pbx-rep-lines/',
				this.companies[companyIndex].companyProfileId
			]);
	}
}