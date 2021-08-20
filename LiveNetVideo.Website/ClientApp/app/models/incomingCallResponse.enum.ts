export enum IncomingCallResponseEnum {
	name = "IncomingCallResponseEnum",
	//
	// Summary:
	// accept a call, this.phoneService.sendAcceptPhoneLineInvitation(call.phoneLineGuid, call.remoteGuid)
	accept = 1,
	//
	// Summary:
	// tags a call to be denied, this.phoneService.sendNotAcceptCall(call.remoteGuid);
	deny = 2,
	//
	// Summary:
	// tags a call to be blocked
	// this.phoneService.sendNotAcceptCall(call.remoteGuid);
	// this.blockCallService.blockEmail(call.profile.email);
	block = 3
}