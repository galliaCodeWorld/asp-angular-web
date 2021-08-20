import { Injectable } from '@angular/core';
//import { Http, URLSearchParams, Headers, RequestOptions } from '@angular/http';
//import 'rxjs/add/operator/map';
//import { ThirdPartyFiles } from '../services/thirdpartyFiles';
//import { Push, PushNotification, Device } from 'ionic-native';
//import { PushNotification } from 'phonegap-plugin-push';
//import { Platform } from 'ionic-angular';
//import { Push, PushObject, PushOptions } from '@ionic-native/push';
//import { Device } from '@ionic-native/device';

import {
	ConfigService,
	LocalStorageService,
	JsHelperService
} from "./index";
import {
	MemberType,
	WebApiResponseType,
	WebApiResponseStatusType,
	PushSubscriptionType,
	PushProviderType,
	UnsubscribePushNotificationDto,
	GetPushIdDto
} from '../models/index';

@Injectable()
export class PushService {
	constructor(
		public configService: ConfigService,
		public storageService: LocalStorageService,
		public jsHelperService: JsHelperService
	) { }

	// #region variables

	email: string;
	accessToken: string;

	get pushId(): string {
		let key = this.configService.keyPushId;
		return this.storageService.getPermanentItem<string>(key);
	}
	set pushId(value: string) {
		let key = this.configService.keyPushId;
		this.storageService.setPermanentItem(key, value);
	}

	_pushNotification: any;
	get pushNotificationInstance(): any {
		// returns an instance of pushNotification to the client code
		// client code will use the instance to listen for push notifications
		// push.on('notification', function (data) {
		//    //handle incoming push notification while in foreground
		//    alert(data.message);
		//});
		return this._pushNotification;
	}

	set pushNotificationInstance(value: any) {
		this._pushNotification = value;
	}

	// #endregion

	// #region multi-browser code

	async startPushNotifications(email: string, accessToken: string): Promise<void> {
		try {
			// entry point to start push notification service, email of user, and accesstoken required
			this.email = email;
			this.accessToken = accessToken;

			if ('safari' in window && 'pushNotification' in window["safari"]) {
				console.log("starting safari push");
				await this.startSafariPush();
				return;
			}
			else {
				console.log("starting webpush");
				await this.startWebPush();
				return;
			}
		}
		catch (e) {
			throw (e);
		}
	}

