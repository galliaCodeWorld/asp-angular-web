import { HttpStatusCodeEnum } from "./httpStatusCode.enum";
export class SignalrHttpResponseType {
	constructor() {
		this.statusCode = null;
		this.actionCode = "";
		this.content = "";
	}
	statusCode: HttpStatusCodeEnum;
	actionCode: string;
	content: string;
}