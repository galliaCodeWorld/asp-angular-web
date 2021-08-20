import { FormErrorTypeEnum } from "./formErrorType.enum";

export class FormsErrorMessageType {
	constructor() {
		this.errorTypeName = null;
		this.displayValue = "";
	}
	errorTypeName: FormErrorTypeEnum;
	displayValue: string;
}