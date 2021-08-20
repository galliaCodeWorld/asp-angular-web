import { Injectable } from '@angular/core';
import { Contact, PhoneContactType, WebApiResponseStatusType, WebApiResponseType } from '../models/index';
import { JsHelperService, ConfigService, LocalStorageService } from './index';
import { Observable, Observer } from 'rxjs'

@Injectable()
export class ContactService {
	constructor(

		public jsHelperService: JsHelperService,
		private storageService: LocalStorageService,
		private configService: ConfigService,
	) { }

	//contacts: Array<PhoneContactType>;
	get contacts(): Array<PhoneContactType> {
		let key = this.configService.keyContactList;
		return this.storageService.getPermanentItem<Array<PhoneContactType>>(key);
	}

	set contacts(value: Array<PhoneContactType>) {
		let key = this.configService.keyContactList;
		this.storageService.setPermanentItem(key, value);
	}

	getContactList(accessToken: string): Promise<Array<PhoneContactType>> {
		let methodName = "getContactList";
		return new Promise<Array<PhoneContactType>>((resolve, reject) => {
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;

			//let canRun: boolean = !this.jsHelperService.isEmpty(this.jsHelperService.getMemberId(accessToken));

			this.jsHelperService.ajaxRequest("GET", "https://nofb.org/LNVApi/PhoneContact/GetPhoneContacts", null, accessToken)
				.then((response) => {
					//console.log("contact.service.ts getContactList() response json: ", response);

					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let contactList: PhoneContactType[] = this.jsHelperService.jsonToObject<PhoneContactType[]>(apiResponse.data, true);
							//console.log("contact.service.ts getContactList() contactList object: ", contactList);
							this.contacts = contactList;
							return resolve(contactList);
						}
						else {
							reject(methodName + " error: " + response);
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((error) => {
					console.log(error);
					return reject(methodName + ": ajax request failed.");
				});
		});
	}

	addContact(contact: PhoneContactType, accessToken: string): Promise<PhoneContactType> {
		return new Promise<PhoneContactType>((resolve, reject) => {
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload = {
				Name: contact.name,
				Email: contact.email,
				AvatarDataUri: contact.avatarDataUri
			};
			//console.log(contact.avatarDataUri);
			let url = `https://nofb.org/LNVApi/PhoneContact/CreatePhoneContact`;
			//let url = `http://localhost:18303/PhoneContact/CreatePhoneContact/`;
			this.jsHelperService.ajaxRequest("POST", url, payload, accessToken)
				.then((response) => {
					let result: PhoneContactType = this.jsHelperService.parseWebApiResponse<PhoneContactType>(response);
					//console.log('contactService.addContact():', response)
					if (this.jsHelperService.isEmpty(result) === false) {
						let contacts = this.contacts;
						contacts.push(result);
						this.contacts = contacts;
						return resolve(result);
					}
					else {
						let errors = this.jsHelperService.extractWebApiResponseErrorMessages(response);
						//reject("addContact: unable to parse webApiResponseType.");
						reject(errors);
					}
				})
				.catch((error) => {
					return reject("addContact: ajax request failed.");
				});
		});
	}

	addContacts(contacts: PhoneContactType[], accessToken: string): Observable<PhoneContactType> {
		return Observable.create((observer: Observer<PhoneContactType>) => {
			contacts.forEach((contact: PhoneContactType) => {
				this.addContact(contact, accessToken)
					.then((contact) => {
						let contacts = this.contacts;
						contacts.push(contact);
						this.contacts = contacts;
						console.log('contact added from addContacts()', contact)
						observer.next(contact)
					})
					.catch(error => {
						observer.error('contactservice.addContacts' + error)
					})
			})
		})
	}

	deleteContact(contact: PhoneContactType, accessToken: string): Promise<void> {
		let methodName = "deleteContact";
		return new Promise<void>((resolve, reject) => {
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let id = contact.phoneContactId;
			let payload = {
				Id: id
			};

			this.jsHelperService.ajaxRequest("POST", "https://nofb.org/LNVApi/PhoneContact/DeletePhoneContact", payload, accessToken)
				.then((response) => {
					console.log("contact.service.ts deleteContact() response: ", response);
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let index = this.contacts.findIndex((c: PhoneContactType) => {
								return c.phoneContactId == id;
							});
							//let index = this.contacts.indexOf(contact);
							//console.log("index: ", index);
							if (index > -1) {
								let contacts = this.contacts;
								contacts.splice(index, 1);
								this.contacts = contacts;
							}
							return resolve();
						}
						else {
							let errors = this.jsHelperService.jsonToObject<Array<string>>(apiResponse.data);
							reject(methodName + " errors:" + this.jsHelperService.implode("|", errors));
						}
					}
					else {
						reject(methodName + ": unable to parse webApiResponseType.");
					}
				})
				.catch((errors) => {
					return reject(methodName + ": " + this.jsHelperService.stringify(errors));
				});
		});
	}

