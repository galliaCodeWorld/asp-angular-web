import {
	ProfileDto
} from './index';

export class CallerType {
	constructor() {
		this.remoteGuid = "";
		this.profile = null;
	}
	remoteGuid: string;
	profile: ProfileDto;
}