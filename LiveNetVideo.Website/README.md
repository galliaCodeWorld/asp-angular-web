# LiveNetVideo
NOTE: when running npm install to install npm packages on fresh dev location:
you will need to modify the node_modules. angular/cli package.json. Update the package.json to use 
typescript: "3.0.1"
and inside of angular/cli/node_modules/tsickle/ modify package.json to also use typescript: "3.0.1"

or just ignore the typescript@3.0.1 warning and the @angular/compiler-cli and tsickle@0.27.5 warning 
requiring typescript >=2.4.2 < 2.7

Currently we are using TypeScript 3.0.1 because it has the webrtc definitions built in

## Reinstalling node_modules
NOTE: signalr node_module requires editing after you reinstall singalr module
add this to the signalr files  
```javascript
import * as $ from 'jquery';
window.jQuery = $;
```

if this is not added to the signalr files, the $.hubconnection is not recognized.
The dollar $ symbol for jquery is not recognized without the import

## signalr.service.ts localGuid variable

The variable `localGuid` is an indicator. If it has a guid, then
we assume the user is checkedInto HubConnection, else we assume the
user is not checked into hubconnection and we will automatically 
check them in and get a guid. We then set the guid on webrtchub.state and 
signalr service localGuid variable. using setLocalGuid(guid: string)


## Netcastee, Meeting, Customer-Pbx, Phone

All these pages use PageCanActivate Guard, and will do their
user authentication and prompts during page startup instead of the GuestCanActivate or MemberCanActivate Guard

## Session Storage vs Local Storage
Session storage persists on a tab even when a page gets refreshed but disappears after tab is closed.

Local Storage will persist even after tab or window is closed

## Website development
open solution file (.sln) in Visual studio and 
develop site from there.

NOTE: the .gitignore file wouldn't show up when open as vs solution.
TO edit this file, use windows explorer and open in text editor

## Dev preview
run ng serve to view website
```console
ng serve
``` 

## Publish
build with command 
```console
ng build --prod --aot=false
```
this will generate dist folder in wwwroot accordingly with the .angular-cli.json settings

in dist folder open index.html and transfer the scripts and style references to 
the mvc Views/Home/WebPhone.cshtml file

stop the currently running netcore website this app is hosted in.
Then publish the app to Phone Application folder in site on webserver.



##MarkDown Preview
to enable or disable the mark down preview window 
Tools -> Options -> Text Editor -> Markdown -> Advance -> Enable Preview Window

NOTE: if you get a bunch of errors and missing deps from npm ls --depth=0
then delete the package-lock.json or the npm-shrinkwrap.json file. You
can then regenerate it using npm shrinkwrap

to generate npm-shrinkwrap.json which can be renamed to package-lock.json with npm 6
run the command
```console
npm shrinkwrap
```

When the user first starts the web app, they will connect to signalr and create
a net.HubConnection db entry. This is done in the signalr.service.ts constructor

```typescript
constructor(
	public configService: ConfigService,
	public jsHelperService: JsHelperService,
	public localStorageService: LocalStorageService) 
{
	this.connection = $.hubConnection(this.configService.hubUrl, {});
	this.webRtcHub = this.connection.createHubProxy(this.configService.webRtcHubProxyName);
	
	// this is required to activate the OnConnected(), OnDisconnected()
	// server methods. Here we just register a dummy client method to establish communications with hub
	// so the OnConnected() from signalr hub gets called
	this.webRtcHub.on("dummyConnection", function (message) {
		//console.log(message);
	});

	this.clientIdHub = this.connection.createHubProxy(this.configService.clientIdHubProxyName);
	this.clientIdHub.state.ip = "";
}
```

# README.md from root

# LiveNetVideo-Website

The site (livenetvideo.com) is hosted on infolinkdb3 using IIRF isapi filter
for php rewrite to remove requirement for index.php.

The phone app is located in "Phone" folder.

NOTES: Use IIRF isapi filter for url rewrite instead of 
IIS URL_Rewrite module. The Url_Rewrite modules will 
conflict with the .php and the Phone sub application folder.

## Development
All settings should be put into config.service.ts



## Debugging
Run command, note this will delete the wwwroot/dist folder 
```console
ng serve --browser chrome --livereload
```

