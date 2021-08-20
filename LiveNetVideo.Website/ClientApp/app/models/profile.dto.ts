export class ProfileDto {
	constructor() {
		this.memberId = 0;
		this.username = "";
		this.name = "";
		this.email = "";
		this.avatarDataUri = "";
		this.avatarFileName = "";
	}
	memberId: number;
	username: string;
	name: string;
	email: string;
	avatarDataUri?: string;
	avatarFileName: string;
}