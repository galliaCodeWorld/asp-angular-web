# Push

TODO: webapi needs to be able to send notification to apns, fcm, and wns.
TODO: display the message. apns has it's own formatting. fcm and wns formatting and content 
is based on json contents of message package.

ServiceWorker is not required by Safari Push.

Safari browser will grab a pushPackage.zip from our webapi server endpoint
and use the contents of the zip package to display the notification.

TODO: implement service-worker in ngsw for PWA (Progressive Web App)

```javascript
navigator.serviceWorker.register('assets/service-worker/service-worker.js')
	.then((serviceWorkerRegistration: ServiceWorkerRegistration) => {
		let serviceWorkerState;

		if (serviceWorkerRegistration.installing) {
			serviceWorkerState = serviceWorkerRegistration.installing;
			console.log("serviceWorkerRegistration installing: ", serviceWorkerRegistration);
		}
		else if (serviceWorkerRegistration.waiting) {
			serviceWorkerState = serviceWorkerRegistration.waiting;
			console.log("serviceWorkerRegistration waiting: ", serviceWorkerRegistration);
		}
		else if (serviceWorkerRegistration.active) {
			serviceWorkerState = serviceWorkerRegistration.active
			console.log("serviceWorkerRegistration active", serviceWorkerRegistration);

			Notification.requestPermission()
				.then((permission: NotificationPermission) => {
					
					serviceWorkerRegistration.pushManager.getSubscription()
						.then((subscription: PushSubscription) => {
							if (subscription == null) {
								console.log("subscribing new");

								let options = {
									userVisibleOnly: true,
									applicationServerKey: this.service.urlB64ToUint8Array('BNBeujDTmrt85mnLJFaZtkBMYhE37fGAlUEEIeNf0nL1P60MRM5h1ZC0t5vO-MG2zzr2_8-oTPwpv8JZNmmRt4c')
								};

								serviceWorkerRegistration.pushManager.subscribe(options)
									.then((pushSubscription: PushSubscription) => {
									
										let authKey: string = this.service.generateAuthKey(pushSubscription);
										let userKey: string = this.service.generatePublicKey(pushSubscription);
										this.service.authKey = authKey;
										this.service.userKey = userKey;
										this.service.pushId = pushSubscription.endpoint;
									})
									.catch((e) => {
										console.log("subscribing new error: ", e);
									});;
							}
							else {
								let authKey: string = this.service.generateAuthKey(subscription);
								let userKey: string = this.service.generatePublicKey(subscription);
							}
						});
				})
				.catch((e) => {
					console.log("notification permission not granted");
				})
		}
		
		if (serviceWorkerState) {
			
			serviceWorkerState.addEventListener('statechange', function (e) {
				
				console.log("serviceWorkerRegistration statechange event: ", e.toString());
			});
		}
	})
	.catch((e) => {
		console.log("serviceWorkerRegistration error: ", e);
	});

navigator.serviceWorker.ready
	.then((reg: ServiceWorkerRegistration) => {
		console.log("navigator.serviceWorker.ready serviceWorkerRegistration: ", reg);
	})
```
Later when the user logs in we send the notification information to webapi to store in dbo.LvcPushNotificationSubscription

Test displaying a static generated notification. When we receive a notification, we will
format it and then display it.
```javascript
let options = {
	body: 'Here is a notification body!',
	icon: 'assets/images/bz.png',
	vibrate: [100, 50, 100],
	data: {
		dateOfArrival: Date.now(),
		primaryKey: 1
	},
	actions: [
		{
			action: 'explore', title: 'Explore this new world',
			icon: 'assets/images/default-avatar.png'
		},
		{
			action: 'close', title: 'Close notification',
			icon: 'assets/images/default-avatar.png'
		},
	]
};

serviceWorkerRegistration.showNotification('Hello World', options);
```


## Build and Test Development
build using
```console
ng build --prod
```
*note: currently we have to use --aot=false also* `ng build --prod --aot=false`

after the build cd into the dist folder. From inside the dist folder
run the http server to view development

```console
http-server -c-1
```

> NOTE: check out the angular-pwa-course project located in Tests folder
and read the readme.md file for simplified working example

## Get VAPID

VAPID is used by our Web Push. Safari currently does not support Web Push Protocol.

> NOTE: VAPID is generated once and saved on our application server (WebApi Server)

