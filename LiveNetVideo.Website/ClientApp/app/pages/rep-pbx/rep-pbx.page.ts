import {
	Component,
	ViewChild,
	ViewContainerRef,
	ElementRef,
	ComponentRef,
	ComponentFactory,
	NgZone,
	ComponentFactoryResolver,
	ViewChildren,
	QueryList,
	AfterViewInit,
} from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Subscription } from 'rxjs/Subscription';
import { MatSnackBar, MatDialog, MatDialogRef } from '@angular/material';
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
	WarningsType,
	PbxCustomerType,
	ListItemType,
	LongIdDto,
	IdDto,
} from "../../models/index";
import { Service } from '../../services/index';
import { PhoneCallComponent, PbxCustomerComponent, OtherRepsComponent, IncomingPhoneCallComponent } from "../../components/index";

@Component({
	templateUrl: 'rep-pbx.page.html',
	styleUrls: ['./rep-pbx.page.scss']
})
export class RepPbxPage {
	constructor(
		private service: Service,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
		public componentFactoryResolver: ComponentFactoryResolver,
		public matDialog: MatDialog,
	) {
	}

	@ViewChildren(PbxCustomerComponent) pbxCustomerListItems: QueryList<PbxCustomerComponent>;

	@ViewChild('phoneCallComponentInsert', { read: ViewContainerRef }) phoneCallComponentInsert: ViewContainerRef;
	@ViewChild('localVideoElement') localVideoElement: ElementRef;
	@ViewChild('mainVideoElement') mainVideoElement: ElementRef;

	ngOnInit() {
		this.service.isCheckedIntoHubConnection();
		if (this.service.isEmpty(this.textMessages)) {
			this.textMessages = new Array<TextMessageType>();
		}

		//let message = new TextMessageType();
		//message.email = "test@lvc.com";
		//message.id = "12345";
		//message.message = "hello my friend";
		//message.name = "timmy";
		//this.textMessages.push(message);

		if (this.service.isEmpty(this.currentUsers)) {
			this.currentUsers = new Array<GenericUserType>();
		}

		this.activatedRoute.paramMap.subscribe((params) => {
			this.startSubscriptions();
			let pbxlineRepId = Number(params.get('pbxlineRepId'));
			if (this.service.isEmpty(pbxlineRepId) === false) {
				this.initPage(pbxlineRepId);
			}
			else {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = "Unable to load interface. Identifier for the call missing.";
				this.service.openAlert(alert);
			}
		});

		//console.log("init this.customers:", this.customers);
		//console.log("init this.customerQueue: ", this.customerQueue);
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
		console.log("rep-pbx.page ngOnDestroy called");
		this.hangUp()
			.then(() => {
				return this.stopLocalVideo();
			})
			.then(() => {
				if (this.service.isEmpty(this.pbxLineRep) === false) {
					return this.service.pbxRepCheckOut(this.pbxLineRep.pbxLineRepId.toString());
				}
			})
			.catch((e) => {
				console.log("rep-pbx.page.ts ngDestroy() error: ", e);
			})
			.then(() => {
				this.endSubscriptions();
			})
	}

	public phoneCallComponentRefs: Array<ComponentRef<PhoneCallComponent>> = [];
	public phoneCallComponentFactory: ComponentFactory<PhoneCallComponent>;

	otherLineReps: Array<PbxLineRepDto>;
	otherReps: Array<PbxLineRepDto>;
	hasIncoming: boolean;
	//pbxLineRepId: number;
	pbxLineRep: PbxLineRepDto;
	//pbxLineRepStatus: PbxLineRepStatusDto;
	// users waiting in the call queue
	customerQueue: Array<PbxCallQueueDto>;
	// users waiting in the queue (they are not part of the live call)
	customers: Array<PbxCustomerType>;

