export class JwtToken {
	constructor() {
		this.access_token = "";
		this.token_type = "";
		this.expires_in = 0;
		this.refresh_token = "";
		this.audience = "";
		this[".issued"] = "";
		this[".expires"] = "";
	}
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	audience: string;
	".issued": string;
	".expires": string;
}