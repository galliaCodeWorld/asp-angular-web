import { Injectable, ComponentRef, Output, EventEmitter, } from '@angular/core';
import {
	SignalrService,
	JsHelperService,
	BlockCallService,
	SettingsService,
	VideoHelperService
} from './index';

import {
	PhoneLineType,
	PhoneLineConnectionType,
	ProfileDto,
	HubConnection,
	CurrentCallAttemptType,
	CallerType,
	CallType,
	IceMessageType,
	SdpMessageType,
	NotReadyForCallType
} from '../models/index';

import {
	PhoneCallComponent
} from "../components/index";

//import 'webrtc-adapter';

@Injectable()
export class PhoneService {
	constructor(
		public signalrService: SignalrService,
		public jsHelperService: JsHelperService,
		public blockCallService: BlockCallService,
		public settingsService: SettingsService,
		public videoHelperService: VideoHelperService
	) {
		//this.phoneLine = null;
		//this.localPhoneLineConnection = null;
		//this.emailToCall = "";
	}

	//_emailToCall: string;
	//get emailToCall(): string {
	//	// NOTE: the comsumer can only retrieve the email once.
	//	let email = this._emailToCall;
	//	this._emailToCall = "";
	//	return email;
	//}
	//set emailToCall(value: string) {
	//	this._emailToCall = value;
	//}

	//_acceptedCall: CallType;
	//set acceptedCall(value: CallType) {
	//	this._acceptedCall = value;
	//}
	//get acceptedCall(): CallType {
	//	return this._acceptedCall;
	//}

	//_localPhoneLineConnection: PhoneLineConnectionType;
	//get localPhoneLineConnection(): PhoneLineConnectionType {
	//	return this._localPhoneLineConnection;
	//}
	//set localPhoneLineConnection(value: PhoneLineConnectionType) {
	//	this._localPhoneLineConnection = value;
	//}

	//_phoneLine: PhoneLineType;
	//get phoneLine(): PhoneLineType {
	//	return this._phoneLine;
	//}
	//set phoneLine(value: PhoneLineType) {
	//	this._phoneLine = value;
	//}

	//_phoneLineOnHold: PhoneLineType;
	//get phoneLineOnHold(): PhoneLineType {
	//	return this._phoneLineOnHold;
	//}
	//set phoneLineOnHold(value: PhoneLineType) {
	//	this._phoneLineOnHold = value;
	//}

	//_localPhoneLineConnectionOnHold: PhoneLineConnectionType;
	//get localPhoneLineConnectionOnHold(): PhoneLineConnectionType {
	//	return this._localPhoneLineConnectionOnHold;
	//}
	//set localPhoneLineConnectionOnHold(value: PhoneLineConnectionType) {
	//	this._localPhoneLineConnectionOnHold = value;
	//}

	//_currentCallAttempt: CurrentCallAttemptType;
	//get currentCallAttempt(): CurrentCallAttemptType {
	//	return this._currentCallAttempt;
	//}
	//set currentCallAttempt(value: CurrentCallAttemptType) {
	//	this._currentCallAttempt = value;
	//}

	//_localGuid: string;
	//get localGuid(): string {
	//	return this._localGuid;
	//}
	//set localGuid(value: string) {
	//	this._localGuid = value;
	//}

	//_localMediaStream: MediaStream;
	//get localMediaStream(): MediaStream {
	//	return this._localMediaStream;
	//}
	//set localMediaStream(value: MediaStream) {
	//	this._localMediaStream = value;
	//}

	// if the phone is busy
	//isPhoneBusy(): boolean {
	//	//console.trace();
	//	// assume user is busy
	//	let isUserBusy = true;

	//	//console.log("phone.service.ts isBusy() phoneLine: ", this.phoneLine);

	//	if (this.jsHelperService.isEmpty(this.phoneLine)) {
	//		// user doesn't have a phoneline, so they are not busy