	isBusy: boolean;
	loading: boolean;
	_pbxline: PbxLineDto;
	get pbxline(): PbxLineDto {
		return this._pbxline;
	}
	set pbxline(value: PbxLineDto) {
		this._pbxline = value;
		if (this.service.isEmpty(value) === false) {
			if (this.service.isEmpty(this.pbxlineView)) {
				this.pbxlineView = new ListItemType();
				this.pbxlineView.id = value.pbxLineId.toString();
				this.pbxlineView.title = value.lineName;
				this.pbxlineView.content = value.description;
				this.pbxlineView.imgSrc = this.service.isEmpty(value.iconFilename) ? this.service.defaultAvatar
					: this.service.pbxContentUrl + value.companyProfileId.toString() + "/PbxLines/" + value.iconFilename + "?" + Date.now().toString();
			}
		}
		else {
			this.pbxlineView = null;
		}
	}
	pbxlineView: ListItemType;

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

	_employee: CompanyEmployeeDto;
	set employee(value: CompanyEmployeeDto) {
		this._employee = value;
		if (this.service.isEmpty(value) === false) {
			this.employeeProfile = new GenericUserType();

			this.employeeProfile.id = value.companyEmployeeId.toString();
			this.employeeProfile.name = value.member.firstName;
			this.employeeProfile.imgSrc = this.service.isEmpty(value.avatarFilename) ? this.service.defaultAvatar
				: this.service.pbxContentUrl + value.companyProfileId.toString() + "/" + this.service.employeeImageFolder + "/" + value.avatarFilename
				+ "?" + Date.now().toString();
		}
		else {
			this.employeeProfile = null;
		}
	}
	get employee(): CompanyEmployeeDto {
		return this._employee;
	}
	employeeProfile: GenericUserType;

	textMessages: Array<TextMessageType>;
	currentMessage: TextMessageType;

	// users in the call
	currentUsers: Array<GenericUserType>;

	statusMessage: string;

	async initPage(pbxlineRepId: number): Promise<WarningsType> {
		let warnings = new WarningsType();
		try {
			this.loading = true;
			let accessToken: string;
			try {
				this.statusMessage = "Requesting Access";
				accessToken = await this.service.getAccessToken();
				this.statusMessage = "Access Granted";
			}
			catch (e) {
				throw ("Unable to request access at this time. Please try again later.")
			}

			if (this.service.isEmpty(accessToken)) {
				throw ("Unable to get access. Please try your request later");
			}

			try {
				this.statusMessage = "Requesting representative information";
				this.pbxLineRep = await this.service.getPbxLineRepById(pbxlineRepId, accessToken);
				//console.log("this.pbxLineRep: ", this.pbxLineRep);
			}
			catch (e) {
				throw ("Unable to request representative information. Please try again later");
			}

			if (this.service.isEmpty(this.pbxLineRep)) {
				throw ("Unable to get representative information. Please try again later.");
			}

			let longIdDto = new LongIdDto();
			longIdDto.id = this.pbxLineRep.pbxLine.pbxLineId;
			// reps within the same pbxline
			this.otherLineReps = await this.service.getPbxLineRepsByPbxLineId(longIdDto, accessToken);

			let idDto = new IdDto();
			idDto.id = this.pbxLineRep.pbxLine.companyProfileId;
			// all reps within the company
			this.otherReps = await this.service.getPbxLineRepsByCompanyProfileId(idDto, accessToken);
			//console.log("otherReps: ", this.otherReps);
			this.pbxline = this.pbxLineRep.pbxLine;
			this.companyProfile = this.pbxLineRep.pbxLine.companyProfile;
			this.employee = this.pbxLineRep.companyEmployee;

			try {
				await this.startInterface();
			}
			catch (e) {
				throw (e);
			}

			try {
				this.statusMessage = "Checking Into Pbx Line";
				let pbxCallQueues = await this.service.pbxRepCheckIn(this.pbxLineRep.pbxLineRepId.toString());
				//console.log("checked in pbxCallQueues: ", pbxCallQueues);
				//if (this.service.isEmpty(pbxCallQueues) === false) {
				//	for (var i = 0; i < pbxCallQueues.length; i++) {
				//		// the queue to this.customerQueue

				//		await this.addPbxCallQueue(pbxCallQueues[i], accessToken);
				//	}
				//}
			}
			catch (e) {
				//console.log("e: ", e);
				throw ("Request to check into Pbx Line Failed.")
			}

			this.loading = false;
			this.statusMessage = "";
		}
		catch (e) {
			this.loading = false;
			this.statusMessage = "Error";
			let alert = new MaterialAlertMessageType();
			alert.title = "Error";
			alert.message = e;
			this.service.openAlert(alert);
			await this.hangUp();
		}

		return warnings;
	}

