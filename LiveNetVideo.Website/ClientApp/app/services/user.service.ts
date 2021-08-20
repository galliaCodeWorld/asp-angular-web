import { Injectable } from '@angular/core';
//import { Http } from '@angular/http';
//import 'rxjs/add/operator/map';

//import { Contact } from '../models/Contact';

//import { ThirdPartyFiles } from '../services/thirdpartyFiles';
//import { JsHelperService } from '../services/jsHelper.service';
//import { AuthService } from './auth.service';
import {
	LocalStorageService,
	SignalrService,
	JsHelperService,
	ConfigService,
	PushService
} from './index';
import {
	MemberType,
	WebApiResponseStatusType,
	WebApiResponseType,
	BlockedContact,
	Contact,
	PhoneContactType,
	RegisterDto,
	SendInviteDto,
	GuestLogin,
	GuestProfileType,
	JwtToken,
	PushSubscriptionType,
	UnsubscribePushNotificationDto,
	CompanyProfileDto,
	IdDto,
	OrderByDto,
	PagingDto,
	ObservableMessageType,
	GuestLoginType,
	CompanyPhotoDto,
	CompanyLocationDto,
	CompanyVideoDto,
	CompanyEmployeeDto,
	ParsedTokenType,
	HttpTypeEnum,
} from '../models/index';

import { Observable, Subject, BehaviorSubject } from 'rxjs/Rx'
//import { Platform } from "ionic-angular";

@Injectable()
export class UserService {
	MemberToken: any;

	//public MemberContacts: Contact[];
	//public BlockList: BlockedContact[];

	//profileUpdated: Subject<MemberType>

	constructor(
		//public http: Http,
		public jsHelperService: JsHelperService,
		public signalrService: SignalrService,
		public localStorageService: LocalStorageService,
		public configService: ConfigService,
		public pushService: PushService
	) {
		//this.profileUpdated = new Subject<MemberType>();
		this._webApiBase = this.configService.webApiBase;
	}

	//public _finishedGettingEmployers = new BehaviorSubject<ObservableMessageType>(new ObservableMessageType());
	//finishedGettingEmployers = this._finishedGettingEmployers.asObservable();

	_webApiBase: string;

	_redirectUrl: string;
	get redirectUrl(): string {
		return this._redirectUrl;
	}
	set redirectUrl(value: string) {
		this._redirectUrl = value;
	}

	get isLoggedIn(): boolean {
		return this.localStorageService.getPermanentItem<boolean>(this.configService.keyIsLoggedin);
	}
	set isLoggedIn(value: boolean) {
		this.localStorageService.setPermanentItem(this.configService.keyIsLoggedin, value);
	}

	// a convenience marker for the app, we will trust this marker to be correct. this will require
	// good testing for various app scenarios
	//_isMember: boolean;
	//async isMember(): Promise<boolean> {
	//	try {
	//		let accessToken = await this.signalrService.getAccessToken();
	//		if (this.jsHelperService.isEmpty(accessToken)) {
	//			return false;
	//		}
	//		else {
	//			let memberId = this.jsHelperService.getMemberId(accessToken);
	//			return this.jsHelperService.isEmpty(memberId) ? false : true;
	//		}
	//	}
	//	catch (e) {
	//		return false;
	//	}
	//}

	get guestProfile(): GuestProfileType {
		let key = this.configService.keyGuestFile;
		return this.localStorageService.getPermanentItem<GuestProfileType>(key);
	}
	set guestProfile(value: GuestProfileType) {
		let key = this.configService.keyGuestFile;
		this.localStorageService.setPermanentItem(key, value);
	}

	get profile(): MemberType {
		let key = this.configService.keyMemberType;
		//console.log("key: ", key);
		return this.localStorageService.getPermanentItem<MemberType>(key);
	}
	set profile(value: MemberType) {
		let key = this.configService.keyMemberType;
		this.localStorageService.setPermanentItem(key, value);
	}