	//		isUserBusy = false;
	//	}
	//	else {
	//		// user has a phoneline, we need to check it to see if their is anyone else in the phoneline other than the user
	//		if (this.jsHelperService.isEmpty(this.phoneLine.phoneLineConnections)) {
	//			// there are no phoneLineConnetions so the user isn't busy in another call
	//			isUserBusy = false;
	//		}
	//		else {
	//			// there is atleast one phonelineConnection, so check see if any is not the user's phoneline connection
	//			// this will indicate the user is in a conversation with another user
	//			let index = this.phoneLine.phoneLineConnections.findIndex((value) => {
	//				return value.hubConnection.connectionGuid != this.localGuid;
	//			});

	//			if (index < 0) {
	//				isUserBusy = false;
	//			}
	//		}
	//	}

	//	return isUserBusy;
	//}

	// this initializes phoneService to default settings to get it started.
	//async init(): Promise<void> {
	//	try {
	//		if (this.jsHelperService.isEmpty(this.signalrService.webRtcHub.state.connectionGuid)) {
	//			//console.log("phone.service.ts init() webRtcHub.state", this.signalrService.webRtcHub.state);
	//			//reject("phoneService.init() failed. signalrService.webRtcHub.state.connectionGuid not set. You can get the connectionGuid aka localGuid by performing a signalrService.webrtcHubCheckIn");
	//			throw ("There is no connection to the video communctions hub.");
	//		}
	//		else {
	//			this.localGuid = this.signalrService.webRtcHub.state.connectionGuid;
	//			return;
	//		}
	//	}
	//	catch (e) {
	//		throw (e);
	//	}
	//}

	//getPhoneLineConnectionFromCacheByRemoteGuid(remoteGuid: string): PhoneLineConnectionType {
	//	let phoneLineConnection: PhoneLineConnectionType = this.phoneLine.phoneLineConnections.find((value) => {
	//		return value.hubConnection.connectionGuid == remoteGuid && value.hubConnection.isDeleted == false;
	//	});
	//	return phoneLineConnection;
	//}

	//getPhoneLineByGuid(guid: string): Promise<PhoneLineType> {
	//	return this.signalrService.getPhoneLineByGuid(guid);
	//}

	//gets an existing phoneLine if the user isn't already in a conversation, else it will use the current phoneLine conversation the user is in
	//tryGetPhoneLine(): Promise<PhoneLineType> {
	//	return new Promise<PhoneLineType>((resolve, reject) => {
	//		if (this.jsHelperService.isEmpty(this.phoneLine)) {
	//			// get a new phoneline
	//			this.signalrService.requestNewPhoneLine()
	//				.then((phoneLine: PhoneLineType) => {
	//					return this.setPhoneLine(phoneLine);
	//				})
	//				.then(() => {
	//					resolve(this.phoneLine);
	//				})
	//				.catch((error) => {
	//					//console.log("getPhoneLine error: ", error);
	//					reject(error);
	//				})
	//		}
	//		else {
	//			// use the existing phoneline
	//			//console.log("resolve this.phoneline");
	//			resolve(this.phoneLine);
	//		}
	//	})
	//}

	//setPhoneLine(phoneLine: PhoneLineType): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		this.phoneLine = phoneLine;
	//		resolve();
	//	})
	//}

	//deletePhoneLine(): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		if (this.jsHelperService.isEmpty(this.phoneLine) === false) {
	//			this.phoneLine = null;
	//		}
	//		resolve();
	//	})
	//}

	//getLocalMediaStream(): Promise<MediaStream> {
	//	let methodName = "getLocalMediaStream";
	//	return new Promise<MediaStream>(async (resolve, reject) => {
	//		// TODO: put together the constraints and grab the LocalMediaStream
	//		// get the active AudioDeviceId from settings
	//		let audioDeviceId = this.settingsService.activeAudioDeviceId;
	//		let videoDeviceId = this.settingsService.activeVideoDeviceId;

	//		//// TODO: remove this code after John implements the gui to select camera,
	//		//// this portion of code is used until select camera gui is done.
	//		//if (this.jsHelperService.isEmpty(videoDeviceId) === true) {
	//		//	let mediaDeviceInfo: MediaDeviceInfo = await this.videoHelperService.getFirstVideoDevice();
	//		//	if (this.jsHelperService.isEmpty(mediaDeviceInfo) === false && this.jsHelperService.isEmpty(mediaDeviceInfo.deviceId) === false) {
	//		//		videoDeviceId = mediaDeviceInfo.deviceId;
	//		//	}
	//		//}

