/////<reference path="../../../node_modules/@types/node/index.d.ts" />
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatSnackBar, MatDialog, MatDialogRef } from '@angular/material';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
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
	AfterViewInit
} from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
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
	LoginOptionsEnum,
} from '../../models/index';

import { Service } from '../../services/index';
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

//import 'webrtc-adapter';

@Component({
	templateUrl: 'phone.page.html',
	styleUrls: ['./phone.page.scss'],
})
export class PhonePage implements OnInit, AfterViewInit {
	constructor(
		public router: Router,
		public activatedRoute: ActivatedRoute,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public ngZone: NgZone,
		public matDialog: MatDialog,
		private service: Service,
	) {
		//this.textMessages = new Array<TextMessageType>();
		this.gettingContacts = false;
		this.emailToCall = "";
		this.currentUsers = new Array<GenericUserType>();
		this.activatedRoute.paramMap.subscribe((params) => {
			this.emailToCall = params.get('emailToCall');
		});
	}
	//NOTE: phoneCallComponentInsert is a ViewContainerRef type, it lets angular know where to insert our dynamic component (PhoneCallComponent)
	@ViewChild('phoneCallComponentInsert', { read: ViewContainerRef }) phoneCallComponentInsert: ViewContainerRef;
	@ViewChild('localVideoElement') localVideoElement: ElementRef;
	@ViewChild('mainVideoElement') mainVideoElement: ElementRef;
	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;

	_isBusy: boolean;
	get isBusy(): boolean {
		return this._isBusy;
	}
	set isBusy(value: boolean) {
		this.ngZone.run(() => {
			this._isBusy = value;
		})
	}

	canMaxView: boolean = true;

	//showLocalVideo: boolean = false;

	showMinimizeMainVideo: boolean = false;

	textMessages: Array<TextMessageType>;
	currentMessage: TextMessageType;

	phoneLink: string;

	emailToCall: string;

	currentUsers: Array<GenericUserType>;

	gettingContacts: boolean;

	private contacts: Array<PhoneContactType>;

	public _phoneCallComponentFactory: ComponentFactory<PhoneCallComponent>;
	get phoneCallComponentFactory(): ComponentFactory<PhoneCallComponent> {
		return this._phoneCallComponentFactory;
	}
	set phoneCallComponentFactory(value: ComponentFactory<PhoneCallComponent>) {
		this._phoneCallComponentFactory = value;
	}

	public phoneCallComponentRefs: Array<ComponentRef<PhoneCallComponent>> = [];

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