	receiveNotAcceptCall: Subscription;
	receiveAcceptPhoneLineInvitation: Subscription;
	receiveAreYouReadyForCall: Subscription;
	receiveSDP: Subscription;
	receiveICE: Subscription;
	receivePutOnHold: Subscription;
	receiveRemoveOnHold: Subscription;
	receiveHangUpNotice: Subscription;
	receiveRepHangUpNotice: Subscription;
	receivePing: Subscription;
	receivePingResponse: Subscription;
	receivePbxCallQueueOccupants: Subscription;
	receivePbxCallQueueNotes: Subscription;
	receivePbxPhoneLineInvitation: Subscription;

	startSubscriptions(): void {
		this.receivePbxPhoneLineInvitation = this.service.receivePbxPhoneLineInvitation
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			//.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.distinctUntilChanged()
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receivePbxPhoneLineInvitation message:", message);
				let call: CallType = this.service.jsonToObject<CallType>(message.message, true);

				if (!this.service.isEmpty(call)) {
					this.openIncomingRepDialog(call);
				}
				else {
					// received empty call, nothing to do
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
					let otherRepsDialog = this.matDialog.getDialogById('ther-reps-list');
					let outgoingCallDialog = this.matDialog.getDialogById('outgoing-call')
					this.ngZone.run(() => {
						otherRepsDialog && otherRepsDialog.close();
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
								this.pbxCustomerListItems.forEach((c) => {
									//console.log("pbxCustomerComponent: ", c);
									if (c.customer.id.toLowerCase() === phoneLineConnection.hubConnection.connectionGuid.toLowerCase()) {
										c.isBusy = true;
									}
								});
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
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveHangUpNotice message: ", message);
				// when a customer ends the call with the rep, the customer will broadcast
				// their remoteGuid to this listener, rep will use this to remove the customer
				// from this.pbxCustomerListItems querylist

				//NOTE: this method is the sames as this.onEndPhoneCallComponent they both just do cleanup work.
				// if one finishes before the other, they the second option just resolves, this.onEndPhoneCallComponent is a backup to this method
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false && remoteGuid !== this.service.localGuid) {
					this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(remoteGuid);

					this.removePhoneCallComponent(remoteGuid);
					this.removePbxCustomerListItem(remoteGuid);

					this.isBusy = this.service.isPhoneBusy();

					if (this.isBusy === false) {
						this.resetInterface();
					}

					return;
				}
			});

		this.receiveRepHangUpNotice = this.service.receiveRepHangUpNotice
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receiveHangUpNotice message: ", message);
				// when a customer ends the call with the rep, the customer will broadcast
				// their remoteGuid to this listener, rep will use this to remove the customer
				// from this.pbxCustomerListItems querylist

				//NOTE: this method is the sames as this.onEndPhoneCallComponent they both just do cleanup work.
				// if one finishes before the other, they the second option just resolves, this.onEndPhoneCallComponent is a backup to this method
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(remoteGuid);

					this.removePhoneCallComponent(remoteGuid);
					//this.removePbxCustomerListItem(remoteGuid);

					this.isBusy = this.service.isPhoneBusy();

					if (this.isBusy === false) {
						this.resetInterface();
					}

					return;
				}
			});

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
				let remoteGuid = message.message;
				if (this.service.isEmpty(remoteGuid) === false) {
					// loop through and transfer this.customerQueue item to this.customers
					// NOTE: this.customerQueue is not visible to the rep, only after the customerQueue item is
					// transfered to this.customers is the customer visible to the rep
					if (this.service.isEmpty(this.customerQueue) === false) {
						let queue = this.customerQueue.find((q) => {
							return q.connectionGuid.toLowerCase() == remoteGuid.toLowerCase();
						});
						if (this.service.isEmpty(queue) === false) {
							this.ngZone.run(async () => {
								let accessToken = await this.service.getAccessToken();
								if (this.service.isEmpty(accessToken) === false) {
									this.addCustomer(queue, accessToken);
								}
							})
						}
					}
				}
			});

		this.receivePbxCallQueueOccupants = this.service.receivePbxCallQueueOccupants
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receivePbxCallQueueOccupants message: ", message);

				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let occupants: Array<PbxCallQueueDto> = this.service.jsonToObject<Array<PbxCallQueueDto>>(json, true);
					//console.log("queues:", queues);
					if (this.service.isEmpty(occupants) === false) {
						// add or update any that are on the list
						this.ngZone.run(async () => {
							let accessToken = await this.service.getAccessToken();

							// loop through the queues and or update the current list of customers

							// remove any that aren't in the list
							if (this.service.isEmpty(this.customerQueue) === false) {
								// create new array to loop through
								let check = this.customerQueue.slice();
								for (let i = 0; i < check.length; i++) {
									let index = occupants.findIndex((o) => {
										return o.connectionGuid.toLowerCase() == check[i].connectionGuid.toLowerCase();
									});
									// if existing customer not found in occupants
									if (index < 0) {
										// then remove from original array
										let item = this.customerQueue.find((c) => {
											return c.connectionGuid.toLowerCase() == check[i].connectionGuid.toLowerCase();
										});
										if (this.service.isEmpty(item) === false) {
											this.removePbxCallQueue(item);
											this.removeCustomer(item);
										}
									}
								}
							}

							// add or update any new occupants
							for (let i = 0; i < occupants.length; i++) {
								await this.addPbxCallQueue(occupants[i], accessToken);
							}
							//console.log("customerQueue: ", this.customerQueue);
							//console.log("customers: ", this.customers);
						});
					}
					else {
						// empty queue, clear the
						this.clearCustomerList();
					}
				}
				else {
					// nothing to do, received empty package
					//console.log("json: ", json);
				}
			});

		this.receivePbxCallQueueNotes = this.service.receivePbxCallQueueNotes
			.asObservable()
			.filter<ObservableMessageType>((o) => { return this.service.isEmpty(o.message) === false; })
			.distinctUntilKeyChanged<ObservableMessageType>("timestamp")
			.subscribe(async (message: ObservableMessageType) => {
				console.log("receivePbxCallQueueNotes message: ", message);

				let json = message.message;
				if (this.service.isEmpty(json) === false) {
					let queue: PbxCallQueueDto = this.service.jsonToObject<PbxCallQueueDto>(json, true);
					if (this.service.isEmpty(queue) === false) {
						this.updatePbxCallQueue(queue);
						this.updateCustomer(queue);
						//// update this.customers and this.customerQueue

						//let index: number = -1;
						//if (this.service.isEmpty(this.customers) === false) {
						//	index = this.customers.findIndex((c) => {
						//		return c.id == queue.connectionGuid;
						//	});
						//}

						//if (index > -1) {
						//	//console.log("before: ", this.customers[index]);
						//	this.updateCustomerNote(this.customers[index], queue);
						//	//console.log("after: ", this.customers[index]);
						//}

						//console.log("customers: ", this.customers);
					}
					else {
						// empty queue, nothing to process
					}
				}
				else {
					// nothing to do, received empty package
				}
			});
	}

	endSubscriptions(): void {
		this.receiveNotAcceptCall && this.receiveNotAcceptCall.unsubscribe();
		this.receiveAcceptPhoneLineInvitation && this.receiveAcceptPhoneLineInvitation.unsubscribe();
		this.receiveAreYouReadyForCall && this.receiveAreYouReadyForCall.unsubscribe();
		this.receiveSDP && this.receiveSDP.unsubscribe();
		this.receiveICE && this.receiveICE.unsubscribe();
		this.receivePutOnHold && this.receivePutOnHold.unsubscribe();
		this.receiveRemoveOnHold && this.receiveRemoveOnHold.unsubscribe();
		this.receiveHangUpNotice && this.receiveHangUpNotice.unsubscribe();
		this.receivePing && this.receivePing.unsubscribe();
		this.receivePingResponse && this.receivePingResponse.unsubscribe();
		this.receivePbxCallQueueOccupants && this.receivePbxCallQueueOccupants.unsubscribe();
		//this.receiveAddPbxCustomer && this.receiveAddPbxCustomer.unsubscribe();
		//this.receiveRemovePbxCustomer && this.receiveRemovePbxCustomer.unsubscribe();
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

	// when another user hangs up, child PhoneCallComponent will call this method
	async onEndPhoneCallComponent(call: CallType): Promise<void> {
		//NOTE: this method is in backup to this.receiveHangUpNotice. they both just do the same cleanup work.
		// if one finishes before the other, then the second option just resolves.
		// called from child PhoneCallComponent
		console.log("phone.ts onEndPhoneCallComponent() call: ", call);
		this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(call.remoteGuid);

		this.removePhoneCallComponent(call.remoteGuid);
		this.removePbxCustomerListItem(call.remoteGuid);
		this.isBusy = this.service.isPhoneBusy();

		if (this.isBusy === false) {
			this.resetInterface();
		}

		return;
	};

	async onDisconnect(remoteGuid: string): Promise<void> {
		if (this.service.isEmpty(this.service.phoneLine) === false) {
			try {
				await this.service.sendHangUpNotice(this.service.phoneLine.phoneLineGuid);
			}
			catch (e) {
				throw (e);
			}

			this.service.removePhoneLineConnectionFromPhoneLineUsingRemoteGuid(remoteGuid);
			this.removePhoneCallComponent(remoteGuid);
			this.removePbxCustomerListItem(remoteGuid);
			this.isBusy = this.service.isPhoneBusy();
			if (this.isBusy === false) {
				this.resetInterface();
			}
		}

		return;
	}

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

	removePbxCustomerListItem(remoteGuid: string): void {
		// remove the pbxCustomerListItem
		console.log("start this.pbxCustomerListItems: ", this.pbxCustomerListItems);
		let index = this.pbxCustomerListItems.toArray().findIndex((c) => {
			return c.customer.id.toLowerCase() == remoteGuid.toLowerCase();
		})
		console.log("index: ", index);

		if (index > -1) {
			this.pbxCustomerListItems.toArray().splice(index, 1);
		}

		console.log("after this.pbxCustomerListItems: ", this.pbxCustomerListItems);
	}

	// removes a phonecallcomponent from the dom
	removePhoneCallComponent(remoteGuid: string): void {
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
		// this should call ngOnDestroy() to clean things up
		this.router.navigate(['/employer-assigned-pbxlines', this.pbxline.companyProfileId], { relativeTo: this.activatedRoute });
	}

	// when this user hangs up on all calls
	async hangUp(): Promise<void> {
		try {
			// NOTE: phoneService.hangUp deletes the phoneline and all its associated phonelineConnections
			await this.service.hangUp()
			this.deleteAllPhoneCallComponents();
			this.pbxCustomerListItems = new QueryList<PbxCustomerComponent>();
			this.isBusy = this.service.isPhoneBusy();
			return;
		}
		catch (e) {
			throw (e);
		}
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
					//throw (e);
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

				//console.log("this.currentUsers: ", this.currentUsers);

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

	// add or update this.customerQueue[i]
	async addPbxCallQueue(queue: PbxCallQueueDto, accessToken: string): Promise<void> {
		//console.log("addPbxCallQueue: ", queue, accessToken);

		try {
			if (this.service.isEmpty(this.customerQueue)) {
				this.customerQueue = new Array<PbxCallQueueDto>();
			}

			let index = this.customerQueue.findIndex((q) => {
				return q.connectionGuid == queue.connectionGuid;
			});
			if (index < 0) {
				// not found in array, so add it
				this.customerQueue.push(queue);
				await this.service.sendPing(queue.connectionGuid);
			}
			else {
				// found in array, so replace array element
				this.customerQueue[index] = queue;
			}

			////console.log("start adding customer: ", queue);
			//let pbxCustomer = await this.addCustomer(queue, accessToken);
			////console.log("finish adding customer: ", queue);
			//if (this.service.isEmpty(pbxCustomer) === false) {
			//	let index = this.customerQueue.findIndex((q) => {
			//		return q.connectionGuid == queue.connectionGuid;
			//	});
			//	if (index < 0) {
			//		// not found in array, so add it
			//		this.customerQueue.push(queue);
			//	}
			//	else {
			//		// found in array, so replace array element
			//		this.customerQueue[index] = queue;
			//	}
			//}
		}
		catch (e) {
			throw (e);
		}
		return;
	}

	removePbxCallQueue(queue: PbxCallQueueDto): void {
		if (this.service.isEmpty(this.customerQueue)) {
			this.customerQueue = new Array<PbxCallQueueDto>();
		}

		let index = this.customerQueue.findIndex((q) => {
			return q.connectionGuid == queue.connectionGuid;
		});

		if (index > -1) {
			this.customerQueue.splice(index, 1);
		}

		//if (index > -1) {
		//	let remoteGuid = queue.connectionGuid;
		//	this.removeCustomer(remoteGuid);
		//	// not found in array, so add it
		//	this.customerQueue.splice(index, 1);
		//}

		return;
	}

	// do update of this.customers and this.customerQueue
	updatePbxCallQueue(queue: PbxCallQueueDto): void {
		// find the matching queue
		// then update the queue and the customer
		if (this.service.isEmpty(this.customerQueue) === false) {
			let index = this.customerQueue.findIndex((c) => {
				return c.connectionGuid.toLowerCase() == queue.connectionGuid.toLowerCase();
			});
			if (index > -1) {
				this.customerQueue[index].subject = queue.subject;
				this.customerQueue[index].message = queue.message;
				if (this.customerQueue[index].name === this.customerQueue[index].email || this.service.isEmpty(this.customerQueue[index].name) && this.service.isEmpty(queue.name) === false) {
					this.customerQueue[index].name = queue.name;
				}
			}
		}
	}

	// add or update existing this.customers[i]
	async addCustomer(queue: PbxCallQueueDto, accessToken: string): Promise<PbxCustomerType> {
		if (this.service.isEmpty(this.customers)) {
			this.customers = new Array<PbxCustomerType>();
		}

		//let email = await this.service.getHubConnectionEmailByGuid(queue.connectionGuid, accessToken);
		if (this.service.isEmpty(queue) === false && this.service.isEmpty(queue.email) === false) {
			let index = this.customers.findIndex((c) => {
				return c.id == queue.connectionGuid;
			})

			//console.log("this.customers: ", this.customers);
			//console.log("queue:", queue);
			//console.log("index:", index);

			if (index < 0) {
				//this.customers.push(pbxCustomer);
				// not existing, so add this one

				let pbxCustomer = new PbxCustomerType();
				let member: MemberType;

				try {
					member = await this.service.getMemberByEmail(queue.email, accessToken);
				}
				catch (e) {
					console.log("rep-pbx.page.ts addCustomer() error: ", e);
				}

				//console.log("member: ", member);

				pbxCustomer.id = queue.connectionGuid;
				pbxCustomer.email = queue.email;
				pbxCustomer.subject = queue.subject;
				pbxCustomer.message = queue.message;

				if (this.service.isEmpty(member) === false) {
					pbxCustomer.name = member.firstName + " " + member.lastName;
					pbxCustomer.imgSrc = this.service.isEmpty(member.avatarFileName) ? this.service.defaultAvatar
						: this.service.avatarBaseUrl + member.avatarFileName + "?" + Date.now().toString();
				}
				else if (this.service.isEmpty(queue.name) === false) {
					pbxCustomer.name = queue.name;
					pbxCustomer.imgSrc = this.service.defaultAvatar;
				}
				else {
					pbxCustomer.name = queue.email;
					pbxCustomer.imgSrc = this.service.defaultAvatar;
				}

				this.customers.push(pbxCustomer);
				//console.log("this.customers.push(pbxCustomer): ", pbxCustomer);
				//console.log("push: ", pbxCustomer);
				return pbxCustomer;
			}
			else {
				// existing, so just do an update
				this.customers[index].subject = queue.subject;
				this.customers[index].message = queue.message;
				if (this.customers[index].email === this.customers[index].name
					|| this.service.isEmpty(this.customers[index].name) && this.service.isEmpty(queue.name) === false
				) {
					this.customers[index].name = queue.name;
				}
				//console.log("this.customers[index].name:", this.customers[index]);
				//console.log("update: ", this.customers[index]);
				return this.customers[index];
			}
		}
		else {
			return null;
		}
	}

	removeCustomer(queue: PbxCallQueueDto): void {
		if (this.service.isEmpty(this.customers)) {
			this.customers = new Array<PbxCustomerType>();
		}

		let index = this.customers.findIndex((c) => {
			return c.id.toLowerCase() == queue.connectionGuid.toLowerCase();
		})

		if (index > -1) {
			this.customers.splice(index, 1);
		}
	}

	updateCustomer(queue: PbxCallQueueDto): void {
		if (this.service.isEmpty(this.customers) === false) {
			let index2 = this.customers.findIndex((c) => {
				return c.id.toLowerCase() == queue.connectionGuid.toLowerCase();
			})
			if (index2 > -1) {
				this.customers[index2].subject = queue.subject;
				this.customers[index2].message = queue.message;
				if (this.customers[index2].name === this.customers[index2].email || this.service.isEmpty(this.customers[index2].name) && this.service.isEmpty(queue.name) === false) {
					this.customers[index2].name = queue.name;
				}
			}
		}
	}

	async displayOtherReps(): Promise<void> {
		if (this.service.isEmpty(this.otherReps) === false) {
			let dialogRef = this.matDialog.open(OtherRepsComponent, {
				id: 'reps-paging-list',
				width: '80%',
				height: '80%',
				data: this.otherReps
			});
		}
		else {
			throw ("Unable to find any other representatives.");
		}
	}

	// for accepting pages from othe reps
	openIncomingRepDialog(call: CallType): void {
		this.ngZone.run(() => {
			//console.log("openIncomingCallDialog call: ", call);
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
					let accessToken = await this.service.getAccessToken();
					let pbxlineRepStatus: PbxLineRepStatusDto;
					try {
						pbxlineRepStatus = await this.service.getPbxLineRepStatusByConnectionGuid(call.remoteGuid, accessToken);
					}
					catch (e) {
						console.log("pbxlineRepStatus error: ", e);
					}

					if (this.service.isEmpty(pbxlineRepStatus) === false) {
						try {
							await this.service.pbxOtherRepCheckIn(pbxlineRepStatus.pbxLineRep.pbxLineId, pbxlineRepStatus.pbxLineRep.pbxLineRepId);
						}
						catch (e) {
							console.log("pbxOtherRepCheckIn error: ", e);
						}

						try {
							await this.service.acceptPbxPhoneLineInvitation(phoneLineGuid, remoteGuid);
						}
						catch (e) {
							console.log("acceptPbxPhoneLineInvitation error: ", e);
						}
					}
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

	//updateCustomerNote(customer: PbxCustomerType, queue: PbxCallQueueDto): void {
	//	customer.subject = queue.subject;
	//	customer.message = queue.message;
	//	if (customer.name === customer.email || this.service.isEmpty(customer.name) && this.service.isEmpty(queue.name) === false) {
	//		customer.name = queue.name;
	//	}
	//	return;
	//}

	clearCustomerList(): void {
		this.ngZone.run(() => {
			//console.log("clearing customer list");
			this.customerQueue = null;
			this.customers = null;
		})
	}

	resetInterface(): void {
		this.currentMessage = null;
		this.textMessages = new Array<TextMessageType>();
	}

	test(): void {
		console.log("test pbxCustomerListItems: ", this.pbxCustomerListItems);
	}
}