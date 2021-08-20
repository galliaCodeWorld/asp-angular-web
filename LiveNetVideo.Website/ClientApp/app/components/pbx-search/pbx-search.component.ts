import { Component, OnInit } from '@angular/core';
import { CompanyProfileDto } from '../../models/index';

@Component({
    templateUrl: 'pbx-search.component.html',
    styleUrls: ['./pbx-search.component.scss']
})

export class PbxSearchComponent implements OnInit {
    companyProfiles: CompanyProfileDto[];
    showResults: boolean = false;
    constructor() { }

    ngOnInit() { }

    searchFound(companyProfiles: CompanyProfileDto[]) {
        this.companyProfiles = companyProfiles;
        this.showResults = true;
    }

    
}