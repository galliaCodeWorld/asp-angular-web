# Netcast

NOTES: All netcastee will send a requestNetcast to the netcaster. The netcaster will
send a netcast to the netcastee if the netcaster has less than three outgoing netcasts.
If all the outgoing netcasts are used, then the netcaster will grab all the current outgoing
netcastees and loop through and use the first good netcastee to request a netcaststub. 
This is a fire and forget operation. The requestNetcastStub is passed down the branch until a netcastee
does not have equal to or greater than 2 outgoing relays. If the netcastee has 2 or more outgoing relays,
then they will foward the requestNetcastStub to one of their relays down the chain, and this repeats down 
the chain until a relay is found that has a free outgoing relay node. The end netcastee is called a stub.
The stub will then sendNetcastStub to the original netcastee that requested the netcast. That netcastee
will then initiate a request netcast directly to the stub to receive a relay of the video signal.




## Netcaster

runs member.canActivate.service.ts route guard

netcastId is passed into the route param

### startApp()
`this.mediaDevices<MediaDeviceInfo>` stores all media devices including audio and video

`this.availableVideoDevices<MediaDeviceInfo>` stores all video cameras

this.canSwitchVideo is true if there is more than one this.availableVideoDevices

`this.mediaStreams<MediaStream>` stores all MediaStreams from getusermedia of 
each this.availableVideoDevices[]. **This means the browser running this code has to 
support being able to use more than one camera at a time**.

`this.service.initPhoneService("Netcast")` will run service.isHubConnectionReady(). 
If not ready it will run `service.webrtcHubCheckIn("stringName")`, and receive the 
localGuid, then run service.setLocalGuid(localGuid) and simply return

this.localGuid is just a copy of this.service.localGuid (which is just a copy of signalrService.localGuid).

If there is more than one stream, netcaster attaches the first stream to this.mainVideoElement
and and this.firstVideoThumb.

If there is a second stream, netcaster attaches the second stream to this.secondVideoThumb

this.netcastStreamId = this.mediaStreams[0].id

After video is initialized, then `this.startSubscription()` is run.

### startSubscriptions()
this.receiveDisconnect
this.someoneDisconnected
this.receiveSDP
this.receiveICE
this.receiveRequestNetcast
this.receiveRequestNetcastStub

### Netcaster Receives request for netcast

this.receiveRequestNetcast will receive json message containing the requesters
guid (aka remoteGuid). `json: any = JSON.parse(message.message);` and `json.remoteGuid`
is the other users guid.

#### Netcaster has Available relays (aka child nodes)
If there are available relays (aka open child nodes) `this.netcastConnetions.length < this.maxRelays` then
the netcaster will retreive the active mediaStream from this.mediaStreams using this.netcastStreamId
(this is done incase we have multiple cameras and currently the app grabs all available cameras. 
Maybe check if this is supported before grabbing multiple camera streams. or only grab streams when needed.)

With the mediaStream, the netcaster will call `this.sendNetcastOffer(remoteGuid, medisStream)`

#### Netcaster does not have anymore available relays

If the netcaster does not have anymore available open child nodes or relays, it will
call this.requestNetcastStub(r: RequestNetcastStubType);

#### this.sendNetcastOffer(remoteGuid, mediaStream)
look in this.netcastConnections[] and retrieve the first NetcastType
that matches the remoteGuid param. This should be an outgoing NetcastType.
```javascript
let outgoing: NetcastType;
outgoing = this.getPc(remoteGuid, this.netcastConnections);
```

If NetcastType is found, netcaster will switch (aka replace the mediastream track)
for the NetcastType found. `this.switchMediaStream(outgoing, mediaStream)`

If NetcastType is NOT found, then we create an outgoing NetcastType by calling
`let outgoing: NetcastType = this.initNetcast(remoteGuid, NetcastKind.outgoing)`

this.initNetcast will create NetcastType which will contain RTCPeerConnection.
initNetcast will call this.service.createRtcPeerConnection() to create RTCPeerConnection.
If dataChannel is supported, then RTCDataChannel is created.
this.initNetcast will start the rtcPeerConnection listeners by calling `this.startPeerConnectionListeners(n: NetcastType)`

outgoing.mediaStream = mediaStream (aka this mediaStream passed into sendNetcastOffer)
create localSDPOffer => then set it locally in RTCPeerConnection => send the localSDPOffer
to the remote user. The remote user will accept and the sdp ice exchange occurs and video shows.


```javascript
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

```

#### this.requestNetcastStub(r: RequestNetcastStubType)
The netcaster will traverse down the available node to get a stub. When a stub is reached, it will send
the its remoteGuid to the requester directly. Then requester will then
send a requestNetcast directly to the stub remoteGuid.

First the netcaster send either a signalr message or a datachannel message (if datachannel is available).
Datachannel requires DcJsonType message, and signalr requires remoteGuid and RequestNetcastStubType

```javascript
// datachannel
let dc: RTCDataChannel = netcastBranch.getDataChannel(DataChannelKind.dcJsonType);
let message = new DcJsonType();
message.remoteGuid = this.localGuid;
message.json = this.service.stringify(r);
message.objectType = RequestNetcastStubType.objectName;
dc.send(this.service.stringify(message));
```

