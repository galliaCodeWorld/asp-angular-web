# SIGNALING

On the server the response is HttpResponseDto type.
HttpResponseDto.Content is the data package which is either a string
or a json serialized object.

On the client side HttpResponseDto is parsed into SignalrHttpResponseType
and SignalrHttpResponseType.content will contain the json string or plain string.
The json will then be parsed into an object used by the JS client.

```cs
var response = new HttpResponseDto();
response.StatusCode = HttpStatusCode.OK;
response.ActionCode = ErrorActionCode.Default;
response.Content = _appHelper.SerializeObject(someDto);
```

The Signalr Hub can then send to specific client or group 
then return response to the client making the method hub method call.

Group Example:
```cs
Clients.Group(phoneLine.PhoneLineGuid.ToString()).receiveUpdatePhoneLineOccupants(_appHelper.SerializeObject(phoneLine));
```

Specific Client Example:
```cs
Clients.Client(hubConnection.ConnectionId).receivePbxCallQueueOccupants(_appHelper.SerializeObject(queuesDto));
```

Return data (json serialized HttpResponseDto type) to the client making the method call
```cs
return _appHelper.SerializeObject(response);
```

## SignalR




## Phone Call

__Caller__:

Prior to sending out PhoneLineInvitation

- Get email of contact to call.
- Gets existing or new phoneLine. 

_signalr_
```javascript
let response: string  = await this.webRtcHub.invoke("requestNewPhoneLine");
```

Note: response.content will get parsed into phoneLine object and
phoneLine object is stored on client system in _service.phoneLine_.

This creates db entry in net.PhoneLine which
is just basically a GUID to group the entire phone call.
TODO: move this db to Azure Cache for Redis, or Azure Cosmos DB, or Table Storage

_NOTE:_ The system should get existing phoneLine if already in call 
with other users and making call to another user. The system should
get a new phoneLine if this is a new call with no existing connection
with other users. 

The system will determine if the user is in an existing call by
checking to see if there is an existing phoneLine in service.
If service.phoneLine exists, then use it for the call, else request a new 
phoneLine for the call.

- Get existing or new PhoneLineConnection using the PhoneLineGuid.

_signalr_
```javascript
let response = await this.webRtcHub.invoke("requestNewPhoneLineConnection", phoneLineGuid);
```

Note: response.content will get parsed into phoneLineConnection object
and the phoneLineConnection object get stored on client system in _service.localPhoneLineConnection_.

This will create a db entry in net.PhoneLineConnection using PhoneLineId
and HubConnectionId. This will associate the users signalr hubconnection
to their phoneLineConnection and their phoneLineConnection to the phoneLine.
This is how users in a phoneCall can send messages to each other in the system.
This is also how the sytem will send messages to the users in the phoneLine.

When the request for a new phoneLineConnection is made, the user is 
added to a signalr group and identified using their hubconnection.ConnectionId
as a string. The group will be named using the phoneLineGuid.
Signalr will create a new group if one doesn't already exist or it will
add the users hubconnection.ConnectionId to and existing group (PhoneLineGuid)

Each time a phoneLineConnection is created signalr will send a signal
to the group (PhoneLineGuid) with the entire phoneLine object, which will 
include all the phoneLineConnections. The client JS 
will receive "receiveUpdatePhoneLineOccupants".

_signalr_
```javascript
this.webRtcHub.on("receiveUpdatePhoneLineOccupants", (json: string) => { 
	// handle the signalr message
});
```

- After the phoneLineConnection is retrieved, 
the client system will check the local copy of phoneLine (not fresh copy from server) and 
add the retrieved phoneLineConnection to the local copy of phoneLine if it is not 
already in the local copy of phoneLine.

- The client system displays outgoing call modal until it receives "receiveAcceptPhoneLineInvitation"
or 60 second timeout which ever occurs first. At which point the out-going call modal is closed.

- The client system makes the call

_signalr_
```javascript
let response = await this.webRtcHub.invoke("sendPhoneLineInvitation", phoneLineGuid, otherUserEmail, callerName);
```

_NOTE:_ 

_otherUserEmail_ is used by signalr hub to retrieve the other users hubConnection
and get the users hubConnectionId to send them the invitation.

_phoneLineGuid_ is used by WebRtcHub to retrieve the phoneLine from db

