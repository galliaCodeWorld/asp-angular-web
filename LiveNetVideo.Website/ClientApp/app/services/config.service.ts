// NOTE: use this class to store application wide config strings
import { Injectable } from '@angular/core';

@Injectable()
export class ConfigService {
	constructor() {
		// NOTE: try to get the activeDeviceId from localStorage, if its not set,
		// then get the front facing camera deviceId, and set it
		//console.log("window.location", window.location);
		this.phoneOnly = this.domainName.toLowerCase() === "livevideomatch.com" ? true : false;

		switch (this.domainName.toLowerCase()) {
			case 'livenetvideo.com':
				this.siteName = 'Live Net Video';
				break;
			case 'livevideomatch.com':
				this.siteName = 'Live Video Match';
				break;
			default: this.siteName = 'Live Net Video';
		}
	}
	// NOTE: to utilize the full url you have to combine the location folder like so:
	// let companyLogoSrc = `${service.pbxContentUrl}${companyProfileId}/companyProfileDto.logoFileName`;

	origin: string = window.location.origin;
	pathname: string = window.location.pathname
	//baseUrl: string = "https://livenetvideo.com/Phone/";
	baseUrl: string = this.origin + "/Phone/";
	domainName: string = window.location.hostname;
	//domainName: string = "LiveNetVideo.com";
	pbxContentUrl: string = "https://nofb.org/Content/Pbx/";
	employeeImageFolder: string = "Employees";
	pbxLineImageFolder: string = "PbxLines";
	companyLocationImageFolder: string = "Locations";
	companyVideoImageFolder: string = "Videos";
	companyPhotoImageFolder: string = "Photos";

	keySettings: string = "AppSettings.txt";
	keyPushSubscription: string = "PushSubscription.txt";
	keyPushId: string = "PushId.txt";
	keyAuthKey: string = "AuthKey.txt";
	keyUserKey: string = "UserKey.txt";
	keyContactList: string = "ContactList.txt";
	keyBlockEmails: string = "BlockedEmails.txt";
	keyRememberMe: string = "RememberMe.txt";
	keyMemberType: string = "MemberType.txt";
	keyMemberId: string = "MemberId.txt";
	keyGuestFile: string = "GuestProfile.txt";
	keyProxySecret: string = "ProxySecret.txt";
	//keyAccessTokenFile: string = "JwtToken.txt";
	keyJwtToken: string = "JwtToken.txt";
	keyIp: string = "UserIp.txt";
	keyConnectionId: string = "HubConnectionId.txt";
	keyUserEmail: string = "UserEmail.txt";
	keyPbxlines: string = "Pbxlines.txt";
	keyCompanyProfile: string = "CompanyProfile.txt";
	keyCompanyEmployees: string = "CompanyEmployees.txt";
	keyCompanyEmployeeInvites: string = "CompanyEmployeeInvites.txt";
	keyCompanyPhotos: string = "CompanyPhotos.txt";
	keyCompanyLocations: string = "CompanyLocations.txt";
	keyCompanyVideos: string = "CompanyVideos.txt";
	keyEmployers: string = "Employers.txt";
	keyCountries: string = "Countries.txt";
	keyIsLoggedin: string = "IsLoggedIn.txt";
	keyLocalGuid: string = "LocalGuid.txt";
	keyCameraId: string = "CameraId.txt";
	keyMicrophoneId: string = "MicrophoneId.txt";
	keyNetcasts: string = "Netcasts.txt";
	keyNetcastGenre: string = "NetcastGenre.txt";

	subscribePushNotificationEndPoint: string = "https://nofb.org/LNVApi/Notification/SubscribeLvcPushNotification";
	hubUrl: string = "https://nofb.org/SignalR";
	//hubUrl = "https://localhost:44363";
	webRtcHubProxyName: string = "webRtcHub";
	clientIdHubProxyName: string = "clientIdProxyHub";
	//senderId: string = "404930055489";

	memberProfile: string = "MemberProfile.txt";
	pushApplicationName: string = "Web_livenetvideo.com";
	blockedEmailsFilename: string = "blockedEmails.txt";
	avatarBaseUrl: string = "https://nofb.org/Content/Avatars/";
	contactAvatarBaseUrl = "https://nofb.org/Content/PhoneContacts/";

	defaultAvatar = "https://nofb.org/Content/Avatars/Default.png" + "?" + Date.now().toString();
	webApiBase = "https://nofb.org/LNVApi/";
	pbxController = this.webApiBase + "Pbx/";
	netcastController = this.webApiBase + "Netcast/";
	//netcasteeBaseUrl = "http://localhost:4100/#/netcastee/";

	netcastImageUrl = "https://nofb.org/Content/Netcast/";
	netcastGenreImageBaseUrl = "https://nofb.org/Content/NetcastGenre/";
	//netcasteeBaseUrl = window.location.origin + "/#/netcastee/";
	//netcasteeBaseUrl = "https://livenetvideo.com/phone/dist/#/netcastee/";
	netcasteeBaseUrl = this.origin + "/Phone/dist/#/netcastee/";
	requiresHub: boolean = true;

	safariPushId: string = "web.com.livenetvideo";
	phoneOnly: boolean = false;

	siteName: string = "";
}