import { Component, EventEmitter, Output, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Service } from '../../services/index';
import { MaterialAlertMessageType } from "../../models/index";

@Component({
	selector: 'photo-camera',
	templateUrl: './photo-camera.component.html'
})
export class PhotoCameraComponent {
	constructor(
		private service: Service
	) {
		this.showPhoto = false;
		this.dataUri = "";
	}

	@Output() close: EventEmitter<string> = new EventEmitter<string>();
	@Output() onUsePhoto: EventEmitter<string> = new EventEmitter<string>();

	@ViewChild('videoElement') videoRef: ElementRef;
	@ViewChild('photoElement') photoRef: ElementRef;
	video: HTMLVideoElement;
	photo: HTMLImageElement;
	canvas: HTMLCanvasElement;
	dataUri: string;
	showPhoto: boolean;

	ngOnInit() {
		this.canvas = document.createElement('canvas');
		this.video = this.videoRef.nativeElement;
		this.photo = this.photoRef.nativeElement;
		let constraints = { video: true, audio: false };
		this.startCamera(constraints, this.video);
	}

	ngOnDestroy() {
		this.stopCamera(this.video);
	}

	startCamera(constraints: MediaStreamConstraints, video: HTMLVideoElement): void {
		navigator.mediaDevices.getUserMedia(constraints)
			.then((mediaStream: MediaStream) => {
				video.srcObject = mediaStream;
				video.play();
			})
			.catch((error) => {
				let alert = new MaterialAlertMessageType();
				alert.title = "Camera Error";
				alert.message = "Unable to retrieve video. Unable to retrieve a camera";
				this.service.openAlert(alert);
			});
	}

	stopCamera(video: HTMLVideoElement): void {
		if (video && video.srcObject) {
			video.srcObject = null;

			//video.srcObject.getTracks().forEach(track => track.stop());
		}
	}

	takePhoto(): void {
		let context = this.canvas.getContext('2d');

		let width: number = this.video.clientWidth;
		let height: number = this.video.clientHeight;

		this.canvas.width = width;
		this.canvas.height = height;

		context.drawImage(this.video, 0, 0, width, height);

		this.dataUri = this.canvas.toDataURL('image/png');
		this.photo.setAttribute('src', this.dataUri);
		this.showPhoto = true;
	}

	usePhoto(): void {
		this.onUsePhoto.emit(this.dataUri);
		this.showPhoto = false;
	}

	discardPhoto(): void {
		this.dataUri = "";
		this.showPhoto = false;
		this.photo.setAttribute('src', this.dataUri);
	}
}