/////<reference path="../../../node_modules/@types/node/index.d.ts" />
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatSnackBar, MatDialog, MatDialogRef } from '@angular/material';
import { Subscription } from 'rxjs/Subscription';
import * as moment from 'moment';
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
	MeetingDto,
	MeetingAttendeeDto,
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
	templateUrl: 'meeting.page.html',
	styleUrls: ['./meeting.page.scss'],
})
export class MeetingPage implements OnInit, AfterViewInit {
	constructor(
		public router: Router,
		public activatedRoute: ActivatedRoute,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public ngZone: NgZone,
		public matDialog: MatDialog,
		private service: Service,
	) {
		this.currentUsers = new Array<GenericUserType>();
		this.attendees = new Array<MeetingAttendeeDto>();
		this.canStartMeeting = false;

		this.activatedRoute.paramMap.subscribe((params) => {
			this.meetingId = Number(params.get('meetingId'));
		});
	}
	//NOTE: phoneCallComponentInsert is a ViewContainerRef type, it lets angular know where to insert our dynamic component (PhoneCallComponent)
	@ViewChild('phoneCallComponentInsert', { read: ViewContainerRef }) phoneCallComponentInsert: ViewContainerRef;
	@ViewChild('localVideoElement') localVideoElement: ElementRef;
	@ViewChild('mainVideoElement') mainVideoElement: ElementRef;
	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;

	canStartMeeting: boolean;
	showMinimizeMainVideo: boolean = false;
	canMaxView: boolean = true;

	localMeetingAttendee: MeetingAttendeeDto;

	meetingId: number;
	title: string;
	description: string;
	fullDescription: string;
	meetDateTime: string;
	duration: string;
	isPrivate: string;

	//phoneLine: PhoneLineType;
	//localPhoneLineConnection: PhoneLineConnectionType;

	hasIncoming: boolean;

	attendees: Array<MeetingAttendeeDto>;

	textMessages: Array<TextMessageType>;
	currentMessage: TextMessageType;

	currentUsers: Array<GenericUserType>;

	_meeting: MeetingDto;
	get meeting(): MeetingDto {
		return this._meeting;
	}
	set meeting(value: MeetingDto) {
		this._meeting = value;
		if (this.service.isEmpty(value) === false) {
			this.meetingId = value.meetingId;
			this.title = value.title;
			this.description = this.service.isEmpty(value.description) ? "" : value.description.substring(0, 500);
			this.fullDescription = value.description;
			this.isPrivate = this.service.isEmpty(value.isPrivate) ? "Open" : "Private";
			if (value.meetLength < 60) {
				this.duration = value.meetLength.toString() + " Min";
			}
			else {
				let hours = Math.floor(value.meetLength / 60);
				let minutes = value.meetLength % 60;
				this.duration = hours.toString() + " Hr " + minutes.toString() + " Min";
			}

			this.meetDateTime = moment(value.meetDate).format('ddd @ hh:mm A, MM/DD/YY');
		}
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

		this.startSubscriptions();
	}

