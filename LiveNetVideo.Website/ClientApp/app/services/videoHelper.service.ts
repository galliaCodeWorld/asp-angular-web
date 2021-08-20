import { Injectable } from '@angular/core';

import { JsHelperService } from './index';
//import 'webrtc-adapter';

@Injectable()
export class VideoHelperService {
	constructor(
		public jsHelperService: JsHelperService
	) { }

	getDummyMediaStream(): MediaStream {
		throw ("videoHelper.Service.getDummyMediaStream() not implemented");
		//let silentAudio = () => {
		//	let ctx: AudioContext = new AudioContext();
		//	let oscillator: OscillatorNode = ctx.createOscillator();
		//	let dst: AudioNode = oscillator.connect(ctx.createMediaStreamDestination());
		//	oscillator.start();
		//	return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
		//}

		//let blackVideo = ({ width = 640, height = 480 } = {}) => {
		//	let canvas = Object.assign(document.createElement("canvas"), { width, height });
		//	canvas.getContext('2d').fillRect(0, 0, width, height);
		//	let stream = canvas.captureStream();
		//	return Object.assign(stream.getVideoTracks()[0], { enabled: false });
		//}

		//let mediaStream = (...args) => new MediaStream([blackVideo(...args), silentAudio()]);

		//return mediaStream;
	}

	getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
		let methodName = "getMediaStream";
		return new Promise<MediaStream>((resolve, reject) => {
			navigator.mediaDevices.getUserMedia(constraints)
				.then((mediaStream: MediaStream) => {
					//console.log(mediaStream)
					resolve(mediaStream);
				})
				.catch((error) => {
					reject(methodName + " : navigator.mediaDevices.getUserMedia error: " + this.jsHelperService.stringify(error));
				});
		});
	}

	attachMediaStream(videoElement: HTMLVideoElement, stream: MediaStream, id?: string): Promise<void> {
		//console.log("attaching media stream videoElement, stream: ", videoElement, stream);
		return new Promise<void>((resolve, reject) => {
			videoElement.srcObject = stream;
			let dataId = typeof id !== "undefined" ? id : "";
			videoElement.setAttribute("data-id", dataId);
			resolve();
		});
	}

	getAllMediaSources(): Promise<Array<MediaDeviceInfo>> {
		let methodName = "getAllMediaSources";
		return new Promise<Array<MediaDeviceInfo>>((resolve, reject) => {
			let sourceMediaInfos = [];

			navigator.mediaDevices.enumerateDevices()
				.then((mediaDeviceInfos: MediaDeviceInfo[]) => {
					resolve(mediaDeviceInfos);
				})
				.catch((error) => {
					reject(methodName + ": navigator.mediaDevices.enumerateDevices error :" + this.jsHelperService.stringify(error));
				});
		});
	}

	getCameraSources(): Promise<Array<MediaDeviceInfo>> {
		let methodName = "getCameraSources";
		return new Promise<Array<MediaDeviceInfo>>((resolve, reject) => {
			let sourceMediaInfos = [];

			navigator.mediaDevices.enumerateDevices()
				.then((mediaDeviceInfos: MediaDeviceInfo[]) => {
					for (let i = 0; i < mediaDeviceInfos.length; i++) {
						if (mediaDeviceInfos[i].kind.toLowerCase() === "videoinput") {
							sourceMediaInfos.push(mediaDeviceInfos[i]);
						}
					}
					resolve(sourceMediaInfos);
				})
				.catch((error) => {
					reject(methodName + ": navigator.mediaDevices.enumerateDevices error :" + this.jsHelperService.stringify(error));
				});
		});
	}

	getFirstVideoDevice(): Promise<MediaDeviceInfo> {
		let methodName = "getFirstCameraDevice";
		return new Promise<MediaDeviceInfo>((resolve, reject) => {
			let mediaDeviceInfo: MediaDeviceInfo = null;
			navigator.mediaDevices.enumerateDevices()
				.then((mediaDeviceInfos: MediaDeviceInfo[]) => {
					for (let i = 0; i < mediaDeviceInfos.length; i++) {
						if (mediaDeviceInfos[i].kind.toLowerCase() === "videoinput") {
							mediaDeviceInfo = mediaDeviceInfos[i];
							break;
						}
					}

					if (this.jsHelperService.isEmpty(mediaDeviceInfo) === false) {
						resolve(mediaDeviceInfo);
					}
					else {
						reject(methodName + ": No media device found");
					}
				})
				.catch((error) => {
					reject(methodName + ":" + this.jsHelperService.stringify(error));
				});
		});
	}

	getMicSources(): Promise<Array<MediaDeviceInfo>> {
		let methodName = "getMicSources";
		return new Promise<Array<MediaDeviceInfo>>((resolve, reject) => {
			let sourceMediaInfos = [];

			navigator.mediaDevices.enumerateDevices()
				.then((mediaDeviceInfos: MediaDeviceInfo[]) => {
					for (let i = 0; i < mediaDeviceInfos.length; i++) {
						if (mediaDeviceInfos[i].kind.toLowerCase() === "audioinput") {
							sourceMediaInfos.push(mediaDeviceInfos[i]);
						}
					}
					resolve(sourceMediaInfos);
				})
				.catch((error) => {
					reject(methodName + ": navigator.mediaDevices.enumerateDevices error :" + this.jsHelperService.stringify(error));
				});
		});
	}

	clearMediaStream(videoElement: HTMLVideoElement): Promise<void> {
		return new Promise<void>((resolve) => {
			videoElement.srcObject = null;
			resolve();
		});
	}

	//getSupportedMediaTrackConstraints(): Promise<MediaTrackConstraints> {
	getSupportedMediaTrackConstraints(): Promise<MediaTrackSupportedConstraints> {
		let methodName = "getSupportedMediaTrackConstraints";
		return new Promise<MediaTrackSupportedConstraints>((resolve, reject) => {
			if (typeof navigator.mediaDevices !== undefined && navigator.mediaDevices.getSupportedConstraints !== undefined) {
				let supportedConstraints: MediaTrackSupportedConstraints = navigator.mediaDevices.getSupportedConstraints();
				if (this.jsHelperService.isEmpty(supportedConstraints) === false) {
					resolve(supportedConstraints);
				}
				else {
					reject(methodName + ": unable to get supported constraints");
				}
			}
			else {
				reject(methodName + ": there is no support for getSupportedConstraints");
			}
		});
	}
}