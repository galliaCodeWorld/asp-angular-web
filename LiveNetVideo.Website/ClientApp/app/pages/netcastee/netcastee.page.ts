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
import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators
} from '@angular/forms';

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
	JwtToken,
	NetcastLinkType,
	RequestNetcastStubType,
	RtcPeerConnectionStateEnum,
	RtcIceConnectionStateEnum,
	LoginOptionsEnum,
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
	LoginOptionsComponent,
	MemberLoginFormComponent,
} from "../../components/index";
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

@Component({
	templateUrl: 'netcastee.page.html',
	styleUrls: ['./netcastee.page.scss'],
})
export class NetcasteePage implements OnInit, AfterViewInit {
	constructor(
		public router: Router,
		public activatedRoute: ActivatedRoute,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public ngZone: NgZone,
		public matDialog: MatDialog,
		private service: Service,
		private fb: FormBuilder,
	) {
		this.createForm();
		//window.onbeforeunload = function (e) {
		//	this.service.broadcastDisconnected(this.localGuid);
		//	return;
		//};
	}

	// NOTE: call this.service.getAccessToken() before calling any
	// methods that require accessToken like calls to signalr Hub or WebApi
	// getAccessToken() will retrieve existing token or renew existing token
	// and call setAccessToken() which will store the jwtToken in session
	// or permanent storeage, and set this.webRtcHub.state.accessToken = jwtToken.access_token;
	// this will ensure the token checked by the hub or webapi is valid

	// Listen for window close or tab close or page refresh

	@HostListener('window:beforeunload', ['$event'])
	windowBeforeUnload($event) {
		//$event.returnValue = false;
		this.service.broadcastDisconnected(this.localGuid);

		//if(this.hasChanges) $event.returnValue='Your data will be lost!';
	}

	@ViewChild('mainVideoElement') mainVideoElement: ElementRef;
	//@ViewChild('secondVideoElement') secondVideoElement: ElementRef;
	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;

	netcastId: number;
	netcast: NetcastDto;

	// variables to display in UI
	mainRemoteGuid: string;
	secondRemoteGuid: string;

	netcastConnections: NetcastType[];

	currentRelayIndex: number = 0;

	get maxRelays(): number {
		return 2;
	}

	// the remoteGuid of the original netcaster
	netcasterGuid: string;

	showProgress: boolean = false;

	showAltProgress: boolean = false;
	//remoteGuid: string;
	localGuid: string;

	//tempNetcastRemoteGuid: string;

	altRemoteGuid: string;

	ngAfterViewInit() {
		console.log("ngAfterViewInit");
	}

	ngOnInit() {
		console.log("ngOnInit");

		this.activatedRoute.paramMap.subscribe((params) => {
			this.netcastId = Number(params.get('netcastId'));
		});

		//this.peerConnections = new Array<PeerConnectionType>();
		//this.backupNetcasterConnections = new Array<PeerConnectionType>();
		//this.netcasteeConnections = new Array<PeerConnectionType>();
		//this.netcasterConnections = new Array<PeerConnectionType>();

		this.netcastConnections = new Array<NetcastType>();

		let canStartApp: boolean = false;

		this.service.checkIsLoggedIn()
			.then(async (isLoggedIn: boolean): Promise<boolean> => {
				if (isLoggedIn) {
					return this.service.isCheckedIntoHubConnection();
				}
				else {
					return new Promise<boolean>((resolve) => {
						// prompt for login or continue as guest,  then startApp() or cancel and leave page
						let dialogRef = this.matDialog.open(LoginOptionsComponent, {
							id: 'login-options',
							width: '80%',
							height: '80%'
						});

						let canStart: boolean = false;
						dialogRef.componentInstance.onContinue.subscribe(async (loginOption: LoginOptionsEnum): Promise<void> => {
							console.log("selected loginOption: ", loginOption);
							if (loginOption === LoginOptionsEnum.instantGuestLogin) {
								await this.service.instantGuestLogin();
								canStart = true;
								dialogRef.close();
							}
							else if (loginOption === LoginOptionsEnum.memberLogin) {
								let memberLoginRef = this.matDialog.open(MemberLoginFormComponent, {
									id: 'member-login-form',
									width: '80%',
									height: '80%'
								});

								memberLoginRef.componentInstance.onMemberLoginSuccess.subscribe(() => {
									canStart = true;
									memberLoginRef.close();
								});

								memberLoginRef.afterClosed().subscribe(() => {
									memberLoginRef.componentInstance.onMemberLoginSuccess.unsubscribe();
									dialogRef.close();
								});
							}
							else {
								dialogRef.close();
							}
						});

						dialogRef.afterClosed().subscribe(() => {
							dialogRef.componentInstance.onContinue.unsubscribe();
							resolve(canStart);
						});
					})

					//await this.service.instantGuestLogin();
					//return true;
				}
			})
			.then((canStart: boolean) => {
				canStartApp = canStart;
			})
			.catch((e) => {
				console.log("phone.page checkIsLoggedIn error: ", e);
			})
			.then(() => {
				// finally
				if (canStartApp) {
					this.startApp();
				}
				else {
					// redirect to login page
					this.service.doLogout()
						.then(() => {
							this.router.navigate(['/login']);
						})
						.catch((e) => {
						})
				}
			});

		//try {
		//	this.startApp();
		//}
		//catch (e) {
		//	console.log("error starting netcastee: ", e);
		//}
	}

