export enum RtcIceTransportPolicyEnum {
	name = "RtcIceTransportPolicyEnum",

	// All ICE candidates will be considered.
	all = "all",

	// Only ICE candidates with public IP addresses will be considered. Removed from the specification's May 13, 2016 working draft.
	public = "public",

	// Only ICE candidates whose IP addresses are being relayed, such as those being passed through a TURN server, will be considered.
	relay = "relay",
}