_callerName_ is just string to identify the caller. If the caller is a member
then the callerName param is ignored and their member profile name is used instead.

_WebRtcHub_

The WebRtcHub will json serialize the CallerDto and forward to the other client user

```cs
var caller = new CallerDto();
// other properties added
Clients.Client(hubConnection.ConnectionId).receivePhoneLineInvitation(_appHelper.SerializeObject(call));
```

WebRtcHub will return the remote users remoteGuid (hubConnection.ConnectionGuid.ToString())
```cs
return _appHelper.SerializeObject(httpResponseDto);
```

The client system then parses the response and extracts remoteGuid (hubConnection.ConnectionGuid).
If the remoteGuid is empty, then close the "outgoing-call" modal and alert the user that
the other user is not available for calls.

If the remoteGuid is available, then the other user is online. So the caller
just listens for signalr responses.

```javascript
webRtcHub.on("receiveBusyResponse", (remoteGuid: string) => {});
```

```javascript
webRtcHub.on("receiveNotAcceptCall", (remoteGuid: string) => {});
```

```javascript
webRtcHub.on("receiveCancelInvitation", (remoteGuid: string) => { });
```

```javascript
webRtcHub.on("receiveAcceptPhoneLineInvitation", (remoteGuid: string) => { });
```

When the client system receives "receiveAcceptPhoneLineInvitation", it will close the out-going 
call modal. 


```javascript
webRtcHub.on("receiveAreYouReadyForCall", (json: string) => { });
```
CONTINUE: in caller section after receiver section

__Receiver__

The other user will receive the invitation and extract the Caller object (CallType).
```javascript
webRtcHub.on("receivePhoneLineInvitation", (json: string) =>{});
```

The client system will check to see if the user is a member by extracting
the memberId from accessToken (JwtToken).

The client system will check to see if the user is busy with another call.
1. if service.phoneLine is empty, then not busy
2. if service.phoneLine but no phoneLineConnections in phoneLine, then not busy
3. if service.phoneLine.phoneLineConnetions. If there is no other phoneLineConnections
other than the local users phoneLineConnection, then the user is not busy.  

if the user is not busy continue, else send busy response.

NOTE: Currently the client system sendNotAcceptCall
```javascript
let response = await this.webRtcHub.invoke("sendNotAcceptCall", remoteGuid);
```

The client system will check to see if the caller email is blocked by checking to see
if the caller email is in the cached blocked email list. If the email exists
in the blocked email list, then sendNotAcceptCall.

If the user is not busy and the caller email is not blocked, then mark ringer hasIncoming = true
and open the "incoming-call-dialog";

The user can now accept, deny, or block the caller.

If the user Blocks the caller, then sendNotAcceptCall and add the users email to the 
block email list in db and local cache and close the incoming-call-dialog

NOTE: Block is not an option of "incoming-call-dialog" (IncomingPhoneCallComponent)
in the web app. 

If the user denies the call, then sendNotAcceptCall and close the incoming-call-dialog.

If the user accepts the call the system will respond in two ways.

If the user is not on the phone page already, the system will set 
servcie.acceptedCall = CallType and navigate to phone page.

On Phone page the client system will retrieve the phoneLine using phoneLineGuid.
```javascript
phoneLine = await this.service.getPhoneLineByGuid(phoneLineGuid);
```
After phoneLine is retrieved service.phoneLine = phoneLine will be set.

__TODO__: The receiver should check the service.phoneLine.phoneLineConnections to make sure their 
hubconnectionGuid is not associated with any of the service.phoneLine.phoneLineConnections.
_What scenario would the receivers hubconnectionGuid be associated with service.phoneLine.phoneLineConnections?_
If the hubconnectionGuid is retrieved, then us that phoneLineConnection instead of getting a new one.

(Scenario: user is in call and suddenly app closes. Then restarts and user receives call again.)

The client system will get new PhoneLineConnection using PhoneLineGuid.

__TODO__: instead of adding the PhoneLineConnection to phoneLine, the client system
should just grab a fresh updated copy of phoneLine.

The client system will add PhoneLineConnection to service.phoneLine.phoneLineConnections.

The client system will send acceptPhoneLine to the caller
```javascript
let response = await this.webRtcHub.invoke("sendAcceptPhoneLineInvitation", remoteGuid);
```

