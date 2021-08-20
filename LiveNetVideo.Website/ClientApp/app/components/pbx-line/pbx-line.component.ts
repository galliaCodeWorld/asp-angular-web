/////<reference path="../../../node_modules/@types/node/index.d.ts" />
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';
import {
	Component,
	ComponentFactory,
	ComponentFactoryResolver,
	ViewContainerRef,
	ViewChild,
	Output,
	Input,
	EventEmitter,
	ComponentRef,
	ElementRef,
	NgZone,
	OnDestroy,
	OnInit
} from '@angular/core';

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
	PbxCallQueueDto,
	PbxLineRepDto,
	CompanyEmployeeDto,
	PbxLineDto,
	IdDto,
	LongIdDto,
	CompanyProfileDto,
	SmsMessageViewType
} from '../../models/index';

import {
	Service,
} from '../../services/index';

import { PbxLineCallComponent } from "../index";
import { MatDialog } from '@angular/material';
import { PbxLineOutgoingCallDialog } from './pbx-line-outgoing-call-dialog/pbx-line-outgoing-call-dialog.component';

//import 'webrtc-adapter';

@Component({
	selector: 'pbx-line-component',
	templateUrl: 'pbx-line.component.html',
	styleUrls: ['pbx-line.component.scss']
})
export class PbxLineComponent implements OnInit {
	constructor(
		public router: Router,
		public activatedRoute: ActivatedRoute,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,

		public ngZone: NgZone,
		public matDialog: MatDialog,
		public service: Service,
	) {
		this.hasIncoming = false;
	}

	@ViewChild('phoneCallComponentInsert', { read: ViewContainerRef }) phoneCallComponentInsert: ViewContainerRef;
	@ViewChild('localVideoElement') localVideoElement: ElementRef;
	@ViewChild('mainVideoElement') mainVideoElement: ElementRef;
	@ViewChild('chatbox') chatBoxElement: ElementRef;

	private _companyProfile: CompanyProfileDto;
	get companyProfile(): CompanyProfileDto {
		return this._companyProfile;
	}
	set companyProfile(value: CompanyProfileDto) {
		this._companyProfile = value;
	}

	private _pbxLine: PbxLineDto;
	get pbxLine(): PbxLineDto {
		return this._pbxLine;
	}
	set pbxLine(value: PbxLineDto) {
		this._pbxLine = value;
	}

	private _pbxLineRep: PbxLineRepDto;
	get pbxLineRep(): PbxLineRepDto {
		return this._pbxLineRep;
	}
	set pbxLineRep(value: PbxLineRepDto) {
		this._pbxLineRep = value;
	}

	private _employeeRecord: CompanyEmployeeDto;
	get employeeRecord(): CompanyEmployeeDto {
		return this._employeeRecord;
	}
	set employeeRecord(value: CompanyEmployeeDto) {
		this._employeeRecord = value;
	}

	private _pbxCallQueues: Array<PbxCallQueueDto>;
	get pbxCallQueues(): Array<PbxCallQueueDto> {
		return this._pbxCallQueues;
	}
	set pbxCallQueues(value: Array<PbxCallQueueDto>) {
		this._pbxCallQueues = value;
	}

	_isBusy: boolean;
	get isBusy(): boolean {
		return this._isBusy;
	}
	set isBusy(value: boolean) {
		this.ngZone.run(() => {
			this._isBusy = value;
		})
	}

	_pageName: string = "phone.ts";
	get pageName(): string {
		return this._pageName;
	}

	smsInput: string;

	messages: SmsMessageViewType[] = [];

	privateMessages: SmsMessageViewType[] = [];

	isCalling: boolean;

	callingEmail: string;

	callingPhoto: any;

	receiveAcceptPhoneLineInvitation: Subscription;
	receiveAreYouReadyForCall: Subscription;
	receiveReadyForCall: Subscription;
	receiveNotReadyForCall: Subscription;
	receiveSDP: Subscription;
	receiveICE: Subscription;
	receiveBusyResponse: Subscription;
	receiveNotAcceptCall: Subscription;
	receivePutOnHold: Subscription;
	receiveRemoveOnHold: Subscription;
	receiveGroupSmsMessage: Subscription;
	receivePrivateSmsMessage: Subscription;
	receiveHangUpNotice: Subscription;
	receivePbxCallQueueOccupants: Subscription;

