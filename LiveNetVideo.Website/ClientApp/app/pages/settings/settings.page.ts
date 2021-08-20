import { Component, ViewChild, ElementRef, OnDestroy, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import {
	Service
} from '../../services/index';

import { Subscription } from "rxjs/Subscription";
import {
	CallType,
	IncomingCallResponseEnum,
	ObservableMessageType,
	MaterialAlertMessageType,
} from "../../models/index";

@Component({
	styleUrls: ['settings.page.scss'],
	templateUrl: 'settings.page.html'
})
export class SettingsPage {
	constructor(
		public router: Router,
		public activatedRoute: ActivatedRoute,
		public location: Location,
		public service: Service,
		private ngZone: NgZone,
	) {
		//this.selectedDeviceId = this.service.activeVideoDeviceId;
		//this.localStream = new MediaStream();
	}

	canToggle: boolean;

	@ViewChild('localVideoElement') localVideoElement: ElementRef;
	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;

	selectedDevice: string;
	//localStream: MediaStream;
	_videoDeviceInfos: Array<MediaDeviceInfo>;
	get videoDeviceInfos(): Array<MediaDeviceInfo> {
		return this._videoDeviceInfos;
	}
	set videoDeviceInfos(value: Array<MediaDeviceInfo>) {
		this._videoDeviceInfos = value;
	}

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		this.startLocalVideo();
	}

	ngAfterViewInit() {
		this.ngZone.run(() => {
			setTimeout(() => {
				if (window.innerWidth < 500) {
					this._container.close();
				}
				else {
					this._container.open();
				}
			}, 250);
		});
	}

	ngOnDestroy(): void {
		this.stopLocalVideo()
	}

	async startLocalVideo(): Promise<void> {
		this.canToggle = false;
		try {
			//this.localVideoElement.nativeElement.load();
			this.stopLocalVideo();

			let mediaDeviceInfos: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();

			if (this.service.isEmpty(mediaDeviceInfos)) {
				throw ("No media devices found");
			}

			console.log("mediaDeviceInfos: ", mediaDeviceInfos);
			this.videoDeviceInfos = mediaDeviceInfos.filter(mediaDeviceInfo => {
				return mediaDeviceInfo.kind === "videoinput";
			});
			console.log("videoDeviceInfos: ", this.videoDeviceInfos);
			if (this.service.isEmpty(this.videoDeviceInfos) || this.videoDeviceInfos.length < 0) {
				throw ("There are no video devices.");
			}

			if (this.videoDeviceInfos.length > 1) {
				this.canToggle = true;
			}

			//if camera source has been selected before display that, else display front
			if (this.service.activeVideoDeviceId) {
				console.log("getting deviceId from storage");
				this.setVideoDeviceId(this.service.activeVideoDeviceId);
			} else if (this.videoDeviceInfos.length > 0) {
				console.log("getting default deviceId");
				this.setVideoDeviceId(this.videoDeviceInfos[0].deviceId);
			}
			else {
				throw ('No video devices found');
			}
			let stream: MediaStream;
			try {
				stream = await this.service.getLocalMediaStream();
			}
			catch (e) {
				console.log("this.service.getLocalMediaStream error: ", e);

				throw ("A camera is required and you must allow access to the camera to continue. If you previously denied access to the camera, please visit your browser settings to manually remove the restriction.")
			}

			this.service.localMediaStream = stream;
			console.log("stream: ", stream);
			this.service.attachMediaStream(this.localVideoElement.nativeElement, this.service.localMediaStream);
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = e.toString();
			this.service.openAlert(alert);
		}
	}

	async stopLocalVideo(): Promise<void> {
		if (this.service.isEmpty(this.service.localMediaStream) === false) {
			this.service.stopMediaStream(this.service.localMediaStream);
		}
		this.service.localMediaStream = null;

		this.localVideoElement.nativeElement.srcObject = null;

		return;
	}

	async setVideoDevice(deviceId: string): Promise<void> {
		try {
			let index = this.videoDeviceInfos.findIndex((d: MediaDeviceInfo) => {
				return d.deviceId == deviceId;
			})

			this.selectedDevice = "Camera " + (index + 1).toString();
			await this.setVideoDeviceId(deviceId);
			let stream: MediaStream;
			try {
				stream = await this.service.getLocalMediaStream();
			}
			catch (e) {
				console.log("getLocalMediaStream error: ", e);
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = "Unable to get video. Please make sure you have a camera attached and you have allowed permission to use the camera.";
				this.service.openAlert(alert);
			}

			this.service.localMediaStream = stream;

			await this.service.attachMediaStream(this.localVideoElement.nativeElement, this.service.localMediaStream);
			return;
		}
		catch (e) {
			throw (e);
		}
	}

	async setVideoDeviceId(deviceId: string): Promise<void> {
		this.service.activeVideoDeviceId = deviceId;
		return;
	}

	async toggleCamera(): Promise<void> {
		try {
			if (this.videoDeviceInfos.length < 1) {
				// the user doesn't have any video devices
				throw ("No video devices found.");
			}

			if (this.videoDeviceInfos.length === 1) {
				// only one video device, can not toggle if user only has one device
				throw ("Only 1 Video device available.");
			}

			// the user has more than one device to toggle

			let currentVideoDeviceId: string = this.service.activeVideoDeviceId;
			let lastIndex: number = this.videoDeviceInfos.length - 1;
			let nextIndex: number = -1;
			let index: number = this.videoDeviceInfos.findIndex((m: MediaDeviceInfo) => {
				return m.deviceId == currentVideoDeviceId;
			});

			if (index < 0) {
				throw ("No video device found.");
			}

			if (index < lastIndex) {
				nextIndex = index + 1;
			}
			else {
				nextIndex = 0;
			}

			this.setVideoDeviceId(this.videoDeviceInfos[nextIndex].deviceId);
			console.log("deviceId: ", this.service.activeVideoDeviceId);
			await this.stopLocalVideo();
			let mediaStream: MediaStream = await this.service.getLocalMediaStream();
			this.service.localMediaStream = mediaStream;
			this.localVideoElement.nativeElement.srcObject = this.service.localMediaStream;
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e.toString();
			this.service.openAlert(alert);
			return;
		}
	}
}