	//NOTE: when the user profile updates, we need to notify any component that requires updated profile
	// example the profile-summary.component.ts
	private _onProfileUpdated = new BehaviorSubject<ObservableMessageType>(new ObservableMessageType());
	get onProfileUpdated(): BehaviorSubject<ObservableMessageType> {
		return this._onProfileUpdated;
	}

	private _onLoginUpdated = new BehaviorSubject<ObservableMessageType>(new ObservableMessageType());
	get onLoginUpdated(): BehaviorSubject<ObservableMessageType> {
		return this._onLoginUpdated;
	}
	//requestMemberProfile
	async getMyProfile(accessToken: string): Promise<MemberType> {
		try {
			let memberType = await this.jsHelperService.ajaxRequestParsed<MemberType>("GET", "https://nofb.org/LNVApi/Member/GetMyProfile", null, accessToken);
			return memberType;
		}
		catch (e) {
			throw (e);
		}
	}

	register(register: RegisterDto, accessToken: string): Promise<MemberType> {
		let methodName = "register";
		return new Promise<MemberType>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/Register";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				FirstName: register.firstName,
				LastName: register.lastName,
				Email: register.email,
				AltEmail: register.altEmail,
				Password: register.password,
				Username: register.username,
				AvatarDataUri: register.avatarDataUri,
				IsVerified: (typeof register.isVerified === 'undefined') ? true : register.isVerified,
				IsSuspended: (typeof register.isSuspended === 'undefined') ? false : register.isSuspended
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					//console.log("got response: ", response);
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result: MemberType = this.jsHelperService.jsonToObject<MemberType>(apiResponse.data, true);
							//this._justRegistered = true;
							resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + " errors: " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed." + this.jsHelperService.stringify(error));
				});
		});
	}

	addMemberProfileImage(dataUri: string, accessToken: string): Promise<MemberType> {
		return new Promise<MemberType>((resolve, reject) => {
			let url = `https://nofb.org/LNVApi/Member/AddMemberProfileImage/`;
			//let url = `http://localhost:18303/Member/AddMemberProfileImage/`;
			let payload: FormData = new FormData();
			let blob: Blob = this.jsHelperService.dataUriToBlob(dataUri);
			payload.append("uploadImage", blob, "uploadImage" + blob.type.replace("image/", "."));

			this.jsHelperService.ajaxRequestParsed<MemberType>('POST', url, payload, accessToken)
				.then((dto: MemberType) => {
					this.profile = dto;
					let message = new ObservableMessageType();
					message.message = this.jsHelperService.stringify(this.profile);
					this._onProfileUpdated.next(message);
					this._onProfileUpdated.next(new ObservableMessageType());
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	//refreshProfile(member: MemberType): void {
	//	let message = new ObservableMessageType();
	//	message.message = this.jsHelperService.stringify(member);
	//	this._onProfileUpdated.next(message);
	//	this._onProfileUpdated.next(new ObservableMessageType());
	//}

	// Stores: this.companyProfile
	deleteMemberProfileImage(accessToken: string): Promise<MemberType> {
		return new Promise<MemberType>((resolve, reject) => {
			let url = `https://nofb.org/LNVApi/Member/DeleteMemberProfileImage/`;
			let payload = null;

			this.jsHelperService.ajaxRequestParsed<MemberType>("DELETE", url, payload, accessToken)
				.then((dto: MemberType) => {
					this.profile = dto;
					let message = new ObservableMessageType();
					message.message = this.jsHelperService.stringify(this.profile);
					this._onProfileUpdated.next(message);
					this._onProfileUpdated.next(new ObservableMessageType());
					resolve(dto);
				})
				.catch((error) => { reject(error); })
		})
	}

	requestMemberId(email: string, accessToken: string): Promise<string> {
		let methodName = "requestMemberId";
		return new Promise<string>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/RequestMemberId";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Email: email
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result = apiResponse.data;
							resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject("getAllBlockedEmails errors: " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject("getAllBlockedEmails: unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed.");
				});
		});
	}

	requestAvatarFilename(email: string, accessToken: string): Promise<string> {
		let methodName = "requestAvatarFilename";
		return new Promise<string>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/RequestAvatarFileName";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Email: email
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result: string = apiResponse.data;
							resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed.");
				});
		});
	}

	updateMyProfile(member: MemberType, accessToken: string): Promise<MemberType> {
		let methodName = "updateMyProfile";
		return new Promise<MemberType>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/UpdateMyProfile";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				MemberId: member.memberId,
				Created: member.created,
				Updated: member.updated,
				Username: member.username,
				IsSuspended: member.isSuspended,
				IsVerified: member.isVerified,
				Email: member.email,
				FirstName: member.firstName,
				LastName: member.lastName,
				Notes: member.notes,
				AvatarDataUri: member.avatarDataUri
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result: MemberType = this.jsHelperService.jsonToObject<MemberType>(apiResponse.data, true);
							//emit an event that the profile has been updated
							let message = new ObservableMessageType();
							message.message = this.jsHelperService.stringify(result);
							this._onProfileUpdated.next(message);
							this._onProfileUpdated.next(new ObservableMessageType());
							resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + " errors: " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed.");
				});
		});
	}

	requestMemberAvatarDataUri(email: string, accessToken: string): Promise<string> {
		let methodName = "requestMemberAvatarDataUri";
		return new Promise<string>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/RequestMemberAvatarDataUri";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Email: email
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result = apiResponse.data;
							resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed.");
				});
		});
	}

	async getMemberByEmail(email: string, accessToken: string): Promise<MemberType> {
		try {
			let url: string = "https://nofb.org/LNVApi/Member/GetMemberByEmail";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload = this.jsHelperService.formatWebApiPayload({ Email: email });
			//let payload: any = {
			//	Email: email
			//}

			let dto = await this.jsHelperService.ajaxRequestParsed<MemberType>(method, url, payload, accessToken);
			return dto;
			//.then((response) => {
			//	let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
			//	if (this.jsHelperService.isEmpty(apiResponse) === false) {
			//		if (apiResponse.status === WebApiResponseStatusType.success) {
			//			let result: MemberType = this.jsHelperService.jsonToObject<MemberType>(apiResponse.data, true);
			//			resolve(result);
			//		}
			//		else {
			//			let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
			//			reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
			//		}
			//	}
			//	else {
			//		reject(methodName + ": unable to parse webApiResponseType.");
			//	}
			//})
			//.catch((error) => {
			//	//console.log(error);
			//	reject(methodName + ": ajax request failed.");
			//});
		}
		catch (e) {
			throw (e)
		};
	}

	sendInvite(invite: SendInviteDto, accessToken: string): Promise<boolean> {
		let methodName = "sendInvite";
		return new Promise<boolean>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/SendInvite";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Email: invite.email,
				Name: invite.name
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							resolve(true);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed.");
				});
		});
	}

	// this will remove the refresh token record from server so it can not be reused
	// Member/Logout
	clearRefreshToken(refreshTokenId: string, accessToken: string): Promise<boolean> {
		let methodName = "logout";
		return new Promise<boolean>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/Logout";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				RefreshTokenId: refreshTokenId
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							resolve(true);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed.");
				});
		});
	}

	// verifies a logged in users password. used for verifying a users old password
	// before allowing them to change password
	verifyPassword(password: string, accessToken: string): Promise<boolean> {
		let methodName = "verifyPassword";
		return new Promise<boolean>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/VerifyPassword";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				password: password
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							resolve(true);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed.");
				});
		});
	}

	changePassword(password: string, accessToken: string): Promise<MemberType> {
		let methodName = "changePassword";
		return new Promise<MemberType>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/ChangePassword";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				password: password
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result: MemberType = this.jsHelperService.jsonToObject<MemberType>(apiResponse.data, true);
							resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed.");
				});
		});
	}

	async sendPasswordResetRequest(email: string, accessToken: string): Promise<void> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload({
				Email: email
			});
			//console.log("payload: ", payload);
			let url = this.configService.webApiBase + 'Member/SendPasswordResetRequest/';
			//let url = "http://localhost:18303/Member/SendPasswordResetRequest/";
			await this.jsHelperService.ajaxRequestParsed<void>(HttpTypeEnum.post, url, payload, accessToken)
			return;

			//let method = "POST";
			////accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			//let payload: any =

			//this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
			//	.then((response) => {
			//		console.log("sendPasswordResetRequest response: ", response);

			//		let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
			//		if (this.jsHelperService.isEmpty(apiResponse) === false) {
			//			if (apiResponse.status === WebApiResponseStatusType.success) {
			//				resolve();
			//			}
			//			else {
			//				let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
			//				reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
			//			}
			//		}
			//		else {
			//			reject(methodName + ": unable to parse webApiResponseType.");
			//		}
			//	})
			//	.catch((error) => {
			//		//console.log(error);
			//		reject(methodName + ": ajax request failed.");
			//	});
		}
		catch (e) {
			throw (e);
		}
	}

	updateEmail(email: string, accessToken: string): Promise<MemberType> {
		let methodName = "updateEmail";
		return new Promise<MemberType>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/UpdateEmail";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Email: email
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result: MemberType = this.jsHelperService.jsonToObject<MemberType>(apiResponse.data, true);
							let message = new ObservableMessageType();
							message.message = this.jsHelperService.stringify(result);
							this._onProfileUpdated.next(message);
							this._onProfileUpdated.next(new ObservableMessageType());
							resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed.");
				});
		});
	}

	updateUsername(username: string, accessToken: string): Promise<MemberType> {
		let methodName = "updateUsername";
		return new Promise<MemberType>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/UpdateUsername";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Id: username
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result: MemberType = this.jsHelperService.jsonToObject<MemberType>(apiResponse.data, true);
							resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed.");
				});
		});
	}

	isEmailUnique(email: string, accessToken: string): Promise<string> {
		let methodName = "isEmailUnique";
		return new Promise<string>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/IsEmailUnique/";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Email: email
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							// not record found, so the email is unique
							resolve("");
						}
						else {
							//let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							//reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
							// failed, a record was found, but this could be the users current email, apiResponse.data
							// will contain the email to check
							resolve(apiResponse.data);
						}
					}
					else {
						reject("Unable to parse server response.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(error);
				});
		});
	}

	isUsernameUnique(username: string, accessToken: string): Promise<string> {
		let methodName = "isEmailUnique";
		return new Promise<string>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Member/IsUsernameUnique";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Id: username
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result = apiResponse.data;
							resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					reject(methodName + ": ajax request failed.");
				});
		});
	}

	async canGuestLogin(email: string, accessToken: string): Promise<boolean> {
		// Guests can not use member emails to login, and the email can not already be checked into webrtc hub (hubconnection record)

		// check if the email belongs to a member or
		try {
			let url = this.configService.webApiBase + 'Db/CanGuestLogin/' + email + '/'; // NOTE: when passing email in uri segment we need a trailing slash
			//let url = `http://localhost:18303/Db/CanGuestLogin/${email}/`;
			let data = await this.jsHelperService.ajaxRequest("GET", url, null, accessToken);

			//console.log("canGuestLogin data:", data);
			let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(data, true);
			if (this.jsHelperService.isEmpty(apiResponse) === false) {
				if (apiResponse.status === WebApiResponseStatusType.success) {
					return true;
				}
				else {
					let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
					if (this.jsHelperService.isEmpty(errors) === false) {
						throw (this.jsHelperService.implode(" |", errors));
					}
					else {
						throw ("Email not accepted. It is either used by another guest user or belongs to a member. Please try a different email account.");
					}
				}
			}
			else {
				throw ("Unable to authenticate email. Please try again later.");
			}
		}
		catch (e) {
			throw (e);
		}
	}
}