	//		if (this.jsHelperService.isEmpty(videoDeviceId) === false) {
	//			let videoConstraints: MediaTrackConstraints = {
	//				deviceId: { exact: videoDeviceId },
	//				frameRate: 15,
	//				width: 320,
	//				height: 240
	//			}

	//			let constraints: MediaStreamConstraints = {};
	//			constraints.video = videoConstraints;
	//			constraints.audio = true;
	//			//if (this.jsHelperService.isEmpty(audioDeviceId) === false) {
	//			//	// NOTE: currently this will never get called because we haven't
	//			//	// implemented the ability for the user to choose their audio device
	//			//	let audioConstraints: MediaTrackConstraints = {};
	//			//	audioConstraints.deviceId = { exact: audioDeviceId };
	//			//	constraints.audio = audioConstraints;
	//			//}
	//			//else {
	//			//	// NOTE: currently we always set the audio device to true
	//			//	constraints.audio = true;
	//			//}

	//			this.videoHelperService.getUserMedia(constraints)
	//				.then((mediaStream: MediaStream) => {
	//					resolve(mediaStream);
	//				})
	//				.catch((error) => {
	//					reject(methodName + " error: " + this.jsHelperService.stringify(error));
	//				});
	//		}
	//		else {
	//			let constraints: MediaStreamConstraints = {};
	//			constraints.video = true;
	//			constraints.audio = true;
	//			this.videoHelperService.getUserMedia(constraints)
	//				.then((mediaStream: MediaStream) => {
	//					resolve(mediaStream);
	//				})
	//				.catch((error) => {
	//					reject(methodName + " error: " + this.jsHelperService.stringify(error));
	//				});
	//		}
	//	});
	//}

	//// NOTE: this for testing only
	//getDefaultMediaStream(): Promise<MediaStream> {
	//	//console.log("getting local default media stream");
	//	return new Promise(async (resolve, reject) => {
	//		let constraints: MediaStreamConstraints = {};
	//		// NOTE: currently we always set the audio device to true
	//		constraints.audio = true;
	//		constraints.video = true;
	//		try {
	//			let mediaStream: MediaStream = await this.videoHelperService.getUserMedia(constraints);
	//			//console.log("got local default mediastream: ", mediaStream);
	//			resolve(mediaStream);
	//		}
	//		catch (error) {
	//			//console.log("error getDefaultMediastream: ", error);
	//			reject(error);
	//		}
	//	});
	//}

	//setLocalMediaStream(localMediaStream: MediaStream): Promise<void> {
	//	//console.log("setting local media stream: ", localMediaStream);
	//	return new Promise<void>((resolve) => {
	//		this.localMediaStream = localMediaStream;
	//		resolve();
	//	});
	//}

	//unsetLocalMediaStream(): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		if (this.jsHelperService.isEmpty(this.localMediaStream) === false) {
	//			let tracks: MediaStreamTrack[] = this.localMediaStream.getTracks();
	//			console.log("tracks: ", tracks);
	//			tracks.forEach((t) => {
	//				t.stop();
	//			});
	//		}
	//		this.localMediaStream = null;
	//		resolve();
	//	})
	//}

