//import { ReflectiveInjector } from '@angular/core';
//import { ConfigService } from "../services/index";
import {
	CallType,
	IncomingCallResponseEnum
} from './index';

export class IncomingCallDialogType {
	constructor() {
		//let injector = ReflectiveInjector.resolveAndCreate([ConfigService]);
		//let config: ConfigService = injector.get(ConfigService);
		//this.avatarBaseUrl = config.avatarBaseUrl;
		this.call = null;
		this.response = IncomingCallResponseEnum.deny;
	}
	avatarBaseUrl: string;
	call: CallType;
	response: IncomingCallResponseEnum
}