	public _phoneCallComponentFactory: ComponentFactory<PbxLineCallComponent>;
	get phoneCallComponentFactory(): ComponentFactory<PbxLineCallComponent> {
		return this._phoneCallComponentFactory;
	}
	set phoneCallComponentFactory(value: ComponentFactory<PbxLineCallComponent>) {
		this._phoneCallComponentFactory = value;
	}

	public phoneCallComponentRefs: Array<ComponentRef<PbxLineCallComponent>>;

	//currentAlert: Alert;

	// fired before everything, to check if a user can access a view
	ngOnInit() {
		console.log("pbx-line.component.ts ngOnInit()");

		let pbxLineId = parseInt(this.activatedRoute.snapshot.paramMap.get('id')) || 0;

		console.log("pbx-line.component.ts ngOnInit() pbxLineId: ", pbxLineId);

		let jwtToken = this.service.jwtToken;
		this.service.getAccessToken()
			.then((accessToken: string) => {
				// get the pbxLine information to display to the PbxLineRep
				return this.service.getPbxLineById(pbxLineId, accessToken);
			})
			.then((pbxLine: PbxLineDto) => {
				// get the employee information
				this.pbxLine = pbxLine;
				return this.service.getCompanyEmployeeByMemberId(this.pbxLine.companyProfileId, this.service.profile.memberId, jwtToken.access_token);
			})
			.then((companyEmployee: CompanyEmployeeDto) => {
				// get the pbxLineRep information
				this.employeeRecord = companyEmployee;
				return this.service.getCompanyProfileById(this.employeeRecord.companyProfileId, jwtToken.access_token);
			})
			.then((companyProfile: CompanyProfileDto) => {
				this.companyProfile = companyProfile;
				return this.service.getPbxLineRepByEmployeeId(this.employeeRecord.companyEmployeeId, this.pbxLine.pbxLineId, jwtToken.access_token);
			})
			.then((pbxLineRep: PbxLineRepDto) => {
				this.pbxLineRep = pbxLineRep;
				//get all assigned PbxCallQueue, this will always return empty when the pbxrep first enters
				let dto = new LongIdDto();
				dto.id = this.pbxLineRep.pbxLineRepId;
				return this.service.getPbxCallQueuesByPbxLineRepId(dto, jwtToken.access_token);
			})
			.then((pbxCallQueues: Array<PbxCallQueueDto>) => {
				this.pbxCallQueues = pbxCallQueues;
			})
			.catch((error) => {
				console.log("pbx-line.component.ts ngOnInit() error: ", error);
			})

		// retrieve any PbxCallQueue records assigned to this rep

		// initialize the phoneService
		this.service.initPhoneService(this.pbxLineRep.companyEmployee.title)
			.then(() => {
				// set the phonecallcomponent factory
				this.phoneCallComponentFactory = this.componentFactoryResolver.resolveComponentFactory(PbxLineCallComponent);
				// phoneCallComponentInsert should be empty when we first start the phone, (not wake from cached view)
				this.phoneCallComponentInsert.clear();
				// the phoneCallComponentRefs should be an empty array
				this.phoneCallComponentRefs = new Array<ComponentRef<PbxLineCallComponent>>();
				return;
			})
			.catch((error) => {
				console.log("pbx-line.component.ts -> ionViewDidLoad() error: ", error);
			})
			.then(() => {
				this.isBusy = false;
				this.startListeners();
			})
			.catch((error) => {
				console.log("pbx-line.component.ts startListeners() error: ", error);
			})
			.then(() => {
				//NOTE: for now always resolves true;
				return this.service.checkCameraPermissions();
			})
			.then((hasPermission: boolean) => {
				//NOTE: for now always resolves true;
				if (hasPermission) {
					return this.service.checkMicrophonePermissions();
				}
				else {
					let alertData = new MaterialAlertMessageType();
					alertData.title = "ERROR";
					alertData.message = "Live Net Video does not have permission to use the camera.";
					this.service.openAlert(alertData);
					throw ("Camera permission is required");
				}
			})
			.then((hasPermission: boolean) => {
				if (hasPermission) {
					return this.initLocalVideo();
				}
				else {
					let alertData = new MaterialAlertMessageType();
					alertData.title = "ERROR";
					alertData.message = "Live Net Video does not have permission to use the microphone.";
					this.service.openAlert(alertData);
					throw ("microphone  permission required");
				}
			})
			.then(() => {
				// check to see if we need to perform a call.
				// let email = this.navParams.get("emailToCall");
				// TODO: grab email from navigate data, for now email is empty
				//let email = this.phoneService.emailToCall;
				// TODO: fix this so it's like phone
				let email = "";
				console.log("phone.component.ts ngOnInit() got emailToCall: ", email);
				if (!this.service.isEmpty(email)) {
					return this.callContact(email)
				} else return;
			})
			.catch((error) => {
				console.log("pbx-line.component.ts ngOnInit error: ", error);
			})
	}