	//tryGetLocalPhoneLineConnection(): Promise<PhoneLineConnectionType> {
	//	return new Promise<PhoneLineConnectionType>((resolve, reject) => {
	//		if (this.jsHelperService.isEmpty(this.localPhoneLineConnection)) {
	//			// get a new phoneline
	//			this.signalrService.requestNewPhoneLineConnection(this.phoneLine.phoneLineGuid)
	//				.then((phoneLineConnection: PhoneLineConnectionType) => {
	//					//console.log("phone.service.ts.tryGetLocalPhoneLineConnection() got new phoneLineConnection: ", phoneLineConnection);
	//					return this.setLocalPhoneLineConnection(phoneLineConnection);
	//				})
	//				.then(() => {
	//					resolve(this.localPhoneLineConnection);
	//				})
	//				.catch((error) => {
	//					//console.log("getPhoneLine error: ", error);
	//					reject(error);
	//				});
	//		}
	//		else {
	//			//check if the existing phoneLineConnection.phoneLineId matches the set phoneLine
	//			if (this.localPhoneLineConnection.phoneLineId === this.phoneLine.phoneLineId) {
	//				//console.log("phone.service.ts.tryGetLocalPhoneLineConnection() using old phoneLineConnection: ", this.localPhoneLineConnection);
	//				resolve(this.localPhoneLineConnection);
	//			}
	//			else {
	//				this.signalrService.requestNewPhoneLineConnection(this.phoneLine.phoneLineGuid)
	//					.then((phoneLineConnection: PhoneLineConnectionType) => {
	//						//console.log("phone.service.ts.tryGetLocalPhoneLineConnection() invalid old phonelineConnection, got new phoneLineConnection: ", phoneLineConnection);
	//						return this.setLocalPhoneLineConnection(phoneLineConnection);
	//					})
	//					.then(() => {
	//						resolve(this.localPhoneLineConnection);
	//					})
	//					.catch((error) => {
	//						//console.log("getPhoneLine error: ", error);
	//						reject(error);
	//					});
	//			}
	//		}
	//	});
	//}

	//// sets the localPhoneLineConnection property of phoneService
	//setLocalPhoneLineConnection(phoneLineConnection: PhoneLineConnectionType): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		if (this.jsHelperService.isEmpty(this.phoneLine) === false) {
	//			if (this.phoneLine.phoneLineId === phoneLineConnection.phoneLineId) {
	//				this.localPhoneLineConnection = phoneLineConnection;
	//				resolve();
	//			}
	//			else {
	//				reject("phoneLineConnection.phoneLineId has to match this.phoneLine.phoneLineId: error, attempting to add a phoneLineConnection that is not associated with the current phoneLine property.");
	//			}
	//		}
	//		else {
	//			reject("this.phoneLine is required inorder to set a localPhoneLineConnection: error, attempting to add phoneLineConnection when there is no phoneLine.");
	//		}
	//	});
	//}

	////adds a phoneLineConnection to the phoneLine.phoneLineConnections array
	//addPhoneLineConnectionToPhoneLine(phoneLineConnection: PhoneLineConnectionType): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		if (this.jsHelperService.isEmpty(this.phoneLine) === false) {
	//			if (phoneLineConnection.phoneLineId === this.phoneLine.phoneLineId && phoneLineConnection.isDeleted === false) {
	//				if (this.jsHelperService.isEmpty(this.phoneLine.phoneLineConnections)) {
	//					//console.log("empty phoneline.phoneLineConnetions", this.phoneLine)
	//					this.phoneLine.phoneLineConnections = new Array<PhoneLineConnectionType>();
	//					this.phoneLine.phoneLineConnections.push(phoneLineConnection);
	//					resolve();
	//				}
	//				else {
	//					let index: number = this.phoneLine.phoneLineConnections.findIndex((value) => {
	//						// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
	//						return value.hubConnection.email == phoneLineConnection.hubConnection.email;
	//					})

	//					// if the phoneLineConnection is not already in the phoneLine.phoneLineConnections array then add it, else skip adding it and just resolve()
	//					if (index < 0) {
	//						this.phoneLine.phoneLineConnections.push(phoneLineConnection);
	//						resolve();
	//					}
	//					else {
	//						// the phoneLineConnection already exists in the phoneLine.phoneLineConnections array
	//						resolve();
	//					}
	//				}
	//			}
	//			else {
	//				reject("addPhoneLineConnectionToPhoneLine() -> error attempting to add a phoneLineConnection with phoneLineId that is not matching the current phoneLine.");
	//			}
	//		}
	//		else {
	//			reject("addPhoneLineConnectionToPhoneLine() -> error attempting to add a phoneLineConnection when there is no phoneLine.");
	//		}
	//	})
	//}