NOTE: The current VAPID was generated from firebase console. We did 
not use the web-push npm package to generate the current VAPID.



use web-push npm package to generate VAPID
```console
npm install -g web-push
```

```console
web-push generate-vapid-keys --json
```
example output
```json
{
"publicKey":"BGWWBfBeDunKBshUb5_MGYuJBGRqQFvRir9lRcXPS1KPj0d79IMd-ZmphHsEKqRtuhFBRG51Ogk1l46l7GR2oSk",
"privateKey":"FZffS1vt02yrVXmo0kArBxUA-ZEz0Q-j3qpx-__XRWk"
}
```


## Reset Notifications
in chrome navigate to this url 
chrome://settings/content/notifications and then
look for your sites url and remove from allow or deny section

## Angular 5 Service Worker

> NOTE: A service worker for angular

- npm install @angular/service-worker if not already installed
- generate ngsw-config.json. this will will be used by angular/cli to 
create ngsw.json. 

```json
{
  "index": "/index.html",
  "assetGroups": [{
    "name": "app",
    "installMode": "prefetch",
    "resources": {
      "files": [
        "/favicon.ico",
        "/index.html"
      ],
      "versionedFiles": [
        "/*.bundle.css",
        "/*.bundle.js",
        "/*.chunk.js"
      ]
    }
  }, {
    "name": "assets",
    "installMode": "lazy",
    "updateMode": "prefetch",
    "resources": {
      "files": [
        "/assets/**"
      ]
    }
  }]
}
```

- angular/cli will also generate ngsw-worker.js in the dist folder
when you run ng build --prod

```console
ng build --prod
```

- in the .angular-cli.json, enable serviceWorker by setting or adding serviceWorker: true
```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "project": {
    "name": "angular5-service-worker"
  },
  "apps": [
    {
      "root": "src",
      "outDir": "dist",
      "assets": [
        "assets",
        "favicon.ico"
      ],
      "index": "index.html",
      "main": "main.ts",
      "polyfills": "polyfills.ts",
      "test": "test.ts",
      "tsconfig": "tsconfig.app.json",
      "testTsconfig": "tsconfig.spec.json",
      "prefix": "app",
      "styles": [
        "styles.css"
      ],
      "scripts": [],
      "environmentSource": "environments/environment.ts",
      "environments": {
        "dev": "environments/environment.ts",
        "prod": "environments/environment.prod.ts"
      },
      "serviceWorker": true
    }
  ],
  "e2e": {
    "protractor": {
      "config": "./protractor.conf.js"
    }
  },
  "lint": [
    {
      "project": "src/tsconfig.app.json",
      "exclude": "**/node_modules/**"
    },
    {
      "project": "src/tsconfig.spec.json",
      "exclude": "**/node_modules/**"
    },
    {
      "project": "e2e/tsconfig.e2e.json",
      "exclude": "**/node_modules/**"
    }
  ],
  "test": {
    "karma": {
      "config": "./karma.conf.js"
    }
  },
  "defaults": {
    "styleExt": "css",
    "component": {}
  }
}

```

- in app.module.ts, imports register ngsw-worker.js