	ngOnInit() {
		//console.log("phone.page.ts ngOnInit()");
		this.startSubscriptions();
		if (this.service.isEmpty(this.textMessages)) {
			this.textMessages = new Array<TextMessageType>();
		}
		let canStartApp: boolean = false;
		this.service.checkMemberCookieLogin()
			.then(() => {
				return this.service.checkIsLoggedIn();
			})
			.then(async (isLoggedIn: boolean): Promise<boolean> => {
				if (this.service.isEmpty(isLoggedIn) === false) {
					return this.service.isCheckedIntoHubConnection();
				}
				else {
					return new Promise<boolean>((resolve) => {
						// prompt for login, continue as guest,  then startApp() or cancel and leave page
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
	}

	ngOnDestroy() {
		(async () => {
			//console.log("phone.component.ts ngOnDestroy()");
			await this.hangUp();

			await this.stopLocalVideo();

			this.endSubscriptions();
		})();
	}

	async startApp(): Promise<void> {
		// for testing only: generate messages to display
		//for (let i = 1; i < 10; i++) {
		//	let message = new TextMessageType();
		//	message.imgSrc = this.service.defaultAvatar;
		//	message.message = i.toString() + " a long multiline message that a user would type to communicate with each other goes here for testing the display " + i.toString();
		//	message.name = "name" + i.toString();
		//	message.email = i.toString() + "@email.com";
		//	this.textMessages.unshift(message);
		//}
		//this.currentMessage = this.textMessages[0];

		let warnings: Array<string> = new Array<string>();
		try {
			//let memberType = new MemberType();
			let genericUser = new GenericUserType();
			if (this.service.isEmpty(this.service.profile) === false) {
				//memberType.email = this.service.profile.email;
				genericUser.id = this.service.localGuid;
				genericUser.email = this.service.profile.email;
				genericUser.name = this.service.profile.firstName + " " + this.service.profile.lastName;
				genericUser.imgSrc = this.service.isEmpty(this.service.profile.avatarFileName) ? this.service.defaultAvatar
					: this.service.avatarBaseUrl + this.service.profile.avatarFileName;
				this.currentUsers.push(genericUser);
				this.currentUsers = this.currentUsers.slice();

				this.phoneLink = this.service.baseUrl + `dist/#/phone/${genericUser.email}/`;
				//https://livenetvideo.com/Phone/dist/#/phone/user4@lvc.bz
			}
			else if (this.service.isEmpty(this.service.guestProfile) === false) {
				//memberType.email = this.service.guestProfile.email;
				genericUser.id = this.service.localGuid;
				genericUser.email = this.service.guestProfile.email;
				genericUser.name = this.service.guestProfile.name
				genericUser.imgSrc = this.service.isEmpty(this.service.guestProfile.avatarDataUri) ? this.service.defaultAvatar
					: this.service.guestProfile.avatarDataUri;
				this.currentUsers.push(genericUser);
				this.currentUsers = this.currentUsers.slice();
			}

			//let onProfileUpdate: BehaviorSubject<ObservableMessageType> = this.service.onProfileUpdated;
			//let message = new ObservableMessageType();
			//message.message = this.service.stringify(memberType);
			//onProfileUpdate.next(message);
			//onProfileUpdate.next(new ObservableMessageType());
			//let loginMessage: ObservableMessageType = new ObservableMessageType();
			//loginMessage.message = this.service.stringify(this.service.isLoggedIn);
			//let onLoginUpdated: BehaviorSubject<ObservableMessageType> = this.service.onLoginUpdated;
			//onLoginUpdated.next(loginMessage);
			//onLoginUpdated.next(new ObservableMessageType());

			try {
				await this.service.initPhoneService(genericUser.name);
			}
			catch (e) {
				throw (e);
			}

			// set the phonecallcomponent factory
			this.phoneCallComponentFactory = this.componentFactoryResolver.resolveComponentFactory(PhoneCallComponent);
			// phoneCallComponentInsert should be empty when we first start the phone, (not wake from cached view)
			this.phoneCallComponentInsert.clear();
			// the phoneCallComponentRefs should be an empty array
			this.phoneCallComponentRefs = new Array<ComponentRef<PhoneCallComponent>>();

			this.isBusy = false;

			////NOTE: for now always resolves true;
			//let hasCameraPermissions: boolean = false;

			//try {
			//	hasCameraPermissions = await this.service.checkCameraPermissions();
			//}
			//catch (e) {
			//	throw ("Unable to check camera permissions.");
			//}

			//if (hasCameraPermissions === false) {
			//	throw ("Live Net Video does not have permission to use the camera.");
			//}

			//let hasMicPermissions: boolean = false;
			//try {
			//	hasMicPermissions = await this.service.checkMicrophonePermissions();
			//}
			//catch (e) {
			//	throw ("Unable to check microphone permissions.");
			//}

			//if (hasMicPermissions === false) {
			//	throw ("Live Net Video does not have permission to use the microphone.");
			//}

			try {
				await this.startLocalVideo();
			}
			catch (e) {
				throw (e);
			}

			// if user navigates to phone with email as query param,
			// the phone will call the email
			// else if service has an acceptedCall object: CallType, then it will
			// send out AcceptPhoneLineInvitation to the callType
			let email = this.emailToCall;
			this.emailToCall = "";
			//console.log("phone.component.ts ngOnInit() got emailToCall: ", email);
			if (!this.service.isEmpty(email)) {
				try {
					// NOTE: email can be a valid email address or a base64encoded memberId
					let isValidEmail = this.service.isValidEmail(email);
					if (isValidEmail === true) {
						await this.service.callContact(email);
					}
					else {
						let memberId: number = Number(this.service.base64Decode(email));
						let accessToken: string = await this.service.getAccessToken();
						let otherUser: MemberType = await this.service.getMemberById(memberId, accessToken);
						if (this.service.isEmpty(otherUser)) {
							throw ("Unable to retrieve other persons information to make call.")
						}
						else {
							await this.service.callContact(otherUser.email);
						}
					}
				}
				catch (e) {
					let alert = new MaterialAlertMessageType();
					alert.title = "Error";
					alert.message = e;
					this.service.openAlert(alert);
				}
			}
			else if (this.service.isEmpty(this.service.acceptedCall) === false) {
				//console.log("acceptedCall: ", this.service.acceptedCall);

				// acceptPhoneLineInvitation will let the caller know this user accepted their invitation
				// and also notify all current users in the phoneLine to get ready for a call
				// when the other users are ready, they will send a signal to this user, readyForCall()
				// and this user will then connect to each user as they become ready
				let phoneLineGuid = this.service.acceptedCall.phoneLineGuid;
				let remoteGuid = this.service.acceptedCall.remoteGuid;
				this.service.acceptedCall = null;
				await this.service.acceptPhoneLineInvitation(phoneLineGuid, remoteGuid);
			}

			if (warnings.length > 0) {
				warnings.forEach((error) => {
					setTimeout(() => {
						let alert = new MaterialAlertMessageType();
						alert.title = "Warning";
						alert.message = error;
						this.service.openAlert(alert);
					});
				});
			}
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	async startLocalVideo(): Promise<void> {
		try {
			this.stopLocalVideo();
			let stream: MediaStream;
			try {
				stream = await this.service.getLocalMediaStream();
			}
			catch (e) {
				throw ("A camera is required and you must allow access to the camera to continue. If you previously denied access to the camera, please visit your browser settings to manually remove the restriction.")
			}

			this.service.localMediaStream = stream;
			await this.service.attachMediaStream(this.localVideoElement.nativeElement, this.service.localMediaStream, this.service.localGuid);
			this.localVideoElement.nativeElement.srcObject = null;

			//await this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.service.localMediaStream, this.service.localGuid);
			this.showToMainVideo(this.service.localMediaStream, this.service.localGuid);
			this.canMaxView = false;
			//this.showLocalVideo = true;

			return;
		}
		catch (e) {
			throw (e);
		}
	}

	async stopLocalVideo(): Promise<void> {
		if (this.service.isEmpty(this.service.localMediaStream) === false) {
			this.service.stopMediaStream(this.service.localMediaStream);
		}
		this.service.localMediaStream = null;

		this.mainVideoElement.nativeElement.srcObject = null;
		if (this.localVideoElement) {
			this.localVideoElement.nativeElement.srcObject = null;
		}
		return;
	}

	async updateVideoStream(stream: MediaStream, enable: boolean): Promise<void> {
		let tracks: MediaStreamTrack[] = stream.getTracks();
		tracks.forEach((t) => {
			t.enabled = enable;
		})

		return;
	}

	/*
	async initLocalVideo(): Promise<void> {
		try {
			//await this.service.unsetLocalMediaStream();
			//console.log("initLocalVideo")
			this.service.localMediaStream = null;
			//console.log("localVideoElement: ", this.localVideoElement);
			this.localVideoElement.nativeElement.srcObject = null;
			let stream: MediaStream;

			try {
				stream = await this.service.getLocalMediaStream();
			}
			catch (e) {
				throw (e);
			}

			//console.log("stream: ", stream);

			if (this.service.isEmpty(stream) === false) {
				// when phone first start we attach the local video to the main video and local video element.
				//await this.service.setLocalMediaStream(stream);
				this.service.localMediaStream = stream;
				// attach localvideo to localvideoElement
				await this.service.attachMediaStream(this.localVideoElement.nativeElement, this.service.localMediaStream);
				// play the video stream
				this.localVideoElement.nativeElement.play();
				this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.service.localMediaStream, this.service.localGuid);
				this.mainVideoElement.nativeElement.play();
			}
			else {
				throw ("Unable to set local media video stream");
			}
		}
		catch (e) {
			throw (e);
		}
	}
	*/

	// #region signalr Subscriptions

	receiveNotAcceptCall: Subscription;
	receiveAcceptPhoneLineInvitation: Subscription;
	receiveAreYouReadyForCall: Subscription;
	receiveReadyForCall: Subscription;
	receiveNotReadyForCall: Subscription;
	receiveSDP: Subscription;
	receiveICE: Subscription;
	receivePutOnHold: Subscription;
	receiveRemoveOnHold: Subscription;
	receiveHangUpNotice: Subscription;

	receivePing: Subscription;
	receivePingResponse: Subscription;

	// #endregion

	startSubscriptions(): void {
		this.endSubscriptions();

		//console.log("starting subscriptions");

		this.receivePing = this.service.receivePing
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				console.log("receivePing message: ", message);
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					// send response back to the other user
					this.service.sendPingResponse(remoteGuid);
				}
			});

		this.receivePingResponse = this.service.receivePingResponse
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				console.log("receivePingResponse message: ", message);
			});

		this.receiveNotAcceptCall = this.service.receiveNotAcceptCall
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				console.log("receiveNotAcceptCall message: ", message);
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					// the caller received acceptance, so go ahead and close the outgoingCallDialog
					// and wait for AreYouReadyForCall Signal

					this.ngZone.run(() => {
						let dialog = this.matDialog.getDialogById('outgoing-call');
						console.log("outgoing call dialog: ", dialog);
						dialog && dialog.close(remoteGuid);
						let alert = new MaterialAlertMessageType();
						alert.title = "Call ended";
						alert.message = "The other user is not accepting calls at this time. Please try again later.";
						this.service.openAlert(alert);
					})
				}
			});

