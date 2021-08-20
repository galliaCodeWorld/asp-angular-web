import { Injectable } from '@angular/core';

import {
	//SignalrService,
	JsHelperService,
	ConfigService,
	LocalStorageService,
} from './index';
import {
	BlockedEmailType,
	WebApiResponseStatusType,
	WebApiResponseType,
	PagingType
} from '../models/index';

//NOTE: VERY IMPORTANT, this service is only available to member users.

@Injectable()
export class BlockCallService {
	constructor(
		public jsHelperService: JsHelperService,
		//public signalrService: SignalrService,
		public configService: ConfigService,
		public storageService: LocalStorageService,
	) {
		this.blockedEmails = new Array<BlockedEmailType>();
	}

	get blockedEmails(): Array<BlockedEmailType> {
		let key = this.configService.keyBlockEmails;
		return this.storageService.getPermanentItem<Array<BlockedEmailType>>(key);
	}
	set blockedEmails(value: Array<BlockedEmailType>) {
		let key = this.configService.keyBlockEmails;
		this.storageService.setPermanentItem(key, value);
	}

	//init(accessToken: string): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		this.getAllBlockedEmails(accessToken)
	//			.then((blockedEmails: Array<BlockedEmailType>) => {
	//				this.setLocalBlockedEmails(blockedEmails);
	//				resolve();
	//			})
	//			.catch((error) => {
	//				console.log("blockCall.service.ts init getAllBlockedEmails error: ", error);
	//				reject(error);
	//			})
	//	});
	//}

	setLocalBlockedEmails(blockedEmails: Array<BlockedEmailType>): void {
		this.blockedEmails = blockedEmails;
	}

	unsetLocalBlockedEmails(): void {
		this.blockedEmails = new Array<BlockedEmailType>();
	}