	unsubscribePushNotification(unpush: UnsubscribePushNotificationDto, accessToken: string): Promise<PushSubscriptionType> {
		let methodName = "unsubscribePushNotification";
		return new Promise<PushSubscriptionType>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Notification/UnSubscribeLvcPushNotification";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Email: unpush.email,
				Token: unpush.token,
				ServiceProviderName: unpush.serviceProviderName,
				applicationName: unpush.applicationName
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result: PushSubscriptionType = this.jsHelperService.jsonToObject<PushSubscriptionType>(apiResponse.data, true);
							return resolve(result);
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
					return reject(methodName + ": ajax request failed.");
				});
		});
	}

	getPushId(getPushIdDto: GetPushIdDto, accessToken: string): Promise<PushSubscriptionType> {
		// used to retrieve a pushsubscription
		let methodName = "getPushId";
		return new Promise<PushSubscriptionType>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Notification/GetPushId";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
			let payload: any = {
				Email: getPushIdDto.email,
				ServiceProviderName: getPushIdDto.serviceProviderName,
				applicationName: getPushIdDto.applicationName
			}

			this.jsHelperService.ajaxRequest(method, url, payload, accessToken)
				.then((response) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
					if (this.jsHelperService.isEmpty(apiResponse) === false) {
						if (apiResponse.status === WebApiResponseStatusType.success) {
							let result: PushSubscriptionType = this.jsHelperService.jsonToObject<PushSubscriptionType>(apiResponse.data, true);
							return resolve(result);
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
					return reject(methodName + ": ajax request failed.");
				});
		});
	}

	getMyEmail(accessToken: string = ""): Promise<string> {
		// get the email associated with the push scription
		return new Promise<string>((resolve, reject) => {
			let url: string = "https://nofb.org/LNVApi/Notification/GetMyEmail";
			let payload: object = {
			};

			//accessToken = this.jsHelperService.isEmpty(accessToken) === false ? accessToken : this.signalrService.jwtToken.access_token;

			this.jsHelperService.ajaxRequest("POST", url, payload, accessToken)
				.then((apiResponseJson: string) => {
					let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(apiResponseJson, true);
					//console.log("apiResponse: ", apiResponse);
					//console.log("apiResonse status: ", apiResponse.status);
					if (this.jsHelperService.isEmpty(apiResponse) === false && apiResponse.status === WebApiResponseStatusType.success) {
						let email: string = apiResponse.data;
						//console.log("email: ", email);
						resolve(email);
					}
					else {
						reject("getMyEmail: unable to parse WebApiResponseType" + apiResponseJson);
					}
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	// #endregion

	// #region Safari

	safariDeviceToken: string;
	private async startSafariPush(): Promise<void> {
		console.log("starting safari push");
		try {
			let permissionData = window["safari"].pushNotification.permission(this.configService.safariPushId);
			await this.tryGetDeviceToken(permissionData);

			return;
		}
		catch (e) {
			throw (e);
		}
	}

	// method for safari only, this is a recursive method
	private async tryGetDeviceToken(permissionData: any): Promise<void> {
		try {
			console.log("checking remote permission: ", permissionData);

			//console.log("window: ", window);
			if (permissionData.permission === 'default') {
				// This is a new web service URL and its validity is unknown.
				console.log("safari permission default");
				let api = this.configService.webApiBase.slice(0, -1);
				let pushId = this.configService.safariPushId;

				console.log("api: ", api);
				console.log("pushId: ", pushId);

				window["safari"].pushNotification.requestPermission(
					api, // The web service URL, slice to remove the trailing slash.
					pushId,     // The Website Push ID.
					{}, // Data that you choose to send to your server to help you identify the user.
					this.tryGetDeviceToken.bind(this)         // The callback function.
				);
			}
			else if (permissionData.permission === 'denied') {
				// The user said no.
				console.log("safari permission denied");
			}
			else if (permissionData.permission === 'granted') {
				// The web service URL is a valid push provider, and the user said yes.
				// permissionData.deviceToken is now available to use.
				console.log("safari granted deviceToken: ", permissionData.deviceToken);
				let pushSubscription: PushSubscriptionType = await this.saveSafariSubscription(permissionData.deviceToken, this.email, this.accessToken);

				console.log("got pushSubscription:", pushSubscription);
			}
			else {
				console.log("no permissionData");
			}
		}
		catch (e) {
			throw (e);
		}
	}

	private async saveSafariSubscription(deviceToken: string, email: string, accessToken: string): Promise<PushSubscriptionType> {
		try {
			console.log("saving safari push");
			let url: string = "https://nofb.org/LNVApi/Notification/SubscribeLvcPushNotification";
			let method: string = "POST";

			let serviceProviderName: string = PushProviderType.apns;
			let endPoint: string = deviceToken;
			let userKey: string = deviceToken;
			let authKey: string = deviceToken;
			var payload = {
				Token: endPoint,
				Email: email,
				UserKey: userKey,
				AuthKey: authKey,
				ServiceProviderName: serviceProviderName,
				ApplicationName: this.configService.pushApplicationName,
				RequiresHub: this.configService.requiresHub
			};

			console.log("payload: ", payload);

			let response: string = await this.jsHelperService.ajaxRequest(method, url, payload, accessToken);

			console.log("pushService.subscribePushNotification response:", response);

			if (this.jsHelperService.isEmpty(response)) {
				throw ("Empty response from server.");
			}

			let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);

			if (this.jsHelperService.isEmpty(apiResponse)) {
				throw ("Unable to parse Web Api Response Type");
			}

			if (apiResponse.status === WebApiResponseStatusType.success) {
				let result: PushSubscriptionType = this.jsHelperService.jsonToObject<PushSubscriptionType>(apiResponse.data, true);
				return result;
			}
			else {
				let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
				throw (this.jsHelperService.implode(" |", errors));
			}
		}
		catch (e) {
			throw (e);
		}
	}

	// #endregion

	// #region Web Push

	private async startWebPush(): Promise<void> {
		try {
			let serviceWorkerRegistration: ServiceWorkerRegistration = await this.registerServiceWorker();

			// NOTE: navigator.serviceWorker.ready is not being used. we are not waiting for ServiceWorkerRegistration to be ready
			// infact it never resolves after .ready attribute is called. It just waits indefinitely

			//await this.initPushService();

			console.log("service worker registered: ", serviceWorkerRegistration);
			let pushSubscription: PushSubscription = await this.subscribeWebPushSubscription(serviceWorkerRegistration, this.accessToken);
			let subscription: PushSubscriptionType = await this.saveWebPushSubscription(pushSubscription, this.email, this.accessToken);
			return;
		}
		catch (e) {
			throw (e);
		}
	}

	async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
		try {
			if ('serviceWorker' in navigator) {
				console.log("registering serviceworker");
				//navigator.serviceWorker.register('assets/service-worker.js', { scope: '/assets/' })
				let registration: ServiceWorkerRegistration = await navigator.serviceWorker.register('service-worker.js');
				console.log("got registration: ", registration);
				return this.jsHelperService.isEmpty(registration) ? null : registration;
			}
			else {
				//console.log("serviceWorker not in navigator");
				return null;
			}
		}
		catch (e) {
			throw (e);
		}
	}

	async initPushService(): Promise<ServiceWorkerRegistration> {
		// start the push service by first getting the push registration id
		// then later when the user logs in or is logged in, we will register the push registration id
		// along with their email to receive push and send push messages
		// note peer to peer messages should be send directly using our own signalr service.
		// push service should only be used when the app is in the background.
		return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
			// NOTE: navigator.serviceWorker.ready waits indefinitely until it resolves
			// NOTE: currently navigator.serviceWorker.ready never resolves

			console.log("initPushService")
			navigator.serviceWorker.ready
				.then((registration: ServiceWorkerRegistration) => {
					console.log("initPushService resolve registration:", registration);
					resolve(registration);
				})

			// HACK: will resolve after half a second regardless of ready;
			setTimeout(() => { resolve(null); }, 500);
			//.catch((e) => {
			//	console.log("initPushService reject error: ", e);
			//	reject(e);
			//});
		});
	}

	async subscribeWebPushSubscription(registration: ServiceWorkerRegistration, accessToken: string): Promise<PushSubscription> {
		console.log("subscribing to webpush");
		console.log("subscribeWebPushSubscription registration param: ", registration);
		try {
			let subscription: PushSubscription = await registration.pushManager.getSubscription();
			if (subscription) {
				//TODO: check how old the subscription is, if too old, then unscribe and get new subscription
				//if (subscription.expirationTime && Date.now() > subscription.expirationTime - 432000000) {}

				console.log("got subscription: ", subscription);
				return subscription;
			}
			else {
				let vapidPublicKey = await this.requestVapidPublicKey(accessToken);
				if (this.jsHelperService.isEmpty(vapidPublicKey)) {
					throw ("Unable to get public key.");
				}

				let key: Uint8Array = this.jsHelperService.urlB64ToUint8Array(vapidPublicKey);
				return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
			}
		}
		catch (e) {
			throw (e);
		}
	}

	async saveWebPushSubscription(subscription: PushSubscription, email: string, accessToken: string): Promise<PushSubscriptionType> {
		try {
			console.log("saving webpush");
			let url: string = "https://nofb.org/LNVApi/Notification/SubscribeLvcPushNotification";
			let method: string = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;

			let serviceProviderName: string = PushProviderType.fcm; //"FCM";
			let endPoint: string = subscription.endpoint;
			let userKey: string = this.jsHelperService.generateKey('p256dh', subscription);
			let authKey: string = this.jsHelperService.generateKey('auth', subscription);
			var payload = {
				Token: endPoint,
				Email: email,
				UserKey: userKey,
				AuthKey: authKey,
				ServiceProviderName: serviceProviderName,
				ApplicationName: this.configService.pushApplicationName,
				RequiresHub: this.configService.requiresHub
			};

			console.log("payload: ", payload);

			let response: string = await this.jsHelperService.ajaxRequest(method, url, payload, accessToken);

			console.log("pushService.subscribePushNotification response:", response);

			if (this.jsHelperService.isEmpty(response)) {
				throw ("Empty response from server.");
			}

			let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);

			if (this.jsHelperService.isEmpty(apiResponse)) {
				throw ("Unable to parse Web Api Response Type");
			}

			if (apiResponse.status === WebApiResponseStatusType.success) {
				let result: PushSubscriptionType = this.jsHelperService.jsonToObject<PushSubscriptionType>(apiResponse.data, true);
				return result;
			}
			else {
				let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
				throw (this.jsHelperService.implode(" |", errors));
			}
		}
		catch (e) {
			throw (e);
		}
	}

	async requestVapidPublicKey(accessToken: string): Promise<string> {
		try {
			//NOTE: the key returned needs to be turned into Uint8Array

			//return this.configService.VAPID;

			console.log("saving webpush");
			let url: string = "https://nofb.org/LNVApi/Notification/GetVapidKey";
			let method: string = "GET";

			let response: string = await this.jsHelperService.ajaxRequest(method, url, null, accessToken);

			console.log("got VAPID Key: ", response);

			if (this.jsHelperService.isEmpty(response)) {
				throw ("Empty response from server.");
			}

			let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);

			if (this.jsHelperService.isEmpty(apiResponse)) {
				throw ("Unable to parse Web Api Response Type");
			}

			if (apiResponse.status === WebApiResponseStatusType.success) {
				let vapidPublicKey: string = apiResponse.data;
				return vapidPublicKey;
			}
			else {
				let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
				throw (this.jsHelperService.implode(" |", errors));
			}
		}
		catch (e) {
			throw (e);
		}
	}

	async hasPermission(): Promise<NotificationPermission> {
		// check to seee if user has given push notification permission
		console.log("checking permission");
		try {
			let permission: NotificationPermission = await Notification.requestPermission();
			return permission;
		}
		catch (e) {
			throw (e);
		}
	}

	// #endregion

	/*
   //// TODO: consolidate registerPushId and subscribePushNotification into subscribePushNotification

   //// use this method to register the pushId, this method requires the pushId and the users email
   //// it will get the email from localStorage of member profile., and the pushId property on this class has to be set before
   //// calling this method
   //// AKA: subScribeLvcPushNotification
   //registerPushId(accessToken?: string): Promise<PushSubscriptionType> {
   //	accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;
   //	return new Promise<PushSubscriptionType>((resolve, reject) => {
   //		this.localStorageService.getItem(this.configService.memberProfile)
   //			.then((member: MemberType) => {
   //				//console.log("got existing member profile jsonStr: ", jsonStr);

   //				let serviceProviderName = PushProviderType.fcm; //"FCM";
   //				if (this.platform === "iOS" || this.platform === "OSX") {
   //					serviceProviderName = PushProviderType.apns; //"APNS";
   //				}
   //				else if (this.platform === "Windows") {
   //					serviceProviderName = PushProviderType.wns; //"WNS";
   //				}

   //				var url = this.configService.subscribePushNotificationEndPoint;
   //				var payload = {
   //					Token: this.pushId,
   //					Email: member.email,
   //					ServiceProviderName: serviceProviderName,
   //					ApplicationName: this.configService.pushApplicationName,
   //					RequiresHub: false
   //				};

   //				var method = "POST";

   //				//console.log("before ajaxRequest LvcPushNotificationSubscriptin [method, url, payload]: ", method, url, payload);
   //				this.jsHelperService.ajaxRequest(method, url, payload, this.signalrService.jwtToken.access_token)
   //					.then((apiResponseJson: string) => {
   //						let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(apiResponseJson, true);
   //						if (this.jsHelperService.isEmpty(apiResponse) === false) {
   //							if (apiResponse.status === WebApiResponseStatusType.success) {
   //								let pushSubscription: PushSubscriptionType = this.jsHelperService.jsonToObject<PushSubscriptionType>(apiResponse.data);
   //								//after you get the pushSubscription from this promise, you should store it.
   //								resolve(pushSubscription);
   //							}
   //							else {
   //								let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
   //								reject(this.jsHelperService.implode(" |", errors));
   //							}
   //						}
   //						else {
   //							reject("unable to decipher push subscription");
   //						}
   //						//resolve(data);
   //					})
   //					.catch((error) => {
   //						//console.log("unable to register for push: ", error);
   //						reject(error);
   //					});
   //			})
   //			.catch(function (error) {
   //				//console.log("localStorage retrieve member profile error: ", error);
   //				reject(error);
   //			});
   //	});
   //}
   */

	/*
	// this method requires the app to set the profile property and the pushId property before calling it.
	// it will use the member.profile.email, and its own pushId property
	async subscribePushNotification(email: string, accessToken: string): Promise<PushSubscriptionType> {
		try {
			let url: string = "https://nofb.org/LNVApi/Notification/SubscribeLvcPushNotification";
			let method = "POST";
			//accessToken = this.jsHelperService.isEmpty(accessToken) ? this.signalrService.jwtToken.access_token : accessToken;

			let serviceProviderName = PushProviderType.fcm; //"FCM";

			var payload = {
				Token: this.pushId,
				Email: email,
				UserKey: this.userKey,
				AuthKey: this.authKey,
				ServiceProviderName: serviceProviderName,
				ApplicationName: this.configService.pushApplicationName,
				RequiresHub: this.configService.requiresHub
			};

			console.log("payload: ", payload);

			let response: string = await this.jsHelperService.ajaxRequest(method, url, payload, accessToken);

			console.log("pushService.subscribePushNotification response:", response);

			if (this.jsHelperService.isEmpty(response)) {
				throw ("Empty response from server.");
			}

			let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);

			if (this.jsHelperService.isEmpty(apiResponse)) {
				throw ("Unable to parse Web Api Response Type");
			}

			if (apiResponse.status === WebApiResponseStatusType.success) {
				let result: PushSubscriptionType = this.jsHelperService.jsonToObject<PushSubscriptionType>(apiResponse.data, true);
				return result;
			}
			else {
				let errors: Array<string> = this.jsHelperService.tryParseJson(apiResponse.data);
				throw (this.jsHelperService.implode(" |", errors));
			}
		}
		catch (e) {
			throw (e);
		}
	}
	*/

	/*

	//TODO:
	//https://nofb.org/LNVApi/Notification/SendPushNotification(SendPushNotificationDto) post
	//https://nofb.org/LNVApi/Notification/GetPushMessages(StringIdDto) post

	*/
}