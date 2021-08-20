export enum NetcastKind {
	name = "NetcastKind",
	// RTCPeerConnection sending media to this user
	incoming = "incoming",

	// RTCPeerConnection receiving media from this user
	outgoing = "outgoing",
}