import { PagingDto, OrderByDto } from './index';
export class StringIdDto {
	constructor() {
		this.id = "";
		this.paging = null;
		this.orderBy = null;
	}
	id: string; //max 300
	paging: PagingDto; // nullable
	orderBy: OrderByDto[]; // nullable
}