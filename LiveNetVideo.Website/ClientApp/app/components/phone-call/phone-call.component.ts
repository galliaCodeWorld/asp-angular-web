import { Component, OnInit, Input, ViewChild, Output, EventEmitter, ElementRef, NgZone, HostBinding } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
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
	HubConnection,
	GenericUserType
} from '../../models/index'

import {
	EmailValidator,
	PasswordValidator,
	Service,
} from '../../services/index'
import { MatMenuTrigger } from '@angular/material';

//import 'webrtc-adapter';

@Component({
	selector: 'phone-call-component',
	templateUrl: 'phone-call.component.html',
	styleUrls: ['./phone-call.component.scss'],
	host: { 'class': 'col-lg-2 col-md-2 col-sm-3 col-xs-4' }
})
export class PhoneCallComponent implements OnInit {
	public className = "PhoneCallComponent";
	constructor(

		public formBuilder: FormBuilder,
		private service: Service,
		public ngZone: NgZone,
		private sanitizer: DomSanitizer,
	) {
		this.isActive = false;
		this.isOnHold = false;
		this.isVisible = false;
	}

	//NOTE: fxFlex can not be compiled dynamically by angular, so you can't dynamically create fxFlex elements
	// the styling has to be added statically using HostBinding
	@HostBinding('attr.style') style: SafeStyle = this.sanitizer.bypassSecurityTrustStyle("flex: 1 1 100%; box-sizing: border-box; max-width: 13%; margin-right: 10px;");

	isVisible: boolean;
	//videoWidth;
	//videoHeight;