	////removes a phoneLineConnection from the phoneLine.phoneLineConnections array
	//removePhoneLineConnectionFromPhoneLine(phoneLineConnection: PhoneLineConnectionType): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		if (this.jsHelperService.isEmpty(this.phoneLine) === false) {
	//			if (phoneLineConnection.phoneLineId === this.phoneLine.phoneLineId && phoneLineConnection.isDeleted === false) {
	//				if (this.jsHelperService.isEmpty(this.phoneLine.phoneLineConnections)) {
	//					// there are no phoneLineConnections to remove
	//					resolve();
	//				}
	//				else {
	//					let index: number = this.phoneLine.phoneLineConnections.findIndex((value) => {
	//						// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
	//						return value.phoneLineConnectionId == phoneLineConnection.phoneLineConnectionId;
	//					})

	//					// if the phoneLineConnection is in the array, remove it from the array
	//					if (index < 0) {
	//						this.phoneLine.phoneLineConnections.splice(index, 1);
	//						resolve();
	//					}
	//					else {
	//						// the phoneLineConnection is not in the array, so just resolve()
	//						resolve();
	//					}
	//				}
	//			}
	//			else {
	//				reject("removePhoneLineConnectionFromPhoneLine() -> error attempting to remove a phoneLineConnection with phoneLineId that is not matching the current phoneLine.");
	//			}
	//		}
	//		else {
	//			// there is no phoneLine. so there are no phoneLineConnections to remove
	//			resolve();
	//		}
	//	})
	//}

	//given remoteGuid removes a phoneLineConnection from the phoneLine.phoneLineConnections array
	//removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(remoteGuid: string): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		if (this.jsHelperService.isEmpty(this.phoneLine) === false) {
	//			let phoneLineConnection = this.getPhoneLineConnectionFromCacheByRemoteGuid(remoteGuid);
	//			if (this.jsHelperService.isEmpty(phoneLineConnection) === false) {
	//				if (phoneLineConnection.phoneLineId === this.phoneLine.phoneLineId && phoneLineConnection.isDeleted === false) {
	//					if (this.jsHelperService.isEmpty(this.phoneLine.phoneLineConnections)) {
	//						// there are no phoneLineConnections to remove
	//						resolve();
	//					}
	//					else {
	//						let index: number = this.phoneLine.phoneLineConnections.findIndex((value) => {
	//							// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
	//							return value.phoneLineConnectionId == phoneLineConnection.phoneLineConnectionId;
	//						})

	//						// if the phoneLineConnection is in the array, remove it from the array
	//						if (index > -1) {
	//							this.phoneLine.phoneLineConnections.splice(index, 1);
	//							console.log("phone.service.ts removePhoneLineConnectionFromPhoneLineUsingRemoteGuid() remoteGuid: this.phoneLine: ", remoteGuid, this.phoneLine);
	//							resolve();
	//						}
	//						else {
	//							// the phoneLineConnection is not in the array, so just resolve()
	//							resolve();
	//						}
	//					}
	//				}
	//				else {
	//					reject("removePhoneLineConnectionFromPhoneLineUsingRemoteGuid() -> error attempting to remove a phoneLineConnection with phoneLineId that is not matching the current phoneLine.");
	//				}
	//			}
	//			else {
	//				// TODO: maybe reject this, for now we resolve and console log it
	//				console.log("removePhoneLineConnectionFromPhoneLineUsingRemoteGuid() -> error there is no phoneLineConnection with the remoteGuid: " + remoteGuid);
	//				resolve();
	//			}
	//		}
	//		else {
	//			// there is no phoneLine. so there are no phoneLineConnections to remove
	//			resolve();
	//		}
	//	})
	//}

	//deleteLocalPhoneLineConnection(): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		this.localPhoneLineConnection = null;
	//		resolve();
	//	})
	//}

	//createRtcPeerConnection(): Promise<RTCPeerConnection> {
	//	return new Promise<RTCPeerConnection>((resolve, reject) => {
	//		// NOTE: you must instantiate the iceServer into an instance object, then use the instance
	//		// object as a value for the iceServers array becuase RTCIceServer interface is missing the property urls
	//		// inorder to add more properties to the interface at runtime we need to create instance of iceServer,
	//		// then assign it to the RTCIceServer array. It has todo with TypeScript handling interfaces
	//		//let iceServer1: RTCIceServer = {
	//		//	urls: "turn:52.26.140.197:3478",
	//		//	username: "username1",
	//		//	credential: "password1",
	//		//	credentialType: "password"
	//		//};

