export class MemberType {
	constructor() {
		this.memberId = 0;
		this.created = null;
		this.updated = null;
		this.username = "";
		this.isSuspended = false;
		this.isVerified = true;
		this.email = "";
		this.firstName = "";
		this.lastName = "";
		this.notes = "";
		this.avatarDataUri = "";
		this.avatarFileName = "";
	}
	memberId: number;
	created: Date;
	updated: Date;
	username: string;
	isSuspended: boolean;
	isVerified: boolean;
	email: string;
	firstName: string;
	lastName: string;
	notes: string;
	avatarDataUri: string;
	avatarFileName: string;
}