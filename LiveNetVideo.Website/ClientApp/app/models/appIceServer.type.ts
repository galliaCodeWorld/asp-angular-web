export class AppIceServerType {
	constructor() {
		this.appIceServerId = 0;
		this.appWebRtcSettingId = 0;
		this.created = null;
		this.password = "";
		this.url = "";
		this.username = "";
	}
	appIceServerId: number;
	appWebRtcSettingId: number;
	created: Date;
	password: string;
	url: string;
	username: string;
}