	//		let iceServer1: RTCIceServer = {
	//			urls: "turn:52.26.140.197:3478",
	//			username: "username1",
	//			credential: "password1"
	//			//credentialType: "password"
	//		}
	//		//iceServer1.credentialType = "password";

	//		let iceServers = new Array(iceServer1);

	//		let config: RTCConfiguration = {
	//			iceServers: iceServers
	//		}

	//		let pc = new RTCPeerConnection(config);
	//		resolve(pc);
	//	});
	//}

	//sendPbxPhoneLineInvitation(email: string, pbxLineRepId: number): Promise<string> {
	//	return new Promise<string>((resolve, reject) => {
	//		console.log("phone.service.ts.sendPbxPhoneLineInvitation() starting email: ", email);
	//		this.tryGetPhoneLine()
	//			.then(() => {
	//				console.log("phone.service.ts.sendPhoneLineInvitation() got phoneLine: ", this.phoneLine);
	//				return this.tryGetLocalPhoneLineConnection();
	//			})
	//			.then(() => {
	//				console.log("phone.service.ts.sendPhoneLineInvitation() got phoneLineConnection: ", this.localPhoneLineConnection);
	//				return this.signalrService.sendPbxPhoneLineInvitation(this.phoneLine.phoneLineGuid, pbxLineRepId, email, this.localPhoneLineConnection.hubConnection.name);
	//			})
	//			.then((remoteGuid: string) => {
	//				resolve(remoteGuid);
	//			})
	//			.catch((error) => {
	//				reject(error);
	//			})
	//	})
	//}

	//sendPhoneLineInvitation(email: string): Promise<string> {
	//	return new Promise<string>((resolve, reject) => {
	//		console.log("phone.service.ts.sendPhoneLineInvitation() starting email: ", email);
	//		this.tryGetPhoneLine()
	//			.then(() => {
	//				console.log("phone.service.ts.sendPhoneLineInvitation() got phoneLine: ", this.phoneLine);
	//				return this.tryGetLocalPhoneLineConnection();
	//			})
	//			.then(() => {
	//				console.log("phone.service.ts.sendPhoneLineInvitation() got phoneLineConnection: ", this.localPhoneLineConnection);
	//				return this.signalrService.sendPhoneLineInvitation(this.phoneLine.phoneLineGuid, email, this.localPhoneLineConnection.hubConnection.name);
	//			})
	//			.then((remoteGuid: string) => {
	//				resolve(remoteGuid);
	//			})
	//			.catch((error) => {
	//				reject(error);
	//			})
	//	})
	//}

	//sendAcceptPhoneLineInvitation(phoneLineGuid: string, remoteGuid: string): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		// grab the phoneLine from the server
	//		this.getPhoneLineByGuid(phoneLineGuid)
	//			.then((phoneLine: PhoneLineType) => {
	//				// set the new phoneLine as the phoneService phoneLine
	//				return this.setPhoneLine(phoneLine);
	//			})
	//			.then(() => {
	//				// NOTE: will get a new phoneLineConnection if one doesn't already exist that has a matching phoneLineId to the phoneLine we just set
	//				return this.tryGetLocalPhoneLineConnection();
	//			})
	//			.then(() => {
	//				return this.addPhoneLineConnectionToPhoneLine(this.localPhoneLineConnection);
	//			})
	//			.then(() => {
	//				// let the user who sent the invitation know we accepted their invitation.
	//				return this.signalrService.sendAcceptPhoneLineInvitation(remoteGuid);
	//			})
	//			.then(() => {
	//				// sends out to all occupants of phoneline, aka all phoneLineConnections associated with phoneLine
	//				return this.sendAreYouReadyForCallToGroup();
	//			})
	//			.then((hubConnections: Array<HubConnection>) => {
	//				// TODO: use the array of hubConnection to display the users we are going to connect to
	//				// for now just resolve()
	//				console.log("phoneService.ts.sendAcceptPhoneLineInvitation() hubConnections: ", hubConnections);
	//				resolve();
	//			})
	//			.catch((error) => {
	//				reject(error);
	//			})
	//	})
	//}

