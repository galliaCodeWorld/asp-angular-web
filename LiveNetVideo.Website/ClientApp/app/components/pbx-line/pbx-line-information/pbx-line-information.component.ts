import { Component, Output, Input } from '@angular/core';

import {
	CompanyEmployeeDto,
	CompanyProfileDto,
	PbxLineDto,
	PbxLineRepDto
} from "../../../models/index";

@Component({
	selector: 'pbx-line-information',
	templateUrl: 'pbx-line-information.component.html',
	styleUrls: ['pbx-line-information.component.scss']
})

// Re-Usable dum component, requires data from parent component passed to it as
// attributes in html markup for the @Input decorator
export class PbxLineInformationComponent {
	constructor(
	) {
	}
	@Input('pbxLine') pbxLine: PbxLineDto;
	@Input('pbxLineRep') pbxLineRep: PbxLineRepDto;
	@Input('companyEmployee') companyEmployee: CompanyEmployeeDto;
	@Input('companyProfile') companyProfile: CompanyProfileDto;
	ngOnInit() {
	}
}