		this.receiveAcceptPhoneLineInvitation = this.service.receiveAcceptPhoneLineInvitation
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				console.log("receiveAcceptPhoneLineInvitation message: ", message);
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					// the caller received acceptance, so go ahead and close the outgoingCallDialog
					// and wait for AreYouReadyForCall Signal
					let outgoingCallDialog = this.matDialog.getDialogById('outgoing-call')
					this.ngZone.run(() => {
						outgoingCallDialog && outgoingCallDialog.close(remoteGuid);
					})
				}
			});

		this.receiveAreYouReadyForCall = this.service.receiveAreYouReadyForCall
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveAreYouReadyForCall message: ", message);
				let phoneLineConnection: PhoneLineConnectionType;
				try {
					let json = message.message;
					if (this.service.isEmpty(json) === false) {
						phoneLineConnection = this.service.jsonToObject<PhoneLineConnectionType>(json, true);
						if (this.service.isEmpty(phoneLineConnection) === false) {
							let phoneCallComponent: PhoneCallComponent;
							let componentRef: ComponentRef<PhoneCallComponent> = await this.addPhoneCallComponentToDom(phoneLineConnection);
							if (this.service.isEmpty(componentRef) === false) {
								phoneCallComponent = componentRef.instance;
							}
							else {
								phoneCallComponent = this.getPhoneCallComponentInstance(phoneLineConnection.hubConnection.connectionGuid);
							}

							if (this.service.isEmpty(phoneCallComponent) === false) {
								await this.service.addPhoneLineConnectionToPhoneLine(phoneLineConnection);
								let pc: RTCPeerConnection = await this.service.createRtcPeerConnection();
								phoneCallComponent.pc = pc;
								try {
									await phoneCallComponent.startPeerConnectionListeners();
								}
								catch (e) {
									throw ("Unable to prepare local phone listeners.")
								}

								try {
									await this.service.sendReadyForCall(phoneLineConnection.hubConnection.connectionGuid);
								}
								catch (e) {
									throw ("Unable to complete call initialization with other user.");
								}

								this.isBusy = this.service.isPhoneBusy();
							}
							else {
								await this.service.sendNotReadyForCall("Unable to add remote user interface.", phoneLineConnection.hubConnection.connectionGuid);
								throw ("Unable to finish call. Information required to add remote user interface missing.");
							}
						}
						else {
							throw ("Received invalid call information from the other user.")
						}
					}
					else {
						throw ("Received empty response from other user.");
					}
				}
				catch (e) {
					// NOTE: fatal error
					if (this.service.isEmpty(phoneLineConnection) === false) {
						await this.service.sendNotReadyForCall(this.service.stringify(e), phoneLineConnection.hubConnection.connectionGuid);
					}
					let alert = new MaterialAlertMessageType();
					alert.title = "Call Ended";
					alert.message = e;
					this.service.openAlert(alert);
				}
			});

		this.receiveReadyForCall = this.service.receiveReadyForCall
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveReadyForCall message: ", message);
				try {
					let remoteGuid: string;
					remoteGuid = message.message;
					if (this.service.isEmpty(remoteGuid)) {
						throw ("Call ended. Received an invalid identifier from the other user.");
					}

					if (this.service.isEmpty(this.service.currentCallAttempt) === false) {
						this.service.currentCallAttempt.responses++;
					}

					let phoneLineConnection: PhoneLineConnectionType = this.service.getPhoneLineConnectionFromCacheByRemoteGuid(remoteGuid);
					if (this.service.isEmpty(phoneLineConnection)) {
						throw ("Call ended. Unable to get remote user connection information.");
					}

					let phoneCallComponent: PhoneCallComponent;

					let componentRef: ComponentRef<PhoneCallComponent> = await this.addPhoneCallComponentToDom(phoneLineConnection);
					if (this.service.isEmpty(componentRef)) {
						phoneCallComponent = this.getPhoneCallComponentInstance(phoneLineConnection.hubConnection.connectionGuid);
					}
					else {
						phoneCallComponent = componentRef.instance;
					}

					let pc: RTCPeerConnection;

					try {
						pc = await this.service.createRtcPeerConnection();
					}
					catch (e) {
						throw (e)
					}

					if (this.service.isEmpty(pc)) {
						throw ("Call ended, unable to establish connection.");
					}

					phoneCallComponent.pc = pc;

					await phoneCallComponent.startPeerConnectionListeners();
					if (this.service.isEmpty(this.service.localMediaStream)) {
						await this.service.delay(500);
						phoneCallComponent.addLocalStream(this.service.localMediaStream);
					}
					else {
						phoneCallComponent.addLocalStream(this.service.localMediaStream);
					}

					await phoneCallComponent.startP2pConnection();
					this.isBusy = this.service.isPhoneBusy();
					return;
				}
				catch (e) {
					// fatal error
					let alert = new MaterialAlertMessageType();
					alert.title = "Error";
					alert.message = e;
					this.service.openAlert(alert);
				}
			});

		// takes a not ready for call signal and adds it to an array or not ready for call
		this.receiveNotReadyForCall = this.service.receiveNotReadyForCall
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				console.log("receiveNotReadyForCall message: ", message);
				try {
					let json = message.message;
					if (this.service.isEmpty(json) === false) {
						let notReadyForCall: NotReadyForCallType = this.service.jsonToObject<NotReadyForCallType>(json);
						if (this.service.isEmpty(this.service.currentCallAttempt) === false) {
							this.service.currentCallAttempt.responses++;
							this.service.currentCallAttempt.notReadyForCalls.push(notReadyForCall);
						}
					}
				}
				catch (e) {
					let alert = new MaterialAlertMessageType();
					alert.title = "Error";
					alert.message = e;
					this.service.openAlert(alert);
				}
			});

		this.receiveSDP = this.service.receiveSDP
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				//console.log("receiveSDP message: ", message);
				try {
					let json = message.message;
					if (this.service.isEmpty(json) === false) {
						let sdpMessage: SdpMessageType = this.service.jsonToObject<SdpMessageType>(json, true);
						if (this.service.isEmpty(sdpMessage) === false && this.service.isEmpty(sdpMessage.sender) === false) {
							for (let i = 0; i < this.phoneCallComponentRefs.length; i++) {
								if (this.phoneCallComponentRefs[i].instance.caller.remoteGuid === sdpMessage.sender) {
									let sdp: RTCSessionDescription = this.service.jsonToObject<RTCSessionDescription>(sdpMessage.sdp);
									if (this.service.isEmpty(sdp) === false) {
										let instance = this.phoneCallComponentRefs[i].instance;
										if (sdp.type === "offer") {
											// make sure we have local stream before adding it.
											if (this.service.isEmpty(this.service.localMediaStream)) {
												await this.service.delay(500);
											}

											instance.addLocalStream(this.service.localMediaStream);
											await instance.receiveSDP(sdp);
										}
										else {
											await instance.receiveSDP(sdp);
										}
									}
									break;
								}
							}
						}
						else {
							throw ("Received SDP message without other users information.")
						}
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
						//if (this.service.isEmpty(iceMessage) === false && this.service.isEmpty(iceMessage.sender) === false) {
						if (this.service.isEmpty(iceMessage.sender) === false) {
							for (let i = 0; i < this.phoneCallComponentRefs.length; i++) {
								if (this.phoneCallComponentRefs[i].instance.caller.remoteGuid === iceMessage.sender) {
									let ice: RTCIceCandidate = this.service.jsonToObject<RTCIceCandidate>(iceMessage.ice, true);

									await this.phoneCallComponentRefs[i].instance.receiveICE(ice);

									break;
								}
							}
						}
						else {
							throw ("Received is package without the other users information.");
						}
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

		this.receivePutOnHold = this.service.receivePutOnHold
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				console.log("receivePutOnHold message: ", message);
				// TODO: handle put on hold
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					// when the remote users puts this user on hold, the remote user will hide this localUsers phoneCallComponent.
					// and request this localUser to hide the remoteUsers phoneCallComponent
					let phoneCallComponent = this.getPhoneCallComponentInstance(remoteGuid);
					if (this.service.isEmpty(phoneCallComponent) === false) {
						this.ngZone.run(() => {
							phoneCallComponent.setHolded(true)
							let mainVideo = this.mainVideoElement.nativeElement;
							if (this.service.isEmpty(mainVideo) === false) {
								let id = mainVideo.getAttribute("data-id");
								// if the current main video is the remote users video, set it to the local users video
								if (id === remoteGuid) {
									this.service.attachMediaStream(mainVideo, this.service.localMediaStream, this.service.localGuid);
								}
							}
						})
					}
				}
			});

		this.receiveRemoveOnHold = this.service.receiveRemoveOnHold
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				console.log("receiveRemoveOnHold message: ", message);

				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					let phoneCallComponent = this.getPhoneCallComponentInstance(remoteGuid);
					if (this.service.isEmpty(phoneCallComponent) === false) {
						this.ngZone.run(() => {
							phoneCallComponent.setHolded(false)
						})
					}
				}
			});

		this.receiveHangUpNotice = this.service.receiveHangUpNotice
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				// TODO: handle hangup notice

				//NOTE: this method is the sames as this.onEndPhoneCallComponent they both just do cleanup work.
				// if one finishes before the other, they the second option just resolves,
				// this.onEndPhoneCallComponent is a backup to this method
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false && remoteGuid !== this.service.localGuid) {
					console.log("receiveHangUpNotice from remoteGuid: ", message);
					console.log("receiveHangUpNotice calling this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid : ", remoteGuid);
					this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(remoteGuid);
					console.log("receiveHangUpNotice calling this.removePhoneCallComponent with remoteGuid: ", remoteGuid);
					this.removePhoneCallComponent(remoteGuid);
					this.isBusy = this.service.isPhoneBusy();
					//console.log("receiveHangUpNotice this.isBusy: ", this.isBusy);
					if (this.isBusy === false) {
						console.log("receiveHangUpNotice calling this.hangUp()");
						await this.hangUp();
					}
				}
				else {
					console.log("receiveHangUpNotice from localGuid: ", message);
				}
			});
	}

	endSubscriptions(): void {
		//console.log("endSubscriptions");
		//this.phoneListener.onReceiveAcceptPhoneLineInvitation.unsubscribe();
		//let globalPhoneListener = this.phoneListener.globalPhoneListener;
		//this.receivePhoneLineInvitationSubscription && this.receivePhoneLineInvitationSubscription.unsubscribe();
		this.receiveNotAcceptCall && this.receiveNotAcceptCall.unsubscribe();
		this.receiveAcceptPhoneLineInvitation && this.receiveAcceptPhoneLineInvitation.unsubscribe();
		this.receiveAreYouReadyForCall && this.receiveAreYouReadyForCall.unsubscribe();
		this.receiveReadyForCall && this.receiveReadyForCall.unsubscribe();
		this.receiveNotReadyForCall && this.receiveNotReadyForCall.unsubscribe();
		this.receiveSDP && this.receiveSDP.unsubscribe();
		this.receiveICE && this.receiveICE.unsubscribe();
		this.receivePutOnHold && this.receivePutOnHold.unsubscribe();
		this.receiveRemoveOnHold && this.receiveRemoveOnHold.unsubscribe();

		this.receiveHangUpNotice && this.receiveHangUpNotice.unsubscribe();
	}

	// when another user hangs up, child PhoneCallComponent will call this method
	async onEndPhoneCallComponent(call: CallType): Promise<void> {
		console.log("onEndPhoneCallComponent this: ", this);
		//NOTE: this method is in backup to this.receiveHangUpNotice. they both just do the same cleanup work.
		// if one finishes before the other, then the second option just resolves.
		// called from child PhoneCallComponent
		console.log("phone.ts onEndPhoneCallComponent() call: ", call);
		this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(call.remoteGuid);

		this.removePhoneCallComponent(call.remoteGuid);
		this.isBusy = this.service.isPhoneBusy();

		console.log("onEndPhoneCallComponent this.isBusy: ", this.isBusy);

		if (this.isBusy === false) {
			console.log("onEndPhoneCallComponent() calling this.hangUp()")
			return await this.hangUp();
		}
		else {
			return;
		}
	};

	async onOpenPrivateSmsInterface(remoteGuid: string): Promise<void> {
		//console.log("open private sms remoteGuid: ", remoteGuid);
		let user = this.currentUsers.find((user) => {
			return user.id == remoteGuid;
		})
		if (this.service.isEmpty(user) === false) {
			let filteredUsers: Array<GenericUserType> = this.currentUsers.slice();
			let index = filteredUsers.findIndex((user: GenericUserType) => {
				return user.id == this.service.localGuid;
			});
			let localUser = filteredUsers[index];
			if (index > -1) {
				filteredUsers.splice(index, 1);
			}

			let newMessage: string;
			try {
				newMessage = await this.service.openPrivateSmsInterface(filteredUsers, user);
			}
			catch (e) {
				//console.log("e: ", e);
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = "Unable to send message";
				this.service.openAlert(alert);
			}
			//console.log("phone.page newMessage: ", newMessage);

			//console.log("before this.textMessages: ", this.textMessages);

			if (this.service.isEmpty(newMessage) === false && this.service.isEmpty(localUser) === false) {
				let message = new TextMessageType();
				message.id = localUser.id;
				message.email = localUser.email;
				message.name = localUser.name;
				message.message = newMessage;
				message.isIncoming = false;
				message.isPrivate = true;
				message.imgSrc = localUser.imgSrc;
				this.currentMessage = message;
				this.textMessages.unshift(message);
				//console.log("after this.textMessages: ", this.textMessages);
			}
		}
	}

	// removes a phonecallcomponent from the dom
	removePhoneCallComponent(remoteGuid): void {
		let index: number = this.phoneCallComponentRefs.findIndex((value) => {
			// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
			return value.instance.caller.remoteGuid == remoteGuid;
		})

		if (index >= 0) {
			let componentRef: ComponentRef<PhoneCallComponent> = this.phoneCallComponentRefs[index];
			let instance = componentRef.instance;
			instance.pc.close();
			componentRef.destroy();
			this.ngZone.run(() => {
				console.log("removing componentRef: ", this.phoneCallComponentRefs[index]);
				this.phoneCallComponentRefs.splice(index, 1);
			})
		}

		let currentUserIndex = this.currentUsers.findIndex((value) => {
			return value.id == remoteGuid;
		})
		if (currentUserIndex >= 0) {
			this.ngZone.run(() => {
				let removedUser: GenericUserType = Object.create(this.currentUsers[currentUserIndex]) as GenericUserType;
				console.log("removing currentUser: ", this.currentUsers[currentUserIndex]);
				this.currentUsers.splice(currentUserIndex, 1);
				this.currentUsers = this.currentUsers.slice();

				let alert: MaterialAlertMessageType = new MaterialAlertMessageType();
				alert.title = "Notice";
				alert.message = "<p>" + removedUser.name + " has disconnected.<p>";
				this.service.openAlert(alert);
			})
		}

		//if (this.phoneCallComponentRefs.length < 1) {
		//	this.isOnCall = false;
		//}
		return;
	}

	// loops through phoneCallComponentRefs to get the instance in dom
	getPhoneCallComponentInstance(remoteGuid: string): PhoneCallComponent {
		let index: number = this.phoneCallComponentRefs.findIndex((value) => {
			// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
			return value.instance.caller.remoteGuid == remoteGuid;
		})

		if (index > -1) {
			let componentRef: ComponentRef<PhoneCallComponent> = this.phoneCallComponentRefs[index];
			let instance = componentRef.instance;
			return instance;
		}
		else {
			return null;
		}
	}

	// removes all phonecallcomponents from the dom
	deleteAllPhoneCallComponents(): void {
		//console.log("phone.ts deleteAllPhoneCallComponents");

		for (let i = 0; i < this.phoneCallComponentRefs.length; i++) {
			let instance = this.phoneCallComponentRefs[i].instance;
			console.log("phone.ts deleteAllPhoneCallComponents instance: ", instance);
			instance.pc.close();
			this.phoneCallComponentRefs[i].destroy();
		}
		this.phoneCallComponentRefs.length = 0;

		//console.log("phone.ts -> deleteAllPhoneCallComponents(): ", this.phoneCallComponentRefs);

		return;
	}

	// when the user exits the phone
	exitPhone(): void {
		this.router.navigate(['/contacts'], { relativeTo: this.activatedRoute });
	}

	// when this user hangs up on all calls
	async hangUp(): Promise<void> {
		try {
			// NOTE: phoneService.hangUp deletes the phoneline and all its associated phonelineConnections
			console.log("phone.page.ts call this.service.hangUp()");
			await this.service.hangUp()

			console.log("phone.page.ts call this.deleteAllPhoneCallComponents");
			this.deleteAllPhoneCallComponents();

			console.log("phone.page.ts checking if this.service.isPhoneBusy()");
			this.isBusy = this.service.isPhoneBusy();
			return;
		}
		catch (e) {
			throw (e);
		}
	}

	// displays ContactListComponent in dialog
	async showContactsDialog(): Promise<void> {
		try {
			this.gettingContacts = true;
			let accessToken: string;
			if (this.service.isEmpty(this.contacts)) {
				try {
					accessToken = await this.service.getAccessToken();
				}
				catch (e) {
					throw (e);
				}

				if (this.service.isEmpty(accessToken)) {
					throw ("Access denied, missing credentials.")
				}
				this.contacts = await this.service.getContactList(accessToken);
			}

			if (this.service.isEmpty(this.contacts) === false) {
				let dialogRef = this.matDialog.open(ContactListComponent, {
					id: 'contact-list',
					width: '80%',
					height: '80%',
					data: { contacts: this.contacts, currentUsers: this.currentUsers }
				});
			}
			else {
				throw ("Unable to find any contacts.");
			}

			this.gettingContacts = false;
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
			this.gettingContacts = false;
		}
	}

	async addPhoneCallComponentToDom(phoneLineConnection: PhoneLineConnectionType): Promise<ComponentRef<PhoneCallComponent>> {
		try {
			let componentRef: ComponentRef<PhoneCallComponent>;

			console.log("this.phoneCallComponentRefs: ", this.phoneCallComponentRefs);

			// make sure its not already in the dom
			let refIndex: number = this.phoneCallComponentRefs.findIndex((value) => {
				// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
				return value.instance.caller.remoteGuid == phoneLineConnection.hubConnection.connectionGuid;
			})

			console.log("refIndex", refIndex);

			console.log("this.service.phoneLine", this.service.phoneLine);

			//let lineIndex: number = -1;
			//if (this.service.phoneLine.phoneLineConnections.length > 0) {
			//	lineIndex = this.service.phoneLine.phoneLineConnections.findIndex((plc: PhoneLineConnectionType) => {
			//		return plc.hubConnection.connectionGuid == phoneLineConnection.hubConnection.connectionGuid
			//	})
			//}

			//console.log("lineIndex", lineIndex);

			if (refIndex < 0) {
				let member: MemberType;
				try {
					let accessToken = await this.service.getAccessToken();
					member = await this.service.getMemberByEmail(phoneLineConnection.hubConnection.email, accessToken);
				}
				catch (e) {
					console.log("an error occurred while trying to get a member profile with their email", e);
					//throw (e);
				}

				componentRef = this.phoneCallComponentInsert.createComponent(this.phoneCallComponentFactory);
				let phoneCallComponent = componentRef.instance;

				// NOTE: was false, temperarily making it true, remember to double check why its false
				phoneCallComponent.isVisible = true;

				//show to main video is clicked

				//TODO: double check and implement
				phoneCallComponent.onShowToMainVideo.subscribe((remoteStream: MediaStream) => {
					this.showToMainVideo(remoteStream, phoneCallComponent.caller.remoteGuid);
				});

				phoneCallComponent.onCloseFromMainVideo.subscribe((guid: string) => {
					this.minimizeMainVideo();
					//console.log("onCloseFromMainVideo guid: ", guid);
				});

				// TODO: double check and implement
				//phoneCallComponent.onPrivateMessageClicked.subscribe((remoteGuid) => {
				//    let phoneLineConnection: PhoneLineConnectionType = this.phoneService.getPhoneLineConnectionFromCacheByRemoteGuid(remoteGuid);

				//    this.showChatModal(phoneLineConnection.hubConnection.email, remoteGuid)
				//})

				// NOTE: .bind(this) will make onEndPhoneCallComponent function this be referencing PhonePage

				if (!!phoneCallComponent.onEndPhoneCallComponent) {
					phoneCallComponent.onEndPhoneCallComponent.subscribe(this.onEndPhoneCallComponent.bind(this));
				}

				if (!!phoneCallComponent.onOpenPrivateSmsInterface) {
					phoneCallComponent.onOpenPrivateSmsInterface.subscribe(this.onOpenPrivateSmsInterface.bind(this));
				}

				phoneCallComponent.caller = new CallerType();
				phoneCallComponent.caller.remoteGuid = phoneLineConnection.hubConnection.connectionGuid;
				phoneCallComponent.caller.profile = new ProfileDto();
				phoneCallComponent.caller.profile.email = this.service.isEmpty(member) ? phoneLineConnection.hubConnection.email
					: member.email;
				phoneCallComponent.caller.profile.name = this.service.isEmpty(member) ? phoneLineConnection.hubConnection.name
					: member.firstName + " " + member.lastName;

				phoneCallComponent.caller.profile.avatarFileName = this.service.isEmpty(member) ? "" : member.avatarFileName;

				this.phoneCallComponentRefs.push(componentRef);

				// update the list of users in the phone conversation, this is required for text messaging

				let genericUser = new GenericUserType();
				genericUser.id = phoneLineConnection.hubConnection.connectionGuid;
				genericUser.email = this.service.isEmpty(member) ? phoneLineConnection.hubConnection.email : member.email;
				genericUser.name = this.service.isEmpty(member) ? phoneLineConnection.hubConnection.name : member.firstName + " " + member.lastName;
				genericUser.imgSrc = this.service.defaultAvatar;
				if (this.service.isEmpty(member) === false && this.service.isEmpty(member.avatarFileName) === false) {
					genericUser.imgSrc = this.service.avatarBaseUrl + member.avatarFileName;
				}
				let index = this.currentUsers.findIndex((user) => {
					return user.id === phoneLineConnection.hubConnection.connectionGuid;
				});
				if (index < 0) {
					this.currentUsers.push(genericUser);
					this.currentUsers = this.currentUsers.slice();
				}

				console.log("this.currentUsers: ", this.currentUsers);

				return componentRef;
			}
			else {
				// the dom already has the phoneLineConnection phoneCallComponent
				this.phoneCallComponentRefs[refIndex].instance.isVisible = true;
				console.log("phone.page.ts addPhoneCallComponentToDom already exists phoneLineConnection: ", phoneLineConnection);
				return null;
			}
		}
		catch (e) {
			throw (e);
		}
	}

	// attaches the localVideoStream to the mainVideo element
	async localVideoClicked(): Promise<void> {
		// remove video from thumb
		this.localVideoElement.nativeElement.srcObject = null;
		// show video on main video
		await this.showToMainVideo(this.service.localMediaStream, this.service.localGuid);
		this.canMaxView = false;
	}

	async showToMainVideo(videoStream: MediaStream, guid: string): Promise<void> {
		console.log("showing to main video: ", videoStream)

		// check if we currently have a video in main, if yes, move it to its thumb
		let currentGuid: string = this.mainVideoElement.nativeElement.getAttribute('data-id');
		if (!this.service.isEmpty(currentGuid) && currentGuid !== guid) {
			await this.thumberizeMainVideo(currentGuid);
		}

		console.log("attaching to mainvideo");
		await this.service.attachMediaStream(this.mainVideoElement.nativeElement, videoStream, guid);

		if (guid === this.service.localGuid) {
			// if its our local video, then mute it because of echo
			this.mainVideoElement.nativeElement.muted = true;
		}
		else {
			// make sure its unmuted for remote videos
			this.mainVideoElement.nativeElement.muted = false;
		}
		this.showMinimizeMainVideo = true;
	}

	async minimizeMainVideo(): Promise<void> {
		let guid: string = this.mainVideoElement.nativeElement.getAttribute('data-id');
		console.log("minimizeMainVideo: ", guid);
		console.log("componentRefs: ", this.phoneCallComponentRefs);

		if (!this.service.isEmpty(guid)) {
			//this.mainVideoElement.nativeElement.srcObject = null;
			this.thumberizeMainVideo(guid);
		}

		this.mainVideoElement.nativeElement.srcObject = null;
		this.showMinimizeMainVideo = false;
	}

	async thumberizeMainVideo(guid: string): Promise<void> {
		let refIndex: number = this.phoneCallComponentRefs.findIndex((value) => {
			// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
			return value.instance.caller.remoteGuid == guid;
		})
		console.log("refIndex: ", refIndex);
		if (refIndex < 0) {
			// put local video back to thumb
			await this.service.attachMediaStream(this.localVideoElement.nativeElement, this.service.localMediaStream, this.service.localGuid);
			this.localVideoElement.nativeElement.muted = true;
			this.canMaxView = true;
		}
		else {
			// put the remote video instance back to thumb

			this.phoneCallComponentRefs[refIndex].instance.showToThumbVideo();
			//let stream: MediaStream = this.phoneCallComponentRefs[refIndex].instance.remoteStream;
			//let el: HTMLVideoElement = this.phoneCallComponentRefs[refIndex].instance.remoteVideoElement.nativeElement;
			//let id: string = this.phoneCallComponentRefs[refIndex].instance.caller.remoteGuid;
			//await this.service.attachMediaStream(el, stream, id);
		}
	}

	async testAddUser(): Promise<void> {
		let user: GenericUserType = new GenericUserType();
		let id: string = Date.now().toString();
		user.id = id;
		user.name = "tester_" + id;
		user.email = user.name + "@lvc.com";
		user.imgSrc = "";
		this.currentUsers.push(user);
		this.currentUsers = this.currentUsers.slice();

		//let newLists: GenericUserType[] = new Array<GenericUserType>();
		//newLists.push(user);
		//this.currentUsers = newLists;

		console.log("this.currentUsers: ", this.currentUsers);
	}

	async test(): Promise<void> {
		console.log("currentUsers: ", this.currentUsers);
		console.log("textMessages: ", this.textMessages);
		console.log("phoneCallComponentRefs: ", this.phoneCallComponentRefs);
		console.log("this.service.phoneLine: ", this.service.phoneLine);
		console.log("this.service.localPhoneLineConnection: ", this.service.localPhoneLineConnection);
	}
}