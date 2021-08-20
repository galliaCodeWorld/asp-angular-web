import { PagingDto, OrderByDto, SqlPredicateDto } from './index';

export class SqlSearchPredicateDto {
	constructor() {
		this.sqlPredicates = null;
		this.paging = null;
		this.orderBy = null;
	}

	sqlPredicates: SqlPredicateDto[];
	paging?: PagingDto; // nullable
	orderBy?: OrderByDto[]; // nullable
}