	//sendAreYouReadyForCallToGroup(): Promise<Array<HubConnection>> {
	//	return new Promise<Array<HubConnection>>((resolve, reject) => {
	//		// NOTE: give the other user about half a second to get their listeners listening before sending this message
	//		setTimeout(async () => {
	//			let hubConnections = new Array<HubConnection>();
	//			this.currentCallAttempt = new CurrentCallAttemptType();
	//			this.currentCallAttempt.maxWaitTime = 10000 * this.phoneLine.phoneLineConnections.length;
	//			for (let i = 0; i < this.phoneLine.phoneLineConnections.length; i++) {
	//				let phoneLineConnection = this.phoneLine.phoneLineConnections[i];
	//				if (phoneLineConnection.hubConnection.connectionGuid !== this.localGuid && phoneLineConnection.isDeleted === false) {
	//					this.currentCallAttempt.phoneLineConnetions.push(phoneLineConnection);
	//				}
	//			}
	//			for (let i = 0; i < this.currentCallAttempt.phoneLineConnetions.length; i++) {
	//				let phoneLineConnection = this.currentCallAttempt.phoneLineConnetions[i];
	//				if (phoneLineConnection.hubConnection.connectionGuid !== this.localGuid) {
	//					try {
	//						let hubConnection: HubConnection = await this.signalrService.sendAreYouReadyForCall(this.localPhoneLineConnection.phoneLineConnectionId, phoneLineConnection.hubConnection.connectionGuid);
	//						hubConnections.push(hubConnection);
	//						console.log("phone.service.ts sendAreYouReadyForCall() hubConnection: ", hubConnection);
	//					}
	//					catch (e) {
	//						console.log("phone.service.ts sendAreYouReadyForCall() error: ", e);
	//					}
	//				}
	//				else {
	//					console.log("phone.service.ts sendAreYouReadyForCall() error: attemping to sendAreYouReadyForCall to self phoneLineConnection:", phoneLineConnection);
	//				}
	//			}
	//			resolve(hubConnections);
	//		}, 400);
	//	})
	//}

	//sendReadyForCall(remoteGuid: string): Promise<void> {
	//	return this.signalrService.sendReadyForCall(remoteGuid);
	//}

	//sendNotReadyForCall(errorMessage: string, remoteGuid: string): Promise<void> {
	//	return this.signalrService.sendNotReadyForCall(errorMessage, remoteGuid);
	//}

	//sendNotAcceptCall(remoteGuid: string): Promise<void> {
	//	return this.signalrService.sendNotAcceptCall(remoteGuid);
	//}

	//sendBusyResponse(remoteGuid: string): Promise<void> {
	//	return this.signalrService.sendBusyResponse(remoteGuid);
	//}

	//sendPrivateSmsMessage(message: string, remoteGuid: string): Promise<string> {
	//	return this.signalrService.sendPrivateSmsMessage(message, remoteGuid);
	//}

	//sendGroupSmsMessage(message: string, phoneLineGuid: string): Promise<string> {
	//	return this.signalrService.sendGroupSmsMessage(message, phoneLineGuid);
	//}

	//sendHangUpNotice(phoneLineGuid: string): Promise<void> {
	//	return this.signalrService.sendHangUpNotice(phoneLineGuid);
	//}

	//hangUp(): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		if (this.jsHelperService.isEmpty(this.phoneLine) === false) {
	//			this.sendHangUpNotice(this.phoneLine.phoneLineGuid)
	//				.then(() => {
	//					this.deleteLocalPhoneLineConnection();
	//				})
	//				.then(() => {
	//					console.log("deleted localPhoneLineConnection: ", this.localPhoneLineConnection);
	//					return this.deletePhoneLine();
	//				})
	//				//.then(() => {
	//				//	console.log("deleted phoneLine: ", this.phoneLine);
	//				//	return this.unsetLocalMediaStream();
	//				//})
	//				.then(() => {
	//					//let tracks = this.localMediaStream.getTracks();
	//					//tracks.forEach((t) => { t.stop(); })
	//					//this.localMediaStream = null;
	//					console.log("unsetLocalMediaStream complete");
	//					resolve();
	//				})
	//				.catch((error) => {
	//					console.log("phone.service.ts-> hangUp() error: ", error);
	//					reject(error);
	//				})
	//		}
	//		else {
	//			// there are no phonelines to hangup, so just resolve()
	//			resolve();
	//		}
	//	})
	//}