The client system will wait half a second and 
then it will loop through service.phoneLine.phoneLineConnections
and send AreYouReadyForCall to each phoneLineConnection except self phoneLineConnection.

```javascript
let response = await this.webRtcHub.invoke("sendAreYouReadyForCall", localPhoneLineConnectionId, remoteGuid);
```

_remoteGuid_ is used by the hub to retrieve the other users hubconnection.

_localPhoneLineConnectionId_ is the receivers localPhoneLineConnectionId 
and is used by the hub to retrieve the receivers phoneLineConnection to foward to the 
Caller.

_WebRtcHub_
```cs
response.Content = _appHelper.SerializeObject(hubConnection);
```
NOTE: hubConnection is the Callers hub connection and is returned in the the HttpResponseDto

The receivers phoneLineConnection is fowarded to the Caller in the receiveAreYouReadyForCall
```cs
Clients.Client(hubConnection.ConnectionId).receiveAreYouReadyForCall(_appHelper.SerializeObject(phoneLineConnection));
```

__Caller__

```javascript
webRtcHub.on("receiveAcceptPhoneLineInvitation", (remoteGuid: string) => { });
```

When the client system receives "receiveAcceptPhoneLineInvitation", it will close the out-going 
call modal. 


```javascript
webRtcHub.on("receiveAreYouReadyForCall", (json: string) => { });
```

Extract the receivers phoneLineConnection from json

__TODO__: the system should grab a fresh copy of phoneLine and set it: service.phoneLine = phoneLine

__TODO__: Loop through phone.phoneCallComponentRefs and remove any PhoneCallComponent.caller.remoteGuid 
that are not in the service.phoneLine.phoneLineConnection by comparing 
PhoneCallComponent.caller.remoteGuid (hubConnection.connectionGuid) == phoneLineConnection.hubConnection.connectionGuid

__TODO__: Check to see if receivers phoneLineConnection.hubConnection.connectionGuid is already
in the phone.phoneCallComponentRefs. If its in the phone.phoneCallComponentRefs then retrieve it
else add it to the dom. In either case, we should have gave a reference to phoneCallComponent in dom.

If any errors occur, then sendNotReadyForCall
```javascript
let response = await this.webRtcHub.invoke("sendNotReadyForCall", errorMessage, remoteGuid);
```

_Adding phoneCallCompent to dom process_:

Check to make sure receiver phoneLineConnection.hubConnection.connectionGuid isn't associated with
and existing dom phoneCallComponent. If the phoneLineConnection.hubConnection.connectionGuid
is not associated with then use the component factory to insert instance into dom.

Get the actual component by calling instance on the phoneCallComponentRef.
```javascript
componentRef = this.phoneCallComponentInsert.createComponent(this.phoneCallComponentFactory);
let phoneCallComponent = componentRef.instance;
```

During the creation of the component, its listeners and properties are set
example: phone.page.ts addPhoneCallComponentToDom(phoneLineConnection: PhoneLineConnectionType);

Initialize the component
```javascript
let pc: RTCPeerConnection = await this.service.createRtcPeerConnection();
phoneCallComponent.pc = pc;
await phoneCallComponent.startPeerConnectionListeners();
```

Mark phone.isBusy = true;

If any errors occur during Initializing of component or creation of the component, then sendNotReadyForCall
```javascript
let response = await this.webRtcHub.invoke("sendNotReadyForCall", errorMessage, remoteGuid);
```

If everything goes well, then let the receiver know the calling user is ready for call (peer connection).

```javascript
let response = await this.webRtcHub.invoke("sendReadyForCall", remoteGuid);
```
NOTE: remoteGuid is the the receivers hubConnectionGuid. 
The response content will contain the receivers hubConnectionGuid

_WebRtcHub will forward the message to the Receiver
```cs
Clients.Client(hubConnection.ConnectionId).receiveReadyForCall(connectionGuid);
```
NOTE: connectionGuid is the callers hubConnectionGuid 

Now the caller waits for peer connection and exchange of SDP and ICE

__Receiver__

```javascript
webRtcHub.on("receiveReadyForCall", (remoteGuid: string) =>{});
```

__TODO__: get fresh copy of phoneLine using service.phoneLine. 
Then set service.phoneLine = phoneLine. This ensures we have the latest phoneLine
with all the new phoneLineConnections.