```javascript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { ServiceWorkerModule } from '@angular/service-worker';
import { AppComponent } from './app.component';

import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

- to debug run the application using http-server

- install http-server globally if not already installed
```console
npm install -g http-server
```

- cd into the dist folder and run command
```console
cd dist
http-server -c-1
```
- The -c-1 option will disable server caching

- to proxy an local rest API run with this command
```console
http-server -c-1 --proxy http://localhost:9000
```
- after the app is run, you can stop the http-server using ctrl+c in
the command prompt window

The app should still reload since all its resources are cached now

NOTE: each time the app is run angular will look for new ngsw.json file,
and cache updated versions if the ngsw.json has changes

to check for service worker updates manually, import SwUpdate and use checkForUpdate() method

example 
```javascript
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  implements OnInit {

    constructor(private swUpdate: SwUpdate) {
    }

    ngOnInit() {

        if (this.swUpdate.isEnabled) {

            this.swUpdate.available.subscribe(() => {

                if(confirm("New version available. Load New Version?")) {

                    window.location.reload();
                }
            });
        }        
    }
}
```

### One click install
to make the app offline available and installed on the users home screen,
you will need to add a manifest.json file served over https and have a service worker.
Place the manifest.json file in the app root in the same location as the index.html file.

In the index.html file add this to the `<head>`
```html
<link rel="manifest" href="manifest.json">
```

add the manifest to angular/cli .angular-cli.json
```json
"apps": [
    {
      "root": "src",
      "outDir": "dist",
      "assets": [
        "assets",
        "manifest.json",
        "favicon.ico"
      ],
```

Add to home screen is determined by the browser based on certain criterias,
but we can manually trigger it during testing in Chrome DevTools Application tab
, look for the Add to Homescreen link

## Vanilla Javascript Service Worker
use navigator.serviceWorker.register() to register your service worker and 
create an instance of serviceWorkerRegistration. Use serviceWorkerRegistration
to get pushscription: 
serviceWorkerRegistration.pushManager.subscribe({ userVisibleOnly: true }).then(function (pushSubscription).
With the pushSubscription you can then send the subscription token to webapi. In this case 
the subscription is send to MVC controller and add all the other required information and then
the controller sends the information to WebApi

```javascript
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Content/ServiceWorker/SW.js').then(function (serviceWorkerRegistration) {

        var serviceWorkerState;

        if (serviceWorkerRegistration.installing) {
            serviceWorkerState = serviceWorkerRegistration.installing;
        }
        else if (serviceWorkerRegistration.waiting) {
            serviceWorkerState = serviceWorkerRegistration.waiting;
        else if (serviceWorkerRegistration.active) {
            serviceWorkerState = serviceWorkerRegistration.active

            //NOTE: you can pass data to service worker by postMessage, but it only works while the web page is open
            //serviceWorkerRegistration.active.postMessage(JSON.stringify({ antiForgeryTokenParam : antiForgeryTokenParam }));

            //when serviceWorkerRegistration is active, we will subscribe
            //NOTE: subscribe will check if we have an existing subscription. If we don't then it will subscribe, 
			 //else we already have a subscription
            subscribe(serviceWorkerRegistration);

        }

        // NOTE: this can be commented out later, it's only for logging events to the console for debugging
        if (serviceWorkerState) {
            // logState(serviceWorker.state);
            serviceWorkerState.addEventListener('statechange', function (e) {
                // logState(e.target.state);
                console.log("statechange event: ", e);

            });
        }
    }).catch(function (error) {
        // Something went wrong during registration. The service-worker.js file
        // might be unavailable or contain a syntax error.

        console.log("error: ", error);

    });
}

function subscribe(serviceWorkerRegistration) {
    // getSubscription() will return existing push subscription or null
    // we check if there is an existing push subscription already before we subscribe
    serviceWorkerRegistration.pushManager.getSubscription().then(function (subscription) {

        if (subscription == null) {
            serviceWorkerRegistration.pushManager.subscribe({ userVisibleOnly: true }).then(function (pushSubscription) {

                if (typeof pushSubscription !== "undefined" && pushSubscription != null) {
                    console.log("pushSubscription: ", pushSubscription);
                    console.log('Endpoint:', pushSubscription.endpoint);
                    var id = pushSubscription.endpoint.replace("https://android.googleapis.com/gcm/send/", "");
                    console.log("Id: ", id);

                    var endPoint = "SubscribePushNotification";
						// this is the MVC endpoint that sends the full LvcPushNotificationSubscription
						// info to webApi
                    var url = baseAjaxUrl + endPoint; 

                   console.log("antiForgeryTokenParam", antiForgeryTokenParam);

                    var headers = new Headers();
                    headers.set("Content-Type", "application/x-www-form-urlencoded");
                    headers.set("Cache-Control", "no-cache");

                    var data = "Token=" + id + antiForgeryTokenParam;

                    var init = {
                        method: 'POST',
                        headers: headers,
                        body: data
                    };

                    var request = new Request(url, init);

                    //NOTE: for cors request use { credentials: "include" }

                    //NOTE: use { credentials: "same-origin"} object for same original requests that identify the user

                    fetch(request, { credentials: "same-origin"})
                    .then(
                        function (response) {

                            //NOTE: uncomment for debugging
                                //response.text().then(function (text) {
                                //    console.log("text: ", text);
                                //});

                                response.json().then(function (res) {
                                    //if (consoleLoggingOn) console.log("success: ", res);
                                    if (res.status === "SUCCESS") {
                                        if(consoleLoggingOn) console.log("successful push notification subscription: ", res);
                                    }
                                    else {
                                        if(consoleLoggingOn) console.log("unsuccessful push notification subscription: ", res);
                                    }
                                });
                           



                        }
                        , function (error) {
                            console.log("error: ", error);

                        }
                    );
                }
                else {
                    if (consoleLoggingOn) console.log("unable to subscribe to push notifications");
                }


            });
        }
        else {
            //TODO: comment this out after testing
            //NOTE: this code is for testing only. We will test getting logged in user information from web server using ajax

            if (consoleLoggingOn) {
                console.log("already subscribed");
                // for testing, add unscribe button to DOM 
                var dom = document.getElementById("ProfileID");
                var button = document.createElement("span");
                button.className = "btn btn-primary";
                button.innerHTML = "UnSubscribe";
                button.serviceWorkerRegistration = serviceWorkerRegistration; //bind serviceWorkerRegistration to the element using prototype chain inheritance
                dom.appendChild(button);
                button.addEventListener("click", function (e) {
                    unsubscribe(e.target.serviceWorkerRegistration);
                }, false);

            }

        }
    });
}

