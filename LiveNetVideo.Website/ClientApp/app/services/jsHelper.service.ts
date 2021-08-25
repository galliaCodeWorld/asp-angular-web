import {
	Injectable,
} from '@angular/core';

import * as moment from 'moment';
//import { JwtToken } from '../models/JwtToken';
import {
	SignalrHttpResponseType,
	JwtToken,
	WebApiResponseType,
	WebApiResponseStatusType,
	ParsedTokenType,
	PropertyTrackingEnum,
	PhoneLineType
} from '../models/index';

@Injectable()
export class JsHelperService {
	constructor(
	) { }

	generateKey(keyName: PushEncryptionKeyName, subscription: PushSubscription): string {
		let rawKey = subscription.getKey ? subscription.getKey(keyName) : null;
		return rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : '';
	}

	urlB64ToUint8Array(base64String: string): Uint8Array {
		const padding: string = '='.repeat((4 - base64String.length % 4) % 4);
		const base64: string = (base64String + padding)
			.replace(/\-/g, '+')
			.replace(/_/g, '/');

		const rawData: string = window.atob(base64);
		const outputArray: Uint8Array = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	toLocalTimeReviver = function (key, value) {
		return (typeof value === 'string' && moment(value, moment.ISO_8601, true).isValid())
			? moment.utc(value).local().toDate()
			: value;
	}

	//toLocalTime(date: Date): Date {
	//	return moment.utc(date).local().toDate();
	//}

	//objectDatesToLocalTime(obj: any): any {
	//	//console.log("obj: ", obj);
	//	for (let key in obj) {
	//		if (obj.hasOwnProperty(key) === true) {
	//			let value = obj[key];
	//			//console.log("key: ", key);
	//			//console.log("value: ", value);
	//			if (Object.prototype.toString.call(obj) === "[object Date]") {
	//				try {
	//					obj[key] = this.toLocalTime(value as Date);
	//				}
	//				catch (e) {
	//					console.log("unable to convert objectDatesToLocalTime: ", e);
	//				}
	//			}
	//		}
	//	}
	//	return obj;
	//}

	async delay(ms: number): Promise<void> {
		return new Promise<void>((resolve) => { setTimeout(resolve, ms); });
	}

	getMemberId(accessToken: string): string {
		let parsed = this.parseAccessToken(accessToken);
		//console.log("parsed: ", parsed);
		if (this.isEmpty(parsed)) {
			return "";
		}
		else {
			return parsed.netMemberID;
		}
	}

	parseAccessToken(accessToken: string): ParsedTokenType {
		try {
			let base64Url = accessToken.split('.')[1];
			let base64 = base64Url.replace('-', '+').replace('_', '/');
			return JSON.parse(window.atob(base64));
		}
		catch (e) {
			return null;
		}
	};

	toQueryString(body: Object): string {
		return Object
			.keys(body)
			.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`)
			.join('&')
	}

	stringify(obj: any): string {
		let result = "";
		let JsonStringifyReplacerCache = [];
		let JsonStringifyReplacer = function (key, value) {
			if (typeof value === 'object' && value !== null) {
				if (JsonStringifyReplacerCache.indexOf(value) !== -1) {
					// Circular reference found, discard key
					return;
				}
				// Store value in our collection
				JsonStringifyReplacerCache.push(value);
			}
			return value;
		};

		try {
			result = JSON.stringify(obj, JsonStringifyReplacer);
		}
		catch (e) {
			//console.log("error")
		}

		return result;
	}

	// pass in an object with key:value if you want to create key=value&key2=value2
	// pass in Array of strings ["value1", "value2"] with "/" seperator if you want value1/value2
	createQueryString(payload: any, seperator?: string): string {
		let data = null;
		let queryString = "";

		seperator = this.isEmpty(seperator) ? "&" : "/";

		let keyValuePairs = new Array();
		if (this.isEmpty(payload) === false && (typeof payload === "string")) {
			// payload is just a string
			queryString = encodeURI(payload);
		}
		//TODO: currently typescript has no support for FormData.keys() or FormData.getAll()
		//else if (self.isEmpty(payload) === false && payload instanceof FormData) {
		//	// most likely payload is new FormData()
		//	let formData = payload as FormData;
		//	//for (let key of formData.keys()) {
		//	//	for (let val of formData.getAll(key)) {
		//	//		keyValuePairs.push(key + "=" + val);
		//	//	}
		//	//}
		//	queryString = encodeURI(keyValuePairs.join("&"));
		//}
		else if (this.isEmpty(payload) === false && payload instanceof Array) {
			payload.forEach((item) => {
				if (this.isEmpty(item) === false && (typeof item === "string" || item instanceof String)) {
					keyValuePairs.push(item);
				}
				else if (this.isEmpty(item) === false && item instanceof Object) {
					for (let key in item) {
						if (item.hasOwnProperty(key)) {
							keyValuePairs.push(key + "=" + item[key]);
						}
					}
				}
			});
			queryString = encodeURI(keyValuePairs.join(seperator));
		}
		else if (this.isEmpty(payload) === false && payload instanceof Object) {
			for (let key in payload) {
				if (payload.hasOwnProperty(key)) {
					keyValuePairs.push(key + "=" + payload[key]);
				}
			}
			queryString = encodeURI(keyValuePairs.join(seperator));
		}

		return queryString;
	}

	isEmpty(obj: any): boolean {
		if (obj === 'undefined' || typeof obj === 'undefined' || obj === null || obj === "" || obj == 0 || obj === false || (Object.keys(obj).length === 0 && obj.constructor === Object) || (Array.isArray(obj) && obj.length === 0)) {
			return true;
		}
		else {
			return false;
		}
	}

	isValidEmail(email: string): boolean {
		let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	};

	ajaxRequest(method: string, url: string, payload: any, bearerToken: string): Promise<string> {
		//NOTE: the payload has to be formatted into a querystring in order for the WebApi to read the data.
		return new Promise<string>((resolve, reject) => {
			//console.log("payload: ", payload);
			let data: any = null;
			let queryString = "";
			if (typeof method === "undefined") {
				method = "GET"
			}
			else {
				method = method.toUpperCase();
			}
			// if the method is get, we append it to the url, if it's post we send it as data
			// either way we turn the payload into a query string
			let keyValuePairs = new Array();
			if (this.isEmpty(payload) === false && (typeof payload === "string")) {
				// payload is just a string
				//console.log("jsHelperService.ts ajaxRequest payload is string", payload);
				queryString = encodeURI(payload);
			}
			//TODO: currently typescript has no support for FormData.keys() or FormData.getAll()
			//else if (self.isEmpty(payload) === false && payload instanceof FormData) {
			//	// most likely payload is new FormData()
			//	let formData = payload as FormData;
			//	//for (let key of formData.keys()) {
			//	//	for (let val of formData.getAll(key)) {
			//	//		keyValuePairs.push(key + "=" + val);
			//	//	}
			//	//}
			//	queryString = encodeURI(keyValuePairs.join("&"));
			//}
			else if (this.isEmpty(payload) === false && payload instanceof Array) {
				//console.log("jsHelperService.ts ajaxRequest payload is array", payload);
				payload.forEach((item) => {
					if (this.isEmpty(item) === false && (typeof item === "string" || item instanceof String)) {
						keyValuePairs.push(item);
					}
					else if (this.isEmpty(item) === false && item instanceof Object) {
						for (let key in item) {
							if (item.hasOwnProperty(key)) {
								keyValuePairs.push(key + "=" + item[key]);
							}
						}
					}
				});
				queryString = encodeURI(keyValuePairs.join("&"));
			}
			else if (this.isEmpty(payload) === false && payload instanceof Object) {
				//console.log("jsHelperService.ts ajaxRequest payload is object", payload);
				for (let key in payload) {
					if (payload.hasOwnProperty(key)) {
						keyValuePairs.push(key + "=" + payload[key]);
					}
				}
				queryString = encodeURI(keyValuePairs.join("&"));
			}

			if (method === "GET") {
				if (url.slice(-1) !== "?") {
					url += "?";
				}
				url += queryString;

				if (url.slice(-1) !== "/") {
					url += "/";
				}
			}
			else if (method === "POST") {
				//data = queryString;
				if (('append' in payload)) {
					data = payload;
				}
				else if (this.isEmpty(payload) === false && payload instanceof Object) {
					data = this.stringify(payload);
					//console.log("jsHelper.service.ts data: ", data);
				}
			}

			//console.log("jsHelper.service.ts ajaxRequest queryString: ", queryString);

			//console.log("jsHelperService.ts do ajaxRequest [method, url, data]: ", method, url, data);

			let xhr = new XMLHttpRequest();
			xhr.timeout = 30000; // requests can last upto 30 seconds
			xhr.withCredentials = true;

			xhr.addEventListener("readystatechange", () => {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {
						resolve(xhr.responseText);
						//console.log(url + ": ajaxRequest complete (4)", xhr.responseText);
					}
					else {
						reject(xhr.responseText);
					}
				}
				else {
					//console.log(url + ": jsHelperService ajaxRequest this.readyState", xhr.readyState)
				}
			});

			//console.log("jsHelper.service.ts url: ", url);

			xhr.open(method, url);
			if (this.isEmpty(bearerToken) === false) {
				//console.log("jsHelper.service.ts ajaxRequest: " + url + ": " + bearerToken);
				xhr.setRequestHeader("authorization", "bearer " + bearerToken);
			}

			if (method === "POST") {
				//xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
				if (('append' in payload) === false) {
					xhr.setRequestHeader("content-type", "application/json");
				}
			}

			xhr.setRequestHeader("cache-control", "no-cache");
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.setRequestHeader("Access-Control-Allow-Origin", "*");

			//console.log("url: ", url);
			//console.log("data: ", data);

			xhr.send(data);
		});
	};

	ajaxRequestParsed<T>(method: string, url: string, payload: any, bearerToken: string, debug?: boolean): Promise<T> {
		try {
			return new Promise<T>((resolve, reject) => {
				let data: any = null;
				let queryString = "";
				if (typeof method === "undefined") {
					method = "GET"
				}
				else {
					method = method.toUpperCase();
				}
				// if the method is get, we append it to the url, if it's post we send it as data
				// either way we turn the payload into a query string
				let keyValuePairs = new Array();
				if (this.isEmpty(payload) === false && (typeof payload === "string")) {
					// payload is just a string
					queryString = encodeURI(payload);
				}
				//TODO: currently typescript has no support for FormData.keys() or FormData.getAll()
				//else if (self.isEmpty(payload) === false && payload instanceof FormData) {
				//	// most likely payload is new FormData()
				//	let formData = payload as FormData;
				//	//for (let key of formData.keys()) {
				//	//	for (let val of formData.getAll(key)) {
				//	//		keyValuePairs.push(key + "=" + val);
				//	//	}
				//	//}
				//	queryString = encodeURI(keyValuePairs.join("&"));
				//}
				else if (this.isEmpty(payload) === false && payload instanceof Array) {
					payload.forEach((item) => {
						if (this.isEmpty(item) === false && (typeof item === "string" || item instanceof String)) {
							keyValuePairs.push(item);
						}
						else if (this.isEmpty(item) === false && item instanceof Object) {
							for (let key in item) {
								if (item.hasOwnProperty(key)) {
									keyValuePairs.push(key + "=" + item[key]);
								}
							}
						}
					});
					queryString = encodeURI(keyValuePairs.join("&"));
				}
				else if (this.isEmpty(payload) === false && payload instanceof Object) {
					for (let key in payload) {
						if (payload.hasOwnProperty(key)) {
							keyValuePairs.push(key + "=" + payload[key]);
						}
					}
					queryString = encodeURI(keyValuePairs.join("&"));
				}

				if (method === "GET") {
					if (url.slice(-1) !== "?") {
						url += "?";
					}
					url += queryString;

					if (url.slice(-1) !== "/") {
						url += "/";
					}
				}
				else if (method === "POST") {
					if (('append' in payload)) {
						data = payload;
					}
					else if (this.isEmpty(payload) === false && payload instanceof Object) {
						data = this.stringify(payload);
					}
				}

				let xhr = new XMLHttpRequest();
				xhr.timeout = 30000; // requests can last upto 30 seconds
				xhr.withCredentials = true;

				xhr.addEventListener("readystatechange", () => {
					if (xhr.readyState === 4) {
						if (xhr.status === 200) {
							if (typeof debug !== "undefined" && debug === true) {
								console.log("xhr Response: ", xhr.responseText);
							}

							this.parseWebApiResponseAsync<T>(xhr.responseText, debug)
								.then((dto: T) => {
									if (typeof debug !== "undefined" && debug === true) {
										console.log("ajaxrequest resolve dto: ", dto);
									}
									resolve(dto);
								})
								.catch((error) => {
									reject(error);
								})
						}
						else {
							reject(xhr.responseText);
						}
					}
					else {
						//console.log(url + ": jsHelperService ajaxRequest this.readyState", xhr.readyState)
					}
				});

				xhr.open(method, url);
				if (this.isEmpty(bearerToken) === false) {
					xhr.setRequestHeader("authorization", "bearer " + bearerToken);
				}

				if (method === "POST") {
					//xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
					if (('append' in payload) === false) {
						xhr.setRequestHeader("content-type", "application/json");
					}
				}

				xhr.setRequestHeader("cache-control", "no-cache");
				xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				xhr.setRequestHeader("Access-Control-Allow-Origin", "*");

				xhr.send(data);
			});
		}
		catch (e) {
			throw (e);
		}
	};

	base64Encode(data: string): string {
		return btoa(data);
	};

	base64Decode(data: string): string {
		return atob(data);
	};

	isDomElement(obj: any): boolean {
		if (obj instanceof Node) {
			return (obj && (typeof obj === "object") && (typeof obj.nodeType === "number") && (typeof obj.nodeName === "string"));
		}
		else if (obj instanceof HTMLElement) {
			return (obj && (typeof obj === "object") && (obj !== null) && (obj.nodeType === 1) && (typeof obj.nodeName === "string"));
		}
		else {
			return false;
		}
	};

	tryParseJson = (json: string, reviver?: any): any => {
		//console.log("parseing json: ", json);
		try {
			let obj = this.isEmpty(reviver) ? JSON.parse(json) : JSON.parse(json, reviver);
			return obj;
		}
		catch (error) {
			//console.log("json parse errro: ", error);
			return null;
		}
	}

	// TODO: need to be able to map json properties to T properties, currently T properties have to match json properties
	// also note that sub objects that are strings do not get turned into json objects, basically T doesn't work as intended, but only
	// used for type checking purposes only.
	//NOTE: if toCamel value is true, this class will rename all properties for generic T to lowerCamelCase
	jsonToObject<T>(json: string, toCamel?: boolean, reviver?: any): T {
		//NOTE: T has to have exact same property names as the json object

		try {
			let obj: T;
			//console.log("json: ", json);
			//console.log("toCamel: ", toCamel);
			//console.log("reviver: ", reviver);
			if (this.isEmpty(toCamel) === false) {
				let tempObj: object = this.isEmpty(reviver) ? JSON.parse(json) : JSON.parse(json, reviver);
				//console.log("tempObj: ", tempObj);
				let result: any = this.objectPropertiesToCamel(tempObj);
				let phoneLineId = result["PhoneLineId"] && result["PhoneLineId"];
				//console.log("result: ", phoneLineId);
				obj = result as T;
			}
			else {
				let result = this.isEmpty(reviver) ? JSON.parse(json) : JSON.parse(json, reviver);
				obj = result as T;
			}

			return obj;
		}
		catch (error) {
			//console.log("json parse errro: ", error);
			return null;
		}
	}

	// NOTE: use this convenience method when you expect a array of objects or object from the webapi server
	parseWebApiResponse<T>(json: string): T {
		let apiResponse: WebApiResponseType = this.jsonToObject<WebApiResponseType>(json, true);

		let expectedData: T;

		//console.log("inside parseWebApiResponse apiResponse: ", apiResponse.data);
		if (this.isEmpty(apiResponse) === false) {
			if (apiResponse.status === WebApiResponseStatusType.success) {
				if (typeof apiResponse.data === "string") {
					expectedData = this.jsonToObject<T>(apiResponse.data, true, this.toLocalTimeReviver);
					//console.log("exptedData: ", expectedData);

					return expectedData;
				}
				else {
					//console.log("apiResponse.data: ", apiResponse.data);
					return apiResponse.data as T;
				}
			}
			else {
				return null;
			}
		}
		else {
			return null;
		}
	}

	parseWebApiResponseAsync<T>(data: string, debug?: boolean): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			let apiResponse: WebApiResponseType = this.jsonToObject<WebApiResponseType>(data, true);
			if (typeof debug !== "undefined" && debug === true) {
				console.log("parseWebApiResponseAsync apiResponse: ", apiResponse);
			}

			if (this.isEmpty(apiResponse) === false) {
				if (apiResponse.status === WebApiResponseStatusType.success) {
					let dto: T = this.jsonToObject<T>(apiResponse.data, true, this.toLocalTimeReviver);
					if (typeof debug !== "undefined" && debug === true) {
						console.log("jsonToObject dto: ", dto);
					}

					resolve(dto);
				}
				else {
					reject(apiResponse.data);
					//resolve(null);
				}
			}
			else {
				reject("Unable to handle server response");
			}
		})
	}

	extractWebApiResponseErrorMessages(json: string): Array<string> {
		let errorMessages = new Array<string>();
		let apiResponse: WebApiResponseType = this.jsonToObject<WebApiResponseType>(json, true);
		let errors: Array<string> = this.jsonToObject<Array<string>>(apiResponse.data);
		if (this.isEmpty(errors) === false) {
			errorMessages = errors;
		}
		return errorMessages;
	}

	//// NOTE: use this convenience method when you expect the webApi response data to be string
	//parseWebApiResponseAsString(json: string): string {
	//	let apiResponse: WebApiResponseType = this.jsonToObject<WebApiResponseType>(json, true);

	//	//console.log("inside parseWebApiResponse apiResponse: ", apiResponse);
	//	if (this.isEmpty(apiResponse) === false && apiResponse.status === WebApiResponseStatusType.success) {
	//		return apiResponse.data;
	//	}
	//	else {
	//		return "";
	//	}
	//}

	//// NOTE: use this convenience method when you expect the webApi response data to be a boolean value
	//parseWebApiResponseAsBoolean(json: string): boolean {
	//	let apiResponse: WebApiResponseType = this.jsonToObject<WebApiResponseType>(json, true);

	//	//console.log("inside parseWebApiResponse apiResponse: ", apiResponse);
	//	if (this.isEmpty(apiResponse) === false && apiResponse.status === WebApiResponseStatusType.success) {
	//		return apiResponse.data === "true" ? true : false;
	//	}
	//	else {
	//		return null;
	//	}
	//}

	//NOTE: parseHttpResponseMessage has changed to parseSignalrResponse
	parseSignalrResponse(response: string): SignalrHttpResponseType {
		// NOTE: returns an httpResponseMessage object
		try {
			let isValid = true;

			let obj: SignalrHttpResponseType = this.jsonToObject<SignalrHttpResponseType>(response, true, this.toLocalTimeReviver);
			//console.log("parseSignalrResponse obj: ", obj);
			return obj;
		}
		catch (error) {
			console.log("parseSignalrResponse error: ", error);
			return null;
		}
	}

	createHash(key: string): string {
		let self: JsHelperService = this;
		// TODO: need to generate secret using algorithm, server will use same algorithm to
		// decipher the secret. Time should be used in the algorithm so the secret
		// is only good for 3 seconds.

		let stamp = new Date().getTime();
		//console.log("stamp: ", stamp);
		let seconds = String(Math.floor(stamp / 1000));
		//console.log("seconds: ", seconds);
		let secret = self.base64Encode(key);
		//console.log("secret: ", key);
		let time = self.base64Encode(seconds);
		//console.log("time: ", time);

		//var generatedSecret = encodeURIComponent(this.base64Encode(this.implode("|", { secret, time })));
		let pieces = [secret, time];
		//console.log("pieces: ", pieces);
		//var value = this.implode("|", { secret, time });
		let value = self.implode("|", pieces);
		//console.log("value: ", value);
		let generatedSecret = self.base64Encode(value);

		return generatedSecret;
	}

	//implode = (glue: string, pieces: string[]) => {
	//	return implode(glue, pieces);
	//}

	//recursive
	// first letter lowercase
	objectPropertiesToCamel(obj: any): any {
		//let debug = false;
		//if ('PhoneLineGuid' in obj) {
		//	debug = true;
		//}

		//console.log("obj: ", obj);

		for (let key in obj) {
			//if (debug) {
			//	console.log("key: ", key);
			//}

			if (obj.hasOwnProperty(key) === true) {
				let value = obj[key];
				if (typeof value === 'object') {
					let subObj: object = this.objectPropertiesToCamel(obj[key]);
					value = subObj;
				}

				//convert the key to lowerCamelCase
				let camelKey = key.charAt(0).toLowerCase() + key.slice(1);
				//if (debug) {
				//	console.log("camelKey: ", camelKey, value);
				//}

				delete obj[key];
				obj[camelKey] = value;
			}
		}
		//console.log("objectPropertiesToCamel: ", obj);
		return obj;
	}

	//recursive
	// NOTE: first letter uppercase
	objectPropertiesToPascal(obj: any): any {
		for (let key in obj) {
			if (obj.hasOwnProperty(key) === true) {
				let value = obj[key];
				if (typeof value === 'object') {
					let subObj: object = this.objectPropertiesToPascal(obj[key]);
					value = subObj;
				}

				//convert the key to pascalCase
				let pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
				delete obj[key];
				obj[pascalKey] = value;
			}
		}
		return obj;
	}

	formatWebApiPayload(obj: any): any {
		return this.removeNullProperties(this.objectPropertiesToPascal(obj));
	}

	removeNullProperties(obj: any): any {
		for (let key in obj) {
			if (obj.hasOwnProperty(key) === true) {
				let value = obj[key];
				if (typeof value === 'object') {
					let subObj: object = this.removeNullProperties(obj[key]);
					value = subObj;
				}

				//delete any properties with null value
				if (value === null) {
					delete obj[key];
				}
			}
		}
		return obj;
	}

	implode(glue: string, pieces: string[]): string {
		//  discuss at: http://phpjs.org/functions/implode/
		// original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// improved by: Waldo Malqui Silva (http://waldo.malqui.info)
		// improved by: Itsacon (http://www.itsacon.net/)
		// bugfixed by: Brett Zamir (http://brett-zamir.me)
		//   example 1: implode(' ', ['Kevin', 'van', 'Zonneveld']);
		//   returns 1: 'Kevin van Zonneveld'
		//   example 2: implode(' ', {first:'Kevin', last: 'van Zonneveld'});
		//   returns 2: 'Kevin van Zonneveld'

		let piece: string = '';
		let retVal: string = '';
		let tGlue: string = '';

		if (arguments.length === 1) {
			retVal = glue;
			glue = '';
		}
		if (typeof pieces === 'object') {
			if (Object.prototype.toString.call(pieces) === '[object Array]') {
				return pieces.join(glue);
			}
			for (piece in pieces) {
				retVal += tGlue + pieces[piece];
				tGlue = glue;
			}
		}
		else if (typeof pieces === 'string') {
			return pieces;
		}
		return retVal;
	};

	setCookie(name, value, expireDays): boolean {
		var self = this;

		if (typeof value !== "string") {
			value = self.stringify(value);
		}

		// check to make sure value and name does not contain ";",
		// do not set the cookie if its name or value
		// has a ";" in it

		var valid = true;
		if (self.isEmpty(name) || typeof name !== 'string' || name.indexOf(';') >= 0) {
			valid = false;
		}

		if (typeof value !== 'string' || value.indexOf(';') >= 0) {
			valid = false;
		}

		if (valid) {
			var d = new Date();
			d.setTime(d.getTime() + (expireDays * 24 * 60 * 60 * 1000));
			var expires = "expires=" + d.toUTCString();
			document.cookie = name + "=" + value + ";" + expires + ";path=/";

			return true;
		}
		else {
			//reject("Make sure the cookie name and value does not contain a ';' in it.")
			return false;
		}
	}

	getCookie(cname): string {
		//console.log("getting cookie: ", cname);
		var name = cname + "=";
		//console.log("name: ", name);
		var decodedCookie = decodeURIComponent(document.cookie);
		//console.log("decodedCookie: ", decodedCookie);
		var ca = decodedCookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) === ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) === 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	sanitizeEmail(email: string): string {
		return this.isEmpty(email) ? "" : email.trim().toLowerCase();
	}

	// inserts a component into a ViewContainerRef
	//insertComponent<T>(componentInsert: ViewContainerRef, component: Type<T>): ComponentRef<T> {
	//	let factory = this.componentFactoryResolver.resolveComponentFactory<T>(component);
	//	let componentRef: ComponentRef<T> = componentInsert.createComponent(factory);
	//	return componentRef;
	//}

	dataUriToBlob(dataUri: string): Blob {
		if (this.isEmpty(dataUri) === false) {
			let arr = dataUri.split(','), mime = arr[0].match(/:(.*?);/)[1],
				bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
			while (n--) {
				u8arr[n] = bstr.charCodeAt(n);
			}
			return new Blob([u8arr], { type: mime });
		}
		else {
			return null;
		}
	}

	//**blob to dataURL**
	blobToDataUri(blob: Blob): Promise<string> {
		return new Promise<string>((resolve) => {
			if (this.isEmpty(blob) === false) {
				let reader = new FileReader();
				reader.addEventListener("load", () => {
					let result = reader.result as string;
					resolve(result);
				}, false);
				reader.readAsDataURL(blob);
			}
			else {
				resolve("");
			}
		})
	}

	trackArrayProperty<T>(property: Array<T>, dto: T, idField: string, trackingType: PropertyTrackingEnum): void {
		if (this.isEmpty(dto) === false && dto.hasOwnProperty(idField) === true) {
			if (this.isEmpty(property)) {
				property = new Array<T>();
			}
			// find index of record in array

			let index = property.findIndex((item: T) => {
				return item[idField] == dto[idField];
			});

			if (trackingType == PropertyTrackingEnum.delete) {
				if (index > -1) {
					// exists in array, so remove it from array
					property.splice(index, 1);
				}
				else {
					// does not exist in array, nothing to remove
				}
			}
			else if (trackingType == PropertyTrackingEnum.update || trackingType == PropertyTrackingEnum.create) {
				if (index > -1) {
					// exists in array, so replace it in the array
					property[index] = dto;
				}
				else {
					// does not exist in array, so add it to the array
					property.push(dto);
				}
			}
			else {
				// do nothing
			}
		}
		else {
			// nothing to track
		}
	}

	nameof<T>(key: keyof T, instance?: T): keyof T {
		return key;
	}

	isExpiredToken(jwtToken: JwtToken, timeDifference?: number): boolean {
		// NOTE: timeDifference is in seconds
		if (this.isEmpty(timeDifference)) {
			timeDifference = 30;
		}
		let isExpired = true;
		if (!this.isEmpty(jwtToken)) {
			let expiredString = jwtToken[".expires"];
			if (!this.isEmpty(expiredString)) {
				let now = new Date();
				let expire = new Date(expiredString);

				let expireTime = Math.abs(expire.getTime() / 1000);
				let nowTime = Math.abs(now.getTime() / 1000);

				let diffSeconds = expireTime - nowTime;

				//console.log("signalr.service.ts isExpiredToken() " + jwtToken.refresh_token + ": diffSeconds: ", diffSeconds);

				//console.log("diffSeconds: ", diffSeconds);
				//var timeDiff = Math.abs(expire.getTime() - now.getTime());
				//var diffSeconds = Math.ceil(timeDiff / (1000));
				if (diffSeconds > timeDifference) {
					isExpired = false;
				}
			}
		}

		return isExpired;
	}
}