	ngOnInit() {
		if (this.service.isEmpty(this.textMessages)) {
			this.textMessages = new Array<TextMessageType>();
		}

		try {
			if (this.service.isEmpty(this.meetingId) === false) {
				let canStartApp: boolean = false;
				this.service.getAccessToken()
					.then((accessToken: string) => {
						return this.service.getMeetingById(this.meetingId, accessToken);
					})
					.then((meeting: MeetingDto) => {
						this.meeting = meeting;
						return;
					})
					.catch((e) => {
						console.log("ngOnInit Meeting error: ", e);
						throw ("Unable to start meeting. Unable to retrieve meeting information.");
					})
					.then(() => {
						return this.service.checkIsLoggedIn();
					})
					.then(async (isLoggedIn: boolean): Promise<boolean> => {
						if (isLoggedIn) {
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

								dialogRef.componentInstance.allowsGuest = this.meeting.isPrivate === true ? false : true;

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
			else {
				throw ("Unable to retrieve meeting information, the meeting Id is missing.")
			}
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
		}

		//try {
		//	this.activatedRoute.paramMap.subscribe((params) => {
		//		let meetingId = Number(params.get('meetingId'));
		//		if (this.service.isEmpty(meetingId)) {
		//			throw ("Unable to load interface. Identifier for the meeting missing.");
		//		}

		//		this.initMeeting(meetingId);
		//	});
		//}
		//catch (e) {
		//	let alert = new MaterialAlertMessageType();
		//	alert.title = "Error";
		//	alert.message = e;
		//	this.service.openAlert(alert);
		//}
	}

	ngOnDestroy() {
		//console.log("phone.component.ts ngOnDestroy()");
		this.endSubscriptions();

		this.service.hangUp()
			.then(() => {
				return this.stopLocalVideo();
			})
			.then(() => {
				this.deleteAllPhoneCallComponents();

				this.isBusy = this.service.isPhoneBusy();
			})
	}

	async startApp(): Promise<void> {
		try {
			if (this.service.isEmpty(this.meeting) === false) {
				this.initMeeting(this.meeting);
			}
			else {
				throw ("Unable to retrieve meeting information, the meeting Id is missing.")
			}
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	// this does the initial meeting check
	async initMeeting(meeting: MeetingDto): Promise<void> {
		try {
			console.log("initMeeting");

			//let accessToken: string = await this.service.getAccessToken();
			//if (this.service.isEmpty(accessToken)) {
			//	throw ("Access denied. Credentials missing.");
			//}

			//this.meeting = await this.service.getMeetingById(meetingId, accessToken);

			//console.log("got this.meeting: ", this.meeting);
			//if (this.service.isEmpty(this.meeting)) {
			//	throw ("Unable to start meeting. Unable to retrieve meeting information.");
			//}

			let correctMeetingTime: boolean = this.service.canEnterMeetingTime(meeting);

			if (correctMeetingTime) {
				// the owner of the meeting can enter the meeting
				if (this.service.email.toLowerCase() === meeting.member.email.toLowerCase()) {
					let attendee = new MeetingAttendeeDto();
					attendee.email = this.service.email;
					attendee.name = meeting.member.firstName + " " + meeting.member.lastName.substring(0, 1) + ".";
					attendee.member = meeting.member;
					attendee.meetingId = meeting.meetingId;
					attendee.memberId = meeting.member.memberId;
					this.localMeetingAttendee = attendee;
					this.enterMeeting();
				}
				else if (this.service.isEmpty(this.meeting.isPrivate)) {
					// check if the meeting is private or not
					let attendee = new MeetingAttendeeDto();
					attendee.email = this.service.email;
					let isMember = await this.service.isMember();
					if (this.service.isEmpty(isMember)) {
						attendee.name = this.service.guestProfile.name;
					}
					else {
						attendee.name = this.service.profile.firstName + " " + this.service.profile.lastName.substring(0, 1) + ".";
						attendee.memberId = this.service.profile.memberId;
						attendee.member = this.service.profile;
						attendee.meetingId = meeting.meetingId;
					}
					this.localMeetingAttendee = attendee;
					this.enterMeeting();
				}
				else if (this.service.isEmpty(meeting.meetingAttendees) === false) {
					// if it is a private meeting, we need to see if the user is invited
					let invite = meeting.meetingAttendees.find((value) => {
						return value.email.toLowerCase() == this.service.email.toLowerCase();
					});
					if (this.service.isEmpty(invite)) {
						throw ("Sorry, this is a private meeting, and your email is ont on the guest list. Please contact the meeting host to add you to the meeting.");
					}

					this.localMeetingAttendee = invite;
					this.enterMeeting();
				}
				else {
					throw ("Sorry, this private meeting does not have anyone on the guest list. Please contact the meeting host.");
				}
			}
			else {
				throw ("This meeting is not set to start until " + moment(meeting.meetDate).format('hh:mm a M/D/YYYY') + ". Please visit back upto 15 minutes before this time.");
			}
		}
		catch (e) {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	// will check the date to allow the user to enter the meeting
	//canMeetingStart(meeting: MeetingDto): boolean {
	//	// check to see if the user can enter the meeting.
	//	let currentMoment = moment(meeting.meetDate);
	//	let minDate = currentMoment.subtract(15, 'm').toDate();
	//	let maxDate = currentMoment.add(meeting.meetLength + 15, 'm').toDate();
	//	let currentDate = new Date();
	//	return currentDate > minDate && currentDate < maxDate;
	//}

	// this will start the meeting interface, and remove the meeting scheduled time displayed
	async enterMeeting(): Promise<void> {
		// the user who enters a meeting will call everyone else already in the meeting,
		//unless no one else is in the meeting.
		console.log("enter meetingId:", this.meetingId);

		this.canStartMeeting = true;

		let warnings: Array<string> = new Array<string>();
		try {
			let genericUser = new GenericUserType();
			if (this.service.isEmpty(this.service.profile) === false) {
				genericUser.id = this.service.localGuid;
				genericUser.email = this.service.profile.email;
				genericUser.name = this.service.profile.firstName + " " + this.service.profile.lastName;
				genericUser.imgSrc = this.service.isEmpty(this.service.profile.avatarFileName) ? this.service.defaultAvatar
					: this.service.avatarBaseUrl + this.service.profile.avatarFileName;
				this.currentUsers.push(genericUser);
				this.currentUsers = this.currentUsers.slice();
			}
			else if (this.service.isEmpty(this.service.guestProfile) === false) {
				genericUser.id = this.service.localGuid;
				genericUser.email = this.service.guestProfile.email;
				genericUser.name = this.service.guestProfile.name
				genericUser.imgSrc = this.service.isEmpty(this.service.guestProfile.avatarDataUri) ? this.service.defaultAvatar
					: this.service.guestProfile.avatarDataUri;
				this.currentUsers.push(genericUser);
				this.currentUsers = this.currentUsers.slice();
			}

			try {
				await this.service.initPhoneService(genericUser.name);
			}
			catch (e) {
				console.log("initPhoneService error: ", e);
				throw (e);
			}

			console.log("genericUser: ", genericUser);

			// set the phonecallcomponent factory
			this.phoneCallComponentFactory = this.componentFactoryResolver.resolveComponentFactory(PhoneCallComponent);
			// phoneCallComponentInsert should be empty when we first start the phone, (not wake from cached view)
			this.phoneCallComponentInsert.clear();
			// the phoneCallComponentRefs should be an empty array
			this.phoneCallComponentRefs = new Array<ComponentRef<PhoneCallComponent>>();

			console.log("created componentRefs: ", this.phoneCallComponentRefs);

			this.isBusy = false;

			//NOTE: for now always resolves true;
			let hasCameraPermissions: boolean = false;

			try {
				hasCameraPermissions = await this.service.checkCameraPermissions();
			}
			catch (e) {
				throw ("Unable to check camera permissions.");
			}

			if (hasCameraPermissions === false) {
				throw ("Live Net Video does not have permission to use the camera.");
			}

			let hasMicPermissions: boolean = false;
			try {
				hasMicPermissions = await this.service.checkMicrophonePermissions();
			}
			catch (e) {
				console.log("check Microphone error:", e);
				throw ("Unable to check microphone permissions.");
			}

			if (hasMicPermissions === false) {
				throw ("Live Net Video does not have permission to use the microphone.");
			}

			try {
				await this.startLocalVideo();
			}
			catch (e) {
				console.log("initLocalVideo error: ", e);
				throw (e);
			}

			let accessToken: string = await this.service.getAccessToken();
			if (this.service.isEmpty(accessToken)) {
				throw ("Access denied. Missing credentials.");
			}

			//let phoneLineId: number;

			console.log("this.meeting.phoneLineId:", this.meeting.phoneLineId);

			// first person to enter meeting will be the one establishing the phoneLineId
			// basically if the meeting doesn't contain a phoneLineId, we will update it with one
			if (this.service.isEmpty(this.meeting.phoneLineId)) {
				console.log("try get phoneline");
				let phoneLine: PhoneLineType = await this.service.tryGetPhoneLine();
				console.log('got phoneLine:', phoneLine);
				if (this.service.isEmpty(phoneLine)) {
					throw ("Unable to establish a Phone Line for the meeting.");
				}

				//this.meeting.phoneLine = phoneLine;
				this.meeting.phoneLineId = phoneLine.phoneLineId;

				console.log("this.meeting: ", this.meeting.phoneLineId);

				//phoneLineId = phoneLine.phoneLineId;

				console.log("updating meeting");
				let updatedMeeting = await this.service.updateMeeting(this.meeting, accessToken);
				this.meeting = updatedMeeting;

				console.log("done updating meeting: ", this.meeting, this.meeting.phoneLineId);
			}

			console.log("getting fresh copy of phoneLine: ", this.meeting);
			let phoneLine: PhoneLineType = await this.service.getPhoneLineById(this.meeting.phoneLineId);
			console.log("got phoneLine: ", phoneLine);

			if (this.service.isEmpty(phoneLine)) {
				throw ("Unable to establish a Phone Line for the meeting.");
			}
			this.service.phoneLine = phoneLine;
			console.log("phoneLine stored in service");
			await this.service.tryGetLocalPhoneLineConnection();
			console.log("got localPhoneLineConnection");
			await this.service.addPhoneLineConnectionToPhoneLine(this.service.localPhoneLineConnection);
			console.log("added localPhoneLineConnection to phoneLine");
			await this.service.sendAreYouReadyForCallToGroup();
			console.log("sent group AreYouReadyForCall");
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
			console.log("enterMeeting() error: ", e);
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
		}
	}

	async startLocalVideo(): Promise<void> {
		try {
			this.stopLocalVideo();

			let stream: MediaStream = await this.service.getLocalMediaStream();
			this.service.localMediaStream = stream;
			//await this.service.attachMediaStream(this.localVideoElement.nativeElement, this.service.localMediaStream);
			await this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.service.localMediaStream, this.service.localGuid);

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
		this.localVideoElement.nativeElement.srcObject = null;
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

	receiveRemoteLogout: Subscription;
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

	// #endregion

	startSubscriptions(): void {
		this.hasIncoming = false;

		this.receiveRemoteLogout = this.service.receiveRemoteLogout
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				let connectionId = message.message;
				if (this.service.isEmpty(connectionId) === false) {
					// NOTE: check the connectionId from the signalr server with the current users signalr connetionId to make sure they
					// match before, logging the app out.
					// NOTE: This is a system message
					if (connectionId === this.service.webRtcHub.connection.id) {
						// TODO: do your app logout routine here.
						try {
							await this.service.doLogout()
						}
						catch (e) {
							// TODO: handle this.service.doLogout() throw error
							console.log("service.service.ts receiveRemoteLogoutSubscription error:", e);
						}
						finally {
							this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
						}
					}
					else {
						// invalid connectionId, so nothing to do
					}
				}
				else {
					// no connectionId is message, so nothing to do
				}
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
					let dialog = this.matDialog.getDialogById('outgoing-call')
					this.ngZone.run(() => {
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
								throw ("Unable to prepare local call interface.");
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
				console.log("receiveSDP message: ", message);
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
						if (this.service.isEmpty(iceMessage) === false && this.service.isEmpty(iceMessage.sender) === false) {
							for (let i = 0; i < this.phoneCallComponentRefs.length; i++) {
								if (this.phoneCallComponentRefs[i].instance.caller.remoteGuid === iceMessage.sender) {
									let ice: RTCIceCandidate = this.service.jsonToObject<RTCIceCandidate>(iceMessage.ice, true);
									if (this.service.isEmpty(ice) === false) {
										await this.phoneCallComponentRefs[i].instance.receiveICE(ice);
									}
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
				console.log("receiveHangUpNotice message: ", message);
				// TODO: handle hangup notice

				//NOTE: this method is the sames as this.onEndPhoneCallComponent they both just do cleanup work.
				// if one finishes before the other, they the second option just resolves, this.onEndPhoneCallComponent is a backup to this method
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false && remoteGuid !== this.service.localGuid) {
					this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(remoteGuid);

					this.removePhoneCallComponent(remoteGuid);
					this.isBusy = this.service.isPhoneBusy();
					console.log("receiveHangUpNotice this.isBusy: ", this.isBusy);
					if (this.isBusy === false) {
						await this.hangUp();
					}

					return;
				}
			});
	}

	endSubscriptions(): void {
		this.receiveRemoteLogout && this.receiveRemoteLogout.unsubscribe();

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
		//NOTE: this method is in backup to this.receiveHangUpNotice. they both just do the same cleanup work.
		// if one finishes before the other, then the second option just resolves.
		// called from child PhoneCallComponent
		console.log("phone.ts onEndPhoneCallComponent() call: ", call);
		this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(call.remoteGuid);

		this.removePhoneCallComponent(call.remoteGuid);
		this.isBusy = this.service.isPhoneBusy();

		console.log("onEndPhoneCallComponent this.isBusy: ", this.isBusy);

		if (this.isBusy === false) {
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
				this.phoneCallComponentRefs.splice(index, 1);
			})
		}

		let currentUserIndex = this.currentUsers.findIndex((value) => {
			return value.id == remoteGuid;
		})
		if (currentUserIndex >= 0) {
			this.ngZone.run(() => {
				let removedUser: GenericUserType = Object.create(this.currentUsers[currentUserIndex]) as GenericUserType;
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
			//console.log("phone.ts deleteAllPhoneCallComponents instance: ", instance);
			instance.pc.close();
			this.phoneCallComponentRefs[i].destroy();
		}
		this.phoneCallComponentRefs.length = 0;

		//console.log("phone.ts -> deleteAllPhoneCallComponents(): ", this.phoneCallComponentRefs);

		return;
	}

	// when the user exits the phone
	exitPhone(): void {
		this.gotoMeetingsDashboardPage();
	}

	// when this user hangs up on all calls
	async hangUp(): Promise<void> {
		this.gotoMeetingsDashboardPage();
	}

	async addPhoneCallComponentToDom(phoneLineConnection: PhoneLineConnectionType): Promise<ComponentRef<PhoneCallComponent>> {
		try {
			let componentRef: ComponentRef<PhoneCallComponent>;
			let index: number = this.phoneCallComponentRefs.findIndex((value) => {
				// NOTE: must use == equality instead of === for this to work, === will always return -1 because === doesn't work
				return value.instance.caller.remoteGuid == phoneLineConnection.hubConnection.connectionGuid;
			})
			if (index < 0) {
				let member: MemberType;
				try {
					let accessToken = await this.service.getAccessToken();
					member = await this.service.getMemberByEmail(phoneLineConnection.hubConnection.email, accessToken);
				}
				catch (e) {
					console.log("an error occurred while trying to get a member profile with their email");
					throw (e);
				}

				componentRef = this.phoneCallComponentInsert.createComponent(this.phoneCallComponentFactory);
				let phoneCallComponent = componentRef.instance;

				phoneCallComponent.isVisible = true;

				//show to main video is clicked

				//TODO: double check and implement
				phoneCallComponent.onShowToMainVideo.subscribe(remoteStream => {
					this.showToMainVideo(remoteStream, phoneCallComponent.caller.remoteGuid);

					//if (this.service.isEmpty(remoteStream)) {
					//	this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.service.localMediaStream, this.service.localGuid);
					//}
					//else {
					//	this.service.attachMediaStream(this.mainVideoElement.nativeElement, remoteStream, phoneLineConnection.hubConnection.connectionGuid);
					//}
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
				genericUser.email = this.service.isEmpty(member) ? phoneLineConnection.hubConnection.email
					: member.email;
				genericUser.name = this.service.isEmpty(member) ? phoneLineConnection.hubConnection.name
					: member.firstName + " " + member.lastName;
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
				return null;
			}
		}
		catch (e) {
			throw (e);
		}
	}

	// attaches the localVideoStream to the mainVideo element
	async localVideoClicked() {
		//this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.service.localMediaStream);
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
		// if its our local video, then mute it because of echo
		if (guid === this.service.localGuid) {
			this.mainVideoElement.nativeElement.muted = true;
		}
		else {
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

	gotoMeetingsDashboardPage() {
		this.router.navigate(['/meetings-dashboard'], { relativeTo: this.activatedRoute });
	}
}