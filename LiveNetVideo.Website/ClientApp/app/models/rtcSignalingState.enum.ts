export enum RtcSignalingStateEnum {
	name = "RtcSignalingStateEnum",

	//There is no ongoing exchange of offer and answer underway. This may mean that the RTCPeerConnection object is new, in which case both the localDescription and remoteDescription are null; it may also mean that negotiation is complete and a connection has been established.
	stable = "stable",

	// The local peer has called RTCPeerConnection.setLocalDescription(), passing in SDP representing an offer (usually created by calling RTCPeerConnection.createOffer()), and the offer has been applied successfully.
	haveLocalOffer = "have-local-offer",

	// The remote peer has created an offer and used the signaling server to deliver it to the local peer, which has set the offer as the remote description by calling RTCPeerConnection.setRemoteDescription().
	haveRemoteOffer = "have-remote-offer",

	// The offer sent by the remote peer has been applied and an answer has been created (usually by calling RTCPeerConnection.createAnswer()) and applied by calling RTCPeerConnection.setLocalDescription(). This provisional answer describes the supported media formats and so forth, but may not have a complete set of ICE candidates included. Further candidates will be delivered separately later.
	haveLocalPrAnswer = "have-local-pranswer",

	// A provisional answer has been received and successfully applied in response to an offer previously sent and established by calling setLocalDescription().
	haveRemotePrAsnwer = "have-remote-pranswer",
}