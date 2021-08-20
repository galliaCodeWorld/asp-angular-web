import { CompanyProfileDto } from "./index";

export class PbxLineDto {
	constructor() {
		this.pbxLineId = 0;
		this.companyProfileId = 0;
		this.createdDate = null;
		this.lineName = "";
		this.description = "";
		this.iconFilename = "";
		this.isDisabled = false;
		this.companyProfile = null;
	}

	pbxLineId?: number;
	companyProfileId?: number; // required
	createdDate?: Date;
	lineName?: string; // required, max 300
	description?: string; // max 8000 requireds
	iconFilename?: string; // field name: uploadImage
	isDisabled?: boolean;
	companyProfile: CompanyProfileDto;
}