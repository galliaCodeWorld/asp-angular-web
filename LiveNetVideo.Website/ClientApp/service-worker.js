'use strict';

//self is the serviceWorker

var consoleLoggingOn = true;
var antiForgeryTokenParam = "";
var baseAjaxUrl = "https://nofb.org/LNVApi/";

// "install" event
self.addEventListener('install', function (event) {
	self.skipWaiting();
	console.log('oninstall', event);
});

// "active" event
self.addEventListener('activate', function (event) {
	event.waitUntil(clients.claim());
	console.log('onactivate', event);
});

// listen for message sent to service worker from serviceWorkerRegistration.active.postMessage(JSON.stringify({ antiForgeryTokenParam : antiForgeryTokenParam }));
self.addEventListener('message', function (event) {
	//NOTE: we are not currently using this

	console.log("onmessage", event);

	if (typeof event !== "undefined" && event.data !== "undefined" && event.data != null && event.data) {
		try {
			var data = JSON.parse(event.data);
			if (typeof data.addEventListener !== "undefined") {
				self.antiForgeryTokenParam = data.antiForgeryTokenParam;
				//self.baseAjaxUrl = data.baseAjaxUrl;
				console.log("data: ", data);

				var options = {
					body: 'This notification was generated from a push!',
					icon: 'assets/images/bz.png',
					vibrate: [100, 50, 100],
					data: {
						dateOfArrival: Date.now(),
						primaryKey: '2'
					},
					actions: [
						{
							action: 'explore', title: 'Explore this new world',
							icon: 'images/default-avatar.png'
						},
						{
							action: 'close', title: 'Close',
							icon: '../images/default-avatar.png'
						},
					]
				};
				event.waitUntil(
					self.registration.showNotification('Hello world!', options)
				);
			}
		}
		catch (e) {
			console.log("Exception: ", e);
		}
	}

	//console.log("SW Received Message:");
	//console.log(data);

	//self.userToken = data.token;
});

// "push" event, when a push message occurs
self.addEventListener('push', function (event) {
	console.log("onpush: ", event);
	/*
	const data = JSON.parse(event.data.text());

	event.waitUntil(
		registration.showNotification(data.title, {
			body: data.message,
			icon: 'images/toast-image.jpg'
		})
	);
	*/

	var options = {
		body: 'This notification was generated from a push!',
		icon: 'assets/images/bz.png',
		vibrate: [100, 50, 100],
		data: {
			dateOfArrival: Date.now(),
			primaryKey: '2'
		},
		actions: [
			{
				action: 'explore', title: 'Explore this new world',
				icon: 'images/default-avatar.png'
			},
			{
				action: 'close', title: 'Close',
				icon: '../images/default-avatar.png'
			},
		]
	};
	event.waitUntil(
		self.registration.showNotification('Hello world!', options)
	);

	//event.waitUntil(

	//	registration.pushManager.getSubscription()
	//		.then(function (subscription) {
	//			console.log("subscription: ", subscription);
	//		})

	//);
	return;
});

// ServiceWorkerRegistration.showNotification() has been clicked and will be handled by this event "notifiicationclick"
// "notificationclick" event
self.addEventListener('notificationclick', function (event) {
	console.log('Notification click: tag', event.notification.tag);
	// Android doesn't close the notification when you click it
	// See http://crbug.com/463146
	event.notification.close();
	//var url = 'https://livenetvideo.com/Phone/';
	var url = self.location.host + '/Phone/';
	// Check if there's already a tab open with this URL.
	// If yes: focus on the tab.
	// If no: open a tab with the URL.
	event.waitUntil(
		clients.matchAll({
			type: 'window',
			includeUncontrolled: true
		})
			.then(function (windowClients) {
				console.log('WindowClients', windowClients);
				for (var i = 0; i < windowClients.length; i++) {
					var client = windowClients[i];
					console.log('WindowClient', client);
					if (client.url === url && 'focus' in client) {
						return client.focus();
					}
				}
				if (clients.openWindow) {
					return clients.openWindow(url);
				}
			})
	);
});

self.addEventListener('pushsubscriptionchange', function (event) {
	console.log("pushsubscriptionchange: ", event);

	//event.waitUntil()
})