## Production Build
to publish to the webserver
```console
ng build --prod --aot=false
```
TODO: need to remove --aot=false. If --aot=false is omitted, then you will get build errors

After ng build --prod --aot=false, you will get a dist folder (wwwroot/dist), copy these elements of the index.html
into your .cshtml file

TODO: need a taskrunner to do the copying or modifying automatically with build

dist/index.html
```html
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>Livenetvideo</title>
	<base href="./">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<link rel="icon" type="image/x-icon" href="favicon.ico"><!--<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">--><!--<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.6.0/css/bulma.css">-->
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.css"><!-- <link rel="stylesheet" href="~/dist/vendor.css" asp-append-version="true" /> -->
	<link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,700" rel="stylesheet">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=News+Cycle:400,700">
	<style></style>
	<link href="styles.7e15d8a986045f2a3065.bundle.css" rel="stylesheet" />
</head>
<body>
	<app></app>
	<script type="text/javascript" src="inline.e9ccdda81e63a931e66b.bundle.js"></script>
	<script type="text/javascript" src="polyfills.4d35a5fcdd5eda47e868.bundle.js"></script>
	<script type="text/javascript" src="scripts.b9141765c843230f1a92.bundle.js"></script>
	<script type="text/javascript" src="vendor.b79fd418036983e39220.bundle.js"></script>
	<script type="text/javascript" src="main.4f2a5858da6abac1a3f3.bundle.js"></script>
</body>
</html>
```

Views/Home/WebPhone.cshtml
```html
@{
	Layout = null;
}

@model LiveNetVideo.Website.Models.WebPhoneViewModel

<!doctype html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<title>Livenetvideo</title>
	<base href="~/dist/">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="icon" type="image/x-icon" href="favicon.ico">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.css"><!-- <link rel="stylesheet" href="~/dist/vendor.css" asp-append-version="true" /> -->
	<link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,700" rel="stylesheet">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=News+Cycle:400,700">
	<style></style>
	<link href="styles.7e15d8a986045f2a3065.bundle.css" rel="stylesheet" />
</head>

<body>
	<app pbx-line-id="@Model.PbxLineId.ToString()"></app>

	<script type="text/javascript" src="~/dist/inline.e9ccdda81e63a931e66b.bundle.js"></script>
	<script type="text/javascript" src="~/dist/polyfills.4d35a5fcdd5eda47e868.bundle.js"></script>
	<script type="text/javascript" src="~/dist/scripts.b9141765c843230f1a92.bundle.js"></script>
	<script type="text/javascript" src="~/dist/vendor.b79fd418036983e39220.bundle.js"></script>
	<script type="text/javascript" src="~/dist/main.4f2a5858da6abac1a3f3.bundle.js"></script>
</body>
</html>
```

publish the production build to 
infolinkdb3 E:\www2\LiveNetVideo.com\Phone

NOTE: livenetvideo.com uses IIRF for url rewrite to remove the index.php instead 
of usign IIS Url_Rewrite Module because, Url_Rewrite module currently isn't working
because of permission to Phone folder is disabled using Url_Rewrite module for IIS_

# Key Startup Events

Things to remember
- signalr is a singleton and connection defined in constructor
- when app starts, connetion is established and ip and proxySecret is retrieved
- when logged in or from rememberMe, jwtToken is stored in permanent storage for rememberme 


NOTE: all set items are also stored in signalr property:

- `this.webRtcHub.state.accessToken = jwtToken.access_token;` signalr.getAccessToken()
- `this.clientIdHub.state.proxySecret = proxySecret` signalr.proxySecret
- `this.clientIdHub.state.ip = ip;` signalr.ip
- `this.webRtcHub.state.email = email;` signalr.email
- `this.webRtcHub.state.connectionGuid = localGuid` signalr.localGuid
- member info is stored in userService.profile
- localGuid (aka bznews.net.HubConnection.ConnectionGuid) is stored in signalr.localGuid
- companyProfile is stored in pbxService.companyProfile along with related company information
- employers is also stored in pbxService.employers

email and accessToken must be set for WebRtcHub.state before invoking checkin



