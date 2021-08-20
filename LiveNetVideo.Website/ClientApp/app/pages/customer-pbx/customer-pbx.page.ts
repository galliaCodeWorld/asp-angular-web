import {
	Component,
	ViewChild,
	ViewContainerRef,
	ElementRef,
	ComponentRef,
	ComponentFactory,
	NgZone,
	ComponentFactoryResolver,
	AfterViewInit,
} from '@angular/core';

import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,
	AbstractControl
} from '@angular/forms';

import { Subscription } from 'rxjs/Subscription';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';

import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import {
	PbxLineDto,
	MaterialAlertMessageType,
	GenericUserType,
	TextMessageType,
	CompanyProfileDto,
	PbxCallQueueDto,
	PbxLineRepDto,
	PbxLineRepStatusDto,
	MemberType,
	CompanyEmployeeDto,
	ObservableMessageType,
	CallerType,
	NotReadyForCallType,
	IncomingCallResponseEnum,
	HubConnection,
	PhoneLineType,
	PhoneLineConnectionType,
	IceMessageType,
	SdpMessageType,
	CallType,
	SmsMessageType,
	ProfileDto,
	LongIdDto,
	PbxCustomerType,
	LoginOptionsEnum,
} from "../../models/index";
import { Service } from '../../services/index';
import { PhoneCallComponent, IncomingPhoneCallComponent, LoginOptionsComponent, MemberLoginFormComponent } from "../../components/index";

@Component({
	templateUrl: 'customer-pbx.page.html',
	styleUrls: ['customer-pbx.page.scss']
})
export class CustomerPbxPage {
	constructor(
		private service: Service,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
		public componentFactoryResolver: ComponentFactoryResolver,
		private fb: FormBuilder,
		private matDialog: MatDialog,
	) {
		//this.displayCallEnded = false;
		this.loading = true;
		this.statusMessage = "";
		this.currentUsers = new Array<GenericUserType>();
		this.totalWaitTime = "";
		this.customersAhead = 0;
		this.createForm();
		this.showFormProgress = false;
		// NOTE: if the page links to itself with a different id, the constructor will not run
		// so it is best to grab the param from this.activatedRoute.paramMap.subscribe((params) => {});
		//let id = this.activatedRoute.snapshot.params['pbxlineId'];
		//console.log("id:", id);

		this.activatedRoute.paramMap.subscribe((params) => {
			this.pbxLineId = Number(params.get('pbxlineId'));
			console.log("pbxLineId: ", this.pbxLineId);
		});
	}

	@ViewChild('phoneCallComponentInsert', { read: ViewContainerRef }) phoneCallComponentInsert: ViewContainerRef;
	@ViewChild('localVideoElement') localVideoElement: ElementRef;
	@ViewChild('mainVideoElement') mainVideoElement: ElementRef;

	pbxLineId: number = 0;

