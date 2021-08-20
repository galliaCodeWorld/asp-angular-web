import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PbxService, SignalrService, JsHelperService } from '../../../services/index';
import {
    Validators,
    FormBuilder,
    FormGroup
} from '@angular/forms';
import { CompanyProfileDto } from '../../../models/index';



@Component({
    selector: 'pbx-search-box',
    templateUrl: 'pbx-search-box.component.html',
    styleUrls: ['./pbx-search-box.component.scss']
})

export class PbxSearchBoxComponent implements OnInit {
    searchForm: FormGroup
    countryIsoCodes: Array<any> = [];
    filteredCountryCodes: Array<any> = [];
    searchOptions: Array<string> = [
        'name',
        'location'
    ];
    selectedSearchOption: string;
    isSearching: boolean = false;

    @Output() searchFound: EventEmitter<CompanyProfileDto[]> = new EventEmitter()
    constructor(
        private pbxService: PbxService,
        private signalrService: SignalrService,
        private jsHelperService: JsHelperService,
        private formBuilder: FormBuilder
    ) {

    }

    ngOnInit() {
        this.searchForm = this.formBuilder.group({
            searchTerm: [''],
            address: [''],
            city: [''],
            region: [''],
            countryIsoCode: [''],
        })


        this.searchForm.get('countryIsoCode').valueChanges
            .subscribe((val: string) => {
                this.filteredCountryCodes = this.filter(val)
            })

        this.getCountryIsoCode();
    }

    filter(searchTerm: string): string[] {
        return this.countryIsoCodes.filter(option =>
           (option.countryIsoCode.toLowerCase().includes(searchTerm.toLowerCase()) 
           || option.countryName.toLowerCase().startsWith(searchTerm.toLowerCase())));
    }

    search() {
        if (this.selectedSearchOption === 'location') {
            this.searchByLocation();
        } else if (this.selectedSearchOption === 'name') {
            this.searchByName();
        } else {
            this.showEmptyResult();
        }
    }

    showEmptyResult() {

    }

    searchByLocation() {
        this.isSearching = true;
        let { access_token } = this.signalrService.jwtToken;
        if (access_token) {
            this.pbxService.searchCompanyProfilesByLocation({
                address: this.searchForm.get('address').value,
                city: this.searchForm.get('city').value,
                countryIsoCode: this.searchForm.get('countryIsoCode').value,
                region: this.searchForm.get('region').value
            }, access_token)
                .then((searchResults: CompanyProfileDto[]) => {
                    console.log(searchResults);
                    this.searchFound.emit(searchResults)
                })
                .catch(error => console.log(error))
                .then(() => this.isSearching = false)
        }
    }

    searchByName() {
        this.isSearching = true;
        let { access_token } = this.signalrService.jwtToken;
        if (access_token) {
            this.pbxService.searchCompanyProfilesByName({
                term: this.searchForm.get('searchTerm').value
            }, access_token)
                .then((searchResults: CompanyProfileDto[]) => {
                    console.log(searchResults)
                    this.searchFound.emit(searchResults)
                })
                .catch(error => console.log(error))
                .then(() => this.isSearching = false)
        }
    }

    getCountryIsoCode() {
        let jwt = this.signalrService.jwtToken;
        this.pbxService.getCountryIsoCodes(jwt.access_token)
            .then(countryIsoCodes => {
                this.countryIsoCodes = countryIsoCodes
            })
            .catch(error => console.log(error))
    }

}