import { PagingDto, OrderByDto } from './index';
export class LongIdDto {
	constructor() {
		this.id = 0;
		this.paging = null;
		this.orderBy = null;
	}

	id: number; // big integer
	paging?: PagingDto; // nullable
	orderBy?: OrderByDto[]; // nullable
}