	// adds an email to block list and returns the BlockedEmailType back
	blockEmail(email: string, accessToken: string): Promise<BlockedEmailType> {
		let methodName = "blockedEmail";
		return new Promise<BlockedEmailType>((resolve, reject) => {
			//TODO: implement
			let url: string = "https://nofb.org/LNVApi/PhoneContact/BlockEmail";
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
							let result: BlockedEmailType = this.jsHelperService.jsonToObject<BlockedEmailType>(apiResponse.data, true);
							let blockedEmails = this.blockedEmails;
							blockedEmails.push(result);
							this.blockedEmails = blockedEmails;
							return resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.jsonToObject<Array<string>>(apiResponse.data);
							reject(methodName + " errors:" + this.jsHelperService.implode("| ", errors));
						}
					}
					else {
						reject(methodName + " errors: unable to parse json from webApiResponse");
					}
				})
				.catch((error) => {
					//console.log(error);
					return reject(methodName + ": ajax request failed.");
				});
		});
	}

	// removes an email from block list returns true on success, rejects with error on failure
	unblockEmail(blockedEmailId: number, accessToken: string): Promise<boolean> {
		let methodName = "unblockedEmail";
		return new Promise<boolean>((resolve, reject) => {
			//TODO: implement
			let url: string = "https://nofb.org/LNVApi/PhoneContact/UnblockEmail";
			let method: string = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Id: blockedEmailId
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) == false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let blockedEmail = this.jsHelperService.jsonToObject<BlockedEmailType>(apiResponse.data, true);
							if (this.jsHelperService.isEmpty(blockedEmail) === false) {
								let index = this.blockedEmails.findIndex((value) => {
									return value.emailBlocked == blockedEmail.emailBlocked;
								});

								// remove it from the local blocked emails array
								if (index > -1) {
									let blockedEmails = this.blockedEmails;
									blockedEmails.splice(index, 1);
									this.blockedEmails = blockedEmails;
								}
							}

							return resolve(true);
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
					return reject(methodName + ": ajax request failed.");
				});
		});
	}

	// gets blocked email with paging option
	getBlockedEmails(options: PagingType, accessToken: string): Promise<Array<BlockedEmailType>> {
		return new Promise<Array<BlockedEmailType>>((resolve, reject) => {
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;

			let url: string = "https://nofb.org/LNVApi/PhoneContact/GetBlockedEmails/";
			let optionsArray = new Array();
			let queryString = "";
			if (this.jsHelperService.isEmpty(options) === false && typeof options === "object") {
				if (options.hasOwnProperty("skip")) {
					optionsArray.push(options.skip);
				}
				else {
					optionsArray.push("0");
				}

				if (options.hasOwnProperty("take")) {
					optionsArray.push(options.take);
				}
				else {
					optionsArray.push("100");
				}

				if (options.hasOwnProperty("orderField")) {
					optionsArray.push(options.orderField);
				}
				else {
					optionsArray.push("Created");
				}

				if (options.hasOwnProperty("orderDirection")) {
					optionsArray.push(options.orderDirection);
				}
				else {
					optionsArray.push("DESC");
				}

				queryString = encodeURI(optionsArray.join("/"));
			}
			else {
				queryString = "0/100/Created/DESC";
			}

			url = url + queryString;
			this.jsHelperService.ajaxRequest("GET", url, null, accessToken)
				.then((response) => {
					let result: Array<BlockedEmailType> = this.jsHelperService.parseWebApiResponse<Array<BlockedEmailType>>(response);
					if (this.jsHelperService.isEmpty(result) === false) {
						return resolve(result);
					}
					else {
						reject("getBlockedEmails: unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					return reject("getBlockedEmails: ajax request failed.");
				});
		});
	}

	// gets all blocked emails
	getAllBlockedEmails(accessToken: string): Promise<Array<BlockedEmailType>> {
		let methodName = "getAllBlockedEmails";
		return new Promise<Array<BlockedEmailType>>((resolve, reject) => {
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			this.jsHelperService.ajaxRequest("GET", "https://nofb.org/LNVApi/PhoneContact/GetAllBlockedEmails", null, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						//console.log("apiResponse:", apiResponse);
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result: BlockedEmailType[] = this.jsHelperService.jsonToObject<BlockedEmailType[]>(apiResponse.data, true);
							//console.log("got result: ", result);
							return resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.jsonToObject<Array<string>>(apiResponse.data, true);
							reject(methodName + " errors:" + this.jsHelperService.implode("| ", errors));
						}
					}
					else {
						reject(methodName + " errors: unable to parse json from webApiResponse");
					}
				})
				.catch((error) => {
					//console.log(error);
					return reject(methodName + " errors: ajax request failed.");
				});
		});
	}

	// uses cached list of block emails instead of live check from webapi server
	isBlockedEmailFromCache(email: string): boolean {
		let isBlocked = false;
		//first try to get it from service cache
		if (this.jsHelperService.isEmpty(this.blockedEmails) === false) {
			let index = this.blockedEmails.findIndex((value) => {
				return value.emailBlocked === email;
			});

			isBlocked = index > -1 ? true : false;
		}
		return isBlocked;
	}

	// check if an email is blocked by the member user
	// NOTE: only member users can use this method because the webapi server requires a member token
	isBlockedEmail(email: string, accessToken: string): Promise<boolean> {
		let methodName = "isBlockedEmail";
		return new Promise<boolean>((resolve, reject) => {
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload = {
				Email: email
			}

			this.jsHelperService.ajaxRequest("POST", "https://nofb.org/LNVApi/PhoneContact/IsBlockedEmail", payload, accessToken)
				.then((response) => {
					console.log("blockCall.service.ts isBlockedEmail()", email, response);
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					console.log("blockCall.service.ts isBlockedEmail() apiResponse: ", apiResponse);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result = apiResponse.data.toLowerCase() === "true" ? true : false;
							resolve(result);
						}
						else {
							//reject(response);
							resolve(false)
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					//console.log(error);
					console.log("blockCall.service.ts isBlockedEmail() error: ", error);
					return reject(error);
				});
		});
	}
}