export class OrderByDto {
	public constructor() {
		this.direction = "ASC";
		this.column = "";
	}
	column: string; // the dto column to order by
	direction: string; // ASC | DESC
}