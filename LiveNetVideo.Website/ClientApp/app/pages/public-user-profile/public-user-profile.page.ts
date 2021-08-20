import { Component, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Service } from '../../services/index';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MemberType, CompanyProfileDto, MaterialAlertMessageType, IdDto, PbxLineDto } from "../../models/index";

@Component({
	templateUrl: 'public-user-profile.page.html',
})
export class PublicUserProfilePage {
	constructor(
		private service: Service,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
	) {
		this.loading = true;
		this.activatedRoute.paramMap.subscribe((params) => {
			this.memberId = Number(params.get('memberId'));
		});
	}

	ngOnInit() {
		let accessToken: string;

		this.service.getAccessToken()
			.then((token: string) => {
				accessToken = token;
				return this.service.getMemberById(this.memberId, accessToken);
			})
			.then((member: MemberType) => {
				this.member = member;
			})

		this.service.getAccessToken()
			.then((token: string) => {
				accessToken = token;
				return this.service.getMembersCompanyProfile(this.memberId, accessToken);
			})
			.then((company: CompanyProfileDto) => {
				this.companyProfile = company;
			})
			.then(() => {
				if (this.service.isEmpty(this.companyProfile) === false) {
					let idDto = new IdDto();
					idDto.id = this.companyProfile.companyProfileId;
					return this.service.getPbxLinesByCompanyProfileId(idDto, accessToken);
				}
				else {
					return;
				}
			})
			.then((pbxlines: Array<PbxLineDto>) => {
				if (this.service.isEmpty(pbxlines) === false) {
					this.pbxlines = pbxlines;
				}
			})
			.catch((error) => {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = error;
				this.service.openAlert(alert);
			})
	}

	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;
	ngAfterViewInit() {
		this.ngZone.run(() => {
			setTimeout(() => {
				if (window.innerWidth < 500) {
					this._container.close();
				}
				else {
					this._container.open();
				}
			}, 250);
		});
	}

	imgSrc: string;
	firstName: string;
	lastName: string;
	email: string;

	companyImgSrc: string;
	companyName: string;
	companyDescription: string;
	companyProfileId: number;

	loading: boolean;
	memberId: number;
	_member: MemberType;
	get member(): MemberType {
		return this._member;
	}
	set member(value: MemberType) {
		this._member = value;
		if (this.service.isEmpty(value) === false) {
			this.firstName = value.firstName;
			this.lastName = value.lastName;
			this.email = value.email;
			this.imgSrc = this.service.isEmpty(value.avatarFileName) ? this.service.defaultAvatar
				: this.service.avatarBaseUrl + value.avatarFileName + "?" + Date.now().toString();
		}
	}

	_companyProfile: CompanyProfileDto;
	get companyProfile(): CompanyProfileDto {
		return this._companyProfile;
	}
	set companyProfile(value: CompanyProfileDto) {
		this._companyProfile = value;
		if (this.service.isEmpty(value) === false) {
			this.companyName = value.companyName;
			this.companyDescription = value.description;
			this.companyImgSrc = this.service.isEmpty(value.logoFilename) ? this.service.defaultAvatar
				: this.service.pbxContentUrl + value.companyProfileId.toString() + "/" + value.logoFilename + "?" + Date.now().toString();
			this.companyProfileId = value.companyProfileId;
		}
	}

	_pbxlines: Array<PbxLineDto>;
	get pbxlines(): Array<PbxLineDto> {
		return this._pbxlines;
	}
	set pbxlines(value: Array<PbxLineDto>) {
		this._pbxlines = value;
	}
}