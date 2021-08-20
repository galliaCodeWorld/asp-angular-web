export enum IceGatheringStateEnum {
	name = "IceGatheringStateEnum",

	//The peer connection was just created and hasn't done any networking yet.
	new = "new",

	//The ICE agent is in the process of gathering candidates for the connection.
	gathering = "gathering",

	//The ICE agent has finished gathering candidates. If something happens that requires collecting new candidates, such as a new interface being added or the addition of a new ICE server, the state will revert to "gathering" to gather those candidates.
	complete = "complete",
}