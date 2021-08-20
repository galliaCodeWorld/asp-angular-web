export class CompanyEmployeeInviteDto {
	constructor() {
		this.companyEmployeeInviteId = 0;
		this.createdDate = null;
		this.companyProfileId = 0;
		this.email = "";
		this.firstName = "";
		this.lastName = "";
		this.isAccepted = false;
		this.dateAccepted = null;
	}

	companyEmployeeInviteId?: number;
	createdDate?: Date;
	companyProfileId?: number; //required
	email?: string; //required, max 300
	firstName?: string; //required, max 50
	lastName?: string; //required, max 50
	isAccepted?: boolean;
	dateAccepted?: Date;
}