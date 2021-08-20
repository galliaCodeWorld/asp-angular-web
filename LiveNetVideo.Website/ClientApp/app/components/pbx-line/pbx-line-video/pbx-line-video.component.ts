import { Component, OnInit, ViewChild, ElementRef, } from '@angular/core';
import { Service } from "../../../services/index";

@Component({
	selector: 'pbx-line-video',
	templateUrl: 'pbx-line-video.component.html',
	styleUrls: ['./pbx-line-video.component.scss']
})
export class PbxLineVideoComponent implements OnInit {
	constructor(
		private service: Service) {
	}

	@ViewChild('localVideoElement') localVideoElement: ElementRef;
	@ViewChild('mainVideoElement') mainVideoElement: ElementRef;

	ngOnInit() {
		this.initLocalVideo()
	}

	async initLocalVideo(): Promise<void> {
		try {
			this.service.localMediaStream = null;

			this.localVideoElement.nativeElement.srcObject = null;
			let stream: MediaStream;
			try {
				stream = await this.service.getLocalMediaStream();
			}
			catch (e) {
				throw (e);
			}

			if (this.service.isEmpty(stream)) {
				throw ("Video stream is missing");
			}
			this.service.localMediaStream = stream;

			await this.service.attachMediaStream(this.localVideoElement.nativeElement, this.service.localMediaStream);

			this.localVideoElement.nativeElement.play();

			await this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.service.localMediaStream);

			this.mainVideoElement.nativeElement.play();
			return;
		}
		catch (e) {
			throw (e);
		}
	}
}