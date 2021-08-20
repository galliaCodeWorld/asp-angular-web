export class CompanyPhotoDto {
	constructor() {
		this.companyPhotoId = 0;
		this.companyProfileId = 0;
		this.createdDate = null;
		this.filename = "";
		this.caption = "";
	}

	companyPhotoId: number;
	companyProfileId: number; // required
	createdDate: Date;
	filename: string; // field name: uploadImage
	caption: string;
}