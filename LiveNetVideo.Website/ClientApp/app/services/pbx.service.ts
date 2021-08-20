import { Injectable } from '@angular/core';
import {
	JsHelperService,
	ConfigService,
	LocalStorageService,
} from './index';
import {
	CompanyProfileDto,
	WebApiResponseType,
	WebApiResponseStatusType,
	IdDto, SearchTermDto,
	LocationSearchDto,
	CompanyEmployeeDto,
	LongIdDto, EmailDto,
	CompanyEmployeeInviteDto,
	CompanyLocationDto,
	CompanyVideoDto,
	CompanyPhotoDto,
	PbxLineDto,
	PbxLineRepDto,
	PbxLineRepStatusDto,
	PbxCallQueueDto,
	PagingOrderByDto,
	CountryDto,
	PropertyTrackingEnum,
	MemberType,
	ContactUsDto,
	SendCopyOfMessageDto,
	HttpTypeEnum,
	HttpStatusCodeEnum,
} from '../models/index';
import { error } from 'util';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ValueTransformer } from '@angular/compiler/src/util';

@Injectable()
export class PbxService {
	httpPost: string = "POST";
	httpGet: string = "GET";
	httpDelete: string = "DELETE";

	constructor(
		private jsHelperService: JsHelperService,
		private storageService: LocalStorageService,
		private configService: ConfigService,
		private http: HttpClient) {
	}

	get pbxLines(): Array<PbxLineDto> {
		return this.storageService.getPermanentItem<Array<PbxLineDto>>(this.configService.keyPbxlines);
	}
	set pbxLines(value: Array<PbxLineDto>) {
		this.storageService.setPermanentItem(this.configService.keyPbxlines, value);
	}

	get companyProfile(): CompanyProfileDto {
		return this.storageService.getPermanentItem<CompanyProfileDto>(this.configService.keyCompanyProfile);
	}
	set companyProfile(value: CompanyProfileDto) {
		this.storageService.setPermanentItem(this.configService.keyCompanyProfile, value);
	}

	get companyEmployees(): Array<CompanyEmployeeDto> {
		return this.storageService.getPermanentItem<Array<CompanyEmployeeDto>>(this.configService.keyCompanyEmployees);
	}
	set companyEmployees(value: Array<CompanyEmployeeDto>) {
		this.storageService.setPermanentItem(this.configService.keyCompanyEmployees, value);
	}

	get companyEmployeeInvites(): Array<CompanyEmployeeInviteDto> {
		return this.storageService.getPermanentItem<Array<CompanyEmployeeInviteDto>>(this.configService.keyCompanyEmployeeInvites);
	}
	set companyEmployeeInvites(value: Array<CompanyEmployeeInviteDto>) {
		this.storageService.setPermanentItem(this.configService.keyCompanyEmployeeInvites, value);
	}

	get companyPhotos(): Array<CompanyPhotoDto> {
		return this.storageService.getPermanentItem<Array<CompanyPhotoDto>>(this.configService.keyCompanyPhotos);
	}
	set companyPhotos(value: Array<CompanyPhotoDto>) {
		this.storageService.setPermanentItem(this.configService.keyCompanyPhotos, value);
	}

	get companyLocations(): Array<CompanyLocationDto> {
		return this.storageService.getPermanentItem<Array<CompanyLocationDto>>(this.configService.keyCompanyLocations);
	}
	set companyLocations(value: Array<CompanyLocationDto>) {
		this.storageService.setPermanentItem(this.configService.keyCompanyLocations, value);
	}

	get companyVideos(): Array<CompanyVideoDto> {
		return this.storageService.getPermanentItem<Array<CompanyVideoDto>>(this.configService.keyCompanyVideos);
	}
	set companyVideos(value: Array<CompanyVideoDto>) {
		this.storageService.setPermanentItem(this.configService.keyCompanyVideos, value);
	}

	get employers(): Array<CompanyProfileDto> {
		return this.storageService.getPermanentItem<Array<CompanyProfileDto>>(this.configService.keyEmployers);
	}
	set employers(value: Array<CompanyProfileDto>) {
		this.storageService.setPermanentItem(this.configService.keyEmployers, value);
	}

	get countries(): Array<CountryDto> {
		return this.storageService.getPermanentItem<Array<CountryDto>>(this.configService.keyCountries);
	}
	set countries(value: Array<CountryDto>) {
		this.storageService.setPermanentItem(this.configService.keyCountries, value);
	}

	appendUrl(url, ...params) {
		return this.configService.pbxController + url;
	}

	getMemberById(memberId: number, accessToken: string): Promise<MemberType> {
		return new Promise<MemberType>((resolve, reject) => {
			let url = this.configService.webApiBase + "Member/GetMemberById/" + memberId.toString() + "/";
			let payload = null;

			this.jsHelperService.ajaxRequestParsed<MemberType>(this.httpGet, url, payload, accessToken)
				.then((dto: MemberType) => {
					resolve(dto);
				})
				.catch((error) => {
					reject(error);
				});
		})
	}

	// Stores: this.countries
	getCountryIsoCodes(accessToken: string): Promise<Array<CountryDto>> {
		return new Promise<Array<CountryDto>>((resolve, reject) => {
			let url = this.appendUrl('GetCountryIsoCodes')
			let payload = null;
			this.jsHelperService.ajaxRequestParsed<Array<CountryDto>>(this.httpGet, url, payload, accessToken)
				.then((dto: Array<CountryDto>) => {
					this.countries = dto;
					resolve(dto);
				})
				.catch((error) => {
					reject(error);
				});
		})
	}

	// #region companyProfile

	// Stores: this.companyProfile
	getMembersCompanyProfile(memberId: number, accessToken: string): Promise<CompanyProfileDto> {
		return new Promise<CompanyProfileDto>((resolve, reject) => {
			let url = this.configService.pbxController + "GetMembersCompany/" + memberId.toString() + "/";
			let payload = null;

			this.jsHelperService.ajaxRequestParsed<CompanyProfileDto>(this.httpGet, url, payload, accessToken)
				.then((dto: CompanyProfileDto) => {
					this.companyProfile = dto;
					resolve(dto);
				})
				.catch((error) => {
					reject(error);
				});
		})
	}