	ngOnDestroy() {
		console.log("pbx-line.component.ts ngOnDestroy()");
		this.hangUp()
			.then(() => {
				// release the camera
				//return this.phoneService.unsetLocalMediaStream();
				this.service.localMediaStream = null;
			})
			.then(() => {
				this.endListeners();
				this.localVideoElement.nativeElement.srcObject = null;
				console.log("phone.ts -> ionViewWillLeave() hangUp()")
			})
			.catch((error) => {
				console.log("phone.ts -> ionViewWillLeave() hangUp() error:", error)
			})
	}

	hasIncoming: boolean;

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

			this.service.localMediaStream = stream;
			await this.service.attachMediaStream(this.localVideoElement.nativeElement, this.service.localMediaStream);

			this.localVideoElement.nativeElement.play();

			await this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.service.localMediaStream);

			this.mainVideoElement.nativeElement.play();

			return
		}
		catch (e) {
			throw (e);
		}
	}

	// Subscribe to phone.service webRtcHub Listeners
	// NOTE: this should start once when phone page is loaded with setRoot, use ionViewDidLoad() fires once
	startListeners(): void {
		this.endListeners();

		console.log("phone.ts listeners started");

		this.receiveAcceptPhoneLineInvitation = this.service.receiveAcceptPhoneLineInvitation
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					// TODO: the other user has accepted this users call, remove any modals or alerts showing the call status.
					// and wait for the other user to establish a connection with this user.
					console.log("hoaccept invite from remoteGuid: ", remoteGuid);
					this.isCalling = false;
					this.callingEmail = '';

					//this.currentAlert && this.currentAlert.dismiss();
				}
			});

		this.receiveAreYouReadyForCall = this.service.receiveAreYouReadyForCall
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let phoneLineConnection: PhoneLineConnectionType = this.service.jsonToObject<PhoneLineConnectionType>(json, true);
					if (this.service.isEmpty(phoneLineConnection) === false) {
						//NOTE: make sure the phoneCallComponent is not visible at this point.
						let phoneCallComponent: PbxLineCallComponent;
						this.addPhoneCallComponentToDom(phoneLineConnection)
							.then((componentRef: ComponentRef<PbxLineCallComponent>) => {
								// NOTE: addPhoneCallComponentToDom only adds to dom if the phoneLineConnection doesn't already exist this.phoneCallComponentRefs
								if (this.service.isEmpty(componentRef) === false) {
									phoneCallComponent = componentRef.instance;
								}
								else {
									// else we look for existing element
									phoneCallComponent = this.getPhoneCallComponentInstance(phoneLineConnection.hubConnection.connectionGuid);
								}
								return;
							})
							.then(() => {
								this.service.addPhoneLineConnectionToPhoneLine(phoneLineConnection);
								return;
							})
							.then(() => {
								console.log("phone.ts receiveAreYouReadyForCall() creating RtcPeerConnection");
								return this.service.createRtcPeerConnection();
							})
							.then((pc: RTCPeerConnection) => {
								phoneCallComponent.pc = pc;
								console.log("phone.ts receiveAreYouReadyForCall() starting RtcPeerConnection listeners")
								return phoneCallComponent && phoneCallComponent.startPeerConnectionListeners();
							})
							.then(() => {
								console.log("phone.ts receiveAreYouReadyForCall() sendingReadyForCall")
								return this.service.sendReadyForCall(phoneLineConnection.hubConnection.connectionGuid);
							})
							.then(() => {
								console.log("phone.ts -> receiveAreYouReadyForCall -> sent ReadyForCall now waiting for sdp offer")
								this.isBusy = this.service.isPhoneBusy();
							})
							.catch((error) => {
								console.log("phone.ts receiveAreYouReadyForCall() addPhoneLineConnectionToPhoneLine error:", error);
								this.service.sendNotReadyForCall(this.service.stringify(error), phoneLineConnection.hubConnection.connectionGuid);
							})
					}
				}
			});

		this.receiveReadyForCall = this.service.receiveReadyForCall
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					console.log("phone.ts receiveReadyForCall remoteGuid: ", remoteGuid);
					if (this.service.isEmpty(this.service.currentCallAttempt) === false) {
						this.service.currentCallAttempt.responses++;
					}

					let phoneLineConnection: PhoneLineConnectionType = this.service.getPhoneLineConnectionFromCacheByRemoteGuid(remoteGuid);

					if (this.service.isEmpty(phoneLineConnection) === false) {
						let phoneCallComponent: PbxLineCallComponent;
						// wait a split second to make sure the localVideoStream is ready

						this.addPhoneCallComponentToDom(phoneLineConnection)
							.then((componentRef: ComponentRef<PbxLineCallComponent>) => {
								// NOTE: addPhoneCallComponentToDom only adds to dom if the phoneLineConnection doesn't already exist this.phoneCallComponentRefs
								if (this.service.isEmpty(componentRef) === false) {
									phoneCallComponent = componentRef.instance;
								}
								else {
									// else we look for an existing dom element
									phoneCallComponent = this.getPhoneCallComponentInstance(phoneLineConnection.hubConnection.connectionGuid);
								}
								return;
							})
							.then(() => {
								return this.service.createRtcPeerConnection()
							})
							.then((pc: RTCPeerConnection) => {
								phoneCallComponent.pc = pc;
								return phoneCallComponent.startPeerConnectionListeners();
							})
							.then(() => {
								// make sure we have the localMediaStream before continuing

								let promise = new Promise<MediaStream>((resolve, reject) => {
									if (this.service.isEmpty(this.service.localMediaStream)) {
										let maxIntervals = 30;
										let currentInterval = 0;
										let intervalId = setInterval(() => {
											if (this.service.isEmpty(this.service.localMediaStream) === false) {
												clearInterval(intervalId);
												resolve(this.service.localMediaStream);
											}
											else {
												currentInterval++;
												if (currentInterval >= maxIntervals) {
													clearInterval(intervalId);
													reject("unable to determine if localMediaStream is available for timed out after 9 seconds.");
												}
											}
										}, 300);
									}
									else {
										resolve(this.service.localMediaStream);
									}
								});
								return promise;
							})
							.then((localMediaStream: MediaStream) => {
								phoneCallComponent.addLocalStream(this.service.localMediaStream);
								return;
							})
							.then(() => {
								return phoneCallComponent.startP2pConnection();
							})
							.then(() => {
								console.log("phone.ts -> receiveReadyForCall -> starting peer to peer connection with: ", phoneLineConnection);
								this.isBusy = this.service.isPhoneBusy();
							})
							.catch((error) => {
								console.log("phone.ts -> receiveReadyForCall -> error: ", error);
							})
					}
					else {
						console.log("phonereceived bad remoteGuid, phoneLineConnection: ", remoteGuid, phoneLineConnection);
					}
				}
			});

		this.receiveNotReadyForCall = this.service.receiveNotReadyForCall
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					console.log("phone.ts -> receivedNotRadyForCall json: ", json);
					let notReadyForCall: NotReadyForCallType = this.service.jsonToObject<NotReadyForCallType>(json);
					if (this.service.isEmpty(this.service.currentCallAttempt) === false) {
						this.service.currentCallAttempt.responses++;

						this.service.currentCallAttempt.notReadyForCalls.push(notReadyForCall);
					}
				}
			});

		this.receiveSDP = this.service.receiveSDP
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					//console.log("receivedSDP: ", json);
					let sdpMessage: SdpMessageType = this.service.jsonToObject<SdpMessageType>(json, true);
					if (this.service.isEmpty(sdpMessage.sender) === false) {
						//we need to foward this SdpMessageType to the proper PbxLineCallComponent
						//so that it can set pc.setRemoteDescription and send sendLocalSdp answer
						for (let i = 0; i < this.phoneCallComponentRefs.length; i++) {
							if (this.phoneCallComponentRefs[i].instance.caller.remoteGuid === sdpMessage.sender) {
								let sdp: RTCSessionDescription = this.service.jsonToObject<RTCSessionDescription>(sdpMessage.sdp);
								if (this.service.isEmpty(sdp) === false) {
									let instance = this.phoneCallComponentRefs[i].instance;
									if (sdp.type === "offer") {
										// make sure we have local stream before adding it.
										if (this.service.isEmpty(this.service.localMediaStream)) {
											this.service.delay(500);
										}

										instance.addLocalStream(this.service.localMediaStream);

										try {
											await instance.receiveSDP(sdp);
										}
										catch (error) {
											console.log("receiveSDP forward sdp to phonecallcomponent error: ", error);
										}
									}
									else {
										try {
											await instance.receiveSDP(sdp);
										}
										catch (error) {
											console.log("receiveSDP forward sdp to phonecallcomponent error: ", error);
										}
									}
								}
								break;
							}
						}
					}
					else {
						//TODO: received SdpMessageType without sender string (remoteGuid), handle this error type
						console.log("received SdpMessageType without sender string");
					}
				}
			});

		this.receiveICE = this.service.receiveICE
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let iceMessage: IceMessageType = this.service.jsonToObject<IceMessageType>(json, true);
					if (this.service.isEmpty(iceMessage.sender) === false) {
						//we need to foward this IceMessageType to the proper PbxLineCallComponent
						//so that it can set pc.addIceCandidate
						for (let i = 0; i < this.phoneCallComponentRefs.length; i++) {
							if (this.phoneCallComponentRefs[i].instance.caller.remoteGuid === iceMessage.sender) {
								let ice: RTCIceCandidate = this.service.jsonToObject<RTCIceCandidate>(iceMessage.ice, true);
								if (this.service.isEmpty(ice) === false) {
									this.phoneCallComponentRefs[i].instance.receiveICE(ice)
										.then(() => {
											console.log("receiveICE -> fowarded ice to phonecallcomponent: ", iceMessage.sender);
										})
										.catch((error) => {
											console.log("receiveICE -> fowarded ice to phonecallcomponent error: ", error);
										});
								}
								break;
							}
						}
					}
					else {
						// TODO: received IceMessageType without sender string (remoteGuid), handle this error type
						console.log("received IceMessageType without sender string (remoteGuid)");
					}
				}
			});

		this.receiveGroupSmsMessage = this.service.receiveGroupSmsMessage
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					//console.log("receiveGroupSmsMessage: ", json);
					let smsMessage: SmsMessageType = this.service.jsonToObject<SmsMessageType>(json, true);
					if (this.service.isEmpty(smsMessage.remoteGuid) === false) {
						// NOTE: phoneLineConnection contains the senders information
						let phoneLineConnection: PhoneLineConnectionType = this.service.getPhoneLineConnectionFromCacheByRemoteGuid(smsMessage.remoteGuid);
						if (phoneLineConnection) {
							let { email, name } = phoneLineConnection.hubConnection;

							let isMe = this.service.profile.email.toLowerCase() === email.toLowerCase();
							//this signalr Event is outside of angular's zone so
							//lets go back to the zone and update the message
							if (!isMe) {
								this.ngZone.run(() => {
									this.messages.push({
										content: smsMessage.message,
										from: name,
										email: email,
										positionRight: false
									})
								})
							}
						}
					}
					else {
						// TODO: received SmsMessageType without sender string (remoteGuid), handle this error type
						console.log("received smsMessage without remoteGuid string (remoteGuid)");
					}
				}
			});

		this.receivePrivateSmsMessage = this.service.receivePrivateSmsMessage
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					console.log("receiveGroupSmsMessage: ", json);
					let smsMessage: SmsMessageType = this.service.jsonToObject<SmsMessageType>(json, true);
					if (this.service.isEmpty(smsMessage.remoteGuid) === false) {
						// NOTE: phoneLineConnection contains the senders information
						let phoneLineConnection: PhoneLineConnectionType = this.service.getPhoneLineConnectionFromCacheByRemoteGuid(smsMessage.remoteGuid);
						//TODO: display the message and sender information in the GUI
						//smsMessage.icon = 'paper-plane'
						//smsMessage.isPrivate = true;
						smsMessage.sender = phoneLineConnection.hubConnection.name;
					}
					else {
						// TODO: received IceMessageType without sender string (remoteGuid), handle this error type
						console.log("received smsMessage without remoteGuid string (remoteGuid)");
					}
				}
			});

		this.receiveBusyResponse = this.service.receiveBusyResponse
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					console.log("phone.ts -> receivedBusyResponse remoteGuid:", remoteGuid);

					let outgoingCallDialog = this.matDialog.getDialogById('outgoing-call')
					this.ngZone.run(() => {
						outgoingCallDialog && outgoingCallDialog.close({
							message: 'The other user is busy on another line. Please try your call at a later time.',
							title: 'User busy'
						})
					})
				}
			});

		this.receiveNotAcceptCall = this.service.receiveNotAcceptCall
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let remoteGuid = message.message;
				if (!this.service.isEmpty(remoteGuid)) {
					console.log("phone.ts -> receivedNotAcceptCall remoteGuid:", remoteGuid);
					let outgoingCallDialog = this.matDialog.getDialogById('outgoing-call')
					console.log(outgoingCallDialog)
					this.ngZone.run(() => {
						outgoingCallDialog && outgoingCallDialog.close({
							message: 'The other user did not accept your call.',
							title: 'Call Not Accepted'
						})
					})
				}
			});

		this.receivePutOnHold = this.service.receivePutOnHold
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					// when the remote users puts this user on hold, the remote user will hide this localUsers phoneCallComponent.
					// and request this localUser to hide the remoteUsers phoneCallComponent
					// TODO: retrieve the phoneCallComponentRef
					let phoneCallComponent = this.getPhoneCallComponentInstance(remoteGuid);
					if (this.service.isEmpty(phoneCallComponent) === false) {
						this.ngZone.run(() => {
							phoneCallComponent.setHolded(true)
						})
					}
				}
			});
		this.receiveRemoveOnHold = this.service.receiveRemoveOnHold
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					// when the remote users puts this user on hold, the remote user will hide this localUsers phoneCallComponent.
					// and request this localUser to hide the remoteUsers phoneCallComponent
					// TODO: retrieve the phoneCallComponentRef
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
				//NOTE: this method is the sames as this.onEndPhoneCallComponent they both just do cleanup work.
				// if one finishes before the other, they the second option just resolves, this.onEndPhoneCallComponent is a backup to this method

				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(remoteGuid);

					this.removePhoneCallComponent(remoteGuid);
					this.isBusy = this.service.isPhoneBusy();

					if (this.isBusy === false) {
						return await this.hangUp();
					}
					else {
						return;
					}
				}
			});

		this.receivePbxCallQueueOccupants = this.service.receivePbxCallQueueOccupants
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					console.log("receivePbxCallQueueOccupants: ", json);
					let pbxCallQueues: Array<PbxCallQueueDto> = this.service.jsonToObject<Array<PbxCallQueueDto>>(json, true);
					if (this.service.isEmpty(pbxCallQueues) === false) {
						// TODO: update the GUI pbx call queue list to match this list
					}
					else {
						//received empty list of customers, nothing to show in pbx call queue
					}
				}
			});
	}

	endListeners(): void {
		console.log("phone.ts listeners ended");

		this.receiveAcceptPhoneLineInvitation && this.receiveAcceptPhoneLineInvitation.unsubscribe();

		this.receiveAreYouReadyForCall && this.receiveAreYouReadyForCall.unsubscribe();

		this.receiveReadyForCall && this.receiveReadyForCall.unsubscribe();

		this.receiveNotReadyForCall && this.receiveNotReadyForCall.unsubscribe();

		this.receiveSDP && this.receiveSDP.unsubscribe();

		this.receiveICE && this.receiveICE.unsubscribe();

		this.receiveGroupSmsMessage && this.receiveGroupSmsMessage.unsubscribe();

		this.receivePrivateSmsMessage && this.receivePrivateSmsMessage.unsubscribe();

		this.receiveBusyResponse && this.receiveBusyResponse.unsubscribe();

		this.receiveNotAcceptCall && this.receiveNotAcceptCall.unsubscribe();

		this.receivePutOnHold && this.receivePutOnHold.unsubscribe();

		this.receiveRemoveOnHold && this.receiveRemoveOnHold.unsubscribe();

		this.receiveHangUpNotice && this.receiveHangUpNotice.unsubscribe();

		this.receivePbxCallQueueOccupants && this.receivePbxCallQueueOccupants.unsubscribe();
	}

	// when another user hangs up, child PbxLineCallComponent will call this method
	async onEndPhoneCallComponent(call: CallType): Promise<void> {
		//NOTE: this method is in backup to this.receiveHangUpNotice. they both just do the same cleanup work.
		// if one finishes before the other, they the second option just resolves.
		// called from child PbxLineCallComponent
		console.log("phone.ts onEndPhoneCallComponent() call: ", call);
		this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(call.remoteGuid);

		this.removePhoneCallComponent(call.remoteGuid);
		this.isBusy = this.service.isPhoneBusy();
		console.log("phone.ts -> onEndCall() success this.isBusy: ", this.isBusy);

		if (this.isBusy === false) {
			return await this.hangUp();
		}
		else {
			return;
		}

		//TODO: do any ui clean up
	};

	// removes a phonecallcomponent from the dom
	removePhoneCallComponent(remoteGuid): void {
		let index: number = this.phoneCallComponentRefs.findIndex((value) => {
			// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
			return value.instance.caller.remoteGuid == remoteGuid;
		})

		if (index >= 0) {
			let componentRef: ComponentRef<PbxLineCallComponent> = this.phoneCallComponentRefs[index];
			let instance = componentRef.instance;
			instance.pc.close();
			componentRef.destroy();
			this.phoneCallComponentRefs.splice(index, 1);
		}
		``
		//if (this.phoneCallComponentRefs.length < 1) {
		//	this.isOnCall = false;
		//}
		return;
	}

	// loops through phoneCallComponentRefs to get the instance in dom
	getPhoneCallComponentInstance(remoteGuid: string): PbxLineCallComponent {
		let index: number = this.phoneCallComponentRefs.findIndex((value) => {
			// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
			return value.instance.caller.remoteGuid == remoteGuid;
		})

		if (index > -1) {
			let componentRef: ComponentRef<PbxLineCallComponent> = this.phoneCallComponentRefs[index];
			let instance = componentRef.instance;
			return instance;
		}
		else {
			return null;
		}
	}

	// removes all phonecallcomponents from the dom
	deleteAllPhoneCallComponents(): void {
		console.log("phone.ts deleteAllPhoneCallComponents");

		for (let i = 0; i < this.phoneCallComponentRefs.length; i++) {
			let instance = this.phoneCallComponentRefs[i].instance;
			console.log("phone.ts deleteAllPhoneCallComponents instance: ", instance);
			instance.pc.close();
			this.phoneCallComponentRefs[i].destroy();
		}
		this.phoneCallComponentRefs.length = 0;

		console.log("phone.ts -> deleteAllPhoneCallComponents(): ", this.phoneCallComponentRefs);

		return;
	}

	// when the user exits the phone
	exitPhone(): void {
		this.router.navigate(['/contacts'], { relativeTo: this.activatedRoute });
	}

	groupChat() {
		console.log("phone.ts -> groupChat()")
	}

	// when this user hangs up on all calls
	async hangUp(): Promise<void> {
		try {
			console.log("phone.ts -> hangUp() -> hanging up");

			// NOTE: phoneService.hangUp deletes the phoneline and all its associated phonelineConnections
			await this.service.hangUp()

			this.deleteAllPhoneCallComponents();

			this.isBusy = this.service.isPhoneBusy();
			return
		}
		catch (e) {
			throw (e);
		}
	}

	openGroupChat() {
		this.showChatModal()
	}

	showChatModal(email?: string, remoteGuid?: string) {
		//TODO: need to implement
		// let alertData = new MaterialAlertMessageType();
		// alertData.title = "Reminder";
		// alertData.message = "TODO: implement showChatModal()";
		// this.materialHelperService.openAlert(alertData);
	}

	isContactSearchModalShown: boolean = false;

	showContactSearchModal() {
		this.isContactSearchModalShown = true;
	}

	closeContactSearchModal() {
		this.isContactSearchModalShown = false;
	}

	addPhoneCallComponentToDom(phoneLineConnection: PhoneLineConnectionType): Promise<ComponentRef<PbxLineCallComponent>> {
		return new Promise<ComponentRef<PbxLineCallComponent>>((resolve) => {
			let index: number = this.phoneCallComponentRefs.findIndex((value) => {
				// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
				return value.instance.caller.remoteGuid == phoneLineConnection.hubConnection.connectionGuid;
			})
			if (index < 0) {
				let componentRef: ComponentRef<PbxLineCallComponent> = this.phoneCallComponentInsert.createComponent(this.phoneCallComponentFactory);
				let phoneCallComponent = componentRef.instance;
				//show to main video is clicked

				// TODO: double check and implement
				//phoneCallComponent.onShowToMainVideo.subscribe(remoteStream => {
				//    this.videoHelperService.attachMediaStream(this.mainVideoElement.nativeElement, remoteStream);
				//})

				// TODO: double check and implement
				//phoneCallComponent.onPrivateMessageClicked.subscribe((remoteGuid) => {
				//    let phoneLineConnection: PhoneLineConnectionType = this.phoneService.getPhoneLineConnectionFromCacheByRemoteGuid(remoteGuid);

				//    this.showChatModal(phoneLineConnection.hubConnection.email, remoteGuid)
				//})

				if (!!phoneCallComponent.onEndPhoneCallComponent) {
					phoneCallComponent.onEndPhoneCallComponent.subscribe(this.onEndPhoneCallComponent.bind(this));
				}

				phoneCallComponent.caller = new CallerType();
				phoneCallComponent.caller.remoteGuid = phoneLineConnection.hubConnection.connectionGuid;
				phoneCallComponent.caller.profile = new ProfileDto();
				phoneCallComponent.caller.profile.email = phoneLineConnection.hubConnection.email;
				phoneCallComponent.caller.profile.name = phoneLineConnection.hubConnection.name;

				this.phoneCallComponentRefs.push(componentRef);

				resolve(componentRef);
			}
			else {
				// the dom already has the phoneLineConnection phoneCallComponent
				resolve(null);
			}
		})
	}

	localVideoClicked() {
		this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.service.localMediaStream);
	}

	sendGroupMessage() {
		let enteredSms = this.smsInput;
		this.smsInput = '';
		this.service.sendGroupSmsMessage(enteredSms, this.service.phoneLine.phoneLineGuid)
			.then(data => {
				console.log(data, 'data from send MEssage')
			})
			.catch(error => {
			})
	}

	callContact(email) {
		if (!this.service.isEmpty(email)) {
			this.service.phoneSendPhoneLineInvitation(email)
				.then((remoteGuid: string) => {
					//this.currentAlert && this.currentAlert.dismiss();
					console.log('remote guide from the one im claling', remoteGuid)
					this.isCalling = true;
					this.callingEmail = email;
					this.displayOutgoingCall(email);
				})
				.catch((error) => {
					let materialAlertMessage = new MaterialAlertMessageType;
					materialAlertMessage.title = 'call failed';
					materialAlertMessage.message = `${email} does appear to be online`;
					this.service.openAlert(materialAlertMessage)
					console.log("phone.ts -> ionViewDidLoad() -> sendPhoneLineInvitation to " + email + " error: ", error);
				});
		}
		else {
			return;
		}
	}

	//default timeout duration is 30 seconds
	displayOutgoingCall(email, duration = 30000) {
		let callingTimer;
		let outgoingCallDialog = this.matDialog.open(PbxLineOutgoingCallDialog, {
			id: 'outgoing-call',
			panelClass: ['nopadding-dialog'],
			data: {
				email: email,
				logoFileName: ''
			}
		})

		outgoingCallDialog
			.afterClosed()
			.subscribe((alert) => {
				console.log('clearing timeout', callingTimer)
				clearTimeout(callingTimer)
				if (alert) {
					this.service.openAlert({
						message: alert.message,
						title: alert.title
					});
				} else {
					this.service.cancelCall(email)
						.catch((error) => console.log(error))
						.then(() => {
							console.log('call canceled')
						})
				}
			})
		//if no response after timeout duration
		//cancel the call
		callingTimer = setTimeout(() => {
			this.service.cancelCall(email)
				.catch((error) => console.log(error))
				.then(() => {
					outgoingCallDialog.close({
						message: `There was no response from ${email}`,
						title: 'No response'
					})
				})
		}, duration)
	}
}