	async updateContact(contact: PhoneContactType, accessToken: string): Promise<PhoneContactType> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(contact);
			console.log("payload: ", payload);
			//console.log("accessToken: ", accessToken);
			let url = `https://nofb.org/LNVApi/PhoneContact/UpdatePhoneContact`;
			//let url = `http://localhost:18303/PhoneContact/UpdatePhoneContact`;
			let dto: PhoneContactType = await this.jsHelperService.ajaxRequestParsed<PhoneContactType>("POST", url, payload, accessToken)
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	// this returns a datauri to display directly
	requestPhoneContactAvatarDataUri(email: string, accessToken: string): Promise<string> {
		let methodName = "requestPhoneContactAvatarDataUri";
		return new Promise<string>((resolve, reject) => {
			//TODO: implement
			let url: string = "https://nofb.org/LNVApi/PhoneContact/RequestPhoneContactAvatarDataUri";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Email: email
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) == false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result = apiResponse.data;
							return resolve(result);
						}
						else {
							let errors = this.jsHelperService.jsonToObject<Array<string>>(apiResponse.data);
							reject(methodName + " errors: " + this.jsHelperService.implode("| ", errors));
						}
					}
					else {
						let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
						reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
					}
				})
				.catch((error) => {
					//console.log(error);
					return reject(methodName + ": ajax request failed.");
				});
		});
	}

	// this returns the avatarfilename so you can display the avatar as a url
	requestPhoneContactAvatarFileName(email: string, accessToken: string): Promise<string> {
		let methodName = "requestPhoneContactAvatarFileName";
		return new Promise<string>((resolve, reject) => {
			//TODO: implement
			let url: string = "https://nofb.org/LNVApi/PhoneContact/RequestPhoneContactAvatarFileName";
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
							return resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
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

	// returns a list of emails:string
	getPhoneContactEmails(accessToken: string): Promise<Array<string>> {
		let methodName = "getPhoneContactEmails";
		return new Promise<Array<string>>((resolve, reject) => {
			//TODO: implement
			let url: string = "https://nofb.org/LNVApi/PhoneContact/GetPhoneContactEmails";
			let method = "GET";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result: Array<string> = this.jsHelperService.jsonToObject<Array<string>>(apiResponse.data, true);
							return resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
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

	// returns a single PhoneContactType
	getPhoneContact(phoneContactId: number, accessToken: string): Promise<PhoneContactType> {
		let methodName = "getPhoneContactEmails";
		return new Promise<PhoneContactType>((resolve, reject) => {
			//TODO: implement
			let url: string = "https://nofb.org/LNVApi/PhoneContact/GetPhoneContact";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Id: phoneContactId
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result: PhoneContactType = this.jsHelperService.jsonToObject<PhoneContactType>(apiResponse.data, true);
							return resolve(result);
						}
						else {
							let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
							reject(methodName + ": " + this.jsHelperService.implode(" |", errors));
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

	getUsersPhoneContactByEmail(email: string, accessToken: string): Promise<PhoneContactType> {
		let methodName = "getUsersPhoneContactByEmail";
		return new Promise<PhoneContactType>((resolve, reject) => {
			//TODO: implement
			let url: string = "https://nofb.org/LNVApi/PhoneContact/GetUsersPhoneContactByEmail/" + email + "/";
			let method = "GET";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = null;

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							if (this.jsHelperService.isEmpty(apiResponse.data) === false) {
								let result: PhoneContactType = this.jsHelperService.jsonToObject<PhoneContactType>(apiResponse.data, true);
								return resolve(result);
							}
							else {
								reject("not found");
							}
						}
						else {
							let errors = this.jsHelperService.extractWebApiResponseErrorMessages(response);
							reject(errors);
						}
					}
					else {
						reject("Invalid API response or empty API response");
					}
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	isExistingPhoneContact(email: string, accessToken: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			this.getUsersPhoneContactByEmail(email, accessToken)
				.then((phoneContact: PhoneContactType) => {
					resolve(this.jsHelperService.isEmpty(phoneContact));
				})
				.catch((error) => {
					resolve(false);
				})
		});
	}
}