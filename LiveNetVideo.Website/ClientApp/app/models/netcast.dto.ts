import { NetcastGenreDto } from "./netcastGenre.dto";
import { MemberType } from ".";

export class NetcastDto {
	constructor() {
		this.netcastId = 0;
		this.memberId = 0;
		this.createdDate = null;
		this.title = "";
		this.description = "";
		this.isPrerecorded = false;
		this.localFileLocation = "";
		this.netcastGenreId = 0;
		this.isPrivate = false;
		this.tags = "";
		this.imageFilename = "";
		this.startDateTime = null;
		this.endDateTime = null;
		this.hPassword = "";
		this.member = null;
		this.connectionGuid = "";
		this.netcastGenre = null;
	}

	netcastId: number;
	memberId: number;
	createdDate: Date;
	title: string;
	description: string;
	isPrerecorded: boolean;
	localFileLocation: string;
	netcastGenreId: number;
	tags: string;
	isPrivate: boolean;
	imageFilename: string;
	startDateTime: Date;
	endDateTime: Date;
	hPassword: string;
	member: MemberType;
	connectionGuid: string;
	netcastGenre: NetcastGenreDto;
}