```javascript
let phoneLine = await this.service.getPhoneLineByGuid(this.service.phoneLine.phoneLineGuid);
this.service.phoneLine = phoneLine;
```

Now retrieve the callers phoneLineConnection
```javascript
let phoneLineConnection: PhoneLineConnectionType = this.service.getPhoneLineConnectionFromCacheByRemoteGuid(remoteGuid);
```

__TODO__: remove any componentRefs that are not associated with this.service.phoneLine.phoneLineConnections.
compare
phoneCallComponent.caller.remoteGuid with phoneLineConnection.hubConnection.connectionGuid


```javascript
phonePage.removePhoneCallComponent(remoteGuid);
```

NOTE: the receiver will receive multiple "receiveReadyForCall" if there are already multiple 
users (phoneLineConnections) in the existing phoneLine.

__TODO__: check to see if the callers phoneLineConnection is associated with 
and existing componentRefs. If associated, then use it, else create new componentRef.

existing componentRef (not sure which scenario where we would have existing componentRef at this point)
```javascript
phoneCallComponent = this.getPhoneCallComponentInstance(phoneLineConnection.hubConnection.connectionGuid);
```
creat new componentRef and initialize it.
```javascript
let componentRef: ComponentRef<PhoneCallComponent> = await this.addPhoneCallComponentToDom(phoneLineConnection);
phoneCallComponent = componentRef.instance;
let pc: RTCPeerConnection = await this.service.createRtcPeerConnection();
phoneCallComponent.pc = pc;
await phoneCallComponent.startPeerConnectionListeners();
phoneCallComponent.addLocalStream(this.service.localMediaStream);
await phoneCallComponent.startP2pConnection();
```

NOTE: you need to add localMediaStream to PeerConnection
`this.pc.addStream(localStream);`
before calling `phoneCallComponent.startP2pConnection()`

phone-call.component.ts
```javascript
async startP2pConnection(): Promise<void> {
	try {
		let localSdpOffer: RTCSessionDescription
		localSdpOffer = await this.pc.createOffer();
		await this.pc.setLocalDescription(localSdpOffer);
		await this.sendSDP(this.pc.localDescription, this.caller.remoteGuid);
		return;
	}
	catch (e) {
		throw (e);
	}
}
```
startP2pConnection() will create the local SDP offer 
and store it in the local webrtc system and then send 
the SDP offer (and sdp description) to the Caller.

```javascript
this.peerConnection.setLocalDescription(localSdpOffer);
```

NOTE: sdp object is turned into a json string before invoke.
```javascript
await this.webRtcHub.invoke("sendSDP", remoteGuid, sdp);
```
set phonePage.isBusy = true;

__Caller__:
Receives SDP offer from signalr system, set SDP offer and then generates SDP Answer.

The SdpOffer package is received in the signalr service, then fowarded to the page.
The page then loops through its phoneCallComponentRefs and fowards the SdpOffer
to the correct phoneCallComponent.

Caller then adds local media stream to peerConnection.
NOTE: caller only adds localMedia stream if the Sdp.type is "offer"
```javascript
this.peerConnection.addStream(localMediaStream)
```
Caller phoneCallComponent will receiveSDP(sdp)

When phoneCallComponent receives SDP it will setRemoteDescription.
NOTE: sdp is a RTCSessionDescription object
```javascript
await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
```

If Sdp.type === 'offer', then Caller Generate localSdpAnswer then store it.
```javascript
let localSdpAnswer: RTCSessionDescription = await this.peerConnection.createAnswer();
this.peerConnection.setLocalDescription(localSdpAnswer);
```
then sends the SDP Answer to the Receiver through signalr system
```javascript
await this.webRtcHub.invoke("sendSDP", remoteGuid, sdp);
```

Since the Caller now has remote SDP offer and local SDP Answer,
Caller webrtc system will trigger generating ICE and 
our local system will send the ICE information to the Receiver through our signalr system.
```javascript
this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
	try {
		this.sendICE(event.candidate, this.caller.remoteGuid)
	}
	catch (e) {
		console.log("send ice error: ", e);
	}
};
```

__Receiver__
Receiver will receive Sdp Answer and set it
```javascript
await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
```
Now Receiver will have local Sdp offer and remote SDP answer. 
The webrtc system will automatically trigger creating ICE Candidates
and sending them to the Caller through our Signalr system.

