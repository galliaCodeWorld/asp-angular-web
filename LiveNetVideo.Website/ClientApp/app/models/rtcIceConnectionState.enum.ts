export enum RtcIceConnectionStateEnum {
	name = "RtcIceConnectionStateEnum",

	// The ICE agent is gathering addresses or is waiting to be given remote candidates
	// through calls to RTCPeerConnection.addIceCandidate()(or both).
	new = "new",

	// The ICE agent has been given one or more remote candidates
	// and is checking pairs of local and remote candidates against
	// one another to try to find a compatible match, but has not yet
	// found a pair which will allow the peer connection to be made.
	// It's possible that gathering of candidates is also still underway.
	checking = "checking",

	//A usable pairing of local and remote candidates has been found for all components of the connection, and the connection has been established. It's possible that gathering is still underway, and it's also possible that the ICE agent is still checking candidates against one another looking for a better connection to use.
	connected = "connected",

	//The ICE agent has finished gathering candidates, has checked all pairs against one another, and has found a connection for all components.
	completed = "completed",

	// The ICE candidate has checked all candidates pairs against one another and has failed to find compatible matches for all components of the connection. It is, however, possible that the ICE agent did find compatible connections for some components.
	failed = "failed",

	// Checks to ensure that components are still connected failed for at least one component of the RTCPeerConnection. This is a less stringent test than "failed" and may trigger intermittently and resolve just as spontaneously on less reliable networks, or during temporary disconnections. When the problem resolves, the connection may return to the "connected" state.
	disconnected = "disconnected",

	// The ICE agent for this RTCPeerConnection has shut down and is no longer handling requests.
	closed = "closed",
}