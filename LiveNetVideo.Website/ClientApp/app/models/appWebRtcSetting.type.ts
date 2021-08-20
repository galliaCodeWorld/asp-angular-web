import { AppIceServerType } from './index';
export class AppWebRtcSettingType {
	constructor() {
		this.appWebRtcSettingId = 0;
		this.created = null;
		this.appGroupName = "";
		this.signalingServerHost = "";
		this.signalingServerPort = "";
		this.domain = "";
		this.appIceServerDtos = null;
	}
	appWebRtcSettingId: number;
	created: Date;
	appGroupName: string;
	signalingServerHost: string;
	signalingServerPort: string;
	domain: string;
	appIceServerDtos: Array<AppIceServerType>;
}