	ngOnInit() {
		this.callEnded = false;
		if (this.service.isEmpty(this.pagingTimer) === false) {
			window.clearTimeout(this.pagingTimer);
		}
		if (this.service.isEmpty(this.textMessages)) {
			this.textMessages = new Array<TextMessageType>();
		}

		this.startSubscriptions();
		//this.activatedRoute.paramMap.subscribe((params) => {
		//	this.pbxlineId = Number(params.get('pbxlineId'));
		//	if (this.service.isEmpty(pbxlineId) === false) {
		//		this.initPage(pbxlineId);
		//	}
		//	else {
		//		let alert = new MaterialAlertMessageType();
		//		alert.title = "Error";
		//		alert.message = "Unable to load interface. Identifier for the Pbx Line missing.";
		//		this.service.openAlert(alert);
		//	}
		//});

		let canStartApp: boolean = false;
		this.service.checkIsLoggedIn()
			.then(async (isLoggedIn: boolean): Promise<boolean> => {
				if (isLoggedIn) {
					// email has to be set if the user is logged in
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
							console.log("kicked to login");
							this.router.navigate(['/login']);
						})
						.catch((e) => {
						})
				}
			});
	}

	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;
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

	ngOnDestroy() {
		this.endConnection();
		console.log("customer-pbx.page ngOnDestroy()");
	}

	public phoneCallComponentRefs: Array<ComponentRef<PhoneCallComponent>> = [];
	public phoneCallComponentFactory: ComponentFactory<PhoneCallComponent>;

	showFormProgress: boolean;

	//displayCallEnded: boolean;
	//waitTime: string;
	callEnded: boolean;
	totalWaitTime: string;
	customersAhead: number;
	isBusy: boolean;
	loading: boolean;
	hasIncoming: boolean;
	pbxline: PbxLineDto;
	pbxlineRepStatus: PbxLineRepStatusDto;

	_companyProfile: CompanyProfileDto;
	set companyProfile(value: CompanyProfileDto) {
		this._companyProfile = value;

		if (this.service.isEmpty(value) === false) {
			this.genericCompanyProfile = new GenericUserType();
			this.genericCompanyProfile.id = value.companyProfileId.toString();
			this.genericCompanyProfile.name = value.companyName;
			this.genericCompanyProfile.imgSrc = this.service.isEmpty(value.logoFilename) ? this.service.defaultAvatar
				: this.service.pbxContentUrl + value.companyProfileId.toString() + "/" + value.logoFilename + "?" + Date.now().toString();
		}
		else {
			this.genericCompanyProfile = null;
		}
	}
	get companyProfile(): CompanyProfileDto {
		return this._companyProfile;
	}
	genericCompanyProfile: GenericUserType;

	_pbxCallQueue: PbxCallQueueDto;
	get pbxCallQueue(): PbxCallQueueDto {
		return this._pbxCallQueue;
	}
	//set pbxCallQueue(value: PbxCallQueueDto) {
	//	this._pbxCallQueue = value;
	//}
	async setPbxCallQueue(value: PbxCallQueueDto, accessToken: string): Promise<void> {
		//console.log("start setPbxCallQueue: ", value);
		this._pbxCallQueue = value;
		if (this.service.isEmpty(value) === false) {
			try {
				//let accessToken = await this.service.getAccessToken();
				if (this.service.isEmpty(accessToken) === false) {
					if (this.service.isEmpty(value.pbxLineRepId) === false) {
						if (this.service.isEmpty(this.pbxLineRep) ||
							(this.service.isEmpty(this.pbxLineRep) === false && this.pbxLineRep.pbxLineRepId !== value.pbxLineRepId)
						) {
							let idDto = new LongIdDto();
							idDto.id = value.pbxLineRepId;
							let statuses = await this.service.getPbxLineRepStatusByPbxLineRepId(idDto, accessToken);
							//console.log("statuses: ", statuses);
							let status = this.service.isEmpty(statuses) ? null : statuses[0];
							if (this.service.isEmpty(status) === false) {
								// we have a record.
								this.pbxlineRepStatus = status;
								// now we need to send a ping to confirm they are really online
								// when we receive the response, then we will add the rep
								await this.service.sendPing(status.connectionGuid);
							}
							//this.pbxLineRep = await this.service.getPbxLineRepById(value.pbxLineRepId, accessToken);
							//console.log("this.pbxLineRep: ", this.pbxLineRep);
							//if (this.service.isEmpty(this.pbxLineRep) === false) {
							//	//this.companyEmployee = await this.service.getCompanyEmployeeById(this.pbxLineRep.companyEmployeeId, accessToken);
							//	this.companyEmployee = this.pbxLineRep.companyEmployee;
							//	console.log("this.employee: ", this.employee);

							//}
						}
						else {
							// its the same rep, so no need to update rep information
						}
					}
					else {
						// no rep assigned
						this.clearRep();
					}
				}
			}
			catch (e) {
				console.log("error: ", e);
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e;
				this.service.openAlert(alert);
			}
		}
		else {
			this.clearRep();
		}
	}

	textMessages: Array<TextMessageType>;
	currentMessage: TextMessageType;

	currentUsers: Array<GenericUserType>;

	pbxLineRep: PbxLineRepDto;

	_companyEmployee: CompanyEmployeeDto;
	get companyEmployee(): CompanyEmployeeDto {
		return this._companyEmployee;
	}
	set companyEmployee(value: CompanyEmployeeDto) {
		this._companyEmployee = value;
		if (this.service.isEmpty(value) === false) {
			this.employee = new GenericUserType();

			this.employee.id = value.companyEmployeeId.toString();
			this.employee.name = value.member.firstName;
			this.employee.imgSrc = this.service.isEmpty(value.avatarFilename) ? this.service.defaultAvatar
				: this.service.pbxContentUrl + value.companyProfileId.toString() + "/" + this.service.employeeImageFolder + "/" + value.avatarFilename + "?" + Date.now().toString();
		}
		else {
			this.employee = null;
		}
	}

	employee: GenericUserType;

	customerProfile: PbxCustomerType;

	statusMessage: string;
	pagingTimer: number;

	async startApp(): Promise<void> {
		try {
			if (this.service.isEmpty(this.pbxLineId) === false) {
				await this.initPage(this.pbxLineId);
			}
			else {
				await this.service.doLogout();
				this.router.navigate(['/login']);
			}
		}
		catch (e) {
			console.log("startApp error: ", e);
		}
	}

	async initPage(pbxlineId: number): Promise<void> {
		try {
			console.log("customer-pbx.page.ts pbxlineId: ", pbxlineId);
			this.loading = true;
			let accessToken: string;
			try {
				this.statusMessage = "Requesting Access";
				accessToken = await this.service.getAccessToken();
				console.log("got accessToken: ", accessToken);
				this.statusMessage = "Access Granted";
			}
			catch (e) {
				throw ("Unable to get access at this time. Please try again later.")
			}
			try {
				this.statusMessage = "Retrieving Line Information";
				this.pbxline = await this.service.getPbxLineById(pbxlineId, accessToken);
				console.log("got pbxline: ", this.pbxline);
			}
			catch (e) {
				throw ("Unable to request Pbx Line information");
			}

			try {
				this.statusMessage = "Retrieving Company Information";
				this.companyProfile = await this.service.getCompanyProfileById(this.pbxline.companyProfileId, accessToken);
			}
			catch (e) {
				throw ("Unable to request company information");
			}

			//console.log("isLoggedIn:", this.service.isLoggedIn);

			//// check if user is logged in if not do instantGuestLogin
			//if (this.service.isLoggedIn === false) {
			//	// do instant guestLogin
			//	try {
			//		this.statusMessage = "Creating identity for guest user.";
			//		await this.service.instantGuestLogin();
			//		this.statusMessage = "Identity created for guest user.";
			//	}
			//	catch (e) {
			//		throw (e);
			//	}
			//}

			try {
				await this.startInterface();
			}
			catch (e) {
				throw (e);
			}

			let isMember = await this.service.isMember();

			//console.log("isMember: ", isMember);

			if (this.service.isEmpty(this.customerProfile)) {
				this.customerProfile = new PbxCustomerType();
			}

			let name: string = isMember ? this.service.profile.firstName + " " + this.service.profile.lastName
				: this.service.guestProfile.name;

			let pbxCallQueue: PbxCallQueueDto;
			try {
				this.statusMessage = "Assigning a representative.";
				pbxCallQueue = await this.service.PbxCustomerCheckIn(pbxlineId, name);
			}
			catch (e) {
				console.log("e: ", e);
				throw ("Unable to place user into line queue.")
			}

			if (this.service.isEmpty(pbxCallQueue)) {
				throw ("Unable to put user into line queue.");
			}

			await this.setPbxCallQueue(pbxCallQueue, accessToken);

			this.customerProfile.id = pbxCallQueue.connectionGuid;
			this.customerProfile.name = name;
			this.customerProfile.email = isMember ? this.service.profile.email : this.service.guestProfile.email;
			if (isMember) {
				this.customerProfile.imgSrc = this.service.isEmpty(this.service.profile.avatarFileName) ? this.service.defaultAvatar
					: this.service.avatarBaseUrl + this.service.profile.avatarFileName + "?" + Date.now().toString();
			}
			else {
				this.customerProfile.imgSrc = this.service.defaultAvatar;
			}

			//console.log("pbxCallQueue: ", pbxCallQueue);

			if (this.service.isEmpty(pbxCallQueue.pbxLineRepId)) {
				// no pbx rep online to assign this to this pbxCallQueue
				try {
					this.statusMessage = "Getting representative";
					await this.service.pagePbxlineReps(pbxCallQueue.pbxCallQueueId, accessToken);
					//this.statusMessage = "Page sent. Please wait, it could take several minutes for a representative to respond.";
					// TODO: OPEN dialog with count down, if before 120 seconds a rep responds by clicking the link in their email or text message
					// with the pbxCalLQueueId, then the rep is assigned to this user and signalr is sent to this user
					// the user's listener will close the dialog box and rep will istantly connect to user
					this.pagingTimer = window.setTimeout(() => {
						this.statusMessage = "";
						let alert = new MaterialAlertMessageType();
						alert.title = "Offline";
						alert.message = "Sorry, representatives are not available at this time.";
						this.service.openAlert(alert);
						this.loading = false;
					}, 5000);
				}
				catch (e) {
					//console.log("e: ", e);
					this.statusMessage = "";
					let alert = new MaterialAlertMessageType();
					alert.title = "Error";
					alert.message = "Unable to request a representative. Sorry, unable to get help at this time. Please try again later.";
					this.service.openAlert(alert);
					this.loading = false;
				}
			}
			else {
				this.statusMessage = "";
				this.loading = false;
			}
		}
		catch (e) {
			this.loading = false;
			this.statusMessage = "Error";
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
			await this.endConnection();
		}
	}

	receivePhoneLineInvitation: Subscription;
	receiveRemoteLogout: Subscription;
	receiveCancelInvitation: Subscription;
	receiveReadyForCall: Subscription;
	receiveNotReadyForCall: Subscription;
	receiveSDP: Subscription;
	receiveICE: Subscription;
	receivePutOnHold: Subscription;
	receiveRemoveOnHold: Subscription;
	receiveHangUpNotice: Subscription;
	receivePingResponse: Subscription;
	receivePing: Subscription;
	receiveNewPbxLineRep: Subscription;
	receivePbxCallQueueOccupants: Subscription;

	startSubscriptions(): void {
		// phone listeners
		this.hasIncoming = false;

		this.receiveCancelInvitation = this.service.receiveCancelInvitation
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			//.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.distinctUntilChanged()
			.subscribe((message: ObservableMessageType) => {
				console.log("receiveCancelInvitation message: ", message);
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					// the caller received acceptance, so go ahead and close the outgoingCallDialog
					// and wait for AreYouReadyForCall Signal
					let dialog = this.matDialog.getDialogById('incoming-call-dialog')
					this.ngZone.run(() => {
						dialog && dialog.close();
						let alert = new MaterialAlertMessageType();
						alert.title = "Call Ended";
						alert.message = "The other user has cancelled the call.";
					})
				}
			});

		this.receivePhoneLineInvitation = this.service.receivePhoneLineInvitation
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			//.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.distinctUntilChanged()
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receivePhoneLineInvitation message:", message);
				let call: CallType = this.service.jsonToObject<CallType>(message.message, true);

				if (!this.service.isEmpty(call)) {
					if (this.hasIncoming === false) {
						this.hasIncoming = true;
						let isMember = await this.service.isMember();

						let allowCall: boolean = false;
						let notAcceptedRemoteGuid: string;
						try {
							allowCall = await this.service.initCall(isMember, call);
						}
						catch (e) {
							console.log("initCall threw an error: ", e);
						}

						if (allowCall) {
							this.openIncomingCallDialog(call);
						}
						else {
							this.hasIncoming = false;
							this.service.sendNotAcceptCall(call.remoteGuid);
						}
					}
					else {
						// only one incoming call at a time
						this.service.sendBusyResponse(call.remoteGuid);
					}
				}
				else {
					// received empty call, nothing to do
				}
			});

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
						// send the user to the dashbard
						this.router.navigate(['/dashboard'], { relativeTo: this.activatedRoute });
					}
					else {
						// invalid connectionId, so nothing to do
					}
				}
				else {
					// no connectionId is message, so nothing to do
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
					this.ngZone.run(() => {
						this.isBusy = this.service.isPhoneBusy();
					})

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
			.subscribe((message: ObservableMessageType) => {
				console.log("receiveHangUpNotice message: ", message);
				// only do hangup if the user is currently busy with rep
				this.isBusy = this.service.isPhoneBusy();

				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false
					&& this.service.isEmpty(this.pbxlineRepStatus) === false
					&& this.pbxlineRepStatus.connectionGuid.toLowerCase() === remoteGuid.toLowerCase()
					&& this.isBusy
				) {
					this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(remoteGuid);
					this.removePhoneCallComponent(remoteGuid);
					this.isBusy = this.service.isPhoneBusy();
					if (this.isBusy === false) {
						this.endCall();
					}
				}
			});

		this.receivePingResponse = this.service.receivePingResponse
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receivePingResponse message: ", message);

				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false && this.service.isEmpty(this.pbxlineRepStatus) === false) {
					if (this.pbxlineRepStatus.connectionGuid.toLowerCase() === remoteGuid.toLowerCase()) {
						this.ngZone.run(async () => {
							let accessToken = await this.service.getAccessToken();
							if (this.service.isEmpty(accessToken) === false) {
								this.pbxLineRep = await this.service.getPbxLineRepById(this.pbxlineRepStatus.pbxLineRepId, accessToken);
								//console.log("this.pbxLineRep: ", this.pbxLineRep);
								if (this.service.isEmpty(this.pbxLineRep) === false) {
									//this.companyEmployee = await this.service.getCompanyEmployeeById(this.pbxLineRep.companyEmployeeId, accessToken);
									this.companyEmployee = this.pbxLineRep.companyEmployee;
									//console.log("this.employee: ", this.employee);
								}
							}
						});
					}
				}

				return;
			});

		this.receivePing = this.service.receivePing
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receivePing message: ", message);

				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					await this.service.sendPingResponse(remoteGuid);
				}

				return;
			});

		this.receiveNewPbxLineRep = this.service.receiveNewPbxLineRep
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe((message: ObservableMessageType) => {
				console.log("receiveNewPbxLineRep message: ", message);

				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let queue: PbxCallQueueDto = this.service.jsonToObject<PbxCallQueueDto>(json, true);
					if (this.service.isEmpty(queue) === false) {
						if (this.service.isEmpty(this.pagingTimer) === false) {
							window.clearTimeout(this.pagingTimer);
						}

						this.ngZone.run(() => {
							this.service.getAccessToken()
								.then((accessToken: string) => {
									this.setPbxCallQueue(queue, accessToken);
								})
								.catch((e) => {
									console.log("getAccessToken Error: ", e);
								})
						});
					}
					else {
						// nothing to do, invalid queue object
					}
				}
				else {
					// nothing to do, received empty package
				}
			});

		this.receivePbxCallQueueOccupants = this.service.receivePbxCallQueueOccupants
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				//console.log("receivePbxCallQueueOccupants message: ", message);
				// NOTE: this listener is intended for the customer app to get a list of
				// the current occupants and extract the wait time to display to the customer.
				// currently we are not displaying the wait time
				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let queues: Array<PbxCallQueueDto> = this.service.jsonToObject<Array<PbxCallQueueDto>>(json, true);
					if (this.service.isEmpty(queues) === false) {
						// loop through the queues and add up the total wait time
						let waitTime: number = 0;
						let customersAhead: number = 0;
						for (let i = 0; i < queues.length; i++) {
							if (queues[i].pbxCallQueueId === this.pbxCallQueue.pbxCallQueueId) {
								waitTime += queues[i].timeAllotment;
								break;
							}
							else {
								waitTime += queues[i].timeAllotment;
								customersAhead++;
							}
						}
						this.customersAhead = customersAhead;
						this.totalWaitTime = waitTime.toString();
						//console.log("customersAhead: ", this.customersAhead);
						//console.log("totalWaitTime: ", this.totalWaitTime);
					}
					else {
						// nothing to do, no queues
					}
				}
				else {
					// nothing to do, received empty package
				}
			});
	}

	endSubscriptions(): void {
		this.receivePhoneLineInvitation && this.receivePhoneLineInvitation.unsubscribe();
		this.receiveRemoteLogout && this.receiveRemoteLogout.unsubscribe();
		this.receiveCancelInvitation && this.receiveCancelInvitation.unsubscribe();
		this.receiveReadyForCall && this.receiveReadyForCall.unsubscribe();
		this.receiveNotReadyForCall && this.receiveNotReadyForCall.unsubscribe();
		this.receiveSDP && this.receiveSDP.unsubscribe();
		this.receiveICE && this.receiveICE.unsubscribe();
		this.receivePutOnHold && this.receivePutOnHold.unsubscribe();
		this.receiveRemoveOnHold && this.receiveRemoveOnHold.unsubscribe();
		this.receiveHangUpNotice && this.receiveHangUpNotice.unsubscribe();
		this.receivePing && this.receivePing.unsubscribe();
		this.receivePingResponse && this.receivePingResponse.unsubscribe();
		this.receiveNewPbxLineRep && this.receiveNewPbxLineRep.unsubscribe();
		this.receivePbxCallQueueOccupants && this.receivePbxCallQueueOccupants.unsubscribe();
	}

	formGroup: FormGroup
	createForm() {
		this.formGroup = this.fb.group({
			subject: new FormControl('', [
				Validators.maxLength(300)

			]),
			message: new FormControl('', [
				Validators.maxLength(1000)

			]),
			name: new FormControl('', [
				Validators.maxLength(100)

			])
		})
	}

	clearRep(): void {
		this.pbxLineRep = null;
		this.companyEmployee = null;
		this.pbxlineRepStatus = null;
		this.totalWaitTime = "Waiting";
		this.customersAhead = 0;
	}

	async startInterface(): Promise<void> {
		//console.log("TODO: start the customer phone interface")
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
				this.statusMessage = "Check if phone service is available.";
				await this.service.initPhoneService(genericUser.name);
				this.statusMessage = "Phone service is available.";
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

			//NOTE: for now always resolves true;
			let hasCameraPermissions: boolean = false;

			try {
				this.statusMessage = "Checking camera permission.";
				hasCameraPermissions = await this.service.checkCameraPermissions();
				this.statusMessage = "Camera permission granted.";
			}
			catch (e) {
				throw ("Unable to check camera permissions.");
			}

			if (hasCameraPermissions === false) {
				throw ("Permission to use the camera not granted.");
			}

			let hasMicPermissions: boolean = false;
			try {
				this.statusMessage = "Checking microphone permission.";
				hasMicPermissions = await this.service.checkMicrophonePermissions();
				this.statusMessage = "Microphone permission granted.";
			}
			catch (e) {
				throw ("Unable to check microphone permissions.");
			}

			if (hasMicPermissions === false) {
				throw ("Permission to use the microphone not granted.");
			}

			try {
				this.statusMessage = "Initializing video.";
				await this.startLocalVideo();
			}
			catch (e) {
				throw (e);
			}
		}
		catch (e) {
			throw (e)
		}
		return;
	}

	async startLocalVideo(): Promise<void> {
		try {
			this.stopLocalVideo();

			let stream: MediaStream = await this.service.getLocalMediaStream();
			this.service.localMediaStream = stream;
			await this.service.attachMediaStream(this.localVideoElement.nativeElement, this.service.localMediaStream);
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
				this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.service.localMediaStream);
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

	//async hangUp(): Promise<void> {
	//	//this.pbxCallQueue = null;
	//	//this.pbxline = null;
	//	//this.companyProfile = null;
	//	//this.displayCallEnded = true;

	//	try {
	//		// NOTE: phoneService.hangUp deletes the phoneline and all its associated phonelineConnections
	//		await this.service.hangUp()

	//		this.deleteAllPhoneCallComponents();

	//		this.isBusy = this.service.isPhoneBusy();
	//	}
	//	catch (e) {
	//		throw (e);
	//	}

	//	return;
	//}

	// when another user hangs up, child PhoneCallComponent will call this method
	async onEndPhoneCallComponent(call: CallType): Promise<void> {
		//NOTE: this method is in backup to this.receiveHangUpNotice. they both just do the same cleanup work.
		// if one finishes before the other, then the second option just resolves.
		// called from child PhoneCallComponent
		//console.log("phone.ts onEndPhoneCallComponent() call: ", call);
		this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(call.remoteGuid);
		this.removePhoneCallComponent(call.remoteGuid);
		this.isBusy = this.service.isPhoneBusy();

		if (this.isBusy === false) {
			await this.endCall();
		}

		return;
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
		this.router.navigate(['/dashboard'], { relativeTo: this.activatedRoute });
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

				//show to main video is clicked

				//TODO: double check and implement
				phoneCallComponent.onShowToMainVideo.subscribe(remoteStream => {
					this.service.attachMediaStream(this.mainVideoElement.nativeElement, remoteStream);
				})

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
	localVideoClicked() {
		this.service.attachMediaStream(this.mainVideoElement.nativeElement, this.service.localMediaStream);
	}

	customerProfileSubject: string;
	async sendCustomerNotes(event: Event): Promise<void> {
		if (this.formGroup.valid) {
			let subject = this.formGroup.get('subject').value;
			let message = this.formGroup.get('message').value;
			let name = this.formGroup.get('name').value;

			this.pbxCallQueue.name = this.service.isEmpty(this.customerProfile.name) ? name : this.customerProfile.name;
			this.customerProfile.name = this.pbxCallQueue.name;
			this.pbxCallQueue.subject = this.service.isEmpty(this.customerProfile.subject) ? subject : this.customerProfile.subject;
			this.customerProfile.subject = this.pbxCallQueue.subject;
			this.pbxCallQueue.message = this.service.isEmpty(this.customerProfile.message) ? message : this.customerProfile.message;
			this.customerProfile.message = this.pbxCallQueue.message;

			try {
				if (this.service.isEmpty(this.pbxlineRepStatus) === false) {
					// do update and send updated information to the rep

					await this.service.sendPbxCallQueueNotes(this.pbxCallQueue, this.pbxlineRepStatus.connectionGuid);
				}
				else {
					// do update only
					await this.service.sendPbxCallQueueNotes(this.pbxCallQueue, null);
				}
			}
			catch (e) {
				// NOTE: if the sendPbxCallQueueNotes is sending to connectionGuid that does
				console.log("sendQueueNotes error: ", e);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
		}
	}

	openIncomingCallDialog(call: CallType): void {
		this.ngZone.run(() => {
			console.log("openIncomingCallDialog call: ", call);
			let dialogRef = this.matDialog.open(IncomingPhoneCallComponent, {
				id: 'incoming-call-dialog',
				width: '80%',
				height: '80%',
				data: call
			});

			dialogRef.componentInstance.onIncomingCallResponse.subscribe(async (response: boolean) => {
				this.hasIncoming = false;
				if (response === true) {
					let phoneLineGuid = call.phoneLineGuid;
					let remoteGuid = call.remoteGuid;
					this.service.acceptedCall = null; // acceptedCall property is for regular phone, set it null here
					await this.service.acceptPhoneLineInvitation(phoneLineGuid, remoteGuid);
				}
				else {
					this.service.sendNotAcceptCall(call.remoteGuid);
				}

				dialogRef.close();
			});

			dialogRef.afterClosed().subscribe(() => {
				dialogRef.componentInstance.onIncomingCallResponse.unsubscribe();
			});
		})
	}

	// broadcast hangUpNotice and endCall();
	async endConnection(): Promise<void> {
		//console.log("endConnection called this.service.phoneLine: ", this.service.phoneLine);
		if (this.service.isEmpty(this.service.phoneLine) === false) {
			try {
				//console.log("broadcasting hangup notice to phoneline:", this.service.phoneLine);
				await this.service.sendHangUpNotice(this.service.phoneLine.phoneLineGuid);
			}
			catch (e) {
				throw (e)
			}
		}
		await this.endCall();

		return;
	}

	async endCall(): Promise<void> {
		//console.log("ending call");
		this.service.localPhoneLineConnection = null;
		this.service.phoneLine = null;
		this.deleteAllPhoneCallComponents();
		this.service.localMediaStream = null;
		this.localVideoElement.nativeElement.srcObject = null;
		if (this.service.isEmpty(this.pbxCallQueue) === false) {
			try {
				//console.log("performing pbxCustomerCheckout this.pbxCallQueue: ", this.pbxCallQueue);
				await this.service.PbxCustomerCheckOut(this.pbxCallQueue.pbxCallQueueId);
			}
			catch (e) {
				console.log("customer-pbx.page endConnection error: ", e);
			}
		}

		//console.log("ending subscriptions");
		this.endSubscriptions();

		if (this.service.isEmpty(this.pagingTimer) === false) {
			window.clearTimeout(this.pagingTimer);
		}
		this.isBusy = this.service.isPhoneBusy();
		// TODO: modify the interface to show the user that they are nolong in the queue, maybe a summary of
		// their interaction with the rep
		this.callEnded = true;
	}

	//test(): void {
	//	let employee = new GenericUserType();
	//	employee.id = "12345";
	//	employee.name = "Tom";
	//	employee.email = "tom@lvc.com";
	//	employee.imgSrc = this.service.defaultAvatar;
	//	this.employee = employee;
	//}
}