## Signalr
SignalrService is a singleton registered in app.module.ts.
and is injected with DI. The one instance of signalr constructor
will perform these tasks
```javascript
	// define the hubconnection
	this.connection = $.hubConnection(this.configService.hubUrl, {});
	
	// define proxy for webRtcHubProxy
	this.webRtcHub = this.connection.createHubProxy(this.configService.webRtcHubProxyName);
	// the dummyConnection listener is required to activate the activate 
	// the OnConnected(), OnDisconnected() server methods.
	this.webRtcHub.on("dummyConnection", function (message) {
		// Here we just register a dummy client method to establish communications with hub
		// so the OnConnected() from signalr hub gets called
		//console.log("DummyConnection: ", message);
	});

	// define proxy for clientIdHubProxy
	this.clientIdHub = this.connection.createHubProxy(this.configService.clientIdHubProxyName);
	this.clientIdHub.state.ip = "";
```


## Start App
During app startup the hubConnection defined in signalrService singleton instance
is connected to signalr server using `this.connection.start();`

Next we invoke `this.clientIdHub.invoke("requestIp")` to get the users Ip.

IP is set `this.clientIdHub.state.ip = ip;`
and IP is stored in signalr.ip 
`return this.localStorageService.getSessionItem<string>(this.configService.keyIp, true);`


The Ip is hashed using this algorithm:
```javascript
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
```

The hashed Ip is used to get a secret string (proxySecret) from the clientIdHub.
`this.clientIdHub.invoke('requestProxySecret', hashOfIp)`

The proxySecret is then stored in signalrService localStorage session item
`this.localStorageService.setSessionItem(this.configService.keyProxySecret, value, true);`
and the clientIdHub state `this.clientIdHub.state.proxySecret = proxySecret`

If the user previously checked "RememberMe", we will try to log them in from 
localStorage information. `await this.service.tryLoginFromRemembered()`

If not "RememberMe" then we check if there is a stored guestProfile, 
and `await this.service.tryStartAsGuest()`

If a pbxLineId is available, send the user to the /customer-pbx 
page `this.router.navigate(["/customer-pbx", pbxLineId]);`

Else send them to either the login page or the dashboard (if this.userService.loggedIn is true)
`this.router.navigate([startAtPage]);`

NOTE: isLogged is stored in sessionItem `this.localStorageService.getSessionItem<boolean>(this.configService.keyIsLoggedin, true)`

## 3 Main Login Senarios

### this.service.tryLoginFromRemembered()

try to get the jwtToken from permanent storage then session storage

`jwtToken = this.localStorageService.getPermanentItem<JwtToken>(this.configService.keyAccessTokenFile, true);`

`jwtToken = this.localStorageService.getSessionItem<JwtToken>(this.configService.keyAccessTokenFile, true);`

NOTE: if no jwtToken, error is thrown and login is required

signalr.setAccessToken(jwtToken) is called.

this will set the accessToken for webRtcHub.state.accessToken
`this.webRtcHub.state.accessToken = jwtToken.access_token;`

and depending on rememberMe value will save the jwtToken in permanentItem or sessionItem 
```javascript
if (this.rememberMe) {
	this.setPermanentJwtToken(jwtToken);
	// this.localStorageService.setPermanentItem(this.configService.keyAccessTokenFile, value, true);
	
	this.deleteSessionJwtToken();
	// this.localStorageService.removeSessionItem(this.configService.keyAccessTokenFile, true);
}
else {
	this.setSessionJwtToken(jwtToken);
	// this.localStorageService.setSessionItem(this.configService.keyAccessTokenFile, value, true);

	this.deletePermanentJwtToken();
	// this.localStorageService.removePermanentItem(this.configService.keyAccessTokenFile, true);
}
```

try to get fresh accessToken incase it is expired `let accessToken = await this.getAccessToken();`

```javascript
async getAccessToken(): Promise<string> {
	// will get token and check if its expired and renew if needed and return accessToken
	let jwtToken: JwtToken;
	try {
		jwtToken = this.jwtToken;
		//console.log("jwtToken from property: ", jwtToken);
		if (this.jsHelperService.isEmpty(jwtToken)) {
			try {
				jwtToken = await this.getNewGuestToken();

				this.setAccessToken(jwtToken);
				return jwtToken.access_token;
			}
			catch (e) {
				throw ("Unable to request authentication credentials.");
			}
		}
		else if (this.jsHelperService.isExpiredToken(jwtToken)) {
			try {
				jwtToken = await this.renewToken(jwtToken);
				this.setAccessToken(jwtToken);
				return jwtToken.access_token;
			}
			catch (e) {
				throw ("Access denied, unable to renew authenication credentials.");
			}
		}
		else {
			return jwtToken.access_token;
		}
	}
	catch (e) {
		throw (e);
	}
}
```

