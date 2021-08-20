import { Injectable } from '@angular/core';
import { ConfigService } from './index';
@Injectable()
export class LocalStorageService {
	constructor(
		private configService: ConfigService,
	) { }

	setPermanentItem(key: string, value: any): boolean {
		let data: string = JSON.stringify(value);

		if (window && window.localStorage) {
			//if (dontAlterKey !== true) {
			//	let email = window.localStorage.getItem("key" + this.configService.keyUserEmail);
			//	email = (email !== "undefined" && email !== null) ? email : "";
			//	key = "key" + email + key;
			//}

			window.localStorage.setItem(key, data);
			return true;
		}
		else {
			return false;
		}
	}

	setSessionItem(key: string, value: any): boolean {
		let data: string = JSON.stringify(value);
		//console.log("SET: " + key + ":" + data);
		if (window && window.sessionStorage) {
			//if (dontAlterKey !== true) {
			//	let email = window.localStorage.getItem("key" + this.configService.keyUserEmail);
			//	email = (email !== "undefined" && email !== null) ? email : "";
			//	key = "key" + email + key;
			//}
			window.sessionStorage.setItem(key, data);
			return true;
		}
		else {
			return false;
		}
	}

	getPermanentItem<T>(key: string): T {
		let json: string = "";

		if (window && window.localStorage) {
			//if (dontAlterKey !== true) {
			//	let email = window.localStorage.getItem("key" + this.configService.keyUserEmail);
			//	email = (email !== "undefined" && email !== null) ? email : "";
			//	key = "key" + email + key;
			//}
			json = window.localStorage.getItem(key);
		}

		if (json && json !== "") {
			let item: T = JSON.parse(json);
			return item;
		}
		else {
			return null;
		}
	}

	getSessionItem<T>(key: string): T {
		//console.log("getSessionItem key: ", key);
		let json: string = "";

		if (window && window.sessionStorage) {
			//if (dontAlterKey !== true) {
			//	let email = window.localStorage.getItem("key" + this.configService.keyUserEmail);
			//	email = (email !== "undefined" && email !== null) ? email : "";
			//	key = "key" + email + key;

			//	console.log("altered key: ", key);
			//}
			json = window.sessionStorage.getItem(key);
			//console.log("GET:" + key + ":" + json);
		}

		if (json && json !== "") {
			let item: T = JSON.parse(json);
			return item;
		}
		else {
			return null;
		}
	}

	removePermanentItem(key: string): boolean {
		if (window && window.localStorage) {
			//if (dontAlterKey !== true) {
			//	let email = window.localStorage.getItem("key" + this.configService.keyUserEmail);
			//	email = (email !== "undefined" && email !== null) ? email : "";
			//	key = "key" + email + key;
			//}
			window.localStorage.removeItem(key);
			return true;
		}
		else {
			return false;
		}
	}

	removeSessionItem(key: string): boolean {
		if (window && window.sessionStorage) {
			//if (dontAlterKey !== true) {
			//	let email = window.localStorage.getItem("key" + this.configService.keyUserEmail);
			//	email = (email !== "undefined" && email !== null) ? email : "";
			//	key = "key" + email + key;
			//}
			window.sessionStorage.removeItem(key);
			return true;
		}
		else {
			return false;
		}
	}

	removeAllPermanentItems(): boolean {
		if (window && window.localStorage) {
			window.localStorage.clear();
			return true;
		}
		else {
			return false;
		}
	}

	removeAllSessionItems(): boolean {
		if (window && window.sessionStorage) {
			window.sessionStorage.clear();
			return true;
		}
		else {
			return false;
		}
	}
}