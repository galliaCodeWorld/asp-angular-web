import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogRef, MatDialog } from '@angular/material';
import { CreateCompanyComponent } from '../index';
import { PbxService, UserService, SignalrService, JsHelperService } from '../../services/index';
import { CompanyProfileDto, CompanyLocationDto } from '../../models/index';
import { FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';

@Component({
    templateUrl: './company-overview.component.html',
    styleUrls: ['./company-overview.component.scss']
})
export class CompanyOverviewComponent implements OnInit {

    hasCompany: boolean = false;
    hasLocations: boolean = false;
    isLoading: boolean = true;

    companyProfileView: CompanyProfileDto;
    companyProfileLocationView: CompanyLocationDto;

    canEditDescription: boolean = false;
    canEditLocation: boolean = false;
    canEditName: boolean = false;

    locationForm: FormGroup;
    companyNameFormControl: FormControl;
    companyDescriptionFormControl: FormControl;

    countryIsoCodes: Array<any> = [];
    selectedCountryIsoCode: any;
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private dialog: MatDialog,
        private pbxService: PbxService,
        private userService: UserService,
        private signalrService: SignalrService,
        private jsHelperService: JsHelperService,
        public formBuilder: FormBuilder
    ) {
        // this.removeAllCompanyProfile();
        this.locationForm = formBuilder.group({
            address: ['', Validators.compose([Validators.required])],
            city: ['', Validators.compose([Validators.required])],
            region: ['', Validators.compose([Validators.required])],
        })

        this.companyNameFormControl = new FormControl(
            '', [Validators.required]
        )
        this.companyDescriptionFormControl = new FormControl(
            '', [Validators.required]
        )
    }

    toggleEditMode(field) {
        console.log(field)
        this[field] = !this[field]
    }

    //temp code just to help with debugging cal it when we want to clear companies
    removeAllCompanyProfile() {
        let jwt = this.signalrService.jwtToken
        if (!this.jsHelperService.isEmpty(jwt)) {
            this.pbxService.getCompanyProfilesByMemberId({
                id: this.userService.profile.memberId
            }, jwt.access_token)
                .then((companyProfiles: CompanyProfileDto[]) => {
                    console.log('delete', companyProfiles)
                    if (companyProfiles.length > 0) {
                        companyProfiles.forEach((profile, i) => {
                            this.pbxService.deleteCompanyProfile(profile.companyProfileId, jwt.access_token)
                                .then(data => console.log('after deletion', data))
                                .catch(error => console.log('after deletion', error))
                                .then(() => {
                                    if (i >= companyProfiles.length - 1) {
                                        this.checkForCompany();
                                    }
                                })
                        });
                    } else {
                        this.checkForCompany();
                    }
                })
        }
    }

    ngOnInit() {
        this.checkForCompany();
        this.getCountryIsoCode();
    }

    createCompany() {
        let dialogRef = this.dialog.open(CreateCompanyComponent, {
        });

        dialogRef.afterClosed().subscribe((companyProfile: CompanyProfileDto) => {
            if (companyProfile) {
                console.log('profile from dialogclose', companyProfile)
                this.checkForCompany();
            }
        })
    }

    navigate(url) {
        this.router.navigate(url);
    }

    getCountryIsoCode() {
        let jwt = this.signalrService.jwtToken;
        this.pbxService.getCountryIsoCodes(jwt.access_token)
        .then(countryIsoCodes => {
            this.countryIsoCodes = countryIsoCodes
            console.log(this.countryIsoCodes)
        })
        .catch(error => console.log(error))
    }

    //get the lastest company and location data from the server
    checkForCompany() {
        this.isLoading = true;
        let jwt = this.signalrService.jwtToken;
        //check if user has a company
        this.pbxService.getCompanyProfilesByMemberId({
            id: this.userService.profile.memberId
        }, jwt.access_token)
            .then((companyProfiles: CompanyProfileDto[]) => {
                this.hasCompany = companyProfiles.length > 0
                this.companyProfileView = companyProfiles[0]
                this.companyProfileView.logoFilename =
                    `https://nofb.org/Content/Pbx/${this.companyProfileView.companyProfileId}/${this.companyProfileView.logoFilename}`
                return this.pbxService.getCompanyLocationsByCompanyProfileId({ id: this.companyProfileView.companyProfileId }, jwt.access_token)
            })
            .then((companyLocations: CompanyLocationDto[]) => {
                if (companyLocations && companyLocations.length > 0) {
                    this.hasLocations = true;
                    this.companyProfileLocationView = companyLocations[0]
                }
            })
            .catch(error => {
                console.log(error)
            })
            .then(() => this.isLoading = false)
    }

    //update changes to company profile or location
    saveChanges() {
        let jwt = this.signalrService.jwtToken;

        if (this.canEditName || this.canEditDescription) {
            this.pbxService.updateCompanyProfile({
                companyLocationId: 0,
                companyProfileId: this.companyProfileView.companyProfileId,
                memberId: this.companyProfileView.memberId,
                companyName: this.canEditName ? this.companyNameFormControl.value : this.companyProfileView.companyName,
                description: this.canEditDescription ? this.companyDescriptionFormControl.value : this.companyProfileView.description,
            }, jwt.access_token)
                .then((data) => {
                    this.checkForCompany()
                })
                .catch((error) => {
                    console.log(error)
                })
                .then(() => {
                    this.canEditName = this.canEditDescription = false;
                })
        }

        if (this.canEditLocation) {
            if (!this.hasLocations) {
                this.pbxService.createCompanyLocation({
                    companyProfileId: this.companyProfileView.companyProfileId,
                    address: this.locationForm.get('address').value,
                    city: this.locationForm.get('city').value,
                    region: this.locationForm.get('region').value,
                    countryIsoCode: this.selectedCountryIsoCode,
                    companyLocationId: 0
                }, jwt.access_token)
                    .then(() => {
                        this.canEditLocation = false;
                        this.checkForCompany();
                    })
                    .catch(error => console.log(error))
            } else {
                this.pbxService.updateCompanyLocation({
                    companyLocationId: this.companyProfileLocationView.companyLocationId,
                    companyProfileId: this.companyProfileView.companyProfileId,
                    address: this.locationForm.get('address').value,
                    city: this.locationForm.get('city').value,
                    region: this.locationForm.get('region').value,
                    countryIsoCode: this.selectedCountryIsoCode.countryIsoCode
                }, jwt.access_token)
                    .then(() => {
                        this.canEditLocation = false;
                        this.checkForCompany();
                    })
                    .catch(error => console.log(error))
            }
        }
    }


}