extract memberId from accessToken
```javascript
getMemberId(token: string): string {
	let parsed = this.parseJwt(token);
	if (this.isEmpty(parsed)) {
		return "";
	}
	else {
		return parsed.netMemberID;
	}
}
```

If no memberId, throw error, user must login

userService: get the member profile using the accessToken
```javascript
async getMyProfile(accessToken: string): Promise<MemberType> {
	try {
		let memberType = await this.jsHelperService.ajaxRequestParsed<MemberType>("GET", "https://nofb.org/LNVApi/Member/GetMyProfile", null, accessToken);
		return memberType;
	}
	catch (e) {
		throw (e);
	}
}
```

Store the member profile in userService, accessible from service.profile
```javascript
set profile(value: MemberType) {
	let key = this.configService.keyMemberType;
	this.localStorageService.setSessionItem(key, value);
}
```

Save the member email in signalrService `this.email = member.email`

Save the member email to webRtcHub.state.email `this.webRtcHub.state.email = email`

CheckIn to webRtcHub to get a localGuid
`await this.webRtcHub.invoke("checkin", displayName);`

NOTE: localGuid is the ConnectionGuid generated field in bznews.net.HubConnection

Store the localGuid in `this.webRtcHub.state.connectionGuid = guid;`
and in `signalrService.localGuid = localGuid`

Start the signalrService webRtcHub listeners
`signalrService.startWebRtcHubListeners()`

Try to get the members companyProfile (use pbxService) 
`pbxService.getmembersCompanyProfile(memberId: number, accessToken: string)`

If they have a companyProfile then 

Store the company profile in pbxService as sessionItems 
`this.storageService.setSessionItem(this.configService.keyCompanyProfile, value);`

Retrieve and store company related items:

`this.companyEmployees = await this.getCompanyEmployeesByCompanyProfileId(idDto, accessToken);`

`this.companyPhotos = await this.getCompanyPhotosByCompanyProfileId(idDto, accessToken);`

`this.companyLocations = await this.getCompanyLocationsByCompanyProfileId(idDto, accessToken);`

`this.companyVideos = await this.getCompanyVideosByCompanyProfileId(idDto, accessToken);`

`this.companyEmployeeInvites = await this.getCompanyEmployeeInvitesByCompanyProfileId(idDto, accessToken);`

Try to get the employers (companyProfiles) for this user and store in sessionItem
`this.employers = await this.getEmployeeCompanies(post, accessToken);`

Start the pushNotification service:
Ask for permission if necessary

Finally set userService.isLoggedIn
`this.localStorageService.setSessionItem(this.configService.keyIsLoggedin, value, true);`

and return to TryLoginFromMembered()

### this.service.tryStartAsGuest()

Get a guest jwtToken `this.clientIdHub.invoke("requestGuestToken")`




### login page: MemberLogin() and GuestLogin()

#### MemberLogin()

Request jwtToken with email and password
signalrService request memberToken (jwtToken) `this.clientIdHub.invoke("requestMemberToken", { Email: email, Password: password })`

if not jwtToken then throw error

else 

store remeberMe value as permanent `this.localStorageService.setPermanentItem(this.configService.keyRememberMe, value, true);`;

set `this.webRtcHub.state.email = email;`

save the email in localstorage
```javascript
let key = "key" + this.configService.keyUserEmail;
this.localStorageService.setPermanentItem(key, value, true);
```
Set accessToken. NOTE: signalr.setAccessToken will set
`this.webRtcHub.state.accessToken = jwtToken.access_token`
and it will store the jwtToken in Session if not rememberMe or in
permanent item if rememberMe

