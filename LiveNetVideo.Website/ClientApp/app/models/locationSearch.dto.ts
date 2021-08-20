import { PagingDto, OrderByDto } from './index';

export class LocationSearchDto {
	constructor() {
		this.address = "";
		this.city = "";
		this.region = "";
		this.countryIsoCode = "";
		this.paging = null;
		this.orderBy = null;
	}
	address?: string; //max 300
	city?: string; // max 300
	region?: string; // max 300
	countryIsoCode?: string; // max 2
	paging?: PagingDto; // nullable
	orderBy?: OrderByDto[]; // nullable
}