	retrieveAndSetCompanyInformation(companyProfile: CompanyProfileDto, accessToken: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let warnings = new Array<string>();
			let idDto = new IdDto();
			idDto.id = companyProfile.companyProfileId;
			this.getCompanyEmployeesByCompanyProfileId(idDto, accessToken)
				.then((employees: Array<CompanyEmployeeDto>) => {
					//console.log("got company employees: ", employees);
					this.companyEmployees = employees;
					return;
				})
				.catch((error) => {
					warnings.push("Unable to retrieve company employee information.")
				})
				.then(() => {
					return this.getCompanyEmployeeInvitesByCompanyProfileId(idDto, accessToken);
				})
				.then((invites: Array<CompanyEmployeeInviteDto>) => {
					this.companyEmployeeInvites = invites;
				})
				.catch((error) => {
					warnings.push("Unable to retrieve employee invites.")
				})
				.then(() => {
					return this.getCompanyPhotosByCompanyProfileId(idDto, accessToken);
				})
				.then((photos: Array<CompanyPhotoDto>) => {
					//console.log("got company photos: ", photos);
					this.companyPhotos = photos;
					return;
				})
				.catch((error) => {
					warnings.push("Unable to retrieve company photos.");
				})
				.then(() => {
					return this.getCompanyLocationsByCompanyProfileId(idDto, accessToken);
				})
				.then((locations: Array<CompanyLocationDto>) => {
					//console.log("got company locations: ", locations);
					this.companyLocations = locations;
					return;
				})
				.catch((error) => {
					warnings.push("Unable to retrieve company location information.");
				})
				.then(() => {
					return this.getCompanyVideosByCompanyProfileId(idDto, accessToken);
				})
				.then((videos: Array<CompanyVideoDto>) => {
					this.companyVideos = videos;
					//console.log("got company videos: ", videos);
					return;
				})
				.catch((error) => {
					warnings.push("Unable to retrieve company videos.");
				})
				.then(() => {
					return this.getPbxLinesByCompanyProfileId(idDto, accessToken);
				})
				.then((pbxLines: Array<PbxLineDto>) => {
					this.pbxLines = pbxLines;
				})
				.catch((error) => {
					warnings.push("Unable to retrieve Company Pbx Lines");
				})
				.then(() => {
					if (warnings.length > 0) {
						reject(this.jsHelperService.implode("|", warnings));
					}
					else {
						resolve();
					}
				})
		});
	}

	// Stores: this.companyProfile
	createCompanyProfile(profile: CompanyProfileDto, accessToken: string): Promise<CompanyProfileDto> {
		return new Promise<CompanyProfileDto>((resolve, reject) => {
			let url = this.appendUrl('CreateCompanyProfile')
			let payload = this.jsHelperService.formatWebApiPayload(profile);

			this.jsHelperService.ajaxRequestParsed<CompanyProfileDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyProfileDto) => {
					this.companyProfile = dto;
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	// (fileName: uploadImage)
	// Stores: this.companyProfile
	addCompanyProfileImage(dataUri: string, companyProfileId: number, accessToken: string): Promise<CompanyProfileDto> {
		return new Promise<CompanyProfileDto>((resolve, reject) => {
			let url = this.appendUrl(`AddCompanyProfileImage/${companyProfileId}`)
			let payload: FormData = new FormData();
			let blob: Blob = this.jsHelperService.dataUriToBlob(dataUri);
			payload.append("uploadImage", blob, "uploadImage" + blob.type.replace("image/", "."));

			this.jsHelperService.ajaxRequestParsed<CompanyProfileDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyProfileDto) => {
					this.companyProfile = dto;
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	// Stores: this.companyProfile
	deleteCompanyProfileImage(companyProfileId: number, accessToken: string): Promise<CompanyProfileDto> {
		return new Promise<CompanyProfileDto>((resolve, reject) => {
			let url = this.appendUrl(`DeleteCompanyProfileImage/${companyProfileId}`)
			let payload = null;

			this.jsHelperService.ajaxRequestParsed<CompanyProfileDto>(this.httpDelete, url, payload, accessToken)
				.then((dto: CompanyProfileDto) => {
					this.companyProfile = dto;
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	// Stores: this.companyProfile
	updateCompanyProfile(profile: CompanyProfileDto, accessToken: string): Promise<CompanyProfileDto> {
		return new Promise<CompanyProfileDto>((resolve, reject) => {
			let url = this.appendUrl('UpdateCompanyProfile')
			let payload = this.jsHelperService.formatWebApiPayload(profile);

			this.jsHelperService.ajaxRequestParsed<CompanyProfileDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyProfileDto) => {
					this.companyProfile = dto;
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	// Tracks: this.companyProfile, this.companyPhotos, this.companyLocations, this.companyVideos, this.companyEmployees
	deleteCompanyProfile(companyProfileId: number, accessToken: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let url = this.appendUrl(`DeleteCompanyProfile/${companyProfileId}`)
			let payload = null;

			this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
				.then((message: string) => {
					this.companyProfile = null;
					this.companyPhotos = null;
					this.companyLocations = null;
					this.companyVideos = null;
					this.companyEmployees = null;
					resolve(message);
				})
				.catch((error) => { reject(error); })
		})
	}

	// Stores: this.companyProfile
	getCompanyProfileById(id: number, accessToken: string): Promise<CompanyProfileDto> {
		return new Promise<CompanyProfileDto>((resolve, reject) => {
			let url = this.appendUrl(`GetCompanyProfileById/${id}`)
			let payload = null

			this.jsHelperService.ajaxRequestParsed<CompanyProfileDto>(this.httpGet, url, payload, accessToken)
				.then((dto: CompanyProfileDto) => {
					this.companyProfile = dto;
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getCompanyProfilesByMemberId(id: IdDto, accessToken: string): Promise<Array<CompanyProfileDto>> {
		return new Promise<Array<CompanyProfileDto>>((resolve, reject) => {
			let url = this.appendUrl('GetCompanyProfilesByMemberId')
			let payload = this.jsHelperService.formatWebApiPayload(id);

			this.jsHelperService.ajaxRequestParsed<Array<CompanyProfileDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyProfileDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	searchCompanyProfilesByName(term: SearchTermDto, accessToken: string): Promise<Array<CompanyProfileDto>> {
		return new Promise<Array<CompanyProfileDto>>((resolve, reject) => {
			let url = this.appendUrl('SearchCompanyProfilesByName')

			let payload = this.jsHelperService.formatWebApiPayload(term);

			this.jsHelperService.ajaxRequestParsed<Array<CompanyProfileDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyProfileDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	searchCompanyProfilesByLocation(location: LocationSearchDto, accessToken: string): Promise<Array<CompanyProfileDto>> {
		return new Promise<Array<CompanyProfileDto>>((resolve, reject) => {
			let url = this.appendUrl('SearchCompanyProfilesByLocation')
			let payload = this.jsHelperService.formatWebApiPayload(location);

			this.jsHelperService.ajaxRequestParsed<Array<CompanyProfileDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyProfileDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// #endregion

	// #region companyEmployee

	getEmployeeCompanies(idDto: IdDto, accessToken: string): Promise<Array<CompanyProfileDto>> {
		return new Promise<Array<CompanyProfileDto>>((resolve, reject) => {
			let url = this.appendUrl('GetEmployeeCompanies')
			let payload = this.jsHelperService.formatWebApiPayload(idDto);
			this.jsHelperService.ajaxRequestParsed<Array<CompanyProfileDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyProfileDto>) => {
					resolve(dto);
				})
				.catch((error) => {
					reject(error);
				})
		})
	}

	// Tracks: this.companyEmployees
	createCompanyEmployee(employee: CompanyEmployeeDto, accessToken: string): Promise<CompanyEmployeeDto> {
		return new Promise<CompanyEmployeeDto>((resolve, reject) => {
			let url = this.appendUrl(`CreateCompanyEmployee/${employee.companyProfileId}`)

			let payload = this.jsHelperService.formatWebApiPayload(employee);

			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyEmployeeDto) => {
					// do tracking
					let current = this.companyEmployees
					this.jsHelperService.trackArrayProperty<CompanyEmployeeDto>(current, dto, this.jsHelperService.nameof<CompanyEmployeeDto>("companyEmployeeId"), PropertyTrackingEnum.create);
					this.companyEmployees = current;
					// resolve for client to handle
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// Tracks: this.companyEmployees
	addCompanyEmployeeImage(dataUri: string, employeeId: number, accessToken: string): Promise<CompanyEmployeeDto> {
		return new Promise<CompanyEmployeeDto>((resolve, reject) => {
			let url = this.appendUrl(`AddCompanyEmployeeImage/${employeeId}`)
			let formData = new FormData()
			let payload: FormData = new FormData();
			let blob: Blob = this.jsHelperService.dataUriToBlob(dataUri);
			payload.append("uploadImage", blob, "uploadImage" + blob.type.replace("image/", "."));

			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyEmployeeDto) => {
					// do tracking
					let current = this.companyEmployees;
					this.jsHelperService.trackArrayProperty<CompanyEmployeeDto>(current, dto, this.jsHelperService.nameof<CompanyEmployeeDto>("companyEmployeeId"), PropertyTrackingEnum.update);
					this.companyEmployees = current;
					// resolve for client to handle
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// Tracks: this.companyEmployees
	deleteCompanyEmployeeImage(employeeId: number, accessToken: string): Promise<CompanyEmployeeDto> {
		return new Promise<CompanyEmployeeDto>((resolve, reject) => {
			let url = this.appendUrl(`deleteCompanyEmployeeImage/${employeeId}`)

			let payload = null

			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeDto>(this.httpDelete, url, payload, accessToken)
				.then((dto: CompanyEmployeeDto) => {
					// do tracking
					let current = this.companyEmployees;
					this.jsHelperService.trackArrayProperty<CompanyEmployeeDto>(current, dto, this.jsHelperService.nameof<CompanyEmployeeDto>("companyEmployeeId"), PropertyTrackingEnum.update);
					this.companyEmployees = current;
					// resolve for client to handle
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// Tracks: this.companyEmployees
	updateCompanyEmployee(employee: CompanyEmployeeDto, accessToken: string): Promise<CompanyEmployeeDto> {
		return new Promise<CompanyEmployeeDto>((resolve, reject) => {
			let url = this.appendUrl('UpdateCompanyEmployee')
			let payload = this.jsHelperService.formatWebApiPayload(employee);

			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyEmployeeDto) => {
					// do tracking
					let current = this.companyEmployees;
					this.jsHelperService.trackArrayProperty<CompanyEmployeeDto>(current, dto, this.jsHelperService.nameof<CompanyEmployeeDto>("companyEmployeeId"), PropertyTrackingEnum.update);
					this.companyEmployees = current;
					// resolve for client to handle
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// Tracks: this.companyEmployees
	deleteCompanyEmployee(companyEmployee: CompanyEmployeeDto, accessToken: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let url = this.appendUrl(`DeleteCompanyEmployee/${companyEmployee.companyEmployeeId}`)
			let payload = null;
			this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
				.then((message: string) => {
					let current = this.companyEmployees;
					this.jsHelperService.trackArrayProperty<CompanyEmployeeDto>(current, companyEmployee, this.jsHelperService.nameof<CompanyEmployeeDto>("companyEmployeeId"), PropertyTrackingEnum.delete);
					this.companyEmployees = current;
					resolve(message);
				})
				.catch((error) => { reject(error); });
		})
	}

	getCompanyEmployeeById(id: number, accessToken: string): Promise<CompanyEmployeeDto> {
		return new Promise<CompanyEmployeeDto>((resolve, reject) => {
			let url = this.appendUrl(`GetCompanyEmployeeById/${id}`)

			let payload = null
			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeDto>(this.httpGet, url, payload, accessToken)
				.then((dto: CompanyEmployeeDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getCompanyEmployeesByCompanyProfileId(idDto: IdDto, accessToken: string): Promise<Array<CompanyEmployeeDto>> {
		return new Promise<Array<CompanyEmployeeDto>>((resolve, reject) => {
			let url = this.appendUrl('GetCompanyEmployeesByCompanyProfileId')
			let payload = this.jsHelperService.formatWebApiPayload(idDto);

			this.jsHelperService.ajaxRequestParsed<Array<CompanyEmployeeDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyEmployeeDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getCompanyEmployeeByMemberId(companyProfileId: number, memberId: number, accessToken: string): Promise<CompanyEmployeeDto> {
		return new Promise<CompanyEmployeeDto>((resolve, reject) => {
			let url = this.appendUrl(`GetCompanyEmployeeByMemberId/${companyProfileId}/${memberId}`)

			let payload = null

			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeDto>(this.httpGet, url, payload, accessToken)
				.then((dto: CompanyEmployeeDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getCompanyEmployeeByEmail(email: string, companyProfileId: number, accessToken: string): Promise<CompanyEmployeeDto> {
		return new Promise<CompanyEmployeeDto>((resolve, reject) => {
			let url = this.appendUrl(`GetCompanyEmployeeByEmail/${companyProfileId}/${email}/`)

			let payload = null;

			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeDto>(this.httpGet, url, payload, accessToken)
				.then((dto: CompanyEmployeeDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	searchCompanyEmployeesByEmail(emailSearch: SearchTermDto, companyProfileId: number, accessToken: string): Promise<Array<CompanyEmployeeDto>> {
		return new Promise<Array<CompanyEmployeeDto>>((resolve, reject) => {
			let url = this.appendUrl(`SearchCompanyEmployeesByEmail/${companyProfileId}`)
			let payload = this.jsHelperService.formatWebApiPayload(emailSearch);
			this.jsHelperService.ajaxRequestParsed<Array<CompanyEmployeeDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyEmployeeDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	searchCompanyEmployeeByFirstName(term: SearchTermDto, companyProfileId: number, accessToken: string): Promise<CompanyEmployeeDto> {
		return new Promise<CompanyEmployeeDto>((resolve, reject) => {
			let url = this.appendUrl(`SearchCompanyEmployeeByFirstName/${companyProfileId}`)
			let payload = this.jsHelperService.formatWebApiPayload(term);
			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyEmployeeDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	searchCompanyEmployeeByLastName(term: SearchTermDto, companyProfileId: number, accessToken: string): Promise<CompanyEmployeeDto> {
		return new Promise<CompanyEmployeeDto>((resolve, reject) => {
			let url = this.appendUrl(`SearchCompanyEmployeeByLastName/${companyProfileId}`)

			let payload = this.jsHelperService.formatWebApiPayload(term);

			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyEmployeeDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// #endregion

	// #region companyEmployeeInvites

	// Tracks: this.companyEmployeeInvites
	createCompanyEmployeeInvite(invite: CompanyEmployeeInviteDto, accessToken: string): Promise<CompanyEmployeeInviteDto> {
		return new Promise<CompanyEmployeeInviteDto>((resolve, reject) => {
			let url = this.appendUrl(`CreateCompanyEmployeeInvite`);

			let payload = this.jsHelperService.formatWebApiPayload(invite);

			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeInviteDto>(HttpTypeEnum.post, url, payload, accessToken)
				.then((dto: CompanyEmployeeInviteDto) => {
					let current = this.companyEmployeeInvites.slice();
					this.jsHelperService.trackArrayProperty<CompanyEmployeeInviteDto>(current, dto, this.jsHelperService.nameof<CompanyEmployeeInviteDto>("companyEmployeeInviteId"), PropertyTrackingEnum.create);
					this.companyEmployeeInvites = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// Tracks: this.companyEmployeeInvites
	updateCompanyEmployeeInvite(invite: CompanyEmployeeInviteDto, accessToken: string): Promise<CompanyEmployeeInviteDto> {
		return new Promise<CompanyEmployeeInviteDto>((resolve, reject) => {
			let url = this.appendUrl(`UpdateCompanyEmployeeInvite/${invite.companyProfileId}/`)

			let payload = this.jsHelperService.formatWebApiPayload(invite);

			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeInviteDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyEmployeeInviteDto) => {
					let current = this.companyEmployeeInvites
					this.jsHelperService.trackArrayProperty<CompanyEmployeeInviteDto>(current, dto, this.jsHelperService.nameof<CompanyEmployeeInviteDto>("companyEmployeeInviteId"), PropertyTrackingEnum.update);
					this.companyEmployeeInvites = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		});
	}

	// Tracks: this.companyEmployeeInvites
	deleteCompanyEmployeeInvite(invite: CompanyEmployeeInviteDto, accessToken: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let url = this.appendUrl(`DeleteCompanyEmployeeInvite/${invite.companyEmployeeInviteId}/`)
			let payload = null;
			this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
				.then((message: string) => {
					let current = this.companyEmployeeInvites;
					this.jsHelperService.trackArrayProperty<CompanyEmployeeInviteDto>(current, invite, this.jsHelperService.nameof<CompanyEmployeeInviteDto>("companyEmployeeInviteId"), PropertyTrackingEnum.delete);
					this.companyEmployeeInvites = current;
					resolve(message);
				})
				.catch((error) => { reject(error); });
		})
	}

	getCompanyEmployeeInviteById(employeeInviteId: number, accessToken: string): Promise<CompanyEmployeeInviteDto> {
		return new Promise<CompanyEmployeeInviteDto>((resolve, reject) => {
			let url = this.appendUrl(`GetCompanyEmployeeInviteById/${employeeInviteId}`)
			let payload = null;
			this.jsHelperService.ajaxRequestParsed<CompanyEmployeeInviteDto>(this.httpGet, url, payload, accessToken)
				.then((dto: CompanyEmployeeInviteDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getCompanyEmployeeInvitesByCompanyProfileId(companyProfileId: IdDto, accessToken: string): Promise<Array<CompanyEmployeeInviteDto>> {
		return new Promise<Array<CompanyEmployeeInviteDto>>((resolve, reject) => {
			let url = this.appendUrl(`GetCompanyEmployeeInvitesByCompanyProfileId/`)
			//let url = `http://localhost:18303/Pbx/GetCompanyEmployeeInvitesByCompanyProfileId/`;
			let payload = this.jsHelperService.formatWebApiPayload(companyProfileId);
			this.jsHelperService.ajaxRequestParsed<Array<CompanyEmployeeInviteDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyEmployeeInviteDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	searchCompanyEmployeeInvitesByEmail(emailSearch: SearchTermDto, companyProfileId: number, accessToken: string): Promise<Array<CompanyEmployeeInviteDto>> {
		return new Promise<Array<CompanyEmployeeInviteDto>>((resolve, reject) => {
			let url = this.appendUrl(`SearchCompanyEmployeeInvitesByEmail/${companyProfileId}`)
			let payload = this.jsHelperService.formatWebApiPayload(emailSearch);
			this.jsHelperService.ajaxRequestParsed<Array<CompanyEmployeeInviteDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyEmployeeInviteDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	searchCompanyEmployeeInvitesByFirstName(firstNameSearch: SearchTermDto, companyProfileId: number, accessToken: string): Promise<Array<CompanyEmployeeInviteDto>> {
		let funcName = 'searchCompanyEmployeeInvitesByFirstName'
		return new Promise<Array<CompanyEmployeeInviteDto>>((resolve, reject) => {
			let url = this.appendUrl(`SearchCompanyEmployeeInvitesByFirstName/${companyProfileId}`)
			let payload = this.jsHelperService.formatWebApiPayload(firstNameSearch);
			this.jsHelperService.ajaxRequestParsed<Array<CompanyEmployeeInviteDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyEmployeeInviteDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	searchCompanyEmployeeInvitesByLastName(lastNameSearch: SearchTermDto, companyProfileId: number, accessToken: string): Promise<Array<CompanyEmployeeInviteDto>> {
		let funcName = 'searchCompanyEmployeeInvitesByLastName'
		return new Promise<Array<CompanyEmployeeInviteDto>>((resolve, reject) => {
			let url = this.appendUrl(`SearchCompanyEmployeeInvitesByLastName/${companyProfileId}`)
			let payload = this.jsHelperService.formatWebApiPayload(lastNameSearch);
			this.jsHelperService.ajaxRequestParsed<Array<CompanyEmployeeInviteDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyEmployeeInviteDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// #endregion

	// #region CompanyLocation

	// Tracks: this.companyLocations
	createCompanyLocation(companyLocation: CompanyLocationDto, accessToken: string): Promise<CompanyLocationDto> {
		return new Promise<CompanyLocationDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(companyLocation);
			let url = this.configService.pbxController + 'CreateCompanyLocation/';
			this.jsHelperService.ajaxRequestParsed<CompanyLocationDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyLocationDto) => {
					let current = this.companyLocations;
					this.jsHelperService.trackArrayProperty<CompanyLocationDto>(current, dto, this.jsHelperService.nameof<CompanyLocationDto>("companyLocationId"), PropertyTrackingEnum.create);
					this.companyLocations = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	// Tracks: this.companyLocations
	addCompanyLocationImage(uploadImage: string, companyLocationId: number, accessToken: string): Promise<CompanyLocationDto> {
		return new Promise<CompanyLocationDto>((resolve, reject) => {
			let payload: FormData = new FormData();
			let blob: Blob = this.jsHelperService.dataUriToBlob(uploadImage);
			payload.append("uploadImage", blob, "uploadImage" + blob.type.replace("image/", "."));

			let url = this.appendUrl(`AddCompanyLocationImage/${companyLocationId}`)
			this.jsHelperService.ajaxRequestParsed<CompanyLocationDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyLocationDto) => {
					let current = this.companyLocations;
					this.jsHelperService.trackArrayProperty<CompanyLocationDto>(current, dto, this.jsHelperService.nameof<CompanyLocationDto>("companyLocationId"), PropertyTrackingEnum.update);
					this.companyLocations = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	// Tracks: this.companyLocations
	deleteCompanyLocationImage(companyLocationId: number, accessToken: string): Promise<CompanyLocationDto> {
		return new Promise<CompanyLocationDto>((resolve, reject) => {
			let payload = null;
			let url = this.appendUrl(`DeleteCompanyLocationImage/${companyLocationId}`)
			this.jsHelperService.ajaxRequestParsed<CompanyLocationDto>(this.httpDelete, url, payload, accessToken)
				.then((dto: CompanyLocationDto) => {
					let current = this.companyLocations;
					this.jsHelperService.trackArrayProperty<CompanyLocationDto>(current, dto, this.jsHelperService.nameof<CompanyLocationDto>("companyLocationId"), PropertyTrackingEnum.update);
					this.companyLocations = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// Tracks: this.companyLocations
	updateCompanyLocation(companyLocation: CompanyLocationDto, accessToken: string): Promise<CompanyLocationDto> {
		return new Promise<CompanyLocationDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(companyLocation);

			let url = this.appendUrl(`UpdateCompanyLocation`)
			this.jsHelperService.ajaxRequestParsed<CompanyLocationDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyLocationDto) => {
					let current = this.companyLocations;
					this.jsHelperService.trackArrayProperty<CompanyLocationDto>(current, dto, this.jsHelperService.nameof<CompanyLocationDto>("companyLocationId"), PropertyTrackingEnum.update);
					this.companyLocations = current;
					resolve(dto);
				})
				.catch((error) => {
					reject(error);
				})
		})
	}

	// Tracks: this.companyLocations
	deleteCompanyLocation(companyLocation: CompanyLocationDto, accessToken: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let payload = null;
			let url = this.appendUrl(`DeleteCompanyLocation/${companyLocation.companyLocationId}/`)
			this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
				.then((message: string) => {
					let current = this.companyLocations;
					this.jsHelperService.trackArrayProperty<CompanyLocationDto>(current, companyLocation, this.jsHelperService.nameof<CompanyLocationDto>("companyLocationId"), PropertyTrackingEnum.delete);
					this.companyLocations = current;
					resolve(message);
				})
				.catch((error) => {
					reject(error);
				})
		})
	}

	getCompanyLocationById(companyLocationId: number, accessToken: string): Promise<CompanyLocationDto> {
		return new Promise<CompanyLocationDto>((resolve, reject) => {
			let payload = null
			let url = this.appendUrl(`GetCompanyLocationById/${companyLocationId}`)
			this.jsHelperService.ajaxRequestParsed<CompanyLocationDto>(this.httpGet, url, payload, accessToken)
				.then((dto: CompanyLocationDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getCompanyLocationsByCompanyProfileId(idDto: IdDto, accessToken: string): Promise<Array<CompanyLocationDto>> {
		return new Promise<Array<CompanyLocationDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(idDto);

			let url = this.appendUrl(`GetCompanyLocationsByCompanyProfileId`)
			this.jsHelperService.ajaxRequestParsed<Array<CompanyLocationDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyLocationDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	searchCompanyLocationsByLocation(locationSearch: LocationSearchDto, companyProfileId: number, accessToken: string): Promise<Array<CompanyLocationDto>> {
		let funcName = 'searchCompanyLocationsByLocation'
		return new Promise<Array<CompanyLocationDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(locationSearch);

			let url = this.appendUrl(`SearchCompanyLocationsByLocation/${companyProfileId}`)
			this.jsHelperService.ajaxRequestParsed<Array<CompanyLocationDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyLocationDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// #endregion

	// #region CompanyVideos

	// Tracks: this.companyVideos
	createCompanyVideo(companyVideo: CompanyVideoDto, accessToken: string): Promise<CompanyVideoDto> {
		return new Promise<CompanyVideoDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(companyVideo);

			let url = this.appendUrl(`CreateCompanyVideo`)
			this.jsHelperService.ajaxRequestParsed<CompanyVideoDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyVideoDto) => {
					let current = this.companyVideos;
					this.jsHelperService.trackArrayProperty<CompanyVideoDto>(current, dto, this.jsHelperService.nameof<CompanyVideoDto>("companyVideoId"), PropertyTrackingEnum.create);
					this.companyVideos = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// Tracks: this.companyVideos
	addCompanyVideo(blob: Blob, companyVideoId: number, accessToken: string): Promise<CompanyVideoDto> {
		return new Promise<CompanyVideoDto>((resolve, reject) => {
			let payload: FormData = new FormData();
			payload.append("uploadVideo", blob, "uploadVideo" + blob.type.replace("video/", "."));
			let url = this.appendUrl(`AddCompanyVideo/${companyVideoId}/`)
			this.jsHelperService.ajaxRequestParsed<CompanyVideoDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyVideoDto) => {
					let current = this.companyVideos;
					this.jsHelperService.trackArrayProperty<CompanyVideoDto>(current, dto, this.jsHelperService.nameof<CompanyVideoDto>("companyVideoId"), PropertyTrackingEnum.create);
					this.companyVideos = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// Tracks: this.companyVideos
	updateCompanyVideo(companyVideo: CompanyVideoDto, accessToken: string): Promise<CompanyVideoDto> {
		return new Promise<CompanyVideoDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(companyVideo);

			let url = this.appendUrl(`UpdateCompanyVideo`)
			this.jsHelperService.ajaxRequestParsed<CompanyVideoDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyVideoDto) => {
					let current = this.companyVideos;
					this.jsHelperService.trackArrayProperty<CompanyVideoDto>(current, dto, this.jsHelperService.nameof<CompanyVideoDto>("companyVideoId"), PropertyTrackingEnum.update);
					this.companyVideos = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// Tracks: this.companyVideos
	deleteCompanyVideo(companyVideo: CompanyVideoDto, accessToken: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let payload = null;
			let url = this.appendUrl(`DeleteCompanyVideo/${companyVideo.companyVideoId}`)
			this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
				.then((message: string) => {
					let current = this.companyVideos;
					this.jsHelperService.trackArrayProperty<CompanyVideoDto>(current, companyVideo, this.jsHelperService.nameof<CompanyVideoDto>("companyVideoId"), PropertyTrackingEnum.delete);
					this.companyVideos = current;
					resolve(message);
				})
				.catch((error) => { reject(error); });
		})
	}

	getCompanyVideoById(companyVideoId: number, accessToken: string): Promise<CompanyVideoDto> {
		return new Promise<CompanyVideoDto>((resolve, reject) => {
			let payload = null;

			let url = this.appendUrl(`GetCompanyVideoById/${companyVideoId}/`)
			this.jsHelperService.ajaxRequestParsed<CompanyVideoDto>(this.httpGet, url, payload, accessToken)
				.then((dto: CompanyVideoDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getCompanyVideosByCompanyProfileId(idDto: IdDto, accessToken: string): Promise<Array<CompanyVideoDto>> {
		return new Promise<Array<CompanyVideoDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(idDto);

			let url = this.appendUrl(`getCompanyVideosByCompanyProfileId`)
			this.jsHelperService.ajaxRequestParsed<Array<CompanyVideoDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyVideoDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// #endregion

	// #region CompanyPhotos

	// Tracks: this.companyPhotos
	createCompanyPhoto(companyPhoto: CompanyPhotoDto, accessToken: string): Promise<CompanyPhotoDto> {
		return new Promise<CompanyPhotoDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(companyPhoto);

			let url = this.configService.pbxController + 'CreateCompanyPhoto/';
			this.jsHelperService.ajaxRequestParsed<CompanyPhotoDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyPhotoDto) => {
					let current = this.companyPhotos;
					this.jsHelperService.trackArrayProperty<CompanyPhotoDto>(current, dto, this.jsHelperService.nameof<CompanyPhotoDto>("companyPhotoId"), PropertyTrackingEnum.create);
					this.companyPhotos = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		});
	}

	// Tracks: this.companyPhotos
	addCompanyPhoto(uploadImage: string, companyPhotoId: number, accessToken: string): Promise<CompanyPhotoDto> {
		return new Promise<CompanyPhotoDto>((resolve, reject) => {
			let payload: FormData = new FormData();
			let blob: Blob = this.jsHelperService.dataUriToBlob(uploadImage);
			payload.append("uploadImage", blob, "uploadImage" + blob.type.replace("image/", "."));

			let url = this.appendUrl(`AddCompanyPhoto/${companyPhotoId}`)

			this.jsHelperService.ajaxRequestParsed<CompanyPhotoDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyPhotoDto) => {
					let current = this.companyPhotos;
					this.jsHelperService.trackArrayProperty<CompanyPhotoDto>(current, dto, this.jsHelperService.nameof<CompanyPhotoDto>("companyPhotoId"), PropertyTrackingEnum.update);
					this.companyPhotos = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	// Tracks: this.companyPhotos
	updateCompanyPhoto(companyPhoto: CompanyPhotoDto, accessToken: string): Promise<CompanyPhotoDto> {
		return new Promise<CompanyPhotoDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(companyPhoto);

			let url = this.appendUrl(`UpdateCompanyPhoto`)
			this.jsHelperService.ajaxRequestParsed<CompanyPhotoDto>(this.httpPost, url, payload, accessToken)
				.then((dto: CompanyPhotoDto) => {
					let current = this.companyPhotos;
					this.jsHelperService.trackArrayProperty<CompanyPhotoDto>(current, dto, this.jsHelperService.nameof<CompanyPhotoDto>("companyPhotoId"), PropertyTrackingEnum.update);
					this.companyPhotos = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// Tracks: this.companyPhotos
	deleteCompanyPhoto(companyPhoto: CompanyPhotoDto, accessToken: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let payload = null;
			let url = this.appendUrl(`DeleteCompanyPhoto/${companyPhoto.companyPhotoId}/`);
			this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
				.then((message: string) => {
					let current = this.companyPhotos;
					this.jsHelperService.trackArrayProperty<CompanyPhotoDto>(current, companyPhoto, this.jsHelperService.nameof<CompanyPhotoDto>("companyPhotoId"), PropertyTrackingEnum.delete);
					this.companyPhotos = current;
					resolve(message);
				})
				.catch((error) => {
					reject(error);
				})
		})
	}

	getCompanyPhotoById(companyPhotoId: number, accessToken: string): Promise<CompanyPhotoDto> {
		return new Promise<CompanyPhotoDto>((resolve, reject) => {
			let payload = null;
			let url = this.appendUrl(`GetCompanyPhotoById/${companyPhotoId}/`)
			this.jsHelperService.ajaxRequestParsed<CompanyPhotoDto>(this.httpGet, url, payload, accessToken)
				.then((dto: CompanyPhotoDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getCompanyPhotosByCompanyProfileId(idDto: IdDto, accessToken: string): Promise<Array<CompanyPhotoDto>> {
		return new Promise<Array<CompanyPhotoDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(idDto);
			let url = this.appendUrl(`getCompanyPhotosByCompanyProfileId/`)
			this.jsHelperService.ajaxRequestParsed<Array<CompanyPhotoDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<CompanyPhotoDto>) => {
					resolve(dto);
				})
				.catch((error) => {
					reject(error);
				})
		})
	}

	// #endregion

	// #region pbxLine

	// Tracks: this.pbxLines
	createPbxLine(pbxLine: PbxLineDto, accessToken: string): Promise<PbxLineDto> {
		return new Promise<PbxLineDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(pbxLine);

			let url = this.configService.pbxController + 'CreatePbxLine/';

			this.jsHelperService.ajaxRequestParsed<PbxLineDto>(this.httpPost, url, payload, accessToken)
				.then((dto: PbxLineDto) => {
					let current = this.pbxLines;
					this.jsHelperService.trackArrayProperty<PbxLineDto>(current, dto, this.jsHelperService.nameof<PbxLineDto>("pbxLineId"), PropertyTrackingEnum.create);
					this.pbxLines = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	// Tracks: this.pbxLines
	addPbxLineImage(dataUri: string, pbxLineId: number, accessToken: string): Promise<PbxLineDto> {
		return new Promise<PbxLineDto>((resolve, reject) => {
			let payload: FormData = new FormData();
			let blob: Blob = this.jsHelperService.dataUriToBlob(dataUri);
			payload.append("uploadImage", blob, "uploadImage" + blob.type.replace("image/", "."));

			let url = this.appendUrl(`AddPbxLineImage/${pbxLineId}/`)

			this.jsHelperService.ajaxRequestParsed<PbxLineDto>(this.httpPost, url, payload, accessToken)
				.then((dto: PbxLineDto) => {
					let current = this.pbxLines;
					this.jsHelperService.trackArrayProperty<PbxLineDto>(current, dto, this.jsHelperService.nameof<PbxLineDto>("pbxLineId"), PropertyTrackingEnum.update);
					this.pbxLines = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	// Tracks: this.pbxLines
	deletePbxLineImage(pbxLineId: number, accessToken: string): Promise<PbxLineDto> {
		return new Promise<PbxLineDto>((resolve, reject) => {
			let payload = null
			let url = this.appendUrl(`DeletePbxLineImage/${pbxLineId}/`)
			this.jsHelperService.ajaxRequestParsed<PbxLineDto>(this.httpDelete, url, payload, accessToken)
				.then((dto: PbxLineDto) => {
					let current = this.pbxLines;
					this.jsHelperService.trackArrayProperty<PbxLineDto>(current, dto, this.jsHelperService.nameof<PbxLineDto>("pbxLineId"), PropertyTrackingEnum.update);
					this.pbxLines = current;
					resolve(dto);
				})
				.catch((error) => {
					reject(error);
				})
		})
	}

	// Tracks: this.pbxLines
	updatePbxLine(pbxLine: PbxLineDto, accessToken: string): Promise<PbxLineDto> {
		return new Promise<PbxLineDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(pbxLine);

			let url = this.appendUrl(`UpdatePbxLine/`)
			this.jsHelperService.ajaxRequestParsed<PbxLineDto>(this.httpPost, url, payload, accessToken)
				.then((dto: PbxLineDto) => {
					let current = this.pbxLines;
					this.jsHelperService.trackArrayProperty<PbxLineDto>(current, dto, this.jsHelperService.nameof<PbxLineDto>("pbxLineId"), PropertyTrackingEnum.update);
					this.pbxLines = current;
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	// Tracks: this.pbxLines
	deletePbxLine(pbxline: PbxLineDto, accessToken: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let payload = null;
			let url = this.appendUrl(`DeletePbxLine/${pbxline.pbxLineId.toString()}/`)
			this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
				.then((message: string) => {
					let current = this.pbxLines;
					this.jsHelperService.trackArrayProperty<PbxLineDto>(current, pbxline, this.jsHelperService.nameof<PbxLineDto>("pbxLineId"), PropertyTrackingEnum.delete);
					this.pbxLines = current;
					resolve(message);
				})
				.catch((error) => {
					reject(error);
				})
		})
	}

	getPbxLineById(id: number, accessToken: string): Promise<PbxLineDto> {
		return new Promise<PbxLineDto>((resolve, reject) => {
			let payload = null;
			let url = this.appendUrl(`GetPbxLineById/${id}`)
			this.jsHelperService.ajaxRequestParsed<PbxLineDto>(this.httpGet, url, payload, accessToken)
				.then((dto: PbxLineDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getPbxLinesByCompanyProfileId(dto: IdDto, accessToken: string): Promise<Array<PbxLineDto>> {
		return new Promise<Array<PbxLineDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(dto);

			let url = this.appendUrl(`GetPbxLinesByCompanyProfileId/`)
			this.jsHelperService.ajaxRequestParsed<Array<PbxLineDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<PbxLineDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	getMemberPbxLines(dto: PagingOrderByDto, accessToken: string): Promise<Array<PbxLineDto>> {
		return new Promise<Array<PbxLineDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(dto);

			let url = this.appendUrl(`GetMemberPbxLines/`)
			this.jsHelperService.ajaxRequestParsed<Array<PbxLineDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<PbxLineDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getEmployeePbxLines(dto: IdDto, memberId: number, accessToken: string): Promise<Array<PbxLineDto>> {
		return new Promise<Array<PbxLineDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(dto);

			let url = this.appendUrl(`GetEmployeePbxLines/${memberId.toString()}/`)
			this.jsHelperService.ajaxRequestParsed<Array<PbxLineDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<PbxLineDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	searchPbxLinesByLineName(lineNameSearch: SearchTermDto, companyProfileId: number, accessToken: string): Promise<Array<PbxLineDto>> {
		return new Promise<Array<PbxLineDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(lineNameSearch);
			let url = this.appendUrl(`SearchPbxLinesByLineName/${companyProfileId}/`)
			this.jsHelperService.ajaxRequestParsed<Array<PbxLineDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<PbxLineDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// #endregion

	// #region PbxLineReps
	createPbxLineRep(pbxlineRep: PbxLineRepDto, accessToken: string): Promise<PbxLineRepDto> {
		return new Promise<PbxLineRepDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(pbxlineRep);

			let url = this.configService.pbxController + 'CreatePbxLineRep/';
			this.jsHelperService.ajaxRequestParsed<PbxLineRepDto>(this.httpPost, url, payload, accessToken)
				.then((dto: PbxLineRepDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	updatePbxLineRep(pbxlineRep: PbxLineRepDto, accessToken: string): Promise<PbxLineRepDto> {
		return new Promise<PbxLineRepDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(pbxlineRep);

			let url = this.appendUrl(`UpdatePbxLineRep/`)
			this.jsHelperService.ajaxRequestParsed<PbxLineRepDto>(this.httpPost, url, payload, accessToken)
				.then((dto: PbxLineRepDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	deletePbxLineRep(pbxlineRep: PbxLineRepDto, accessToken: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let payload = null
			let url = this.configService.pbxController + `DeletePbxLineRep/${pbxlineRep.pbxLineRepId}`;
			this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
				.then((message: string) => {
					resolve(message);
				})
				.catch((error) => { reject(error); })
		})
	}

	getPbxLineRepById(id: number, accessToken: string): Promise<PbxLineRepDto> {
		return new Promise<PbxLineRepDto>((resolve, reject) => {
			let payload = null
			let url = this.appendUrl(`GetPbxLineRepById/${id}/`)
			this.jsHelperService.ajaxRequestParsed<PbxLineRepDto>(this.httpGet, url, payload, accessToken)
				.then((dto: PbxLineRepDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getPbxLineRepByEmployeeId(companyEmployeeId: number, pbxLineId: number, accessToken: string): Promise<PbxLineRepDto> {
		return new Promise<PbxLineRepDto>((resolve, reject) => {
			let payload = null
			let url = this.appendUrl(`GetPbxLineRepByEmployeeId/${companyEmployeeId}/${pbxLineId}/`)
			this.jsHelperService.ajaxRequestParsed<PbxLineRepDto>(this.httpGet, url, payload, accessToken)
				.then((dto: PbxLineRepDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getPbxLineRepsByCompanyProfileId(companyProfileId: IdDto, accessToken: string): Promise<Array<PbxLineRepDto>> {
		return new Promise<Array<PbxLineRepDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(companyProfileId);
			let url = this.appendUrl(`GetPbxLineRepsByCompanyProfileId/`)
			this.jsHelperService.ajaxRequestParsed<Array<PbxLineRepDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<PbxLineRepDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getPbxLineRepsByPbxLineId(dto: LongIdDto, accessToken: string): Promise<Array<PbxLineRepDto>> {
		return new Promise<Array<PbxLineRepDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(dto);

			let url = this.appendUrl(`GetPbxLineRepsByPbxLineId/`)
			this.jsHelperService.ajaxRequestParsed<Array<PbxLineRepDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<PbxLineRepDto>) => {
					resolve(dto);
				})
				.catch((error) => {
					reject(error);
				})
		})
	}

	searchPbxLineRepsByEmployeeFirstName(term: SearchTermDto, accessToken: string): Promise<Array<PbxLineRepDto>> {
		return new Promise<Array<PbxLineRepDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(term);
			let url = this.appendUrl(`SearchPbxLineRepsByEmployeeFirstName/`)
			this.jsHelperService.ajaxRequestParsed<Array<PbxLineRepDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<PbxLineRepDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// #endregion

	// #region pbxLineRepStatus

	createPbxLineRepStatus(pbxLineRepStatus: PbxLineRepStatusDto, accessToken: string): Promise<PbxLineRepStatusDto> {
		return new Promise<PbxLineRepStatusDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(pbxLineRepStatus);
			let url = this.appendUrl(`CreatePbxLineRepStatus;`)
			this.jsHelperService.ajaxRequestParsed<PbxLineRepStatusDto>(this.httpPost, url, payload, accessToken)
				.then((dto: PbxLineRepStatusDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	updatePbxLineRepStatus(pbxLineRepStatus: PbxLineRepStatusDto, accessToken: string): Promise<PbxLineRepStatusDto> {
		return new Promise<PbxLineRepStatusDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(pbxLineRepStatus);
			let url = this.appendUrl(`UpdatePbxLineRepStatus/`)
			this.jsHelperService.ajaxRequestParsed<PbxLineRepStatusDto>(this.httpPost, url, payload, accessToken)
				.then((dto: PbxLineRepStatusDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// NOTE: only the company owner can delete a PbxLineRepStatus
	deletePbxLineRepStatus(pbxLineRespStatus: PbxLineRepStatusDto, accessToken: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let payload = null;
			let url = this.appendUrl(`DeletePbxLineRepStatus/${pbxLineRespStatus.pbxLineRepStatusId}`)
			this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
				.then((message: string) => {
					resolve(message);
				})
				.catch((error) => { reject(error); });
		})
	}

	getPbxLineRepStatusById(pbxLineRepStatusId: number, accessToken: string): Promise<PbxLineRepStatusDto> {
		return new Promise<PbxLineRepStatusDto>((resolve, reject) => {
			let payload = null
			let url = this.appendUrl(`GetPbxLineRepStatusById/${pbxLineRepStatusId}/`)
			this.jsHelperService.ajaxRequestParsed<PbxLineRepStatusDto>(this.httpGet, url, payload, accessToken)
				.then((dto: PbxLineRepStatusDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getPbxLineRepStatusByPbxLineRepId(pbxLineRepId: LongIdDto, accessToken: string): Promise<Array<PbxLineRepStatusDto>> {
		return new Promise<Array<PbxLineRepStatusDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(pbxLineRepId);
			let url = this.appendUrl(`GetPbxLineRepStatusByPbxLineRepId/`)
			this.jsHelperService.ajaxRequestParsed<Array<PbxLineRepStatusDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<PbxLineRepStatusDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getPbxLineRepStatusByConnectionGuid(guid: string, accessToken: string): Promise<PbxLineRepStatusDto> {
		return new Promise<PbxLineRepStatusDto>((resolve, reject) => {
			let payload = null;
			let url = this.appendUrl(`GetPbxLineRepStatusByConnectionGuid/${guid}/`)
			this.jsHelperService.ajaxRequestParsed<PbxLineRepStatusDto>(this.httpGet, url, payload, accessToken)
				.then((dto: PbxLineRepStatusDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	isRepOnline(pbxLineRepId: number, accessToken: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let payload = null
			let url = this.appendUrl(`IsRepOnline/${pbxLineRepId}/`)
			this.jsHelperService.ajaxRequestParsed<boolean>(this.httpGet, url, payload, accessToken)
				.then((response: boolean) => {
					resolve(response);
				})
				.catch((error) => { reject(error); });
		})
	}

	// #endregion

	// #region PbxCallQueue
	createPbxCallQueue(pbxCallQueue: PbxCallQueueDto, accessToken: string): Promise<PbxCallQueueDto> {
		return new Promise<PbxCallQueueDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(pbxCallQueue);
			let url = this.appendUrl(`CreatePbxCallQueue/`)
			this.jsHelperService.ajaxRequestParsed<PbxCallQueueDto>(this.httpPost, url, payload, accessToken)
				.then((dto: PbxCallQueueDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	updatePbxCallQueue(pbxCallQueue: PbxCallQueueDto, accessToken: string) {
		return new Promise<PbxCallQueueDto>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(pbxCallQueue);
			let url = this.appendUrl(`UpdatePbxCallQueue/`)
			this.jsHelperService.ajaxRequestParsed<PbxCallQueueDto>(this.httpPost, url, payload, accessToken)
				.then((dto: PbxCallQueueDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	deletePbxCallQueue(pbxCallQueue: PbxCallQueueDto, accessToken: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let payload = null
			let url = this.appendUrl(`DeletePbxCallQueue/${pbxCallQueue.pbxCallQueueId}/`)
			this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
				.then((message: string) => {
					resolve(message);
				})
				.catch((error) => { reject(error); });
		})
	}

	getPbxCallQueueById(pbxCallQueueId: number, accessToken: string): Promise<PbxCallQueueDto> {
		return new Promise<PbxCallQueueDto>((resolve, reject) => {
			let payload = null
			let url = this.appendUrl(`GetPbxCallQueueById/${pbxCallQueueId}/`)
			this.jsHelperService.ajaxRequestParsed<PbxCallQueueDto>(this.httpGet, url, payload, accessToken)
				.then((dto: PbxCallQueueDto) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	getPbxCallQueuesByPbxLineRepId(pbxlineRepId: IdDto, accessToken: string): Promise<Array<PbxCallQueueDto>> {
		return new Promise<Array<PbxCallQueueDto>>((resolve, reject) => {
			let payload = this.jsHelperService.formatWebApiPayload(pbxlineRepId);
			let url = this.appendUrl(`GetPbxCallQueuesByPbxLineRepId/`)
			this.jsHelperService.ajaxRequestParsed<Array<PbxCallQueueDto>>(this.httpPost, url, payload, accessToken)
				.then((dto: Array<PbxCallQueueDto>) => {
					resolve(dto);
				})
				.catch((error) => { reject(error); });
		})
	}

	// #endregion

	// #region ContactUs
	async createContactUs(model: ContactUsDto): Promise<ContactUsDto> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(model);
			let url = this.configService.webApiBase + "api/CreateContactUs";
			//let url = `http://localhost:18303/api/CreateContactUs`;
			let dto = await this.jsHelperService.ajaxRequestParsed<ContactUsDto>(HttpTypeEnum.post, url, payload, null);
			return dto;
		}
		catch (e) {
			console.log("createContactUs error: ", e);
			throw (e);
		}
	}

	async getContactUsById(contactUsId: number): Promise<ContactUsDto> {
		try {
			let payload = null;
			let url = this.configService.webApiBase + `api/GetContactUsById/${contactUsId}/`;
			let dto = await this.jsHelperService.ajaxRequestParsed<ContactUsDto>(this.httpGet, url, payload, null);
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}
	// #endregion

	// #region Utilities
	async getHubConnectionEmailByGuid(guid: string, accessToken: string): Promise<string> {
		try {
			let payload = null
			let url = this.appendUrl(`GetHubConnectionEmailByGuid/${guid.toUpperCase()}/`)
			let email: string = await this.jsHelperService.ajaxRequestParsed<string>(HttpTypeEnum.get, url, payload, accessToken)
			return email;
		}
		catch (e) {
			throw (e);
		}
	}

	async sendCopyOfMessage(dto: SendCopyOfMessageDto, accessToken: string): Promise<void> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			let url = this.configService.pbxController + 'SendCopyOfMessage/';
			let result: SendCopyOfMessageDto = await this.jsHelperService.ajaxRequestParsed<SendCopyOfMessageDto>(this.httpPost, url, payload, accessToken)
			return;
		}
		catch (e) {
			throw (e);
		}
	}

	// #endregion
}