```


# WebPush With VAPID

> NOTE: this is detailed information on Web Push Protocol

Client browser app requests VAPID public key from Web Api REST server.

Receive public VAPID from Web Api REST server.

> NOTE: Firebase has our public and private VAPID stored in our firebase console (account).
> The VAPID is actually generated once and store in Firebase console. Our Web Api server
> will store the VAPID Public and Private key in static config file.

Client browser app makes request for Web Push Subscription from 
built in service. In Chrome, the browser will request the Web Push Subscription
from Firebase using VAPID public key.

The VAPID public key has to be converted to Uint8Array before the request for subscription.

```javascript
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```


example javascript request for subscription using the Uint8Array of public VAPID key
```javascript

// VAPID is the public VAPID key
let options = {
	userVisibleOnly: true,
	applicationServerKey: this.service.urlB64ToUint8Array(this.service.VAPID)
};
```

In firefox or any other browser, they will make the request to their built
in subscription endpoint using the VAPID public key.

```javascript
serviceWorkerRegistration.pushManager.subscribe(options)
	.then((pushSubscription: PushSubscription) => {
		// got pushSubscription. 
		// pushSubscription.getKey('p256dh') for the PublicKey
		// pushSubscription.getKey('auth') for the AuthKey
	})
	.catch((e) => {
		// error
	});;
```
When the subscription is received, the client application has to retrieve the 
userPublic key and the userAuth key.

The userPublic key is retrieved using subscription.getKey(keyName). keyName is a string 'p256dh'.

The userAuth key is retrieve using subscription.getKey(keyName). keyName is a string 'auth'.

After the public and auth key are retrieved. We will store this 
information and the subscription.endpoint on the WebApi server database.

Make a REST post to the WebApi Server to store this information along with the users email, 
ServiceProviderName: string, ApplicationName: string. The email, serviceProviderName, and ApplicationName
form a unique key in dbo.LvcPushNotificationSubscription.

Another client can then send a message or push to this user using their email, serviceProviderName, and ApplicationName.

The post is sent to WebApi Server. Web Api server will retrieve the other users LvcPushNotificationSubscription
and send the push message to FCM. FCM server will then push the message to
the client application.

## Safari Push

Generate a pushPackage.zip and place it on our webapi at the specific endpoint

```csharp
[HttpPost, AllowAnonymous, Route("~/v2/pushPackages/web.com.livenetvideo")]
public HttpResponseMessage RequestApnsZipPackage()
{
	//Trace.TraceInformation("Returning website package");
	var root = HttpRuntime.AppDomainAppPath;
	var path = root + @"/Content/pushPackage.zip";

	var result = new HttpResponseMessage(HttpStatusCode.OK);

	try
	{
		var stream = new FileStream(path, FileMode.Open, FileAccess.Read);
		result.Content = new StreamContent(stream);
	}
	catch (Exception e)
	{
		result.Content = new StringContent(e.Message.ToString());
	}

	result.Content.Headers.ContentType = new MediaTypeHeaderValue("application/zip");
	result.Content.Headers.ContentDisposition
		= new ContentDispositionHeaderValue("attachment")
		{
			FileName = "pushPackage.zip"
		};

	return result;
}
```

The pushPackage.zip needs to contain the following files:

* MyPushPackage.pushpackage  
  + icon.iconset  
    * icon_128x128@2x.png  
    * icon_128x128.png  
    * icon_32x32@2x.png  
    * icon_32x32.png  
    * icon_16x16@2x.png  
    * icon_16x16.png  
  + manifest.json  
  + signature  
  + website.json 

manifest.json and signature are generated using a php script.

Create your certificate from your apple developer console.
You will need to create a CSR and go through the process of 
requesting a certificate from Certificate Authority. At the end
you will have a .p12 file. (There are lots of tutorials online for this)

You will need the .p12 certificate and the password for the certificate
when generating the manifest and and signature.

// TODO: maybe port the php code to Csharp and generate the safari push package
on the fly from webapi. This way we can populate authenticationToken with jwtToken to 
identify the user.

NOTE: currently you can generate the files from 
`https://livenetvideo.com/ApnsPushPackage/createPushPackage.php`

