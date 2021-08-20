export class CompanyLocationDto {
	constructor() {
		this.companyLocationId = 0;
		this.companyProfileId = 0;
		this.createdDate = null;
		this.address = "";
		this.city = "";
		this.region = "";
		this.countryIsoCode = "";
		this.locationPhotoFilename = "";
	}
	companyLocationId?: number;
	companyProfileId?: number; //required
	createdDate?: Date;
	address?: string; //max 300 required
	city?: string; //max 300 required
	region?: string; //max 300 required
	countryIsoCode?: string; //max 2 required
	locationPhotoFilename?: string; // field name: uploadImage
}