NOTE: According to Mozilla. The web browser generates the ICE candidates
as soon as local media stream is added to peerConnection and SDP is generated.

Sending Sdp Offer
```javascript
this.peerConnection.addStream(localMediaStream);
let localSdpOffer: RTCSessionDescription = await this.peerConnection.createOffer();
await this.peerConnection.setLocalDescription(localSdpOffer);
await this.sendSDP(this.peerConnection.localDescription, this.caller.remoteGuid);
```

Receiving SdpOffer
```javascript
await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
if(sdp.type === 'offer'){
let localSdpAnswer: RTCSessionDescription = await this.peerConnection.createAnswer();
await this.peerConnection.setLocalDescription(localSdpAnswer);
await this.sendSDP(this.peerConnection.localDescription, this.caller.remoteGuid);
}
```

Receiving SdpAnswer
```javascript
await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
```

__Caller__ & __Receiver__
Receives ice and stores it

The Browser generates ICE as soon as the local system adds a Media Stream
and generates SDP offer or answer and this.peerConnection.setLocalDescription(sdp);

The Browser then fowards the ice to the local system through event listener.
When local ice is receive, it gets forwarded to the other user
```javascript
this.pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
	try {
		this.sendICE(event.candidate, this.caller.remoteGuid)
	}
	catch (e) {
		console.log("send ice error: ", e);
	}
};
```

Other user receives ICE from signalr (remote user) and adds it
to peerConnection. NOTE: ice is RTCIceCandidate object
```javascript
async receiveICE(ice: RTCIceCandidate): Promise<void> {
	try {
		await this.peerConnection.addIceCandidate(new RTCIceCandidate(ice));
		return;
	}
	catch (e) {
		throw (e);
	}
}
```

NOTE: The last ICE candidate generated by the browser and send will be null.

NOTE: According to Mozilla, the P2P connection starts as soon as the browser WebRtc System determines 
it is available. (check if this is true with other sources)


__Hang Up__

Release resources
```javascript
 if (localVideo.srcObject) {
    localVideo.srcObject.getTracks().forEach(track => track.stop());
    localVideo.srcObject = null;
}
```

To end the connection. 
```javascript
this.peerConnection.close();
```

__TODO__:
iceconnectionstatechange event
```javascript
this.peerConnection.oniceconnectionstatechange = (evt: Event) => {
	this.iceStateChangeHandler(this.peerConnection.iceConnectionState);
}

iceStateChangeHandler(status: RTCIceConnectionState) {
	// TODO: handle the different webrtc ice connection states
	if (status === "closed") {
		this.endCall();
	}
	else if (status === "failed") {
		this.endCall();
	}
	else if (status === "disconnected") {
		this.endCall();
	} else if (status === 'completed') {
		this.isConnectionCompleted = true;
	}
};
```

signalingstatechange event
```javascript
this.peerConnection.onsignalingstatechange = function(event) {
    switch(this.peerConnection.signalingState) {
      case "closed":
        closeVideoCall();
        break;
    }
  };
```

icegatheringstatechange events
```javascript
this.peerConnection.onicegatheringstatechange = (event) =>{
	let state = this.peerConnection.iceGatheringState;
}
```

__TODO__:
```javascript
this.pc.onnegotiationneeded = (event) => {
				
};
```

```javascript
this.pc.onaddstream = async (event: MediaStreamEvent) => {
	this.remoteStream = event.stream;
	// render the dom
	this.isActive = true;
	//console.log("received remote stream: ", this.remoteStream);
	let videoElement: HTMLVideoElement = this.remoteVideoElement.nativeElement;
	// attach the remote video to the components video element
	try {
		await this.service.attachMediaStream(videoElement, this.remoteStream);

		videoElement.muted = false;
		videoElement.play();
	}
	catch (e) {
		console.log(" this.pc.onaddstream error: ", e);
	}
};
```

```javascript
this.pc.addStream(localStream);
```

RTCPeerConnection.onremovestream

NOTE: RTCPeerConnection.onnegotiationneeded - his function is called whenever 
the WebRTC infrastructure needs you to start the session negotiation process anew. 
Its job is to create and send an offer, to the callee, asking it to connect with us.

NOTE: SignalR System also contains SendPing and SendPingResponse. 
The Client will receivePing and receivePingResponse

