import {
	PhoneLineConnectionType,
	NotReadyForCallType
} from "./index";

export class CurrentCallAttemptType {
	constructor() {
		this.phoneLineConnetions = new Array<PhoneLineConnectionType>();
		this.notReadyForCalls = new Array<NotReadyForCallType>();
		this.maxWaitTime = 20000; // in micro seconds
		this.responses = 0;
	}

	responses: number;
	maxWaitTime: number;
	phoneLineConnetions: Array<PhoneLineConnectionType>;
	notReadyForCalls: Array<NotReadyForCallType>;
}