	_isOnHold: boolean;
	get isOnHold(): boolean {
		return this._isOnHold;
	}
	set isOnHold(value: boolean) {
		//if (this.remoteVideoElement) {
		//	//console.log("nativeElement: ", this.remoteVideoElement.nativeElement);

		//	let { clientHeight, clientWidth } = this.remoteVideoElement.nativeElement as HTMLVideoElement;
		//	console.log(clientHeight, clientWidth)
		//	if (value) {
		//		this.videoHeight = clientHeight;
		//		this.videoWidth = clientWidth;
		//		//this.placeHolder.nativeElement.style.height = this.videoHeight.toString() + "px";
		//		//this.placeHolder.nativeElement.style.width = this.videoWidth.toString() + "px";
		//	}
		//}

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
	//@ViewChild('placeHolder') placeHolder: ElementRef;

	// NOTE: send data back to parent using eventEmitter,
	// child this.onEndPhoneCallComponent.emit(this.caller);
	// parent should have method in class onEndPhoneCallComponent(call: CallType) which will trigger when child emits event
	@Output() onEndPhoneCallComponent: EventEmitter<CallerType> = new EventEmitter<CallerType>();
	@Output() onShowToMainVideo: EventEmitter<MediaStream> = new EventEmitter<MediaStream>();
	@Output() onCloseFromMainVideo: EventEmitter<string> = new EventEmitter<string>();
	@Output() onOpenPrivateSmsInterface: EventEmitter<string> = new EventEmitter<string>();
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

	canMaxView: boolean = true;

	ngOnInit() {
	}

	// start RtcPeerConnection listeners
	async startPeerConnectionListeners(): Promise<void> {
		//console.log("starting pc listeners");
		try {
			this.pc.oniceconnectionstatechange = (evt: Event) => {
				console.log("pc.oniceconnectionstatechange event: ", evt);

				this.iceStateChangeHandler(this.pc.iceConnectionState);
			}

			//NOTE: this is not implemented by the current RtcPeerConnection object
			//this.pc.onconnectionstatechange = (evt: Event) => {
			//	console.log("pc.onconnectionstatechange event: ", evt);
			//}

			this.pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
				try {
					//console.log("sending ice: ", event.candidate);
					this.sendICE(event.candidate, this.caller.remoteGuid)
				}
				catch (e) {
					console.log("send ice error: ", e);
				}

				//.then(() => {
				//	console.log("ice sent: ", event.candidate);
				//})
				//.catch((error) => {
				//	console.log("send ice error: ", error);
				//})
			};

			this.pc.onnegotiationneeded = (event) => {
				//note this gets called by webrtc built in code
				console.log("onnegogiationneeded evt:", event);

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

			this.pc.ontrack = async (t: RTCTrackEvent) => {
				this.remoteStream = t.streams[0];
				// render the dom
				this.isActive = true;

				console.log("received remote stream: ", this.remoteStream);
				let videoElement: HTMLVideoElement = this.remoteVideoElement.nativeElement;
				// attach the remote video to the components video element
				try {
					this.isVisible = true;
					await this.service.attachMediaStream(videoElement, this.remoteStream, this.caller.remoteGuid);
					videoElement.muted = false;
					videoElement.play();

					//this.showToMainVideo();
				}
				catch (e) {
					console.log(" this.pc.onaddstream error: ", e);
				}
			}

			//// NOTE: when we receive a remote media stream
			//this.pc.onaddstream = async (event: MediaStreamEvent) => {
			//	console.log("reveiced Remote Stream: ", event.stream);
			//	this.remoteStream = event.stream;
			//	// render the dom
			//	this.isActive = true;

			//	//console.log("received remote stream: ", this.remoteStream);
			//	let videoElement: HTMLVideoElement = this.remoteVideoElement.nativeElement;
			//	// attach the remote video to the components video element
			//	try {
			//		this.isVisible = true;
			//		await this.service.attachMediaStream(videoElement, this.remoteStream);

			//		videoElement.muted = false;
			//		videoElement.play();
			//	}
			//	catch (e) {
			//		console.log(" this.pc.onaddstream error: ", e);
			//	}
			//};

			return;
		}
		catch (e) {
			throw (e);
		}
	}

	iceStateChangeHandler(status: RTCIceConnectionState) {
		// TODO: handle the different webrtc ice connection states

		//console.log("iceStateChange: ", status);

		if (status === "closed") {
			//console.log("phone-call-component.ts iceStateChangeHandler() state: ", status);
			//console.log("closed: ", evt);
			this.endCall();
		}
		else if (status === "failed") {
			//console.log("phone-call-component.ts iceStateChangeHandler() state: ", status);
			this.endCall();
		}
		else if (status === "disconnected") {
			//console.log("phone-call-component.ts iceStateChangeHandler() state: ", status);
			this.endCall();
		} else if (status === 'completed') {
			this.isConnectionCompleted = true;
		}
	};

	// Note: this will be called by the caller after their call is accepted by the other user
	// the caller webRtcHub listener will receiveAcceptCall response
	async startP2pConnection(): Promise<void> {
		//console.log("starting P2pConnection");
		try {
			let localSdpOffer: RTCSessionDescriptionInit;
			localSdpOffer = await this.pc.createOffer();
			await this.pc.setLocalDescription(localSdpOffer);
			await this.sendSDP(this.pc.localDescription, this.caller.remoteGuid);
			return;
		}
		catch (e) {
			throw (e);
		}
	}

	// the parent component phone-test.ts will pass the sdp info to this component
	async receiveSDP(sdp: RTCSessionDescription): Promise<void> {
		try {
			console.log("receiveSDP: ", sdp);
			// in the sysetm: when we receive sdp, we set it on pc
			await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));

			// in the system: if the sdp is an offer, then we create an answer.
			if (this.pc.remoteDescription.type === 'offer') {
				let localSdpAnswer: RTCSessionDescriptionInit;
				localSdpAnswer = await this.pc.createAnswer();
				await this.pc.setLocalDescription(localSdpAnswer);
				await this.sendSDP(this.pc.localDescription, this.caller.remoteGuid);
			}

			return;
		}
		catch (e) {
			throw (e);
		}
	}

	async sendSDP(sdp: RTCSessionDescriptionInit, remoteGuid: string): Promise<void> {
		try {
			// TODO: implement sendLocalSDP
			console.log("sending SDP: ", sdp);
			await this.service.sendSDP(this.caller.remoteGuid, this.service.stringify(sdp));
			return;
		}
		catch (e) {
			throw (e);
		}
	}

	async receiveICE(ice: RTCIceCandidate): Promise<void> {
		try {
			// in the sysetm: when we receive sdp, we set it on pc

			if (this.service.isEmpty(ice)) {
				//await this.pc.addIceCandidate(null);
				console.log("remote ICE: ", ice);
			}
			else {
				await this.pc.addIceCandidate(new RTCIceCandidate(ice));
			}

			return;
		}
		catch (e) {
			throw (e);
		}
	}

	async sendICE(candidate: RTCIceCandidate, remoteGuid: string): Promise<void> {
		try {
			// TODO: implement sendLocalSDP
			//console.log("sending local ICE candidate: ", candidate);
			await this.service.sendICE(this.caller.remoteGuid, this.service.stringify(candidate));
			return;
		}
		catch (e) {
			throw (e);
		}
	}

	addLocalStream(localStream: MediaStream): void {
		localStream.getTracks().forEach((t: MediaStreamTrack) => {
			this.pc.addTrack(t, localStream);
		});

		//this.pc.addStream(localStream);
	}

	endCall(): void {
		//console.log("phone-call.component.ts endCall() caller: ", this.caller);
		this.onEndPhoneCallComponent.emit(this.caller);
	}

	phoneCallClicked(event: any) {
		console.log("phoneCallComponent clicked event: ", event);
		this.ngZone.run(() => {
			this.trigger.toggleMenu();
		})
	}

	private putOnHold() {
		this.service.sendPutOnHold(this.caller.remoteGuid)
			.then(() => {
				this.isOnHold = true; // displays the remove on hold button
				this.onShowToMainVideo.emit(null);
			})
			.catch((error) => {
				console.log("phone-call.component.ts -> putOnHold error", error);
			});
	}

	private removeOnHold() {
		console.log("remove onhold called")

		this.service.sendRemoveOnHold(this.caller.remoteGuid)
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
		if (this.service.isEmpty(this.isOnHold)) {
			console.log("emit onShowToMainVideo remoteStream: ", this.remoteStream);
			this.remoteVideoElement.nativeElement.srcObject = null;
			this.onShowToMainVideo.emit(this.remoteStream);
			this.canMaxView = false;
		}
	}

	closeFromMainVideo() {
		this.onCloseFromMainVideo.emit(this.caller.remoteGuid);
	}

	async showToThumbVideo(): Promise<void> {
		//console.log("showToThumbVideo stream: ", this.remoteStream);
		let videoElement: HTMLVideoElement = this.remoteVideoElement.nativeElement;
		//this.onCloseFromMainVideo.emit(this.caller.remoteGuid);
		this.service.attachMediaStream(videoElement, this.remoteStream, this.caller.remoteGuid);
		videoElement.play();
		this.canMaxView = true;
	}

	openSendPrivateSmsInterface(): void {
		this.onOpenPrivateSmsInterface.emit(this.caller.remoteGuid);
	}
}