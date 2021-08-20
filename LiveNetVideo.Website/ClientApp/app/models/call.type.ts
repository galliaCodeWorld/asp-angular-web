import {
	PhoneLineType, ProfileDto, CallerType
} from './index';

export class CallType {
	constructor() {
		this.remoteGuid = "";
		this.profile = null;
		this.phoneLineGuid = "";
		this.callers = null;
	}
	remoteGuid: string;
	profile: ProfileDto;
	phoneLineGuid: string;
	callers: CallerType[];
}