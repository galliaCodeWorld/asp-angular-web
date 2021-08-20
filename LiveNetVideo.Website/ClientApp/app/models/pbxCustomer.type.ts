import { GenericUserType } from "./index";

export class PbxCustomerType extends GenericUserType {
	constructor() {
		super();
		this.subject = "";
		this.message = "";
	}

	subject: string;
	message: string;
}