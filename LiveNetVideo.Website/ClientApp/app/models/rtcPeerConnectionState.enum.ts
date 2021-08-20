export enum RtcPeerConnectionStateEnum {
	name = "RtcPeerConnectionStateEnum",

	// At least one of the connection's ICE transports (RTCIceTransports or RTCDtlsTransports) are in the "new" state, and none of them are in one of the following states: "connecting", "checking", "failed", or "disconnected", or all of the connection's transports are in the "closed" state.
	new = "new",

	// One or more of the ICE transports are currently in the process of establishing a connection; that is, their RTCIceConnectionState is either "checking" or "connected", and no transports are in the "failed" state.
	connection = "connecting",

	// Every ICE transport used by the connection is either in use (state "connected" or "completed") or is closed (state "closed"); in addition, at least one transport is either "connected" or "completed".
	connected = "connected",

	// At least one of the ICE transports for the connection is in the "disconnected" state and none of the other transports are in the state "failed", "connecting", or "checking"
	disconnected = "disconnected",

	// One or more of the ICE transports on the connection is in the "failed" state.
	failed = "failed",

	// The RTCPeerConnection is closed.
	// This value was in the RTCSignalingState enum (and therefore found by reading the value of the signalingState) property until the May 13, 2016 draft of the specification.
	closed = "closed",
}