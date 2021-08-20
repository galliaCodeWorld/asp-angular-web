export class CompanyVideoDto {
	constructor() {
		this.companyVideoId = 0;
		this.companyProfileId = 0;
		this.createdDate = null;
		this.filename = "";
		this.caption = "";
	}
	companyVideoId: number;
	companyProfileId: number; // required
	createdDate: Date;
	filename: string; // field name: uploadImage
	caption: string;
}