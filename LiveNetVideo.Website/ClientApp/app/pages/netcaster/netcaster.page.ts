import {
	Component,
	ComponentFactory,
	ComponentFactoryResolver,
	ViewContainerRef,
	ViewChild,
	ContentChild,
	Output,
	Input,
	EventEmitter,
	ComponentRef,
	ElementRef,
	NgZone,
	OnDestroy,
	OnInit,
	AfterViewInit,
	HostListener
} from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatListOption, MatList, MatSelectionList } from '@angular/material';
import { Subscription } from 'rxjs/Subscription';
import { Service } from '../../services/index';

import {
	CallType,
	SdpMessageType,
	IceMessageType,
	ProfileDto,
	GuestLogin,
	PhoneLineType,
	PhoneLineConnectionType,
	HubConnection,
	CallerType,
	NotReadyForCallType,
	SmsMessageType,
	IncomingCallResponseEnum,
	ObservableMessageType,
	MaterialAlertMessageType,
	SmsMessageViewType,
	PhoneContactType,
	MemberType,
	GenericUserType,
	TextMessageType,
	NetcastType,
	NetcastKind,
	DataChannelKind,
	DcJsonType,
	SystemEventEnum,
	RTCDataChannelStateEnum,
	RequestNetcastStubType,
	RtcIceConnectionStateEnum,
	NetcastDto,
} from '../../models/index';

import {
	PhoneCallComponent,
	OutgoingCallDialogComponent,

	PhoneListenerComponent,
	GlobalPhoneListenerComponent,
	PhoneRingerComponent,
	ContactListComponent,
	IncomingPhoneCallComponent,
} from "../../components/index";
import { Type } from '@angular/compiler/src/output/output_ast';

@Component({
	templateUrl: 'netcaster.page.html',
	styleUrls: ['./netcaster.page.scss'],
})
export class NetcasterPage implements OnInit, AfterViewInit {
	constructor(
		public router: Router,
		public activatedRoute: ActivatedRoute,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public ngZone: NgZone,
		public matDialog: MatDialog,
		private service: Service,
	) {
	}

	// TODO: need to get stats to display to netcaster.
	// display number of viewers. Show reactions emoji counts
	// such as number of likes, dislikes, different counts for reactions.

	// NOTE: call this.service.getAccessToken() before calling any
	// methods that require accessToken like calls to signalr Hub or WebApi
	// getAccessToken() will retrieve existing token or renew existing token
	// and call setAccessToken() which will store the jwtToken in session
	// or permanent storeage, and set this.webRtcHub.state.accessToken = jwtToken.access_token;
	// this will ensure the token checked by the hub or webapi is valid

	// Listen for window close or tab close or page refresh
	@HostListener('window:beforeunload', ['$event'])
	windowBeforeUnload($event) {
		this.service.broadcastDisconnected(this.localGuid);
		this.hangUp();
	}

	@ViewChild('mainVideoElement') mainVideoElement: ElementRef;
	//@ViewChild('firstVideoThumb') firstVideoThumb: ElementRef;
	//@ViewChild('secondVideoThumb') secondVideoThumb: ElementRef;
	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;

	canSwitchVideo: boolean;
	mediaDevices: Array<MediaDeviceInfo>;
	availableVideoDevices: Array<MediaDeviceInfo>;
	//activeVideoDeviceId: string;

	//pc: RTCPeerConnection;
	netcastConnections: NetcastType[];

	// indicates the last direct child node the netcaster traversed to refer a relay
	currentRelayIndex: number = 0;

	// we only allow 3 children nodes for the netcaster
	get maxRelays(): number {
		return 3;
	}

	// used in multi camera systems
	netcastStreamId: string;

	// for testing only, in production we only use one stream at a time, unless
	// the browser allows two cameras to be used at once.
	mediaStreams: MediaStream[];

	netcastId: number;
	netcast: NetcastDto;
	memberId: number;

	//remoteGuid: string;
	localGuid: string;
	ngAfterViewInit() {
		console.log("ngAfterViewInit");
	}