	ngOnDestroy() {
		console.log("ngOnDestroy");
		this.hangUp();
		this.endSubscriptions();
		this.service.broadcastDisconnected(this.localGuid);
	}

	async startApp(): Promise<void> {
		console.log("netcastee startApp");
		try {
			console.log("this.service.isLoggedIn: ", this.service.isLoggedIn);
			if (this.service.isEmpty(this.service.isLoggedIn)) {
				// call this.service.getAccessToken() to renew the accessToken
				// if needed. This also stores the accessToken in session or permanent storage
				// and sets the this.webRtcHub.state.accessToken = jwtToken.access_token;
				let accessToken: string = await this.service.getAccessToken();
				if (this.service.isEmpty(accessToken)) {
					throw ("Access is denied.");
				}
				console.log("accessToken: ", accessToken);
				await this.service.instantGuestLogin();
				await this.service.initPhoneService("Guest");
				let memberType = new MemberType();

				memberType.email = this.service.guestProfile.email;
				memberType.memberId = 1;
				memberType.avatarDataUri = "";
				memberType.firstName = "";
				memberType.lastName = "";
				let onProfileUpdate: BehaviorSubject<ObservableMessageType> = this.service.onProfileUpdated;
				let message = new ObservableMessageType();
				message.message = this.service.stringify(memberType);
				onProfileUpdate.next(message);
				onProfileUpdate.next(new ObservableMessageType());

				let loginMessage: ObservableMessageType = new ObservableMessageType();
				loginMessage.message = this.service.stringify(this.service.isLoggedIn);
				let onLoginUpdated: BehaviorSubject<ObservableMessageType> = this.service.onLoginUpdated;
				onLoginUpdated.next(loginMessage);
				onLoginUpdated.next(new ObservableMessageType());
			}
			else {
				// TODO: redirect back to login page
			}

			console.log("localGuid: ", this.service.localGuid);
			this.localGuid = this.service.localGuid;

			let accessToken: string = await this.service.getAccessToken();

			if (this.service.isEmpty(this.netcastId)) {
				throw ("Unable to get netcast information. It appears the netcast identifier is missing or invalid.");
			}
			else {
				this.netcast = await this.service.getNetcastById(this.netcastId, accessToken);
			}

			if (this.service.isEmpty(this.netcast)) {
				throw ("Unable to retrieve netcast information.");
			}

			if (this.service.isEmpty(this.netcast.connectionGuid)) {
				throw ("The netcaster is not streaming at this time. Please try again later.");
			}

			await this.startSubscriptions();

			this.getNetcast(this.netcast.connectionGuid);
			return;
		}
		catch (e) {
			console.log("netcastee.page.ts startApp error: ", e);
			//throw (e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = "Sorry, unable to locate the netcast. The Netcaster might be offline.";
			this.service.openAlert(alert);
		}
	}

	// #region simulations

	getRemoteGuidForm: FormGroup;
	getAltNetcastForm: FormGroup;

	createForm() {
		this.getAltNetcastForm = this.fb.group({
			altGuid: new FormControl('', [
				Validators.maxLength(300),
				Validators.required

			])
		});
		this.getRemoteGuidForm = this.fb.group({
			remoteGuid: new FormControl('', [
				Validators.maxLength(300),
				Validators.required

			])
		});
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
		console.log("deleteAllConnections results: ", results);
	}

