import { Component, OnInit, Input, ViewChild, Output, EventEmitter, ElementRef, NgZone } from '@angular/core';

import {
	Validators,
	FormBuilder,
	FormGroup
} from '@angular/forms';

import {
	PhoneCallActionPopover
} from '../index'

import {
	PhoneCallAction,
	JwtToken,
	CallerType,
	SdpMessageType,
	PhoneLineType,
	PhoneLineConnectionType,
	HubConnection
} from '../../models/index'

import {
	EmailValidator,
	PasswordValidator,
	LocalStorageService,
	ConfigService,
	JsHelperService,
	SignalrService,
	VideoHelperService
} from '../../services/index'
import { MatMenuTrigger } from '@angular/material';

//import 'webrtc-adapter';

@Component({
	selector: 'pbx-line-call-component',
	templateUrl: 'pbx-line-call.component.html',
	styleUrls: ['./pbx-line-call.component.scss']
})
export class PbxLineCallComponent implements OnInit {
	public className = "PhoneCallComponent";
	constructor(

		public formBuilder: FormBuilder,
		public configService: ConfigService,
		public localStorageService: LocalStorageService,
		public jsHelperService: JsHelperService,
		public signalrService: SignalrService,
		public videoHelperService: VideoHelperService,
		public ngZone: NgZone
	) {
		this.isActive = false;
		this.isOnHold = false;
	}

	videoWidth;
	videoHeight;

	_isOnHold: boolean;
	get isOnHold(): boolean {
		return this._isOnHold;
	}
	set isOnHold(value: boolean) {
		if (this.remoteVideoElement) {
			let { clientHeight, clientWidth } = this.remoteVideoElement.nativeElement as HTMLVideoElement;
			console.log(clientHeight, clientWidth)
			if (value) {
				this.videoHeight = clientHeight;
				this.videoWidth = clientWidth;
			}
		}

		this._isOnHold = value;
	}

	_isHolder: boolean = true; //everyone can hold everyone by default
	get isHolder(): boolean {
		return this._isHolder;
	}
	set isHolder(value: boolean) {
		this._isHolder = value;
	}

	_isActive: boolean;
	get isActive(): boolean {
		return this._isActive;
	}
	set isActive(value: boolean) {
		this._isActive = value;
	}

	isConnectionCompleted: boolean;
	@ViewChild('remoteVideoElement') remoteVideoElement: ElementRef;
	@ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

	// NOTE: send data back to parent using eventEmitter,
	// child this.onEndPhoneCallComponent.emit(this.caller);
	// parent should have method in class onEndPhoneCallComponent(call: CallType) which will trigger when child emits event
	@Output() onEndPhoneCallComponent: EventEmitter<CallerType> = new EventEmitter<CallerType>();
	@Output() onShowToMainVideo: EventEmitter<MediaStream> = new EventEmitter<MediaStream>();

	// NOTE: receive data from parent as attribute [pc]="aPropertyInParentClass"
	@Input('pc') pc: RTCPeerConnection;
	@Input('caller') caller: CallerType;

	_remoteStream: MediaStream;
	get remoteStream(): MediaStream {
		return this._remoteStream;
	}
	set remoteStream(value: MediaStream) {
		this._remoteStream = value;
	}

	ngOnInit() {
	}