	ngOnInit() {
		this.activatedRoute.paramMap.subscribe((params) => {
			this.netcastId = Number(params.get('netcastId'));
		});

		this.netcastConnections = new Array<NetcastType>();
		this.canSwitchVideo = true;
		this.mediaDevices = new Array<MediaDeviceInfo>();
		this.availableVideoDevices = new Array<MediaDeviceInfo>();
		this.mediaStreams = new Array<MediaStream>();
		console.log("ngOnInit");

		//if (this.service.isSignalrConnected() === false) {
		//	this.service.startConnection();
		//}

		try {
			this.service.isCheckedIntoHubConnection()
				.then((isReady: boolean) => {
					if (!this.service.isEmpty(isReady)) {
						this.startApp();
					}
					else {
						throw ("isCheckedIntoHubConnection returned false - not ready");
					}
				})
				.catch((e) => {
					console.log("netcaster.page.ts ngOnInit() isCheckedIntoHubConnection() error: ", e);
					throw (e);
				})
		}
		catch (e) {
			console.log("error starting netcast: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = "Unable to start netcast. An error has occured. Please try again later.";
			this.service.openAlert(alert);
		}
	}

	ngOnDestroy() {
		console.log("ngOnDestroy");
		this.hangUp();
		this.endSubscriptions();
		this.service.broadcastDisconnected(this.localGuid);
	}

	async startApp(): Promise<void> {
		try {
			this.mediaDevices = await navigator.mediaDevices.enumerateDevices();

			console.log("mediaDevices: ", this.mediaDevices);

			this.availableVideoDevices = this.mediaDevices.filter((m: MediaDeviceInfo) => {
				return m.kind == "videoinput";
			});

			console.log("availableVideoDevices: ", this.availableVideoDevices);

			if (this.availableVideoDevices && this.availableVideoDevices.length > 1) {
				this.canSwitchVideo = true;
				console.log("canSwitchVideo: ", this.canSwitchVideo);
			}

			let promises: Promise<MediaStream>[] = [];

			this.availableVideoDevices.forEach(async (v: MediaDeviceInfo) => {
				promises.push(this.getMediaStream(this.mediaDevices, v.deviceId));
			})

			this.mediaStreams = await Promise.all(promises);

			console.log("mediaStreams: ", this.mediaStreams);

			//setTimeout(() => { console.log("timeout mediaStreams: ", this.mediaStreams); }, 1000);

			//if (this.availableVideoDevices && this.availableVideoDevices.length > 0) {
			//	this.activeVideoDeviceId = this.availableVideoDevices[0].deviceId;
			//}
			//else {
			//	throw ("no cameras available to broadcast");
			//}

			let accessToken: string = await this.service.getAccessToken();
			if (this.service.isEmpty(accessToken)) {
				throw ("Access is denied.");
			}

			this.memberId = Number(this.service.getMemberId(accessToken));

			await this.service.initPhoneService("NetCast");
			console.log("localGuid: ", this.service.localGuid);
			this.localGuid = this.service.localGuid;

			//this.mediaStream = await this.service.getLocalMediaStream();
			//this.mediaStream = await this.getMediaStream(this.mediaDevices, this.activeVideoDeviceId);
			if (this.mediaStreams.length === 1) {
				await this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.mediaStreams[0], this.service.localGuid);
				//await this.service.attachMediaStream(this.firstVideoThumb.nativeElement, this.mediaStreams[0]);
				this.netcastStreamId = this.mediaStreams[0].id;
			}
			else if (this.mediaStreams.length > 1) {
				await this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.mediaStreams[0], this.service.localGuid);
				//await this.service.attachMediaStream(this.firstVideoThumb.nativeElement, this.mediaStreams[0]);
				//await this.service.attachMediaStream(this.secondVideoThumb.nativeElement, this.mediaStreams[1]);
				this.netcastStreamId = this.mediaStreams[0].id;
			}
			else {
				throw ("no cameras available to broadcast");
			}

			// grab the netcast db record
			this.netcast = await this.service.getNetcastById(this.netcastId, accessToken);

			if (!this.service.isEmpty(this.netcast)) {
				// make sure the netcaster is the owner of the netcast
				if (this.netcast.memberId !== this.memberId) {
					throw ("Access denied");
				}

				this.netcast.connectionGuid = this.localGuid;
				// update the netcast db record
				let canStart: boolean = await this.service.startNetcast(this.netcast.netcastId, this.localGuid, accessToken);
				if (canStart) {
					await this.startSubscriptions();
				}
				else {
					throw ("Unable to start netcast.");
				}
			}
			else {
				throw ("Unable to update the netcast ConnectionGuid");
			}
		}
		catch (e) {
			//throw (e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	async stopVideos(): Promise<void> {
		//this.mediaStream = null;

		this.mediaStreams.forEach((m: MediaStream) => {
			this.service.stopMediaStream(m);
		})
		this.mainVideoElement.nativeElement.srcObject = null;
		//this.firstVideoThumb.nativeElement.srcObject = null;
		//this.secondVideoThumb.nativeElement.srcObject = null;
		this.mediaStreams = new Array<MediaStream>();
		return;
	}

	hangUp() {
		console.log("hanging up");
		this.service.getAccessToken()
			.then((accessToken: string) => {
				this.service.endNetcast(accessToken);
			})

		if (this.netcastConnections.length > 0) {
			this.netcastConnections.forEach((n: NetcastType) => {
				n.peerConnection.close();
			});

			this.netcastConnections = new Array<NetcastType>();
		}

		this.stopVideos();
	}

