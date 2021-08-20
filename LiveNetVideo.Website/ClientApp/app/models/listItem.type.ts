export class ListItemType {
	constructor() {
		this.id = "";
		this.imgSrc = "";
		this.title = "";
		this.subTitle = "";
		this.content = "";
		this.links = null;
	}

	id: string;
	imgSrc: string;
	title: string;
	subTitle: string;
	content: string;
	links: Array<string>;
}