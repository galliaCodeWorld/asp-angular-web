export class RegisterDto {
	constructor() {
		this.firstName = "";
		this.lastName = "";
		this.altEmail = "";
		this.email = "";
		this.username = "";
		this.password = "";
		this.avatarDataUri = "";
		this.isVerified = true;
		this.isSuspended = false;
	}
	firstName: string;
	lastName: string;
	altEmail: string;
	email: string;
	username: string;
	password: string;
	avatarDataUri: string;
	isVerified?: boolean;
	isSuspended?: boolean;
}