	// start RtcPeerConnection listeners
	startPeerConnectionListeners(): Promise<void> {
		console.log("starting pc listeners");
		return new Promise<void>((resolve) => {
			this.pc.oniceconnectionstatechange = (evt: Event) => {
				console.log("phone-call.component.ts pc.oniceconnectionstatechange event: ", evt);

				this.iceStateChangeHandler(this.pc.iceConnectionState);
			}

			//NOTE: this is not implemented by the current RtcPeerConnection object
			//this.pc.onconnectionstatechange = (evt: Event) => {
			//	console.log("pc.onconnectionstatechange event: ", evt);
			//}

			this.pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
				this.sendICE(event.candidate, this.caller.remoteGuid)
					.then(() => {
						console.log("ice sent: ", event.candidate);
					})
					.catch((error) => {
						console.log("send ice error: ", error);
					})
			};

			this.pc.onnegotiationneeded = (event) => {
				//note this gets called by webrtc built in code
				//console.log("onnegogiationneeded evt:", event);

				//this.pc.createOffer(function (localSdpOffer) {
				//    sendLocalSdp(localSdpOffer);
				//}, logError);

				//this.pc.createOffer()
				//	.then((offer) => {
				//		return this.pc.setLocalDescription(offer);
				//	})
				//	.then(() => {
				//		// Send the offer to the remote peer through the signaling server
				//	})
				//	.catch((error) => {
				//	});
			};

			this.pc.ontrack = (t: RTCTrackEvent) => {
				this.remoteStream = t.streams[0];
				this.isActive = true;
				console.log("received remote stream: ", this.remoteStream);
				let videoElement: HTMLVideoElement = this.remoteVideoElement.nativeElement;
				// attach the remote video to the components video element
				this.videoHelperService.attachMediaStream(videoElement, this.remoteStream)
					.then(() => {
						videoElement.muted = false;
						videoElement.play();
					})
					.catch((error) => {
						console.log(" this.pc.onaddstream error: ", error);
					});
			};

			// NOTE: when we receive a remote media stream
			//this.pc.onaddstream = (event: MediaStreamEvent) => {
			//	this.remoteStream = event.stream;
			//	// render the dom
			//	this.isActive = true;
			//	console.log("received remote stream: ", this.remoteStream);
			//	let videoElement: HTMLVideoElement = this.remoteVideoElement.nativeElement;
			//	// attach the remote video to the components video element
			//	this.videoHelperService.attachMediaStream(videoElement, this.remoteStream)
			//		.then(() => {
			//			videoElement.muted = false;
			//			videoElement.play();
			//		})
			//		.catch((error) => {
			//			console.log(" this.pc.onaddstream error: ", error);
			//		});
			//};

			resolve();
		});
	}

	iceStateChangeHandler(status: RTCIceConnectionState) {
		// TODO: handle the different webrtc ice connection states

		console.log("phone-call.component.ts iceStateChangeHandler() status: ", status);

		if (status === "closed") {
			console.log("phone-call-component.ts iceStateChangeHandler() state: ", status);
			//console.log("closed: ", evt);
			this.endCall();
		}
		else if (status === "failed") {
			console.log("phone-call-component.ts iceStateChangeHandler() state: ", status);
			this.endCall();
		}
		else if (status === "disconnected") {
			console.log("phone-call-component.ts iceStateChangeHandler() state: ", status);
			this.endCall();
		} else if (status === 'completed') {
			this.isConnectionCompleted = true;
		}
	};

	// Note: this will be called by the caller after their call is accepted by the other user
	// the caller webRtcHub listener will receiveAcceptCall response
	startP2pConnection(): Promise<void> {
		console.log("starting P2pConnection");
		return new Promise<void>((resolve, reject) => {
			this.pc.createOffer()
				.then((localSdpOffer) => {
					return this.pc.setLocalDescription(localSdpOffer);
				})
				.then(() => {
					console.log("created localSdpOffer: ", this.pc.localDescription);
					return this.sendSDP(this.pc.localDescription, this.caller.remoteGuid);
				})
				.then(() => {
					console.log("locaSdpOffer sent to: ", this.caller.remoteGuid);
					resolve();
				})
				.catch((error) => {
					reject(error);
				})
		});
	}

	// the parent component phone-test.ts will pass the sdp info to this component
	receiveSDP(sdp: RTCSessionDescription): Promise<void> {
		let methodName = "receiveSDP";
		console.log("receivedSDP from phone-test: ", sdp);
		return new Promise<void>((resolve, reject) => {
			// in the sysetm: when we receive sdp, we set it on pc
			this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
				.then(() => {
					console.log("setRemoteDescription done:", this.pc.remoteDescription);
					// in the system: if the sdp is an offer, then we create an answer.
					if (this.pc.remoteDescription.type === 'offer') {
						this.pc.createAnswer()
							.then((localSdpAnswer) => {
								return this.pc.setLocalDescription(localSdpAnswer);
							})
							.then(() => {
								console.log("created localSdpAnwer: ", this.pc.localDescription);
								return this.sendSDP(this.pc.localDescription, this.caller.remoteGuid);

								//.catch((error) => {
								//	let errorMessage = this.className + "." + methodName + " send sdp answer error: " + this.jsHelperService.stringify(error);
								//	console.log(errorMessage);
								//	reject(errorMessage);
								//});
							})
							.then(() => {
								console.log("sent localSdpAnswer to: ", this.caller.remoteGuid);
								resolve();
							})
							.catch((error) => {
								let errorMessage = this.className + "." + methodName + " create sdp answer error: " + this.jsHelperService.stringify(error);
								console.log(errorMessage);
								reject(errorMessage);
							});
					}
					else {
						resolve();
					}
				})
				.catch((error) => {
					let errorMessage = this.className + "." + methodName + " setRemoteDescription error: " + this.jsHelperService.stringify(error);
					console.log(errorMessage);
					reject(errorMessage);
				});
		});
	}

	sendSDP(sdp: RTCSessionDescriptionInit, remoteGuid: string): Promise<void> {
		let methodName = "sendSDP";
		console.log("phone-component sending SDP: ", sdp, remoteGuid);
		return new Promise<void>((resolve, reject) => {
			// TODO: implement sendLocalSDP
			this.signalrService.sendSDP(this.caller.remoteGuid, this.jsHelperService.stringify(sdp))
				.then(() => {
					resolve();
				})
				.catch((error) => {
					reject(methodName + ": " + this.jsHelperService.stringify(error));
				})
		});
	}

	receiveICE(ice: RTCIceCandidate): Promise<void> {
		let methodName = "receiveSDP";
		console.log("receiveICE from phone-test: ", ice);
		return new Promise<void>((resolve, reject) => {
			// in the sysetm: when we receive sdp, we set it on pc
			this.pc.addIceCandidate(new RTCIceCandidate(ice))
				.then(() => {
					resolve();
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	sendICE(candidate: RTCIceCandidate, remoteGuid: string): Promise<void> {
		let methodName = "sendICE";
		console.log("phone-component sending ICE candidate: ", candidate, remoteGuid);
		return new Promise<void>((resolve, reject) => {
			// TODO: implement sendLocalSDP
			this.signalrService.sendICE(this.caller.remoteGuid, this.jsHelperService.stringify(candidate))
				.then(() => {
					resolve();
				})
				.catch((error) => {
					reject(methodName + ": " + this.jsHelperService.stringify(error));
				})
		});
	}

	addLocalStream(localStream: MediaStream): void {
		try {
			localStream.getTracks().forEach((t: MediaStreamTrack) => {
				this.pc.addTrack(t, localStream);
			})

			//this.pc.addStream(localStream);
		}
		catch (e) {
			throw (e);
		}
	}

	endCall() {
		console.log("phone-call.component.ts endCall() caller: ", this.caller);
		this.onEndPhoneCallComponent.emit(this.caller);
	}

	phoneCallClicked(event: any) {
		this.ngZone.run(() => {
			this.trigger.toggleMenu();
		})
	}

	private putOnHold() {
		this.signalrService.sendPutOnHold(this.caller.remoteGuid)
			.then(() => {
				this.isOnHold = true; // displays the remove on hold button
			})
			.catch((error) => {
				console.log("phone-call.component.ts -> putOnHold error", error);
			});
	}

	private removeOnHold() {
		console.log("remove onhold called")

		this.signalrService.sendRemoveOnHold(this.caller.remoteGuid)
			.then(() => {
				this.isOnHold = false; // hide the remove hold button
			})
			.catch((error) => {
				console.log("phone-call.component.ts -> removeOnHold error", error);
			});
	}

	//if this user has been put on hold; its not the holder
	public setHolded(isHolded) {
		this.isOnHold = isHolded;
		this.isHolder = !isHolded;
	}

	showToMainVideo() {
		this.onShowToMainVideo.emit(this.remoteStream)
	}
}