The certificate and all the needed files are located in ApnsPushPackage folder
on infolinkdb3 E:\www2\LiveNetVideo.com\public_html\ApnsPushPackage. Make sure
to delete the tmp folder or rename before generating a new push Package.

> NOTE: if you try to zip the files manually with 7zip it won't work. You will 
> keep getting file missing error from safari. Let the php script zip up the files
> and use the zip file from the php script and safari will recognize the files in the
> zip file.

```php
<?php

// This script creates a valid push package.
// This script assumes that the website.json file and iconset already exist. 
// This script creates a manifest and signature, zips the folder, and returns the push package. 

// Use this script as an example to generate a push package dynamically.

$package_version = 2;               // Change this to the desired push package version.

$certificate_path = "Certificates.p12";     // Change this to the path where your certificate is located
$certificate_password = "national1"; // Change this to the certificate's import password

// Convenience function that returns an array of raw files needed to construct the package.
function raw_files() {
    return array(
        'icon.iconset/icon_16x16.png',
        'icon.iconset/icon_16x16@2x.png',
        'icon.iconset/icon_32x32.png',
        'icon.iconset/icon_32x32@2x.png',
        'icon.iconset/icon_128x128.png',
        'icon.iconset/icon_128x128@2x.png',
        'website.json'
    );
}

// Copies the raw push package files to $package_dir.
function copy_raw_push_package_files($package_dir) {
    mkdir($package_dir . '/icon.iconset', 0777, true);

    foreach (raw_files() as $raw_file) {
        var_dump($raw_file);
        echo "<br />";
        $source = $raw_file;
        echo $source;
        echo "<br />";
        $destination = $package_dir."/".$raw_file;
        echo $destination;
        echo "<br />";
        copy($source, $destination);
    }
}

// Creates the manifest by calculating the hashes for all of the raw files in the package.
function create_manifest($package_dir, $package_version) {

    echo "creating manifest ".$package_dir."<br />";
    // Obtain hashes of all the files in the push package
    $manifest_data = array();
    foreach (raw_files() as $raw_file) {
        $file_contents = file_get_contents("$package_dir/$raw_file");
        if ($package_version === 1) {
            $manifest_data[$raw_file] = sha1($file_contents);
        } else if ($package_version === 2) {
            $hashType = 'sha512';
            $manifest_data[$raw_file] = array(
                'hashType' => $hashType,
                'hashValue' => hash($hashType, $file_contents),
            );
        } else {
            throw new Exception('Invalid push package version.');
      }
    }
    file_put_contents($package_dir."/manifest.json", json_encode((object)$manifest_data));
}

// Creates a signature of the manifest using the push notification certificate.
function create_signature($package_dir, $cert_path, $cert_password) {
    // Load the push notification certificate

    echo "creating signature<br />";

    echo "package_dir:".$package_dir."<br />";



    $pkcs12 = file_get_contents($cert_path);
    $certs = array();
    if(!openssl_pkcs12_read($pkcs12, $certs, $cert_password)) {
        return;
    }

    $signature_path = $package_dir."/signature";

    echo "signature_path: ".$signature_path."<br />";

    // Sign the manifest.json file with the private key from the certificate
    $cert_data = openssl_x509_read($certs['cert']);
    echo "cert_data<br />";
    var_dump($cert_data);
    echo "<br />";
    $private_key = openssl_pkey_get_private($certs['pkey'], $cert_password);
    echo "private key<br />";

    var_dump($private_key);
    echo "<br/>";

    openssl_pkcs7_sign($package_dir."/manifest.json", $signature_path, $cert_data, $private_key, array(), PKCS7_BINARY | PKCS7_DETACHED);

    // Convert the signature from PEM to DER
    $signature_pem = file_get_contents($signature_path);
    echo "signature_pem<br />";
    var_dump($signature_pem);
    echo "<br />";

    $matches = array();
    if (!preg_match('~Content-Disposition:[^\n]+\s*?([A-Za-z0-9+=/\r\n]+)\s*?-----~', $signature_pem, $matches)) {
        return;
    }

    echo "Matches<br />";
    var_dump($matches);
    echo "<br />";
    $signature_der = base64_decode($matches[1]);
    echo "signature_der<br />";
    var_dump($signature_der);
    file_put_contents($signature_path, $signature_der);
}

// Zips the directory structure into a push package, and returns the path to the archive.
function package_raw_data($package_dir) {
    $zip_path = $package_dir.".zip";

    // Package files as a zip file
    $zip = new ZipArchive();
    if (!$zip->open($package_dir.".zip", ZIPARCHIVE::CREATE)) {
        error_log('Could not create ' . $zip_path);
        return;
    }

    $raw_files = raw_files();
    $raw_files[] = 'manifest.json';
    $raw_files[] = 'signature';
    foreach ($raw_files as $raw_file) {
        $zip->addFile($package_dir."/".$raw_file, $raw_file);
    }

    $zip->close();
    return $zip_path;
}

// Creates the push package, and returns the path to the archive.
function create_push_package() {
    global $certificate_path, $certificate_password, $package_version;

    // Create a temporary directory in which to assemble the push package
    $package_dir = 'tmp/pushPackage' . time();

   if (!mkdir($package_dir, 0777, true)) {
        unlink($package_dir);
		echo "no path";
		die;
    }

    copy_raw_push_package_files($package_dir);
    create_manifest($package_dir, $package_version);
    create_signature($package_dir, $certificate_path, $certificate_password);
    $package_path = package_raw_data($package_dir);

    return $package_path;
}





// MAIN
//$package_path = create_push_package();
//if (empty($package_path)) {
//    http_response_code(500);
//    echo "empty path";
//	die;
//}
//
//header("Content-type: application/zip");
//echo file_get_contents($package_path);
//echo "done";
//die;


// create only the manifest and the signature, we will zip manually

function create_manifest_and_signature(){

    echo "creating manifest and signature<br />";
    global $certificate_path, $certificate_password, $package_version;

    $package_root = 'tmp';

    //$package_dir = 'tmp/pushPackage' . time();
    $package_dir = 'tmp/pushPackage';

    if(mkdir($package_root, 0777)) {
        if (mkdir($package_dir, 0777, true)) {
            copy_raw_push_package_files($package_dir);
            create_manifest($package_dir, $package_version);
            create_signature($package_dir, $certificate_path, $certificate_password);

            return;
        }
        else {
            unlink($package_dir);
            echo "no tmp/pushPackage path";
            die;
        }
    }
    else {
        echo "no tmp path";
        die;
    }

}

create_manifest_and_signature();


echo "done";
die;

```

