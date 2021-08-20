//import { WebApiResponseStatusType } from './index';
export class WebApiResponseType {
	constructor() {
		this.status = "";
		this.data = "";
		this.typeName = "";
	}
	status: string;
	data: string;
	typeName: string;

	//get apiStatus(): WebApiResponseStatusEnum {
	//	return this.status === "SUCCESS" ? WebApiResponseStatusEnum.success : WebApiResponseStatusEnum.fail;
	//}

	//get status(): WebApiResponseStatusEnum {
	//	return this.Status === "SUCCESS" ? WebApiResponseStatusEnum.success : WebApiResponseStatusEnum.fail;
	//}

	//get data(): string {
	//	return this.Data;
	//}

	//get typeName(): string {
	//	return this.TypeName;
	//}
}