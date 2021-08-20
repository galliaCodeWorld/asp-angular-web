export class SdpMessageType {
	constructor() {
		this.sender = "";
		this.sdp = "";
	}
	get name(): string {
		return "SdpMessageType";
	}
	sender: string; // remoteGuid (other users connectionId)
	sdp: string;
}