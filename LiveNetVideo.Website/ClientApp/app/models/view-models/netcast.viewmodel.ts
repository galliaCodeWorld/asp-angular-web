import { NetcastGenreViewModel } from "./netcastGenre.viewmodel";

export class NetcastViewModel {
	constructor() {
		this.netcastId = 0;
		this.title = "";
		this.description = "";
		this.shortDescription = "";
		this.isPrerecorded = false;
		this.localFileLocation = "";
		this.isPrivate = false;
		this.tags = null;
		this.imageSrc = "";
		this.startDateTime = "";
		this.endDateTime = "";
		this.netcasteeLink = "";
		this.genre = null;
	}

	// NOTE: this is a view model
	// to display information to the user
	// a dto gets transformed into a viewmodel to make it easier to display

	netcastId: number;
	title: string;
	description: string;
	shortDescription: string;
	isPrerecorded: boolean;
	localFileLocation: string;
	tags: string[];
	isPrivate: boolean;
	imageSrc: string;
	startDateTime: string;
	endDateTime: string;
	netcasteeLink: string;
	genre: NetcastGenreViewModel;
}