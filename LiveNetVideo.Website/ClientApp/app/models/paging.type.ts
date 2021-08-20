export class PagingType {
	constructor() {
		this.skip = 0;
		this.take = 1000;
		this.orderField = "";
		this.orderDirection = "";
	}
	skip: number;
	take: number;
	orderField: string;
	orderDirection: string;
}