export class PagingDto {
	constructor() {
		this.skip = 0;
		this.take = 1000;
	}
	skip: number; // integer value starting with 0, number of records to skip
	take: number; // integer number of records to take
}