	setNetcasterGuid(): void {
		// this is for testing only, it stores the netcasterGuid manullay. In the
		// real system, it will get stored automatically when the user requests
		// the netcast from the netcaster

		if (this.getRemoteGuidForm.valid) {
			try {
				this.showProgress = true;
				let remoteGuid = this.getRemoteGuidForm.get('remoteGuid').value;

				console.log("setting netcasterGuid : ", remoteGuid);
				this.netcasterGuid = remoteGuid;
				this.showProgress = false;
			}
			catch (e) {
				this.showProgress = false;
				console.log("sendDataChannelMessage Error: ", e);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	sendDataChannelMessage(): void {
		if (this.getRemoteGuidForm.valid) {
			try {
				this.showProgress = true;
				let remoteGuid = this.getRemoteGuidForm.get('remoteGuid').value;

				console.log("test sending datachannel message to : ", remoteGuid);

				let netcast: NetcastType = this.netcastConnections.find((n: NetcastType) => {
					return n.remoteGuid == remoteGuid;
				})

				if (this.service.isEmpty(netcast) === false) {
					let dc: RTCDataChannel = netcast.getDataChannel(DataChannelKind.dcJsonType);
					if (this.service.isEmpty(dc) === false && dc.readyState == RTCDataChannelStateEnum.open) {
						let message = new DcJsonType();
						message.remoteGuid = this.localGuid;
						// TODO: status should be from a lookup list or enum
						message.json = "Hello people";
						message.objectType = String.name;
						dc.send(this.service.stringify(message));
					}
					else {
						// TODO: implement signalr fallback
						throw ("No datachannel to send message : " + remoteGuid);
					}
				}
				else {
					throw ("invalid remoteGuid");
				}
				this.showProgress = false;
			}
			catch (e) {
				this.showProgress = false;
				console.log("sendDataChannelMessage Error: ", e);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	async renewJwtToken(): Promise<void> {
		try {
			let token: JwtToken = await this.service.renewToken(this.service.jwtToken);
			this.service.setAccessToken(token);
			console.log("token: ", token);
		}
		catch (e) {
			console.log('exception e: ', e);
		}
	}

	async disconnect(): Promise<void> {
		// disconnect a RTCPeerConnection
		console.log("testDisconnect");
		if (this.getRemoteGuidForm.valid) {
			try {
				this.showProgress = true;
				let remoteGuid = this.getRemoteGuidForm.get('remoteGuid').value;

				//let netcast: NetcastType = this.getPc(remoteGuid, this.netcastConnections);
				let netcast: NetcastType = this.netcastConnections.find((n: NetcastType) => {
					return n.remoteGuid == remoteGuid;
				});

				if (this.service.isEmpty(netcast) === false) {
					//let dc: RTCDataChannel = netcast.getDataChannel(DataChannelKind.dcJsonType);
					//if (this.service.isEmpty(dc) === false && dc.readyState === RTCDataChannelStateEnum.open) {
					//	let message = new DcJsonType();
					//	message.remoteGuid = this.localGuid;
					//	// TODO: status should be from a lookup list or enum
					//	message.json = SystemEventEnum.disconnected;
					//	message.objectType = SystemEventEnum.name;
					//	dc.send(this.service.stringify(message));
					//}
					//else {
					//	await this.service.getAccessToken();
					//	await this.service.sendDisconnect(remoteGuid);
					//}

					await this.sendDisconnect(netcast);

					this.removePc(netcast);
				}

				this.showProgress = false;
			}
			catch (e) {
				this.showProgress = false;
				console.log("viewNetcast Error: ", e);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	async getPCOnly(): Promise<void> {
		// establish a RTCPeerConnection with netcaster without any mediastreamtracks
		console.log("testGetPeerConnectionOnly");
		if (this.getRemoteGuidForm.valid) {
			try {
				this.showProgress = true;
				let remoteGuid = this.getRemoteGuidForm.get('remoteGuid').value;
				let incoming: NetcastType = this.initNetcast(remoteGuid, NetcastKind.incoming);
				await this.service.getAccessToken();
				await this.service.requestPCOnly(incoming.remoteGuid, this.service.stringify({ remoteGuid: this.localGuid }));
				this.showProgress = false;
			}
			catch (e) {
				this.showProgress = false;
				console.log("viewNetcast Error: ", e);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	async getNetcast(remoteGuid?: string): Promise<void> {
		if (this.service.isEmpty(remoteGuid)) {
			// request a new RTCPeerConnection from a specific remoteGuid to receive video
			if (this.getRemoteGuidForm.valid) {
				try {
					this.showProgress = true;
					let remoteGuid = this.getRemoteGuidForm.get('remoteGuid').value;
					let incoming: NetcastType = this.initNetcast(remoteGuid, NetcastKind.incoming);
					console.log("get Netcast from remoteGuid: ", incoming.remoteGuid);
					// call this.service.getAccessToken() to renew the accessToken
					// if needed. This also stores the accessToken in session or permanent storage
					// and sets the this.webRtcHub.state.accessToken = jwtToken.access_token;
					await this.service.getAccessToken();
					await this.service.requestNetcast(incoming.remoteGuid, this.service.stringify({ remoteGuid: this.localGuid }));
					this.showProgress = false;
				}
				catch (e) {
					this.showProgress = false;
					console.log("viewNetcast Error: ", e);
				}
			}
			else {
				let alert = new MaterialAlertMessageType();
				alert.title = "Please Check";
				alert.message = "Please make sure the form is filled out and any error messages are fixed."
				this.service.openAlert(alert);
			}
		}
		else {
			try {
				this.showProgress = true;
				let incoming: NetcastType = this.initNetcast(remoteGuid, NetcastKind.incoming);
				console.log("get Netcast from remoteGuid: ", incoming.remoteGuid);
				// call this.service.getAccessToken() to renew the accessToken
				// if needed. This also stores the accessToken in session or permanent storage
				// and sets the this.webRtcHub.state.accessToken = jwtToken.access_token;
				await this.service.getAccessToken();
				await this.service.requestNetcast(incoming.remoteGuid, this.service.stringify({ remoteGuid: this.localGuid }));
				this.showProgress = false;
			}
			catch (e) {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = "Sorry, unable to locate the netcast.";
				this.service.openAlert(alert);
			}
		}
	}

	async getSecondaryNetcast(): Promise<void> {
		// request a second new RTCPeerConnection to receive video and display in second video box
		if (this.getRemoteGuidForm.valid) {
			try {
				this.showProgress = true;

				let remoteGuid: string = this.getRemoteGuidForm.get('remoteGuid').value;
				let incoming: NetcastType = this.initNetcast(remoteGuid, NetcastKind.incoming);
				console.log("request secondary Netcast from remoteGuid: ", incoming.remoteGuid);
				//incoming.videoElement = this.secondVideoElement;
				await this.service.getAccessToken();
				await this.service.requestNetcast(incoming.remoteGuid, this.service.stringify({ remoteGuid: this.localGuid }));
				this.showProgress = false;
			}
			catch (e) {
				this.showProgress = false;
				console.log("viewNetcast Error: ", e);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	async getPCStreamOnly(): Promise<void> {
		// get an existing RTCPeerConnection and asking that netcaster to add mediastreamtracks to the
		// RTCPeerConnection

		// simulate lost connection and getting mediastream from another peerconnection
		// who will add a stream when requested
		console.log("testGetMediaStreamFromPeerConnection");
		if (this.getRemoteGuidForm.valid) {
			try {
				this.showProgress = true;
				let remoteGuid = this.getRemoteGuidForm.get('remoteGuid').value;

				let incoming: NetcastType = this.netcastConnections.find((n: NetcastType) => {
					return n.remoteGuid == remoteGuid && n.netcastKind == NetcastKind.incoming;
				})

				if (this.service.isEmpty(incoming) === false) {
					await this.service.getAccessToken();
					await this.service.requestPCStream(incoming.remoteGuid, this.service.stringify({ remoteGuid: this.localGuid }));
				}
				else {
					throw ("unable to get RTCPeerConnection to request stream");
				}

				this.showProgress = false;
			}
			catch (e) {
				this.showProgress = false;
				console.log("viewNetcast Error: ", e);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	getExistingPCMediaStream(): void {
		// get an existing RTCPeerConnection which has a media stream already

		// simulate lost connection and getting media stream from another existing peer connection with media stream
		if (this.getRemoteGuidForm.valid) {
			try {
				this.showProgress = true;
				let remoteGuid = this.getRemoteGuidForm.get('remoteGuid').value;

				try {
					if (this.netcastConnections.length > 0) {
						// look for the first available netcaster with a media stream
						//let netcaster: PeerConnectionType = this.netcasterConnections.find((p: PeerConnectionType) => {
						//	return p.mediaStream != null && (p.peerConnection.iceConnectionState == "completed" || p.peerConnection.iceConnectionState == "connected");
						//})

						let incoming: NetcastType = this.netcastConnections.find((p: NetcastType) => {
							return p.remoteGuid == remoteGuid && p.netcastKind == NetcastKind.incoming;
						})

						if (this.service.isEmpty(incoming) === false) {
							// switch the stream for any child netcastees
							this.netcastConnections.forEach((n: NetcastType) => {
								this.switchMediaStream(n, incoming.mediaStream);
							})

							// display the video
							this.service.attachMediaStream(this.mainVideoElement.nativeElement, incoming.mediaStream)
								.then(() => {
									this.mainVideoElement.nativeElement.muted = false;
									this.mainVideoElement.nativeElement.play();
								});
						}
						else {
							throw ("no alternative netcaster connections with a media stream");
						}
					}
					else {
						throw ("no alternative netcaster connections with a media stream");
					}
				}
				catch (e) {
					throw (e);
				}

				this.showProgress = false;
			}
			catch (e) {
				this.showProgress = false;
				console.log("testGetBackupMediaStream Error: ", e);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	async getAltNetcast(): Promise<void> {
		// simulating lost netcaster connection and get a new peer connection

		// NOTE: the media stream will arrive during webrtclisteners pc.ontrack event
		// this is when we will relay the new video to any existing netcastee

		// simulate getting mediastream from new peerconnection netcaster
		// request a new RTCPeerConnection from the alt remoteGuid and use that
		// stream to replace the disconected child peer streams
		if (this.getAltNetcastForm.valid) {
			try {
				this.showAltProgress = true;

				let remoteGuid: string = this.getAltNetcastForm.get('altGuid').value;
				let incoming: NetcastType = this.initNetcast(remoteGuid, NetcastKind.incoming);
				console.log("request Alt Netcast from remoteGuid: ", incoming.remoteGuid);
				await this.service.getAccessToken();
				await this.service.requestNetcast(incoming.remoteGuid, this.service.stringify({ remoteGuid: this.localGuid }));
				this.showAltProgress = false;
			}
			catch (e) {
				this.showAltProgress = false;
				console.log("viewNetcast Error: ", e);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	// #endregion

	async relayNetcast(remoteGuid: string): Promise<void> {
		// simulate relaying a netcast to a netcastee
		console.log("relaying Netcast");
		try {
			// make sure we have an existing netcasterConnections
			if (this.netcastConnections.length > 0) {
				// loop through netcastConnections and get first active incoming mediaStream that
				// is not the current remoteGuid and foward it
				let relay: NetcastType = this.netcastConnections.find((n: NetcastType) => {
					//return n.mediaStream != null && n.remoteGuid != remoteGuid && (n.peerConnection.iceConnectionState == "completed" || n.peerConnection.iceConnectionState == "connected");
					return n.mediaStream != null && n.mediaStream.active == true && n.remoteGuid != remoteGuid && n.netcastKind == NetcastKind.incoming;
				})

				if (this.service.isEmpty(relay) === false) {
					let outgoing: NetcastType = this.getPc(remoteGuid, this.netcastConnections);

					if (this.service.isEmpty(outgoing) === false) {
						// we have existing peerConnection with netcastee, so try to replace the mediastream
						console.log("existing netcastee connection: ", outgoing);
						this.switchMediaStream(outgoing, relay.mediaStream);
					}
					else {
						// remoteGuid does not exist, create new pc and push it to array

						// create container for RtcPeerConnection
						outgoing = this.initNetcast(remoteGuid, NetcastKind.outgoing);
						outgoing.mediaStream = relay.mediaStream;
						//let rtpSender: RTCRtpSender;
						outgoing.mediaStream.getTracks().forEach((t: MediaStreamTrack) => {
							outgoing.peerConnection.addTrack(t, outgoing.mediaStream);
						})
						//pcType.rtpSender = rtpSender;
						//pc.addStream(currentPcType.mediaStream);
						let localSdpOffer: RTCSessionDescriptionInit = await outgoing.peerConnection.createOffer();
						await outgoing.peerConnection.setLocalDescription(localSdpOffer);
						console.log("sending sdp offer to : ", remoteGuid);
						await this.service.getAccessToken();
						await this.service.sendSDP(outgoing.remoteGuid, this.service.stringify(localSdpOffer));
					}
				}
				else {
					console.log("Unable to find a previous netcaster with a video stream");
				}
			}
			else {
				console.log("can not relay without a previous peerconnection")
			}
		}
		catch (e) {
			throw (e);
		}
	}

	async stopVideo(): Promise<void> {
		//if (this.service.isEmpty(this.mediaStream) === false) {
		//	this.service.stopMediaStream(this.mediaStream);
		//}
		//this.mediaStream = null;

		this.mainVideoElement.nativeElement.srcObject = null;
		//this.secondVideoElement.nativeElement.srcObject = null;
		return;
	}

	hangUp() {
		console.log("hanging up");

		this.stopVideo();
		//this.netcasterConnection && this.netcasterConnection.close();
		//this.pc2 && this.pc2.close();
		if (this.netcastConnections.length > 0) {
			this.netcastConnections.forEach((netcast: NetcastType) => {
				netcast.peerConnection.close();
			});
			this.netcastConnections = new Array<NetcastType>();
		}
	}

	exit() {
		this.hangUp();
		this.router.navigate(['/netcast-search'], { relativeTo: this.activatedRoute });
	}

	// #region signalr Subscriptions

	receiveSDP: Subscription;
	receiveICE: Subscription;
	receiveRequestNetcast: Subscription;
	someoneDisconnected: Subscription;
	receiveRequestPCOnly: Subscription;
	receiveRequestPCStream: Subscription;
	receiveDisconnect: Subscription;
	receiveNetcastStub: Subscription;
	receiveRequestNetcastStub: Subscription;
	// #endregion

	startSubscriptions(): void {
		console.log("starting subscriptions for signalr messages");

		this.receiveDisconnect = this.service.receiveDisconnect
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveDisconnect message: ", message.timestamp);
				try {
					let remoteGuid: string = message.message;

					if (this.service.isEmpty(remoteGuid) === false) {
						this.handleDisconnectEvent(remoteGuid);
					}
				}
				catch (e) {
					console.log("Receive receiveDisconnect error: ", e);
				}
			});

		this.receiveNetcastStub = this.service.receiveNetcastStub
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveNetcastStub message: ", message.timestamp);
				try {
					let remoteGuid: string = message.message;

					if (this.service.isEmpty(remoteGuid) === false) {
						// When we receive a stub, there is the possibility that the user initiated a requestNetcast call
						// to the original netcaster, and the netcaster sent them a stub, and they arrive here
						// . Now we need to remove the orphaned original netcaster entry
						// The original netcaster entry will not have a connected peerConnection.
						// Remove all netcasts

						let nt: NetcastType = this.getPc(this.netcasterGuid, this.netcastConnections);
						if (this.service.isEmpty(nt) === false) {
							if (nt.peerConnection.connectionState !== RtcPeerConnectionStateEnum.connected) {
								this.removePc(nt);
							}
						}

						let incoming: NetcastType = this.initNetcast(remoteGuid, NetcastKind.incoming);
						console.log("receiveNetcastStub getting Netcast from remoteGuid: ", incoming.remoteGuid);
						// call this.service.getAccessToken() to renew the accessToken
						// if needed. This also stores the accessToken in session or permanent storage
						// and sets the this.webRtcHub.state.accessToken = jwtToken.access_token;
						await this.service.getAccessToken();
						await this.service.requestNetcast(incoming.remoteGuid, this.service.stringify({ remoteGuid: this.localGuid }));
					}
				}
				catch (e) {
					console.log("Receive receiveNetcastStub error: ", e);
				}
			});

		this.receiveRequestNetcastStub = this.service.receiveRequestNetcastStub
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveRequestNetcastStub message: ", message.timestamp);
				try {
					let json = message.message;
					if (this.service.isEmpty(json) === false) {
						let re: RequestNetcastStubType = this.service.jsonToObject<RequestNetcastStubType>(json, true);
						await this.handleRequestNetcastStub(re);
					}
					else {
						throw ("Received empty receiveRequestNetcastStub message.")
					}
				}
				catch (e) {
					// fatal error
					//let alert = new MaterialAlertMessageType();
					//alert.title = "Error";
					//alert.message = e;
					//this.service.openAlert(alert);
					console.log("receiveRequestNetcastStub error: ", e);
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
				//console.log("receiveICE message: ", message);
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
						// NOTE: we are using system message to exchange remoteGuid
						// this is for testing only

						await this.relayNetcast(json.remoteGuid);
					}
					else {
						throw ("Received empty request netcast.")
					}
				}
				catch (e) {
					console.log("Receive request netcast error: ", e);
				}
			});

		this.receiveRequestPCOnly = this.service.receiveRequestPCOnly
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveRequestPCOnly: ", message);
				try {
					let json = JSON.parse(message.message);
					if (this.service.isEmpty(json) === false && "remoteGuid" in json) {
						let remoteGuid = json.remoteGuid;
						let outgoing: NetcastType = this.initNetcast(remoteGuid, NetcastKind.outgoing);

						let localSdpOffer: RTCSessionDescriptionInit = await outgoing.peerConnection.createOffer();
						await outgoing.peerConnection.setLocalDescription(localSdpOffer);
						console.log("receiveRequestPCOnly sending sdp offer to : ", remoteGuid);
						await this.service.getAccessToken();
						await this.service.sendSDP(outgoing.remoteGuid, this.service.stringify(localSdpOffer));
					}
					else {
						throw ("Received empty request PCOnly.")
					}
				}
				catch (e) {
					console.log("Receive request PCOnly error: ", e);
				}
			});

		this.receiveRequestPCStream = this.service.receiveRequestPCStream
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveRequestPCStream: ", message);
				try {
					let json = JSON.parse(message.message);
					if (this.service.isEmpty(json) === false && "remoteGuid" in json) {
						let remoteGuid = json.remoteGuid;
						let outgoing: NetcastType = this.getPc(remoteGuid, this.netcastConnections);

						if (this.service.isEmpty(outgoing) === false) {
							// get the first avaible video stream that is not the target connection
							let relay: NetcastType = this.netcastConnections.find((p) => {
								return p.mediaStream != null && p.remoteGuid != remoteGuid && (p.peerConnection.iceConnectionState == "completed" || p.peerConnection.iceConnectionState == "connected");
							});

							if (this.service.isEmpty(relay) === false) {
								outgoing.mediaStream = relay.mediaStream;
								outgoing.mediaStream.getTracks().forEach((t: MediaStreamTrack) => {
									outgoing.peerConnection.addTrack(t, outgoing.mediaStream);
								})

								let localSdpOffer: RTCSessionDescriptionInit = await outgoing.peerConnection.createOffer();
								await outgoing.peerConnection.setLocalDescription(localSdpOffer);
								console.log("sending sdp offer to : ", remoteGuid);
								await this.service.getAccessToken();
								await this.service.sendSDP(outgoing.remoteGuid, this.service.stringify(localSdpOffer));
							}
							else {
								throw ("No netcaster streams to foward");
							}
						}
						else {
							throw ("No peerconnection found");
						}
					}
					else {
						throw ("Received empty request PCOnly.")
					}
				}
				catch (e) {
					console.log("Receive request PCOnly error: ", e);
				}
			});
	}

	endSubscriptions(): void {
		this.someoneDisconnected && this.someoneDisconnected.unsubscribe();
		this.receiveSDP && this.receiveSDP.unsubscribe();
		this.receiveICE && this.receiveICE.unsubscribe();
		this.receiveRequestNetcast && this.receiveRequestNetcast.unsubscribe();
		this.receiveRequestPCOnly && this.receiveRequestPCOnly.unsubscribe();
		this.receiveRequestPCStream && this.receiveRequestPCStream.unsubscribe();
		this.receiveDisconnect && this.receiveDisconnect.unsubscribe();
		this.receiveNetcastStub && this.receiveNetcastStub.unsubscribe();
		this.receiveRequestNetcastStub && this.receiveRequestNetcastStub.unsubscribe();
	}

	initNetcast(remoteGuid: string, netcastKind: NetcastKind): NetcastType {
		try {
			// using existing netcast else create new
			let netcast: NetcastType = this.getPc(remoteGuid, this.netcastConnections);

			if (this.service.isEmpty(netcast)) {
				netcast = new NetcastType();
				netcast.remoteGuid = remoteGuid;
				let pc: RTCPeerConnection = this.service.createRtcPeerConnection();
				// Create all your data channels when you create your peerconnection
				// otherwise creating a new datachannel will trigger onnegotiationneeded
				console.log("pc: ", pc);
				if ("createDataChannel" in pc) {
					let dc: RTCDataChannel = pc.createDataChannel(DataChannelKind.dcJsonType);
					if ("send" in dc) {
						console.log("initNetcast YES datachannel", dc);
						netcast.dataChannels.push(dc);
						//let alert = new MaterialAlertMessageType();
						//alert.title = "Debugging";
						//alert.message = "YES DataChannel dc: " + this.service.stringify(dc);
						//this.service.openAlert(alert);
					}
					else {
						console.log("initNetcast NOo datachannel");
						let alert = new MaterialAlertMessageType();
						alert.title = "Debugging";
						alert.message = "NO DataChannel";
						this.service.openAlert(alert);
					}
				}
				else {
					console.log("initNetcast NO datachannel");
					let alert = new MaterialAlertMessageType();
					alert.title = "Debugging";
					alert.message = "NO DataChannel";
					this.service.openAlert(alert);
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

	async startPeerConnectionListeners(netcast: NetcastType): Promise<void> {
		console.log("starting pc listeners: ", netcast);
		try {
			netcast.peerConnection.oniceconnectionstatechange = (evt: Event) => {
				//console.log("oniceconnectionstatechange event: ", evt);

				//this.iceStateChangeHandler(pc, pc.iceConnectionState);
				this.iceStateChangeHandler(netcast);
			}

			netcast.peerConnection.onicecandidate = async (event: RTCPeerConnectionIceEvent): Promise<void> => {
				try {
					//console.log("sending ice to " + remoteGuid + " : ", event.candidate);
					await this.service.getAccessToken();
					await this.service.sendICE(netcast.remoteGuid, this.service.stringify(event.candidate))
				}
				catch (e) {
					console.log("send ice error: ", e);
				}
			};

			netcast.peerConnection.onnegotiationneeded = async (event): Promise<void> => {
				//note this gets called by webrtc built in code
				console.log("onnegogiationneeded evt:", event);

				//let localSdpOffer: RTCSessionDescriptionInit = await netcast.peerConnection.createOffer();
				//await netcast.peerConnection.setLocalDescription(localSdpOffer);
				//await this.service.sendSDP(netcast.remoteGuid, this.service.stringify(localSdpOffer));

				//// TODO: send the sdp offer using datachannel if available.
				//// fallback to signalr if datachannel is not available
				//let dataChannel: RTCDataChannel = netcast.getDataChannel(DataChannelKind.dcSdpType);
				//dataChannel.send()

				return;
			};

			// NOTE: when we receive a remote media stream
			netcast.peerConnection.ontrack = async (event: RTCTrackEvent): Promise<void> => {
				if (event.streams && event.streams.length) {
					try {
						netcast.mediaStream = event.streams[0];
						// relay the video to any netcastees (outgoing connections)

						if (this.service.isEmpty(netcast.videoElement) === false) {
							// if it has a target videoElement, this indicates the request
							// is for a secondary stream
							this.ngZone.run(() => {
								this.secondRemoteGuid = netcast.remoteGuid;
							})

							await this.service.attachMediaStream(netcast.videoElement.nativeElement, netcast.mediaStream);
							netcast.videoElement.nativeElement.muted = false;
							//netcast.videoElement.nativeElement.play();
						}
						else {
							// this request is targeting the main video element,
							// this indicates that is is a broadcast stream or relay
							// switch it for all children
							this.netcastConnections.forEach((n: NetcastType) => {
								if (n.netcastKind === NetcastKind.outgoing) {
									this.switchMediaStream(n, netcast.mediaStream);
								}
							});

							this.ngZone.run(() => {
								this.mainRemoteGuid = netcast.remoteGuid;
							});

							await this.service.attachMediaStream(this.mainVideoElement.nativeElement, netcast.mediaStream);
							this.mainVideoElement.nativeElement.muted = false;
							//this.mainVideoElement.nativeElement.play();
						}
					}
					catch (e) {
						console.log("error during peerConnection.ontrack: ", e);
					}
				}
				else {
					console.log('received empty video stream: ', event);
				}
			};

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

	iceStateChangeHandler(netcast: NetcastType): void {
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

	async handleDcMessage(event: MessageEvent): Promise<void> {
		try {
			let remoteDc: RTCDataChannel = event.target as RTCDataChannel;
			let json: string = event.data;

			let dcKind: string = remoteDc.label;
			if (dcKind === DataChannelKind.dcJsonType) {
				let dcJsonType: DcJsonType = this.service.jsonToObject<DcJsonType>(json);
				let remoteGuid = dcJsonType.remoteGuid;
				let typeName: string = dcJsonType.objectType;

				console.log("typeName: ", typeName);
				console.log("RequestNetcastStubType.name: ", RequestNetcastStubType.objectName);
				//NOTE: we only handle expected types
				switch (typeName) {
					case String.name:
						await this.handleStringMessage(dcJsonType.json);
						break;
					case SystemEventEnum.name:
						//console.log("handleDcMessage ")
						//console.log("handleDcMessage dcJsonType.json: ", dcJsonType.json);
						let systemEvent: SystemEventEnum = dcJsonType.json as SystemEventEnum;
						//console.log("handleDcMessage systemEvent: ", systemEvent);
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
			// NOTE: we only handle system events in the SystemEventEnum
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

	async handleRequestNetcastStub(r: RequestNetcastStubType): Promise<void> {
		// check if this node has any children node slots available
		// NOTE: a node will have upto two children nodes
		console.log("handleRequestNetcastStub RequestNetcastStubType: ", r);
		console.log("handleRequestNetcastStub this.netcastConnections: ", this.netcastConnections);
		let relays: NetcastType[] = this.getOutgoingRelays();
		//if (this.netcastConnections.length < this.maxRelays) {
		if (relays.length < this.maxRelays) {
			// TODO: this is node is a stub, using signalr to send this users remoteGuid
			// to the requester. The requester will then connect to this stub
			console.log("handleRequestNetcastStub start this.service.sendNetcastStub(remoteGuid): ", r.requesterGuid);
			await this.service.sendNetcastStub(r.requesterGuid);
			console.log("handleRequestNetcastStub finished this.service.sendNetcastStub(remoteGuid): ", r.requesterGuid);
			return;
		}
		else {
			// this node is full, send the message down the line
			console.log("handleRequestNetcastStub requestNetcastStub: ", r);
			this.requestNetcastStub(r, 0);
			return;
		}
	}

	requestNetcastStub(r: RequestNetcastStubType, currentTry?: number): boolean {
		// switch to next PeerConnection, transverse down the node to get the next available remoteGuid node to relay
		// send the free node's remoteGuid to the user requesting a netcast
		// the user will then send the requestNetcast request to the available relay node

		console.log("requestNetcastStub RequestNetcastStubType: ", r);
		console.log("requestNetcastStub start currentTry: ", currentTry);

		let maxTrys: number = 2;
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

			let relayBranch: NetcastType = typeof outgoingRelays[relayIndex] !== "undefined" ? outgoingRelays[relayIndex] : null;

			console.log("requestNetcastStub relayIndex: ", relayIndex);

			//let relayBranch: NetcastType = this.netcastConnections[relayIndex];
			if (this.service.isEmpty(relayBranch)) {
				if (currentTry < maxTrys) {
					return this.requestNetcastStub(r, currentTry);
				}
				else {
					// unable to send request
					return false;
				}
			}
			else {
				// send the request to get node relay stub using datachannel and then signalr fallback
				let dc: RTCDataChannel = relayBranch.getDataChannel(DataChannelKind.dcJsonType);
				if (this.service.isEmpty(dc) === false) {
					if (dc.readyState == RTCDataChannelStateEnum.open) {
						let message = new DcJsonType();
						message.remoteGuid = this.localGuid;
						message.json = this.service.stringify(r);
						message.objectType = RequestNetcastStubType.objectName;
						dc.send(this.service.stringify(message));

						// request sent
						return true;
					}
					else {
						// datachannel not ready for this node, move to the next one
						return this.requestNetcastStub(r, currentTry);
					}
				}
				else {
					this.service.sendRequestNetcastStub(relayBranch.remoteGuid, r);
					return true;
				}
			}
		}
		else {
			console.log("too many tries");
			return;
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

	handleDisconnectEvent(remoteGuid: string): void {
		let netcast: NetcastType = this.getPc(remoteGuid, this.netcastConnections);
		if (this.service.isEmpty(netcast) === false) {
			if (netcast.netcastKind === NetcastKind.incoming) {
				let re: RequestNetcastStubType = new RequestNetcastStubType();
				re.requesterGuid = this.localGuid;
				this.service.sendRequestNetcastStub(this.netcasterGuid, re);
			}
			this.removePc(netcast);
		}
		return;
	}

	async handleSdpMessage(sdpMessage: SdpMessageType): Promise<void> {
		try {
			if (this.service.isEmpty(sdpMessage) === false && this.service.isEmpty(sdpMessage.sender) === false) {
				//console.log("receive sdp Offer from : ", this.remoteGuid);
				let sdp: RTCSessionDescription = this.service.jsonToObject<RTCSessionDescription>(sdpMessage.sdp);
				console.log("receive sdp : ", sdp);
				let remoteGuid = sdpMessage.sender;
				if (sdp.type === "offer") {
					let incoming: NetcastType;

					incoming = this.getPc(remoteGuid, this.netcastConnections);

					if (this.service.isEmpty(incoming) === false) {
						// pcType exists, use it

						await incoming.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
						let localSdpAnswer: RTCSessionDescriptionInit = await incoming.peerConnection.createAnswer();
						await incoming.peerConnection.setLocalDescription(localSdpAnswer);
						//console.log("sending sdpAnswer: ", localSdpAnswer);
						await this.service.getAccessToken();
						await this.service.sendSDP(incoming.remoteGuid, this.service.stringify(localSdpAnswer));
					}
					else {
						throw ("Received sdp offer but unable to retrieve peerConnection to handle the sdp offer.");
					}
				}
				else {
					// type answer
					let outgoing = this.getPc(remoteGuid, this.netcastConnections);
					if (this.service.isEmpty(outgoing) === false) {
						await outgoing.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
					}
					else {
						throw ("Received sdp answer but unable to retrieve peerConnection to handle the sdp answer");
					}
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

			//console.log("handling iceMessage: ", iceMessage);

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

	getPc(remoteGuid: string, netcasts: NetcastType[]): NetcastType {
		return netcasts.find((n: NetcastType) => {
			return n.remoteGuid == remoteGuid;
		});
	}

	showPeers(): void {
		// displays the array of peerconnections to the console
		//console.log("netcasterConnections : ", this.netcasterConnections);
		//console.log("netcasteeConnections : ", this.netcasteeConnections);
		console.log("netcastConnections : ", this.netcastConnections);
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