	exit() {
		this.router.navigate(['/netcast-list'], { relativeTo: this.activatedRoute });
	}

	// #region signalr Subscriptions

	receiveSDP: Subscription;
	receiveICE: Subscription;
	receiveRequestNetcast: Subscription;
	someoneDisconnected: Subscription;
	receiveDisconnect: Subscription;
	receiveRequestNetcastStub: Subscription;
	// #endregion

	startSubscriptions(): void {
		console.log("starting subscription");

		this.receiveDisconnect = this.service.receiveDisconnect
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("someoneDisconnected message: ", message.timestamp);
				try {
					let remoteGuid: string = message.message;

					if (this.service.isEmpty(remoteGuid) === false) {
						this.handleDisconnectEvent(remoteGuid);
					}
				}
				catch (e) {
					console.log("Receive someoneDisconnected error: ", e);
				}
			});

		this.someoneDisconnected = this.service.someoneDisconnected
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("someoneDisconnected message: ", message.timestamp);
				try {
					let json = message.message;
					if (this.service.isEmpty(json) === false) {
						let result: any = JSON.parse(json);
						// get the remoteGuid
						let remoteGuid = result.remoteGuid;

						//check if backupNetCasterConnection
						this.handleDisconnectEvent(remoteGuid);
					}
					else {
						throw ("Received empty someoneDisconnected message.")
					}
				}
				catch (e) {
					console.log("Receive someoneDisconnected error: ", e);
				}
			});

		this.receiveSDP = this.service.receiveSDP
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveSDP message: ", message.timestamp);
				try {
					let json = message.message;
					if (this.service.isEmpty(json) === false) {
						let sdpMessage: SdpMessageType = this.service.jsonToObject<SdpMessageType>(json, true);
						console.log("receive sdp : ", sdpMessage);
						await this.handleSdpMessage(sdpMessage);
					}
					else {
						throw ("Received empty SDP message.")
					}
				}
				catch (e) {
					// fatal error
					//let alert = new MaterialAlertMessageType();
					//alert.title = "Error";
					//alert.message = e;
					//this.service.openAlert(alert);
					console.log("Receive SDP error: ", e);
				}
			});

		this.receiveICE = this.service.receiveICE
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveICE message: ", message.timestamp);
				try {
					let json = message.message;
					if (this.service.isEmpty(json) === false) {
						let iceMessage: IceMessageType = this.service.jsonToObject<IceMessageType>(json, true);
						await this.handleIceMessage(iceMessage);
					}
					else {
						throw ("Received empty ice package.")
					}
				}
				catch (e) {
					// fatal error
					//let alert = new MaterialAlertMessageType();
					//alert.title = "Error";
					//alert.message = e;
					//this.service.openAlert(alert);
					console.log("Receive ICE error: ", e);
				}
			});

		this.receiveRequestNetcast = this.service.receiveRequestNetcast
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receive request netcast: ", message);
				try {
					let json = JSON.parse(message.message);
					if (this.service.isEmpty(json) === false) {
						let remoteGuid: string = json.remoteGuid;
						let relays: NetcastType[] = this.getOutgoingRelays();
						//if (this.netcastConnections.length < this.maxRelays) {
						if (relays.length < this.maxRelays) {
							// we still have available child node slots for use
							// NOTE: the system only allows 3 max child nodes for the root netcaster
							let mediaStream = this.mediaStreams.find((m: MediaStream) => {
								return m.id == this.netcastStreamId;
							});
							if (this.service.isEmpty(mediaStream) === false) {
								await this.sendNetcastOffer(remoteGuid, mediaStream);
							}
							else {
								throw ("no media stream to netcast");
							}
						}
						else {
							// get an available stub and relay it to the requester
							// the stub will relay the stream to the requester
							// NOTE: we will switch relay indexs
							let r: RequestNetcastStubType = new RequestNetcastStubType();
							r.requesterGuid = remoteGuid;
							let result = await this.requestNetcastStub(r, 0);
							console.log("this.receiveRequestNetcast await this.requestNetcastStub(r, 0) result: ", result);
							//r.senderGuid = this.localGuid;
						}
					}
					else {
						throw ("Received empty request netcast.")
					}
				}
				catch (e) {
					console.log("Receive request netcast error: ", e);
				}
			});

		this.receiveRequestNetcastStub = this.service.receiveRequestNetcastStub
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveSDP message: ", message.timestamp);
				try {
					let json = message.message;
					if (this.service.isEmpty(json) === false) {
						let re: RequestNetcastStubType = this.service.jsonToObject<RequestNetcastStubType>(json, true);
						await this.handleRequestNetcastStub(re);
					}
					else {
						throw ("Received empty SDP message.")
					}
				}
				catch (e) {
					// fatal error
					//let alert = new MaterialAlertMessageType();
					//alert.title = "Error";
					//alert.message = e;
					//this.service.openAlert(alert);
					console.log("Receive SDP error: ", e);
				}
			});
	}

	endSubscriptions(): void {
		console.log("ending subscriptions");
		this.receiveSDP && this.receiveSDP.unsubscribe();
		this.receiveICE && this.receiveICE.unsubscribe();
		this.receiveRequestNetcast && this.receiveRequestNetcast.unsubscribe();
		this.someoneDisconnected && this.someoneDisconnected.unsubscribe();
	}

	startPeerConnectionListeners(netcast: NetcastType): void {
		console.log("starting pc listeners");
		try {
			netcast.peerConnection.oniceconnectionstatechange = (evt: Event) => {
				console.log("oniceconnectionstatechange event: ", evt);

				this.iceStateChangeHandler(netcast);
			}

			netcast.peerConnection.onicecandidate = async (event: RTCPeerConnectionIceEvent): Promise<void> => {
				try {
					console.log("sending ice to " + netcast.remoteGuid + " : ", event.candidate);
					await this.service.getAccessToken();
					await this.service.sendICE(netcast.remoteGuid, this.service.stringify(event.candidate))
				}
				catch (e) {
					console.log("send ice error: ", e);
				}
			};

			netcast.peerConnection.onnegotiationneeded = async (event: Event): Promise<void> => {
				//note this gets called by webrtc built in code
				console.log("onnegogiationneeded evt:", event);
				//let localSdpOffer: RTCSessionDescriptionInit = await netcast.peerConnection.createOffer();
				//await netcast.peerConnection.setLocalDescription(localSdpOffer);
				//await this.service.sendSDP(netcast.remoteGuid, this.service.stringify(localSdpOffer));

				return;
			};

			// NOTE: when we receive a remote media stream
			netcast.peerConnection.ontrack = (event: RTCTrackEvent) => {
				// in the current system, the netcaster won't receive a stream from another user
			}
			//pc.onaddstream = async (event: MediaStreamEvent) => {
			//	console.log("reveiced Remote Stream: ", event.stream);
			//};

			netcast.peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
				console.log("netcast.peerConnection.ondatachannel event: ", event);
				let dc = event.channel;
				this.startDataChannelListeners(dc);
			}

			netcast.peerConnection.onconnectionstatechange = (event: Event) => {
				console.log("netcast.peerConnection.onconnectionstatechange", event);
			}

			netcast.peerConnection.onicegatheringstatechange = (event: Event) => {
				console.log("netcast.peerConnection.onicegatheringstatechange", event);
			}

			netcast.peerConnection.onsignalingstatechange = (event: Event) => {
				console.log("netcast.peerConnection.onsignalingstatechange", event);
			}

			return;
		}
		catch (e) {
			throw (e);
		}
	}

	startDataChannelListeners(dc: RTCDataChannel): void {
		dc.onbufferedamountlow = (event: Event) => {
			console.log("datachannel.onbufferedamountlow event", event)
		};

		dc.onerror = (event: RTCErrorEvent) => {
			console.log("datachannel.onerror event: ", event);
		};

		dc.onmessage = async (event: MessageEvent): Promise<void> => {
			console.log("datachannel.onmessage event: ", event);
			await this.handleDcMessage(event);
			return;
		};

		dc.onopen = (event: Event) => {
			console.log("datachannel.onopen event: ", event);
		};

		dc.onclose = (event: Event) => {
			console.log("datachannel.onclose event: ", event);
		};
	}

	async handleDcMessage(event: MessageEvent): Promise<void> {
		try {
			let remoteDc: RTCDataChannel = event.target as RTCDataChannel;
			let json: string = event.data;

			//console.log("handling DcMessage json: ", json);

			let dcKind: string = remoteDc.label;
			if (dcKind === DataChannelKind.dcJsonType) {
				let dcJsonType: DcJsonType = this.service.jsonToObject<DcJsonType>(json);
				//console.log("dcJsonType: ", dcJsonType);
				let remoteGuid = dcJsonType.remoteGuid;
				let typeName: string = dcJsonType.objectType;

				//NOTE: we only handle expected types
				switch (typeName) {
					case String.name:
						await this.handleStringMessage(dcJsonType.json);
						break;
					case SystemEventEnum.name:
						let systemEvent: SystemEventEnum = dcJsonType.json as SystemEventEnum;
						await this.handleSystemEvent(systemEvent, remoteGuid);
						break;
					case RequestNetcastStubType.objectName:
						let r: RequestNetcastStubType = this.service.tryParseJson(dcJsonType.json) as RequestNetcastStubType;
						this.handleRequestNetcastStub(r);
						break;
					case SdpMessageType.name:
						let sdpMessage: SdpMessageType = this.service.tryParseJson(dcJsonType.json) as SdpMessageType;
						await this.handleSdpMessage(sdpMessage);
						break;
					default:
						throw ("Received unknow objectType from " + DataChannelKind.dcJsonType);
				}
			}
			else if (dcKind === DataChannelKind.dcBinaryType) {
				console.log("receive binary data: ", json);
				// TODO: write handler to handle binary data
			}
			else {
				throw ("unknown DataChannelKind: " + dcKind);
			}

			return;
		}
		catch (e) {
			throw (e);
		}
	}

	async handleStringMessage(message: string): Promise<void> {
		console.log("received dc string message: ", message);
		return;
	}

	async handleSystemEvent(systemEvent: SystemEventEnum, remoteGuid: string): Promise<void> {
		try {
			console.log('received system event: ', systemEvent, remoteGuid);
			switch (systemEvent) {
				case SystemEventEnum.disconnected:
					this.handleDisconnectEvent(remoteGuid);
					break;
				default:
					throw ("Unknown system event: " + systemEvent);
			}

			return;
		}
		catch (e) {
			throw (e);
		}
	}

	handleDisconnectEvent(remoteGuid: string): void {
		// remove the user from netcastConnections array
		let netcast: NetcastType = this.getPc(remoteGuid, this.netcastConnections);
		if (this.service.isEmpty(netcast) === false) {
			this.removePc(netcast);
		}
		return;
	}

	async handleSdpMessage(sdpMessage: SdpMessageType): Promise<void> {
		try {
			if (this.service.isEmpty(sdpMessage) === false && this.service.isEmpty(sdpMessage.sender) === false) {
				let sdp: RTCSessionDescription = this.service.jsonToObject<RTCSessionDescription>(sdpMessage.sdp);
				if (sdp.type === "answer") {
					let n: NetcastType = this.getPc(sdpMessage.sender, this.netcastConnections);
					if (n) {
						await n.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
					}
					else {
						throw ("unable to get peerconnection to handle the sdp answer from remoteGuid: " + sdpMessage.sender);
					}
				}
				else {
					throw ("netcaster currently can not receive offers. Did not receive sdp answer: " + this.service.stringify(sdpMessage));
				}
			}
			else {
				throw ("Received SDP message without other users information.")
			}
		}
		catch (e) {
			throw (e);
		}
	}

	async handleIceMessage(iceMessage: IceMessageType): Promise<void> {
		try {
			console.log("handling iceMessage: ", iceMessage);

			if (this.service.isEmpty(iceMessage) === false && this.service.isEmpty(iceMessage.sender) === false) {
				let ice: RTCIceCandidate = this.service.jsonToObject<RTCIceCandidate>(iceMessage.ice, true);
				let n: NetcastType = this.getPc(iceMessage.sender, this.netcastConnections);
				if (n) {
					if (this.service.isEmpty(ice) === false) {
						await n.peerConnection.addIceCandidate(new RTCIceCandidate(ice));
					}
					else {
						// nothing to handle, null ice signals end of sending ice packages
						console.log("end of ice");
						await n.peerConnection.addIceCandidate(null);
					}
				}
				else {
					throw ("unable to retrieve peerconnection to handle ice message from: " + iceMessage.sender);
				}
			}
			else {
				throw ("Received is package without the other users information.");
			}

			return;

			//if (this.service.isEmpty(iceMessage) === false && this.service.isEmpty(iceMessage.sender) === false) {
			//	let ice: RTCIceCandidate = this.service.jsonToObject<RTCIceCandidate>(iceMessage.ice, true);
			//	if (this.service.isEmpty(ice) === false) {
			//		let n: NetcastType = this.getPc(iceMessage.sender, this.netcastConnections);
			//		if (n) {
			//			await n.peerConnection.addIceCandidate(new RTCIceCandidate(ice));
			//		}
			//		else {
			//			throw ("unable to retrieve peerconnection to handle ice message from: " + iceMessage.sender);
			//		}
			//	}
			//	else {
			//		// nothing to handle, null ice signals end of sending ice packages
			//		console.log("end of ice");
			//	}
			//}
			//else {
			//	throw ("Received is package without the other users information.");
			//}

			//return;
		}
		catch (e) {
			throw (e);
		}
	}

	async handleRequestNetcastStub(r: RequestNetcastStubType): Promise<void> {
		// check if this node has any children node slots available
		// NOTE: a node will have upto maxRelay nodes
		if (this.netcastConnections.length < this.maxRelays) {
			// TODO: this is node is a stub, using signalr to send this users remoteGuid
			// to the requester. The requeter will then connect to this stub
			await this.service.sendNetcastStub(r.requesterGuid);
			return;
		}
		else {
			// this node is full, send the message down the line
			this.requestNetcastStub(r);
			return;
		}
	}

	iceStateChangeHandler(netcast: NetcastType) {
		if (this.service.isEmpty(netcast) === false) {
			let status = netcast.peerConnection.iceConnectionState;
			switch (status) {
				case RtcIceConnectionStateEnum.closed:
					this.handleIceConnectionStateClosed(netcast);
					break;
				case RtcIceConnectionStateEnum.failed:
					this.handleIceConnectionStateFailed(netcast);
					break;
				case RtcIceConnectionStateEnum.disconnected:
					console.log("IceConnectionState: ", RtcIceConnectionStateEnum.disconnected);
					break;
				case RtcIceConnectionStateEnum.completed:
					console.log("IceConnectionState: ", RtcIceConnectionStateEnum.completed);
					break;
				default:
					console.log("IceConnectionState: ", status)
			}
		}
		else {
			console.log("netcast is empty because previously handled");
		}
	};

	handleIceConnectionStateFailed(netcast: NetcastType) {
		console.log("ice status failed: ", status);
		// fallback, will remove netcast if exist in array
		//let n: NetcastType = this.netcastConnections.find((n: NetcastType) => {
		//	return n.peerConnection.remoteDescription.sdp == netcast.peerConnection.remoteDescription.sdp;
		//});

		if (this.service.isEmpty(netcast) === false) {
			this.removePc(netcast);
		}
	}

	handleIceConnectionStateClosed(netcast: NetcastType) {
		console.log("ice status closed: ", status);
		// fallback, will remove netcast if exist in array
		//let n: NetcastType = this.netcastConnections.find((n: NetcastType) => {
		//	return n.peerConnection.remoteDescription.sdp == netcast.peerConnection.remoteDescription.sdp;
		//});

		if (this.service.isEmpty(netcast) === false) {
			this.removePc(netcast);
		}
	}

	getOutgoingRelays(): NetcastType[] {
		let outgoing: NetcastType[] = this.netcastConnections.filter((n: NetcastType) => {
			return n.netcastKind === NetcastKind.outgoing;
		})
		return outgoing;
	}

	removePc(netcast: NetcastType): NetcastType {
		// removes the netcast from array and returns it
		try {
			let index = this.netcastConnections.findIndex((n: NetcastType) => {
				return n.remoteGuid == netcast.remoteGuid;
			});

			if (index > -1) {
				netcast.peerConnection.close();
				// delete one element from array and return first deleted element
				return this.netcastConnections.splice(index, 1)[0];
			}
			else {
				return null;
			}
		}
		catch (e) {
			throw (e);
		}
	}

	getPc(remoteGuid: string, netcasts: NetcastType[]) {
		return netcasts.find((n: NetcastType) => {
			return n.remoteGuid == remoteGuid;
		});
	}

	showPeers(): void {
		console.log("netcastConnections : ", this.netcastConnections);
	}

	async sendNetcastOffer(remoteGuid: string, mediaStream: MediaStream): Promise<void> {
		try {
			let outgoing: NetcastType;

			outgoing = this.getPc(remoteGuid, this.netcastConnections);

			if (this.service.isEmpty(outgoing) === false) {
				// if remoteGuid exists in array, replace mediastream
				await this.switchMediaStream(outgoing, mediaStream);
			}
			else {
				// remoteGuid does not exist, create new pc and push it to array
				outgoing = this.initNetcast(remoteGuid, NetcastKind.outgoing);
				outgoing.mediaStream = mediaStream;
				outgoing.mediaStream.getTracks().forEach((t: MediaStreamTrack) => {
					outgoing.peerConnection.addTrack(t, outgoing.mediaStream);
				});

				let localSdpOffer: RTCSessionDescriptionInit = await outgoing.peerConnection.createOffer();
				await outgoing.peerConnection.setLocalDescription(localSdpOffer);
				console.log("sending sdp Offer to: ", outgoing.remoteGuid, localSdpOffer);
				await this.service.getAccessToken();
				await this.service.sendSDP(outgoing.remoteGuid, this.service.stringify(localSdpOffer));
			}
			return;
		}
		catch (e) {
			throw (e);
		}
	}

	async requestNetcastStub(r: RequestNetcastStubType, currentTry?: number): Promise<boolean> {
		try {
			// switch to next PeerConnection, transverse down the node to get the next available remoteGuid node to relay
			// send the free node's remoteGuid to the user requesting a netcast
			// the user will then send the requestNetcast request to the available relay node

			console.log("requestNetcastStub start currentTry: ", currentTry);

			let maxTrys: number = 3;
			if (typeof currentTry === "undefined") {
				currentTry = 0;
			}
			else {
				currentTry++;
			}

			console.log("requestNetcastStub incremented currentTry: ", currentTry);

			if (currentTry <= maxTrys) {
				let relayIndex: number = this.getNextRelayIndex();

				let outgoingRelays: NetcastType[] = this.getOutgoingRelays();

				let netcastBranch: NetcastType = typeof outgoingRelays[relayIndex] !== "undefined" ? outgoingRelays[relayIndex] : null;

				//let netcastBranch: NetcastType = this.netcastConnections[relayIndex];
				console.log("requestNetcastStub netcastBranch: ", netcastBranch);

				if (this.service.isEmpty(netcastBranch)) {
					if (currentTry < maxTrys) {
						return this.requestNetcastStub(r, currentTry);
					}
					else {
						// unable to send request
						console.log("requestNetcastStub unable to send request");
						return false;
					}
				}
				else {
					// send the request to get node relay stub using datachannel and then signalr fallback
					let dc: RTCDataChannel = netcastBranch.getDataChannel(DataChannelKind.dcJsonType);
					if (this.service.isEmpty(dc) === false) {
						if (dc.readyState == RTCDataChannelStateEnum.open) {
							let message = new DcJsonType();
							message.remoteGuid = this.localGuid;
							message.json = this.service.stringify(r);
							message.objectType = RequestNetcastStubType.objectName;
							dc.send(this.service.stringify(message));
							console.log('requestNetcastStub send datachannel message: ', message);
							// request sent
							return true;
						}
						else {
							// datachannel not ready for this node, move to the next one
							console.log("requestNetcastStub unable to get NetcastType from relayIndex: ", relayIndex);
							return this.requestNetcastStub(r, currentTry);
						}
					}
					else {
						//no datachannel, use signalr fallback
						console.log("requestNetcastStub using signalr: ", netcastBranch.remoteGuid, r);
						await this.service.sendRequestNetcastStub(netcastBranch.remoteGuid, r);
						return true;
					}
				}
			}
			else {
				console.log("too many trys");
				return false;
			}
		}
		catch (e) {
			console.log("netcastBranch.remoteGuid, r error: ", e);
			throw (e);
		}
	}

	getNextRelayIndex(): number {
		// this method is used to switch between the relay branches

		++this.currentRelayIndex; //increment
		if (this.currentRelayIndex >= this.maxRelays) {
			this.currentRelayIndex = 0; //reset
		}
		return this.currentRelayIndex;

		//++this.currentRelayIndex; //increment
		//let relayIndex: number = this.currentRelayIndex; //assign
		//if (relayIndex >= this.maxRelays) {
		//	relayIndex = 0; //reset
		//}

		//return relayIndex;
	}

	initNetcast(remoteGuid: string, netcastKind: NetcastKind): NetcastType {
		try {
			let netcast: NetcastType = this.getPc(remoteGuid, this.netcastConnections);

			if (this.service.isEmpty(netcast)) {
				netcast = new NetcastType();
				netcast.remoteGuid = remoteGuid;
				let pc: RTCPeerConnection = this.service.createRtcPeerConnection();
				// Create all your data channels when you create your peerconnection
				// otherwise creating a new datachannel will trigger onnegotiationneeded
				if ("createDataChannel" in pc) {
					console.log("initNetcast YES datachannel");
					let dc: RTCDataChannel = pc.createDataChannel(DataChannelKind.dcJsonType);
					netcast.dataChannels.push(dc);
					let alert = new MaterialAlertMessageType();
					alert.title = "Debugging";
					alert.message = "YES DataChannel";
					this.service.openAlert(alert);
				}
				else {
					// TODO: comment out the alert after debugging
					let alert = new MaterialAlertMessageType();
					alert.title = "Debugging";
					alert.message = "No DataChannel";
					this.service.openAlert(alert);
					console.log("initNetcast NO datachannel");
				}

				netcast.peerConnection = pc;
				//netcast.peerConnection.addIceCandidate(null);
				this.startPeerConnectionListeners(netcast);
				netcast.netcastKind = netcastKind;
				this.netcastConnections.push(netcast);
			}

			return netcast;
		}
		catch (e) {
			throw (e);
		}
	}

	async switchMediaStream(netcast: NetcastType, newMediaStream: MediaStream): Promise<void> {
		let promises = [];

		netcast.mediaStream = newMediaStream;

		let senders = netcast.peerConnection.getSenders();
		//console.log("senders: ", senders);

		let tracks = netcast.mediaStream.getTracks();
		//console.log("tracks: ", tracks);

		senders.forEach((s: RTCRtpSender) => {
			promises.push(
				s.replaceTrack(
					tracks.find((t: MediaStreamTrack) => {
						return t.kind == s.track.kind;
					})
				)
			);
		})

		let results = Promise.all(promises);

		console.log("offerVideo results: ", results);

		return;
	}

	async switchCamera(): Promise<void> {
		try {
			this.canSwitchVideo = false;
			let currentMediaStreamId: string = this.netcastStreamId;
			let lastIndex: number = this.mediaStreams.length - 1;
			let nextIndex: number = -1;
			let index: number = this.mediaStreams.findIndex((m: MediaStream) => {
				return m.id == currentMediaStreamId;
			});

			if (index < 0) {
				throw ("No media streams found.");
			}

			if (index < lastIndex) {
				nextIndex = index + 1;
			}
			else {
				nextIndex = 0;
			}

			//console.log("switchCamera available Devices: ", this.availableVideoDevices);

			//console.log("nextIndex: ", nextIndex);

			this.netcastStreamId = this.mediaStreams[nextIndex].id;

			//this.peerConnections.forEach((p) => {
			//	//p.peerConnection.removeStream(this.mediaStream);
			//	p.peerConnection.removeTrack(p.rtpSender);
			//});

			//await this.stopVideo();

			//console.log("current mediaStream:", this.mediaStream);
			//let tracks = this.mediaStream.getTracks();
			//console.log("current tracks: ", tracks);

			let mediaStream: MediaStream = this.mediaStreams.find((m: MediaStream) => {
				return m.id == this.netcastStreamId;
			});
			await this.service.attachMediaStream(this.mainVideoElement.nativeElement, mediaStream);

			let promises = [];

			this.netcastConnections.forEach((n: NetcastType) => {
				promises.push(this.switchMediaStream(n, mediaStream));
			});

			let result = await Promise.all(promises);
			console.log("swithCamera result: ", result);

			this.canSwitchVideo = true;

			return;
		}
		catch (e) {
			console.log("switchCamera error: ", e);
		}
	}

	async getMediaStream(mediaDevices: Array<MediaDeviceInfo>, videoDeviceId: string): Promise<MediaStream> {
		try {
			let hasSpeakers: boolean = false;
			let hasMicroPhone: boolean = false;
			let hasCamera: boolean = false;

			let audioOutputIndex: number = mediaDevices.findIndex((m: MediaDeviceInfo) => {
				return m.kind === "audiooutput" && this.service.isEmpty(m.groupId) === false;
			});

			if (audioOutputIndex > -1) {
				hasSpeakers = true;
			}

			let audioInputIndex: number = mediaDevices.findIndex((m: MediaDeviceInfo) => {
				return m.kind === "audioinput";
			});

			if (audioInputIndex > -1) {
				hasMicroPhone = true;
			}

			let videoDeviceIndex: number = mediaDevices.findIndex((m: MediaDeviceInfo) => {
				return m.kind === "videoinput";
			});

			if (videoDeviceIndex > -1) {
				hasCamera = true;
			}

			if (hasCamera === false) {
				throw ("No cameras found.");
			}

			// TODO: put together the constraints and grab the LocalMediaStream
			// for the deviceId

			let constraints: MediaStreamConstraints = {};

			let videoConstraints: MediaTrackConstraints = {
				deviceId: { exact: videoDeviceId },
				frameRate: 15,
				width: 320,
				height: 240
			}

			constraints.video = videoConstraints;
			constraints.audio = (hasSpeakers && hasMicroPhone) ? true : false;

			let mediaStream: MediaStream = await this.getUserMedia(constraints);

			return mediaStream;
		}
		catch (e) {
			//console.log("e: ", e);
			throw (e);
		}
	}

	async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
		try {
			let mediaStream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);
			return mediaStream;
		}
		catch (e) {
			throw (e);
		}
	}

	async deleteAllConnections(): Promise<void> {
		let promises = [];
		this.netcastConnections.forEach((n: NetcastType) => {
			promises.push(
				this.sendDisconnect(n)
					.catch((e) => {
						return;
					})
					.then(() => {
						this.removePc(n);
						return;
					})
			);
		});
		let results = await Promise.all(promises);
		console.log("delete AllConnections results: ", results);
	}

	async sendDisconnect(netcast: NetcastType): Promise<void> {
		let dc: RTCDataChannel = netcast.getDataChannel(DataChannelKind.dcJsonType);
		if (this.service.isEmpty(dc) === false && dc.readyState === RTCDataChannelStateEnum.open) {
			let message = new DcJsonType();
			message.remoteGuid = this.localGuid;
			// TODO: status should be from a lookup list or enum
			message.json = SystemEventEnum.disconnected;
			message.objectType = SystemEventEnum.name;
			dc.send(this.service.stringify(message));
		}
		else {
			await this.service.getAccessToken();
			await this.service.sendDisconnect(netcast.remoteGuid);
		}

		return;
	}
}