signalrService.setAccessToken(JwtToken) is called and it will:
```javascript
// place accessToken in webRtcHub.state.accessToken
this.webRtcHub.state.accessToken = jwtToken.access_token;
if (this.rememberMe) {
	this.setPermanentJwtToken(jwtToken);
	this.deleteSessionJwtToken();
}
else {
	//console.log("jwtToken: ", jwtToken);
	this.setSessionJwtToken(jwtToken);
	this.deletePermanentJwtToken();
}
```

call signalr.getAccessToken() to retrieve fresh copy of accessToken.
This method will get a new accessToken if it is expired.
If a new token is retrieved it will also call signalr.setAccessToken(jwtToken);

Continue from tryLoginFromMembered() at get fresh copy of accessToken


## Other Login Senarios

### InstantGuestLogin()
get generated Email `this.signalrService.getGeneratedEmail()`
`await this.clientIdHub.invoke("getGeneratedEmail")`

create GuestProfileType 
```javascript
let guestProfile = new GuestProfileType();
guestProfile.email = email;
guestProfile.name = "";
```

set the email `this.signalrService.setEmail(email)`;

setEmail will 
`this.webRtcHub.state.email = email` and store the email as a permanent item

```javascript
let key = "key" + this.configService.keyUserEmail;
this.localStorageService.setPermanentItem(key, value, true);
```

store the guestProfileType `this.userService.guestProfile = guestProfile;`

Which stores the guestProfile in permanent item
```javascript
let key = this.configService.keyGuestFile;
this.localStorageService.setPermanentItem(key, value);
```



// NOTE: displayName is the generated email in this case
CheckIn to webRtcHub to get a localGuid
`await this.webRtcHub.invoke("checkin", displayName);`

Store the localGuid in `this.webRtcHub.state.connectionGuid = guid;`
and in `signalrService.localGuid = localGuid`

Start the webRtcHub Listeners `this.signalrService.startWebRtcHubListeners()`;

Set this.userService.isLoggedIn = true;


# Customer Pbx Link

The phone is served in the "Phone" application folder 

The link will be https://livenetvideo.com/Phone/Home/Index/2000002

Phone is the application folder, Home is the controller, Index is the action
and the number is the PbxLineId which is passed into the mvc view

```csharp
	var model = new WebPhoneViewModel() { PbxLineId = id };
	return View("~/Views/Home/WebPhone.cshtml", model);
```

When MVC builds the page it load the PbxLineId into DOM
as an attribute of `<app>` attribute pbx-line-id

```html
<body>
	<app pbx-line-id="@Model.PbxLineId.ToString()"></app>
	<!--~/dist/-->

	<script type="text/javascript" src="~/dist/inline.31e1fb380eb7cf3d75b1.bundle.js"></script>
	<script type="text/javascript" src="~/dist/polyfills.3ebb9635f5f9a8646e12.bundle.js"></script>
	<script type="text/javascript" src="~/dist/scripts.b1f28ccaa6c93ec0b728.bundle.js"></script>
	<script type="text/javascript" src="~/dist/vendor.011dce36ce143f7fbdc9.bundle.js"></script>
	<script type="text/javascript" src="~/dist/main.be9a9f7e1ba3080dbe34.bundle.js"></script>
</body>
</html>
```

The attribute is retrieved form app.component.ts in the constructor
```javascript
this.pbxLineId = this.elementRef.nativeElement.getAttribute('pbx-line-id') as number;
```

When the app.component.ts (app first loads in browser), and this.pbxLineId is not null then
it redirects the user to the customer-pbx page with route param 
```javascript
this.router.navigate(["/customer-pbx", pbxLineId]);
```

which corresponds the the route rule in app.module.routes.ts

```javascript
{
	path: 'customer-pbx/:pbxlineId',
	component: CustomerPbxPage
},
```

Angular picks up the value in the customer-pbx.page.ts file
```javascript
this.activatedRoute.paramMap.subscribe((params) => {
			
	let pbxlineId = Number(params.get('pbxlineId'));
	if (this.service.isEmpty(pbxlineId) === false) {
		this.initPage(pbxlineId);
	}
	else {
		let alert = new MaterialAlertMessageType();
		alert.title = "Error";
		alert.message = "Unable to load interface. Identifier for the Pbx Line missing.";
		this.service.openAlert(alert);
	}
});
```

customer-pbx.page.ts will check if the user is logged in, if not then it does instant guest login






