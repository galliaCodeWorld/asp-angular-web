import { MemberType } from "./member.type";

export class CompanyEmployeeDto {
	constructor() {
		this.companyEmployeeId = 0;
		this.companyEmployeeId = 0;
		this.createdDate = null;
		this.memberId = 0;
		this.title = "";
		this.isSuspended = false;
		this.avatarFilename = "";
		//this.firstName = "";
		//this.lastName = "";
		this.member = null;
	}

	companyEmployeeId: number;
	companyProfileId: number; // required
	createdDate: Date;
	memberId: number; // required
	title: string; // required, max 300
	isSuspended: boolean;
	avatarFilename: string; //field name: uploadImage
	//firstName: string;
	//lastName: string;
	member: MemberType;
}