```javascript
// signalr
await this.service.sendRequestNetcastStub(netcastBranch.remoteGuid, r);

```

NOTE: maxTrys is static. is set to 3 aka the this.maxRelays

currentTry param is incremented: currentTry++

if currentTry is <= maxTrys
get the next index for this.netcastConnections using this.getRelayIndex();

this.getNextRelayIndex() will increments ++this.currentRealayIndex and returns it.
If this.currentRelayIndex is >= this.maxRelays, it resets this.currentRelayIndex = 0

Get the current list of outing relays using this.getOutgoingRelays();

Using the relayIndex, we retrieve the relay NetcastType from outgoing relays. This will be the node branch
we will traverse down to find the node stub.

If we are unable to retrieve NetcastType from outgoing relays using relayIndex, then
the method calls itself and this.requestNetcastStub(r, currentTry) to get the next outgoing NetcastType in 
this.netcastConnections

If NetcastType is retrieved from outgoing relays, netcaster will either send datachannel message
or signalr message to the child node requesting stub.

With available datachannel
dc.send(this.service.stringify(DcJsonType));

With signalr fallback
`await this.webRtcHub.invoke("sendRequestNetcastStub", remoteGuid, this.jsHelperService.stringify(re));`

Now the request is sent down the node branch until a stub is reached. The stub then sends its remoteGuid to the
netcaster, who then fowards it to the requester. 
The requester then sends requestNetcast to the stub to get relay signal aka video.

### On the Netcastee
receiveRequestNetcast
receiveNetcastStub
receiveRequestNetcastStub

NOTE: when the child node requested the netcast from the netcaster, they created NetcastType
and called this.startPeerConnectionListeners() which when datachannel is ready calls 
this.startDataChannelListeners(dc);

from Signalr receiveRequestNetcastStub
receiveRequestNetcastStub will call async method, this.handleRequestNetcastStub(re: RequestNetcastStubType);

from dataChannel dc.onmessage => await this.handleDcMessage(event)
```javascript
case RequestNetcastStubType.objectName:
let r: RequestNetcastStubType = this.service.tryParseJson(dcJsonType.json) as RequestNetcastStubType;
this.handleRequestNetcastStub(r);
break;
```

this.handleRequestNetcastStub(r: RequestNetcastStubType)
```javascript
async handleRequestNetcastStub(r: RequestNetcastStubType): Promise<void> {
	// check if this node has any children node slots available
	// NOTE: a node will have upto two children nodes
	if (this.netcastConnections.length < this.maxRelays) {
		// this is node is a stub, using signalr to send this users remoteGuid
		// to the requester. The requester will then connect to this stub
		await this.service.sendNetcastStub(r.requesterGuid);
		return;
	}
	else {
		// this node is full, send the message down the line
		this.requestNetcastStub(r, 0);
		return;
	}
}

```
Netcastee will check their available outgoing relays, if they have a free node, then the netcastee
will send a signalr message to the original netcast requester RequestNetcastStubType. 
```javascript
// NOTE: the remoteGuid is the original netcastee (requesters) guid, NOT the guid of the current netcastee

// The netcastee remoteGuid is determined by the Signalr Hub and sent in the message to the netcaster
async sendNetcastStub(remoteGuid: string): Promise<void> {
	try {
		await this.webRtcHub.invoke("sendNetcastStub", remoteGuid);
		return;
	}
	catch (e) {
		throw (e);
	}
}
```
When the original requester receives the stub, they will requestNetcast from this stub.

If the netcastee does not have a free available relay they will send requestNetcastStub to one of their child nodes
to and so forth down the child node chain until a stub is found.

## Netcastee

gets netcastId from route Param or from form field

uses the netcastId to retrieve the netcast record from db

creates a NetcastType with incoming property (netcastType.netcastKind = incoming) by
calling this.initNetcast(remoteGuid, NetcastKind.incoming)

then sends requestNetcast to the netcaster

await this.service.requestNetcast(remoteGuid, this.service.stringify({ remoteGuid: this.localGuid }));

```javascript
//netcastee.page.ts getNetcast(remoteGuid: string)
let incoming: NetcastType = this.initNetcast(remoteGuid, NetcastKind.incoming);
await this.service.getAccessToken();
await this.service.requestNetcast(incoming.remoteGuid, this.service.stringify({ remoteGuid: this.localGuid }));

```

```javascript 
// initNetcast(remoteGuid: string, NetcastKind.incoming)

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
			netcast.dataChannels.push(dc);
		}

		netcast.peerConnection = pc;
		//netcast.peerConnection.addIceCandidate(null);
		this.startPeerConnectionListeners(netcast);
		netcast.netcastKind = netcastKind;
		this.netcastConnections.push(netcast);
	}

	return netcast;
```

NOTE: this.startPeerConnectionListeners() will call this.startDataChannelListeners(dc)
```javascript
netcast.peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
	let dc = event.channel;
	this.startDataChannelListeners(dc);
}
```