	//async initCall(isMember: boolean, call: CallType): Promise<boolean> {
	//	try {
	//		if (this.jsHelperService.isEmpty(call) === false
	//			&& this.jsHelperService.isEmpty(call.profile) === false
	//			&& this.jsHelperService.isEmpty(call.profile.email) === false
	//			&& this.jsHelperService.isEmpty(call.remoteGuid) === false
	//		) {
	//			//if the user is currently in a call, they can not accept any more calls
	//			if (this.isPhoneBusy() === false) {
	//				console.log("phone.service.ts initCall not busy");
	//				let isBlocked = false;
	//				if (isMember) {
	//					// loop through all the emails in the call.callers object to see if any are in the block list
	//					let index = call.callers.findIndex((value) => {
	//						return this.blockCallService.isBlockedEmailFromCache(value.profile.email)
	//					});
	//					isBlocked = (index > -1);
	//				}
	//				if (isBlocked) {
	//					//console.log("phone.service.ts initCall blocked:", isBlocked);
	//					//this.sendNotAcceptCall(call.remoteGuid);
	//					//reject(call.remoteGuid);
	//					return false;
	//				}
	//				else {
	//					//console.log("phone.service.ts initCall not blocked, displayincoming:", isBlocked);
	//					//resolve(call);
	//					return true;
	//				}
	//			}
	//			else {
	//				// TODO: since the user is in a conversation already, they can not accept this call, maybe in the future we will the
	//				// user the option to end the current call and accept this call.
	//				//console.log("phone.service.ts initCall user is busy");
	//				//this.sendBusyResponse(call.remoteGuid);
	//				//reject(call.remoteGuid);
	//				//throw("Unable to receive call, because user is currently busy in an existing call.")
	//				return false;
	//			}
	//		}
	//		else {
	//			//// receive call with invalid data, such as missing entire profile or email
	//			//console.log("phone.service.ts initCall invalid call object call:", call);
	//			//this.sendNotAcceptCall(call.remoteGuid);
	//			//reject(call.remoteGuid);
	//			//throw ("Unable to read caller information");
	//			return false;
	//		}
	//	}
	//	catch (e) {
	//		throw (e);
	//	}
	//}

	//putCurrentPhoneLineOnHold(): Promise<void> {
	//	return new Promise<void>((resolve, reject) => {
	//		async () => {
	//			//// put any current connections on hold
	//			//for (let i = 0; i < this.phoneLine.phoneLineConnections.length; i++) {
	//			//	let phoneLineConnection = this.phoneLine.phoneLineConnections[i];
	//			//	if (phoneLineConnection.hubConnection.connectionGuid !== this.localGuid && phoneLineConnection.isDeleted === false) {
	//			//		try {
	//			//			await this.signalrService.sendPutOnHold(phoneLineConnection.hubConnection.connectionGuid);
	//			//		}
	//			//		catch (e) {
	//			//			console.log("phone.service.ts putCurrentPhoneLineOnHold() error: ", e);
	//			//		}
	//			//	}
	//			//}

	//			//remove all old pbx-line-call.components

	//			// store the old localPhoneLineConnection in temp location for later retrieval after rep is done with paged call
	//			this.localPhoneLineConnectionOnHold = this.localPhoneLineConnection;
	//			// store the old phoneLine in temp location for later retrieval
	//			this.phoneLineOnHold = this.phoneLine;
	//			// set the phoneLine to null and the localPhoneLineConnection to null so we can use it for the paged call
	//			this.phoneLine = null;
	//			this.localPhoneLineConnection = null;

	//			resolve();
	//		};
	//	});
	//}
}