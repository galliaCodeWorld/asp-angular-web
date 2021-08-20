import { Injectable, ElementRef } from '@angular/core';

@Injectable()
export class CapturePhotoService {
	video: HTMLVideoElement;
	photo: HTMLImageElement;

	canvas: HTMLCanvasElement;

	constructor() {
		this.canvas = document.createElement('canvas');
	}

	isReady: boolean = false;

	/*
	initialize the capture service
	video - the video element to stream the camera with
	 */
	init(_video: HTMLVideoElement, _photo: HTMLImageElement) {
		this.video = _video;
		this.photo = _photo
	}

	//start the camera
	start() {
		navigator.getUserMedia(
			{
				video: true,
				audio: false
			},
			(stream) => {
				this.video.srcObject = stream;
				this.video.play();
				this.isReady = true;
			},
			(err) => {
				console.log("An error occured! " + err);
			}
		);
	}

	//stop the camera
	stop() {
		if (this.video && this.video.srcObject) {
			this.video.srcObject = null;
			//this.video.srcObject.getTracks().forEach(track => track.stop());
			this.isReady = false;
		}
	}

	takePicture() {
		var context = this.canvas.getContext('2d');

		let width: number = this.video.clientWidth;
		let height: number = this.video.clientHeight;

		this.canvas.width = width;
		this.canvas.height = height;

		context.drawImage(this.video, 0, 0, width, height);

		let pictureData: any = this.canvas.toDataURL('image/png');

		this.photo.setAttribute('src', pictureData);

		return pictureData;
	}
}