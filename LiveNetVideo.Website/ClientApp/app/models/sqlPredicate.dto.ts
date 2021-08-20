import { AndOrEnum } from ".";
import { ComparisonTypeEnum } from "./comparisonType.enum";

export class SqlPredicateDto {
	constructor() {
		this.column = "";
		this.value = "";
		this.andOr = AndOrEnum.and;
		this.comparison = ComparisonTypeEnum.equal;
	}

	column: string;
	value: string;
	andOr: AndOrEnum;
	comparison: ComparisonTypeEnum;
}