manifest.json
```json
{  
    "websiteName": "website name",  
    "websitePushID": "web.com.livenetvideo",  
    "allowedDomains": ["https://livenetvideo.com"],  
    "urlFormatString": "https://livenetvideo.com/%@/",  
    "authenticationToken": "19f8d7a6e9fb8a7f6d9330dabe",  
    "webServiceURL": "https://nofb.org/LNVApi"  
}
```

The client ts code for getting permission
```javascript
private async startSafariPush(): Promise<void> {
		console.log("starting safari push");

		let permissionData = window["safari"].pushNotification.permission(this.configService.safariPushId);
		this.checkRemotePermission(permissionData);
		return;
	}

	// method for safari only
	private checkRemotePermission(permissionData: any): void {
		console.log("checking remote permission: ", permissionData);
		console.log("window: ", window);
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
				this.checkRemotePermission         // The callback function.
			);
		}
		else if (permissionData.permission === 'denied') {
			// The user said no.
			console.log("safari permission denied");
			return;
		}
		else if (permissionData.permission === 'granted') {
			// The web service URL is a valid push provider, and the user said yes.
			// permissionData.deviceToken is now available to use.
			console.log("safari deviceToken: ", permissionData.deviceToken);
			return;
		}
		else {
			console.log("no permissionData");
			return;
		}
	}
```



