export class MemberLoginType {
	constructor() {
		this.email = "";
		this.password = "";
		this.remember = true;
	}
	email: string;
	password: string;
	remember: boolean;
}