import { Component } from '@angular/core';

import * as $ from 'jquery';
import 'signalr';
import 'webrtc-adapter';
import {
	Router,
	ActivatedRoute
} from '@angular/router';

declare var MultiPlatformChat: any;
declare var VideoControls: any;

@Component({
	selector: 'home',
	templateUrl: './home.component.html'
})
export class HomeComponent {
	public ipResponse: string = "loading";

	constructor(
		public route: ActivatedRoute,
		public router: Router
	) {
		let self = this;
		console.log("started");
		$(function () {
			let jsHelper = new MultiPlatformChat.JsHelper();
			console.log("jsHelper: ", jsHelper);

			let config: any = {
				iceServers: [{
					urls: [
						'stun:stun.l.google.com:19302',
						"stun:stun1.l.google.com:19302",
						"stun:stun2.l.google.com:19302",
						"stun:stun3.l.google.com:19302",
						"stun:stun4.l.google.com:19302"
					]
				}]
			};

			let pc = new RTCPeerConnection(config);

			console.log("RTCPeerConnection: ", pc);

			let hubUrl = "https://nofb.org/SignalR";

			let connection = $.hubConnection(hubUrl, {});
			//console.log("connection:", connection);

			let clientIdHub = connection.createHubProxy("clientIdProxyHub");
			console.log("clientIdHub: ", clientIdHub);

			connection.start()
				.done(function () {
					console.log("connetion: ", connection);

					clientIdHub.invoke("requestIp")
						.done(function (response) {
							console.log("requestIp response: ", response);
							self.ipResponse = response;
						})
						.fail(function (error) {
							console.log("error: ", error);
						});
				})
				.fail(function (error) {
					console.log("connection start error:", error);
				})
		});
	}

	goToPhone(): void {
		this.router.navigate(['/phone'], { relativeTo: this.route });
	}
}